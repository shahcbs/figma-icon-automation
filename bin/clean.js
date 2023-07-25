const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const svgson = require('svgson');
const svgpath = require('svgpath');
const { optimize } = require('svgo');

const dirPath = './svgsFiles';

const outputPaths = {
  web: './dist/web',
  ios: './dist/ios',
  android: './dist/android',
};

// Ensure output directories exist
for (let outputPath of Object.values(outputPaths)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error('Could not list the directory.', err);
    process.exit(1);
  }

  files.forEach((file, index) => {
    if (path.extname(file) === '.svg') {
      const filePath = path.join(dirPath, file);

      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Could not read the file.', err);
          process.exit(1);
        }

        svgson.parse(data)
          .then(json => {
            let newPathData = '';
            let fillRule = '', clipRule = '';
            
            // Recursively find path data
            function traverse(node) {
              if (node.name === 'path' && node.attributes.d) {
                newPathData += ' ' + node.attributes.d;
                fillRule = node.attributes['fill-rule'] || '';
                clipRule = node.attributes['clip-rule'] || '';
              }

              (node.children || []).forEach(traverse);
            }

            traverse(json);
            
            // Normalize and merge the path data
            newPathData = svgpath(newPathData).toString();
            
            // Create new SVG with merged path, copying viewBox, width, and height attributes
            const svgAttributes = json.attributes;
            const $ = cheerio.load(
              `<svg viewBox="${svgAttributes.viewBox}" width="${svgAttributes.width}" height="${svgAttributes.height}"><path d="${newPathData}" fill-rule="${fillRule}" clip-rule="${clipRule}"></path></svg>`,
              { xmlMode: true }
            );

            $('*').removeAttr('fill');

            let updatedSvgContent = $.xml();

            // Optimize SVG
            const result = optimize(updatedSvgContent, {
              // optional but recommended field
              path: filePath,
              // all plugins are enabled by default
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false
                },
                {
                  name: 'removeDimensions',
                  active: true
                }
              ]
            });
            updatedSvgContent = result.data;

            // Write the updated SVG content back to files for web, iOS, and Android
            for (let outputPath of Object.values(outputPaths)) {
              fs.writeFile(path.join(outputPath, file), updatedSvgContent, 'utf8', (err) => {
                if (err) {
                  console.error(`Could not write the file to ${outputPath}.`, err);
                  process.exit(1);
                }

                console.log(`Successfully merged paths, removed fill attribute, and optimized SVG for ${file} in ${outputPath}`);
              });
            }
          })
          .catch(err => {
            console.error('Error parsing SVG.', err);
            process.exit(1);
          });
      });
    }
  });
});

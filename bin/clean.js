const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

const inputPath = './svgsFiles';
const outputPaths = {
  web: './dist/web',
  ios: './dist/ios',
  android: './dist/android',
};

// Clear and recreate output directories
for (let key in outputPaths) {
  fs.rmdirSync(outputPaths[key], { recursive: true });
  fs.mkdirSync(outputPaths[key], { recursive: true });
}

fs.readdir(inputPath, (err, files) => {
  if (err) {
    console.error('Could not list the directory.', err);
    process.exit(1);
  }

  files.forEach((file, index) => {
    if (path.extname(file) === '.svg') {
      const filePath = path.join(inputPath, file);

      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Could not read the file.', err);
          process.exit(1);
        }

        // Optimize SVG with SVGO
        const result = optimize(data, {
          path: filePath,
          plugins: [
            
            'removeComments',
            'removeEmptyAttrs',
            'removeEmptyContainers',
            'removeUnusedNS',
            'removeUselessStrokeAndFill',
            'removeMetadata',
            'removeEditorsNSData',
            'removeEmptyText',
            'removeHiddenElems',
            {
              name: 'removeAttrs',
              params: {
                attrs: '(fill|stroke)',
              },
            },
            'mergePaths',
            {
              name: 'removeViewBox',
              active: false
            },
            {
              name: 'removeDimensions',
              active: true
            },
          ],
        });

        let updatedSvgContent = result.data;

        // Write the updated SVG content back to files for web, iOS, and Android
        for (let key in outputPaths) {
          let outputPath = outputPaths[key];
          fs.writeFile(path.join(outputPath, file), updatedSvgContent, 'utf8', (err) => {
            if (err) {
              console.error(`Could not write the file to ${outputPath}.`, err);
              process.exit(1);
            }

            console.log(`Successfully optimized SVG for ${file} in ${outputPath}`);
          });
        }
      });
    }
  });
});

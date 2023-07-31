require('dotenv').config();

const figmaApiExporter = require('figma-api-exporter').default;
const exporter = figmaApiExporter(process.env.FIGMA_API_TOKEN);
const fs = require('fs');
const path = require('path');
const svgson = require('svgson');
const svgpath = require('svgpath');

exporter
  .getSvgs({
    fileId: process.env.FIGMA_FILE_ID,
    canvas: 'Icons',
    frame: 'icon-export'
  })
  .then(svgsData =>
    exporter.downloadSvgs({
      saveDirectory: './svgsFiles',
      svgsData: svgsData.svgs,
      lastModified: svgsData.lastModified,
      clearDirectory: true,
    })
  )
  .then(() => {
    const inputPath = './svgsFiles';

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

            svgson.parse(data)
              .then(json => {
                let newPathData = '';
                
                // Recursively find path data
                function traverse(node) {
                  if (node.name === 'path' && node.attributes.d) {
                    newPathData += ' ' + node.attributes.d;
                  }

                  (node.children || []).forEach(traverse);
                }

                traverse(json);
                
                // Normalize and merge the path data
                newPathData = svgpath(newPathData).toString();
                
                // Create new SVG with merged path, copying viewBox, width, and height attributes
                const svgAttributes = json.attributes;
                const updatedSvgContent = `<svg viewBox="${svgAttributes.viewBox}" width="${svgAttributes.width}" height="${svgAttributes.height}"><path d="${newPathData}"></path></svg>`;

                fs.writeFile(filePath, updatedSvgContent, 'utf8', (err) => {
                  if (err) {
                    console.error('Could not write the file.', err);
                    process.exit(1);
                  }

                  console.log(`Successfully merged paths and removed fill attribute from ${file}`);
                });
              })
              .catch(err => {
                console.error('Error parsing SVG.', err);
                process.exit(1);
              });
          });
        }
      });
    });
  });

const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');
const { JSDOM } = require("jsdom");
const SVGtoPDF = require("svg-to-pdfkit");
const PDFDocument = require("pdfkit");

const inputPath = './svgsFiles';
const outputPaths = {
  web: './dist/web',
  ios: './dist/ios',
  android: './dist/android',
};

function formatFileName(file) {
  const baseName = path.basename(file, path.extname(file));

  // Convert to lower case and replace all spaces with hyphens
  let formattedName = baseName.toLowerCase().replace(/ /g, '-');

  // Add a hyphen between lowercase and uppercase letters
  formattedName = formattedName.replace(/([a-z])([A-Z])/g, '$1-$2');

  // Replace consecutive hyphens with a single one
  formattedName = formattedName.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  formattedName = formattedName.replace(/^[-_]+|[-_]+$/g, '');

  formattedName = `${formattedName}${path.extname(file)}`;

  return formattedName;
}



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
            'cleanupAttrs',
            'cleanupIds',
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
                attrs: '(fill|fill-rule|clip-rule)',
              },
            },   
            {
              name: 'convertPathData',
              params: {
                floatPrecision: 3,
                transformPrecision: 3,
              }
            },
          ],
        });

        let updatedSvgContent = result.data;

        // Write the updated SVG content back to files for web, iOS, and Android
        for (let key in outputPaths) {
          let outputPath = outputPaths[key];
          let formattedFile = formatFileName(file);
          let outputFile = path.join(outputPath, formattedFile);

          if (key === "android") {
            const { document } = new JSDOM(updatedSvgContent).window;
            const svgElem = document.querySelector("svg");
            const viewBox = svgElem.getAttribute("viewBox");
            const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox.split(" ");
            const path = document.querySelector("path").getAttribute("d");
            const vectorXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
              android:viewportWidth="${viewBoxWidth}"
              android:viewportHeight="${viewBoxHeight}">
              <path android:fillColor="#000000" android:pathData="${path}" />
            </vector>`;
            fs.writeFile(outputFile.replace(".svg", ".xml"), vectorXml, 'utf8', err => {
              if (err) {
                console.error(`Could not write the file to ${outputPath}.`, err);
                process.exit(1);
              }
            });
          } else if (key === "ios") {
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(outputFile.replace(".svg", ".pdf"));
            doc.pipe(stream);
            SVGtoPDF(doc, updatedSvgContent, 0, 0);
            doc.end();
            stream.on('finish', () => {
              console.log(`Successfully converted SVG to PDF for ${formattedFile} in ${outputPath}`);
            });
          } else {
            fs.writeFile(outputFile, updatedSvgContent, 'utf8', (err) => {
              if (err) {
                console.error(`Could not write the file to ${outputPath}.`, err);
                process.exit(1);
              }

              console.log(`Successfully optimized SVG for ${formattedFile} in ${outputPath}`);
            });
          }
        }
      });
    }
  });
});

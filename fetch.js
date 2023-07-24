require('dotenv').config();

const figmaApiExporter = require('figma-api-exporter').default;
const exporter = figmaApiExporter(process.env.FIGMA_API_TOKEN);

exporter
  .getSvgs({
    fileId: process.env.FIGMA_FILE_ID,
    canvas: 'Icons',
  })
  .then(svgsData =>
    exporter.downloadSvgs({
      saveDirectory: './svgsFiles',
      svgsData: svgsData.svgs,
      lastModified: svgsData.lastModified,
      clearDirectory: true,
    })
  );
      

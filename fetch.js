const figmaApiExporter = require('figma-api-exporter').default;

const exporter = figmaApiExporter('figd_gVD0cGld4QfB7xI1udcBNCKH2aMnFsY8ltlyfWmm');

exporter
  .getSvgs({
    fileId: 'ICZQcuK2xzGmQpTddTVU2a',
    canvas: 'figma-icon-sync-test',
  })
  .then(async svgsData => {
    await exporter.downloadSvgs({
      saveDirectory: './figmaIcons',
      svgsData: svgsData.svgs,
      lastModified: svgsData.lastModified,
      clearDirectory: true,
    });
  });

const fs = require('fs');
const path = require('path');

// Paths relative to this script
const fontsDir = path.join(__dirname, '..', 'fonts');   // dir/fonts
const outputFile = path.join(__dirname, '..', 'fonts.css'); // dir/fonts.css

fs.readdir(fontsDir, (err, files) => {
  if (err) {
    console.error('Error reading fonts directory:', err);
    return;
  }

  const cssRules = files
    .filter(file => path.extname(file).toLowerCase() === '.ttf')
    .map(file => {
      const fontFamily = path.basename(file, '.ttf');
      // Relative to the CSS file (which is in dir/), fonts are in fonts/
      const srcPath = `fonts/${file}`;
      return `@font-face {
  font-family: '${fontFamily}';
  src: url('${srcPath}') format('truetype');
}`;
    })
    .join('\n\n');

  const css = `/* Auto-generated font-face rules */\n${cssRules}\n`;

  fs.writeFile(outputFile, css, (err) => {
    if (err) {
      console.error('Error writing CSS file:', err);
    } else {
      console.log(`Generated ${outputFile} with ${files.filter(f => f.endsWith('.ttf')).length} fonts.`);
    }
  });
});
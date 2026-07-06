const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const fontsDir = path.join(__dirname, '..', 'fonts');
const scriptPath = path.join(__dirname, 'generate-fonts-css.js');

// Run the generation once immediately
runGeneration();

// Watch the fonts directory for changes (new files, deletions, renames)
fs.watch(fontsDir, { recursive: false }, (eventType, filename) => {
  // Only act on .ttf files
  if (filename && filename.toLowerCase().endsWith('.ttf')) {
    console.log(`Change detected: ${filename} (${eventType})`);
    runGeneration();
  }
});

console.log(`Watching ${fontsDir} for font changes...`);

function runGeneration() {
  const child = spawn('node', [scriptPath], { stdio: 'inherit' });
  child.on('error', (err) => {
    console.error('Failed to run generator:', err.message);
  });
}
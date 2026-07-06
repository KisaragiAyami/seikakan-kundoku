const fs = require('fs');
const path = require('path');          // ← was missing
const { spawn } = require('child_process');

const pagesDir = path.join(__dirname, 'pages');
const scriptPath = path.join(__dirname, 'generate-toc.js');  // more robust path

// Run generation immediately on startup
runGeneration();

fs.watch(pagesDir, (event, filename) => {
    if (filename && filename.endsWith('.html')) {
        console.log(`Change detected: ${filename} (${event})`);
        runGeneration();
    }
});
console.log(`Watching ${pagesDir} for page changes...`);

function runGeneration() {
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    child.on('error', (err) => {
        console.error('Failed to run generator:', err.message);
    });
}
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const outputFile = path.join(__dirname, 'index.html');

const files = fs.readdirSync(pagesDir)
    .filter(f => f.endsWith('.html'))
    .sort();

let tocItems = '';

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Strip UTF-8 BOM if present
    if (html.charCodeAt(0) === 0xFEFF) {
        html = html.slice(1);
    }

    // Extract <title>
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) {
        console.warn(`Warning: No <title> found in ${file} – using filename.`);
        title = file;
    }

    tocItems += `<li><a href="pages/${file}">${title}</a></li>`;
});

const pagesData = files.map(file => {
    const filePath = path.join(pagesDir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    if (html.charCodeAt(0) === 0xFEFF) html = html.slice(1);
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : file;
    return { file: `pages/${file}`, title };
});

const navData = `// Auto‑generated page list
window.PAGES = ${JSON.stringify(pagesData, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, 'nav-data.js'), navData);
console.log('nav-data.js generated.');

const page = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="fonts.css">
    <title>精華大学蔵戦国竹簡 – 目次</title>
    <style>
        ul.toc { list-style: none; padding: 0; }
        ul.toc li { margin: 0.5em 0; }
    </style>
</head>
<body>
    <main>
        <h1><ruby>清華大学蔵戦国竹簡<rt>せいかだいがくぞうせんこくちくかん</rt></ruby>　漢文訓読版</h1>
        <h2><ruby>清華大学出土文献研究与保護中心<rt>せいかだいがくしゅつどぶんけんけんきゅう及びほごちゅうしん</rt></ruby>　編　　　<ruby>李<rt>り</rt></ruby><ruby>学勤<rt>がくきん</rt></ruby>　主編</h2>
        <h2>訓・注・訳：如月あやみ</h2>
        <hr/>
        <h2>目次</h2>
        <ul class="toc">
            ${tocItems}
        </ul>
    </main>
    <script src="js/font-marker.js"></script>
</body>
</html>`;

const baseUrl = 'https://kisaragiayami.github.io/seikakan-kundoku';  // change to your real URL
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
${files.map(file => `  <url><loc>${baseUrl}/pages/${file}</loc></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log('sitemap.xml generated.');

fs.writeFileSync(outputFile, page);
console.log(`TOC generated: ${files.length} pages listed.`);
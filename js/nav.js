(function () {
  if (!window.PAGES || !Array.isArray(window.PAGES)) return;

  const currentPath = window.location.pathname;
  // Get the relative path (e.g., "pages/02-1a-1-insi.html")
  const relativePath = currentPath.split('/').slice(-2).join('/');
  // In case the page is served from a subfolder, adapt: we assume the root index.html is at the site root and pages are in "pages/".

  const idx = window.PAGES.findIndex(p => p.file === relativePath);
  if (idx === -1) {
    // fallback: try matching just the filename
    const filename = currentPath.split('/').pop();
    // search by filename
    const idx2 = window.PAGES.findIndex(p => p.file.endsWith(filename));
    if (idx2 >= 0) idx = idx2; // fix: const not allowed, use a new variable
  }
  if (idx === -1) return; // page not in the list

  const prevPage = idx > 0 ? window.PAGES[idx - 1] : null;
  const nextPage = idx < window.PAGES.length - 1 ? window.PAGES[idx + 1] : null;

  const container = document.createElement('nav');
  container.style.marginTop = '2em';
  container.style.textAlign = 'center';

  let html = '';

  // "目次に戻る" – link to the TOC (index.html at root)
  html += `<hr/><br/><a href="../index.html">目次に戻る</a>`;

  if (prevPage) {
    html += ` ｜ <a href="../${prevPage.file}">前のページ</a>`;
  }
  if (nextPage) {
    html += ` ｜ <a href="../${nextPage.file}">次のページ</a>`;
  }

  container.innerHTML = html;

  // Insert at the end of <main> or right before </body>
  const main = document.querySelector('main');
  if (main) {
    main.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
})();
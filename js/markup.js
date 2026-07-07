(function () {
    'use strict';

    // ---------- 1. Parse footnotes ----------
    const footnotes = {};
    const fnBlock = document.getElementById('footnotes');
    if (fnBlock) {
        const html = fnBlock.innerHTML;
        // Match each entry: optional whitespace, *1*, :, then content until next *n*: or end
        const entryRegex = /^\s*\*(\d+)\*:\s*([\s\S]*?)(?=\s*\*\d+\*:|$)/gm;
        let m;
        while ((m = entryRegex.exec(html)) !== null) {
            const num = m[1];
            let content = m[2].trim();
            // Also convert any [text](url) inside the tooltip (just in case)
            content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
                '<a href="$2" target="_blank">$1</a>');
            footnotes[num] = content;
        }
        fnBlock.remove(); // hide the definitions
    }

    // ---------- 2. Conversion helpers ----------
    function processLinks(text) {
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank">$1</a>');
    }

    function processRuby(text) {
        // Matches: [kanji],kana,  (square brackets around the kanji)
        return text.replace(
            /\[([\u2E80-\u9FFF\u3400-\u4DBF\u{20000}-\u{2A6DF}々]+?)\],([\u3040-\u309F\u30A0-\u30FFー]+?),/gu,
            '<ruby>$1<rt>$2</rt></ruby>'
        );
    }

    // ---------- 3. Process a single text node ----------
    function processTextNode(node) {
        let text = node.nodeValue;

        // a) Links
        text = processLinks(text);
        // b) Ruby (now using [kanji],kana,)
        text = processRuby(text);
        // c) Tooltip markers – word immediately followed by *number*
        text = text.replace(/\[([^\]]+)\]\*(\d+)\*/g, function (match, word, num) {
            if (footnotes[num]) {
                const tip = footnotes[num].replace(/"/g, '&quot;');
                return `<span class="tooltip-trigger" data-tooltip="${tip}">${word}</span>`;
            }
            return match; // keep unchanged if footnote not defined
        });

        if (text === node.nodeValue) return;

        const frag = document.createDocumentFragment();
        const temp = document.createElement('span');
        temp.innerHTML = text;
        while (temp.firstChild) frag.appendChild(temp.firstChild);
        node.parentNode.replaceChild(frag, node);
    }

    // ---------- 4. Walk the DOM, skipping .kanbun ----------
    function processMarkup(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    let parent = node.parentNode;
                    while (parent && parent !== root) {
                        if (parent.classList && parent.classList.contains('kanbun'))
                            return NodeFilter.FILTER_REJECT;
                        parent = parent.parentNode;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        let node;
        while ((node = walker.nextNode())) {
            if (/[\{\[<\*]/.test(node.nodeValue)) nodes.push(node);
        }
        nodes.forEach(processTextNode);
    }

    // ---------- 5. Auto‑run ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => processMarkup(document.body));
    } else {
        processMarkup(document.body);
    }
})();
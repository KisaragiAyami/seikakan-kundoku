// js/font-marker.js
// Enables the @fontName:chars@ marker in regular text (outside .kanbun elements)
// and applies the matching font to all [data-font] spans.
// Exposes processFontMarkers and applyFonts globally for dynamic content (e.g., tooltips).

(function() {
  'use strict';

  // =========================
  // 1. Replace @fontName:chars@ markers in text nodes
  // =========================
  function processFontMarkers(root) {
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip text nodes inside .kanbun (they are handled by kanbun.js)
          var parent = node.parentNode;
          while (parent && parent !== root) {
            if (parent.classList && parent.classList.contains('kanbun')) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentNode;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    var regex = /@([^@:]+):([^@]+)@/g;
    var nodesToReplace = [];

    // Collect text nodes that contain markers
    var textNode;
    while ((textNode = walker.nextNode())) {
      if (regex.test(textNode.nodeValue)) {
        nodesToReplace.push(textNode);
      }
    }

    // Replace each text node with the processed fragment
    nodesToReplace.forEach(function(node) {
      var frag = document.createDocumentFragment();
      var text = node.nodeValue;
      var lastIdx = 0;
      var match;
      regex.lastIndex = 0;

      while ((match = regex.exec(text)) !== null) {
        // Add text before the marker
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }

        // Create the span with font name and characters
        var span = document.createElement('span');
        span.setAttribute('data-font', match[1]);  // font name
        span.textContent = match[2];                // characters
        frag.appendChild(span);

        lastIdx = regex.lastIndex;
      }

      // Add any remaining text after the last marker
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }

      // Replace the original text node with the fragment
      node.parentNode.replaceChild(frag, node);
    });
  }

  // =========================
  // 2. Apply custom fonts to all [data-font] elements
  // =========================
  function applyFonts() {
    var elements = document.querySelectorAll('[data-font]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      el.style.fontFamily = "'" + el.dataset.font + "', serif";
    }
  }

  // =========================
  // Expose functions globally for dynamic content (e.g., tooltips)
  // =========================
  window.processFontMarkers = processFontMarkers;
  window.applyFonts = applyFonts;

  // =========================
  // Auto‑run on page load
  // =========================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      processFontMarkers(document.body);
      applyFonts();
    });
  } else {
    processFontMarkers(document.body);
    applyFonts();
  }
})();
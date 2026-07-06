document.addEventListener('DOMContentLoaded', function () {
  /* ===== Create the tooltip element ===== */
  const tooltip = document.createElement('div');
  tooltip.className = 'dynamic-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.2s;
    background: #fffef5;
    border: 1px solid #c0b090;
    border-radius: 6px;
    padding: 8px 12px;
    box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
    font-size: 0.9em;
    line-height: 1.5;
    writing-mode: vertical-rl;
    color: #222;
    max-width: 250px;
    white-space: normal;
  `;
  document.body.appendChild(tooltip);

  let hideTimeout;

  /* ===== Show tooltip with @font:chars@ support ===== */
  function showTooltip(trigger) {
    const rawContent = trigger.getAttribute('data-tooltip');
    if (!rawContent) return;

    // Replace @fontName:chars@ with <span data-font="name">chars</span>
    const processedContent = rawContent.replace(
      /@([^@:]+):([^@]+)@/g,
      '<span data-font="$1">$2</span>'
    );

    tooltip.innerHTML = processedContent;

    // Apply custom fonts to the new spans
    if (window.applyFonts) {
      window.applyFonts();
    }

    // Position the tooltip
    const rect = trigger.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let left = rect.right + 8;
    let top = rect.top + (rect.height - tipRect.height) / 2;
    if (left + tipRect.width > window.innerWidth) {
      left = rect.left - tipRect.width - 8;
    }
    top = Math.max(4, Math.min(top, window.innerHeight - tipRect.height - 4));
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    // Open links in new tab (optional)
    tooltip.querySelectorAll('a').forEach(a => a.setAttribute('target', '_blank'));

    tooltip.style.opacity = '1';
  }

  /* ===== Hide tooltip with small delay ===== */
  function hideTooltip() {
    hideTimeout = setTimeout(() => { tooltip.style.opacity = '0'; }, 200);
  }
  function cancelHide() {
    clearTimeout(hideTimeout);
  }

  /* ===== Attach events to all triggers ===== */
  document.querySelectorAll('.tooltip-trigger').forEach(function (trigger) {
    trigger.addEventListener('mouseenter', function () {
      cancelHide();
      showTooltip(trigger);
    });
    trigger.addEventListener('mouseleave', hideTooltip);
  });

  // Keep tooltip visible when hovering over it
  tooltip.addEventListener('mouseenter', cancelHide);
  tooltip.addEventListener('mouseleave', hideTooltip);
});
/* ScopeCreep — number-ticker init script.
   See number-ticker.html for usage docs and the canonical <style>/<script>
   embed pattern. This standalone file exists so the _lab page (and any
   consumer that prefers <script src>) can wire it up without HTML
   injection / fetch tricks. */

(function () {
  'use strict';

  if (window.__scNumberTickerInit) return;
  window.__scNumberTickerInit = true;

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatNumber(value, format, prefix, suffix) {
    var n = Math.round(value);
    if (format === 'currency') {
      return (prefix || '$') + n.toLocaleString('en-US');
    }
    if (format === 'percent') {
      return n.toLocaleString('en-US') + (suffix || '%');
    }
    return (prefix || '') + n.toLocaleString('en-US') + (suffix || '');
  }

  // easeOutCubic — standard Magic UI curve.
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animate(el, target, duration, format, prefix, suffix) {
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var elapsed = now - start;
      var t = Math.min(elapsed / duration, 1);
      var eased = easeOutCubic(t);
      el.textContent = formatNumber(eased * target, format, prefix, suffix);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = formatNumber(target, format, prefix, suffix);
        el.dataset.scTickerDone = '1';
      }
    }
    requestAnimationFrame(frame);
  }

  function initTicker(el) {
    if (el.dataset.scTickerReady === '1') return;
    el.dataset.scTickerReady = '1';

    if (el.hasAttribute('data-static')) {
      var literal = el.getAttribute('data-static') || el.textContent;
      el.textContent = literal;
      el.style.minWidth = literal.length + 'ch';
      return;
    }

    var target = parseFloat(el.getAttribute('data-target'));
    if (!isFinite(target)) return;

    var format = el.getAttribute('data-format') || 'integer';
    var duration = parseInt(el.getAttribute('data-duration'), 10) || 1600;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';

    // Reserve layout width based on the final rendered string. ch units key
    // off the font's "0" advance — combined with tabular-nums, this means
    // every digit slot is identical width, so zero shift on completion.
    var finalStr = formatNumber(target, format, prefix, suffix);
    el.style.minWidth = finalStr.length + 'ch';

    var seedStr = formatNumber(0, format, prefix, suffix);
    el.textContent = seedStr;

    if (prefersReducedMotion) {
      el.textContent = finalStr;
      el.dataset.scTickerDone = '1';
      return;
    }

    if (!('IntersectionObserver' in window)) {
      animate(el, target, duration, format, prefix, suffix);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && el.dataset.scTickerDone !== '1') {
          el.dataset.scTickerDone = 'running';
          animate(el, target, duration, format, prefix, suffix);
          io.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
  }

  function initAll(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('.sc-number-ticker');
    for (var i = 0; i < nodes.length; i++) initTicker(nodes[i]);
  }

  window.scNumberTicker = { init: initAll, initOne: initTicker };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }
})();

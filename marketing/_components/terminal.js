/* ScopeCreep — terminal init script.
   See terminal.html for usage docs, JSON script schema, and the embedded
   <style>/<script> copy-paste pattern. This standalone file exists so
   _lab and any consumer that prefers <script src> can wire it up cleanly. */

(function () {
  'use strict';

  if (window.__scTerminalInit) return;
  window.__scTerminalInit = true;

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function sleep(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }

  function makeLine(kind, tone) {
    var div = document.createElement('div');
    div.className = 'sc-terminal-line';
    div.setAttribute('data-kind', kind);
    if (tone) div.setAttribute('data-tone', tone);
    return div;
  }

  function buildChrome(host) {
    host.innerHTML = '';
    var bar = document.createElement('div');
    bar.className = 'sc-terminal-bar';
    for (var i = 0; i < 3; i++) {
      var d = document.createElement('span');
      d.className = 'sc-terminal-dot';
      bar.appendChild(d);
    }
    var title = document.createElement('span');
    title.className = 'sc-terminal-title';
    title.textContent = host.getAttribute('data-title') || 'scopecreep ~ proof';
    bar.appendChild(title);

    var body = document.createElement('div');
    body.className = 'sc-terminal-body';

    host.appendChild(bar);
    host.appendChild(body);
    return body;
  }

  function renderFinal(body, steps) {
    body.innerHTML = '';
    steps.forEach(function (step) {
      // Skip transient wait / elapsed lines in static fallback — they exist
      // only to convey duration, which is meaningless without motion.
      if (step.type === 'wait' || step.type === 'elapsed') return;
      var line = makeLine(step.type, step.tone);
      line.textContent = step.text || step.label || '';
      body.appendChild(line);
    });
  }

  async function typeInput(line, text, speed) {
    for (var i = 0; i < text.length; i++) {
      line.textContent = text.slice(0, i + 1);
      await sleep(speed);
    }
  }

  async function runScript(body, steps, caret) {
    body.innerHTML = '';
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      if (step.type === 'input') {
        var line = makeLine('input');
        body.appendChild(line);
        if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
        line.appendChild(caret);
        await typeInput(line, step.text || '', step.speed || 40);
        await sleep(220);
      } else if (step.type === 'output') {
        await sleep(step.delay || 220);
        var oline = makeLine('output', step.tone);
        oline.textContent = step.text || '';
        body.appendChild(oline);
      } else if (step.type === 'wait') {
        var wline = makeLine('wait');
        wline.textContent = step.label || '(waiting...)';
        body.appendChild(wline);
        await sleep(step.ms || 800);
      } else if (step.type === 'elapsed') {
        var eline = makeLine('elapsed');
        eline.textContent = '[' + (step.label || '') + ']';
        body.appendChild(eline);
        await sleep(step.ms || 500);
      }
    }
    if (caret) {
      var tail = makeLine('input');
      body.appendChild(tail);
      tail.appendChild(caret);
    }
  }

  function readScript(host) {
    var node = host.querySelector('script.sc-terminal-script');
    if (!node) return [];
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      console.warn('sc-terminal: bad JSON script', e);
      return [];
    }
  }

  function initTerminal(host) {
    if (host.dataset.scTerminalReady === '1') return;
    host.dataset.scTerminalReady = '1';

    var steps = readScript(host);
    var body = buildChrome(host);

    if (prefersReducedMotion) {
      renderFinal(body, steps);
      return;
    }

    var caret = document.createElement('span');
    caret.className = 'sc-terminal-caret';

    var started = false;
    function start() {
      if (started) return;
      started = true;
      (async function loop() {
        while (host.isConnected) {
          await runScript(body, steps, caret);
          await sleep(3200);
        }
      })();
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            start();
            io.disconnect();
          }
        });
      }, { threshold: 0.25 });
      io.observe(host);
    } else {
      start();
    }
  }

  function initAll(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('.sc-terminal[data-sc-terminal]');
    for (var i = 0; i < nodes.length; i++) initTerminal(nodes[i]);
  }

  window.scTerminal = { init: initAll, initOne: initTerminal };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }
})();

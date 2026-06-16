/* Shared flight-tracker behaviour for the apple-hig demo mockups.
   Drives three things, all reduce-motion aware:
     1. The plane flying along its route, drawing the flown trail in as it goes.
     2. Metric numbers counting up when they scroll into view.
     3. A tappable search field that opens a non-modal search popover.
   Markup is wired with data-attributes so each mockup stays declarative. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. plane along route ------------------------------------ */
  function initMaps() {
    var maps = document.querySelectorAll('[data-flight-map]');
    Array.prototype.forEach.call(maps, function (svg) {
      var flown = svg.querySelector('.route-flown');
      var plane = svg.querySelector('.plane');
      if (!flown || !plane) return;
      var L = flown.getTotalLength();
      var stated = parseFloat(svg.getAttribute('data-progress')) || 0.62;
      var offset = parseFloat(plane.getAttribute('data-plane-offset')) || 0;
      flown.style.strokeDasharray = L + ' ' + L;

      // Sample the path ONCE up front. getPointAtLength forces a synchronous layout
      // flush; calling it every animation frame turns the loop into a per-frame reflow
      // (which re-shapes page text — very slow on some font paths). Interpolate instead.
      var SAMPLES = 240, pts = [];
      for (var sIdx = 0; sIdx <= SAMPLES; sIdx++) pts.push(flown.getPointAtLength(L * sIdx / SAMPLES));
      function pointAt(frac) {
        var x = Math.max(0, Math.min(1, frac)) * SAMPLES, i = Math.floor(x), t = x - i;
        var a = pts[i], b = pts[Math.min(SAMPLES, i + 1)];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }

      function place(p) {
        p = Math.max(0, Math.min(1, p));
        flown.style.strokeDashoffset = (L * (1 - p)).toString();
        var a = pointAt(p), b = pointAt(Math.min(1, p + 0.012));
        var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        plane.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ',' + a.y.toFixed(1) + ') rotate(' + (ang + offset).toFixed(1) + ')');
      }

      if (reduce) { place(stated); return; }

      // the plane flies the route up to its stated position when the map scrolls
      // into view, drawing the flown trail in behind it; it replays on re-entry.
      var dur = parseFloat(svg.getAttribute('data-fly')) || 2200;
      var flying = false;
      function fly() {
        if (flying) return;
        flying = true;
        var t0 = null;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur);
          var e = 1 - Math.pow(1 - k, 3);     // ease-out
          place(stated * e);
          if (k < 1) requestAnimationFrame(step); else flying = false;
        }
        requestAnimationFrame(step);
      }
      place(0);
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (en) { if (en.isIntersecting) { fly(); io.unobserve(svg); } });   // one-shot
        }, { threshold: 0.25 });
        io.observe(svg);
      } else { fly(); }
    });
  }

  /* ---------- 2. count-up metrics ------------------------------------- */
  function group(n) { return n.toLocaleString('en-US'); }
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var comma = el.hasAttribute('data-comma');
    var dur = parseFloat(el.getAttribute('data-duration')) || 1100;
    function render(v) {
      var n = Math.round(v);
      el.textContent = prefix + (comma ? group(n) : String(n)) + suffix;
    }
    if (reduce) { render(target); return; }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      render(target * eased);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function initCounts() {
    var els = document.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(els, runCount); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* ---------- 3. search panel ----------------------------------------- */
  function panelFor(trigger) {
    var sel = trigger.getAttribute('data-search-open');
    if (sel) return document.querySelector(sel);
    return document.querySelector('[data-search-panel]');
  }
  function initSearch() {
    var triggers = document.querySelectorAll('[data-search-open]');
    Array.prototype.forEach.call(triggers, function (tr) {
      var panel = panelFor(tr);
      if (!panel) return;
      var isInputTrigger = tr.tagName === 'INPUT';
      var input = panel.querySelector('[data-search-input]');
      var filterInput = input || (isInputTrigger ? tr : null);
      var items = panel.querySelectorAll('[data-search-item]');
      var suppressOpen = false;
      function open() {
        if (suppressOpen || panel.classList.contains('open')) return;
        panel.classList.add('open');
        panel.removeAttribute('hidden');
        tr.setAttribute('aria-expanded', 'true');
        // focus on the next frame (after the panel is shown) — not on a timer a
        // keyboard user could out-tab
        if (input && !isInputTrigger) requestAnimationFrame(function () { input.focus(); });
      }
      function close(returnFocus) {
        panel.classList.remove('open');
        tr.setAttribute('aria-expanded', 'false');
        if (returnFocus && !isInputTrigger) tr.focus();   // never refocus an input trigger (it would reopen)
        if (isInputTrigger) { suppressOpen = true; setTimeout(function () { suppressOpen = false; }, 250); }
        setTimeout(function () { if (!panel.classList.contains('open')) panel.setAttribute('hidden', ''); }, reduce ? 0 : 220);
      }
      // these are inline, non-modal popovers — advertise a generic popup and the
      // panel it controls, not a dialog/listbox the markup doesn't implement
      tr.setAttribute('aria-haspopup', 'true');
      tr.setAttribute('aria-expanded', 'false');
      if (panel.id) tr.setAttribute('aria-controls', panel.id);
      if (isInputTrigger) tr.addEventListener('focus', open);
      else tr.addEventListener('click', function (e) { e.preventDefault(); open(); });
      panel.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-search-close') || e.target.hasAttribute('data-search-backdrop')) close(true);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('open')) close(true);
      });
      // close an input-triggered popover once focus leaves both the field and the panel
      if (isInputTrigger) tr.addEventListener('blur', function () {
        setTimeout(function () {
          if (!panel.contains(document.activeElement) && document.activeElement !== tr) close(false);
        }, 120);
      });
      if (filterInput) filterInput.addEventListener('input', function () {
        var q = filterInput.value.trim().toLowerCase();
        Array.prototype.forEach.call(items, function (it) {
          var hit = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
          it.style.display = hit ? '' : 'none';
        });
      });
    });
  }

  /* ---------- 4. toast feedback + sendPrompt shim --------------------- */
  var toastEl = null, toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('toast');
    if (!el) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'toast';
        toastEl.setAttribute('role', 'status');
        toastEl.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(' + (reduce ? '0' : '20px') + ');background:rgba(28,28,30,0.96);color:#fff;padding:11px 18px;border-radius:999px;font:500 14px/1.2 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;opacity:0;pointer-events:none;' + (reduce ? '' : 'transition:opacity .25s,transform .25s;') + 'max-width:88%;text-align:center;z-index:999;';
        document.body.appendChild(toastEl);
      }
      el = toastEl;
    }
    el.textContent = msg;
    el.classList.add('show');
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
      el.style.opacity = '0';
      if (!reduce) el.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2400);
  }
  if (typeof window.sendPrompt !== 'function') window.sendPrompt = showToast;
  function initToasts() {
    var els = document.querySelectorAll('[data-toast]');
    Array.prototype.forEach.call(els, function (el) {
      el.addEventListener('click', function () { showToast(el.getAttribute('data-toast')); });
    });
  }

  // lets a host page (or this doc, when backgrounded) freeze all animation cheaply —
  // a paused CSS animation stops ticking, so backdrop-filter layers stop recompositing
  function injectPauseHook() {
    var st = document.createElement('style');
    st.textContent = 'html.fm-paused *, html.fm-paused *::before, html.fm-paused *::after{animation-play-state:paused!important}';
    (document.head || document.documentElement).appendChild(st);
    // self-pause when this tab is hidden — but only when standing alone; when embedded
    // (the demo iframes) the host page drives pausing with off-screen + settle logic
    var embedded = window.top !== window.self;
    if (!embedded) document.addEventListener('visibilitychange', function () {
      document.documentElement.classList.toggle('fm-paused', document.hidden);
    });
  }

  function init() { injectPauseHook(); initMaps(); initCounts(); initSearch(); initToasts(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

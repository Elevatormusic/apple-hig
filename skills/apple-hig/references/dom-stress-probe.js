// DOM stress probe for #4. The reviewer runs this via Playwright `browser_evaluate` to MEASURE whether a
// rendered screen survives largest text / WCAG text-spacing / narrow reflow / RTL mirroring without
// clipping, truncating, overlapping, or losing content. The constants (AX5 scale, the 1.4.12 spacing set,
// the overlap noise gate) mirror scripts/layout-robustness.mjs (unit-tested) — keep them in sync.
//
// Call ONCE PER MODE: 'large-text' | 'text-spacing' | 'rtl' | 'reflow'. It applies the transform, measures,
// then RESTORES the page (except 'reflow', which mutates nothing — resize the viewport to <=320 CSS px with
// browser_resize BEFORE calling). Findings attach as `evidence: computed`, category `layout`/`responsive`.

(mode) => {
  const AX5 = 3.12; // largest iOS Dynamic Type (Body ~53pt / 17pt), iOS/iPadOS only — see layout-robustness.mjs
  const SPACING = { lineHeight: 1.5, paragraphSpacing: 2, letterSpacing: 0.12, wordSpacing: 0.16 }; // WCAG 1.4.12
  const EPS = 1; // sub-pixel noise floor (CSS px)
  const OVERLAP_NOISE_PX = 2; // report overlap only past this depth — mirrors layout-robustness.mjs
  const doc = document.documentElement;
  const vw = () => doc.clientWidth;
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0; };
  const txt = (el) => (el.textContent || el.value || '').trim().slice(0, 40);
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const cands = () => [...document.querySelectorAll('p,span,a,button,h1,h2,h3,h4,h5,h6,li,td,th,label,input,select,div')].filter(vis);

  const horizClip = (el) => { const s = getComputedStyle(el); return el.scrollWidth - el.clientWidth > EPS && /^(hidden|clip)$/.test(s.overflowX) && !el.title; };
  const vertClip = (el) => { const s = getComputedStyle(el); return el.scrollHeight - el.clientHeight > EPS && /^(hidden|clip)$/.test(s.overflowY); };

  const measure = () => {
    const clipped = [], overlapping = [];
    const all = cands();
    // clip detection runs on ANY text-bearing element with overflow hidden/clip — the common pattern is
    // overflow:hidden on a CONTAINER while the text lives in a child, so don't restrict to direct-text nodes.
    for (const el of all) {
      if (!(el.textContent || '').trim()) continue;
      if (horizClip(el) || vertClip(el)) clipped.push({ text: txt(el), tag: el.tagName.toLowerCase() });
    }
    const textEls = all.filter(ownText);
    const boxes = textEls.slice(0, 120).map((el) => ({ el, r: el.getBoundingClientRect() }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      if (boxes[i].el.contains(boxes[j].el) || boxes[j].el.contains(boxes[i].el)) continue;
      const a = boxes[i].r, b = boxes[j].r;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > EPS && oy > EPS && Math.min(ox, oy) > OVERLAP_NOISE_PX) overlapping.push({ a: txt(boxes[i].el), b: txt(boxes[j].el), depth: Math.round(Math.min(ox, oy)) });
    }
    return { clipped: clipped.slice(0, 25), overlapping: overlapping.slice(0, 20) };
  };

  const saved = { fontSize: doc.style.fontSize, dir: doc.getAttribute('dir') };
  let injected = null;
  const restore = () => { doc.style.fontSize = saved.fontSize; if (saved.dir === null) doc.removeAttribute('dir'); else doc.setAttribute('dir', saved.dir); if (injected) injected.remove(); };

  let result = { mode };
  try {
    if (mode === 'large-text') {
      const base = parseFloat(getComputedStyle(doc).fontSize) || 16;
      doc.style.fontSize = base * AX5 + 'px';
      result = { mode, scale: AX5, ...measure(), note: 'root scaled to largest Dynamic Type (~3.12x, iOS only); px-fixed text will NOT grow — that non-response is itself a defect to flag.' };
    } else if (mode === 'text-spacing') {
      injected = document.createElement('style');
      injected.textContent = `*{line-height:${SPACING.lineHeight}em !important;letter-spacing:${SPACING.letterSpacing}em !important;word-spacing:${SPACING.wordSpacing}em !important;} p{margin-bottom:${SPACING.paragraphSpacing}em !important;}`;
      document.head.appendChild(injected);
      result = { mode, applied: SPACING, ...measure(), note: 'WCAG 1.4.12 text-spacing tolerance — content must survive these overrides.' };
    } else if (mode === 'rtl') {
      // Detect PHYSICAL directional CSS by re-reading computed style after the flip: logical properties swap
      // left<->right under dir=rtl, physical ones don't. Centred content (margin:auto, text-align:center) is
      // symmetric and correctly NOT flagged. (centre-x stability alone — the old signal — over-flags centred
      // layouts and misses physical padding, so it is not used.)
      const snap = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { ml: parseFloat(s.marginLeft) || 0, mr: parseFloat(s.marginRight) || 0, pl: parseFloat(s.paddingLeft) || 0, pr: parseFloat(s.paddingRight) || 0, ta: s.textAlign, pos: s.position, cx: r.left + r.width / 2 }; };
      const before = cands().filter((el) => ownText(el) || el.matches('button,a,input,select,img,[role=button]')).slice(0, 100).map((el) => ({ el, b: snap(el) }));
      doc.setAttribute('dir', 'rtl');
      const notMirrored = [];
      for (const o of before) {
        const b = o.b, a = snap(o.el);
        let reason = null;
        if (/^(left|right)$/.test(b.ta)) reason = 'text-align:' + b.ta; // physical alignment never flips
        else if (Math.abs(b.ml - b.mr) > 1 || Math.abs(b.pl - b.pr) > 1) { // asymmetric inline spacing…
          const swapped = Math.abs(b.ml - a.mr) < 1 && Math.abs(b.mr - a.ml) < 1 && Math.abs(b.pl - a.pr) < 1 && Math.abs(b.pr - a.pl) < 1;
          if (!swapped) reason = 'physical margin/padding (did not swap under rtl)'; // …that did NOT swap = physical
        } else if (/^(absolute|fixed)$/.test(b.pos)) { // pinned by physical left/right (and not merely centred)?
          const par = o.el.offsetParent || document.body, pr = par.getBoundingClientRect(), pcx = pr.left + pr.width / 2;
          if (Math.abs(a.cx - b.cx) < 2 && Math.abs(b.cx - pcx) > pr.width * 0.15) reason = 'physical left/right position';
        }
        if (reason) notMirrored.push({ text: txt(o.el), reason });
      }
      result = { mode, ...measure(), notMirrored: notMirrored.slice(0, 20), note: 'elements using PHYSICAL directional CSS (text-align:left/right, asymmetric margin/padding that did not swap, absolute left/right) instead of logical properties (text-align:start/end, margin/padding-inline-*, inset-inline-*) will not mirror. Must-not-mirror items (clocks, media transport, logos, numerals) should NOT flip — check those separately.' };
    } else if (mode === 'reflow') {
      result = { mode, viewportWidth: vw(), pageHorizontalScroll: doc.scrollWidth - doc.clientWidth > EPS, ...measure(), note: 'resize the viewport to <=320 CSS px BEFORE this call; pageHorizontalScroll=true = two-dimensional scrolling (WCAG 1.4.10 fail). Whitelist maps/diagrams/video/games/data-table-grid before flagging.' };
    }
  } finally {
    if (mode !== 'reflow') restore(); // reflow mutates nothing; the viewport is the reviewer's to restore
  }
  return result;
};

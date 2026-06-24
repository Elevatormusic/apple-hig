// DOM stress probe for #4. The reviewer runs this via Playwright `browser_evaluate` to MEASURE whether a
// rendered screen survives largest text / WCAG text-spacing / narrow reflow / RTL mirroring without
// clipping, truncating, overlapping, or losing content. The math mirrors scripts/layout-robustness.mjs
// (unit-tested) — keep the constants in sync.
//
// Call ONCE PER MODE: 'large-text' | 'text-spacing' | 'rtl' | 'reflow'. It applies the transform, measures,
// then RESTORES the page (except 'reflow', which mutates nothing — resize the viewport to <=320 CSS px with
// browser_resize BEFORE calling). Findings attach as `evidence: computed`, category `layout`/`responsive`.

(mode) => {
  const AX5 = 3.12; // largest iOS Dynamic Type (Body ~53pt / 17pt), iOS/iPadOS only — see layout-robustness.mjs
  const SPACING = { lineHeight: 1.5, paragraphSpacing: 2, letterSpacing: 0.12, wordSpacing: 0.16 }; // WCAG 1.4.12
  const EPS = 1; // sub-pixel noise floor (CSS px)
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
      if (ox > EPS && oy > EPS && Math.min(ox, oy) > 2) overlapping.push({ a: txt(boxes[i].el), b: txt(boxes[j].el), depth: Math.round(Math.min(ox, oy)) });
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
      const before = cands().filter(ownText).slice(0, 80).map((el) => { const r = el.getBoundingClientRect(); return { el, cx: r.left + r.width / 2, w: r.width }; });
      doc.setAttribute('dir', 'rtl');
      const notMirrored = [];
      for (const o of before) { const r = o.el.getBoundingClientRect(); const cx = r.left + r.width / 2; if (Math.abs(cx - o.cx) < 2 && o.w < vw() * 0.8) notMirrored.push({ text: txt(o.el) }); }
      result = { mode, ...measure(), notMirrored: notMirrored.slice(0, 20), note: 'elements whose horizontal centre did not move under dir=rtl likely use PHYSICAL (left/right, margin-left) CSS instead of logical properties (inset-inline-*) and will not mirror.' };
    } else if (mode === 'reflow') {
      result = { mode, viewportWidth: vw(), pageHorizontalScroll: doc.scrollWidth - doc.clientWidth > EPS, ...measure(), note: 'resize the viewport to <=320 CSS px BEFORE this call; pageHorizontalScroll=true = two-dimensional scrolling (WCAG 1.4.10 fail). Whitelist maps/diagrams/video/games/data-table-grid before flagging.' };
    }
  } finally {
    if (mode !== 'reflow') restore(); // reflow mutates nothing; the viewport is the reviewer's to restore
  }
  return result;
};

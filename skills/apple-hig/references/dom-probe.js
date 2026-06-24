// DOM probe for the design-reviewer's `evidence: computed` findings.
// The reviewer passes this function to the Playwright `browser_evaluate` tool AFTER rendering a screen.
// It runs in the page and returns MEASURED facts (not guesses): real WCAG contrast against the rendered
// background, interactive-target geometry after layout, and whether dark mode is declared. The WCAG
// luminance/contrast formula here mirrors scripts/wcag-contrast.mjs (which is unit-tested) — keep in sync.
//
// Usage (reviewer): browser_evaluate(<the function below>) → attach the result as `evidence: computed`.

() => {
  // --- WCAG contrast (mirror of scripts/wcag-contrast.mjs) ---
  const chan = (ch) => { const c = ch / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  const parseRGB = (s) => { const m = String(s).match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };
  const parseColor = (s) => { const m = String(s).match(/[\d.]+/g); if (!m) return null; const [r, g, b, a] = m.map(Number); return { rgb: [r, g, b], a: a === undefined ? 1 : a }; };
  const blend = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a)); // composite a translucent fg over bg
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); };

  const isTransparent = (s) => !s || /rgba\([^)]*,\s*0\s*\)/.test(s) || s === 'transparent';
  const bgOf = (el) => {            // effective background: walk up to the first opaque background
    let n = el;
    while (n) { const bg = getComputedStyle(n).backgroundColor; if (!isTransparent(bg)) { const c = parseRGB(bg); if (c) return c; } n = n.parentElement; }
    return [255, 255, 255];
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0; };

  // --- text contrast (only elements with their own direct text) ---
  const textContrastFailures = [];
  document.querySelectorAll('p,span,a,button,h1,h2,h3,h4,h5,h6,li,td,th,label,strong,em,div').forEach((el) => {
    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasOwnText || !visible(el)) return;
    const s = getComputedStyle(el);
    const fgc = parseColor(s.color); if (!fgc) return;
    const bg = bgOf(el);
    const fg = fgc.a < 1 ? blend(fgc.rgb, bg, fgc.a) : fgc.rgb; // alpha matters: rgba text composites over bg
    const px = parseFloat(s.fontSize); const bold = parseInt(s.fontWeight, 10) >= 700;
    const large = px >= 24 || (bold && px >= 18.66);
    const r = ratio(fg, bg); const floor = large ? 3 : 4.5;
    if (r < floor) textContrastFailures.push({ text: el.textContent.trim().slice(0, 40), ratio: +r.toFixed(2), needs: floor, fontPx: Math.round(px), large });
  });

  // --- interactive target geometry (after layout) ---
  const smallTargets = [];
  document.querySelectorAll('a,button,input,select,textarea,[role=button],[role=link],[onclick],[tabindex]').forEach((el) => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) smallTargets.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || el.value || '').trim().slice(0, 24) });
  });

  // --- dark-mode declared? ---
  let darkMode = false;
  try { for (const ss of document.styleSheets) for (const rule of (ss.cssRules || [])) if (rule.media && /prefers-color-scheme/.test(rule.media.mediaText)) darkMode = true; } catch (e) { /* cross-origin sheet */ }

  // --- visual weight ("squint test"): which elements dominate the rendered view? (mirrors scripts/visual-weight.mjs) ---
  const pageBg = (() => { const c = parseColor(getComputedStyle(document.body).backgroundColor); return c && c.a > 0.1 ? c.rgb : [255, 255, 255]; })();
  const wf = (area, contrast, filled, bold) => { const cf = Math.max(0, Math.min(1, (contrast - 1) / 20)); const ink = filled ? 1 : 0.15 * (bold ? 1.5 : 1); return area * ink * cf; };
  const buttonLike = (el) => el.matches('button,a,input,select,textarea,[role=button],[role=link]');
  const isFilled = (el) => { const c = parseColor(getComputedStyle(el).backgroundColor); return !!(c && c.a > 0.1 && ratio(c.rgb, pageBg) > 1.2); };
  // a filled element that WRAPS content (a card/section/surface) is not a focal block — counting its full
  // area would double-count its own children and falsely outshout the title. Only a control-sized leaf fill
  // (button/chip) is a focal block; a filled container is skipped so its contents carry the weight.
  const wrapsContent = (el) => [...el.children].some((c) => [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || c.matches('button,a,input,select,img,[role=button]') || c.querySelector('button,a,input,select,img,[role=button]'));
  const inFocalFill = (el) => { let n = el.parentElement; while (n) { if (isFilled(n) && (buttonLike(n) || !wrapsContent(n))) return true; n = n.parentElement; } return false; };
  const weights = [];
  document.querySelectorAll('h1,h2,h3,h4,button,a,[role=button],img,p,span,div,li,strong').forEach((el) => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect(); const area = Math.round(r.width * r.height);
    if (area < 250) return;
    const s = getComputedStyle(el);
    const filled = isFilled(el);
    const focalFill = filled && (buttonLike(el) || !wrapsContent(el)); // leaf fill, not a container surface
    if (filled && !focalFill) return; // a filled container is a surface — its children carry the weight
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!focalFill && !ownText && el.tagName !== 'IMG') return;
    if (!focalFill && inFocalFill(el)) return; // text inside a focal fill — the fill already counts it
    const bold = parseInt(s.fontWeight, 10) >= 700;
    let contrast;
    if (focalFill) contrast = ratio(parseColor(s.backgroundColor).rgb, pageBg);
    else if (el.tagName === 'IMG') contrast = 8; // treat an image as a strong block
    else { const fgc = parseColor(s.color); const bg = bgOf(el); contrast = fgc ? ratio(fgc.a < 1 ? blend(fgc.rgb, bg, fgc.a) : fgc.rgb, bg) : 1; }
    const weight = wf(area, contrast, focalFill, bold);
    if (weight > 0) weights.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || el.alt || '').trim().slice(0, 30), weight: Math.round(weight), filled: focalFill });
  });
  const visualWeightTop = weights.sort((a, b) => b.weight - a.weight).slice(0, 6);

  return {
    evidence: 'computed',
    textContrastFailures,
    smallTargets,
    visualWeightTop,
    darkMode,
    note: 'Measured against the RENDERED background. Web target floor 24px = WCAG 2.5.8 AA (Apple design target is 44pt); large text = >=24px or >=18.66px bold. Decorative/disabled elements may be over-reported — apply the contrast-role exemptions before flagging.',
  };
}

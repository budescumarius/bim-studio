// Limba interfeței: română (sursa) sau franceză. Textele se scriu în română în cod; în franceză,
// tot ce ajunge pe ecran (noduri text, atributele title / placeholder, textul desenat pe canvas)
// și în exporturi (Excel) trece printr-un dicționar de expresii, cea mai lungă potrivire întâi.
import FR from './i18n-fr.js';

const KEY = 'cad:lang';
export let LANG = 'ro';
try { LANG = localStorage.getItem(KEY) === 'fr' ? 'fr' : 'ro'; } catch { /* */ }
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch { /* */ } location.reload(); }

const ucfirst = (s) => s.charAt(0).toLocaleUpperCase('ro') + s.slice(1);
let re = null;
const map = new Map();
function build() {
  for (const [ro, fr] of FR) {
    if (!ro || fr == null) continue;
    if (!map.has(ro)) map.set(ro, fr);
    const U = ucfirst(ro);
    if (U !== ro && !map.has(U)) map.set(U, ucfirst(fr));
  }
  const keys = [...map.keys()].sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // potrivire doar la limită de cuvânt (o cheie nu se potrivește în interiorul unui cuvânt mai lung)
  re = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${keys.join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
}

export function t(s) {
  if (LANG !== 'fr' || typeof s !== 'string' || !s) return s;
  if (!re) build();
  return s.replace(re, (m) => map.get(m) ?? m);
}

if (LANG === 'fr' && typeof document !== 'undefined') {
  document.documentElement.lang = 'fr';
  // 1. textul desenat pe canvas (planul, legenda, planșele PDF)
  for (const fn of ['fillText', 'strokeText']) {
    const orig = CanvasRenderingContext2D.prototype[fn];
    CanvasRenderingContext2D.prototype[fn] = function (text, ...rest) { return orig.call(this, t(String(text)), ...rest); };
  }
  // 2. DOM: traduce ce se adaugă sau se schimbă; ținem minte rezultatul ca să nu traducem de două ori
  const done = new WeakMap();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);
  const textNode = (n) => {
    const v = n.nodeValue;
    if (!v || done.get(n) === v || !/\p{L}/u.test(v)) return;
    const p = n.parentNode;
    if (p && (SKIP.has(p.nodeName) || p.closest?.('[data-noi18n]'))) return;
    const out = t(v);
    done.set(n, out);
    if (out !== v) n.nodeValue = out;
  };
  const ATTRS = ['title', 'placeholder', 'aria-label'];
  const doneAttr = new WeakMap();
  const attrs = (el) => {
    for (const a of ATTRS) {
      const v = el.getAttribute?.(a);
      if (!v) continue;
      const rec = doneAttr.get(el) || {};
      if (rec[a] === v) continue;
      const out = t(v);
      rec[a] = out; doneAttr.set(el, rec);
      if (out !== v) el.setAttribute(a, out);
    }
  };
  const walk = (root) => {
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP.has(root.nodeName)) return; attrs(root); }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) textNode(n); else attrs(n); }
  };
  const start = () => {
    walk(document.body);
    document.title = t(document.title);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') attrs(m.target);
        else for (const n of m.addedNodes) walk(n);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}

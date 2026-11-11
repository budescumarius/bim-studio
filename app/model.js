// Modelul proiectului: niveluri, elemente, materiale, geometrie și cantități.
// Coordonate în plan: x spre dreapta, y în sus, în metri. Cotele (z) sunt în metri față de ±0,00.

export const MATERIALS = {
  beton: { name: 'Beton armat C25/30', gamma: 25, fd: 16.7, color: '#a9adb3', c3: 0xb8bbc0, kind: 'beton' },
  bca: { short: 'blocuri BCA (GBN 50)', name: 'Zidărie BCA (GBN 50)', gamma: 7, fd: 0.9, color: '#e7dcc6', c3: 0xece6da, kind: 'zidarie' },
  porotherm: { short: 'blocuri ceramice cu goluri (Porotherm)', name: 'Zidărie cărămidă cu goluri', gamma: 10, fd: 1.4, color: '#d9a07f', c3: 0xd8b49c, kind: 'zidarie' },
  caramida: { short: 'cărămidă plină', name: 'Zidărie cărămidă plină', gamma: 18, fd: 1.8, color: '#c8755a', c3: 0xc98f78, kind: 'zidarie' },
  gips: { name: 'Gips-carton pe profile metalice', gamma: 3, fd: 0, color: '#f2f2f2', c3: 0xf4f3f0, kind: 'usor' },
  lemn: { name: 'Lemn ecarisat C24', gamma: 4.2, fd: 13, color: '#c9a26b', c3: 0xc6a57a, kind: 'lemn' },
  otel: { name: 'Oțel S235', gamma: 78.5, fd: 235, color: '#6f7b8a', c3: 0x8b95a3, kind: 'otel' },
  invelitoare: { name: 'Învelitoare țiglă + șarpantă lemn', gamma: 5, fd: 0, color: '#b0533b', c3: 0xa65a42, kind: 'acoperis' },
  // materiale pentru straturi (pereți, plăci, acoperișuri)
  tenc_ext: { name: 'Tencuială decorativă exterioară', gamma: 18, color: '#efe3c8', c3: 0xf2e8d2, kind: 'finisaj' },
  tenc_int: { name: 'Tencuială interioară var-ciment', gamma: 18, color: '#f5f1e8', c3: 0xf3efe6, kind: 'finisaj' },
  eps: { short: 'polistiren expandat EPS 80', name: 'Polistiren expandat EPS 80', gamma: 0.3, color: '#fff4c2', c3: 0xfff2bd, kind: 'izolatie' },
  xps: { short: 'polistiren extrudat XPS', name: 'Polistiren extrudat XPS', gamma: 0.35, color: '#c9e7f7', c3: 0xbfe0f2, kind: 'izolatie' },
  vata: { short: 'vată minerală bazaltică', name: 'Vată minerală bazaltică', gamma: 1.4, color: '#ffe1a8', c3: 0xf7d69b, kind: 'izolatie' },
  gips_placa: { name: 'Plăci gips-carton 12,5 mm', gamma: 9, color: '#f0f0ee', c3: 0xf2f2f0, kind: 'finisaj' },
  sapa: { name: 'Șapă ciment-nisip', gamma: 22, color: '#d4d1c9', c3: 0xd6d3cb, kind: 'sapa' },
  hidro: { name: 'Hidroizolație membrană bituminoasă', gamma: 11, color: '#4b4f57', c3: 0x55595f, kind: 'hidro' },
  bariera: { name: 'Barieră de vapori', gamma: 9, color: '#7d8a99', c3: 0x8b97a5, kind: 'hidro' },
  folie: { name: 'Folie anticondens', gamma: 9, color: '#9fb3c8', c3: 0x9fb3c8, kind: 'hidro' },
  tigla: { name: 'Țiglă ceramică pe șipci și contrașipci', gamma: 12, color: '#b0533b', c3: 0xa65a42, kind: 'invelitoare' },
  capriori: { name: 'Șarpantă lemn (căpriori, pane)', gamma: 5, color: '#c9a26b', c3: 0xc6a57a, kind: 'lemn' },
};

// Structuri compuse (straturi): pereți – de la fața exterioară (stânga sensului de desen) spre interior;
// plăci și acoperișuri – de sus în jos. Grosimi în metri.
export const COMPOSITES = {
  ext_bca30_eps10: { for: 'wall', name: 'Perete exterior BCA 30 + EPS 10', layers: [['tenc_ext', 0.01], ['eps', 0.10], ['bca', 0.30], ['tenc_int', 0.015]] },
  ext_poro25_vata10: { for: 'wall', name: 'Perete exterior Porotherm 25 + vată 10', layers: [['tenc_ext', 0.01], ['vata', 0.10], ['porotherm', 0.25], ['tenc_int', 0.015]] },
  ext_beton25_eps10: { for: 'wall', name: 'Perete exterior beton armat 25 + EPS 10', layers: [['tenc_ext', 0.01], ['eps', 0.10], ['beton', 0.25], ['tenc_int', 0.015]] },
  int_bca25: { for: 'wall', name: 'Perete interior BCA 25 tencuit', layers: [['tenc_int', 0.015], ['bca', 0.25], ['tenc_int', 0.015]] },
  int_bca15: { for: 'wall', name: 'Perete interior BCA 15 tencuit', layers: [['tenc_int', 0.015], ['bca', 0.15], ['tenc_int', 0.015]] },
  int_poro12: { for: 'wall', name: 'Perete interior cărămidă 11,5 tencuit', layers: [['tenc_int', 0.015], ['porotherm', 0.115], ['tenc_int', 0.015]] },
  int_gips10: { for: 'wall', name: 'Perete gips-carton 10 cm (2×12,5 + vată 5)', layers: [['gips_placa', 0.025], ['vata', 0.05], ['gips_placa', 0.025]] },
  soclu_beton30_xps10: { for: 'wall', name: 'Soclu / subsol beton 30 + XPS 10', layers: [['hidro', 0.005], ['xps', 0.10], ['beton', 0.30]] },
  pardoseala_sol: { for: 'slab', name: 'Placă pe sol: șapă 6 + XPS 10 + hidro + placă BA 12', layers: [['sapa', 0.06], ['xps', 0.10], ['hidro', 0.005], ['beton', 0.12]] },
  planseu_ba15: { for: 'slab', name: 'Planșeu BA 15 + șapă 5', layers: [['sapa', 0.05], ['beton', 0.15]] },
  planseu_ba15_fono: { for: 'slab', name: 'Planșeu BA 15 + fonoizolație 2 + șapă 5', layers: [['sapa', 0.05], ['eps', 0.02], ['beton', 0.15]] },
  terasa_ba15: { for: 'slab', name: 'Terasă necirculabilă: hidro + EPS 20 + barieră + placă BA 15', layers: [['hidro', 0.01], ['eps', 0.20], ['bariera', 0.003], ['beton', 0.15]] },
  balcon_ba15: { for: 'slab', name: 'Balcon: gresie + șapă 4 + hidro + placă BA 15', layers: [['sapa', 0.04], ['hidro', 0.005], ['beton', 0.15]] },
  acoperis_tigla: { for: 'roof', name: 'Țiglă ceramică + folie + șarpantă + vată 20 + gips-carton', layers: [['tigla', 0.04], ['folie', 0.002], ['capriori', 0.20], ['vata', 0.20], ['bariera', 0.002], ['gips_placa', 0.0125]] },
};
export const layersOf = (el) => {
  const c = el.composite && COMPOSITES[el.composite];
  if (c) return c.layers.map(([m, t]) => ({ m, t }));
  return [{ m: el.material, t: el.thickness }];
};
export const compositeThickness = (id) => (COMPOSITES[id] ? COMPOSITES[id].layers.reduce((a, l) => a + l[1], 0) : null);
// materialul structural al unui element compus (cel mai gros strat de beton / zidărie / lemn)
export const coreMaterial = (el) => {
  const ls = layersOf(el).filter((l) => ['beton', 'zidarie', 'lemn', 'otel', 'usor'].includes(MATERIALS[l.m]?.kind));
  return (ls.sort((a, b) => b.t - a.t)[0] || layersOf(el)[0]).m;
};

// Finisaje pe camere
export const FINISH = {
  floor: { gresie: 'Gresie porțelanată', parchet: 'Parchet stratificat', laminat: 'Parchet laminat', mocheta: 'Mochetă', beton: 'Beton elicopterizat / rășină', fara: '— fără —' },
  walls: { vopsea: 'Glet + vopsea lavabilă', faianta: 'Faianță (până la înălțimea dată) + vopsea deasupra', fara: '— fără —' },
  ceiling: { vopsea: 'Glet + vopsea lavabilă', gips: 'Tavan fals gips-carton + vopsea', fara: '— fără —' },
};

// Marcajele tâmplăriei (F1, F2 … / U1, U2 …), după tip și dimensiuni
export function openingMarks(p) {
  const marks = new Map(), groups = new Map();
  const ops = p.elements.filter(isOpening);
  const key = (o) => [o.type, Math.round(o.width * 100), Math.round(o.height * 100), o.frame || '', o.kind || ''].join('|');
  for (const o of ops) if (!groups.has(key(o))) groups.set(key(o), []);
  for (const o of ops) groups.get(key(o)).push(o);
  let f = 0, u = 0, g = 0;
  const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [, list] of sorted) {
    const m = list[0].type === 'window' ? 'F' + (++f) : list[0].type === 'gap' ? 'G' + (++g) : 'U' + (++u);
    for (const o of list) marks.set(o.id, m);
  }
  return marks;
}

// Încărcări utile (variabile) recomandate, SR EN 1991-1-1 tabel 6.2 (valori uzuale; se pot modifica)
export const USES = {
  A: { name: 'A – Locuințe (planșee)', q: 1.5 },
  A_sc: { name: 'A – Scări', q: 2.0 },
  A_bal: { name: 'A – Balcoane', q: 2.5 },
  B: { name: 'B – Birouri', q: 2.5 },
  C1: { name: 'C1 – Spații cu mese (școli, cafenele)', q: 3.0 },
  C3: { name: 'C3 – Spații fără obstacole (săli, holuri publice)', q: 4.0 },
  D1: { name: 'D1 – Magazine', q: 4.0 },
  E1: { name: 'E1 – Depozite', q: 7.5 },
  F: { name: 'F – Garaje autoturisme', q: 2.5 },
  H: { name: 'H – Terase necirculabile', q: 0.4 },
  I: { name: 'I – Terase circulabile', q: 1.5 },
  sol: { name: 'Placă pe sol', q: 2.0 },
};

export const TYPE_NAMES = {
  wall: 'Perete', door: 'Ușă', window: 'Fereastră', gap: 'Gol în perete', slab: 'Placă', column: 'Stâlp', beam: 'Grindă', roof: 'Acoperiș', zone: 'Zonă (cameră)', dim: 'Cotă', footing: 'Fundație',
};

// Setări implicite ale uneltelor (ce se desenează la următorul clic)
export const DEFAULTS = {
  wall: { composite: 'ext_bca30_eps10', thickness: 0.425, height: 2.8, material: 'bca', bearing: true, exterior: true, plaster: 0.02 },
  door: { width: 0.9, height: 2.1, sill: 0, flip: false, name: 'Ușă', frame: 'lemn', kind: 'interioară', lintel: 'auto' },
  window: { width: 1.2, height: 1.4, sill: 0.9, name: 'Fereastră', frame: 'PVC', uw: 1.1, glazing: 'Tripan Low-E', lintel: 'auto' },
  gap: { width: 1.5, height: 2.3, sill: 0, name: 'Gol', lintel: 'auto', lintelH: 0.25 },
  slab: { composite: 'planseu_ba15', thickness: 0.2, offset: 0, material: 'beton', finishes: 1.0, use: 'A', mode: 'rect' },
  footing: { w: 0.6, h: 0.8, depth: 1.1, material: 'beton', steel: 50 },
  column: { w: 0.3, d: 0.3, height: 2.8, material: 'beton' },
  beam: { w: 0.25, h: 0.45, material: 'beton' },
  roof: { composite: 'acoperis_tigla', kind: 'gable', slope: 35, thickness: 0.25, offset: 2.8, axis: 'x', dead: 1.0, material: 'invelitoare', mode: 'rect' },
  zone: { name: 'Cameră', number: '', mode: 'auto', floor: 'parchet', walls: 'vopsea', ceiling: 'vopsea', tileH: 2.1, roomH: 2.65, skirting: true },
  dim: {},
};

export function newProject(name = 'Proiect nou') {
  return {
    version: 1,
    name,
    nextId: 1,
    storeys: [
      { id: 's1', name: 'Parter', elev: 0, height: 3.0 },
      { id: 's2', name: 'Etaj 1', elev: 3.0, height: 3.0 },
    ],
    elements: [],
    loads: { sk: 2.0, Ce: 1.0, Ct: 1.0, partitions: 0.8, sigma: 200, gG: 1.35, gQ: 1.5 },
    created: Date.now(),
  };
}

export function addElement(p, el) {
  el.id = el.id || (el.type[0] + p.nextId++);
  p.elements.push(el);
  return el;
}
export const byId = (p, id) => p.elements.find((e) => e.id === id);
export const storeyOf = (p, el) => p.storeys.find((s) => s.id === el.storey) || p.storeys[0];
export const sortedStoreys = (p) => [...p.storeys].sort((a, b) => a.elev - b.elev);

// ---------------------------------------------------------------- Geometrie 2D
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const len = (a) => Math.hypot(a[0], a[1]);
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const perp = (a) => [-a[1], a[0]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

export function projectOnSegment(p, a, b) {
  const ab = sub(b, a), L2 = dot(ab, ab) || 1e-12;
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / L2));
  const q = add(a, mul(ab, t));
  return { t, q, d: dist(p, q), along: t * Math.sqrt(L2) };
}
export function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return s / 2;
}
export function polyPerimeter(pts) { let s = 0; for (let i = 0; i < pts.length; i++) s += dist(pts[i], pts[(i + 1) % pts.length]); return s; }
export function polyCentroid(pts) {
  let A = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], f = a[0] * b[1] - b[0] * a[1];
    A += f; cx += (a[0] + b[0]) * f; cy += (a[1] + b[1]) * f;
  }
  if (Math.abs(A) < 1e-9) return pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]);
  return [cx / (3 * A), cy / (3 * A)];
}
export function pointInPoly(p, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function bbox(pts) {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

// ---------------------------------------------------------------- Pereți și goluri
export const wallLength = (w) => dist(w.a, w.b);
export const isOpening = (e) => e.type === 'door' || e.type === 'window' || e.type === 'gap';
export const openingsOf = (p, w) => p.elements.filter((e) => isOpening(e) && e.wall === w.id);

// Capetele pereților care se întâlnesc într-un colț se prelungesc cu jumătate de grosime, ca să se închidă colțul.
export function wallExtensions(p, w) {
  const others = p.elements.filter((e) => e.type === 'wall' && e !== w && e.storey === w.storey);
  const ext = (pt) => (others.some((o) => dist(o.a, pt) < 0.01 || dist(o.b, pt) < 0.01) ? w.thickness / 2 : 0);
  return [ext(w.a), ext(w.b)];
}

// Contur 2D al peretelui (patrulater), cu prelungirile de colț
export function wallOutline(p, w) {
  const d = norm(sub(w.b, w.a)), n = perp(d), h = w.thickness / 2;
  const [e0, e1] = wallExtensions(p, w);
  const a = sub(w.a, mul(d, e0)), b = add(w.b, mul(d, e1));
  return [add(a, mul(n, h)), add(b, mul(n, h)), sub(b, mul(n, h)), sub(a, mul(n, h))];
}

// Segmentele pline ale peretelui în coordonate locale: [u0, u1, z0, z1] (u de-a lungul axei, z de la baza peretelui)
export function wallPieces(p, w) {
  const L = wallLength(w);
  const [e0, e1] = wallExtensions(p, w);
  const ops = openingsOf(p, w).map((o) => ({ u0: o.pos - o.width / 2, u1: o.pos + o.width / 2, z0: o.sill, z1: Math.min(w.height, o.sill + o.height) }))
    .filter((o) => o.u1 > 0 && o.u0 < L).sort((a, b) => a.u0 - b.u0);
  const out = [];
  let u = -e0;
  for (const o of ops) {
    if (o.u0 > u) out.push([u, o.u0, 0, w.height]);
    if (o.z0 > 0) out.push([Math.max(o.u0, u), o.u1, 0, o.z0]);
    if (o.z1 < w.height) out.push([Math.max(o.u0, u), o.u1, o.z1, w.height]);
    u = Math.max(u, o.u1);
  }
  if (L + e1 > u) out.push([u, L + e1, 0, w.height]);
  return out;
}

// ---------------------------------------------------------------- Cantități
export function quantities(p, el) {
  const m = MATERIALS[el.material] || null;
  const r2 = (v) => Math.round(v * 100) / 100;
  switch (el.type) {
    case 'wall': {
      const L = wallLength(el);
      const ops = openingsOf(p, el);
      const opA = ops.reduce((s, o) => s + o.width * Math.min(o.height, el.height - o.sill), 0);
      const net = L * el.height - opA;
      const ls = layersOf(el);
      const out = { 'Lungime (m)': r2(L), 'Înălțime (m)': r2(el.height), 'Grosime totală (m)': r2(el.thickness), 'Arie goluri (m²)': r2(opA), 'Arie netă (m²)': r2(net) };
      for (const l of ls) out[`${MATERIALS[l.m]?.name || l.m} ${Math.round(l.t * 1000) / 10} cm`] = `${r2(net)} m² · ${r2(net * l.t)} m³`;
      out['Greutate proprie (kN)'] = r2(net * ls.reduce((a, l) => a + l.t * (MATERIALS[l.m]?.gamma || 0), 0));
      return out;
    }
    case 'door': case 'window':
      return { 'Lățime (m)': r2(el.width), 'Înălțime (m)': r2(el.height), 'Parapet (m)': r2(el.sill), 'Arie (m²)': r2(el.width * el.height) };
    case 'slab': {
      const A = Math.abs(polyArea(el.pts));
      const ls = layersOf(el);
      const out = { 'Arie (m²)': r2(A), 'Perimetru (m)': r2(polyPerimeter(el.pts)), 'Grosime totală (m)': r2(el.thickness) };
      for (const l of ls) out[`${MATERIALS[l.m]?.name || l.m} ${Math.round(l.t * 1000) / 10} cm`] = `${r2(A)} m² · ${r2(A * l.t)} m³`;
      out['Greutate proprie (kN)'] = r2(A * ls.reduce((a, l) => a + l.t * (MATERIALS[l.m]?.gamma || 0), 0));
      return out;
    }
    case 'footing': {
      const [e0, e1] = footingExtensions(p, el);
      const L = el.pad ? el.w : dist(el.a, el.b) + e0 + e1;
      const V = L * el.w * el.h;
      return { 'Lungime (m)': r2(L), 'Lățime B (m)': r2(el.w), 'Înălțime (m)': r2(el.h), 'Adâncime fundare (m)': r2(el.depth), 'Beton (m³)': r2(V), 'Cofraj (m²)': r2(2 * L * el.h + (el.pad ? 2 * el.w * el.h : 0)), 'Armătură estimată (kg)': r2(V * (el.steel || 50)), 'Săpătură (m³)': r2(L * (el.w + 0.3) * el.depth) };
    }
    case 'column': {
      const s = storeyOf(p, el);
      void s;
      return { 'Secțiune (m)': `${r2(el.w)} × ${r2(el.d)}`, 'Înălțime (m)': r2(el.height), 'Volum (m³)': r2(el.w * el.d * el.height), 'Greutate proprie (kN)': r2(el.w * el.d * el.height * (m?.gamma || 0)) };
    }
    case 'beam': {
      const L = dist(el.a, el.b);
      return { 'Lungime (m)': r2(L), 'Secțiune (m)': `${r2(el.w)} × ${r2(el.h)}`, 'Volum (m³)': r2(L * el.w * el.h), 'Greutate proprie (kN)': r2(L * el.w * el.h * (m?.gamma || 0)) };
    }
    case 'roof': {
      const A = Math.abs(polyArea(el.pts));
      const k = el.kind === 'flat' ? 1 : 1 / Math.cos(el.slope * Math.PI / 180);
      const out = { 'Arie în plan (m²)': r2(A), 'Arie înclinată (m²)': r2(A * k), 'Pantă': el.kind === 'flat' ? '—' : el.slope + '°' };
      if (el.composite) for (const l of layersOf(el)) out[MATERIALS[l.m]?.name || l.m] = MATERIALS[l.m]?.kind === 'lemn' ? `${r2(A * k * l.t * 0.12)} m³ (≈12% din volum)` : `${r2(A * k)} m²`;
      return out;
    }
    case 'zone': {
      const A = Math.abs(polyArea(el.pts));
      return { 'Arie utilă (m²)': r2(A), 'Perimetru (m)': r2(polyPerimeter(el.pts)), 'Înălțime liberă (m)': r2(el.roomH || 2.65), 'Volum (m³)': r2(A * (el.roomH || 2.65)), 'Pardoseală': FINISH.floor[el.floor] || '—', 'Pereți': FINISH.walls[el.walls] || '—', 'Tavan': FINISH.ceiling[el.ceiling] || '—' };
    }
    case 'dim':
      return { 'Lungime (m)': r2(dist(el.a, el.b)) };
    default: return {};
  }
}

// Extras de cantități pe categorii de lucrări
export function takeoff(p) {
  const rows = [];
  const acc = new Map();
  const put = (cat, item, unit, v) => {
    const k = cat + '|' + item + '|' + unit;
    acc.set(k, (acc.get(k) || 0) + v);
  };
  for (const el of p.elements) {
    const q = quantities(p, el);
    const s = storeyOf(p, el).name;
    const mat = MATERIALS[el.material]?.name;
    if (el.type === 'wall') {
      put(MATERIALS[el.material]?.kind === 'beton' ? 'Beton armat' : 'Pereți', `${mat}, ${Math.round(el.thickness * 100)} cm`, 'm³', q['Volum (m³)']);
      put('Pereți', `${mat}, ${Math.round(el.thickness * 100)} cm`, 'm²', q['Arie netă (m²)']);
      if (el.plaster) put('Finisaje', 'Tencuieli pereți', 'm²', q['Tencuială 2 fețe (m²)']);
    }
    if (el.type === 'slab') { put('Beton armat', 'Plăci ' + mat, 'm³', q['Volum (m³)']); put('Finisaje', 'Pardoseli', 'm²', q['Arie (m²)']); }
    if (el.type === 'column') put('Beton armat', 'Stâlpi ' + mat, 'm³', q['Volum (m³)']);
    if (el.type === 'beam') put('Beton armat', 'Grinzi ' + mat, 'm³', q['Volum (m³)']);
    if (el.type === 'roof') put('Acoperiș', 'Învelitoare (arie înclinată)', 'm²', q['Arie înclinată (m²)']);
    if (el.type === 'door') put('Tâmplărie', `Uși ${Math.round(el.width * 100)}×${Math.round(el.height * 100)}`, 'buc', 1);
    if (el.type === 'window') put('Tâmplărie', `Ferestre ${Math.round(el.width * 100)}×${Math.round(el.height * 100)}`, 'buc', 1);
    if (el.type === 'zone') put('Suprafețe', `${s} – arie utilă`, 'm²', q['Arie (m²)']);
  }
  for (const [k, v] of acc) { const [cat, item, unit] = k.split('|'); rows.push({ cat, item, unit, qty: Math.round(v * 100) / 100 }); }
  const order = ['Beton armat', 'Pereți', 'Acoperiș', 'Tâmplărie', 'Finisaje', 'Suprafețe'];
  rows.sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat) || a.item.localeCompare(b.item, 'ro'));
  return rows;
}

// Proiect exemplu: casă P+1 mică, desenată cu aceleași unelte
// Grosimea și poziția straturilor structurale (beton / zidărie / lemn) ale unui perete,
// ca decalaje față de axă pe direcția +n (stânga sensului de desen)
export function wallCore(w) {
  const ls = layersOf(w);
  const sgn = w.flipLayers ? 1 : -1;
  let off = sgn * w.thickness / 2, lo = Infinity, hi = -Infinity, t = 0;
  for (const l of ls) {
    const o2 = off - sgn * l.t;
    if (ls.length === 1 || ['beton', 'zidarie', 'lemn', 'otel'].includes(MATERIALS[l.m]?.kind)) { lo = Math.min(lo, off, o2); hi = Math.max(hi, off, o2); t += l.t; }
    off = o2;
  }
  if (!Number.isFinite(lo)) { lo = -w.thickness / 2; hi = w.thickness / 2; t = w.thickness; }
  return { lo, hi, t, mat: coreMaterial(w) };
}
// Buiandrugul unui gol: lungime (cu rezemări), înălțime, material
export const LINTEL_BEARING = 0.25;
export function lintelOf(p, o) {
  const w = byId(p, o.wall);
  if (!w || o.lintel === 'none') return null;
  const core = wallCore(w);
  if (MATERIALS[core.mat]?.kind !== 'zidarie') return null; // doar zidăria are buiandrugi (betonul e monolit, pereții ușori au toc propriu)
  const L = wallLength(w);
  const u0 = Math.max(0, o.pos - o.width / 2 - LINTEL_BEARING), u1 = Math.min(L, o.pos + o.width / 2 + LINTEL_BEARING);
  const z0 = o.sill + o.height;
  const h = Math.min(o.lintelH || 0.25, Math.max(0, w.height - z0));
  if (h <= 0.01) return null;
  return { w, u0, u1, z0, z1: z0 + h, h, len: u1 - u0, core, type: o.lintelType || 'beton', profile: o.lintelProfile };
}
// Reazemele capetelor unei grinzi: peretele (sau stâlpul) pe care stă fiecare capăt
export function beamEndSupports(p, b) {
  return [b.a, b.b].map((pt) => {
    let best = null;
    for (const e of p.elements) {
      if (e.storey !== b.storey) continue;
      let d = Infinity;
      if (e.type === 'wall') d = projectOnSegment(pt, e.a, e.b).d - e.thickness / 2;
      else if (e.type === 'column') d = dist(pt, e.p) - Math.max(e.w, e.d) / 2;
      else continue;
      if (d < 0.4 && (!best || d < best.d)) best = { e, d, pt };
    }
    return best;
  });
}

// Cota fețelor superioare a grinzii: grinzile de beton sunt înglobate în placă (fața de sus = cota nivelului următor);
// cele din oțel și lemn stau sub placa de deasupra.
export function beamTop(p, e) {
  const s = storeyOf(p, e);
  let top = s.elev + s.height;
  if (e.profile || e.material === 'lemn' || e.material === 'otel') {
    const mid = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
    const slab = p.elements.find((x) => x.type === 'slab' && Math.abs(storeyOf(p, x).elev + (x.offset || 0) - top) < 0.05 && pointInPoly(mid, x.pts));
    if (slab) top -= slab.thickness;
  }
  return top;
}

// Fundații continue sub pereții portanți ai nivelului cel mai de jos (și blocuri sub stâlpi).
// widths: lățimi calculate (id perete -> B în m), de ex. din calculul de sarcini.
export function generateFootings(p, widths = {}) {
  const ss = sortedStoreys(p), s0 = ss[0];
  p.elements = p.elements.filter((e) => e.type !== 'footing');
  const D = DEFAULTS.footing;
  const core = (w) => layersOf(w).filter((l) => ['beton', 'zidarie'].includes(MATERIALS[l.m]?.kind)).reduce((a, l) => a + l.t, 0) || w.thickness;
  let n = 0;
  for (const w of p.elements.filter((e) => e.storey === s0.id && e.type === 'wall' && e.bearing)) {
    const B = Math.max(D.w, Math.ceil(((widths[w.id] || 0) * 20)) / 20, Math.ceil((core(w) + 0.2) * 20) / 20);
    addElement(p, { type: 'footing', storey: s0.id, a: w.a.slice(), b: w.b.slice(), wall: w.id, ...D, w: B });
    n++;
  }
  for (const c of p.elements.filter((e) => e.storey === s0.id && e.type === 'column')) {
    const B = Math.max(0.8, Math.ceil(((widths[c.id] || 0) * 20)) / 20);
    addElement(p, { type: 'footing', storey: s0.id, a: [c.p[0] - B / 2, c.p[1]], b: [c.p[0] + B / 2, c.p[1]], column: c.id, ...D, w: B, pad: true });
    n++;
  }
  return n;
}
// Prelungirea capetelor fundațiilor care se întâlnesc în colț (ca la pereți)
export function footingExtensions(p, f) {
  if (f.pad) return [0, 0];
  const others = p.elements.filter((e) => e.type === 'footing' && e !== f && !e.pad);
  const ext = (pt) => (others.some((o) => dist(o.a, pt) < 0.01 || dist(o.b, pt) < 0.01) ? f.w / 2 : 0);
  return [ext(f.a), ext(f.b)];
}

export function sampleProject() {
  const p = newProject('Casă P+1 (exemplu)');
  const W = 10, D = 8;
  const wall = (s, a, b, o = {}) => addElement(p, { type: 'wall', storey: s, a, b, ...DEFAULTS.wall, ...o });
  const op = (type, w, pos, o = {}) => addElement(p, { type, wall: w.id, pos, ...DEFAULTS[type], ...o });
  for (const s of ['s1', 's2']) {
    const S = wall(s, [0, 0], [W, 0]); const E = wall(s, [W, 0], [W, D]); const N = wall(s, [W, D], [0, D]); const V = wall(s, [0, D], [0, 0]);
    const i1 = wall(s, [0, 4.5], [W, 4.5], { composite: 'int_bca25', thickness: compositeThickness('int_bca25'), exterior: false });
    const i2 = wall(s, [5, 0], [5, 4.5], { composite: 'int_gips10', thickness: compositeThickness('int_gips10'), material: 'gips', bearing: false, exterior: false });
    const i3 = wall(s, [4, 4.5], [4, D], { composite: 'int_bca15', thickness: compositeThickness('int_bca15'), bearing: false, exterior: false });
    op('door', i3, 1.6, { width: 0.8 });
    op('window', S, 2.5, { width: 1.8 }); op('window', S, 7.5, { width: 1.8 });
    op('window', E, 2.2); op('window', N, 3, { width: 1.5 }); op('window', V, 6.2, { width: 1 });
    if (s === 's1') op('door', N, 7.5, { width: 1.0, height: 2.2, name: 'Ușă intrare', frame: 'aluminiu', kind: 'exterioară' });
    else op('window', N, 7.5, { width: 1.2 });
    op('door', i1, 2.5); op('door', i1, 7.5); op('door', i2, 3.2, { width: 0.8 });
  }
  addElement(p, { type: 'slab', storey: 's1', pts: [[0.15, 0.15], [W - 0.15, 0.15], [W - 0.15, D - 0.15], [0.15, D - 0.15]], ...DEFAULTS.slab, composite: 'pardoseala_sol', thickness: compositeThickness('pardoseala_sol'), use: 'sol' });
  addElement(p, { type: 'slab', storey: 's2', pts: [[-0.15, -0.15], [W + 0.15, -0.15], [W + 0.15, D + 0.15], [-0.15, D + 0.15]], ...DEFAULTS.slab, composite: 'planseu_ba15_fono', thickness: compositeThickness('planseu_ba15_fono') });
  addElement(p, { type: 'roof', storey: 's2', pts: [[-0.5, -0.5], [W + 0.5, -0.5], [W + 0.5, D + 0.5], [-0.5, D + 0.5]], ...DEFAULTS.roof });
  addElement(p, { type: 'column', storey: 's1', p: [W + 1.6, 2.0], ...DEFAULTS.column, height: 2.8 });
  addElement(p, { type: 'column', storey: 's1', p: [W + 1.6, 6.0], ...DEFAULTS.column, height: 2.8 });
  addElement(p, { type: 'beam', storey: 's1', a: [W + 1.6, 2.0], b: [W + 1.6, 6.0], ...DEFAULTS.beam });
  addElement(p, { type: 'slab', storey: 's2', pts: [[W + 0.15, 1.85], [W + 1.75, 1.85], [W + 1.75, 6.15], [W + 0.15, 6.15]], ...DEFAULTS.slab, composite: 'balcon_ba15', thickness: compositeThickness('balcon_ba15'), use: 'A_bal', finishes: 0.6 });
  const wet = { floor: 'gresie', walls: 'faianta', tileH: 2.1 };
  const zones = [['Living', [0, 0, 5, 4.5]], ['Bucătărie', [5, 0, W, 4.5], { floor: 'gresie', walls: 'faianta', tileH: 1.5 }], ['Hol', [0, 4.5, 4, D], { floor: 'gresie' }], ['Birou', [4, 4.5, W, D]]];
  const zonesUp = [['Dormitor 1', [0, 0, 5, 4.5]], ['Dormitor 2', [5, 0, W, 4.5]], ['Hol', [0, 4.5, 4, D]], ['Baie', [4, 4.5, W, D], wet]];
  for (const [s, list] of [['s1', zones], ['s2', zonesUp]]) {
    list.forEach(([name, [x0, y0, x1, y1], extra], i) => {
      const t = (x, isExt) => (isExt ? 0.2125 : 0.14);
      const pts = [[x0 + t(0, x0 === 0), y0 + t(0, y0 === 0)], [x1 - t(0, x1 === W), y0 + t(0, y0 === 0)], [x1 - t(0, x1 === W), y1 - t(0, y1 === D)], [x0 + t(0, x0 === 0), y1 - t(0, y1 === D)]];
      addElement(p, { type: 'zone', storey: s, pts, ...DEFAULTS.zone, mode: undefined, name, number: (s === 's1' ? 'P.0' : 'E.0') + (i + 1), ...(extra || {}) });
    });
  }
  generateFootings(p);
  addElement(p, { type: 'dim', storey: 's1', a: [0, -0.15], b: [W, -0.15], offset: -1.2 });
  addElement(p, { type: 'dim', storey: 's1', a: [-0.15, 0], b: [-0.15, D], offset: 1.2 });
  return p;
}

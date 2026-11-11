// Antemăsurătoare generată din model: articole pe capitole de deviz, cu detalierea calculului pe elemente.
// Cantitățile se obțin din geometria 3D (pereți pe straturi, plăci, fundații, acoperiș, tâmplărie, finisaje pe camere).
import { profileByName } from './design.js';
import {
  MATERIALS, COMPOSITES, FINISH, layersOf, openingMarks, storeyOf, byId, wallLength, openingsOf, polyArea, polyPerimeter,
  projectOnSegment, dist, footingExtensions, sortedStoreys, bbox, lintelOf, beamEndSupports, wallCore, isOpening,
} from './model.js';

export const CHAPTERS = [
  ['T', 'Terasamente'],
  ['F', 'Fundații'],
  ['S', 'Structură din beton armat'],
  ['Z', 'Zidării și pereți despărțitori'],
  ['A', 'Acoperiș'],
  ['I', 'Termoizolații și hidroizolații'],
  ['M', 'Tâmplărie'],
  ['FI', 'Finisaje interioare'],
  ['P', 'Pardoseli'],
  ['FE', 'Finisaje exterioare'],
];
// armătură estimată (kg/m³ de beton) – valori uzuale de predimensionare
export const STEEL = { footing: 50, slab: 90, slabGround: 35, beam: 130, column: 160, wall: 80, lintel: 110, pad: 90 };
const ROOF_TIMBER = 0.035; // m³ lemn șarpantă pe m² de acoperiș înclinat

const n2 = (v) => Number(v).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cm = (t) => `${Math.round(t * 1000) / 10} cm`.replace('.', ',');

export function computeBOQ(p) {
  const items = new Map();
  const marks = openingMarks(p);
  const label = (e) => {
    if (isOpening(e)) return `${marks.get(e.id)} (${e.id.toUpperCase()})`;
    if (e.type === 'zone') return `${e.number || ''} ${e.name || ''}`.trim();
    return `${{ wall: 'Perete', slab: 'Placă', column: 'Stâlp', beam: 'Grindă', roof: 'Acoperiș', footing: 'Fundație' }[e.type] || e.type} ${e.id.toUpperCase()}`;
  };
  const storeyName = (e) => storeyOf(p, e.wall ? byId(p, e.wall) || e : e).name;
  // adaugă o cantitate la un articol (creat la prima folosire)
  const add = (cap, key, desc, um, qty, el, calc) => {
    if (!(qty > 1e-6)) return;
    if (!items.has(key)) items.set(key, { cap, key, desc, um, qty: 0, det: [] });
    const it = items.get(key);
    it.qty += qty;
    it.det.push({ el: el ? label(el) : '', id: el?.id, storey: el ? storeyName(el) : '', calc, qty });
  };

  // ------------------------------------------------ fundații
  for (const f of p.elements.filter((e) => e.type === 'footing')) {
    const [e0, e1] = footingExtensions(p, f);
    const L = f.pad ? f.w : dist(f.a, f.b) + e0 + e1;
    const V = L * f.w * f.h;
    const exc = L * (f.w + 0.3) * f.depth;
    add('T', 'sapatura', 'Săpătură mecanizată pentru fundații, cu taluz vertical, inclusiv finisare manuală', 'm³', exc, f, `${n2(L)} × (${n2(f.w)} + 0,30) × ${n2(f.depth)}`);
    add('T', 'umplutura', 'Umplutură compactată în straturi, cu pământ din săpătură', 'm³', Math.max(0, exc - V), f, `${n2(exc)} − ${n2(V)} (beton)`);
    add('T', 'transport', 'Transport pământ excedentar cu autobasculanta', 'm³', V, f, `volum fundație ${n2(V)}`);
    add('F', 'beton_egal', 'Beton de egalizare C8/10, 5 cm', 'm³', L * f.w * 0.05, f, `${n2(L)} × ${n2(f.w)} × 0,05`);
    add('F', 'beton_fund', `Beton armat C20/25 în fundații ${f.pad ? 'izolate' : 'continue'}`, 'm³', V, f, `${n2(L)} × ${n2(f.w)} × ${n2(f.h)}`);
    add('F', 'cofraj_fund', 'Cofraj din panouri pentru fundații', 'm²', 2 * L * f.h + (f.pad ? 2 * f.w * f.h : 0), f, f.pad ? `2 × (${n2(f.w)} + ${n2(f.w)}) × ${n2(f.h)}` : `2 × ${n2(L)} × ${n2(f.h)}`);
    add('F', 'arm_fund', 'Armătură BST500S în fundații (estimată)', 'kg', V * (f.steel || STEEL.footing), f, `${n2(V)} m³ × ${f.steel || STEEL.footing} kg/m³`);
  }

  // ------------------------------------------------ stâlpi și grinzi
  for (const c of p.elements.filter((e) => e.type === 'column')) {
    const V = c.w * c.d * c.height;
    const prc = c.profile && profileByName(c.profile);
    if (prc) {
      add('S', 'otel_st_' + prc.name.replace(' ', '') + (c.grade || 'S235'), `Stâlpi din oțel laminat ${prc.name} ${c.grade || 'S235'}, cu plăci de bază, montați, inclusiv protecție anticorozivă`, 'kg', prc.G * c.height * 1.1, c, `${n2(c.height)} m × ${prc.G} kg/m × 1,10 (plăci, prinderi)`);
      continue;
    }
    if (MATERIALS[c.material]?.kind === 'beton') {
      add('S', 'beton_stalpi', 'Beton armat C25/30 în stâlpi', 'm³', V, c, `${n2(c.w)} × ${n2(c.d)} × ${n2(c.height)}`);
      add('S', 'cofraj_stalpi', 'Cofraj pentru stâlpi', 'm²', 2 * (c.w + c.d) * c.height, c, `2 × (${n2(c.w)} + ${n2(c.d)}) × ${n2(c.height)}`);
      add('S', 'arm_stalpi', 'Armătură BST500S în stâlpi (estimată)', 'kg', V * STEEL.column, c, `${n2(V)} m³ × ${STEEL.column} kg/m³`);
    } else add('S', 'stalpi_' + c.material, `Stâlpi din ${MATERIALS[c.material]?.name || c.material}`, 'm³', V, c, `${n2(c.w)} × ${n2(c.d)} × ${n2(c.height)}`);
  }
  for (const b of p.elements.filter((e) => e.type === 'beam')) {
    const L = dist(b.a, b.b), V = L * b.w * b.h;
    const pr = b.profile && profileByName(b.profile);
    if (pr) {
      add('S', 'otel_' + pr.name.replace(' ', '') + (b.grade || 'S235'), `Grinzi din oțel laminat ${pr.name} ${b.grade || 'S235'}, montate, inclusiv protecție anticorozivă`, 'kg', pr.G * L * 1.05, b, `${n2(L)} m × ${pr.G} kg/m × 1,05 (prinderi)`);
      continue;
    }
    if (MATERIALS[b.material]?.kind === 'beton') {
      add('S', 'beton_grinzi', 'Beton armat C25/30 în grinzi', 'm³', V, b, `${n2(L)} × ${n2(b.w)} × ${n2(b.h)}`);
      add('S', 'cofraj_grinzi', 'Cofraj pentru grinzi', 'm²', L * (2 * b.h + b.w), b, `${n2(L)} × (2 × ${n2(b.h)} + ${n2(b.w)})`);
      add('S', 'arm_grinzi', 'Armătură BST500S în grinzi (estimată)', 'kg', V * STEEL.beam, b, `${n2(V)} m³ × ${STEEL.beam} kg/m³`);
    } else add('S', 'grinzi_' + b.material, `Grinzi din ${MATERIALS[b.material]?.name || b.material}`, 'm³', V, b, `${n2(L)} × ${n2(b.w)} × ${n2(b.h)}`);
  }

  // ------------------------------------------------ cuzineți sub capetele grinzilor rezemate pe zidărie
  const padArea = new Map(); // perete → aria din elevație ocupată de cuzineți (se scade din zidărie)
  for (const b of p.elements.filter((e) => e.type === 'beam' && e.padA > 0)) {
    for (const sup of beamEndSupports(p, b)) {
      if (!sup || sup.e.type !== 'wall') continue;
      const t = wallCore(sup.e).t, a = b.padA, h = b.padH || 0.2, V = a * t * h;
      padArea.set(sup.e.id, (padArea.get(sup.e.id) || 0) + a * h);
      add('S', 'beton_cuzineti', 'Beton armat C25/30 în cuzineți (reazemele grinzilor pe zidărie)', 'm³', V, b, `${n2(a)} × ${n2(t)} × ${n2(h)} (pe ${sup.e.id.toUpperCase()})`);
      add('S', 'cofraj_cuzineti', 'Cofraj pentru cuzineți', 'm²', 2 * a * h + 2 * t * h, b, `2 × (${n2(a)} + ${n2(t)}) × ${n2(h)}`);
      add('S', 'arm_cuzineti', 'Armătură BST500S în cuzineți (estimată)', 'kg', V * STEEL.pad, b, `${n2(V)} m³ × ${STEEL.pad} kg/m³`);
    }
  }

  // ------------------------------------------------ buiandrugi peste goluri
  const lintelArea = new Map();
  for (const o of p.elements.filter(isOpening)) {
    const lin = lintelOf(p, o);
    if (!lin) continue;
    lintelArea.set(lin.w.id, (lintelArea.get(lin.w.id) || 0) + lin.len * lin.h);
    const t = lin.core.t;
    const pr = lin.type === 'otel' && lin.profile && profileByName(lin.profile);
    if (pr) {
      const n = o.lintelN || 1;
      add('S', 'otel_buiandrugi', `Buiandrugi din profile laminate, montați, inclusiv protecție anticorozivă`, 'kg', n * pr.G * lin.len, o, `${n} × ${pr.name} × ${n2(lin.len)} m × ${pr.G} kg/m`);
    } else {
      const V = lin.len * t * lin.h;
      add('S', 'beton_buiandrugi', 'Beton armat C25/30 în buiandrugi', 'm³', V, o, `${n2(lin.len)} × ${n2(t)} × ${n2(lin.h)}`);
      add('S', 'cofraj_buiandrugi', 'Cofraj pentru buiandrugi (fețe laterale + intrados peste gol)', 'm²', 2 * lin.len * lin.h + o.width * t, o, `2 × ${n2(lin.len)} × ${n2(lin.h)} + ${n2(o.width)} × ${n2(t)}`);
      add('S', 'arm_buiandrugi', 'Armătură BST500S în buiandrugi (estimată)', 'kg', V * STEEL.lintel, o, `${n2(V)} m³ × ${STEEL.lintel} kg/m³`);
    }
  }

  // ------------------------------------------------ pereți (pe straturi)
  for (const w of p.elements.filter((e) => e.type === 'wall')) {
    const L = wallLength(w);
    const ops = openingsOf(p, w);
    const opA = ops.reduce((a, o) => a + o.width * Math.min(o.height, w.height - o.sill), 0);
    const net = L * w.height - opA;
    const base = `${n2(L)} × ${n2(w.height)}${opA ? ` − ${n2(opA)} goluri` : ''}`;
    const ls = layersOf(w);
    const isGips = ls.some((l) => l.m === 'gips_placa') && !ls.some((l) => ['beton', 'zidarie'].includes(MATERIALS[l.m]?.kind));
    if (isGips) {
      add('Z', 'gips_' + Math.round(w.thickness * 100), `Pereți despărțitori din gips-carton pe structură metalică, ${cm(w.thickness)}, cu vată minerală`, 'm²', net, w, base);
      continue;
    }
    let plasterCount = 0;
    for (const l of ls) {
      const m = MATERIALS[l.m];
      const k = m?.kind;
      if (k === 'zidarie') {
        const ded = (lintelArea.get(w.id) || 0) + (padArea.get(w.id) || 0);
        add('Z', `zid_${l.m}_${Math.round(l.t * 1000)}`, `Zidărie din ${m.short || m.name}, ${cm(l.t)}${w.bearing ? ', portantă' : ''}`, 'm³', (net - ded) * l.t, w, `(${base}${ded ? ` − ${n2(ded)} buiandrugi/cuzineți` : ''}) × ${n2(l.t)}`);
      }
      else if (k === 'beton') {
        add('S', 'beton_pereti', 'Beton armat C25/30 în pereți', 'm³', net * l.t, w, `(${base}) × ${n2(l.t)}`);
        add('S', 'cofraj_pereti', 'Cofraj pentru pereți (ambele fețe)', 'm²', 2 * net, w, `2 × (${base})`);
        add('S', 'arm_pereti', 'Armătură BST500S în pereți (estimată)', 'kg', net * l.t * STEEL.wall, w, `${n2(net * l.t)} m³ × ${STEEL.wall} kg/m³`);
      } else if (k === 'izolatie') add('I', `termo_fat_${l.m}_${Math.round(l.t * 100)}`, `Termosistem fațadă cu ${m.short || m.name}, ${cm(l.t)}, dibluri, plasă și masă de șpaclu`, 'm²', net, w, base);
      else if (k === 'hidro') add('I', 'hidro_vert', 'Hidroizolație verticală pentru pereți în contact cu solul', 'm²', net, w, base);
      else if (l.m === 'tenc_ext') add('FE', 'tenc_dec', 'Tencuială decorativă exterioară, inclusiv amorsă', 'm²', net, w, base);
      else if (l.m === 'tenc_int') { plasterCount++; add('FI', 'tenc_int', 'Tencuieli interioare drișcuite, var-ciment', 'm²', net, w, `${base} (fața ${plasterCount})`); }
      else if (k === 'usor' || k === 'lemn') add('Z', `pereti_${l.m}`, `Pereți din ${m.name.toLowerCase()}, ${cm(l.t)}`, 'm²', net, w, base);
    }
    if (!w.composite && w.plaster) add('FI', 'tenc_int', 'Tencuieli interioare drișcuite, var-ciment', 'm²', 2 * net, w, `2 × (${base})`);
    // glafuri la ferestrele din pereți exteriori
    if (w.exterior) for (const o of ops.filter((x) => x.type === 'window')) {
      add('FE', 'glaf_ext', 'Glafuri exterioare din tablă vopsită / aluminiu', 'm', o.width, o, `${n2(o.width)}`);
      add('FI', 'glaf_int', 'Glafuri interioare PVC', 'm', o.width, o, `${n2(o.width)}`);
    }
  }

  // ------------------------------------------------ plăci (pe straturi)
  for (const s of p.elements.filter((e) => e.type === 'slab')) {
    const A = Math.abs(polyArea(s.pts));
    const ground = s.use === 'sol';
    for (const l of layersOf(s)) {
      const m = MATERIALS[l.m], k = m?.kind;
      if (k === 'beton') {
        add('S', ground ? 'beton_placa_sol' : 'beton_placi', ground ? 'Beton armat C25/30 în placa pe sol' : 'Beton armat C25/30 în plăci', 'm³', A * l.t, s, `${n2(A)} × ${n2(l.t)}`);
        if (!ground) add('S', 'cofraj_placi', 'Cofraj pentru plăci (intrados + borduri)', 'm²', A + polyPerimeter(s.pts) * l.t, s, `${n2(A)} + ${n2(polyPerimeter(s.pts))} × ${n2(l.t)}`);
        add('S', ground ? 'arm_placa_sol' : 'arm_placi', ground ? 'Plasă sudată / armătură în placa pe sol (estimată)' : 'Armătură BST500S în plăci (estimată)', 'kg', A * l.t * (ground ? STEEL.slabGround : STEEL.slab), s, `${n2(A * l.t)} m³ × ${ground ? STEEL.slabGround : STEEL.slab} kg/m³`);
        if (ground) {
          add('T', 'pietris', 'Strat de pietriș compactat sub placa pe sol, 15 cm', 'm³', A * 0.15, s, `${n2(A)} × 0,15`);
        }
      } else if (k === 'sapa') add('P', `sapa_${Math.round(l.t * 100)}`, `Șapă ciment-nisip, ${cm(l.t)}, armată cu plasă`, 'm²', A, s, n2(A));
      else if (k === 'izolatie') add('I', `termo_pard_${l.m}_${Math.round(l.t * 100)}`, `Termo-/fonoizolație orizontală din ${m.short || m.name}, ${cm(l.t)}`, 'm²', A, s, n2(A));
      else if (l.m === 'hidro') add('I', 'hidro_oriz', 'Hidroizolație orizontală din membrană bituminoasă', 'm²', A, s, n2(A));
      else if (l.m === 'bariera') add('I', 'bariera', 'Barieră de vapori', 'm²', A, s, n2(A));
    }
    if (!s.composite) add('S', 'beton_placi', 'Beton armat C25/30 în plăci', 'm³', A * s.thickness, s, `${n2(A)} × ${n2(s.thickness)}`);
  }

  // ------------------------------------------------ acoperiș
  for (const r of p.elements.filter((e) => e.type === 'roof')) {
    const A = Math.abs(polyArea(r.pts));
    const k = r.kind === 'flat' ? 1 : 1 / Math.cos(r.slope * Math.PI / 180);
    const As = A * k;
    const calc = r.kind === 'flat' ? n2(A) : `${n2(A)} / cos ${r.slope}°`;
    if (r.kind === 'flat') { add('A', 'terasa', 'Acoperiș terasă (vezi straturile plăcii)', 'm²', A, r, calc); continue; }
    const ls = r.composite ? layersOf(r) : [{ m: 'tigla', t: 0.04 }, { m: 'capriori', t: 0.2 }];
    for (const l of ls) {
      if (l.m === 'tigla') add('A', 'tigla', 'Învelitoare din țiglă ceramică, pe șipci și contrașipci, inclusiv coame și accesorii', 'm²', As, r, calc);
      else if (l.m === 'folie') add('A', 'folie', 'Folie anticondens difuzie-deschisă', 'm²', As, r, calc);
      else if (l.m === 'capriori') add('A', 'sarpanta', 'Șarpantă din lemn ecarisat de rășinoase, tratat ignifug și antiseptic', 'm³', As * ROOF_TIMBER, r, `${n2(As)} m² × ${ROOF_TIMBER} m³/m²`);
      else if (l.m === 'vata' || l.m === 'eps') add('I', `termo_acop_${Math.round(l.t * 100)}`, `Termoizolație din vată minerală între și sub căpriori, ${cm(l.t)}`, 'm²', As, r, calc);
      else if (l.m === 'bariera') add('I', 'bariera', 'Barieră de vapori', 'm²', As, r, calc);
      else if (l.m === 'gips_placa') add('FI', 'tavan_mansarda', 'Placare gips-carton la mansardă / tavan înclinat, pe structură metalică', 'm²', As, r, calc);
    }
    const b = bbox(r.pts);
    const eaves = r.kind === 'gable' ? 2 * (r.axis === 'x' ? b.x1 - b.x0 : b.y1 - b.y0) : (r.axis === 'x' ? b.x1 - b.x0 : b.y1 - b.y0);
    add('A', 'jgheab', 'Jgheaburi din tablă, cu cârlige și accesorii', 'm', eaves, r, r.kind === 'gable' ? `2 × ${n2(eaves / 2)}` : n2(eaves));
    add('A', 'burlane', 'Burlane din tablă (estimat: 2 pe jgheab, pe înălțimea clădirii)', 'm', (r.kind === 'gable' ? 4 : 2) * (storeyOf(p, r).elev + (r.offset ?? storeyOf(p, r).height)), r, `${r.kind === 'gable' ? 4 : 2} × ${n2(storeyOf(p, r).elev + (r.offset ?? storeyOf(p, r).height))}`);
  }

  // ------------------------------------------------ tâmplărie
  for (const o of p.elements.filter((e) => e.type === 'door' || e.type === 'window')) {
    const m = marks.get(o.id);
    const dims = `${Math.round(o.width * 100)}×${Math.round(o.height * 100)} cm`;
    if (o.type === 'window') add('M', 'tmpl_' + m, `Fereastră ${m}: ${o.frame || 'PVC'}, ${o.glazing || 'geam termoizolant'}, ${dims}${o.uw ? `, Uw ≤ ${String(o.uw).replace('.', ',')} W/m²K` : ''}`, 'buc', 1, o, `1 buc (${n2(o.width * o.height)} m²)`);
    else add('M', 'tmpl_' + m, `Ușă ${m}: ${o.kind || 'interioară'}, ${o.frame || 'lemn'}, ${dims}`, 'buc', 1, o, `1 buc (${n2(o.width * o.height)} m²)`);
  }

  // ------------------------------------------------ finisaje pe camere
  for (const z of p.elements.filter((e) => e.type === 'zone')) {
    const A = Math.abs(polyArea(z.pts)), P = polyPerimeter(z.pts);
    const H = z.roomH || 2.65;
    // golurile din pereții care mărginesc camera
    const near = [];
    for (const w of p.elements.filter((e) => e.type === 'wall' && e.storey === z.storey)) {
      for (const o of openingsOf(p, w)) {
        const d = [Math.cos(Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0])), Math.sin(Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]))];
        const c = [w.a[0] + d[0] * o.pos, w.a[1] + d[1] * o.pos];
        let md = Infinity;
        for (let i = 0; i < z.pts.length; i++) md = Math.min(md, projectOnSegment(c, z.pts[i], z.pts[(i + 1) % z.pts.length]).d);
        if (md < w.thickness / 2 + 0.08) near.push(o);
      }
    }
    const opA = near.reduce((a, o) => a + o.width * Math.min(o.height, H - o.sill), 0);
    const doorW = near.filter((o) => o.type === 'door').reduce((a, o) => a + o.width, 0);
    const wallA = Math.max(0, P * H - opA);
    const fl = z.floor || 'parchet';
    if (fl !== 'fara') add('P', 'pard_' + fl, `Pardoseală din ${FINISH.floor[fl].toLowerCase()}, inclusiv adeziv / strat suport`, 'm²', A, z, n2(A));
    if (z.skirting !== false && fl !== 'fara') add('P', 'plinta_' + (fl === 'gresie' ? 'gresie' : 'lemn'), fl === 'gresie' ? 'Plintă din gresie' : 'Plintă MDF / lemn', 'm', Math.max(0, P - doorW), z, `${n2(P)} − ${n2(doorW)} uși`);
    let tileA = 0;
    if (z.walls === 'faianta') {
      const th = Math.min(z.tileH || 2.1, H);
      const opT = near.reduce((a, o) => a + o.width * Math.max(0, Math.min(th, o.sill + o.height) - o.sill), 0);
      tileA = Math.max(0, P * th - opT);
      add('FI', 'faianta', 'Placaje cu faianță pe pereți, inclusiv adeziv și chit de rosturi', 'm²', tileA, z, `${n2(P)} × ${n2(th)} − ${n2(opT)} goluri`);
    }
    if (z.walls !== 'fara') {
      const paint = Math.max(0, wallA - tileA);
      add('FI', 'glet_pereti', 'Glet de ipsos pe pereți', 'm²', paint, z, `${n2(P)} × ${n2(H)} − ${n2(opA)} goluri${tileA ? ` − ${n2(tileA)} faianță` : ''}`);
      add('FI', 'vopsea_pereti', 'Vopsitorii lavabile pe pereți, 2 straturi, inclusiv amorsă', 'm²', paint, z, `idem glet: ${n2(paint)}`);
    }
    if (z.ceiling === 'gips') add('FI', 'tavan_fals', 'Tavan fals din gips-carton pe structură metalică', 'm²', A, z, n2(A));
    if (z.ceiling && z.ceiling !== 'fara') {
      add('FI', 'glet_tavan', 'Glet de ipsos pe tavane', 'm²', A, z, n2(A));
      add('FI', 'vopsea_tavan', 'Vopsitorii lavabile pe tavane, 2 straturi', 'm²', A, z, n2(A));
    }
  }

  // ------------------------------------------------ rezultat pe capitole
  const chapters = CHAPTERS.map(([id, name]) => ({ id, name, items: [...items.values()].filter((i) => i.cap === id) })).filter((c) => c.items.length);
  const tm = chapters.find((c) => c.id === 'M');
  if (tm) tm.items.sort((a, b) => a.key.localeCompare(b.key, 'ro', { numeric: true }));
  let nr = 0;
  for (const c of chapters) for (const it of c.items) { it.nr = ++nr; it.qty = Math.round(it.qty * 100) / 100; }
  return { chapters, marks };
}

// Tabelul tâmplăriei (grupat pe marcaje)
export function joinerySchedule(p) {
  const marks = openingMarks(p);
  const g = new Map();
  for (const o of p.elements.filter((e) => e.type === 'door' || e.type === 'window')) {
    const m = marks.get(o.id);
    if (!g.has(m)) g.set(m, { mark: m, o, count: 0, storeys: new Set(), ids: [] });
    const r = g.get(m);
    r.count++; r.ids.push(o.id);
    r.storeys.add(storeyOf(p, byId(p, o.wall) || o).name);
  }
  return [...g.values()].sort((a, b) => a.mark.localeCompare(b.mark, 'ro', { numeric: true }));
}

// Tabelul camerelor (cu finisaje)
export function roomSchedule(p) {
  const out = [];
  for (const s of sortedStoreys(p)) {
    for (const z of p.elements.filter((e) => e.type === 'zone' && e.storey === s.id)) {
      const A = Math.abs(polyArea(z.pts));
      out.push({ z, storey: s.name, A, P: polyPerimeter(z.pts), H: z.roomH || 2.65 });
    }
  }
  return out;
}
export { COMPOSITES };

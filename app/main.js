// BIM Studio – Proiectare: interfața aplicației (unelte, proprietăți, niveluri, cantități, sarcini, export).
import { MATERIALS, USES, TYPE_NAMES, COMPOSITES, FINISH, newProject, sampleProject, quantities, byId, sortedStoreys, storeyOf, polyArea, compositeThickness, coreMaterial, generateFootings, openingMarks, lintelOf, beamEndSupports, wallCore, LINTEL_BEARING } from './model.js';
import { PROFILES, profileByName } from './design.js';
import { A, emit, on, snapshot, undo, redo, deleteElements } from './state.js';
import { PlanEditor, linkedEnds, syncFootings } from './editor2d.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? '—' : Number(v).toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d }));
let toastT;
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }

// ---------------------------------------------------------------- încărcare / salvare locală
const KEY = 'cad:project';
try { const s = localStorage.getItem(KEY); A.p = s ? JSON.parse(s) : sampleProject(); } catch { A.p = sampleProject(); }
A.storey = sortedStoreys(A.p)[0].id;
let saveT;
function autosave() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(A.p)); } catch { toast('Proiectul nu a putut fi salvat local (spațiu plin?)'); } }, 400); }

// ---------------------------------------------------------------- editoare
const plan = new PlanEditor($('#plan'), {
  numBox: $('#num'),
  status: (msg, err) => { const s = $('#status'); s.textContent = msg; s.className = err ? 'err' : ''; if (err) toast(msg); },
  onDraw: () => updateDrawbar(),
});
const narrow = matchMedia('(max-width: 1100px)');
const touchy = matchMedia('(pointer: coarse)');
document.addEventListener('gesturestart', (e) => e.preventDefault()); // fără zoom al paginii în iOS

// ---------------------------------------------------------------- bara de desen și foaia de proprietăți (telefon / iPad)
function updateDrawbar() {
  const n = plan.draw?.pts.length || 0;
  const poly = ['slab', 'zone', 'roof'].includes(A.tool) && A.defaults[A.tool].mode === 'poly';
  const show = A.tool !== 'select' && (n > 0 || touchy.matches);
  $('#drawbar').hidden = !show;
  document.body.classList.toggle('drawing', show);
  const lineTool = ['wall', 'beam'].includes(A.tool) || poly;
  $('#d-len').hidden = $('#d-ang').hidden = $('#d-ok').hidden = !(lineTool && n > 0);
  $('#d-close').hidden = !(poly && n >= 3);
  $('#d-done').hidden = $('#d-cancel').hidden = n === 0;
  if (show && n === 0 && touchy.matches) {
    // înainte de primul punct: doar indicația
    $('#d-done').hidden = true; $('#d-cancel').hidden = false; $('#d-cancel').textContent = 'Închide unealta';
  } else $('#d-cancel').textContent = 'Anulează';
}
const typed = () => {
  const L = parseFloat($('#d-len').value.replace(',', '.'));
  const a = $('#d-ang').value.replace(',', '.').trim();
  if (!(L > 0)) { toast('Scrie lungimea în metri, ex. 4,5'); return; }
  plan.typed(L, a === '' ? '' : parseFloat(a));
  $('#d-len').value = ''; $('#d-ang').value = '';
};
$('#d-ok').onclick = typed;
for (const id of ['#d-len', '#d-ang']) $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); typed(); } });
$('#d-close').onclick = () => plan.closePoly();
$('#d-done').onclick = () => { plan.finishDraw(true); };
$('#d-cancel').onclick = () => { if (!plan.draw?.pts.length) { setTool('select'); return; } plan.cancelDraw(); };
const openSheet = (on) => document.body.classList.toggle('sheet', on);
$('#side-close').onclick = () => openSheet(false);
$('#b-settings').onclick = () => openSheet(!document.body.classList.contains('sheet'));
let view3d = null;
async function ensure3D() {
  if (view3d) return view3d;
  const { View3D } = await import('./view3d.js');
  view3d = new View3D($('#v3d'));
  return view3d;
}

// ---------------------------------------------------------------- unelte
const ICONS = {
  select: '<path d="M5 3l13 8-6 1.5L9 19z"/>',
  wall: '<path d="M3 9h18v6H3z"/><path d="M7 9v6M12 9v6M17 9v6"/>',
  door: '<path d="M4 20V4"/><path d="M4 4a16 16 0 0116 16"/><path d="M4 20h16" stroke-dasharray="2 2"/>',
  gap: '<path d="M3 7h18v3H3z"/><path d="M3 10v10M21 10v10M8 10v10M16 10v10" stroke-dasharray="2 2"/>',
  window: '<path d="M3 9h18v6H3z"/><path d="M3 12h18M8 9v6M16 9v6"/>',
  slab: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M3 9v3l9 5 9-5V9"/>',
  column: '<path d="M8 3h8v18H8z"/><path d="M8 3l8 18M16 3L8 21"/>',
  beam: '<path d="M2 9h20v5H2z" stroke-dasharray="3 2"/>',
  roof: '<path d="M2 13l10-8 10 8"/><path d="M5 11v8h14v-8"/>',
  zone: '<path d="M4 4h16v16H4z" stroke-dasharray="3 2"/><path d="M8 13h8M10 10h4"/>',
  dim: '<path d="M3 17h18M3 13v8M21 13v8"/><path d="M8 9h8"/>',
  footing: '<path d="M7 4v8M17 4v8"/><path d="M3 12h18v6H3z"/><path d="M3 21h18" stroke-dasharray="2 2"/>',
};
const TOOLS = [['select', 'Selecție', 'V'], 'hr', ['wall', 'Perete', 'W'], ['door', 'Ușă', 'D'], ['window', 'Fereastră', 'F'], ['gap', 'Gol', 'G'], ['column', 'Stâlp', 'C'], ['beam', 'Grindă', 'B'], ['slab', 'Placă', 'S'], ['roof', 'Acoperiș', 'R'], ['footing', 'Fundație', 'T'], 'hr', ['zone', 'Zonă', 'Z'], ['dim', 'Cotă', 'Q']];
function renderTools() {
  $('#tools').innerHTML = TOOLS.map((t) => (t === 'hr' ? '<hr>' : `<button data-tool="${t[0]}" class="${A.tool === t[0] ? 'on' : ''}" title="${t[1]} (${t[2]})"><kbd>${t[2]}</kbd><svg viewBox="0 0 24 24">${ICONS[t[0]]}</svg>${t[1]}</button>`)).join('');
}
function setTool(t) {
  plan.cancelDraw();
  A.tool = t;
  if (t !== 'select') { A.sel.clear(); }
  renderTools(); renderSide(); plan.status(); plan.invalidate(); view3d?.invalidate('sel');
  updateDrawbar();
  if (narrow.matches) openSheet(false);
  if (touchy.matches && t !== 'select') toast(TOUCH_HINTS[t] || '', 3500);
  if (!touchy.matches) $('#plan').focus();
}
const TOUCH_HINTS = {
  wall: 'Pune degetul și trage: punctul portocaliu (deasupra degetului) se prinde de colțuri. Ridică degetul ca să-l pui.',
  beam: 'Ca la pereți: țintești cu punctul de deasupra degetului și ridici degetul.',
  slab: 'Atinge în interiorul pereților sau desenează colțurile – modul se alege din Setări.',
  zone: 'Atinge în interiorul unei camere: conturul se detectează din pereți.',
  roof: 'Pune două colțuri opuse (cu streașina). Tipul și panta se aleg din Setări.',
  door: 'Atinge un perete. Partea pe care atingi alege sensul de deschidere.', window: 'Atinge un perete.', gap: 'Atinge un perete: se face golul, cu buiandrug deasupra.',
  column: 'Atinge locul stâlpului.', dim: 'Atinge primul punct, al doilea, apoi locul liniei de cotă.',
};
$('#tools').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });

// ---------------------------------------------------------------- niveluri
function renderStoreys() {
  const ss = sortedStoreys(A.p).reverse();
  $('#storey').innerHTML = ss.map((s) => `<option value="${s.id}" ${s.id === A.storey ? 'selected' : ''}>${esc(s.name)} (${s.elev >= 0 ? '+' : ''}${fmt(s.elev)})</option>`).join('');
}
$('#storey').onchange = (e) => { A.storey = e.target.value; plan.cancelDraw(); A.sel.clear(); emit('storey'); };
$('#b-storeys').onclick = storeysDialog;

// ---------------------------------------------------------------- mutare exactă / decalare paralelă
function translateEls(sel, delta) {
  const ids = sel.map((e) => e.id);
  const linked = linkedEnds(ids);
  for (const el of sel) {
    if (el.type === 'door' || el.type === 'window' || el.type === 'gap') continue; // merg cu peretele
    if (el.a) { el.a = [el.a[0] + delta[0], el.a[1] + delta[1]]; el.b = [el.b[0] + delta[0], el.b[1] + delta[1]]; }
    if (el.p) el.p = [el.p[0] + delta[0], el.p[1] + delta[1]];
    if (el.pts) el.pts = el.pts.map((q) => [q[0] + delta[0], q[1] + delta[1]]);
  }
  for (const l of linked) { const el = byId(A.p, l.id); if (el) el[l.key] = [l.orig[0] + delta[0], l.orig[1] + delta[1]]; }
  syncFootings();
}
function moveDialog(sel, offset = false) {
  const d = $('#dlg');
  const w = sel[0];
  let nx = 0, ny = 0;
  if (offset) { const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]); nx = -(w.b[1] - w.a[1]) / L; ny = (w.b[0] - w.a[0]) / L; }
  d.innerHTML = `<form method="dialog"><h2>${offset ? 'Decalează peretele' : 'Mută cu o distanță'}</h2>
    ${offset ? `<div class="params" style="grid-template-columns:1fr"><label>Distanța (m) – pozitiv spre stânga sensului de desen, negativ spre dreapta<input class="field" type="number" step="0.01" id="mv-d" value="0.10"></label></div>`
      : `<div class="params" style="grid-template-columns:1fr 1fr"><label>Δx (m) – spre dreapta<input class="field" type="number" step="0.01" id="mv-x" value="0"></label><label>Δy (m) – în sus<input class="field" type="number" step="0.01" id="mv-y" value="0"></label></div>`}
    <p class="small">Pereții legați de capete se întind ca să rămână lipiți. Golurile din perete se mută odată cu el.</p>
    <div class="btns"><button class="btn" value="cancel">Renunță</button><button class="btn primary" value="ok">Mută</button></div></form>`;
  d.onclose = () => {
    if (d.returnValue !== 'ok') return;
    let delta;
    if (offset) { const v = parseFloat($('#mv-d', d).value) || 0; delta = [nx * v, ny * v]; }
    else delta = [parseFloat($('#mv-x', d).value) || 0, parseFloat($('#mv-y', d).value) || 0];
    if (!delta[0] && !delta[1]) return;
    snapshot();
    translateEls(sel, delta);
    emit('model');
    toast(`Mutat cu ${fmt(Math.hypot(...delta))} m`);
  };
  d.returnValue = '';
  d.showModal();
  setTimeout(() => $(offset ? '#mv-d' : '#mv-x', d)?.select(), 0);
}

async function storeysDialog() {
  const d = $('#dlg');
  const rows = () => sortedStoreys(A.p).reverse().map((s) => `<tr data-id="${s.id}"><td><input class="field" data-k="name" value="${esc(s.name)}" style="width:150px"></td>
    <td><input class="field" type="number" step="0.01" data-k="elev" value="${s.elev}" style="width:90px"></td>
    <td><input class="field" type="number" step="0.01" min="1" data-k="height" value="${s.height}" style="width:90px"></td>
    <td><button type="button" class="ibtn" data-del="${s.id}" title="Șterge nivelul">✕</button></td></tr>`).join('');
  d.innerHTML = `<form method="dialog"><h2>Niveluri</h2>
    <table class="tbl"><thead><tr><th>Nume</th><th>Cotă ±0,00 (m)</th><th>Înălțime nivel (m)</th><th></th></tr></thead><tbody id="st-rows">${rows()}</tbody></table>
    <div class="acts"><button type="button" class="btn" id="st-add">+ Nivel deasupra</button></div>
    <p class="small">Înălțimea nivelului = distanța de la cota acestui nivel până la cota nivelului următor (include placa).</p>
    <div class="btns"><button class="btn" value="cancel">Renunță</button><button class="btn primary" value="ok">Aplică</button></div></form>`;
  const tbody = $('#st-rows', d);
  let work = JSON.parse(JSON.stringify(A.p.storeys));
  const read = () => { for (const tr of tbody.querySelectorAll('tr')) { const s = work.find((x) => x.id === tr.dataset.id); s.name = $('[data-k=name]', tr).value.trim() || s.name; s.elev = +$('[data-k=elev]', tr).value; s.height = Math.max(1, +$('[data-k=height]', tr).value || 3); } };
  $('#st-add', d).onclick = () => {
    read();
    const top = sortedStoreysOf(work).at(-1);
    const id = 's' + (Math.max(0, ...work.map((s) => +s.id.slice(1) || 0)) + 1);
    work.push({ id, name: `Etaj ${work.length}`, elev: Math.round((top.elev + top.height) * 100) / 100, height: top.height });
    A.p.storeys = work; tbody.innerHTML = rows(); work = JSON.parse(JSON.stringify(A.p.storeys));
  };
  tbody.onclick = (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    read();
    if (work.length < 2) return toast('Proiectul trebuie să aibă cel puțin un nivel');
    const n = A.p.elements.filter((x) => x.storey === b.dataset.del).length;
    if (n && !confirmInline(b, `Nivelul are ${n} elemente – apasă din nou pentru ștergere`)) return;
    work = work.filter((s) => s.id !== b.dataset.del);
    b.closest('tr').remove();
  };
  const backup = JSON.stringify(A.p.storeys);
  d.onclose = () => {
    if (d.returnValue !== 'ok') { A.p.storeys = JSON.parse(backup); emit('storey'); return; }
    read();
    snapshot();
    const removed = A.p.storeys.map((s) => s.id).filter((id) => !work.some((s) => s.id === id));
    A.p.storeys = JSON.parse(backup);
    if (removed.length) deleteElements(A.p.elements.filter((x) => removed.includes(x.storey)).map((x) => x.id));
    A.p.storeys = work;
    if (!work.some((s) => s.id === A.storey)) A.storey = sortedStoreys(A.p)[0].id;
    emit('model'); emit('storey');
  };
  d.returnValue = '';
  d.showModal();
}
const sortedStoreysOf = (list) => [...list].sort((a, b) => a.elev - b.elev);
function confirmInline(btn, msg) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = '1'; btn.textContent = '!'; toast(msg);
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = '✕'; }, 2500);
  return false;
}

// ---------------------------------------------------------------- panoul de proprietăți
const matOpts = (filter) => Object.entries(MATERIALS).filter(([, m]) => !filter || filter(m)).map(([k, m]) => [k, m.name]);
const compOpts = (kind) => [['', '— un singur material (grosimea de mai jos) —'], ...Object.entries(COMPOSITES).filter(([, c]) => c.for === kind).map(([k, c]) => [k, `${c.name} · ${Math.round(compositeThickness(k) * 1000) / 10} cm`])];
const optsOf = (o) => Object.entries(o);
const FIELDS = {
  wall: [['composite', 'Structură (straturi)', 'sel', compOpts('wall')], ['thickness', 'Grosime totală (cm)', 'cm'], ['height', 'Înălțime (m)', 'm'], ['base', 'Decalaj bază (m)', 'm'], ['material', 'Material (fără straturi)', 'sel', matOpts((m) => ['beton', 'zidarie', 'usor', 'lemn', 'otel'].includes(m.kind))], ['bearing', 'Perete portant (preia încărcări)', 'chk'], ['exterior', 'Perete exterior', 'chk'], ['flipLayers', 'Inversează straturile (fața exterioară pe cealaltă parte)', 'chk'], ['plaster', 'Tencuit pe ambele fețe (fără straturi)', 'chk']],
  door: [['width', 'Lățime (m)', 'm'], ['height', 'Înălțime (m)', 'm'], ['sill', 'Prag (m)', 'm'], ['kind', 'Tip', 'sel', [['interioară', 'Interioară'], ['exterioară', 'Exterioară (intrare)'], ['metalică', 'Metalică / tehnică'], ['glisantă', 'Glisantă']]], ['frame', 'Material', 'sel', [['lemn', 'Lemn / MDF'], ['PVC', 'PVC'], ['aluminiu', 'Aluminiu'], ['metal', 'Metal']]], ['flip', 'Deschidere pe partea cealaltă', 'chk'], ['lintel', 'Buiandrug deasupra', 'sel', [['auto', 'Da (automat la zidărie)'], ['none', 'Fără buiandrug']]], ['name', 'Denumire', 'text']],
  window: [['width', 'Lățime (m)', 'm'], ['height', 'Înălțime (m)', 'm'], ['sill', 'Parapet (m)', 'm'], ['frame', 'Material ramă', 'sel', [['PVC', 'PVC'], ['aluminiu', 'Aluminiu cu barieră termică'], ['lemn', 'Lemn stratificat']]], ['glazing', 'Vitraj', 'sel', [['Tripan Low-E', 'Tripan Low-E'], ['Dublu Low-E', 'Dublu Low-E'], ['Dublu Low-E securizat', 'Dublu Low-E securizat']]], ['uw', 'Uw (W/m²K)', 'num'], ['lintel', 'Buiandrug deasupra', 'sel', [['auto', 'Da (automat la zidărie)'], ['none', 'Fără buiandrug']]], ['name', 'Denumire', 'text']],
  gap: [['width', 'Lățime (m)', 'm'], ['height', 'Înălțime (m)', 'm'], ['sill', 'Cota de jos a golului (m)', 'm'], ['lintel', 'Buiandrug deasupra', 'sel', [['auto', 'Da (automat la zidărie)'], ['none', 'Fără buiandrug']]], ['lintelH', 'Înălțime buiandrug (cm)', 'cm'], ['name', 'Denumire', 'text']],
  slab: [['composite', 'Structură (straturi)', 'sel', compOpts('slab')], ['thickness', 'Grosime totală (cm)', 'cm'], ['offset', 'Decalaj față de nivel (m)', 'm'], ['material', 'Material (fără straturi)', 'sel', matOpts((m) => ['beton', 'lemn', 'otel'].includes(m.kind))], ['use', 'Folosință (încărcare utilă)', 'sel', Object.entries(USES).map(([k, u]) => [k, `${u.name} · ${u.q} kN/m²`])], ['finishes', 'Alte straturi permanente (kN/m²)', 'num'], ['mode', 'Mod de desen', 'sel', [['rect', 'Dreptunghi'], ['poly', 'Poligon'], ['auto', 'Clic în cameră (automat)']], 'tool']],
  column: [['w', 'Latura x (cm)', 'cm'], ['d', 'Latura y (cm)', 'cm'], ['height', 'Înălțime (m)', 'm'], ['material', 'Material', 'sel', matOpts((m) => ['beton', 'lemn', 'otel', 'zidarie'].includes(m.kind))]],
  beam: [['w', 'Lățime (cm)', 'cm'], ['h', 'Înălțime (cm)', 'cm'], ['material', 'Material', 'sel', matOpts((m) => ['beton', 'lemn', 'otel'].includes(m.kind))], ['padA', 'Cuzineți la capete: lungime (cm, 0 = fără)', 'cm'], ['padH', 'Cuzineți: înălțime (cm)', 'cm']],
  footing: [['w', 'Lățime B (cm)', 'cm'], ['h', 'Înălțime talpă (cm)', 'cm'], ['depth', 'Adâncime de fundare (m)', 'm'], ['steel', 'Armătură estimată (kg/m³)', 'num']],
  roof: [['composite', 'Straturi', 'sel', compOpts('roof')], ['kind', 'Tip', 'sel', [['gable', 'În două ape'], ['mono', 'Într-o apă'], ['flat', 'Terasă (plat)']]], ['slope', 'Pantă (°)', 'num'], ['axis', 'Coama / panta pe', 'sel', [['x', 'Direcția X'], ['y', 'Direcția Y']]], ['offset', 'Cota streașinii față de nivel (m)', 'm'], ['thickness', 'Grosime (cm)', 'cm'], ['dead', 'Greutate învelitoare + șarpantă (kN/m²)', 'num'], ['mode', 'Mod de desen', 'sel', [['rect', 'Dreptunghi'], ['poly', 'Poligon']], 'tool']],
  zone: [['name', 'Nume', 'text'], ['number', 'Număr', 'text'], ['floor', 'Pardoseală', 'sel', optsOf(FINISH.floor)], ['walls', 'Pereți', 'sel', optsOf(FINISH.walls)], ['tileH', 'Înălțime faianță (m)', 'm'], ['ceiling', 'Tavan', 'sel', optsOf(FINISH.ceiling)], ['roomH', 'Înălțime liberă (m)', 'm'], ['skirting', 'Plintă', 'chk'], ['mode', 'Mod de desen', 'sel', [['auto', 'Clic în cameră (automat)'], ['rect', 'Dreptunghi'], ['poly', 'Poligon']], 'tool']],
  dim: [],
};
// după schimbarea structurii: grosimea și materialul structural urmează straturile
function applyComposite(el, k) {
  if ((el.type === 'beam' || el.type === 'column') && el.profile && (k === 'w' || k === 'h' || k === 'd' || k === 'material')) { delete el.profile; delete el.grade; }
  if (k === 'composite' && el.composite) { el.thickness = compositeThickness(el.composite); el.material = coreMaterial(el); }
  if (k === 'thickness' && el.composite && Math.abs(el.thickness - compositeThickness(el.composite)) > 1e-6) el.composite = '';
}
function fieldHtml([k, label, kind, opts, only], v, isTool) {
  if (only === 'tool' && !isTool) return '';
  const id = 'f-' + k;
  if (kind === 'chk') return `<label class="chkrow"><input type="checkbox" id="${id}" data-k="${k}" data-kind="chk" ${v ? 'checked' : ''}> ${esc(label)}</label>`;
  let input;
  if (kind === 'sel') input = `<select id="${id}" data-k="${k}" data-kind="sel">${opts.map(([o, l]) => `<option value="${o}" ${o === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (kind === 'text') input = `<input class="field" id="${id}" data-k="${k}" data-kind="text" value="${esc(v ?? '')}">`;
  else {
    const shown = v == null || v === '' ? '' : kind === 'cm' ? Math.round(v * 1000) / 10 : Math.round(v * 1000) / 1000;
    input = `<input class="field" type="number" step="${kind === 'cm' ? 1 : 0.01}" id="${id}" data-k="${k}" data-kind="${kind}" value="${shown}">`;
  }
  return `<label for="${id}">${esc(label)}</label>${input}`;
}
function readField(inp) {
  const kind = inp.dataset.kind;
  if (kind === 'chk') return inp.checked;
  if (kind === 'sel' || kind === 'text') return inp.value;
  const n = parseFloat(inp.value);
  if (Number.isNaN(n)) return undefined;
  return kind === 'cm' ? n / 100 : n;
}

// panoul unui sub-element: buiandrugul unui gol sau cuzineții unei grinzi
function renderSubSide(side, sid) {
  const [base, sub] = sid.split(':');
  const el = byId(A.p, base);
  if (!el) return false;
  const marks = openingMarks(A.p);
  const profOpts = Object.values(PROFILES).flat().map((x) => [x.name, x.name]);
  let fields, info = [], title;
  if (sub === 'lintel') {
    const lin = lintelOf(A.p, el);
    title = `Buiandrug ${marks.get(el.id) || el.id.toUpperCase()}`;
    const steel = el.lintelType === 'otel';
    fields = [['lintelType', 'Material', 'sel', [['beton', 'Beton armat C25/30'], ['otel', 'Profil laminat (oțel)']]], ['lintelH', 'Înălțime (cm)', 'cm'],
      ...(steel ? [['lintelProfile', 'Profil', 'sel', profOpts], ['lintelN', 'Număr de profile alăturate', 'sel', [['1', '1'], ['2', '2']]]] : [['lintelRebar', 'Armare', 'text']])];
    if (lin) {
      const pr = steel && el.lintelProfile && profileByName(el.lintelProfile);
      info = [['Lungime (cu rezemări)', fmt(lin.len) + ' m'], ['Rezemare în zid', `${fmt(LINTEL_BEARING)} m la fiecare capăt`], ['Lumina golului', fmt(el.width) + ' m'], ['Lățime (zidăria)', fmt(lin.core.t) + ' m'],
        pr ? ['Greutate oțel', `${fmt((el.lintelN || 1) * pr.G * lin.len, 1)} kg`] : ['Volum beton', `${fmt(lin.len * lin.core.t * lin.h, 3)} m³`]];
    } else info = [['', el.lintel === 'none' ? 'Golul nu are buiandrug.' : 'Peretele nu e din zidărie – nu are nevoie de buiandrug.']];
  } else if (sub === 'pads') {
    title = `Cuzineți grindă ${el.id.toUpperCase()}`;
    fields = [['padA', 'Lungime în lungul zidului (cm)', 'cm'], ['padH', 'Înălțime (cm)', 'cm']];
    for (const s of beamEndSupports(A.p, el)) if (s && s.e.type === 'wall') info.push([`Pe peretele ${s.e.id.toUpperCase()}`, `${Math.round(el.padA * 100)}×${Math.round(wallCore(s.e).t * 100)}×${Math.round((el.padH || 0.2) * 100)} cm`]);
  } else return false;
  const v = (k) => k === 'lintelN' ? String(el.lintelN || 1) : k === 'lintelType' ? el.lintelType || 'beton' : k === 'lintelH' ? el.lintelH || 0.25 : k === 'padH' ? el.padH || 0.2 : el[k];
  side.innerHTML = `<h3>${esc(title)}</h3>
    <div class="form" id="form">${fields.map((f) => fieldHtml(f, v(f[0]), false)).join('')}</div>
    <table class="kv"><tbody>${info.map(([k, x]) => `<tr><td>${esc(k)}</td><td>${esc(x)}</td></tr>`).join('')}</tbody></table>
    <div class="acts">${sub === 'lintel' ? '<button class="btn primary" id="sub-design">Dimensionează</button>' : '<button class="btn primary" id="sub-design">Dimensionează grinda</button>'}<button class="btn" id="sub-parent">Selectează ${sub === 'lintel' ? 'golul' : 'grinda'}</button><button class="btn danger" id="sub-del">Șterge ${sub === 'lintel' ? 'buiandrugul' : 'cuzineții'}</button></div>
    <p class="hint">${sub === 'lintel' ? 'Buiandrugul se selectează separat de ușă / fereastră: dă clic pe el în 3D.' : 'Cuzineții se selectează separat de grindă: dă clic pe ei în 3D (bifează „Structură” ca să-i vezi prin perete).'}</p>`;
  $('#form').onchange = (e) => {
    const k = e.target.dataset.k; if (!k) return;
    let val = readField(e.target); if (val === undefined) return;
    snapshot();
    if (k === 'lintelN') val = +val;
    if (k === 'lintelType' && val === 'otel' && !el.lintelProfile) { el.lintelProfile = 'IPE 120'; el.lintelGrade = 'S235'; el.lintelH = 0.12; }
    if (k === 'lintelProfile') { const pr = profileByName(val); if (pr) el.lintelH = pr.h / 1000; }
    el[k] = val;
    if (sub === 'lintel') el.lintel = 'auto';
    emit('model');
  };
  $('#sub-design').onclick = sub === 'lintel' ? openLintels : openBeams;
  $('#sub-parent').onclick = () => { A.sel = new Set([el.id]); emit('sel'); };
  $('#sub-del').onclick = () => { snapshot(); deleteElements([sid]); emit('model'); };
  return true;
}

function renderSide() {
  const side = $('#side-body');
  if (A.sel.size === 1 && [...A.sel][0].includes(':') && renderSubSide(side, [...A.sel][0])) return;
  const sel = [...A.sel].map((id) => byId(A.p, id)).filter(Boolean);
  if (!sel.length) {
    const t = A.tool;
    if (t === 'select') {
      const s = storeyOf(A.p, { storey: A.storey });
      const els = A.p.elements.filter((e) => e.storey === A.storey);
      const counts = {};
      for (const e of els) counts[e.type] = (counts[e.type] || 0) + 1;
      side.innerHTML = `<h3>${esc(s.name)}</h3>
        <table class="kv"><tbody><tr><td>Cotă</td><td>${fmt(s.elev)} m</td></tr><tr><td>Înălțime nivel</td><td>${fmt(s.height)} m</td></tr>
        ${Object.entries(counts).map(([k, n]) => `<tr><td>${TYPE_NAMES[k]}</td><td>${n}</td></tr>`).join('')}</tbody></table>
        <h4>Cum desenezi</h4>
        <p class="hint">Alege o unealtă din stânga. Fă clic pentru puncte. Pentru o lungime exactă, tastează valoarea (ex. <b>4.5</b>) și apasă Enter; pentru unghi: <b>4.5&lt;90</b>. Shift = doar orizontal/vertical. Punctele se prind automat de capete, colțuri, mijloace și fețe de pereți.</p>
        <p class="hint">Rotița mouse-ului = zoom, clic dreapta sau mijloc + trage = deplasare. Delete șterge selecția, Ctrl+Z anulează.</p>`;
      return;
    }
    const D = A.defaults[t];
    side.innerHTML = `<h3>Setări: ${esc(TYPE_NAMES[t])}</h3><p class="hint">Se aplică elementelor pe care le desenezi de acum înainte.</p>
      <div class="form" id="form">${FIELDS[t].map((f) => fieldHtml(f, D[f[0]], true)).join('')}</div>`;
    $('#form').onchange = (e) => { const k = e.target.dataset.k; if (!k) return; const v = readField(e.target); if (v !== undefined) D[k] = v; applyComposite(D, k); renderSide(); plan.status(); plan.invalidate(); };
    return;
  }
  const types = [...new Set(sel.map((e) => e.type))];
  const type = types.length === 1 ? types[0] : null;
  const first = sel[0];
  const title = sel.length === 1 ? `${TYPE_NAMES[first.type]} ${first.id.toUpperCase()}` : `${sel.length} elemente selectate`;
  const q = sel.length === 1 ? quantities(A.p, first) : null;
  side.innerHTML = `<h3>${esc(title)}</h3>
    ${type ? `<div class="form" id="form">${FIELDS[type].map((f) => fieldHtml(f, sel.every((e) => e[f[0]] === first[f[0]]) ? first[f[0]] : (f[2] === 'chk' ? false : ''), false)).join('')}</div>` : '<p class="hint">Elemente de tipuri diferite: le poți muta, copia sau șterge împreună.</p>'}
    ${q && Object.keys(q).length ? `<h4>Cantități</h4><table class="kv"><tbody>${Object.entries(q).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${typeof v === 'number' ? fmt(v) : esc(v)}</td></tr>`).join('')}</tbody></table>` : ''}
    ${sel.length === 1 && first.type === 'column' ? `<h4>Secțiune</h4><p class="hint">${first.profile ? `<b>${esc(first.profile)} ${esc(first.grade || '')}</b>` : `${esc(MATERIALS[first.material]?.name || '')} ${Math.round(first.w * 100)}×${Math.round(first.d * 100)} cm`}${first.rebar && !first.profile && first.material === 'beton' ? `<br>${esc(first.rebar)}` : ''}</p><button class="btn primary" id="s-design-col">Dimensionează stâlpul</button>` : ''}
    ${sel.length === 1 && first.type === 'beam' ? `<h4>Secțiune</h4><p class="hint">${first.profile ? `<b>${esc(first.profile)} ${esc(first.grade || '')}</b>` : `${esc(MATERIALS[first.material]?.name || '')} ${Math.round(first.w * 100)}×${Math.round(first.h * 100)} cm`}${first.rebar && !first.profile && first.material === 'beton' ? `<br>${esc(first.rebar)}` : ''}</p><button class="btn primary" id="s-design">Dimensionează grinda</button>` : ''}
    ${sel.length === 1 && lintelOf(A.p, first) ? `<button class="btn" id="s-lintel">Selectează buiandrugul</button>` : ''}
    ${sel.length === 1 && first.type === 'beam' && first.padA > 0 ? `<button class="btn" id="s-pads">Selectează cuzineții</button>` : ''}
    ${loadInfo(sel)}
    <div class="acts"><button class="btn" id="s-move" title="Mută cu o distanță exactă">Mută cu…</button>${sel.length === 1 && first.type === 'wall' ? '<button class="btn" id="s-offset" title="Mută peretele paralel cu el însuși">Decalează…</button>' : ''}<button class="btn" id="s-dup" title="Ctrl+D">Copiază alături</button><button class="btn danger" id="s-del">Șterge</button></div>
    ${sel.some((e) => e.type === 'wall') ? '<p class="hint">Mutarea unui perete (prin tragere sau cu „Mută cu…”) întinde pereții legați de capetele lui; ușile, ferestrele, golurile și fundația lui merg odată cu el.</p>' : ''}`;
  const form = $('#form');
  if (form) form.onchange = (e) => {
    const k = e.target.dataset.k; if (!k) return;
    const v = readField(e.target); if (v === undefined) return;
    snapshot();
    for (const el of sel) { el[k] = v; applyComposite(el, k); }
    emit('model');
  };
  $('#s-del').onclick = () => { snapshot(); deleteElements([...A.sel]); emit('model'); };
  $('#s-dup').onclick = duplicate;
  $('#s-move').onclick = () => moveDialog(sel);
  if ($('#s-lintel')) $('#s-lintel').onclick = () => { A.sel = new Set([first.id + ':lintel']); emit('sel'); };
  if ($('#s-pads')) $('#s-pads').onclick = () => { A.sel = new Set([first.id + ':pads']); emit('sel'); };
  if ($('#s-offset')) $('#s-offset').onclick = () => moveDialog(sel, true);
  if ($('#s-design')) $('#s-design').onclick = openBeams;
  if ($('#s-design-col')) $('#s-design-col').onclick = openColumns;
}
function loadInfo(sel) {
  if (!A.loads || sel.length !== 1) return '';
  const r = A.loads.items.find((x) => x.id === sel[0].id);
  if (!r) return '';
  return `<h4>Sarcini (orientativ)</h4><table class="kv"><tbody>
    <tr><td>G (permanente)</td><td>${fmt(r.G, 1)} kN</td></tr><tr><td>Q (variabile)</td><td>${fmt(r.Q, 1)} kN</td></tr>
    ${r.trib ? `<tr><td>Arie aferentă</td><td>${fmt(r.trib)} m²</td></tr>` : ''}
    ${r.nEd != null ? `<tr><td>n<sub>Ed</sub> la bază</td><td>${fmt(r.nEd, 1)} kN/m</td></tr>` : `<tr><td>N<sub>Ed</sub></td><td>${fmt(r.NEd, 1)} kN</td></tr>`}
    ${r.util != null ? `<tr><td>Utilizare</td><td>${pill(r.util)}</td></tr>` : ''}
    ${r.B ? `<tr><td>Fundație</td><td>${fmt(r.B * 100, 0)} cm</td></tr>` : ''}</tbody></table>
    ${r.checks.map((c) => `<p class="hint">${esc(c)}</p>`).join('')}`;
}
const pill = (u) => `<span class="pill ${u < 0.6 ? 'ok' : u <= 1 ? 'warn' : 'bad'}">${Math.round(u * 100)}%</span>`;

function duplicate() {
  if (!A.sel.size) return;
  snapshot();
  const map = new Map();
  const off = [1, -1];
  const src = [...A.sel].map((id) => byId(A.p, id)).filter(Boolean);
  const out = [];
  for (const e of src) {
    if (e.type === 'door' || e.type === 'window' || e.type === 'gap') continue;
    const c = JSON.parse(JSON.stringify(e));
    delete c.id;
    if (c.a) { c.a = [c.a[0] + off[0], c.a[1] + off[1]]; c.b = [c.b[0] + off[0], c.b[1] + off[1]]; }
    if (c.p) c.p = [c.p[0] + off[0], c.p[1] + off[1]];
    if (c.pts) c.pts = c.pts.map((q) => [q[0] + off[0], q[1] + off[1]]);
    c.id = c.type[0] + A.p.nextId++;
    A.p.elements.push(c); map.set(e.id, c.id); out.push(c.id);
  }
  // golurile pereților copiați
  for (const o of A.p.elements.filter((x) => (x.type === 'door' || x.type === 'window' || x.type === 'gap') && map.has(x.wall))) {
    const c = { ...JSON.parse(JSON.stringify(o)), wall: map.get(o.wall) };
    c.id = c.type[0] + A.p.nextId++;
    A.p.elements.push(c);
  }
  A.sel = new Set(out);
  emit('model');
  toast('Copiat cu 1 m la dreapta și 1 m în jos – trage pentru a-l muta');
}

// ---------------------------------------------------------------- vederi
const work = $('#work');
function setView(v) {
  work.dataset.view = v;
  for (const b of document.querySelectorAll('#views button')) b.classList.toggle('on', b.dataset.view === v);
  try { localStorage.setItem('cad:view', v); } catch { /* */ }
  if (v !== 'plan') ensure3D().then((x) => { x.resize(); x.invalidate('model'); });
}
$('#views').onclick = (e) => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); };
$('#b-fit').onclick = () => plan.fit();
$('#b-fit3d').onclick = () => view3d?.fit();
$('#c-grid').onchange = (e) => { plan.gridSnap = e.target.checked; };
$('#c-upto').onchange = (e) => { if (view3d) { view3d.upTo = e.target.checked; view3d.invalidate('model'); } };
$('#c-zones').onchange = (e) => { if (view3d) { view3d.showZones = e.target.checked; view3d.invalidate('model'); } };
$('#c-xray').onchange = (e) => { if (view3d) { view3d.xray = e.target.checked; view3d.invalidate('model'); } };
// „Vezi în 3D” din paginile de dimensionare: selectează elementul, arată structura și centrează camera pe el
async function showIn3D(id) {
  selectFromPage(id.split(':')[0]);
  if (id.includes(':')) { A.sel = new Set([id]); emit('sel'); }
  if (work.dataset.view === 'plan') setView(narrow.matches ? '3d' : 'split');
  const v = await ensure3D();
  v.resize();
  v.xray = true; $('#c-xray').checked = true;
  v.invalidate('model');
  const host = byId(A.p, id);
  v.focus(id);
  if (host) toast('Mod „Structură”: pereții sunt transparenți. Debifează „Structură” din colțul vederii 3D ca să revii.', 4000);
}
$('#c-loads').onchange = (e) => { A.showLoads = e.target.checked; plan.invalidate(); };

// ---------------------------------------------------------------- reacții la schimbări
on((kind) => {
  if (kind === 'model') { autosave(); $('#l-loads').hidden = true; }
  if (kind === 'sel' && narrow.matches) openSheet(A.sel.size > 0);
  if (kind === 'storey' || kind === 'model') renderStoreys();
  renderSide();
  plan.invalidate();
  view3d?.invalidate(kind === 'storey' ? (view3d.upTo ? 'model' : 'sel') : kind);
  $('#b-undo').disabled = !A.undo.length; $('#b-redo').disabled = !A.redo.length;
  if (kind === 'model' && !$('#page').hidden && pageKind === 'qty') openQty();
});
$('#b-undo').onclick = () => undo();
$('#m-undo').onclick = () => undo();
$('#m-redo').onclick = () => redo();
$('#b-redo').onclick = () => redo();
const pname = $('#pname');
pname.onchange = () => { snapshot(); A.p.name = pname.value.trim() || 'Proiect'; emit('model'); };

addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea,select,dialog')) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); duplicate(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'a') { e.preventDefault(); for (const x of A.p.elements) if (x.storey === A.storey) A.sel.add(x.id); emit('sel'); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Home') { plan.fit(); return; }
  if (plan.draw && /^[0-9.,<-]$/.test(e.key)) { if (document.activeElement !== $('#plan')) plan.key(e); return; } // lungimea tastată
  const t = TOOLS.find((x) => x !== 'hr' && x[2].toLowerCase() === k);
  if (t && document.activeElement?.id !== 'pname') { setTool(t[0]); e.preventDefault(); return; }
  if (document.activeElement !== $('#plan')) plan.key(e);
});

// ---------------------------------------------------------------- pagini: Cantități, Sarcini
let pageKind = null;
function openPage(kind, title, html, acts = '') {
  pageKind = kind;
  $('#page-title').textContent = title;
  $('#page-body').innerHTML = html;
  $('#page-acts').innerHTML = acts;
  $('#page').hidden = false;
}
$('#page-close').onclick = () => { $('#page').hidden = true; pageKind = null; };

function csvDownload(name, rows) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + rows.map((r) => r.map((v) => q(typeof v === 'number' ? fmt(v) : v)).join(';')).join('\n')], { type: 'text/csv' });
  download(blob, name);
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

let qtyTab = 'boq';
let openDet = new Set();
async function openQty() {
  const { computeBOQ, joinerySchedule, roomSchedule } = await import('./boq.js');
  const boq = computeBOQ(A.p);
  A.p.prices ||= {};
  const vat = A.p.vat ?? 21;
  const tabs = [['boq', 'Antemăsurătoare'], ['joinery', 'Tâmplărie'], ['rooms', 'Camere și finisaje'], ['elems', 'Elemente']];
  let body = `<div class="seg qtabs" style="margin-bottom:12px">${tabs.map(([k, l]) => `<button data-qt="${k}" class="${qtyTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  if (qtyTab === 'boq') {
    let total = 0;
    const rows = boq.chapters.map((ch, ci) => {
      let sub = 0;
      const its = ch.items.map((it) => {
        const pr = A.p.prices[it.key] || {};
        const val = (Number(pr.price) || 0) * it.qty;
        sub += val;
        const open = openDet.has(it.key);
        return `<tr class="art" data-key="${esc(it.key)}"><td class="n">${it.nr}</td>
          <td><input class="field code" data-code="${esc(it.key)}" value="${esc(pr.code || '')}" placeholder="cod" aria-label="Cod articol"></td>
          <td><button class="linkish" data-det="${esc(it.key)}" title="Detaliere pe elemente">${open ? '▾' : '▸'} ${esc(it.desc)}</button></td><td>${it.um}</td><td class="n">${fmt(it.qty)}</td>
          <td><input class="field price" type="number" min="0" step="0.01" data-price="${esc(it.key)}" value="${pr.price ?? ''}" placeholder="0,00" aria-label="Preț unitar"></td><td class="n">${val ? fmt(val) : '—'}</td></tr>
          ${open ? it.det.map((d) => `<tr class="det click" data-id="${esc(d.id || '')}"><td></td><td></td><td class="small">${esc(d.el)} · ${esc(d.storey)} · ${esc(d.calc)}</td><td></td><td class="n small">${fmt(d.qty, 3)}</td><td></td><td></td></tr>`).join('') : ''}`;
      }).join('');
      total += sub;
      return `<tr class="grp"><td colspan="7">Capitolul ${ci + 1}. ${esc(ch.name)}</td></tr>${its}<tr class="sub"><td colspan="6" class="n">Total capitolul ${ci + 1}</td><td class="n">${fmt(sub)}</td></tr>`;
    }).join('');
    body += `<p class="small" style="margin:0 0 10px">Cantitățile se calculează din model: pereți și plăci pe straturi, fundații, acoperiș, tâmplărie și finisajele camerelor. Completează codurile de articol și prețurile unitare pentru a obține devizul; se salvează în proiect și ajung în Excel. Clic pe un articol arată detalierea pe elemente.</p>
      <div class="tbl-wrap"><table class="tbl boq"><thead><tr><th class="n">Nr.</th><th>Cod articol</th><th>Denumirea lucrării</th><th>U.M.</th><th class="n">Cantitate</th><th>Preț unitar (lei)</th><th class="n">Valoare (lei)</th></tr></thead><tbody>${rows}
      <tr class="sub"><td colspan="6" class="n">TOTAL fără TVA</td><td class="n">${fmt(total)}</td></tr>
      <tr class="sub"><td colspan="6" class="n">TVA <input class="field" id="vat" type="number" step="1" value="${vat}" style="width:64px;display:inline-block"> %</td><td class="n">${fmt(total * vat / 100)}</td></tr>
      <tr class="sub"><td colspan="6" class="n"><b>TOTAL cu TVA</b></td><td class="n"><b>${fmt(total * (1 + vat / 100))}</b></td></tr></tbody></table></div>`;
  } else if (qtyTab === 'joinery') {
    const rows = joinerySchedule(A.p);
    body += `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Marcaj</th><th>Tip</th><th class="n">L (m)</th><th class="n">H (m)</th><th class="n">Parapet</th><th>Material</th><th>Vitraj / tip</th><th class="n">Uw</th><th class="n">Buc.</th><th class="n">Arie totală (m²)</th><th>Niveluri</th></tr></thead><tbody>
      ${rows.map((g) => `<tr class="click" data-id="${g.ids[0]}"><td><b>${g.mark}</b></td><td>${g.o.type === 'window' ? 'Fereastră' : 'Ușă'}</td><td class="n">${fmt(g.o.width)}</td><td class="n">${fmt(g.o.height)}</td><td class="n">${fmt(g.o.sill)}</td><td>${esc(g.o.frame || '')}</td><td>${esc(g.o.glazing || g.o.kind || '')}</td><td class="n">${g.o.uw ?? '—'}</td><td class="n">${g.count}</td><td class="n">${fmt(g.count * g.o.width * g.o.height)}</td><td>${esc([...g.storeys].join(', '))}</td></tr>`).join('')}
      <tr class="sub"><td colspan="8" class="n">Total</td><td class="n">${rows.reduce((a, g) => a + g.count, 0)}</td><td class="n">${fmt(rows.reduce((a, g) => a + g.count * g.o.width * g.o.height, 0))}</td><td></td></tr></tbody></table></div>`;
  } else if (qtyTab === 'rooms') {
    const rows = roomSchedule(A.p);
    let last = '';
    body += `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nr.</th><th>Denumire</th><th class="n">Arie utilă (m²)</th><th class="n">Perimetru (m)</th><th class="n">Înălțime (m)</th><th>Pardoseală</th><th>Pereți</th><th>Tavan</th></tr></thead><tbody>
      ${rows.map((x, i) => {
        const g = x.storey !== last ? `<tr class="grp"><td colspan="8">${esc(x.storey)}</td></tr>` : ''; last = x.storey;
        const end = !rows[i + 1] || rows[i + 1].storey !== x.storey ? `<tr class="sub"><td colspan="2" class="n">Total ${esc(x.storey)}</td><td class="n">${fmt(rows.filter((y) => y.storey === x.storey).reduce((a, y) => a + y.A, 0))}</td><td colspan="5"></td></tr>` : '';
        return g + `<tr class="click" data-id="${x.z.id}"><td>${esc(x.z.number || '')}</td><td>${esc(x.z.name || '')}</td><td class="n">${fmt(x.A)}</td><td class="n">${fmt(x.P)}</td><td class="n">${fmt(x.H)}</td><td>${esc(FINISH.floor[x.z.floor] || '—')}</td><td>${esc(FINISH.walls[x.z.walls] || '—')}${x.z.walls === 'faianta' ? ` (h ${fmt(x.z.tileH || 2.1)})` : ''}</td><td>${esc(FINISH.ceiling[x.z.ceiling] || '—')}</td></tr>` + end;
      }).join('')}
      <tr class="sub"><td colspan="2" class="n">Total clădire</td><td class="n">${fmt(rows.reduce((a, y) => a + y.A, 0))}</td><td colspan="5"></td></tr></tbody></table></div>`;
  } else {
    const elems = A.p.elements.filter((e) => e.type !== 'dim');
    body += `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Element</th><th>Nivel</th><th>Structură / material</th><th>Cantități</th></tr></thead><tbody>
      ${elems.map((e) => `<tr class="click" data-id="${e.id}"><td>${TYPE_NAMES[e.type]} ${e.id.toUpperCase()}${e.name ? ' – ' + esc(e.name) : ''}</td><td>${esc(storeyOf(A.p, e.wall ? byId(A.p, e.wall) || e : e).name)}</td><td>${esc(COMPOSITES[e.composite]?.name || MATERIALS[e.material]?.name || USES[e.use]?.name || '')}</td>
        <td class="small">${Object.entries(quantities(A.p, e)).map(([k, v]) => `${esc(k)}: <b>${typeof v === 'number' ? fmt(v) : esc(v)}</b>`).join(' · ')}</td></tr>`).join('')}
      </tbody></table></div>`;
  }
  openPage('qty', 'Antemăsurătoare și cantități', body, '<button class="btn primary" id="qty-xlsx">Export Excel (.xlsx)</button> <button class="btn" id="qty-csv">CSV</button> ');
  const pb = $('#page-body');
  pb.onclick = (e) => {
    const t = e.target.closest('[data-qt]');
    if (t) { qtyTab = t.dataset.qt; openQty(); return; }
    const d = e.target.closest('[data-det]');
    if (d) { const k = d.dataset.det; if (openDet.has(k)) openDet.delete(k); else openDet.add(k); openQty(); return; }
    if (e.target.closest('input')) return;
    const tr = e.target.closest('tr[data-id]');
    if (tr && tr.dataset.id) selectFromPage(tr.dataset.id);
  };
  pb.onchange = (e) => {
    const c = e.target.dataset.code, pr = e.target.dataset.price;
    if (c) { (A.p.prices[c] ||= {}).code = e.target.value.trim(); autosave(); }
    if (pr) { const v = parseFloat(e.target.value); (A.p.prices[pr] ||= {}).price = Number.isFinite(v) ? v : null; autosave(); openQty(); }
    if (e.target.id === 'vat') { A.p.vat = parseFloat(e.target.value) || 0; autosave(); openQty(); }
  };
  $('#qty-xlsx').onclick = async () => {
    const b = $('#qty-xlsx'); b.disabled = true; b.textContent = 'Se generează…';
    try {
      const { exportExcel } = await import('./excel.js');
      download(await exportExcel(A.p), `Antemasuratoare - ${A.p.name}.xlsx`);
      toast('Fișier Excel salvat');
    } catch (err) { console.error(err); toast('Exportul Excel a eșuat: ' + err.message, 6000); }
    b.disabled = false; b.textContent = 'Export Excel (.xlsx)';
  };
  $('#qty-csv').onclick = () => csvDownload(`Antemasuratoare - ${A.p.name}.csv`, [['Nr.', 'Cod articol', 'Capitol', 'Denumirea lucrării', 'U.M.', 'Cantitate', 'Preț unitar', 'Valoare'],
    ...boq.chapters.flatMap((ch) => ch.items.map((it) => { const pr = A.p.prices[it.key] || {}; return [it.nr, pr.code || '', ch.name, it.desc, it.um, it.qty, pr.price ?? '', pr.price ? pr.price * it.qty : '']; }))]);
}
function selectFromPage(id) {
  const el = byId(A.p, id);
  if (!el) return;
  const host = el.wall ? byId(A.p, el.wall) : el;
  A.storey = host.storey;
  A.sel = new Set([id]);
  $('#page').hidden = true; pageKind = null;
  setTool('select');
  A.sel = new Set([id]);
  emit('storey'); emit('sel');
}
async function makeFootings() {
  // lățimile din calculul de sarcini, dacă există
  const widths = {};
  try { const { computeLoads } = await import('./loads.js'); for (const x of computeLoads(A.p).items) if (x.B) widths[x.id] = x.B; } catch { /* fără sarcini */ }
  snapshot();
  const n = generateFootings(A.p, widths);
  emit('model');
  toast(n ? `${n} fundații generate (lățimi din calculul de sarcini, minim 60 cm)` : 'Nu există pereți portanți sau stâlpi la nivelul cel mai de jos');
}
$('#b-qty').onclick = openQty;
$('#b-qty').textContent = 'Antemăsurătoare';

let beamGrade = 'S235';
let colBeta = 1.0;
// gradul de utilizare: verde = verifică (≤ 90%), portocaliu = aproape de limită (90–100%), roșu = nu verifică
const upill = (u) => `<span class="pill ${u <= 0.9 ? 'ok' : u <= 1 ? 'warn' : 'bad'}" title="Grad de utilizare = efort de calcul / capacitate">${Math.round(u * 100)}%</span>`;
const UTIL_NOTE = '<p class="small" style="margin:0 0 10px"><b>Procentul</b> este gradul de utilizare: efortul de calcul împărțit la capacitatea elementului, la verificarea care decide (de ex. M<sub>Ed</sub> / M<sub>Rd</sub> sau săgeata / săgeata admisă). Sub 100% = verifică; 70–95% = secțiune folosită eficient; un procent mic = secțiune supradimensionată.</p>';
const designTabs = (on) => `<div class="seg qtabs" style="margin-bottom:12px"><button data-dtab="beams" class="${on === 'beams' ? 'on' : ''}">Grinzi</button><button data-dtab="cols" class="${on === 'cols' ? 'on' : ''}">Stâlpi</button><button data-dtab="lintels" class="${on === 'lintels' ? 'on' : ''}">Buiandrugi</button></div>`;
async function openBeams() {
  const { computeLoads } = await import('./loads.js');
  const { designBeams } = await import('./design.js');
  A.loads = computeLoads(A.p);
  const rows = designBeams(A.p, A.loads, beamGrade);
  const pct = (u) => upill(u);
  const opt = (x, kind, label, detail) => { if (!x) return `<div class="opt"><div class="small">${esc(label)}: nicio secțiune din listă nu verifică</div></div>`; const on = appliedKind(byId(A.p, x._id), kind, x); return `<div class="opt${on ? ' on' : ''}"><div><b>${esc(label)}</b> ${pct(x.util)}${detail ? `<div class="small">${esc(detail)}</div>` : ''}<div class="small">${x.checks.map(esc).join('<br>')}</div></div>${applyBtn(on, `data-apply="${kind}" data-beam="${x._id}" data-name="${esc(x.name)}"`)}</div>`; };
  const html = designTabs('beams') + `<div class="notice"><b>Dimensionare orientativă (predimensionare).</b> Grinzi simplu rezemate cu încărcare uniformă din calculul de sarcini, combinația SLU 6.10 (γG = ${A.loads.params.gG}, γQ = ${A.loads.params.gQ}) și săgeată ≤ L/250 sub încărcarea caracteristică. Oțel: SR EN 1993-1-1, secțiuni clasa 1–2, talpa comprimată legată de placă. Beton: C25/30, BST500S, SR EN 1992-1-1. Lemn: GL24h, SR EN 1995-1-1. Nu include seismul, torsiunea, încărcările concentrate și verificarea îmbinărilor – proiectul de rezistență se face de un inginer atestat.</div>
    ${UTIL_NOTE}<div class="params" style="grid-template-columns:auto 1fr;align-items:center"><label style="flex-direction:row;align-items:center;gap:8px">Oțel <select id="bgrade"><option ${beamGrade === 'S235' ? 'selected' : ''}>S235</option><option ${beamGrade === 'S355' ? 'selected' : ''}>S355</option></select></label><span class="small">Pentru fiecare familie se alege cel mai ușor profil care verifică toate condițiile. „Aplică” schimbă grinda din model (și în 3D, antemăsurătoare și IFC).</span></div>
    ${rows.length ? rows.map((r) => {
      for (const x of [...r.steel, r.concrete, r.timber]) if (x) x._id = r.id;
      const cur = r.el.profile ? `${r.el.profile} ${r.el.grade || ''}` : `${MATERIALS[r.el.material]?.name || r.el.material} ${Math.round(r.el.w * 100)}×${Math.round(r.el.h * 100)} cm`;
      return `<section class="beam card"><header><b>${esc(r.name)}</b> · ${esc(r.storey)} · L = ${fmt(r.L)} m · g<sub>k</sub> = ${fmt(r.gk)} kN/m (fără greutatea proprie) · q<sub>k</sub> = ${fmt(r.qk)} kN/m <span class="small">· acum: ${esc(cur)}</span>
        <span class="hbtns">${view3dBtn(r.id)}<button class="mini" data-goto="${r.id}">Arată pe plan</button></span></header>
        ${r.warn.map((w) => `<p class="small" style="color:var(--warn)">${esc(w)}</p>`).join('')}
        ${padHtml(r)}
        <div class="opts">
          ${r.steel.map((x) => opt(x, 'steel', x.name, `${fmt(x.mass, 0)} kg pe grindă · decide: ${x.governs}`)).join('')}
          ${opt(r.concrete, 'concrete', r.concrete ? r.concrete.name : 'Beton armat', r.concrete ? `${r.concrete.rebar}; ${r.concrete.stirrups}` : '')}
          ${opt(r.timber, 'timber', r.timber ? r.timber.name : 'Lemn lamelar GL24h', '')}
        </div></section>`;
    }).join('') : '<div class="empty">Proiectul nu are grinzi. Desenează una cu unealta Grindă (B), între doi stâlpi sau pereți portanți.</div>'}`;
  openPage('beams', 'Dimensionare structură', html);
  const pb = $('#page-body');
  pb.onchange = (e) => { if (e.target.id === 'bgrade') { beamGrade = e.target.value; openBeams(); } };
  pb.onclick = (e) => {
    const t = e.target.closest('[data-dtab]');
    if (t) { if (t.dataset.dtab === 'cols') openColumns(); if (t.dataset.dtab === 'lintels') openLintels(); return; }
    const v3 = e.target.closest('[data-v3d]');
    if (v3) { showIn3D(v3.dataset.v3d); return; }
    const g = e.target.closest('[data-goto]');
    if (g) { selectFromPage(g.dataset.goto); return; }
    const pd = e.target.closest('[data-pad]');
    if (pd) {
      const r = rows.find((x) => x.id === pd.dataset.pad), el = byId(A.p, r.id);
      snapshot();
      if (pd.dataset.off) { delete el.padA; delete el.padH; } else { const ps = r.pads.filter(Boolean); el.padA = Math.max(...ps.map((x) => x.a)); el.padH = Math.max(...ps.map((x) => x.h)); }
      emit('model'); toast(pd.dataset.off ? 'Cuzineți eliminați' : `Cuzineți ${Math.round(el.padA * 100)} cm aplicați`); openBeams(); return;
    }
    const b = e.target.closest('[data-apply]');
    if (!b) return;
    const r = rows.find((x) => x.id === b.dataset.beam);
    const el = byId(A.p, r.id);
    snapshot();
    if (b.dataset.apply === 'steel') {
      const x = r.steel.find((y) => y.name === b.dataset.name);
      Object.assign(el, { material: 'otel', profile: x.profile, grade: x.grade, w: x.b, h: x.h });
    } else if (b.dataset.apply === 'concrete') {
      delete el.profile; delete el.grade;
      Object.assign(el, { material: 'beton', w: r.concrete.b, h: r.concrete.h, rebar: `${r.concrete.rebar}; ${r.concrete.stirrups}` });
    } else {
      delete el.profile; delete el.grade;
      Object.assign(el, { material: 'lemn', w: r.timber.b, h: r.timber.h });
    }
    emit('model');
    toast(`${r.name}: ${b.dataset.name} aplicat`);
    openBeams();
  };
}

// varianta aplicată acum pe element (pentru marcajul „✓ Aplicat”)
const near = (a, b) => Math.abs((a || 0) - (b || 0)) < 0.005;
function appliedKind(el, kind, x, dim2 = 'h') {
  if (!x) return false;
  if (kind === 'steel') return el.profile === x.profile && (el.grade || 'S235') === x.grade;
  if (kind === 'concrete') return !el.profile && el.material === 'beton' && near(el.w, x.b) && near(el[dim2], x.h);
  return !el.profile && el.material === 'lemn' && near(el.w, x.b) && near(el[dim2], x.h);
}
const applyBtn = (on, attrs) => on ? `<span class="applied">✓ Aplicat</span>` : `<button class="btn" ${attrs}>Aplică</button>`;
const view3dBtn = (id) => `<button class="mini" data-v3d="${id}">Vezi în 3D</button>`;

function padHtml(r) {
  const ps = (r.pads || []).map((x, i) => x && { ...x, end: i ? 'capătul B' : 'capătul A' }).filter(Boolean);
  if (!ps.length) return '';
  const has = r.el.padA > 0;
  return `<div class="opt" style="margin:6px 0"><div><b>Reazem pe zidărie – cuzineți</b> ${upill(Math.max(...ps.map((x) => x.sigmaBeam / x.limit)))} <span class="small">fără cuzinet</span>
    <div class="small">${ps.map((x) => `${esc(x.end)} pe ${esc(x.wall.id.toUpperCase())}: ${esc(x.check)}`).join('<br>')}</div>
    <div class="small">Presiunea locală sub grindă se verifică după SR EN 1996-1-1 (6.1.3), cu β = 1,25. Procentul arată σ / (β·f<sub>d</sub>) pentru grinda rezemată direct pe zidărie; cuzinetul de beton armat (C25/30, 4Ø12 + etr. Ø8/15) distribuie reacțiunea pe o lungime mai mare.${has ? ` <b>Acum: cuzineți ${Math.round(r.el.padA * 100)} cm × ${Math.round((r.el.padH || 0.2) * 100)} cm.</b>` : ''}</div></div>
    <div style="display:flex;flex-direction:column;gap:6px"><button class="btn${ps.some((x) => x.needed) && !has ? ' primary' : ''}" data-pad="${r.id}">${has ? 'Actualizează' : 'Pune'} cuzineți</button>${has ? `<button class="btn" data-pad="${r.id}" data-off="1">Fără</button>` : ''}</div></div>`;
}

async function openLintels() {
  const { computeLoads } = await import('./loads.js');
  const { designLintels } = await import('./design.js');
  A.loads = computeLoads(A.p);
  const rows = designLintels(A.p, A.loads, beamGrade);
  const marks = openingMarks(A.p);
  const linOn = (o, kind, x) => kind === 'steel' ? o.lintelType === 'otel' && o.lintelProfile === x.profile : (o.lintelType || 'beton') === 'beton' && !!o.lintelRebar && near(o.lintelH, x.h);
  const opt = (x, kind, id, label, detail) => { if (!x) return `<div class="opt"><div class="small">${esc(label)}: nicio secțiune nu verifică</div></div>`; const on = linOn(byId(A.p, id), kind, x); return `<div class="opt${on ? ' on' : ''}"><div><b>${esc(label)}</b> ${upill(x.util)}${detail ? `<div class="small">${esc(detail)}</div>` : ''}<div class="small">${x.checks.map(esc).join('<br>')}</div></div>${applyBtn(on, `data-apply="${kind}" data-op="${id}" data-name="${esc(x.name)}"`)}</div>`; };
  const html = designTabs('lintels') + `<div class="notice"><b>Buiandrugi peste goluri (predimensionare).</b> Grindă simplu rezemată cu deschiderea de calcul L = lumina golului + ${Math.round(25)} cm, rezemată ${Math.round(25)} cm în zidărie la fiecare capăt. Încărcări: zidăria de deasupra golului (toată înălțimea, acoperitor) plus încărcările pe care peretele le primește de sus (planșee, pereți), SLU 6.10. Beton C25/30 cu lățimea egală cu zidăria; oțel – profile pereche dacă peretele e gros. Golurile din pereți neportanți ușori nu au nevoie de buiandrug.</div>
    ${UTIL_NOTE}
    ${rows.length ? rows.map((r) => {
      const o = r.o;
      const cur = o.lintelType === 'otel' ? `${o.lintelProfile} ${o.lintelGrade || ''}` : `beton ${Math.round(r.b * 100)}×${Math.round((o.lintelH || 0.25) * 100)} cm${o.lintelRebar ? ' · ' + o.lintelRebar : ''}`;
      return `<section class="beam card"><header><b>${esc(marks.get(o.id) || o.id.toUpperCase())}</b> · ${esc(TYPE_NAMES[o.type])} ${fmt(o.width)}×${fmt(o.height)} m în ${esc(r.wall.id.toUpperCase())} · L = ${fmt(r.L)} m · g<sub>k</sub> = ${fmt(r.gk)} kN/m (zidărie ${fmt(r.above)} m deasupra) · q<sub>k</sub> = ${fmt(r.qk)} kN/m <span class="small">· acum: ${esc(cur)}</span>
        <span class="hbtns">${view3dBtn(o.id + ':lintel')}<button class="mini" data-goto="${o.id}">Arată pe plan</button></span></header>
        <div class="opts">
          ${opt(r.concrete, 'concrete', o.id, r.concrete ? `Buiandrug ${r.concrete.name}` : 'Beton armat', r.concrete ? `${r.concrete.rebar}; ${r.concrete.stirrups}` : '')}
          ${r.steel.map((x) => opt(x, 'steel', o.id, `${x.n > 1 ? '2 × ' : ''}${x.name}`, `${fmt(x.mass * x.n, 0)} kg${x.n > 1 ? ' (două profile, fiecare preia jumătate din încărcare)' : ''} · decide: ${x.governs}`)).join('')}
        </div></section>`;
    }).join('') : '<div class="empty">Nu există goluri în pereți de zidărie sau beton. Pune o ușă, o fereastră sau un gol (G) într-un perete.</div>'}`;
  openPage('beams', 'Dimensionare structură', html);
  const pb = $('#page-body');
  pb.onchange = null;
  pb.onclick = (e) => {
    const t = e.target.closest('[data-dtab]');
    if (t) { if (t.dataset.dtab === 'beams') openBeams(); if (t.dataset.dtab === 'cols') openColumns(); return; }
    const v3 = e.target.closest('[data-v3d]');
    if (v3) { showIn3D(v3.dataset.v3d); return; }
    const g = e.target.closest('[data-goto]');
    if (g) { selectFromPage(g.dataset.goto); return; }
    const b = e.target.closest('[data-apply]');
    if (!b) return;
    const r = rows.find((x) => x.id === b.dataset.op);
    const el = byId(A.p, r.id);
    snapshot();
    el.lintel = 'auto';
    if (b.dataset.apply === 'steel') {
      const x = r.steel.find((y) => y.name === b.dataset.name);
      Object.assign(el, { lintelType: 'otel', lintelProfile: x.profile, lintelGrade: x.grade, lintelH: x.h, lintelN: x.n });
      delete el.lintelRebar;
    } else {
      Object.assign(el, { lintelType: 'beton', lintelH: r.concrete.h, lintelRebar: `${r.concrete.rebar}; ${r.concrete.stirrups}` });
      delete el.lintelProfile; delete el.lintelGrade; delete el.lintelN;
    }
    emit('model');
    toast(`${marks.get(el.id) || el.id}: buiandrug ${b.dataset.name} aplicat`);
    openLintels();
  };
}

async function openColumns() {
  const { computeLoads } = await import('./loads.js');
  const { designColumns } = await import('./design.js');
  A.loads = computeLoads(A.p);
  const rows = designColumns(A.p, A.loads, beamGrade, colBeta);
  const opt = (x, kind, label, detail) => { if (!x) return `<div class="opt"><div class="small">${esc(label)}: nicio secțiune din listă nu verifică</div></div>`; const on = appliedKind(byId(A.p, x._id), kind, x, 'd'); return `<div class="opt${on ? ' on' : ''}"><div><b>${esc(label)}</b> ${upill(x.util)}${detail ? `<div class="small">${esc(detail)}</div>` : ''}<div class="small">${x.checks.map(esc).join('<br>')}</div></div>${applyBtn(on, `data-apply="${kind}" data-col="${x._id}" data-name="${esc(x.name)}"`)}</div>`; };
  const html = designTabs('cols') + `<div class="notice"><b>Dimensionare orientativă (predimensionare).</b> Stâlpi comprimați centric, cu forța axială din coborârea încărcărilor (SLU 6.10). Oțel: flambaj după ambele axe, curbe b / c, SR EN 1993-1-1. Beton C25/30: compresiune cu excentricitate minimă, imperfecțiuni și efecte de ordinul 2 (curbură nominală), armare minimă 1% și ν ≤ 0,40 (P100-1), SR EN 1992-1-1. Lemn GL24h: flambaj, SR EN 1995-1-1. Nu include momentele din cadre, seismul și verificarea îmbinărilor – proiectul de rezistență se face de un inginer atestat.</div>
    ${UTIL_NOTE}<div class="params" style="grid-template-columns:auto auto 1fr;align-items:center">
      <label style="flex-direction:row;align-items:center;gap:8px">Oțel <select id="bgrade"><option ${beamGrade === 'S235' ? 'selected' : ''}>S235</option><option ${beamGrade === 'S355' ? 'selected' : ''}>S355</option></select></label>
      <label style="flex-direction:row;align-items:center;gap:8px">Lungime de flambaj <select id="cbeta"><option value="1" ${colBeta === 1 ? 'selected' : ''}>1,0·H – articulat la ambele capete</option><option value="0.7" ${colBeta === 0.7 ? 'selected' : ''}>0,7·H – încastrat jos, articulat sus</option><option value="0.5" ${colBeta === 0.5 ? 'selected' : ''}>0,5·H – încastrat la ambele capete</option><option value="2" ${colBeta === 2 ? 'selected' : ''}>2,0·H – consolă (liber sus)</option></select></label>
      <span class="small">Pentru fiecare familie se alege cel mai ușor profil care verifică.</span></div>
    ${rows.length ? rows.map((r) => {
      for (const x of [...r.steel, r.concrete, r.timber]) if (x) x._id = r.id;
      const cur = r.el.profile ? `${r.el.profile} ${r.el.grade || ''}` : `${MATERIALS[r.el.material]?.name || r.el.material} ${Math.round(r.el.w * 100)}×${Math.round(r.el.d * 100)} cm`;
      return `<section class="beam card"><header><b>${esc(r.name)}</b> · ${esc(r.storey)} · H = ${fmt(r.H)} m · G<sub>k</sub> = ${fmt(r.G, 1)} kN (fără greutatea proprie) · Q<sub>k</sub> = ${fmt(r.Q, 1)} kN <span class="small">· acum: ${esc(cur)}</span>
        <span class="hbtns">${view3dBtn(r.id)}<button class="mini" data-goto="${r.id}">Arată pe plan</button></span></header>
        <div class="opts">
          ${r.steel.map((x) => opt(x, 'steel', x.name, `${fmt(x.mass, 0)} kg pe stâlp · decide: ${x.governs}`)).join('')}
          ${opt(r.concrete, 'concrete', r.concrete ? r.concrete.name : 'Beton armat', r.concrete ? `${r.concrete.rebar}; ${r.concrete.stirrups}` : '')}
          ${opt(r.timber, 'timber', r.timber ? r.timber.name : 'Lemn lamelar GL24h', '')}
        </div></section>`;
    }).join('') : '<div class="empty">Proiectul nu are stâlpi. Desenează unul cu unealta Stâlp (C).</div>'}`;
  openPage('beams', 'Dimensionare structură', html);
  const pb = $('#page-body');
  pb.onchange = (e) => {
    if (e.target.id === 'bgrade') { beamGrade = e.target.value; openColumns(); }
    if (e.target.id === 'cbeta') { colBeta = parseFloat(e.target.value); openColumns(); }
  };
  pb.onclick = (e) => {
    const t = e.target.closest('[data-dtab]');
    if (t) { if (t.dataset.dtab === 'beams') openBeams(); if (t.dataset.dtab === 'lintels') openLintels(); return; }
    const v3 = e.target.closest('[data-v3d]');
    if (v3) { showIn3D(v3.dataset.v3d); return; }
    const g = e.target.closest('[data-goto]');
    if (g) { selectFromPage(g.dataset.goto); return; }
    const b = e.target.closest('[data-apply]');
    if (!b) return;
    const r = rows.find((x) => x.id === b.dataset.col);
    const el = byId(A.p, r.id);
    snapshot();
    if (b.dataset.apply === 'steel') {
      const x = r.steel.find((y) => y.name === b.dataset.name);
      Object.assign(el, { material: 'otel', profile: x.profile, grade: x.grade, w: x.b, d: x.h });
    } else if (b.dataset.apply === 'concrete') {
      delete el.profile; delete el.grade;
      Object.assign(el, { material: 'beton', w: r.concrete.b, d: r.concrete.h, rebar: `${r.concrete.rebar}; ${r.concrete.stirrups}` });
    } else {
      delete el.profile; delete el.grade;
      Object.assign(el, { material: 'lemn', w: r.timber.b, d: r.timber.h });
    }
    emit('model');
    toast(`${r.name}: ${b.dataset.name} aplicat`);
    openColumns();
  };
}

async function openLoads() {
  const { computeLoads, snowLoad } = await import('./loads.js');
  const P = A.p.loads;
  const run = () => { A.loads = computeLoads(A.p); $('#l-loads').hidden = false; };
  run();
  const draw = () => {
    const L = A.loads, S = L.summary;
    const area = A.p.elements.filter((e) => e.type === 'slab').reduce((a, e) => a + Math.abs(require_area(e)), 0);
    const items = L.items.filter((x) => ['wall', 'column', 'beam', 'slab', 'roof'].includes(x.type) && (x.type !== 'wall' || x.bearing));
    let last = '';
    const html = `<div class="notice"><b>Calcul orientativ de predimensionare.</b> Încărcări gravitaționale după SR EN 1990 și SR EN 1991-1-1 / 1-1-3 (valori recomandate, modificabile). Nu include seismul (P100-1/2013), vântul, excentricitățile și armarea. Proiectul de rezistență pentru autorizație se face și se semnează de un inginer structurist atestat și se verifică conform Legii 10/1995.</div>
      <div class="params" id="lp">
        <label><span>Zăpadă la sol s<sub>k</sub> (kN/m²)</span><input class="field" type="number" step="0.1" data-k="sk" value="${P.sk}"><span class="small">CR 1-1-3: ex. București 2,0; Brașov 2,0–2,5; Cluj 1,5</span></label>
        <label><span>Coeficient de expunere C<sub>e</sub></span><input class="field" type="number" step="0.1" data-k="Ce" value="${P.Ce}"><span class="small">0,8 expus · 1,0 normal · 1,2 adăpostit</span></label>
        <label><span>Pereți despărțitori mobili (kN/m²)</span><input class="field" type="number" step="0.1" data-k="partitions" value="${P.partitions}"><span class="small">EN 1991-1-1 6.3.1.2: 0,5 / 0,8 / 1,2</span></label>
        <label><span>Presiune admisibilă teren σ<sub>adm</sub> (kPa)</span><input class="field" type="number" step="10" data-k="sigma" value="${P.sigma}"><span class="small">din studiul geotehnic</span></label>
        <label><span>Coeficienți parțiali γ<sub>G</sub> / γ<sub>Q</sub></span><span style="display:flex;gap:6px"><input class="field" type="number" step="0.05" data-k="gG" value="${P.gG}"><input class="field" type="number" step="0.05" data-k="gQ" value="${P.gQ}"></span><span class="small">combinația fundamentală SLU (6.10)</span></label>
      </div>
      <div class="cards">
        <div class="card"><small>Greutate permanentă G</small><b>${fmt(S.G, 0)} kN</b></div>
        <div class="card"><small>Încărcări variabile Q</small><b>${fmt(S.Q, 0)} kN</b></div>
        <div class="card"><small>SLU: ${P.gG}·G + ${P.gQ}·Q</small><b>${fmt(S.NEd, 0)} kN</b></div>
        <div class="card"><small>Medie pe m² de planșeu (G+Q)</small><b>${area ? fmt((S.G + S.Q) / area, 1) : '—'} kN/m²</b></div>
        <div class="card"><small>Zăpadă pe acoperiș (pantă 0–30°)</small><b>${fmt(snowLoad(P, 0), 2)} kN/m²</b></div>
      </div>
      ${L.warnings.length ? `<ul class="warns">${L.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : '<p class="small">Nicio problemă detectată la coborârea încărcărilor.</p>'}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Element</th><th class="n">Arie aferentă</th><th class="n">G (kN)</th><th class="n">Q (kN)</th><th class="n">N<sub>Ed</sub> / q<sub>Ed</sub></th><th class="n">Utilizare</th><th>Fundație</th><th>Detalii</th></tr></thead><tbody>
      ${items.map((x) => {
        const g = x.storey !== last ? `<tr class="grp"><td colspan="8">${esc(x.storey)}</td></tr>` : ''; last = x.storey;
        const ned = x.type === 'wall' ? `${fmt(x.nEd, 1)} kN/m` : x.type === 'beam' ? `${fmt(x.qEd, 1)} kN/m` : x.type === 'slab' || x.type === 'roof' ? (x.pEd ? `${fmt(x.pEd, 2)} kN/m²` : `g ${fmt(x.g, 2)} + q ${fmt(x.q, 2)} kN/m²`) : `${fmt(x.NEd, 1)} kN`;
        return g + `<tr class="click" data-id="${x.id}"><td>${esc(x.name)}</td><td class="n">${x.trib ? fmt(x.trib) + ' m²' : x.area ? fmt(x.area) + ' m²' : '—'}</td><td class="n">${fmt(x.G, 1)}</td><td class="n">${fmt(x.Q, 1)}</td><td class="n">${ned}</td>
          <td class="n">${x.util != null ? pill(x.util) : '—'}</td><td>${x.B ? (x.type === 'wall' ? 'talpă B ≥ ' : 'bloc ') + fmt(x.B * 100, 0) + ' cm' : x.onGround ? 'pe teren' : ''}</td><td class="small">${x.checks.map(esc).join('<br>')}</td></tr>`;
      }).join('')}</tbody></table></div>`;
    openPage('loads', 'Calcul sarcini', html, '<button class="btn primary" id="ld-beams">Dimensionare grinzi și stâlpi</button> <button class="btn" id="ld-csv">Export CSV</button> <button class="btn" id="ld-plan">Arată pe plan</button> ');
    $('#ld-beams').onclick = openBeams;
    $('#lp').onchange = (e) => { const k = e.target.dataset.k; if (!k) return; snapshot(); A.p.loads[k] = parseFloat(e.target.value) || 0; autosave(); run(); draw(); };
    $('#ld-csv').onclick = () => csvDownload(`Sarcini - ${A.p.name}.csv`, [['Nivel', 'Element', 'Arie aferentă (m²)', 'G (kN)', 'Q (kN)', 'N_Ed (kN)', 'n_Ed (kN/m)', 'Utilizare (%)', 'Fundație (cm)', 'Verificări'],
      ...items.map((x) => [x.storey, x.name, x.trib || x.area || '', x.G, x.Q, x.NEd, x.nEd ?? x.qEd ?? '', x.util != null ? Math.round(x.util * 100) : '', x.B ? Math.round(x.B * 100) : '', x.checks.join(' | ')])]);
    $('#ld-plan').onclick = () => { A.showLoads = true; $('#c-loads').checked = true; $('#page').hidden = true; pageKind = null; setView(work.dataset.view === '3d' ? 'plan' : work.dataset.view); plan.invalidate(); };
    $('#page-body').onclick = (e) => { const tr = e.target.closest('tr[data-id]'); if (tr) selectFromPage(tr.dataset.id); };
  };
  draw();
}
const require_area = (e) => polyArea(e.pts);
$('#b-loads').onclick = openLoads;

// ---------------------------------------------------------------- export IFC și Model 3D
async function ifcText() { const { exportIfc } = await import('./ifc-export.js'); return exportIfc(A.p); }
$('#b-ifc').onclick = async () => {
  try { download(new Blob([await ifcText()], { type: 'application/x-step' }), `${A.p.name}.ifc`); toast('Fișier IFC salvat'); } catch (e) { console.error(e); toast('Exportul IFC a eșuat: ' + e.message, 5000); }
};
$('#b-open3d').onclick = async () => {
  // modelul se pune în biblioteca aplicației Model 3D (aceeași origine) și se deschide acolo
  try {
    const text = await ifcText();
    const blob = new Blob([text], { type: 'application/x-step' });
    const id = 'proiectare:' + (A.p.created || 0);
    const db = await new Promise((res, rej) => { const r = indexedDB.open('bim-models', 1); r.onupgradeneeded = () => { r.result.createObjectStore('meta', { keyPath: 'id' }); r.result.createObjectStore('files'); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    await new Promise((res, rej) => { const t = db.transaction(['meta', 'files'], 'readwrite'); t.objectStore('meta').put({ id, name: A.p.name, size: blob.size, date: Date.now() }); t.objectStore('files').put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); });
    localStorage.setItem('bim:last', JSON.stringify(id));
    location.href = 'viewer/';
  } catch (e) { console.error(e); toast('Nu s-a putut deschide în Model 3D: ' + e.message, 5000); }
};

// ---------------------------------------------------------------- meniul proiectului
$('#b-menu').onclick = () => {
  const d = $('#dlg');
  d.innerHTML = `<form method="dialog"><h2>Proiect</h2><div class="menu">
    <button class="btn" value="qty">Cantități</button>
    <button class="btn" value="loads">Calcul sarcini</button>
    <button class="btn" value="storeys">Niveluri…</button>
    <button class="btn" value="footings">Generează fundațiile sub pereții portanți</button>
    <button class="btn" value="beams">Dimensionare grinzi (IPE / HEA / HEB, beton, lemn)</button>
    <button class="btn" value="cols">Dimensionare stâlpi (HEA / HEB, beton, lemn)</button>
    <button class="btn" value="ifc">Export IFC (ARCHICAD, Revit…)</button>
    <button class="btn" value="open3d">Deschide în Model 3D</button>
    <a class="btn" href="viewer/" style="display:flex;align-items:center;text-decoration:none">Vizualizator 3D (IFC, BIMx)…</a>
    <hr style="border:0;border-top:1px solid var(--border);width:100%">
    <button class="btn" value="new">Proiect nou (gol)</button>
    <button class="btn" value="sample">Încarcă proiectul exemplu</button>
    <button class="btn" value="open">Deschide fișier proiect (.json)…</button>
    <button class="btn" value="save">Salvează fișier proiect (.json)</button>
    </div><p class="small">Proiectul curent se salvează automat în browser. Fișierul .json e copia ta de siguranță și se poate muta pe alt calculator.</p>
    <div class="btns"><button class="btn" value="cancel">Închide</button></div></form>`;
  d.onclose = () => {
    const v = d.returnValue;
    if (v === 'new' || v === 'sample') { snapshot(); A.p = v === 'new' ? newProject() : sampleProject(); A.storey = sortedStoreys(A.p)[0].id; A.sel.clear(); pname.value = A.p.name; emit('model'); emit('storey'); plan.fit(); view3d && (view3d.fitted = false); }
    if (v === 'open') $('#file').click();
    if (v === 'qty') openQty();
    if (v === 'loads') openLoads();
    if (v === 'storeys') storeysDialog();
    if (v === 'footings') makeFootings();
    if (v === 'beams') openBeams();
    if (v === 'cols') openColumns();
    if (v === 'ifc') $('#b-ifc').click();
    if (v === 'open3d') $('#b-open3d').click();
    if (v === 'save') download(new Blob([JSON.stringify(A.p, null, 1)], { type: 'application/json' }), `${A.p.name}.json`);
  };
  d.returnValue = '';
  d.showModal();
};
$('#file').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const p = JSON.parse(await f.text());
    if (!Array.isArray(p.elements) || !Array.isArray(p.storeys)) throw new Error('fișierul nu este un proiect');
    snapshot(); A.p = p; A.storey = sortedStoreys(p)[0].id; A.sel.clear(); pname.value = p.name; emit('model'); emit('storey'); plan.fit();
    toast('Proiect deschis');
  } catch (err) { toast('Nu s-a putut deschide: ' + err.message, 5000); }
};

// ---------------------------------------------------------------- pornire
pname.value = A.p.name;
renderTools(); renderStoreys(); renderSide();
setView((() => { let v = 'split'; try { v = localStorage.getItem('cad:view') || 'split'; } catch { /* */ } return narrow.matches && v === 'split' ? 'plan' : v; })());
updateDrawbar();
requestAnimationFrame(() => { plan.resize(); plan.fit(); plan.status(); });
$('#b-undo').disabled = true; $('#b-redo').disabled = true;
window.__cad = { A, plan, emit, get view3d() { return view3d; } };

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

// Export Excel (.xlsx) cu ExcelJS: antemăsurătoare cu formule, detaliere, tâmplărie, camere și elemente.
import { MATERIALS, COMPOSITES, FINISH, USES, TYPE_NAMES, storeyOf, byId, quantities, sortedStoreys } from './model.js';
import { computeBOQ, joinerySchedule, roomSchedule, structureSchedule } from './boq.js';

const EXCELJS = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
let loading = null;
function loadExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (!loading) {
    loading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = EXCELJS;
      s.onload = () => res(window.ExcelJS);
      s.onerror = () => { loading = null; rej(new Error('Biblioteca Excel nu s-a putut încărca (e nevoie de internet la primul export).')); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

const BLUE = 'FF1F4FD8', LIGHT = 'FFE8EEFC', GREY = 'FFF2F4F8', BORDER = 'FFC9D1DF';
const thin = { style: 'thin', color: { argb: BORDER } };
const box = { top: thin, left: thin, bottom: thin, right: thin };
const NUM = '#,##0.00';

function header(ws, row, titles) {
  const r = ws.getRow(row);
  titles.forEach((t, i) => {
    const c = r.getCell(i + 1);
    c.value = t;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = box;
  });
  r.height = 30;
}
function titleBlock(ws, p, title, cols) {
  ws.mergeCells(1, 1, 1, cols);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { bold: true, size: 15 };
  ws.mergeCells(2, 1, 2, cols);
  ws.getCell(2, 1).value = `Obiectiv: ${p.name}`;
  ws.getCell(2, 1).font = { size: 11 };
  ws.mergeCells(3, 1, 3, cols);
  ws.getCell(3, 1).value = `Generat din modelul BIM (BIM Studio) la ${new Date().toLocaleString('ro-RO')}. Cantitățile de armătură sunt estimate.`;
  ws.getCell(3, 1).font = { size: 9, italic: true, color: { argb: 'FF667085' } };
}
const cellsBorder = (row, n) => { for (let i = 1; i <= n; i++) row.getCell(i).border = box; };

export async function exportExcel(p) {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BIM Studio';
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true; // Excel recalculează formulele la deschidere
  const boq = computeBOQ(p);
  const prices = p.prices || {};
  const vat = p.vat ?? 21;

  // ------------------------------------------------ 1. Antemăsurătoare (cu prețuri și formule)
  const ws = wb.addWorksheet('Antemăsurătoare', { views: [{ state: 'frozen', ySplit: 5 }], pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } } });
  ws.columns = [{ width: 7 }, { width: 13 }, { width: 62 }, { width: 7 }, { width: 13 }, { width: 13 }, { width: 15 }];
  titleBlock(ws, p, 'ANTEMĂSURĂTOARE', 7);
  header(ws, 5, ['Nr. crt.', 'Cod articol', 'Denumirea lucrării', 'U.M.', 'Cantitate', 'Preț unitar (lei)', 'Valoare (lei)']);
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 7 } };
  let r = 6;
  const subtotalCells = [];
  for (const ch of boq.chapters) {
    const hr = ws.getRow(r);
    ws.mergeCells(r, 1, r, 7);
    hr.getCell(1).value = `Capitolul ${boq.chapters.indexOf(ch) + 1}. ${ch.name}`;
    hr.getCell(1).font = { bold: true, color: { argb: BLUE } };
    hr.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
    r++;
    const first = r;
    for (const it of ch.items) {
      const pr = prices[it.key] || {};
      const row = ws.getRow(r);
      row.values = [it.nr, pr.code || '', it.desc, it.um, it.qty, pr.price ? Number(pr.price) : null];
      row.getCell(7).value = { formula: `E${r}*F${r}`, result: (pr.price || 0) * it.qty };
      row.getCell(3).alignment = { wrapText: true, vertical: 'top' };
      for (const c of [5, 6, 7]) row.getCell(c).numFmt = NUM;
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'top' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'top' };
      cellsBorder(row, 7);
      r++;
    }
    const st = ws.getRow(r);
    ws.mergeCells(r, 1, r, 6);
    st.getCell(1).value = `Total capitolul ${boq.chapters.indexOf(ch) + 1}`;
    st.getCell(1).alignment = { horizontal: 'right' };
    st.getCell(7).value = { formula: `SUM(G${first}:G${r - 1})` };
    st.getCell(7).numFmt = NUM;
    st.font = { bold: true };
    st.getCell(1).fill = st.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
    cellsBorder(st, 7);
    subtotalCells.push(`G${r}`);
    r += 2;
  }
  const tot = (label, formula, bold) => {
    const row = ws.getRow(r);
    ws.mergeCells(r, 1, r, 6);
    row.getCell(1).value = label;
    row.getCell(1).alignment = { horizontal: 'right' };
    row.getCell(7).value = { formula };
    row.getCell(7).numFmt = NUM;
    row.font = { bold: !!bold, size: bold ? 12 : 11 };
    cellsBorder(row, 7);
    return `G${r++}`;
  };
  const total = tot('TOTAL fără TVA', subtotalCells.join('+') || '0', true);
  ws.getCell(r, 5).value = 'Cota TVA (%)';
  ws.getCell(r, 6).value = vat;
  const vatCell = `F${r}`;
  r++;
  const tva = tot('TVA', `${total}*${vatCell}/100`);
  tot('TOTAL cu TVA', `${total}+${tva}`, true);
  r++;
  ws.getCell(r, 1).value = 'Prețurile unitare și codurile de articol se completează în coloanele B și F (sau în aplicație, la Antemăsurătoare). Valorile se recalculează automat.';
  ws.getCell(r, 1).font = { italic: true, size: 9, color: { argb: 'FF667085' } };

  // ------------------------------------------------ 2. Detaliere
  const wd = wb.addWorksheet('Detaliere', { views: [{ state: 'frozen', ySplit: 5 }] });
  wd.columns = [{ width: 7 }, { width: 46 }, { width: 22 }, { width: 14 }, { width: 44 }, { width: 12 }, { width: 7 }];
  titleBlock(wd, p, 'DETALIEREA CANTITĂȚILOR PE ELEMENTE', 7);
  header(wd, 5, ['Nr. art.', 'Articol', 'Element', 'Nivel', 'Mod de calcul', 'Cantitate', 'U.M.']);
  r = 6;
  for (const ch of boq.chapters) {
    for (const it of ch.items) {
      const first = r;
      for (const d of it.det) {
        const row = wd.getRow(r++);
        row.values = [it.nr, it.desc, d.el, d.storey, d.calc, Math.round(d.qty * 1000) / 1000, it.um];
        row.getCell(6).numFmt = '#,##0.000';
        row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
        cellsBorder(row, 7);
      }
      const row = wd.getRow(r);
      row.values = [it.nr, `Total articol ${it.nr}`, '', '', '', { formula: `SUM(F${first}:F${r - 1})` }, it.um];
      row.font = { bold: true };
      row.getCell(6).numFmt = NUM;
      for (let i = 1; i <= 7; i++) row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
      cellsBorder(row, 7);
      r++;
    }
  }

  // ------------------------------------------------ 3. Tâmplărie
  const wt = wb.addWorksheet('Tâmplărie', { views: [{ state: 'frozen', ySplit: 5 }] });
  wt.columns = [{ width: 9 }, { width: 11 }, { width: 22 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 13 }, { width: 18 }, { width: 9 }, { width: 8 }, { width: 11 }, { width: 11 }, { width: 22 }];
  titleBlock(wt, p, 'TABEL DE TÂMPLĂRIE', 13);
  header(wt, 5, ['Marcaj', 'Tip', 'Denumire', 'Lățime (m)', 'Înălțime (m)', 'Parapet (m)', 'Material', 'Vitraj', 'Uw', 'Buc.', 'Arie / buc (m²)', 'Arie totală (m²)', 'Niveluri']);
  r = 6;
  for (const g of joinerySchedule(p)) {
    const o = g.o;
    const row = wt.getRow(r);
    row.values = [g.mark, o.type === 'window' ? 'Fereastră' : 'Ușă', o.name || '', o.width, o.height, o.sill, o.frame || '', o.glazing || (o.type === 'door' ? (o.kind || '') : ''), o.uw || null, g.count, Math.round(o.width * o.height * 10000) / 10000];
    row.getCell(12).value = { formula: `J${r}*K${r}` };
    row.getCell(13).value = [...g.storeys].join(', ');
    for (const c of [4, 5, 6, 11, 12]) row.getCell(c).numFmt = NUM;
    cellsBorder(row, 13);
    r++;
  }
  const tr = wt.getRow(r);
  tr.values = ['TOTAL', '', '', '', '', '', '', '', '', { formula: `SUM(J6:J${r - 1})` }, '', { formula: `SUM(L6:L${r - 1})` }];
  tr.font = { bold: true };
  tr.getCell(12).numFmt = NUM;
  cellsBorder(tr, 13);

  // ------------------------------------------------ 4. Camere și finisaje
  const wr = wb.addWorksheet('Camere', { views: [{ state: 'frozen', ySplit: 5 }] });
  wr.columns = [{ width: 12 }, { width: 8 }, { width: 18 }, { width: 11 }, { width: 11 }, { width: 10 }, { width: 11 }, { width: 24 }, { width: 30 }, { width: 26 }];
  titleBlock(wr, p, 'TABEL DE CAMERE ȘI FINISAJE', 10);
  header(wr, 5, ['Nivel', 'Nr.', 'Denumire', 'Arie utilă (m²)', 'Perimetru (m)', 'Înălțime (m)', 'Volum (m³)', 'Pardoseală', 'Pereți', 'Tavan']);
  r = 6;
  let lastSt = null, stFirst = 6;
  const rooms = roomSchedule(p);
  rooms.forEach((x, i) => {
    if (x.storey !== lastSt) { lastSt = x.storey; stFirst = r; }
    const row = wr.getRow(r);
    row.values = [x.storey, x.z.number || '', x.z.name || '', x.A, x.P, x.H, null, FINISH.floor[x.z.floor] || '', (FINISH.walls[x.z.walls] || '') + (x.z.walls === 'faianta' ? ` (h = ${String(x.z.tileH || 2.1).replace('.', ',')} m)` : ''), FINISH.ceiling[x.z.ceiling] || ''];
    row.getCell(7).value = { formula: `D${r}*F${r}` };
    for (const c of [4, 5, 6, 7]) row.getCell(c).numFmt = NUM;
    cellsBorder(row, 10);
    r++;
    if (!rooms[i + 1] || rooms[i + 1].storey !== x.storey) {
      const s = wr.getRow(r);
      s.values = [`Total ${x.storey}`, '', '', { formula: `SUM(D${stFirst}:D${r - 1})` }, '', '', { formula: `SUM(G${stFirst}:G${r - 1})` }];
      s.font = { bold: true };
      s.getCell(4).numFmt = s.getCell(7).numFmt = NUM;
      for (let c = 1; c <= 10; c++) s.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
      cellsBorder(s, 10);
      r += 2;
    }
  });

  // ------------------------------------------------ Structură: metraj pe elemente (corespunde planului de stabilitate)
  {
    const wsS = wb.addWorksheet('Structură', { views: [{ state: 'frozen', ySplit: 5 }], pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    wsS.columns = [{ width: 16 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 22 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 11 }, { width: 34 }];
    titleBlock(wsS, p, 'METRAJ ELEMENTE STRUCTURALE (PLAN STABILITATE)', 11);
    header(wsS, 5, ['Element', 'Nivel', 'Tip', 'Secțiune', 'Dimensiune', 'Beton (m³)', 'Cofraj (m²)', 'Armătură BST500S (kg, est.)', 'Oțel profile (kg)', 'Lemn (m³)', 'Observații']);
    const rowsS = structureSchedule(p);
    let rr = 6;
    for (const x of rowsS) {
      const row = wsS.getRow(rr++);
      row.values = [x.id.toUpperCase(), x.storey, x.type, x.sec, x.dim, x.conc || null, x.form || null, x.rebar || null, x.steel || null, x.timber || null, x.note];
      for (const c of [6, 7, 8, 9, 10]) row.getCell(c).numFmt = NUM;
      cellsBorder(row, 11);
    }
    const tot = wsS.getRow(rr);
    tot.getCell(1).value = 'TOTAL';
    tot.getCell(1).font = { bold: true };
    for (const c of [6, 7, 8, 9, 10]) {
      const col = String.fromCharCode(64 + c);
      const cell = tot.getCell(c);
      cell.value = rowsS.length ? { formula: `SUM(${col}6:${col}${rr - 1})`, result: rowsS.reduce((a, x) => a + ([0, 0, 0, 0, 0, x.conc, x.form, x.rebar, x.steel, x.timber][c - 1] || 0), 0) } : 0;
      cell.numFmt = NUM; cell.font = { bold: true };
    }
    cellsBorder(tot, 11);
    wsS.getRow(rr + 2).getCell(1).value = 'Armătura este estimată din consumuri specifice (kg/m³) – se înlocuiește cu extrasul de armătură din proiectul de rezistență.';
    wsS.getRow(rr + 2).getCell(1).font = { italic: true, size: 9 };
  }

  // ------------------------------------------------ 5. Elemente
  const we = wb.addWorksheet('Elemente', { views: [{ state: 'frozen', ySplit: 5 }] });
  we.columns = [{ width: 9 }, { width: 14 }, { width: 12 }, { width: 44 }, { width: 80 }];
  titleBlock(we, p, 'LISTA ELEMENTELOR MODELULUI', 5);
  header(we, 5, ['ID', 'Tip', 'Nivel', 'Structură / material', 'Cantități și proprietăți']);
  r = 6;
  const order = ['footing', 'wall', 'column', 'beam', 'slab', 'roof', 'window', 'door', 'zone'];
  const els = p.elements.filter((e) => e.type !== 'dim').sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  for (const e of els) {
    const host = e.wall ? byId(p, e.wall) || e : e;
    const q = quantities(p, e);
    const row = we.getRow(r++);
    row.values = [e.id.toUpperCase(), TYPE_NAMES[e.type] || e.type, storeyOf(p, host).name,
      COMPOSITES[e.composite]?.name || MATERIALS[e.material]?.name || (e.type === 'zone' ? e.name : '') || '',
      Object.entries(q).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toLocaleString('ro-RO') : v}`).join('; ') + (e.use ? `; Folosință: ${USES[e.use]?.name || e.use}` : '')];
    row.getCell(5).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(4).alignment = { wrapText: true, vertical: 'top' };
    cellsBorder(row, 5);
  }

  // ------------------------------------------------ 6. Niveluri
  const wn = wb.addWorksheet('Niveluri');
  wn.columns = [{ width: 18 }, { width: 14 }, { width: 16 }, { width: 18 }];
  titleBlock(wn, p, 'NIVELURI', 4);
  header(wn, 5, ['Nivel', 'Cotă (m)', 'Înălțime nivel (m)', 'Arie utilă camere (m²)']);
  r = 6;
  for (const s of sortedStoreys(p)) {
    const A = rooms.filter((x) => x.storey === s.name).reduce((a, x) => a + x.A, 0);
    const row = wn.getRow(r++);
    row.values = [s.name, s.elev, s.height, A];
    for (const c of [2, 3, 4]) row.getCell(c).numFmt = NUM;
    cellsBorder(row, 4);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

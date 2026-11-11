// Generator PDF minimal: fiecare pagină conține o imagine JPEG (planșa desenată pe canvas) pe toată foaia.
// Nu folosește biblioteci externe – funcționează și offline.
const enc = new TextEncoder();

async function jpegBytes(canvas, q = 0.92) {
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));
  return new Uint8Array(await blob.arrayBuffer());
}

// pages: [{ canvas, wPt, hPt }] (dimensiunea foii în puncte PDF, 1 pt = 1/72 inch)
export async function canvasesToPDF(pages, title = 'Plan') {
  const chunks = [], offsets = [];
  let size = 0;
  const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); size += b.length; };
  const obj = (n, body) => { offsets[n] = size; put(`${n} 0 obj\n`); for (const b of [].concat(body)) put(b); put('\nendobj\n'); };
  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = pages.length;
  // 1 catalog, 2 pagini, 3 info; apoi pentru fiecare pagină: pagină, conținut, imagine
  const pageIds = pages.map((_, i) => 4 + i * 3);
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${n} >>`);
  const esc = (s) => String(s).replace(/[^\x20-\x7e]/g, (ch) => ({ 'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't', 'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T', 'é': 'e', 'è': 'e', 'ê': 'e', 'à': 'a', 'ç': 'c' }[ch] || '?')).replace(/([()\\])/g, '\\$1');
  obj(3, `<< /Title (${esc(title)}) /Producer (BIM Studio) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}) >>`);
  for (let i = 0; i < n; i++) {
    const { canvas, wPt, hPt } = pages[i];
    const id = pageIds[i], img = await jpegBytes(canvas);
    const content = `q ${wPt.toFixed(2)} 0 0 ${hPt.toFixed(2)} 0 0 cm /Im0 Do Q`;
    obj(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt.toFixed(2)} ${hPt.toFixed(2)}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`);
    obj(id + 1, [`<< /Length ${content.length} >>\nstream\n`, content, '\nendstream']);
    obj(id + 2, [`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`, img, '\nendstream']);
  }
  const total = 4 + n * 3;
  const xref = size;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) x += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  put(x);
  put(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

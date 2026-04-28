/**
 * exportUtils.js — Shared export helpers for all teacher tools
 * Supports: CSV, Excel (XML), PDF (via html-to-image + jsPDF), JPG, PNG
 */

const FONT = "'Kanit', 'Noto Sans Thai', Arial, sans-serif";

// ── CSV ──────────────────────────────────────────────────────────────────────
export function downloadCSV(csvString, filename) {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8' });
  _triggerDownload(URL.createObjectURL(blob), filename + '.csv');
}

// ── Excel (XML — no library needed, opens natively in Excel) ────────────────
export function downloadExcel(headers, rows, filename, sheetName = 'Sheet1') {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles>';
  xml += '<Style ss:ID="hdr"><Font ss:Bold="1" ss:Size="12"/><Interior ss:Color="#DCE6F1" ss:Pattern="Solid"/></Style>';
  xml += '<Style ss:ID="def"><Font ss:Size="11"/></Style>';
  xml += '</Styles>\n';
  xml += `<Worksheet ss:Name="${esc(sheetName)}"><Table>\n`;
  xml += '<Row ss:StyleID="hdr">';
  headers.forEach(h => { xml += `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`; });
  xml += '</Row>\n';
  rows.forEach(row => {
    xml += '<Row ss:StyleID="def">';
    row.forEach(cell => {
      const isNum = !isNaN(cell) && cell !== '' && cell !== null && cell !== undefined;
      xml += `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${esc(cell)}</Data></Cell>`;
    });
    xml += '</Row>\n';
  });
  xml += '</Table></Worksheet></Workbook>';
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  _triggerDownload(URL.createObjectURL(blob), filename + '.xls');
}

// ── PDF from HTML string (renders Thai properly via browser engine) ──────────
export async function downloadHTMLAsPDF(htmlContent, filename, pageWidth = 794) {
  // Create off-screen container
  const div = document.createElement('div');
  div.style.cssText = `position:fixed;left:-9999px;top:0;width:${pageWidth}px;padding:48px;background:#fff;font-family:${FONT};font-size:13px;line-height:1.7;color:#1e293b;`;
  div.innerHTML = htmlContent;
  document.body.appendChild(div);

  try {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(div, { quality: 0.95, pixelRatio: 1.5 });
    const img = new Image();
    img.src = dataUrl;
    await new Promise(r => { img.onload = r; });

    const { jsPDF } = await import('jspdf');
    const pdfW = img.width * 0.75; // px to pt
    const pdfH = img.height * 0.75;
    const pdf = new jsPDF({ orientation: pdfW > pdfH ? 'l' : 'p', unit: 'pt', format: [pdfW, pdfH] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(filename + '.pdf');
  } finally {
    document.body.removeChild(div);
  }
}

// ── PDF from Canvas element ──────────────────────────────────────────────────
export async function downloadCanvasAsPDF(canvas, filename) {
  const { jsPDF } = await import('jspdf');
  const imgData = canvas.toDataURL('image/png');
  const w = canvas.width * 0.75;
  const h = canvas.height * 0.75;
  const pdf = new jsPDF({ orientation: w > h ? 'l' : 'p', unit: 'pt', format: [w, h] });
  pdf.addImage(imgData, 'PNG', 0, 0, w, h);
  pdf.save(filename + '.pdf');
}

// ── PDF from DOM element ref ─────────────────────────────────────────────────
export async function downloadElementAsPDF(element, filename) {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 1.5 });
  const img = new Image();
  img.src = dataUrl;
  await new Promise(r => { img.onload = r; });
  const { jsPDF } = await import('jspdf');
  const pdfW = img.width * 0.75;
  const pdfH = img.height * 0.75;
  const pdf = new jsPDF({ orientation: pdfW > pdfH ? 'l' : 'p', unit: 'pt', format: [pdfW, pdfH] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
  pdf.save(filename + '.pdf');
}

// ── JPG from Canvas ──────────────────────────────────────────────────────────
export function downloadCanvasAsJPG(canvas, filename, quality = 0.92) {
  _triggerDownload(canvas.toDataURL('image/jpeg', quality), filename + '.jpg');
}

// ── PNG from Canvas ──────────────────────────────────────────────────────────
export function downloadCanvasAsPNG(canvas, filename) {
  _triggerDownload(canvas.toDataURL('image/png'), filename + '.png');
}

// ── JPG from DOM element ref ─────────────────────────────────────────────────
export async function downloadElementAsJPG(element, filename, quality = 0.92) {
  const { toJpeg } = await import('html-to-image');
  const dataUrl = await toJpeg(element, { quality, pixelRatio: 1.5 });
  _triggerDownload(dataUrl, filename + '.jpg');
}

// ── PNG from DOM element ref ─────────────────────────────────────────────────
export async function downloadElementAsPNG(element, filename) {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 1.5 });
  _triggerDownload(dataUrl, filename + '.png');
}

// ── Internal helper ──────────────────────────────────────────────────────────
function _triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Table HTML builder (for PDF export of tabular data) ─────────────────────
export function buildTableHTML(title, headers, rows, summaryRows = []) {
  const headerCells = headers.map(h => `<th style="background:#0b0b24;color:#fff;padding:10px 14px;text-align:left;font-weight:700;">${h}</th>`).join('');
  const bodyRows = rows.map((row, i) =>
    `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">${
      row.map(cell => `<td style="padding:9px 14px;border-bottom:1px solid #e2e8f0;">${cell ?? ''}</td>`).join('')
    }</tr>`
  ).join('');
  const summaryHTML = summaryRows.map(([label, value]) =>
    `<tr style="background:#eff6ff;font-weight:700;"><td colspan="${headers.length - 1}" style="padding:9px 14px;text-align:right;">${label}</td><td style="padding:9px 14px;">${value}</td></tr>`
  ).join('');

  return `
    <div style="font-family:${FONT};">
      <h2 style="color:#0b0b24;margin:0 0 16px;font-size:20px;border-bottom:3px solid #00b4e6;padding-bottom:10px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}${summaryHTML}</tbody>
      </table>
      <p style="color:#94a3b8;font-size:11px;margin-top:16px;text-align:right;">
        สร้างโดย SPUBUS MAGIC · ${new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}
      </p>
    </div>`;
}

// ── Text HTML builder (for PDF export of text content) ──────────────────────
export function buildTextHTML(title, textContent) {
  const escaped = textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const withBreaks = escaped.replace(/\n/g, '<br/>');
  return `
    <div style="font-family:${FONT};">
      <h2 style="color:#0b0b24;margin:0 0 16px;font-size:20px;border-bottom:3px solid #00b4e6;padding-bottom:10px;">${title}</h2>
      <div style="line-height:1.8;font-size:13px;color:#1e293b;">${withBreaks}</div>
      <p style="color:#94a3b8;font-size:11px;margin-top:16px;text-align:right;">
        สร้างโดย SPUBUS MAGIC · ${new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}
      </p>
    </div>`;
}

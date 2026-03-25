// ===================================================
// Export Utilities — PNG, JPG, PDF, PPTX
// All use dynamic imports for Next.js browser compat
// ===================================================

function getFileName(formData, ext) {
  const d = new Date().toISOString().slice(0, 10);
  const platform = formData.platform || 'general';
  const design = formData.designType || 'poster';
  return `biz-content_${platform}_${design}_${d}.${ext}`;
}

function getNode(nodeId) {
  const node = document.getElementById(nodeId);
  if (!node) throw new Error('Preview element not found');
  return node;
}

export async function exportToPng(formData, nodeId = 'poster-canvas', scale = 2) {
  const { toPng } = await import('html-to-image');
  const node = getNode(nodeId);
  const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: true, quality: 1 });
  downloadDataUrl(dataUrl, getFileName(formData, 'png'));
}

export async function exportToJpg(formData, nodeId = 'poster-canvas', scale = 2) {
  const { toJpeg } = await import('html-to-image');
  const node = getNode(nodeId);
  const dataUrl = await toJpeg(node, { pixelRatio: scale, cacheBust: true, quality: 0.95, backgroundColor: '#000' });
  downloadDataUrl(dataUrl, getFileName(formData, 'jpg'));
}

export async function exportToPdf(formData, preset, nodeId = 'poster-canvas', scale = 2) {
  const { toPng } = await import('html-to-image');
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
  const node = getNode(nodeId);
  const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: true });

  const w = preset?.w || 1200;
  const h = preset?.h || 1200;
  const orientation = w > h ? 'landscape' : 'portrait';

  const maxMm = 297;
  const ratio = w / h;
  let pdfW, pdfH;
  if (orientation === 'landscape') { pdfW = maxMm; pdfH = maxMm / ratio; }
  else { pdfH = maxMm; pdfW = maxMm * ratio; }

  const pdf = new jsPDF({ orientation, unit: 'mm', format: [pdfW, pdfH] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
  pdf.save(getFileName(formData, 'pdf'));
}

export async function exportToPptx(formData, preset, nodeId = 'poster-canvas', scale = 2) {
  // Load pptxgenjs from CDN to avoid node:https bundle issue
  if (!window.PptxGenJS) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/gitbrent/PptxGenJS@3.12.0/dist/pptxgen.bundle.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { toPng } = await import('html-to-image');
  const node = getNode(nodeId);
  const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: true });

  const w = preset?.w || 1200;
  const h = preset?.h || 1200;
  const ratio = w / h;

  let slideW, slideH;
  if (ratio >= 1) { slideW = 10; slideH = 10 / ratio; }
  else { slideH = 10; slideW = 10 * ratio; }

  const pptx = new window.PptxGenJS();
  pptx.author = 'SPUBUS BiZ CONTENT';
  pptx.title = formData.title || 'AI Poster';
  pptx.defineLayout({ name: 'POSTER', width: slideW, height: slideH });
  pptx.layout = 'POSTER';

  const slide = pptx.addSlide();
  slide.addImage({ data: dataUrl, x: 0, y: 0, w: slideW, h: slideH });
  pptx.writeFile({ fileName: getFileName(formData, 'pptx') });
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

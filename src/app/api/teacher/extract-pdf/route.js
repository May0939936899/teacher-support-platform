import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const ext = file.name.split('.').pop().toLowerCase();

    // === PDF ===
    if (ext === 'pdf') {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Use pdf-parse for text extraction
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const data = await pdfParse(buffer);

      const text = data.text || '';
      const numPages = data.numpages || 0;

      if (text.trim().length < 30) {
        return NextResponse.json({
          text: '',
          numPages,
          isScanned: true,
          message: 'PDF นี้อาจเป็นแบบสแกน (รูปภาพ) ไม่มีข้อความ — ลองใช้รูปภาพแทน',
        });
      }

      // Limit text to ~50000 chars to prevent token overflow
      const trimmedText = text.length > 50000 ? text.substring(0, 50000) + '\n\n[...ข้อความถูกตัดเนื่องจากยาวเกินไป]' : text;

      return NextResponse.json({
        text: trimmedText,
        numPages,
        totalChars: text.length,
        isScanned: false,
      });
    }

    // === PPTX ===
    if (ext === 'pptx' || ext === 'ppt') {
      const JSZip = (await import('jszip')).default;
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      let text = '';
      const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort();

      for (const sf of slideFiles) {
        const xml = await zip.files[sf].async('string');
        const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
        if (matches) {
          const slideText = matches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ');
          text += slideText + '\n';
        }
      }

      return NextResponse.json({
        text: text.trim(),
        numSlides: slideFiles.length,
        totalChars: text.length,
      });
    }

    // === TXT ===
    if (ext === 'txt' || ext === 'text') {
      const text = await file.text();
      return NextResponse.json({ text, totalChars: text.length });
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  } catch (err) {
    console.error('Extract PDF error:', err);
    return NextResponse.json({ error: `อ่านไฟล์ไม่สำเร็จ: ${err.message}` }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

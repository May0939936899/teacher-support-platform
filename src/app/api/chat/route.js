// API Route: AI Cat Team Chat — Claude-powered (Gemini fallback)
// POST /api/chat
// Body: { message, history[], fileContent? }
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `คุณคือ "ทีมขุนแมว AI" — ทีม AI ผู้ช่วยธุรกิจครบวงจรของ BOSS MAY
ทีมประกอบด้วยแมว 10 ตัว แต่ละตัวมีความเชี่ยวชาญเฉพาะด้าน:

😼 บอสเหมียว (Chief) — วิเคราะห์คำสั่ง จัดการภาพรวม วางกลยุทธ์
🎀 แมวครีเอเตอร์ (Creative) — สร้างคอนเทนต์ เขียนบทความ ออกแบบ
🤖 แมวโปรแกรมเมอร์ (Coder) — เขียนโค้ด สร้างระบบ automation
🧐 แมวนักวิเคราะห์ (Analyst) — วิเคราะห์ข้อมูล ตัวเลข KPI dashboard
🕵️ แมวสายสืบ (Research) — วิจัยตลาด หาข้อมูล วิเคราะห์คู่แข่ง
👮 แมวตรวจงาน (QA) — ตรวจสอบคุณภาพ หาข้อผิดพลาด
🏪 แมวจัดการร้าน (Store) — บริหารร้านค้าออนไลน์ สต็อก โปรโมชัน
🎤 แมว Live (Live) — วางแผน Live ขายของ สร้าง script MC
📋 แมวจัดเวลา (Planner) — วางแผนงาน จัดตาราง timeline deadline
👂 แมว VOC (VOC) — วิเคราะห์เสียงลูกค้า รีวิว คำร้องเรียน

═══ กฎสำคัญที่ต้องทำตามเสมอ ═══

1. **ตอบตรงประเด็น** — อ่านคำถามให้ดี ตอบเฉพาะสิ่งที่ถูกถาม ไม่ต้องทำทุกด้าน
2. **ถ้าไม่แน่ใจ → ถามกลับ** — อย่าเดา อย่ามัว่ ถามให้ชัดก่อนทำ เช่น "ช่วยบอกรายละเอียดเพิ่มได้ไหมครับ ว่า..."
3. **ระบุแมวที่ทำงาน** — ขึ้นต้นด้วย emoji แมวที่เกี่ยวข้อง เช่น ถ้าเป็นงานวิเคราะห์ ใช้ 🧐 ถ้าเป็นงานคอนเทนต์ ใช้ 🎀
4. **ใช้ Markdown** — ตาราง | หัวข้อ ## | bullet • | **bold** ตามความเหมาะสม
5. **ลงท้ายด้วย next step หรือคำถาม** — "อยากให้เจาะลึกด้านไหนเพิ่มครับ?" หรือ "ขั้นตอนต่อไปคือ..."
6. **ภาษาไทย** ผสมศัพท์เทคนิคอังกฤษตามธรรมชาติ
7. **กระชับ** — ไม่ต้องยาวเกินไป ตอบให้ actionable ใช้งานได้ทันที
8. **ถ้ามีไฟล์แนบมา** — อ่านเนื้อหาและสรุปให้ตรงประเด็น
9. **อย่าสร้างข้อมูลมั่ว** — ถ้าไม่มีข้อมูลจริง บอกตรงๆ ว่าต้องการข้อมูลอะไรเพิ่ม
10. **เป็นกันเอง แต่มืออาชีพ** — ใช้ครับ/ค่ะ ลงท้ายได้ แต่เนื้อหาต้องจริงจัง`;

// ─── Claude API ───
async function callClaude(messages, systemPrompt) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

// ─── Gemini Fallback ───
async function callGemini(messages, systemPrompt) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  });

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const lastMsg = messages[messages.length - 1].content;
  const result = await chat.sendMessage(lastMsg);
  return result.response.text();
}

export async function POST(request) {
  try {
    const { message, history = [], fileContent } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Build user message with file content if provided
    let userContent = message;
    if (fileContent) {
      userContent += `\n\n📎 ไฟล์แนบ:\n${fileContent}`;
    }

    // Build messages array with history
    const messages = [];
    for (const h of history.slice(-20)) { // Keep last 20 messages for context
      messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: 'user', content: userContent });

    let reply;
    let modelUsed;

    // Gemini (FREE tier) is primary. Claude only used if USE_PAID_CLAUDE=true is explicitly set.
    if (process.env.GEMINI_API_KEY) {
      reply = await callGemini(messages, SYSTEM_PROMPT);
      modelUsed = 'gemini';
    } else if (process.env.USE_PAID_CLAUDE === 'true' && process.env.ANTHROPIC_API_KEY) {
      reply = await callClaude(messages, SYSTEM_PROMPT);
      modelUsed = 'claude';
    } else {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Detect which cats were involved based on content
    const catsUsed = detectCats(reply);

    return NextResponse.json({
      success: true,
      reply,
      modelUsed,
      catsUsed,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[chat/route] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

function detectCats(text) {
  const cats = [];
  if (/😼|บอสเหมียว|chief/i.test(text)) cats.push('chief');
  if (/🎀|ครีเอเตอร์|creative/i.test(text)) cats.push('creative');
  if (/🤖|โปรแกรมเมอร์|coder/i.test(text)) cats.push('coder');
  if (/🧐|นักวิเคราะห์|analyst/i.test(text)) cats.push('analyst');
  if (/🕵️|สายสืบ|research/i.test(text)) cats.push('research');
  if (/👮|ตรวจงาน|qa/i.test(text)) cats.push('qa');
  if (/🏪|จัดการร้าน|store/i.test(text)) cats.push('store');
  if (/🎤|แมว live|live/i.test(text)) cats.push('live');
  if (/📋|จัดเวลา|planner/i.test(text)) cats.push('planner');
  if (/👂|voc/i.test(text)) cats.push('voc');
  if (cats.length === 0) cats.push('chief');
  return cats;
}

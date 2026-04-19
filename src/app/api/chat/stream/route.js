// API Route: AI Cat Team Chat — Streaming (SSE)
// POST /api/chat/stream
// Body: { message, history[], fileContent? }

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

═══ กฎสำคัญ ═══
1. ตอบตรงประเด็น — ตอบเฉพาะสิ่งที่ถูกถาม
2. ถ้าไม่แน่ใจ → ถามกลับก่อน อย่าเดา อย่ามั่ว
3. ระบุแมวที่ทำงาน — ขึ้นต้นด้วย emoji แมวที่เกี่ยวข้อง
4. ใช้ Markdown — ตาราง | หัวข้อ ## | bullet | **bold**
5. ลงท้ายด้วย next step หรือคำถาม
6. ภาษาไทยผสมศัพท์เทคนิคอังกฤษ
7. กระชับ actionable ใช้งานได้ทันที
8. อย่าสร้างข้อมูลมั่ว — ถ้าไม่รู้ให้บอกตรงๆ
9. เป็นกันเอง แต่มืออาชีพ`;

export async function POST(request) {
  try {
    const { message, history = [], fileContent } = await request.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'message is required' }), { status: 400 });
    }

    let userContent = message;
    if (fileContent) userContent += `\n\n📎 ไฟล์แนบ:\n${fileContent}`;

    const messages = [];
    for (const h of history.slice(-20)) {
      messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: 'user', content: userContent });

    // Gemini (FREE tier) is primary. Claude only used if USE_PAID_CLAUDE=true is explicitly set.
    if (process.env.GEMINI_API_KEY) {
      return await streamGemini(messages);
    }
    if (process.env.USE_PAID_CLAUDE === 'true' && process.env.ANTHROPIC_API_KEY) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      });
      return streamFromAnthropicStream(stream);
    }

    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
  } catch (err) {
    console.error('[stream] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function streamFromAnthropicStream(stream) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', model: 'claude' })}\n\n`));

        let fullText = '';
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullText += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}

async function streamGemini(messages) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const lastMsg = messages[messages.length - 1].content;
  const result = await chat.sendMessageStream(lastMsg);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', model: 'gemini' })}\n\n`));

        let fullText = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

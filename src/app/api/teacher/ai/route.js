import { NextResponse } from 'next/server';

// ============================================================
// Teacher AI API — supports Anthropic (primary) + Gemini (fallback)
// ============================================================

async function callAnthropic(messages, maxTokens = 4096) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn('Anthropic API error:', err.error?.message || res.status);
    return null; // Fall through to Gemini
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callGemini(prompt, imageData = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('ไม่มี AI API key — กรุณาตั้งค่า ANTHROPIC_API_KEY หรือ GEMINI_API_KEY ใน .env.local');

  const model = imageData ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts = [];
  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: imageData.mediaType || 'image/png',
        data: imageData.base64,
      },
    });
  }
  parts.push({ text: prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(request) {
  try {
    const { tool, payload } = await request.json();
    if (!tool || !payload) {
      return NextResponse.json({ error: 'Missing tool or payload' }, { status: 400 });
    }

    // Check if at least one API key exists
    if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'ไม่มี AI API key — กรุณาตั้งค่า ANTHROPIC_API_KEY หรือ GEMINI_API_KEY ใน .env.local' }, { status: 500 });
    }

    let prompt = '';

    switch (tool) {
      case 'letter_writer':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการเขียนจดหมายราชการภาษาไทย
เขียนจดหมายราชการภาษาไทยที่ถูกต้องตามแบบแผนราชการ

ข้อมูล:
- เรื่อง: ${payload.subject}
- ผู้รับ/ตำแหน่ง: ${payload.recipient}
- หน่วยงานผู้รับ: ${payload.recipientOrg || ''}
- จุดประสงค์: ${payload.purpose}
- รายละเอียดเพิ่มเติม: ${payload.details || ''}
- ผู้ส่ง/ตำแหน่ง: ${payload.sender || 'อาจารย์'}
- หน่วยงานผู้ส่ง: ${payload.senderOrg || 'มหาวิทยาลัย'}
- วันที่: ${payload.date || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}

ให้เขียนจดหมายราชการที่สมบูรณ์ ครบถ้วน มีรูปแบบถูกต้อง ได้แก่:
1. ที่ (เลขที่หนังสือ)
2. ส่วนหัวจดหมาย
3. เรียน (ผู้รับ)
4. เนื้อหา (อ้างถึง + ความเป็นมา + จุดประสงค์ + รายละเอียด)
5. ลงชื่อผู้ส่ง

ใช้ภาษาราชการที่สุภาพ เป็นทางการ ถูกต้องตามหลักภาษาไทย`;
        break;

      case 'plagiarism_check':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการตรวจสอบความคล้ายคลึงของข้อความ

วิเคราะห์ข้อความต่อไปนี้และหาส่วนที่อาจเป็นการคัดลอกหรือมีความคล้ายคลึงสูง:

ข้อความที่ 1 (ต้นฉบับ/อ้างอิง):
${payload.original}

ข้อความที่ 2 (ที่ต้องการตรวจ):
${payload.submitted}

ให้วิเคราะห์และตอบใน JSON format ดังนี้:
{
  "similarity_score": (0-100 เปอร์เซ็นต์),
  "verdict": "ผ่าน/ต้องตรวจสอบ/ไม่ผ่าน",
  "similar_segments": [
    {"original": "ข้อความต้นฉบับ", "submitted": "ข้อความที่ส่ง", "similarity": 90}
  ],
  "analysis": "สรุปการวิเคราะห์โดยละเอียด",
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2"]
}`;
        break;

      case 'ai_detector':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการตรวจจับข้อความที่เขียนโดย AI

วิเคราะห์ข้อความต่อไปนี้ว่าเขียนโดย AI หรือมนุษย์:

${payload.text}

ให้วิเคราะห์อย่างละเอียดและตอบใน JSON format:
{
  "ai_probability": (0-100 เปอร์เซ็นต์ว่าเขียนโดย AI),
  "human_probability": (0-100 เปอร์เซ็นต์ว่าเขียนโดยมนุษย์),
  "verdict": "มนุษย์เขียน/อาจเป็น AI/น่าจะเป็น AI/เขียนโดย AI",
  "suspicious_segments": [
    {"text": "ข้อความที่น่าสงสัย", "reason": "เหตุผล", "score": 85}
  ],
  "indicators": {
    "ai_indicators": ["สัญญาณที่บ่งบอกว่า AI เขียน"],
    "human_indicators": ["สัญญาณที่บ่งบอกว่ามนุษย์เขียน"]
  },
  "analysis": "การวิเคราะห์โดยละเอียด"
}`;
        break;

      case 'lesson_planner':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการออกแบบการสอนระดับอุดมศึกษา (Instructional Design)

สร้างแผนการสอนในรูปแบบ TQF (มคอ.) สำหรับ:
- หัวข้อ: ${payload.topic}
- CLO (Course Learning Outcome): ${payload.clo}
- ระยะเวลา: ${payload.duration} นาที
- ระดับนักศึกษา: ${payload.level || 'ปริญญาตรี'}
- รายวิชา: ${payload.course || ''}

ให้สร้างแผนการสอนที่ครบถ้วน รูปแบบ markdown ประกอบด้วย:
1. วัตถุประสงค์การเรียนรู้
2. สาระการเรียนรู้
3. กิจกรรมการสอน (ก่อนสอน/ระหว่างสอน/หลังสอน)
4. สื่อและอุปกรณ์
5. การวัดและประเมินผล
6. ข้อเสนอแนะ

ใช้ภาษาไทยและให้กิจกรรมที่หลากหลาย Active Learning`;
        break;

      case 'rubric_generator':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการออกแบบ Rubric สำหรับการประเมินผลการศึกษา

สร้าง Rubric สำหรับ:
- ชื่องาน/การประเมิน: ${payload.task}
- จุดประสงค์: ${payload.purpose}
- ระดับการศึกษา: ${payload.level || 'ปริญญาตรี'}
- คะแนนเต็ม: ${payload.maxScore || 100} คะแนน

ตอบใน JSON format:
{
  "title": "ชื่อ Rubric",
  "total_score": 100,
  "criteria": [
    {
      "name": "ชื่อเกณฑ์",
      "weight": 25,
      "levels": [
        {"level": "ดีเยี่ยม (4)", "score_range": "23-25", "descriptor": "คำอธิบาย"},
        {"level": "ดี (3)", "score_range": "18-22", "descriptor": "คำอธิบาย"},
        {"level": "พอใช้ (2)", "score_range": "13-17", "descriptor": "คำอธิบาย"},
        {"level": "ปรับปรุง (1)", "score_range": "0-12", "descriptor": "คำอธิบาย"}
      ]
    }
  ]
}`;
        break;

      case 'meeting_notes':
        prompt = `คุณเป็น AI Assistant ที่เชี่ยวชาญด้านการสรุปการประชุม

สรุปบันทึกการประชุมต่อไปนี้:
${payload.notes}

ให้ตอบใน JSON format:
{
  "meeting_summary": "สรุปการประชุมโดยรวม 2-3 ประโยค",
  "key_decisions": ["มติที่ 1", "มติที่ 2"],
  "action_items": [
    {"task": "งานที่ต้องทำ", "responsible": "ผู้รับผิดชอบ", "deadline": "กำหนดส่ง"}
  ],
  "follow_up": ["สิ่งที่ต้องติดตาม"],
  "next_meeting": "นัดประชุมครั้งถัดไป (ถ้ามี)"
}`;
        break;

      case 'quiz_generator':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการออกข้อสอบระดับอุดมศึกษา

จากเนื้อหาต่อไปนี้ ให้สร้างข้อสอบ ${payload.numQuestions || 5} ข้อ
ระดับความยาก: ${payload.difficulty || 'ปานกลาง'}
ประเภทคำถามที่ต้องการ: ${(payload.questionTypes || ['MC']).join(', ')}

เนื้อหา:
${payload.content}

ตอบใน JSON format เท่านั้น (ไม่ต้องมี markdown code block):
{
  "questions": [
    {
      "type": "MC",
      "text": "คำถาม",
      "options": ["ตัวเลือก A", "ตัวเลือก B", "ตัวเลือก C", "ตัวเลือก D"],
      "answer": "A",
      "points": 1,
      "explanation": "เฉลยอธิบาย"
    },
    {
      "type": "TF",
      "text": "คำถาม ถูก/ผิด",
      "options": [],
      "answer": "True",
      "points": 1,
      "explanation": "เฉลยอธิบาย"
    },
    {
      "type": "SHORT",
      "text": "คำถามเปิด",
      "options": [],
      "answer": "แนวคำตอบ",
      "points": 2,
      "explanation": "เฉลยอธิบาย"
    }
  ]
}

สำคัญ:
- MC ต้องมี 4 ตัวเลือก answer เป็น A/B/C/D
- TF answer เป็น True/False
- SHORT answer เป็นแนวคำตอบ
- ทุกข้อต้องมี explanation`;
        break;

      case 'content_differentiator':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการปรับเนื้อหาการเรียนการสอน

ปรับเนื้อหาต่อไปนี้ให้เหมาะสมกับระดับ "${payload.level}":

เนื้อหาต้นฉบับ:
${payload.content}

ระดับที่ต้องการ: ${payload.level} (${payload.level === 'ง่าย' ? 'สำหรับผู้เริ่มต้น ใช้ภาษาง่าย' : payload.level === 'กลาง' ? 'สำหรับระดับกลาง มีความลึกพอสมควร' : 'สำหรับผู้เชี่ยวชาญ เนื้อหาเชิงลึก'})

ให้เขียนเนื้อหาที่ปรับแล้ว และอธิบายสั้นๆ ว่าปรับอะไรบ้าง`;
        break;

      case 'auto_grader':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการตรวจและให้คะแนนงานนักศึกษา

ตรวจงานนักศึกษาตาม Rubric ที่กำหนด:

Rubric และเฉลย:
${payload.rubric}

งานนักศึกษา:
${payload.submission}

ให้ประเมินและตอบใน JSON format:
{
  "total_score": (คะแนนรวม),
  "max_score": (คะแนนเต็ม),
  "percentage": (เปอร์เซ็นต์),
  "grade": "A/B/C/D/F",
  "criteria_scores": [
    {"criterion": "เกณฑ์", "score": 8, "max": 10, "comment": "ความคิดเห็น"}
  ],
  "strengths": ["จุดเด่น 1", "จุดเด่น 2"],
  "improvements": ["สิ่งที่ควรปรับปรุง"],
  "overall_feedback": "ความคิดเห็นโดยรวม"
}`;
        break;

      case 'quiz_generator_vision':
        prompt = 'vision';
        break;

      case 'slide-maker':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการสร้าง Presentation สำหรับการสอนระดับอุดมศึกษา

สร้างเนื้อหาสไลด์ ${payload.numSlides || 8} สไลด์ สำหรับหัวข้อ:
"${payload.topic}"

${payload.keyPoints ? `ประเด็นสำคัญ:\n${payload.keyPoints}` : ''}

สไตล์: ${payload.style || 'academic'}

ตอบใน JSON format เท่านั้น (ไม่ต้องมี markdown code block):
{
  "slides": [
    {
      "title": "ชื่อสไลด์",
      "bullets": ["หัวข้อย่อย 1", "หัวข้อย่อย 2", "หัวข้อย่อย 3"],
      "speakerNotes": "สคริปต์สำหรับผู้บรรยาย 2-3 ประโยค"
    }
  ]
}

สำคัญ:
- สไลด์แรกเป็นหน้าปก (title slide)
- สไลด์สุดท้ายเป็นสรุปหรือ Q&A
- แต่ละสไลด์มี 3-5 bullet points
- Speaker Notes เขียนเป็นสคริปต์พูดจริง
- ใช้ภาษาไทย เนื้อหาเป็นวิชาการ`;
        break;

      case 'ai_translator':
      case 'ai-translator':
        prompt = `คุณเป็นนักแปลมืออาชีพ ที่เชี่ยวชาญทั้งภาษาไทยและอังกฤษ

แปลข้อความต่อไปนี้:
${payload.text}

ภาษาต้นทาง: ${payload.sourceLang || 'auto'}
ภาษาปลายทาง: ${payload.targetLang || 'en'}
สไตล์: ${payload.style || 'formal'}

ตอบเป็นข้อความที่แปลแล้วอย่างเดียว ไม่ต้องอธิบายเพิ่ม`;
        break;

      case 'writing_quality':
      case 'writing-quality':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการเขียนภาษาไทยและอังกฤษ

วิเคราะห์คุณภาพการเขียนของข้อความนี้:
${payload.text}

ตอบใน JSON format:
{
  "overall_score": (0-100),
  "categories": {
    "clarity": {"score": 0-100, "feedback": "ข้อเสนอแนะ"},
    "structure": {"score": 0-100, "feedback": "ข้อเสนอแนะ"},
    "grammar": {"score": 0-100, "feedback": "ข้อเสนอแนะ"},
    "vocabulary": {"score": 0-100, "feedback": "ข้อเสนอแนะ"},
    "coherence": {"score": 0-100, "feedback": "ข้อเสนอแนะ"}
  },
  "strengths": ["จุดเด่น 1"],
  "improvements": ["สิ่งที่ควรปรับปรุง"],
  "rewritten": "ข้อความที่ปรับปรุงแล้ว"
}`;
        break;

      case 'grammar_checker':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านไวยากรณ์ภาษาไทยและอังกฤษ

ตรวจไวยากรณ์ของข้อความนี้:
${payload.text}

ตอบใน JSON format:
{
  "corrections": [
    {"original": "ข้อความเดิม", "corrected": "ข้อความที่แก้ไข", "reason": "เหตุผล", "type": "grammar/spelling/punctuation"}
  ],
  "corrected_text": "ข้อความทั้งหมดที่แก้ไขแล้ว",
  "score": (0-100)
}`;
        break;

      case 'completeness_checker':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการตรวจสอบความครบถ้วนของงาน

ตรวจสอบว่างานนี้ครบถ้วนตามเกณฑ์หรือไม่:

เกณฑ์/รายการ:
${payload.checklist}

งานที่ส่ง:
${payload.submission}

ตอบใน JSON format:
{
  "items": [
    {"criterion": "เกณฑ์", "status": "pass/fail/partial", "comment": "ความคิดเห็น"}
  ],
  "completion_rate": (0-100),
  "summary": "สรุปการตรวจ",
  "missing": ["สิ่งที่ขาด"]
}`;
        break;

      case 'image_to_content':
        prompt = 'vision';
        break;

      case 'flashcard_builder':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างสื่อการเรียนรู้

สร้าง Flashcard ${payload.count || 10} ใบ จากเนื้อหา:
${payload.content}

หมวด: ${payload.category || 'ทั่วไป'}

ตอบใน JSON format:
{
  "cards": [
    {"front": "คำถาม/ด้านหน้า", "back": "คำตอบ/ด้านหลัง", "hint": "คำใบ้"}
  ]
}`;
        break;

      case 'exit_ticket':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการประเมินผลการเรียนรู้

สร้าง Exit Ticket สำหรับหัวข้อ: ${payload.topic}
ระดับ: ${payload.level || 'ปริญญาตรี'}
จำนวนคำถาม: ${payload.count || 3}

ตอบใน JSON format:
{
  "questions": [
    {"type": "reflection/understanding/application", "text": "คำถาม"}
  ]
}`;
        break;

      case 'stakeholder_report':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการเขียนรายงานสำหรับผู้มีส่วนได้ส่วนเสีย

สร้างรายงานสำหรับ ${payload.audience || 'ผู้บริหาร'}:
หัวข้อ: ${payload.topic}
ข้อมูล: ${payload.data}

เขียนรายงานที่สั้น กระชับ เน้นประเด็นสำคัญ เหมาะกับกลุ่มเป้าหมาย`;
        break;

      case 'ebook-outline':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการเขียนหนังสือและ E-book เชิงวิชาการ

สร้าง Outline สำหรับ E-book:
- หัวข้อ: ${payload.topic}
- ชื่อหนังสือ: ${payload.title || '(AI ตั้งชื่อให้)'}
- กลุ่มเป้าหมาย: ${payload.audience || 'นักศึกษาปริญญาตรี'}
- จำนวนบท: ${payload.numChapters || 5}
- สไตล์: ${payload.style || 'academic'}

ตอบใน JSON format เท่านั้น (ไม่ต้องมี markdown code block):
{
  "title": "ชื่อ E-book ที่น่าสนใจ",
  "chapters": [
    {
      "title": "ชื่อบท",
      "summary": "สรุปเนื้อหาบท 1-2 ประโยค",
      "sections": ["หัวข้อย่อย 1", "หัวข้อย่อย 2", "หัวข้อย่อย 3"]
    }
  ]
}

สำคัญ:
- บทแรกควรเป็นบทนำ/ความเป็นมา
- บทสุดท้ายควรเป็นสรุป/ข้อเสนอแนะ
- แต่ละบทมี 3-5 หัวข้อย่อย
- เนื้อหาเหมาะกับกลุ่มเป้าหมาย
- ใช้ภาษาไทย`;
        break;

      case 'ebook-chapter':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการเขียนหนังสือและ E-book

เขียนเนื้อหาบทที่ ${payload.chapterNumber} ของ ${payload.totalChapters} บท:

ชื่อหนังสือ: ${payload.bookTitle}
ชื่อบท: ${payload.chapterTitle}
สรุปบท: ${payload.chapterSummary || ''}
หัวข้อย่อย: ${(payload.sections || []).join(', ')}
สไตล์: ${payload.style || 'academic'}
กลุ่มเป้าหมาย: ${payload.audience || 'นักศึกษาปริญญาตรี'}

ให้เขียนเนื้อหาบทนี้อย่างละเอียด ครอบคลุมหัวข้อย่อยทั้งหมด:
- ใช้ภาษาไทยที่อ่านง่าย
- มีตัวอย่างประกอบ
- มีหัวข้อย่อยชัดเจน (ใช้ ## และ ### สำหรับหัวข้อ)
- ความยาวประมาณ 1500-2500 คำ
- เหมาะกับสไตล์ ${payload.style === 'friendly' ? 'เข้าถึงง่าย อ่านสนุก' : payload.style === 'visual' ? 'เน้นการอธิบายเป็นภาพ พร้อมแนะนำ diagram' : payload.style === 'workshop' ? 'เน้นฝึกทำ มี exercise' : 'วิชาการ เป็นทางการ'}`;
        break;

      case 'content_summarizer':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการสรุปเนื้อหาการศึกษา

อ่านเนื้อหาต่อไปนี้อย่างละเอียด แล้วสรุปเนื้อหาสำคัญ เพื่อนำไปใช้ออกข้อสอบ:

${payload.content}

ให้สรุปโดย:
1. ระบุหัวข้อหลักและหัวข้อย่อยทั้งหมด
2. สรุปประเด็นสำคัญ คอนเซปต์ คำนิยาม ทฤษฎี ตัวอย่าง ข้อเท็จจริง ตัวเลข
3. เน้นเนื้อหาที่เหมาะสำหรับการออกข้อสอบ (ข้อเท็จจริง การเปรียบเทียบ ความสัมพันธ์ เหตุ-ผล)
4. จัดเรียงเป็นหมวดหมู่ชัดเจน

เขียนสรุปเป็นภาษาไทย ให้ละเอียดและครอบคลุมมากที่สุด`;
        break;

      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }

    // ===== Vision tools (image-based) =====
    const isVisionTool = (tool === 'quiz_generator_vision' || tool === 'image_to_content') && payload.imageBase64;

    let visionPrompt = '';
    if (isVisionTool) {
      visionPrompt = tool === 'quiz_generator_vision'
        ? `คุณเป็นผู้เชี่ยวชาญด้านการออกข้อสอบระดับอุดมศึกษา

ดูรูปภาพนี้ (อาจเป็น slide, เอกสาร, หรือเนื้อหาการสอน) แล้วสร้างข้อสอบ ${payload.numQuestions || 5} ข้อ
ระดับความยาก: ${payload.difficulty || 'ปานกลาง'}
ประเภทคำถามที่ต้องการ: ${(payload.questionTypes || ['MC']).join(', ')}

ตอบใน JSON format เท่านั้น (ไม่ต้องมี markdown code block):
{
  "questions": [
    {
      "type": "MC",
      "text": "คำถาม",
      "options": ["ตัวเลือก A", "ตัวเลือก B", "ตัวเลือก C", "ตัวเลือก D"],
      "answer": "A",
      "points": 1,
      "explanation": "เฉลยอธิบาย"
    }
  ]
}

- MC ต้องมี 4 ตัวเลือก answer เป็น A/B/C/D
- TF answer เป็น True/False
- SHORT answer เป็นแนวคำตอบ`
        : `คุณเป็น AI ที่อ่านรูปภาพได้ ดูรูปภาพนี้และสรุปเนื้อหาเป็นภาษาไทย`;
    }

    // ===== Try Anthropic first, fallback to Gemini =====
    let result = null;
    let usedProvider = '';

    // === Attempt Anthropic ===
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        let messages;
        if (isVisionTool) {
          messages = [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: payload.mediaType || 'image/png',
                  data: payload.imageBase64,
                },
              },
              { type: 'text', text: visionPrompt },
            ],
          }];
        } else {
          messages = [{ role: 'user', content: prompt }];
        }

        result = await callAnthropic(messages);
        if (result) usedProvider = 'anthropic';
      } catch (e) {
        console.warn('Anthropic failed, falling back to Gemini:', e.message);
      }
    }

    // === Fallback to Gemini ===
    if (!result && process.env.GEMINI_API_KEY) {
      try {
        const textPrompt = isVisionTool ? visionPrompt : prompt;
        const imageData = isVisionTool ? { base64: payload.imageBase64, mediaType: payload.mediaType || 'image/png' } : null;

        result = await callGemini(textPrompt, imageData);
        if (result) usedProvider = 'gemini';
      } catch (e) {
        console.error('Gemini also failed:', e.message);
        throw e;
      }
    }

    if (!result) {
      throw new Error('ทั้ง Anthropic และ Gemini ไม่สามารถใช้งานได้ — กรุณาตรวจสอบ API key และเครดิต');
    }

    return NextResponse.json({ result, provider: usedProvider });

  } catch (error) {
    console.error('Teacher AI error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

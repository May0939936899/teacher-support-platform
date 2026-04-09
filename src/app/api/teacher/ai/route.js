import { NextResponse } from 'next/server';

// ============================================================
// Teacher AI API — Gemini 2.5 Pro (primary) → Flash fallbacks
// ============================================================

// Gemini models — { name, apiVersion }
// v1beta สำหรับ model ใหม่, v1 สำหรับ stable models
const GEMINI_MODELS = [
  { name: 'gemini-2.0-flash',        api: 'v1beta' },
  { name: 'gemini-2.0-flash-lite',   api: 'v1beta' },
  { name: 'gemini-1.5-flash',        api: 'v1'     },
  { name: 'gemini-1.5-flash-8b',     api: 'v1'     },
];

async function callGemini(prompt, imageData = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('ไม่มี AI API key — กรุณาตั้งค่า GEMINI_API_KEY ใน .env.local');

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

  const body = JSON.stringify({
    contents: [{ parts }],
    systemInstruction: {
      parts: [{ text: 'คุณเป็น AI ผู้ช่วยอาจารย์มหาวิทยาลัยที่เก่งมาก ตอบเป็นภาษาไทยเสมอ (ยกเว้นถูกขอให้ใช้ภาษาอื่น) ตอบอย่างละเอียด มีคุณภาพ เป็นมืออาชีพ ถูกต้องตามหลักวิชาการ' }],
    },
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  });

  let lastError = null;
  for (const { name: model, api } of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`;
      console.log(`[AI] Trying ${model}...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.status === 429 || res.status === 503) {
        console.warn(`[AI] ${model} rate limited, trying next...`);
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || String(res.status);
        console.warn(`[AI] ${model} error:`, msg);
        lastError = new Error(msg);
        continue; // ลอง model ถัดไป
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) {
        console.log(`[AI] Success with ${model}`);
        return text;
      }
    } catch (e) {
      console.warn(`[AI] ${model} failed:`, e.message);
      lastError = e;
    }
  }
  throw lastError || new Error('AI ไม่สามารถใช้งานได้ กรุณาลองใหม่');
}

export async function POST(request) {
  try {
    const { tool, payload } = await request.json();
    if (!tool || !payload) {
      return NextResponse.json({ error: 'Missing tool or payload' }, { status: 400 });
    }

    // Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'ไม่มี GEMINI_API_KEY — กรุณาตั้งค่าใน .env.local' }, { status: 500 });
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

      case 'rubric_generator': {
        const numCriteria = payload.criteriaCount || 4;
        const numLevels = payload.levelCount || 4;
        const levelLabels = ['ดีเยี่ยม', 'ดี', 'พอใช้', 'ต้องปรับปรุง', 'ไม่ผ่าน'].slice(0, numLevels);
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการออกแบบ Rubric สำหรับการประเมินผลการศึกษา

สร้าง Rubric สำหรับงาน/การประเมิน: "${payload.assignment || payload.task || ''}"
- จำนวนเกณฑ์การประเมิน: ${numCriteria} เกณฑ์
- จำนวนระดับคะแนน: ${numLevels} ระดับ (${levelLabels.join(', ')})
- ระดับการศึกษา: ปริญญาตรี

ตอบใน JSON format เท่านั้น (ไม่มี markdown):
{
  "title": "ชื่อ Rubric",
  "total_score": 100,
  "criteria": [
    {
      "name": "ชื่อเกณฑ์",
      "weight": ${Math.floor(100 / numCriteria)},
      "levels": [
        {"level": "${levelLabels[0]}", "score_range": "ช่วงคะแนน", "descriptor": "คำอธิบายพฤติกรรม/ผลงาน"},
        {"level": "${levelLabels[1] || 'ดี'}", "score_range": "ช่วงคะแนน", "descriptor": "คำอธิบาย"}
      ]
    }
  ]
}

สร้าง ${numCriteria} เกณฑ์ แต่ละเกณฑ์ต้องมี ${numLevels} ระดับคะแนน`;
        break;
      }

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

      case 'content_differentiator': {
        const selectedLevels = payload.levels || (payload.level ? [payload.level] : ['easy', 'medium', 'hard']);
        const levelMap = { easy: 'ง่าย (Easy) — สำหรับผู้เริ่มต้น ภาษาง่าย ตัวอย่างชัดเจน', medium: 'ปานกลาง (Medium) — สมดุล มีความลึกพอสมควร', hard: 'ยาก (Hard) — เชิงลึก วิเคราะห์ ท้าทาย' };
        const levelInstructions = selectedLevels.map(l => `\n\n## ${l.toUpperCase()}\n[ปรับเนื้อหาสำหรับระดับ: ${levelMap[l] || l}]\n[เขียนเนื้อหาที่ปรับแล้วที่นี่]`).join('');
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการปรับเนื้อหาการเรียนการสอนสำหรับระดับอุดมศึกษา

วิชา/หัวข้อ: ${payload.subject || ''}

เนื้อหาต้นฉบับ:
${payload.content}

ปรับเนื้อหาข้างต้นให้เหมาะสมกับ ${selectedLevels.length} ระดับต่อไปนี้:
${selectedLevels.map(l => `- ${l}: ${levelMap[l] || l}`).join('\n')}

ตอบในรูปแบบนี้ (แต่ละระดับขึ้นต้นด้วย ## และชื่อระดับ):${levelInstructions}

สำคัญ: แต่ละระดับต้องมีเนื้อหาที่สมบูรณ์ ต่างกันชัดเจน ครบถ้วน ไม่สั้นเกินไป`;
        break;
      }

      case 'auto_grader':
        prompt = `คุณเป็นผู้ตรวจงานนักศึกษาระดับอุดมศึกษาที่มีความเชี่ยวชาญและเข้มงวด

กฎสำคัญในการตรวจ:
1. ให้คะแนนตาม Rubric ที่กำหนดเท่านั้น — ห้ามให้คะแนนสูงกว่าที่ Rubric กำหนด
2. ถ้างานนักศึกษาไม่ครบตามเกณฑ์ ต้องหักคะแนนตามจริง ห้ามหลอก ห้ามปรับคะแนนให้สูงโดยไม่มีเหตุผล
3. ถ้างานขาดหลักฐาน/การอ้างอิง/การวิเคราะห์ตาม Rubric ให้สะท้อนออกมาในคะแนนอย่างตรงไปตรงมา
4. ผลการตรวจต้องมีเหตุผลและอ้างอิงจากเนื้อหาจริง

Rubric (เกณฑ์การให้คะแนน):
${payload.rubric}

งานนักศึกษา:
${payload.submission}

คะแนนเต็มรวม: ${payload.maxScore || 100}

ตอบเป็น JSON เท่านั้น (ไม่มี markdown):
{
  "total_score": (คะแนนรวมที่ได้จริง ตามเกณฑ์),
  "max_score": ${payload.maxScore || 100},
  "percentage": (เปอร์เซ็นต์),
  "grade": "A/B+/B/C+/C/D+/D/F",
  "criteria_scores": [
    {"criterion": "ชื่อเกณฑ์", "score": (คะแนนที่ได้), "max": (คะแนนเต็มของเกณฑ์นี้), "comment": "เหตุผลที่ให้คะแนนนี้ อ้างอิงจากงานจริง"}
  ],
  "strengths": ["จุดแข็งที่พบจริงในงาน"],
  "improvements": ["สิ่งที่ขาดหรือต้องปรับปรุง อ้างอิงจาก Rubric"],
  "overall_feedback": "ความคิดเห็นโดยรวมที่ตรงไปตรงมา"
}`;
        break;

      case 'auto_grader_vision':
        prompt = 'auto_grader_vision';
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

      case 'marketing_content':
        prompt = `คุณเป็นทีม Social Media ของคณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม (SPUBUS) ที่เชี่ยวชาญการเขียนคอนเทนต์แบบมืออาชีพ

สร้างคอนเทนต์สำหรับโพสต์บน ${payload.platform || 'Facebook'}

ข้อมูลสำหรับสร้างคอนเทนต์:
- เป้าหมาย/ประเภทโพสต์: ${payload.title}
- หมวดหมู่/สาขา: ${payload.category}
- โทนการเขียน: ${payload.tone === 'professional' ? 'ทางการ น่าเชื่อถือ สง่า เป็นสถาบัน' : payload.tone === 'fun' ? 'สนุกสนาน เป็นกันเอง ใช้คำที่วัยรุ่นเข้าถึง' : payload.tone === 'concise' ? 'สั้น กระชับ ตรงประเด็น ไม่เยิ่นเย้อ' : 'เน้นอิโมจิ สีสันสะดุดตา ดึงดูดความสนใจ'}
${payload.eventName ? `- ชื่อกิจกรรม/โครงการ: ${payload.eventName}` : ''}
${payload.speaker ? `- วิทยากร/บุคคลสำคัญ: ${payload.speaker}` : ''}
${payload.dateInfo ? `- วัน/เวลา: ${payload.dateInfo}` : ''}
${payload.location ? `- สถานที่: ${payload.location}` : ''}
${payload.keyPoints ? `- ประเด็นสำคัญ/รายละเอียดเพิ่มเติม: ${payload.keyPoints}` : ''}

===== รูปแบบที่ต้องเขียนตาม (สำคัญมาก) =====

ให้เขียนคอนเทนต์ตามโครงสร้างแบบ SPUBUS ดังตัวอย่างนี้:

--- ตัวอย่างสไตล์ SPUBUS ---
SPUBUS MANAGEMENT TALK : THE WINNER STORIES
🌍 People Beyond Borders การบริหาร HR และแรงงานข้ามชาติในองค์กรยุคใหม่

📌 สาขาการบริหารและการจัดการสมัยใหม่
พานักศึกษาเรียนรู้ประสบการณ์จริงจากผู้บริหารตัวจริง
เข้าใจการทำงานกับคนหลากหลายวัฒนธรรมในโลกธุรกิจ

🎤 วิทยากรพิเศษ
คุณศรศักดิ์ อังสุภานิช
ประธานสภาอุตสาหกรรมจังหวัดสตูล
ศิษย์เก่าดีเด่น คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม

💡 เพราะผู้นำยุคใหม่ ต้องบริหาร "ความหลากหลาย"
ให้กลายเป็นพลังขององค์กร

#SPUBUS #SPU #สาขาการบริหารและการจัดการสมัยใหม่ #คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม #เรียนกับตัวจริงประสบการณ์จริง
--- จบตัวอย่าง ---

===== กฎการเขียนที่ต้องทำตาม =====

1. **เปิดด้วย SPUBUS + ชื่อซีรีส์/แคมเปญ** — สร้างชื่อซีรีส์ที่เป็นเอกลักษณ์ เช่น "SPUBUS MANAGEMENT TALK" "SPUBUS Go Inter" "SPUBUS Business Insights" ฯลฯ ตามเนื้อหาที่ได้รับ
2. **Subtitle ทั้งไทย-อังกฤษ** — มีทั้งชื่อไทยและชื่ออังกฤษที่ดูเป็นสากล
3. **ระบุสาขา/คณะ** — ชัดเจนว่าเป็นสาขาไหน ใช้ 📌 นำหน้า
4. **อธิบายสิ่งที่นักศึกษาจะได้** — เขียนให้เห็นภาพว่าจะได้เรียนรู้อะไร ประสบการณ์จริง ลงมือทำจริง
5. **ระบุวิทยากร/สถานที่ (ถ้ามี)** — ใช้ 🎤 หรือ 📍 นำหน้า พร้อมตำแหน่งและสังกัด
6. **ปิดด้วย Inspirational Quote** — ใช้ 💡 หรือ ✨ ประโยคปิดที่ทรงพลัง สร้างแรงบันดาลใจ ใช้เครื่องหมายคำพูดเน้นคำสำคัญ
7. **Hashtags 8-15 อัน** — ต้องมี #SPUBUS #SPU #คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม #เรียนกับตัวจริงประสบการณ์จริง เสมอ แล้วเพิ่มแฮชแท็กเฉพาะตามเนื้อหา
8. **ใช้ Emoji อย่างมีกลยุทธ์** — ไม่มากเกินไป แต่ใช้เพื่อแบ่ง section เช่น 🌍 📌 🎤 💡 🚀 📍 🎓 ✨
9. **ภาษา** — ภาษาไทยที่สง่า เป็นมืออาชีพ ไม่ใช้ศัพท์สแลงเว้นแต่โทนจะเป็นแบบสนุก
10. **ห้ามใช้คำว่า "Hook" "Body" "CTA"** ในเนื้อหา — เขียนเป็นคอนเทนต์สำเร็จรูปพร้อมโพสต์ ไม่ใช่ template

${payload.platform === 'tiktok' ? '- สำหรับ TikTok: ใช้ภาษากระชับ ติดหู เน้นคำ trending' : ''}
${payload.platform === 'instagram' ? '- สำหรับ Instagram: เน้น visual storytelling' : ''}
${payload.platform === 'line' ? '- สำหรับ LINE: กระชับ อ่านง่ายในแชท' : ''}
${payload.platform === 'lemon8' ? '- สำหรับ Lemon8: สไตล์ review/รีวิว แชร์ประสบการณ์' : ''}
${payload.platform === 'youtube' ? '- สำหรับ YouTube: เขียนเป็น description + title ที่ SEO ดี' : ''}

สำคัญ: เขียนเป็นคอนเทนต์พร้อมโพสต์ทันที ไม่ต้องมีคำอธิบายหรือหัวข้อ section ภาษาอังกฤษ`;
        break;

      case 'poster_content':
        prompt = `คุณเป็นผู้เชี่ยวชาญด้านการออกแบบสื่อประชาสัมพันธ์สำหรับมหาวิทยาลัย

สร้างเนื้อหาสำหรับโปสเตอร์:
- หัวข้อ: ${payload.title || 'งานกิจกรรม'}
- รายละเอียด: ${payload.description || ''}
- สไตล์: ${payload.style || 'modern'}
- แพลตฟอร์ม: ${payload.platform || 'ig-post'}

ตอบใน JSON format เท่านั้น (ไม่ต้องมี markdown code block):
{
  "headline": "หัวข้อหลักที่ดึงดูด (สั้น 5-10 คำ)",
  "subheadline": "หัวข้อรอง (อธิบายเพิ่ม 1 ประโยค)",
  "body": "เนื้อหาสั้นๆ 2-3 บรรทัด",
  "cta": "ข้อความ Call to Action",
  "hashtags": "#แฮชแท็ก1 #แฮชแท็ก2"
}

เขียนเป็นภาษาไทย กระชับ อ่านง่าย เหมาะกับการทำโปสเตอร์`;
        break;

      case 'line_broadcast':
        prompt = `คุณเป็นอาจารย์มหาวิทยาลัยที่ต้องเขียนข้อความประกาศถึงนักศึกษา

เขียนข้อความประกาศสำหรับส่งผ่าน LINE หรือ Email จากคำสั่ง:
"${payload.prompt}"

กฎการเขียน:
1. ใช้ Emoji เปิดหัวข้อแต่ละส่วน (📢 📚 📅 ⏰ 🏫 📌 💡 ✅ ❌)
2. เขียนกระชับ อ่านง่ายในมือถือ
3. มีข้อมูลครบ: วิชา วันที่ เวลา สถานที่ (ถ้ามี)
4. ลงท้ายด้วยข้อความสุภาพ เช่น "หากมีข้อสงสัย สอบถามได้ค่ะ/ครับ 🙏"
5. ใช้ภาษาไทยที่เป็นกันเองแต่สุภาพ
6. ความยาวไม่เกิน 10 บรรทัด
7. เขียนเป็นข้อความพร้อมส่งทันที ไม่ต้องมีคำอธิบายเพิ่ม`;
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

      case 'custom':
        prompt = payload.prompt || '';
        if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        break;

      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }

    // ===== Vision tools (image-based) =====
    const isVisionTool = (tool === 'quiz_generator_vision' || tool === 'image_to_content' || tool === 'auto_grader_vision') && payload.imageBase64;

    let visionPrompt = '';
    if (isVisionTool) {
      if (tool === 'auto_grader_vision') {
        visionPrompt = `คุณเป็นผู้ตรวจงานนักศึกษาที่มีความเชี่ยวชาญและเข้มงวด

กฎสำคัญ: ให้คะแนนตาม Rubric เท่านั้น — ห้ามให้คะแนนสูงกว่าที่กำหนด ถ้างานไม่ครบต้องหักคะแนนตามจริง ห้ามหลอก

Rubric (เกณฑ์การให้คะแนน):
${payload.rubric}

คะแนนเต็มรวม: ${payload.maxScore || 100}

ดูรูปภาพงานนักศึกษาด้านบน แล้วตรวจตาม Rubric ที่กำหนด

ตอบเป็น JSON เท่านั้น (ไม่มี markdown):
{
  "total_score": (คะแนนรวมที่ได้จริง),
  "max_score": ${payload.maxScore || 100},
  "percentage": (เปอร์เซ็นต์),
  "grade": "A/B+/B/C+/C/D+/D/F",
  "criteria_scores": [
    {"criterion": "ชื่อเกณฑ์", "score": (คะแนน), "max": (คะแนนเต็มเกณฑ์นี้), "comment": "เหตุผลอ้างอิงจากงาน"}
  ],
  "strengths": ["จุดแข็งที่พบในงาน"],
  "improvements": ["สิ่งที่ขาด อ้างอิงจาก Rubric"],
  "overall_feedback": "ความคิดเห็นโดยรวม"
}`;
      } else visionPrompt = tool === 'quiz_generator_vision'
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

    // ===== Provider chain: OpenRouter → Anthropic → Gemini =====
    let result = null;
    let usedProvider = '';

    // === Primary: Gemini 2.5 Pro (ฉลาดที่สุด) → Flash fallbacks ===
    try {
      const textPrompt = isVisionTool ? visionPrompt : prompt;
      const imageData = isVisionTool ? { base64: payload.imageBase64, mediaType: payload.mediaType || 'image/png' } : null;
      result = await callGemini(textPrompt, imageData);
      if (result) usedProvider = 'gemini-2.5-pro';
    } catch (e) {
      console.error('Gemini failed:', e.message);
      throw e;
    }

    if (!result) {
      throw new Error('AI ไม่สามารถใช้งานได้ — กรุณาตรวจสอบ GEMINI_API_KEY');
    }

    return NextResponse.json({ result, provider: usedProvider });

  } catch (error) {
    console.error('Teacher AI error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

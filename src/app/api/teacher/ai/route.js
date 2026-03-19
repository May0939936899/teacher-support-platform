import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { tool, payload } = await request.json();
    if (!tool || !payload) {
      return NextResponse.json({ error: 'Missing tool or payload' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
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

      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0]?.text || '';
    return NextResponse.json({ result: content });

  } catch (error) {
    console.error('Teacher AI error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

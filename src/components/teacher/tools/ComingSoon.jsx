'use client';

const TOOL_INFO = {
  'exit-ticket': { icon: '🎫', desc: 'แบบฟอร์มสั้นท้ายคลาส รวบรวมผลแสดง Summary Chart อัตโนมัติ' },
  'video-quiz': { icon: '🎬', desc: 'ใส่ URL วิดีโอ + timestamp + คำถาม แสดง popup ณ เวลานั้น' },
  'interactive-activity': { icon: '🤝', desc: 'Word Cloud, Live Poll, Brainstorm Board ร่วมกัน Realtime' },
  'content-differentiator': { icon: '📊', desc: 'AI ปรับเนื้อหาตามระดับ ง่าย/กลาง/ยาก อัตโนมัติ' },
  'auto-grader': { icon: '✅', desc: 'Upload งานนักศึกษา → AI ให้คะแนน + ความคิดเห็น ตาม Rubric' },
  'rubric-generator': { icon: '📏', desc: 'AI สร้าง Rubric ตาราง พร้อม Criteria + Level Descriptor' },
  'flashcard-builder': { icon: '🃏', desc: 'สร้างบัตรคำจากเนื้อหา โหมด Spaced Repetition' },
  'slide-maker': { icon: '🖥️', desc: 'AI สร้าง Slide Outline พร้อม Speaker Notes อัตโนมัติ' },
  'form-builder': { icon: '📋', desc: 'Drag & Drop สร้างฟอร์ม Share Link เก็บผล Export Excel' },
  'ai-translator': { icon: '🌐', desc: 'แปล TH↔EN Academic Style รองรับ .docx' },
  'writing-quality': { icon: '✍️', desc: 'วิเคราะห์โครงสร้าง ความลึก การอ้างอิง ให้คะแนน + คำแนะนำ' },
  'completeness-checker': { icon: '☑️', desc: 'อาจารย์กำหนด Checklist → Upload → เช็กความครบถ้วน' },
  'grammar-checker': { icon: '📝', desc: 'ตรวจไวยากรณ์ไทย-อังกฤษ Inline Suggestion แก้ไขได้ทันที' },
  'image-to-content': { icon: '🖼️', desc: 'Upload รูป → AI เขียน Caption/โพสต์/สรุปเนื้อหา' },
  'pdf-toolkit': { icon: '📦', desc: 'Merge/Split PDF ใส่ Watermark ตัดหน้า' },
  'template-library': { icon: '📚', desc: 'บันทึก Template ที่ใช้บ่อย Tag/Search/ใช้ซ้ำได้' },
  'student-progress': { icon: '📈', desc: 'ดู Grade/Attendance/Assignment ต่อคน กราฟแนวโน้ม' },
  'ta-coordinator': { icon: '👥', desc: 'Assign งาน TA Log ชั่วโมงทำงาน Summary Report' },
  'stakeholder-portal': { icon: '🏛️', desc: 'รายงานสรุปส่งผู้ปกครอง/อุตสาหกรรม Template + PDF' },
  'schedule-manager': { icon: '🗓️', desc: 'ตารางสอน Week View Sync Google Calendar แจ้งเตือน' },
  'event-coordinator': { icon: '🎪', desc: 'สร้าง Event Checklist + Assign ผู้รับผิดชอบ Gantt Timeline' },
  'budget-tracker': { icon: '💰', desc: 'ตั้งงบโครงการ บันทึกค่าใช้จ่าย กราฟ Remaining Budget' },
  'kpi-dashboard': { icon: '📊', desc: 'Input KPI Targets บันทึก Actual กราฟ Progress Export PDF' },
  'line-broadcast': { icon: '📢', desc: 'เขียน Template ประกาศ Preview LINE/Email Format Copy-Ready' },
};

export default function ComingSoon({ toolId }) {
  const info = TOOL_INFO[toolId] || { icon: '🔧', desc: 'เครื่องมือนี้กำลังพัฒนา' };

  return (
    <div style={{ padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>{info.icon}</div>
        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: 700, marginBottom: '16px' }}>
          กำลังพัฒนา (Coming Soon)
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#1e293b' }}>เครื่องมือนี้กำลังพัฒนา</h2>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>{info.desc}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Phase 1 พร้อมใช้ 7 เครื่องมือ', 'Phase 2 กำลังพัฒนา', 'Phase 3 ปีหน้า'].map((t, i) => (
            <span key={i} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
              background: i === 0 ? '#dcfce7' : i === 1 ? '#fef3c7' : '#f1f5f9',
              color: i === 0 ? '#16a34a' : i === 1 ? '#92400e' : '#64748b',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

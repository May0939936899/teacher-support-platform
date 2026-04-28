'use client';

const CI = {
  cyan: '#00b4e6',
  magenta: '#e6007e',
  dark: '#0b0b24',
  gold: '#ffc107',
  purple: '#7c4dff',
};

const TOOL_INFO = {
  'exit-ticket': { icon: '🎫', desc: 'แบบฟอร์มสั้นท้ายคลาส รวบรวมผลแสดง Summary Chart อัตโนมัติ', phase: 3, area: 'การสอน' },
  'video-quiz': { icon: '🎬', desc: 'ใส่ URL วิดีโอ + timestamp + คำถาม แสดง popup ณ เวลานั้น', phase: 3, area: 'การสอน' },
  'interactive-activity': { icon: '🤝', desc: 'Word Cloud, Live Poll, Brainstorm Board ร่วมกัน Realtime', phase: 3, area: 'การสอน' },
  'content-differentiator': { icon: '📊', desc: 'AI ปรับเนื้อหาตามระดับ ง่าย/กลาง/ยาก อัตโนมัติ', phase: 3, area: 'การสอน' },
  'auto-grader': { icon: '✅', desc: 'Upload งานนักศึกษา → AI ให้คะแนน + ความคิดเห็น ตาม Rubric', phase: 3, area: 'การสอน' },
  'rubric-generator': { icon: '📏', desc: 'AI สร้าง Rubric ตาราง พร้อม Criteria + Level Descriptor', phase: 3, area: 'การสอน' },
  'flashcard-builder': { icon: '🃏', desc: 'สร้างบัตรคำจากเนื้อหา โหมด Spaced Repetition', phase: 3, area: 'การสอน' },
  'slide-maker': { icon: '🖥️', desc: 'AI สร้าง Slide Outline พร้อม Speaker Notes อัตโนมัติ', phase: 3, area: 'เอกสาร' },
  'form-builder': { icon: '📋', desc: 'Drag & Drop สร้างฟอร์ม Share Link เก็บผล Export Excel', phase: 3, area: 'เอกสาร' },
  'ai-translator': { icon: '🌐', desc: 'แปล TH↔EN Academic Style รองรับ .docx', phase: 3, area: 'เอกสาร' },
  'writing-quality': { icon: '✍️', desc: 'วิเคราะห์โครงสร้าง ความลึก การอ้างอิง ให้คะแนน + คำแนะนำ', phase: 3, area: 'เอกสาร' },
  'completeness-checker': { icon: '☑️', desc: 'อาจารย์กำหนด Checklist → Upload → เช็กความครบถ้วน', phase: 3, area: 'เอกสาร' },
  'grammar-checker': { icon: '📝', desc: 'ตรวจไวยากรณ์ไทย-อังกฤษ Inline Suggestion แก้ไขได้ทันที', phase: 3, area: 'เอกสาร' },
  'image-to-content': { icon: '🖼️', desc: 'Upload รูป → AI เขียน Caption/โพสต์/สรุปเนื้อหา', phase: 3, area: 'เอกสาร' },
  'pdf-toolkit': { icon: '📦', desc: 'Merge/Split PDF ใส่ Watermark ตัดหน้า', phase: 3, area: 'เอกสาร' },
  'template-library': { icon: '📚', desc: 'บันทึก Template ที่ใช้บ่อย Tag/Search/ใช้ซ้ำได้', phase: 3, area: 'เอกสาร' },
  'student-progress': { icon: '📈', desc: 'ดู Grade/Attendance/Assignment ต่อคน กราฟแนวโน้ม', phase: 3, area: 'บริหาร' },
  'ta-coordinator': { icon: '👥', desc: 'Assign งาน TA Log ชั่วโมงทำงาน Summary Report', phase: 3, area: 'บริหาร' },
  'stakeholder-portal': { icon: '🏛️', desc: 'รายงานสรุปส่งผู้ปกครอง/อุตสาหกรรม Template + PDF', phase: 3, area: 'บริหาร' },
  'schedule-manager': { icon: '🗓️', desc: 'ตารางสอน Week View Sync Google Calendar แจ้งเตือน', phase: 3, area: 'บริหาร' },
  'event-coordinator': { icon: '🎪', desc: 'สร้าง Event Checklist + Assign ผู้รับผิดชอบ Gantt Timeline', phase: 3, area: 'บริหาร' },
  'budget-tracker': { icon: '💰', desc: 'ตั้งงบโครงการ บันทึกค่าใช้จ่าย กราฟ Remaining Budget', phase: 3, area: 'บริหาร' },
  'kpi-dashboard': { icon: '📊', desc: 'Input KPI Targets บันทึก Actual กราฟ Progress Export PDF', phase: 3, area: 'บริหาร' },
  'line-broadcast': { icon: '📢', desc: 'เขียน Template ประกาศ Preview LINE/Email Format Copy-Ready', phase: 3, area: 'บริหาร' },
};

const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

export default function ComingSoon({ toolId }) {
  const info = TOOL_INFO[toolId] || { icon: '🔧', desc: 'เครื่องมือนี้กำลังพัฒนา', phase: 3, area: '' };

  return (
    <div style={{ padding: '48px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontFamily: FONT }}>
      <div style={{ textAlign: 'center', maxWidth: '520px' }}>
        {/* Icon with glow */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
          <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: `radial-gradient(circle, ${CI.cyan}15, transparent 70%)` }} />
          <div style={{ fontSize: '80px', position: 'relative' }}>{info.icon}</div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 14px', borderRadius: '20px',
            background: info.phase === 2 ? '#fef3c7' : `${CI.purple}15`,
            color: info.phase === 2 ? '#92400e' : CI.purple,
            fontSize: '14px', fontWeight: 700,
          }}>
            Phase {info.phase}
          </span>
          {info.area && (
            <span style={{
              padding: '4px 14px', borderRadius: '20px',
              background: `${CI.cyan}12`, color: CI.cyan,
              fontSize: '14px', fontWeight: 600,
            }}>
              {info.area}
            </span>
          )}
        </div>

        <h2 style={{ margin: '0 0 12px', fontSize: '24px', color: '#1e293b', fontWeight: 700 }}>
          กำลังพัฒนา
        </h2>

        <p style={{ color: '#64748b', fontSize: '17px', lineHeight: 1.8, marginBottom: '28px' }}>
          {info.desc}
        </p>

        {/* Timeline */}
        <div style={{
          background: '#f8fafc', borderRadius: '14px', padding: '20px',
          border: '1px solid #e2e8f0', textAlign: 'left',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
            📅 แผนพัฒนา
          </div>
          {[
            { phase: 1, label: '7 เครื่องมือ', status: '✅ พร้อมใช้งาน', color: '#16a34a', bg: '#dcfce7' },
            { phase: 2, label: '4 เครื่องมือ', status: '🔨 พัฒนาแล้ว', color: '#d97706', bg: '#fef3c7' },
            { phase: 3, label: '24 เครื่องมือ', status: '📋 วางแผนไว้', color: '#6366f1', bg: '#eef2ff' },
          ].map(p => (
            <div key={p.phase} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px',
              borderRadius: '8px', marginBottom: '4px',
              background: info.phase === p.phase ? p.bg : 'transparent',
              border: info.phase === p.phase ? `1px solid ${p.color}30` : '1px solid transparent',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: p.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 800, color: p.color, flexShrink: 0,
              }}>
                {p.phase}
              </div>
              <div style={{ flex: 1, fontSize: '15px', color: '#374151' }}>{p.label}</div>
              <span style={{ fontSize: '14px', color: p.color, fontWeight: 600 }}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

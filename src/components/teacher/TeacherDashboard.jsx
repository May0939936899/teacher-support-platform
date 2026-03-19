'use client';
import { t } from '@/lib/teacher/i18n';

const PHASE1_TOOLS = [
  { id: 'smart-quiz', label: 'Smart Quiz + QR', icon: '📝', desc: 'ออกข้อสอบ + QR Code สำหรับนักศึกษา', color: 'teal' },
  { id: 'attendance-tracker', label: 'Attendance Tracker', icon: '📅', desc: 'เช็คชื่อด้วย QR Code + GPS', color: 'coral' },
  { id: 'letter-writer', label: 'AI Letter Writer', icon: '✉️', desc: 'สร้างจดหมายราชการภาษาไทย', color: 'blue' },
  { id: 'plagiarism-checker', label: 'Plagiarism Checker', icon: '🔍', desc: 'ตรวจ Similarity ของงานนักศึกษา', color: 'blue' },
  { id: 'ai-detector', label: 'AI Content Detector', icon: '🤖', desc: 'ตรวจว่า AI เขียนหรือมนุษย์เขียน', color: 'blue' },
  { id: 'qr-generator', label: 'QR Code Generator', icon: '🔲', desc: 'สร้าง QR Code จาก URL', color: 'blue' },
  { id: 'url-shortener', label: 'URL Shortener', icon: '🔗', desc: 'ย่อลิงก์ + Track Clicks', color: 'blue' },
];

const COLOR_STYLES = {
  teal: { bg: '#0d9488', light: '#f0fdfa', border: '#99f6e4', text: '#0f766e' },
  blue: { bg: '#2563eb', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  coral: { bg: '#ef4444', light: '#fff5f5', border: '#fecaca', text: '#dc2626' },
};

export default function TeacherDashboard({ onSelectTool, menuItems, colorMap, lang = 'th' }) {
  const stats = [
    { label: 'เครื่องมือทั้งหมด', value: '35', icon: '🛠️', color: '#2563eb' },
    { label: 'Phase 1 พร้อมใช้', value: '7', icon: '✅', color: '#0d9488' },
    { label: 'AI Features', value: '12', icon: '🤖', color: '#7c3aed' },
    { label: 'เมนูด้านการสอน', value: '10', icon: '🎓', color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
        borderRadius: '20px', padding: '32px', marginBottom: '32px', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', opacity: 0.1 }}>🎓</div>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800 }}>Teacher Support Platform</h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '15px' }}>
          ระบบสนับสนุนการสอนสำหรับอาจารย์มหาวิทยาลัย — 35 เครื่องมือ ใน 3 ด้าน 8 หมวด
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: '14px', padding: '20px',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 1 - Ready to use */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: '#0d9488' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
            🚀 Phase 1 — พร้อมใช้งาน
          </h2>
          <span style={{ padding: '2px 10px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>
            7 เครื่องมือ
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {PHASE1_TOOLS.map(tool => {
            const c = COLOR_STYLES[tool.color];
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                style={{
                  background: '#fff', borderRadius: '14px', padding: '20px',
                  border: `1px solid ${c.border}`, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s', display: 'flex', gap: '14px', alignItems: 'flex-start',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = c.bg;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = c.border;
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: c.light, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                }}>
                  {tool.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{tool.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{tool.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* All sections overview */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: '#2563eb' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>📋 ทั้งหมด 3 ด้าน</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {menuItems.map(side => {
            const c = colorMap[side.color];
            return (
              <div key={side.side} style={{
                background: '#fff', borderRadius: '16px', overflow: 'hidden',
                border: `1px solid ${c.border}`,
              }}>
                <div style={{ padding: '16px 20px', background: c.bg, color: '#fff' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{side.icon} {side.label}</div>
                  <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                    {side.groups.reduce((acc, g) => acc + g.items.length, 0)} เครื่องมือ
                  </div>
                </div>
                <div style={{ padding: '12px' }}>
                  {side.groups.map(group => (
                    <div key={group.label} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.05em' }}>
                        {group.label}
                      </div>
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => onSelectTool(item.id)}
                          style={{
                            width: '100%', background: 'none', border: 'none',
                            padding: '7px 10px', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '13px', color: '#374151', textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = c.light}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span>{item.icon}</span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.phase === 1 && (
                            <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>
                              ✓
                            </span>
                          )}
                          {item.phase > 1 && (
                            <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: '#f1f5f9', color: '#94a3b8' }}>
                              P{item.phase}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

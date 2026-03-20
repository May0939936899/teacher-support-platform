'use client';
import { t } from '@/lib/teacher/i18n';

const CI = {
  cyan: '#00b4e6',
  magenta: '#e6007e',
  dark: '#0b0b24',
  gold: '#ffc107',
  purple: '#7c4dff',
};

const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const PHASE1_TOOLS = [
  { id: 'smart-quiz', labelKey: 'tool_smart_quiz', icon: '📝', descKey: 'desc_smart_quiz', color: 'cyan' },
  { id: 'attendance-tracker', labelKey: 'tool_attendance', icon: '📅', descKey: 'desc_attendance', color: 'magenta' },
  { id: 'letter-writer', labelKey: 'tool_letter', icon: '✉️', descKey: 'desc_letter', color: 'purple' },
  { id: 'plagiarism-checker', labelKey: 'tool_plagiarism', icon: '🔍', descKey: 'desc_plagiarism', color: 'purple' },
  { id: 'ai-detector', labelKey: 'tool_ai_detector', icon: '🤖', descKey: 'desc_ai_detector', color: 'cyan' },
  { id: 'qr-generator', labelKey: 'tool_qr', icon: '🔲', descKey: 'desc_qr', color: 'magenta' },
  { id: 'url-shortener', labelKey: 'tool_url', icon: '🔗', descKey: 'desc_url', color: 'purple' },
];

// Fallback descriptions (if i18n key not found)
const DESC_FALLBACK = {
  desc_smart_quiz: 'ออกข้อสอบ + QR Code สำหรับนักศึกษา',
  desc_attendance: 'เช็กชื่อด้วย QR Code + GPS',
  desc_letter: 'สร้างจดหมายราชการภาษาไทย',
  desc_plagiarism: 'ตรวจ Similarity ของงานนักศึกษา',
  desc_ai_detector: 'ตรวจว่า AI เขียนหรือมนุษย์เขียน',
  desc_qr: 'สร้าง QR Code จาก URL',
  desc_url: 'ย่อลิงก์ + Track Clicks',
};

const COLOR_STYLES = {
  cyan: { bg: CI.cyan, light: '#e6f9ff', border: '#80daff', text: '#0090b8' },
  purple: { bg: CI.purple, light: '#f3edff', border: '#c4a8ff', text: '#5c35cc' },
  magenta: { bg: CI.magenta, light: '#fff0f6', border: '#ff80b8', text: '#b8005e' },
};

export default function TeacherDashboard({ onSelectTool, menuItems, colorMap, lang = 'th' }) {
  const stats = [
    { label: t(lang, 'stat_total_tools'), value: '35', icon: '🛠️', color: CI.cyan },
    { label: t(lang, 'stat_phase1_ready'), value: '7', icon: '✅', color: CI.magenta },
    { label: 'AI Features', value: '12', icon: '🤖', color: CI.purple },
    { label: t(lang, 'stat_main_areas'), value: '4', icon: '🎓', color: CI.gold },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>
      {/* Welcome — Road Animation Banner (flush to top) */}
      <div style={{
        background: `linear-gradient(145deg, ${CI.dark} 0%, #111145 50%, #1a1a5e 100%)`,
        padding: '28px 32px 20px', marginBottom: '0', color: '#fff',
        position: 'relative', overflow: 'hidden', minHeight: '160px',
      }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '-40%', right: '-15%', width: '50%', height: '180%', background: `radial-gradient(ellipse, ${CI.cyan}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-10%', width: '40%', height: '120%', background: `radial-gradient(ellipse, ${CI.magenta}08 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Stars */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? '2px' : '1.5px', height: i % 3 === 0 ? '2px' : '1.5px',
            borderRadius: '50%',
            background: i % 3 === 0 ? CI.cyan : i % 3 === 1 ? CI.gold : '#fff',
            top: `${(i * 13 + 5) % 50}%`, left: `${(i * 19 + 8) % 95}%`,
            animation: `twinkle ${1.5 + (i % 3) * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`, opacity: 0.5,
          }} />
        ))}

        <style>{`
          @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
          @keyframes bannerBusRun {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(calc(100vw + 20%)); }
          }
          @keyframes bannerBusRun2 {
            0% { transform: translateX(calc(100vw + 20%)) scaleX(-1); }
            100% { transform: translateX(-120%) scaleX(-1); }
          }
          @keyframes bannerBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes bannerRoadDash {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -40; }
          }
          @keyframes bannerWheel {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {/* Title */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: '12px' }}>
          <h1 style={{ margin: '0 0 2px', fontSize: '28px', fontWeight: 800, letterSpacing: '0.02em' }}>
            <span style={{ color: CI.cyan }}>SPU</span><span style={{ color: CI.magenta }}>BUS</span>
            <span style={{ color: '#fff', marginLeft: '10px', fontWeight: 600 }}>Teacher Support</span>
          </h1>
        </div>

        {/* Road Scene */}
        <div style={{ position: 'relative', width: '100%', height: '70px', zIndex: 2 }}>
          {/* SVG Curved Road — extends beyond edges */}
          <svg width="100%" height="70" viewBox="-100 0 1400 70" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: '-2%', right: '-2%', width: '104%' }}>
            {/* Road surface */}
            <path d="M-100,35 C100,28 300,42 500,35 C700,28 900,42 1100,35 L1300,35" stroke="#2a2a4e" strokeWidth="32" fill="none" />
            {/* Road border top */}
            <path d="M-100,35 C100,28 300,42 500,35 C700,28 900,42 1100,35 L1300,35" stroke="#3a3a6e" strokeWidth="34" fill="none" opacity="0.3" />
            {/* Center dashes */}
            <path d="M-100,35 C100,28 300,42 500,35 C700,28 900,42 1100,35 L1300,35" stroke={CI.gold} strokeWidth="2" fill="none" strokeDasharray="16 12" opacity="0.7" style={{ animation: 'bannerRoadDash 1s linear infinite' }} />
          </svg>

          {/* Main bus (cyan, going right) */}
          <div style={{
            position: 'absolute', bottom: '22px', left: 0,
            animation: 'bannerBusRun 6s linear infinite',
          }}>
            <div style={{ animation: 'bannerBounce 0.25s ease-in-out infinite' }}>
              <svg width="100" height="50" viewBox="0 0 140 65">
                <rect x="5" y="10" width="130" height="40" rx="8" fill={CI.cyan} />
                <rect x="10" y="5" width="120" height="10" rx="5" fill="#0099cc" />
                <rect x="15" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <rect x="38" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <rect x="61" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <rect x="84" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <rect x="107" y="18" width="22" height="28" rx="3" fill="#0099cc" />
                <rect x="130" y="30" width="8" height="8" rx="2" fill={CI.gold} />
                <rect x="2" y="30" width="6" height="8" rx="2" fill={CI.magenta} />
                <text x="50" y="44" fill="#fff" fontSize="9" fontWeight="800" fontFamily="sans-serif">SPU BUS</text>
                <rect x="5" y="48" width="130" height="4" rx="2" fill="#0088b3" />
                <circle cx="35" cy="55" r="8" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
                <circle cx="35" cy="55" r="3" fill="#555" />
                <circle cx="105" cy="55" r="8" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
                <circle cx="105" cy="55" r="3" fill="#555" />
                <g style={{ transformOrigin: '35px 55px', animation: 'bannerWheel 0.3s linear infinite' }}>
                  <line x1="35" y1="49" x2="35" y2="61" stroke="#777" strokeWidth="1" />
                  <line x1="29" y1="55" x2="41" y2="55" stroke="#777" strokeWidth="1" />
                </g>
                <g style={{ transformOrigin: '105px 55px', animation: 'bannerWheel 0.3s linear infinite' }}>
                  <line x1="105" y1="49" x2="105" y2="61" stroke="#777" strokeWidth="1" />
                  <line x1="99" y1="55" x2="111" y2="55" stroke="#777" strokeWidth="1" />
                </g>
              </svg>
            </div>
          </div>

          {/* Small bus (magenta, going left) */}
          <div style={{
            position: 'absolute', bottom: '18px', left: 0,
            animation: 'bannerBusRun2 9s linear infinite',
            animationDelay: '2s',
          }}>
            <svg width="60" height="32" viewBox="0 0 140 65">
              <rect x="5" y="10" width="130" height="40" rx="8" fill={CI.magenta} />
              <rect x="10" y="5" width="120" height="10" rx="5" fill="#cc006e" />
              <rect x="15" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.8" />
              <rect x="38" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.8" />
              <rect x="61" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.8" />
              <rect x="130" y="30" width="8" height="8" rx="2" fill={CI.gold} />
              <circle cx="35" cy="55" r="8" fill="#1a1a2e" />
              <circle cx="105" cy="55" r="8" fill="#1a1a2e" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px', padding: '24px 24px 0' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: '14px', padding: '18px',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '15px', color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 1 - Ready to use */}
      <div style={{ marginBottom: '28px', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: CI.cyan }} />
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
            🚀 {t(lang, 'dashboard_phase1')}
          </h2>
          <span style={{ padding: '2px 10px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '15px', fontWeight: 600 }}>
            7 {t(lang, 'tools_count')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {PHASE1_TOOLS.map(tool => {
            const c = COLOR_STYLES[tool.color];
            const desc = t(lang, tool.descKey) !== tool.descKey ? t(lang, tool.descKey) : DESC_FALLBACK[tool.descKey] || '';
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                style={{
                  background: '#fff', borderRadius: '14px', padding: '18px',
                  border: `1px solid ${c.border}`, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s', display: 'flex', gap: '14px', alignItems: 'flex-start',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${c.bg}20`;
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
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{t(lang, tool.labelKey)}</div>
                  <div style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* All sections overview */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: CI.magenta }} />
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
            📋 {t(lang, 'dashboard_all')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {menuItems.map(side => {
            const c = colorMap[side.color];
            return (
              <div key={side.side} style={{
                background: '#fff', borderRadius: '16px', overflow: 'hidden',
                border: `1px solid ${c.border}`,
              }}>
                <div style={{ padding: '16px 20px', background: c.bg, color: '#fff' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{side.icon} {t(lang, side.labelKey)}</div>
                  <div style={{ fontSize: '15px', opacity: 0.85, marginTop: '2px' }}>
                    {side.groups.reduce((acc, g) => acc + g.items.length, 0)} {t(lang, 'tools_count')}
                  </div>
                </div>
                <div style={{ padding: '10px' }}>
                  {side.groups.map(group => (
                    <div key={group.labelKey} style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.05em' }}>
                        {t(lang, group.labelKey)}
                      </div>
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => onSelectTool(item.id)}
                          style={{
                            width: '100%', background: 'none', border: 'none',
                            padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '15px', color: '#374151', textAlign: 'left',
                            transition: 'background 0.15s', fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = c.light}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span>{item.icon}</span>
                          <span style={{ flex: 1 }}>{t(lang, item.labelKey)}</span>
                          {item.phase === 1 && (
                            <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>✓</span>
                          )}
                          {item.phase > 1 && (
                            <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#94a3b8' }}>P{item.phase}</span>
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

'use client';
import { useState } from 'react';
import { t } from '@/lib/teacher/i18n';

const CI = {
  cyan: '#00b4e6',
  magenta: '#e6007e',
  dark: '#0b0b24',
  gold: '#ffc107',
  purple: '#7c4dff',
};

const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const COLOR_STYLES = {
  cyan:    { bg: CI.cyan,    light: '#e6f9ff', border: '#80daff', text: '#0090b8', grad: 'linear-gradient(135deg,#00b4e6,#0077aa)' },
  purple:  { bg: CI.purple,  light: '#f3edff', border: '#c4a8ff', text: '#5c35cc', grad: 'linear-gradient(135deg,#7c4dff,#5c35cc)' },
  gold:    { bg: '#e6a800',  light: '#fff8e1', border: '#ffd54f', text: '#9e7700', grad: 'linear-gradient(135deg,#ffc107,#e6a800)' },
  magenta: { bg: CI.magenta, light: '#fff0f6', border: '#ff80b8', text: '#b8005e', grad: 'linear-gradient(135deg,#e6007e,#aa005e)' },
  orange:  { bg: '#f97316',  light: '#fff4ed', border: '#fdc79a', text: '#c2440a', grad: 'linear-gradient(135deg,#f97316,#ea6000)' },
  teal:    { bg: '#0d9488',  light: '#e6faf8', border: '#6eddd7', text: '#0a7a72', grad: 'linear-gradient(135deg,#0d9488,#0a7a72)' },
  teal2:   { bg: '#0369a1',  light: '#e0f2fe', border: '#7dd3fc', text: '#0369a1', grad: 'linear-gradient(135deg,#0369a1,#0284c7)' },
  green:   { bg: '#16a34a',  light: '#dcfce7', border: '#86efac', text: '#15803d', grad: 'linear-gradient(135deg,#16a34a,#15803d)' },
};

const CATEGORY_DESC = {
  classroom_fun: 'Poll · Word Cloud · เกมตอบคำถาม · บัตรคำ',
  assessment:    'ออกข้อสอบ · วัดผล · ตรวจงาน · ให้คะแนน',
  documents:     'แผนสอน · Slide · จดหมาย · E-book · ใบประกาศ · แบบฟอร์ม · แปลภาษา',
  manage_share:  'QR Code · ย่อลิงก์ · PDF · อ่านรูป · คลังเอกสาร',
  marketing:     'สร้างคอนเทนต์ · ออกแบบโปสเตอร์ · สื่อการตลาด',
  attendance:    'เช็กชื่อนักศึกษา · ติดตามผล',
  check_verify:  'วางแผนสอน · ตารางสอน · ตรวจ Plagiarism · ตรวจไวยากรณ์',
  project:       'จัดกิจกรรม · ติดตามงบ · ประชุม · KPI · ส่งประกาศ',
};

export default function TeacherDashboard({ onSelectTool, menuItems, colorMap, lang = 'th' }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const activeCat = selectedCategory ? menuItems.find(m => m.side === selectedCategory) : null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>

      {/* ===== BANNER ===== */}
      <div style={{
        background: `linear-gradient(145deg,${CI.dark} 0%,#111145 50%,#1a1a5e 100%)`,
        padding: '28px 32px 20px', color: '#fff',
        position: 'relative', overflow: 'hidden', minHeight: '160px',
      }}>
        <div style={{ position:'absolute', top:'-40%', right:'-15%', width:'50%', height:'180%', background:`radial-gradient(ellipse,${CI.cyan}12 0%,transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30%', left:'-10%', width:'40%', height:'120%', background:`radial-gradient(ellipse,${CI.magenta}08 0%,transparent 70%)`, pointerEvents:'none' }} />
        {[...Array(12)].map((_,i) => (
          <div key={i} style={{ position:'absolute', width: i%3===0?'2px':'1.5px', height: i%3===0?'2px':'1.5px', borderRadius:'50%', background: i%3===0?CI.cyan:i%3===1?CI.gold:'#fff', top:`${(i*13+5)%50}%`, left:`${(i*19+8)%95}%`, animation:`twinkle ${1.5+(i%3)*0.8}s ease-in-out infinite`, animationDelay:`${i*0.3}s`, opacity:0.5 }} />
        ))}
        <style>{`
          @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:0.8} }
          @keyframes bannerBusRun { 0%{transform:translateX(-120%)} 100%{transform:translateX(calc(100vw + 20%))} }
          @keyframes bannerBusRun2 { 0%{transform:translateX(calc(100vw + 20%)) scaleX(-1)} 100%{transform:translateX(-120%) scaleX(-1)} }
          @keyframes bannerBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
          @keyframes bannerRoadDash { 0%{stroke-dashoffset:0} 100%{stroke-dashoffset:-40} }
          @keyframes bannerWheel { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        `}</style>
        <div style={{ position:'relative', zIndex:2, marginBottom:'12px' }}>
          <h1 style={{ margin:'0 0 2px', fontSize:'28px', fontWeight:800, letterSpacing:'0.02em' }}>
            <span style={{ color:'#fff' }}>SPUBUS</span>
            <span style={{ color:CI.cyan, marginLeft:'10px', fontWeight:600 }}>SUPPORT</span>
          </h1>
          <p style={{ margin:0, fontSize:'14px', color:'rgba(255,255,255,0.6)' }}>แพลตฟอร์มสนับสนุนการสอน · คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม</p>
        </div>
        <div style={{ position:'relative', width:'100%', height:'70px', zIndex:2 }}>
          <svg width="100%" height="70" viewBox="-100 0 1400 70" preserveAspectRatio="none" style={{ position:'absolute', bottom:0, left:'-2%', width:'104%' }}>
            <path d="M-100,35 C100,28 300,42 500,35 C700,28 900,42 1100,35 L1300,35" stroke="#2a2a4e" strokeWidth="32" fill="none" />
            <path d="M-100,35 C100,28 300,42 500,35 C700,28 900,42 1100,35 L1300,35" stroke={CI.gold} strokeWidth="2" fill="none" strokeDasharray="16 12" opacity="0.7" style={{ animation:'bannerRoadDash 1s linear infinite' }} />
          </svg>
          <div style={{ position:'absolute', bottom:'22px', left:0, animation:'bannerBusRun 6s linear infinite' }}>
            <div style={{ animation:'bannerBounce 0.25s ease-in-out infinite' }}>
              <svg width="100" height="50" viewBox="0 0 140 65">
                <rect x="5" y="10" width="130" height="40" rx="8" fill={CI.cyan} />
                <rect x="10" y="5" width="120" height="10" rx="5" fill="#0099cc" />
                <rect x="15" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <rect x="38" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <rect x="61" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <rect x="84" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
                <text x="50" y="44" fill="#fff" fontSize="9" fontWeight="800" fontFamily="sans-serif">SPU BUS</text>
                <circle cx="35" cy="55" r="8" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
                <circle cx="35" cy="55" r="3" fill="#555" />
                <circle cx="105" cy="55" r="8" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
                <circle cx="105" cy="55" r="3" fill="#555" />
              </svg>
            </div>
          </div>
          <div style={{ position:'absolute', bottom:'18px', left:0, animation:'bannerBusRun2 9s linear infinite', animationDelay:'2s' }}>
            <svg width="60" height="32" viewBox="0 0 140 65">
              <rect x="5" y="10" width="130" height="40" rx="8" fill={CI.magenta} />
              <rect x="10" y="5" width="120" height="10" rx="5" fill="#cc006e" />
              <rect x="15" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.8" />
              <rect x="38" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.8" />
              <rect x="61" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.8" />
              <circle cx="35" cy="55" r="8" fill="#1a1a2e" />
              <circle cx="105" cy="55" r="8" fill="#1a1a2e" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 24px' }}>

        {/* ===== CATEGORY VIEW ===== */}
        {!activeCat ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>เลือกด้านที่ต้องการใช้งาน</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>คลิกที่ด้านใดด้านหนึ่งเพื่อดูเครื่องมือทั้งหมดในด้านนั้น</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              {menuItems.map(cat => {
                const c = COLOR_STYLES[cat.color] || COLOR_STYLES.cyan;
                const toolCount = cat.groups.reduce((acc, g) => acc + g.items.length, 0);
                return (
                  <button
                    key={cat.side}
                    onClick={() => setSelectedCategory(cat.side)}
                    style={{
                      background: '#fff', border: `2px solid ${c.border}`, borderRadius: '20px',
                      padding: '28px 24px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s', fontFamily: FONT,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 12px 32px ${c.bg}30`;
                      e.currentTarget.style.borderColor = c.bg;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      e.currentTarget.style.borderColor = c.border;
                    }}
                  >
                    {/* Icon circle */}
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: c.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>
                      {cat.icon}
                    </div>
                    {/* Title */}
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                      {t(lang, cat.labelKey)}
                    </div>
                    {/* Desc */}
                    <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
                      {CATEGORY_DESC[cat.side]}
                    </div>
                    {/* Tool count badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ background: c.light, color: c.text, padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 700 }}>
                        {toolCount} เครื่องมือ
                      </span>
                      <span style={{ color: c.text, fontSize: '20px', fontWeight: 700 }}>→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* ===== TOOLS IN CATEGORY ===== */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '10px',
                  padding: '8px 16px', cursor: 'pointer', fontSize: '15px',
                  color: '#64748b', fontFamily: FONT, fontWeight: 600,
                }}
              >
                ← กลับ
              </button>
              <div>
                <h2 style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>
                  {activeCat.icon} {t(lang, activeCat.labelKey)}
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{CATEGORY_DESC[activeCat.side]}</p>
              </div>
            </div>

            {activeCat.groups.map(group => {
              const c = COLOR_STYLES[activeCat.color] || COLOR_STYLES.cyan;
              return (
                <div key={group.labelKey} style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingLeft: '4px' }}>
                    {t(lang, group.labelKey)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSelectTool(item.id)}
                        style={{
                          background: '#fff', border: `1px solid ${c.border}`, borderRadius: '14px',
                          padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: '14px',
                          transition: 'all 0.15s', fontFamily: FONT,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = c.light;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 6px 16px ${c.bg}20`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: c.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{t(lang, item.labelKey)}</div>
                        </div>
                        {item.phase === 1 && (
                          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

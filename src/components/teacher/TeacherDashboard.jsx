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
  classroom_fun: 'Interactive · Live Quiz · ทายคำเป็นหมวด · Smart Quiz · Video Quiz · ตรวจงาน AI',
  documents:     'แผนสอน · Slide · จดหมาย · E-book · ใบประกาศ · แบบฟอร์ม · แปลภาษา · Rubric',
  manage_share:  'QR Code · ย่อลิงก์ · PDF · อ่านรูป · คลังเอกสาร',
  marketing:     'สร้างคอนเทนต์ · ออกแบบโปสเตอร์ · สื่อการตลาด',
  attendance:    'เช็กชื่อนักศึกษา · ติดตามผล',
  check_verify:  'วางแผนสอน · ตารางสอน · ตรวจ Plagiarism · ตรวจไวยากรณ์',
  project:       'จัดกิจกรรม · ติดตามงบ · ประชุม · KPI · ส่งประกาศ',
};

export default function TeacherDashboard({ onSelectTool, menuItems, colorMap, lang = 'th', selectedCategory: controlledCategory, onCategoryChange }) {
  const [localCategory, setLocalCategory] = useState(null);

  // Support both controlled (from parent) and uncontrolled modes
  const selectedCategory = controlledCategory !== undefined ? controlledCategory : localCategory;
  const setSelectedCategory = (val) => {
    setLocalCategory(val);
    if (onCategoryChange) onCategoryChange(val);
  };

  const activeCat = selectedCategory ? menuItems.find(m => m.side === selectedCategory) : null;

  return (
    <div style={{ fontFamily: FONT }}>

      {/* ===== BANNER (full-bleed scenic hero) ===== */}
      <div style={{
        background: `linear-gradient(145deg,${CI.dark} 0%,#111145 45%,#1f1f6e 100%)`,
        padding: 'clamp(20px,3.2vw,38px) clamp(20px,3vw,40px) 0', color: '#fff',
        position: 'relative', overflow: 'hidden',
        minHeight: 'clamp(220px,24vw,310px)',
        width: '100%',
      }}>
        {/* Background glows */}
        <div style={{ position:'absolute', top:'-40%', right:'-15%', width:'60%', height:'180%', background:`radial-gradient(ellipse,${CI.cyan}1c 0%,transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30%', left:'-10%', width:'50%', height:'130%', background:`radial-gradient(ellipse,${CI.magenta}10 0%,transparent 70%)`, pointerEvents:'none' }} />

        {/* Stars */}
        {[...Array(28)].map((_,i) => {
          const s = (i%4===0)?3:(i%3===0)?2:1.5;
          return (
            <div key={i} style={{
              position:'absolute',
              width: s, height: s, borderRadius:'50%',
              background: i%4===0?CI.gold:i%3===1?CI.cyan:'#fff',
              top:`${(i*13+5)%55}%`, left:`${(i*19+8)%97}%`,
              animation:`twinkle ${1.4+(i%4)*0.7}s ease-in-out infinite`,
              animationDelay:`${i*0.18}s`,
              opacity: 0.4 + (i%3)*0.18,
              boxShadow: i%4===0 ? `0 0 4px ${CI.gold}` : 'none',
            }} />
          );
        })}

        {/* Moon */}
        <div style={{
          position:'absolute', top:'14%', right:'7%',
          width:'clamp(34px,4vw,52px)', height:'clamp(34px,4vw,52px)',
          borderRadius:'50%',
          background:'radial-gradient(circle at 35% 35%, #fff8e0 0%, #ffd97a 60%, #d4a64a 100%)',
          boxShadow:'0 0 24px rgba(255,217,122,0.4), inset -6px -4px 0 rgba(0,0,0,0.1)',
          zIndex:1,
        }} />

        <style>{`
          @keyframes twinkle { 0%,100%{opacity:0.25} 50%{opacity:0.95} }
          @keyframes bannerBusRun  { 0%{left:-25%}                     100%{left:115%} }
          @keyframes bannerBusRun2 { 0%{left:115%; transform:scaleX(-1)}  100%{left:-25%; transform:scaleX(-1)} }
          @keyframes bannerBounce  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-3px)} }
          @keyframes bannerRoadDash{ 0%{stroke-dashoffset:0}           100%{stroke-dashoffset:-40} }
          @keyframes cloudDrift    { 0%{left:-15%}                     100%{left:115%} }
          @keyframes cloudDrift2   { 0%{left:115%}                     100%{left:-15%} }
          @keyframes headlightPulse{ 0%,100%{opacity:0.6}              50%{opacity:1} }
          @keyframes rainbowShift  { 0%{background-position:0% 50%}    100%{background-position:300% 50%} }
          @keyframes titleBob      { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-4px)} }
          @keyframes titleGlow     { 0%,100%{filter:drop-shadow(0 0 12px rgba(0,180,230,0.5))} 50%{filter:drop-shadow(0 0 22px rgba(124,77,255,0.6)) drop-shadow(0 0 12px rgba(230,0,126,0.5))} }
          @keyframes auroraShift   { 0%{transform:translateX(-30%) skewX(-15deg)} 100%{transform:translateX(130%) skewX(-15deg)} }
        `}</style>

        {/* Aurora light beam (decorative) */}
        <div style={{
          position:'absolute', top:'-20%', left:0,
          width:'40%', height:'140%',
          background: `linear-gradient(120deg, transparent 0%, ${CI.cyan}22 35%, ${CI.magenta}1a 55%, transparent 80%)`,
          filter:'blur(30px)',
          animation:'auroraShift 16s ease-in-out infinite alternate',
          pointerEvents:'none', zIndex:1,
        }} />

        {/* Drifting clouds — full-width traversal */}
        <div style={{ position:'absolute', top:'18%', left:0, width:'100%', height:'30px', zIndex:1, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:0, animation:'cloudDrift 28s linear infinite', fontSize:'clamp(20px,2.5vw,32px)', opacity:0.25, filter:'blur(0.5px)' }}>☁️</div>
          <div style={{ position:'absolute', top:'40%', animation:'cloudDrift2 38s linear infinite', animationDelay:'-12s', fontSize:'clamp(16px,2vw,26px)', opacity:0.2, filter:'blur(0.5px)' }}>☁️</div>
          <div style={{ position:'absolute', top:'80%', animation:'cloudDrift 44s linear infinite', animationDelay:'-22s', fontSize:'clamp(22px,2.8vw,36px)', opacity:0.18, filter:'blur(0.5px)' }}>☁️</div>
        </div>

        {/* Title — animated cyan/purple/magenta gradient, centered */}
        <div style={{
          position:'relative', zIndex:3, marginBottom:'clamp(10px,1.4vw,18px)',
          maxWidth:'1200px', margin:'0 auto clamp(10px,1.4vw,18px)',
          textAlign:'center',
        }}>
          <h1 style={{
            margin:'0 0 6px',
            fontSize:'clamp(28px,4vw,52px)',
            fontWeight:900, letterSpacing:'0.04em', lineHeight:1.05,
            display:'inline-block',
            animation:'titleBob 4.5s ease-in-out infinite, titleGlow 6s ease-in-out infinite',
          }}>
            <span style={{
              background: `linear-gradient(90deg, ${CI.cyan} 0%, ${CI.purple} 33%, ${CI.magenta} 66%, ${CI.purple} 83%, ${CI.cyan} 100%)`,
              backgroundSize: '250% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              animation: 'rainbowShift 9s linear infinite',
              display: 'inline-block',
              fontWeight:900,
              textShadow:'0 4px 20px rgba(0,0,0,0.4)',
            }}>
              SPUBUS MAGIC
            </span>
          </h1>
          <p style={{
            margin:'0 auto', fontSize:'clamp(12px,1.1vw,15px)',
            color:'rgba(255,255,255,0.7)', maxWidth:'700px', lineHeight:1.5,
            textShadow:'0 2px 8px rgba(0,0,0,0.5)',
          }}>
            ✨ แพลตฟอร์ม AI เปลี่ยนห้องเรียนให้มีชีวิต · คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม
          </p>
        </div>

        {/* City silhouette + Mountains + Road + Buses (proportional to container) */}
        <div style={{
          position:'relative', width:'100%',
          height:'clamp(95px,11vw,140px)', zIndex:2,
        }}>
          {/* Distant mountains */}
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{
            position:'absolute', bottom:'48%', left:0,
            width:'100%', height:'clamp(28px,4vw,55px)',
            opacity:0.55, zIndex:0,
          }}>
            <defs>
              <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3535a8" />
                <stop offset="100%" stopColor="#0a0a2a" />
              </linearGradient>
            </defs>
            <path fill="url(#mtnGrad)"
              d="M0,60 L0,38 L120,15 L220,32 L340,8 L460,28 L560,12 L680,30 L820,15 L940,28 L1080,18 L1200,32 L1200,60 Z" />
          </svg>

          {/* City silhouette */}
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" style={{
            position:'absolute', bottom:'30%', left:0,
            width:'100%', height:'clamp(34px,4.5vw,60px)',
            opacity:0.55, zIndex:1, pointerEvents:'none',
          }}>
            <path
              fill="#0a0a2e"
              d="M0,80 L0,60 L60,60 L60,38 L100,38 L100,52 L160,52 L160,28 L210,28 L210,18 L260,18 L260,42 L320,42 L320,32 L370,32 L370,52 L420,52 L420,34 L480,34 L480,46 L540,46 L540,22 L600,22 L600,40 L660,40 L660,52 L720,52 L720,30 L780,30 L780,42 L850,42 L850,28 L910,28 L910,48 L980,48 L980,34 L1040,34 L1040,52 L1100,52 L1100,38 L1160,38 L1160,55 L1200,55 L1200,80 Z"
            />
            {[80, 175, 230, 285, 395, 505, 575, 695, 800, 935, 1010, 1115].map((x, i) => (
              <rect key={i} x={x} y={i%2===0?34:25} width="3.5" height="3.5" fill={CI.gold}
                style={{ animation:`twinkle ${2+(i%4)*0.5}s ease infinite`, animationDelay:`${i*0.4}s` }} />
            ))}
          </svg>

          {/* Road */}
          <svg width="100%" height="100%" viewBox="0 0 1200 100" preserveAspectRatio="none" style={{
            position:'absolute', bottom:0, left:0,
          }}>
            <path d="M-50,72 Q300,68 600,72 T1250,72 L1250,100 L-50,100 Z" fill="#0a0a1e" />
            <path d="M-50,55 Q300,48 600,55 T1250,55 L1250,80 L-50,80 Z" fill="#1a1a3e" />
            <path d="M-50,67 Q300,60 600,67 T1250,67"
              stroke={CI.gold} strokeWidth="2" fill="none"
              strokeDasharray="14 10" opacity="0.75"
              style={{ animation:'bannerRoadDash 1s linear infinite' }} />
            <path d="M-50,55 Q300,48 600,55 T1250,55"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
          </svg>

          {/* Big bus (cyan) — runs all the way across the banner */}
          <div style={{
            position:'absolute', bottom:'clamp(28px,3vw,42px)',
            width:'clamp(110px,11vw,165px)',
            animation:'bannerBusRun 11s linear infinite',
            zIndex:3,
          }}>
            <div style={{ animation:'bannerBounce 0.28s ease-in-out infinite' }}>
              <svg viewBox="0 0 140 65" style={{ width:'100%', height:'auto', display:'block' }}>
                <defs>
                  <linearGradient id="busBody1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3dc9ed" />
                    <stop offset="100%" stopColor={CI.cyan} />
                  </linearGradient>
                </defs>
                <ellipse cx="70" cy="62" rx="58" ry="3" fill="rgba(0,0,0,0.4)" />
                <rect x="5" y="10" width="130" height="40" rx="9" fill="url(#busBody1)" />
                <rect x="10" y="5" width="120" height="10" rx="5" fill="#0099cc" />
                <circle cx="135" cy="36" r="3" fill={CI.gold} style={{ animation:'headlightPulse 1.5s ease infinite' }} />
                <rect x="15" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.95" />
                <rect x="38" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.95" />
                <rect x="61" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.95" />
                <rect x="84" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.95" />
                <rect x="107" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.95" />
                <line x1="20" y1="20" x2="28" y2="32" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                <text x="70" y="46" fill="#fff" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">SPU BUS</text>
                <circle cx="35" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
                <circle cx="35" cy="55" r="4" fill="#666" />
                <circle cx="105" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
                <circle cx="105" cy="55" r="4" fill="#666" />
              </svg>
            </div>
          </div>

          {/* Smaller bus (magenta) — opposite direction, full traversal */}
          <div style={{
            position:'absolute', bottom:'clamp(22px,2.4vw,32px)',
            width:'clamp(70px,7vw,110px)',
            animation:'bannerBusRun2 16s linear infinite',
            animationDelay:'3.5s',
            zIndex:2, opacity:0.88,
          }}>
            <svg viewBox="0 0 140 65" style={{ width:'100%', height:'auto', display:'block' }}>
              <defs>
                <linearGradient id="busBody2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff4090" />
                  <stop offset="100%" stopColor={CI.magenta} />
                </linearGradient>
              </defs>
              <ellipse cx="70" cy="62" rx="58" ry="3" fill="rgba(0,0,0,0.4)" />
              <rect x="5" y="10" width="130" height="40" rx="9" fill="url(#busBody2)" />
              <rect x="10" y="5" width="120" height="10" rx="5" fill="#cc006e" />
              <circle cx="135" cy="36" r="3" fill={CI.gold} style={{ animation:'headlightPulse 1.5s ease infinite' }} />
              <rect x="15" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.85" />
              <rect x="38" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.85" />
              <rect x="61" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.85" />
              <rect x="84" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.85" />
              <circle cx="35" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
              <circle cx="35" cy="55" r="4" fill="#666" />
              <circle cx="105" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
              <circle cx="105" cy="55" r="4" fill="#666" />
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes catFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}>

        {/* ===== CATEGORY VIEW ===== */}
        {!activeCat ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>เลือกด้านที่ต้องการใช้งาน</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>คลิกที่ด้านใดด้านหนึ่งเพื่อดูเครื่องมือทั้งหมดในด้านนั้น</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', animation: 'catFadeIn 0.2s ease' }}>
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
          <div style={{ animation: 'catFadeIn 0.2s ease' }}>
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
          </div>
        )}
      </div>
    </div>
  );
}

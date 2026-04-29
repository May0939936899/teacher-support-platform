'use client';
import { useState, useEffect } from 'react';
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

  // ── Time-of-day theme + live clock ─────────────────────────────────────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const itv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(itv);
  }, []);
  const localHour = now.getHours();
  const isDay = localHour >= 6 && localHour < 18; // 06:00–17:59 = day
  const pad = n => String(n).padStart(2, '0');
  const localTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const utcTime   = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
  const dateStr   = now.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });

  // ── Theme palette per time of day ─────────────────────────────────────────
  const T = isDay ? {
    bg: 'linear-gradient(170deg,#7ec8ee 0%,#a5dcfa 45%,#cbecff 100%)',
    glowA: 'rgba(255,235,180,0.6)',  // warm sun glow
    glowB: 'rgba(255,200,140,0.4)',
    cityFill: '#7795ad',
    cityOpacity: 0.32,
    mtnGradStart: '#a8c5dd',
    mtnGradEnd: '#7795ad',
    starsHidden: true,
    cloudOpacity: 0.85,
    bridgeColor: '#dfe9f4',
    bridgeShadow: '#c5d3e3',
    roadDark: '#365266',
    roadMain: '#587590',
    titleShadow: '0 2px 12px rgba(15,23,42,0.18)',
    subColor: '#1e3a5f',
    subShadow: '0 1px 4px rgba(255,255,255,0.6)',
    clockBg: 'rgba(255,255,255,0.55)',
    clockBorder: 'rgba(255,255,255,0.8)',
    clockText: '#0f172a',
  } : {
    bg: 'linear-gradient(145deg,#0b0b24 0%,#111145 45%,#1f1f6e 100%)',
    glowA: `${CI.cyan}1c`,
    glowB: `${CI.magenta}10`,
    cityFill: '#0a0a2e',
    cityOpacity: 0.55,
    mtnGradStart: '#3535a8',
    mtnGradEnd: '#0a0a2a',
    starsHidden: false,
    cloudOpacity: 0.22,
    bridgeColor: '#0a0e2a',
    bridgeShadow: '#040818',
    roadDark: '#0a0a1e',
    roadMain: '#1a1a3e',
    titleShadow: '0 4px 20px rgba(0,0,0,0.4)',
    subColor: 'rgba(255,255,255,0.85)',
    subShadow: '0 2px 10px rgba(0,0,0,0.6)',
    clockBg: 'rgba(15,23,42,0.55)',
    clockBorder: 'rgba(255,255,255,0.18)',
    clockText: '#f8fafc',
  };

  // Support both controlled (from parent) and uncontrolled modes
  const selectedCategory = controlledCategory !== undefined ? controlledCategory : localCategory;
  const setSelectedCategory = (val) => {
    setLocalCategory(val);
    if (onCategoryChange) onCategoryChange(val);
  };

  const activeCat = selectedCategory ? menuItems.find(m => m.side === selectedCategory) : null;

  return (
    <div style={{ fontFamily: FONT }}>

      {/* ===== BANNER (full-bleed scenic hero) — auto day/night ===== */}
      <div style={{
        background: T.bg,
        padding: 'clamp(16px,2.4vw,28px) clamp(20px,3vw,40px) 0',
        color: '#fff',
        position: 'relative', overflow: 'hidden',
        minHeight: 'clamp(180px,19vw,250px)',
        width: '100%',
        transition: 'background 1s ease',
      }}>
        {/* Live clock — top-right corner (local time only) */}
        <div style={{
          position: 'absolute', top: 12, right: 16, zIndex: 10,
          background: T.clockBg, backdropFilter: 'blur(8px)',
          border: `1px solid ${T.clockBorder}`,
          borderRadius: 12, padding: '7px 14px',
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          color: T.clockText,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'right',
          transition: 'all 0.5s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, fontWeight: 700, fontSize: 'clamp(13px,1.1vw,15px)', letterSpacing: 0.5 }}>
            <span>{isDay ? '☀️' : '🌙'}</span>
            <span>{localTime}</span>
          </div>
          <div style={{ fontSize: 'clamp(10px,0.85vw,11px)', opacity: 0.7, marginTop: 1, fontWeight: 500 }}>
            {dateStr}
          </div>
        </div>

        {/* Background glows */}
        <div style={{ position:'absolute', top:'-40%', right:'-15%', width:'60%', height:'180%', background:`radial-gradient(ellipse,${T.glowA} 0%,transparent 70%)`, pointerEvents:'none', transition:'background 1s ease' }} />
        <div style={{ position:'absolute', bottom:'-30%', left:'-10%', width:'50%', height:'130%', background:`radial-gradient(ellipse,${T.glowB} 0%,transparent 70%)`, pointerEvents:'none', transition:'background 1s ease' }} />

        {/* Stars — only at night */}
        {!T.starsHidden && [...Array(28)].map((_,i) => {
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

        {/* ☀️/🌙 Sky body — moved LEFT so the clock doesn't cover it */}
        <div style={{
          position:'absolute', top:'18%', right:'22%',
          width:'clamp(58px,6.5vw,90px)', height:'clamp(58px,6.5vw,90px)',
          zIndex: 2, animation: 'skyBob 4s ease-in-out infinite',
        }}>
          {isDay ? (
            // ── Cute Sun ─────────────────────────────────────────────────
            <svg viewBox="0 0 120 120" style={{ width:'100%', height:'100%', display:'block', overflow:'visible' }}>
              <defs>
                <radialGradient id="sunGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%"  stopColor="#fff7c2" />
                  <stop offset="60%" stopColor="#ffe066" />
                  <stop offset="100%" stopColor="#fbb02d" />
                </radialGradient>
                <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>
              {/* Outer halo */}
              <circle cx="60" cy="60" r="56" fill="rgba(255,224,102,0.35)" filter="url(#sunGlow)" />
              {/* Sun rays — rotating */}
              <g style={{ transformOrigin: '60px 60px', animation: 'sunSpin 28s linear infinite' }}>
                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                  <g key={deg} transform={`rotate(${deg} 60 60)`}>
                    <path d="M60,4 L64,16 L56,16 Z" fill="#ffd54f" />
                  </g>
                ))}
                {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(deg => (
                  <g key={deg} transform={`rotate(${deg} 60 60)`}>
                    <path d="M60,12 L62,20 L58,20 Z" fill="#ffe066" />
                  </g>
                ))}
              </g>
              {/* Sun body */}
              <circle cx="60" cy="60" r="32" fill="url(#sunGrad)" stroke="#f9a825" strokeWidth="1.5" />
              {/* Eyes */}
              <ellipse cx="51" cy="58" rx="2.6" ry="3.4" fill="#3a2c0a" />
              <ellipse cx="69" cy="58" rx="2.6" ry="3.4" fill="#3a2c0a" />
              <circle cx="52" cy="56.5" r="0.9" fill="#fff" />
              <circle cx="70" cy="56.5" r="0.9" fill="#fff" />
              {/* Rosy cheeks */}
              <ellipse cx="48" cy="66" rx="3.5" ry="2.2" fill="#ff8aa8" opacity="0.6" />
              <ellipse cx="72" cy="66" rx="3.5" ry="2.2" fill="#ff8aa8" opacity="0.6" />
              {/* Smile */}
              <path d="M53,66 Q60,72 67,66" stroke="#3a2c0a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          ) : (
            // ── Cute Crescent Moon ───────────────────────────────────────
            <svg viewBox="0 0 120 120" style={{ width:'100%', height:'100%', display:'block', overflow:'visible' }}>
              <defs>
                <radialGradient id="moonGrad" cx="38%" cy="38%" r="62%">
                  <stop offset="0%"  stopColor="#fff8e0" />
                  <stop offset="55%" stopColor="#ffd97a" />
                  <stop offset="100%" stopColor="#e6b04a" />
                </radialGradient>
                <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
                <mask id="crescentMask">
                  <rect width="120" height="120" fill="white" />
                  <circle cx="78" cy="50" r="42" fill="black" />
                </mask>
              </defs>
              {/* Outer halo */}
              <circle cx="60" cy="60" r="54" fill="rgba(255,217,122,0.3)" filter="url(#moonGlow)" />
              {/* Crescent body */}
              <circle cx="60" cy="60" r="42" fill="url(#moonGrad)" stroke="#d4a64a" strokeWidth="1.5" mask="url(#crescentMask)" />
              {/* Eye on visible side */}
              <ellipse cx="50" cy="60" rx="2.6" ry="3.4" fill="#3a2c0a" />
              <circle cx="50.8" cy="58.5" r="0.9" fill="#fff" />
              {/* Rosy cheek */}
              <ellipse cx="46" cy="68" rx="3.2" ry="2" fill="#ff8aa8" opacity="0.55" />
              {/* Tiny smile */}
              <path d="M44,68 Q49,72 53,68" stroke="#3a2c0a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              {/* Decorative stars */}
              <g style={{ animation: 'twinkle 2s ease infinite' }}>
                <path d="M18,18 L20,22 L24,22 L21,25 L22,30 L18,27 L14,30 L15,25 L12,22 L16,22 Z" fill="#ffd97a" opacity="0.85" />
              </g>
              <g style={{ animation: 'twinkle 2.6s ease infinite', animationDelay: '0.5s' }}>
                <path d="M14,80 L15.4,83 L18.5,83 L16,85 L17,88 L14,86 L11,88 L12,85 L9.5,83 L12.6,83 Z" fill="#fff" opacity="0.8" />
              </g>
            </svg>
          )}
        </div>

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
          @keyframes skyBob        { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px) rotate(-2deg)} }
          @keyframes sunSpin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
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
          position:'relative', zIndex:3,
          maxWidth:'1200px', margin:'0 auto clamp(6px,0.8vw,10px)',
          textAlign:'center',
        }}>
          <h1 style={{
            margin:'0 0 4px',
            fontSize:'clamp(24px,3.4vw,44px)',
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
            margin:'0 auto', fontSize:'clamp(14px,1.4vw,19px)',
            color: T.subColor, maxWidth:'700px', lineHeight:1.5,
            textShadow: T.subShadow,
            fontWeight: 600, letterSpacing:'0.04em',
            transition: 'color 0.5s ease',
          }}>
            เปลี่ยนห้องเรียนให้มีชีวิต
          </p>
        </div>

        {/* City silhouette + Mountains + Road + Buses — break out of banner padding */}
        <div style={{
          position:'relative',
          width:'calc(100% + 2 * clamp(20px,3vw,40px))',
          marginLeft:'calc(-1 * clamp(20px,3vw,40px))',
          marginRight:'calc(-1 * clamp(20px,3vw,40px))',
          height:'clamp(85px,10vw,125px)', zIndex:2,
        }}>
          {/* Distant mountains */}
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{
            position:'absolute', bottom:'48%', left:0,
            width:'100%', height:'clamp(28px,4vw,55px)',
            opacity:0.55, zIndex:0,
          }}>
            <defs>
              <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.mtnGradStart} />
                <stop offset="100%" stopColor={T.mtnGradEnd} />
              </linearGradient>
            </defs>
            <path fill="url(#mtnGrad)"
              d="M0,60 L0,38 L120,15 L220,32 L340,8 L460,28 L560,12 L680,30 L820,15 L940,28 L1080,18 L1200,32 L1200,60 Z" />
          </svg>

          {/* City silhouette */}
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" style={{
            position:'absolute', bottom:'30%', left:0,
            width:'100%', height:'clamp(34px,4.5vw,60px)',
            opacity: T.cityOpacity, zIndex:1, pointerEvents:'none',
            transition: 'opacity 0.5s',
          }}>
            <path
              fill={T.cityFill}
              d="M0,80 L0,60 L60,60 L60,38 L100,38 L100,52 L160,52 L160,28 L210,28 L210,18 L260,18 L260,42 L320,42 L320,32 L370,32 L370,52 L420,52 L420,34 L480,34 L480,46 L540,46 L540,22 L600,22 L600,40 L660,40 L660,52 L720,52 L720,30 L780,30 L780,42 L850,42 L850,28 L910,28 L910,48 L980,48 L980,34 L1040,34 L1040,52 L1100,52 L1100,38 L1160,38 L1160,55 L1200,55 L1200,80 Z"
            />
            {!T.starsHidden && [80, 175, 230, 285, 395, 505, 575, 695, 800, 935, 1010, 1115].map((x, i) => (
              <rect key={i} x={x} y={i%2===0?34:25} width="3.5" height="3.5" fill={CI.gold}
                style={{ animation:`twinkle ${2+(i%4)*0.5}s ease infinite`, animationDelay:`${i*0.4}s` }} />
            ))}
          </svg>

          {/* Road */}
          <svg width="100%" height="100%" viewBox="0 0 1200 100" preserveAspectRatio="none" style={{
            position:'absolute', bottom:0, left:0,
          }}>
            <path d="M-50,72 Q300,68 600,72 T1250,72 L1250,100 L-50,100 Z" fill={T.roadDark} />
            <path d="M-50,55 Q300,48 600,55 T1250,55 L1250,80 L-50,80 Z" fill={T.roadMain} />
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

'use client';
/* ────────────────────────────────────────────────────────────────────────────
   StudentSplash — clean light splash shown when students scan QR codes.
   Auto-dismisses after `duration` ms (default 2200). Calls onFinish when done.
   No login required. Matches BTS / Bangkok skyline brand scene.
   ──────────────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react';

const FONT = "'Kanit','Noto Sans Thai',sans-serif";

export default function StudentSplash({ duration = 2200, onFinish }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setProgress(Math.round(t * 100));
      if (t >= 1) {
        clearInterval(itv);
        setDone(true);
        // small delay so user briefly sees 100%
        setTimeout(() => { onFinish && onFinish(); }, 200);
      }
    };
    const itv = setInterval(tick, 50);
    return () => clearInterval(itv);
  }, [duration, onFinish]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #cfe7ff 0%, #e3f2ff 60%, #e8f4ff 100%)',
      fontFamily: FONT,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      animation: done ? 'spfade 0.3s ease forwards' : 'none',
    }}>
      <style>{`
        @keyframes spfade    { to { opacity: 0; visibility: hidden; } }
        @keyframes spTrain   { 0% { left: -260px; }           100% { left: calc(100% + 260px); } }
        @keyframes spWheel   { to { transform: rotate(360deg); } }
        @keyframes spRoad    { to { background-position: -60px 0; } }
        @keyframes spFloat   { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
        @keyframes spTitleIn { from{opacity:0; transform: translateY(20px) scale(0.95)} to{opacity:1; transform: translateY(0) scale(1)} }
        @keyframes spRainbow { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes spCloud1  { 0%{ left:-12%; }  100%{ left:108%; } }
        @keyframes spCloud2  { 0%{ left:108%; opacity:0.55 }  100%{ left:-12%; opacity:0.55 } }
        @keyframes spCloud3  { 0%{ left:-15%; }  100%{ left:115%; } }
        @keyframes spSubGlow { 0%,100%{ text-shadow: 0 1px 0 rgba(255,255,255,0.5); } 50%{ text-shadow: 0 1px 0 rgba(255,255,255,0.5), 0 0 12px rgba(124,77,255,0.18); } }
      `}</style>

      {/* ── Drifting clouds (gentle, full-width) ─────────────────── */}
      <Cloud style={{ top:'8%',  size:'clamp(56px,8vw,110px)', opacity:0.85, animation:'spCloud1 38s linear infinite' }} />
      <Cloud style={{ top:'14%', size:'clamp(40px,5.5vw,76px)',  opacity:0.7,  animation:'spCloud2 52s linear infinite', animationDelay:'-15s' }} />
      <Cloud style={{ top:'22%', size:'clamp(72px,10vw,140px)', opacity:0.92, animation:'spCloud1 60s linear infinite', animationDelay:'-30s' }} />
      <Cloud style={{ top:'5%',  size:'clamp(34px,4.5vw,60px)',  opacity:0.6,  animation:'spCloud3 44s linear infinite', animationDelay:'-22s' }} />
      <Cloud style={{ top:'30%', size:'clamp(50px,7vw,96px)',   opacity:0.75, animation:'spCloud2 56s linear infinite', animationDelay:'-8s' }} />

      {/* ── Logo + Title (no sparkles, prettier subtitle pill) ───── */}
      <div style={{
        zIndex:3, textAlign:'center', position:'relative',
        animation:'spTitleIn 0.7s ease both, spFloat 5s ease-in-out infinite',
        marginBottom: 'clamp(40px,8vh,80px)',
      }}>
        <h1 style={{
          margin:0, fontSize:'clamp(40px,7.5vw,84px)',
          fontWeight:900, letterSpacing:'0.03em',
          background: 'linear-gradient(90deg,#1976d2 0%,#1565c0 22%,#c2185b 50%,#7c4dff 78%,#1976d2 100%)',
          backgroundSize: '220% 100%',
          WebkitBackgroundClip:'text', backgroundClip:'text',
          WebkitTextFillColor:'transparent', color:'transparent',
          animation:'spRainbow 7s linear infinite',
          filter:'drop-shadow(0 6px 24px rgba(124,77,255,0.28)) drop-shadow(0 2px 8px rgba(25,118,210,0.18))',
          lineHeight: 1.05,
        }}>
          SPUBUS MAGIC
        </h1>

        {/* Subtle decorative line under title */}
        <div style={{
          width: 'min(60%, 240px)', height: 3, margin: '14px auto 0',
          borderRadius: 99,
          background: 'linear-gradient(90deg, transparent, #7c4dff66, #c2185b66, #1976d266, transparent)',
        }} />

        <p style={{
          margin:'14px auto 0',
          fontSize:'clamp(13px,1.4vw,17px)',
          color:'#3a4a6e', fontWeight:600, letterSpacing:'0.05em',
          animation:'spSubGlow 3.5s ease infinite',
          fontFamily: FONT,
        }}>
          คณะบริหารธุรกิจ&nbsp; · &nbsp;มหาวิทยาลัยศรีปทุม
        </p>
      </div>

      {/* City silhouette (soft, behind train) */}
      <svg viewBox="0 0 1400 200" preserveAspectRatio="none" style={{
        position:'absolute', left:0, right:0, bottom:'clamp(70px,12vh,140px)',
        width:'100%', height:'clamp(110px,22vh,210px)',
        opacity:0.42, zIndex:1, pointerEvents:'none',
      }}>
        <defs>
          <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#a5c8e4" />
            <stop offset="100%" stopColor="#7fa8cc" />
          </linearGradient>
        </defs>
        <path fill="url(#cityGrad)" d="
          M0,200 L0,150 L40,150 L40,80 L100,80 L100,120 L150,120 L150,40 L210,40 L210,30 L260,30 L260,60 L320,60 L320,100 L380,100 L380,55 L440,55 L440,90 L500,90 L500,30 L560,30 L560,60 L620,60 L620,80 L680,80 L680,40 L740,40 L740,100 L800,100 L800,60 L860,60 L860,30 L920,30 L920,80 L980,80 L980,50 L1040,50 L1040,90 L1100,90 L1100,40 L1160,40 L1160,70 L1220,70 L1220,100 L1280,100 L1280,55 L1340,55 L1340,150 L1400,150 L1400,200 Z
        " />
        {/* Window dots — sparse */}
        {[[60,110],[170,80],[230,55],[290,80],[350,80],[410,75],[470,70],[530,55],[590,70],[650,60],[710,60],[770,80],[830,40],[890,55],[950,65],[1010,70],[1070,60],[1130,55],[1190,80],[1250,75],[1310,75]].map(([x,y],i) => (
          <rect key={i} x={x} y={y} width="3" height="3" fill="#5a8bb7" opacity={0.6} />
        ))}
      </svg>

      {/* Bridge / elevated tracks */}
      <div style={{
        position:'absolute', left:0, right:0,
        bottom:'clamp(56px,10vh,120px)',
        height:'clamp(20px,3vh,28px)',
        background:'#cdd9e8',
        boxShadow:'0 1px 0 #b6c4d6 inset',
        zIndex:2,
      }} />
      {/* Bridge supports */}
      <div style={{
        position:'absolute', left:0, right:0,
        bottom:'clamp(20px,4vh,60px)',
        height:'clamp(36px,6vh,60px)',
        zIndex:1,
        backgroundImage:'repeating-linear-gradient(90deg, transparent 0px, transparent 140px, #d0dbea 140px, #d0dbea 152px)',
      }} />

      {/* BTS Train — sits ON TOP of the bridge surface */}
      <div style={{
        position:'absolute',
        bottom:'clamp(95px,14vh,168px)',
        animation:`spTrain 5.5s linear infinite`,
        zIndex:3,
      }}>
        <svg width="clamp(280,32vw,440)" height="44" viewBox="0 0 440 52" style={{
          width:'clamp(280px,32vw,440px)', height:'auto', display:'block',
          filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
        }}>
          {/* Three carriages */}
          {[0, 145, 290].map((x, i) => (
            <g key={i} transform={`translate(${x}, 0)`}>
              {/* Bottom navy stripe */}
              <rect x="2" y="42" width="135" height="10" rx="2" fill="#2a4a8c" />
              {/* Body */}
              <rect x="2" y="14" width="135" height="30" rx="3" fill="#f5f7fa" stroke="#cfd6e0" strokeWidth="0.5" />
              {/* Top red stripe */}
              <rect x="2" y="6" width="135" height="9" rx="2" fill="#e8394a" />
              {/* Roof equipment */}
              <rect x="20" y="3" width="100" height="4" rx="1" fill="#9aa4b1" />
              {/* Windows */}
              <rect x="10" y="20" width="20" height="14" rx="2" fill="#a5c4dd" stroke="#7da3c2" strokeWidth="0.5" />
              <rect x="35" y="20" width="20" height="14" rx="2" fill="#a5c4dd" stroke="#7da3c2" strokeWidth="0.5" />
              <rect x="60" y="20" width="20" height="14" rx="2" fill="#a5c4dd" stroke="#7da3c2" strokeWidth="0.5" />
              <rect x="85" y="20" width="20" height="14" rx="2" fill="#a5c4dd" stroke="#7da3c2" strokeWidth="0.5" />
              <rect x="110" y="20" width="20" height="14" rx="2" fill="#a5c4dd" stroke="#7da3c2" strokeWidth="0.5" />
              {/* Door divider */}
              <line x1="69.5" y1="14" x2="69.5" y2="44" stroke="#dce2eb" strokeWidth="1" />
              {/* End connector to next car */}
              {i < 2 && (
                <rect x="137" y="22" width="8" height="14" rx="1" fill="#9aa4b1" />
              )}
            </g>
          ))}
          {/* Front headlights */}
          <circle cx="430" cy="38" r="2.5" fill="#ffd54f" />
          <circle cx="430" cy="32" r="2"   fill="#ffd54f" opacity="0.6" />
        </svg>
      </div>

      {/* Trees — scattered along the ground (more spread out) */}
      {[
        { left: '3%',  bottom: '7vh', size: 'clamp(34px,4.2vw,52px)',  emoji: '🌲' },
        { left: '8%',  bottom: '4vh', size: 'clamp(26px,3.4vw,40px)',  emoji: '🌳' },
        { left: '14%', bottom: '6vh', size: 'clamp(30px,3.8vw,46px)',  emoji: '🌲' },
        { left: '20%', bottom: '3vh', size: 'clamp(22px,3vw,34px)',    emoji: '🌳' },
        { left: '26%', bottom: '5.5vh', size: 'clamp(28px,3.4vw,42px)', emoji: '🌲' },
        { left: '33%', bottom: '3.5vh', size: 'clamp(20px,2.6vw,30px)', emoji: '🌳' },
        { left: '40%', bottom: '6vh', size: 'clamp(24px,3vw,36px)',    emoji: '🌲' },
        { left: '60%', bottom: '4vh', size: 'clamp(22px,2.8vw,34px)',  emoji: '🌳' },
        { left: '67%', bottom: '6.5vh', size: 'clamp(30px,3.8vw,46px)', emoji: '🌲' },
        { left: '73%', bottom: '4vh', size: 'clamp(24px,3vw,36px)',    emoji: '🌳' },
        { left: '80%', bottom: '7vh', size: 'clamp(34px,4.2vw,52px)',  emoji: '🌲' },
        { left: '86%', bottom: '3.5vh', size: 'clamp(22px,2.8vw,34px)', emoji: '🌳' },
        { left: '92%', bottom: '5.5vh', size: 'clamp(28px,3.6vw,44px)', emoji: '🌲' },
        { left: '97%', bottom: '4vh', size: 'clamp(24px,3vw,36px)',    emoji: '🌳' },
      ].map((tree, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: tree.left,
          bottom: tree.bottom,
          fontSize: tree.size,
          zIndex: 2,
          filter: 'drop-shadow(0 2px 4px rgba(50,80,40,0.15))',
          transform: 'translateX(-50%)',
        }}>
          {tree.emoji}
        </div>
      ))}

      {/* Progress bar (bottom) */}
      <div style={{
        position:'absolute', bottom:'clamp(14px,3vh,28px)', left:'50%',
        transform:'translateX(-50%)',
        width:'min(280px, 70%)', zIndex:5,
      }}>
        <div style={{
          height: 5, borderRadius: 3,
          background: 'rgba(15,23,42,0.08)',
          overflow:'hidden',
        }}>
          <div style={{
            height:'100%', borderRadius:3,
            width:`${progress}%`, transition:'width 0.05s linear',
            background: 'linear-gradient(90deg,#1976d2,#7c4dff,#c2185b)',
            boxShadow:'0 0 8px rgba(124,77,255,0.4)',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Soft fluffy cloud — pure SVG, drifts gently across the sky ─────────────
function Cloud({ style }) {
  const { size, opacity, animation, animationDelay, top } = style;
  return (
    <div style={{
      position: 'absolute',
      top,
      left: '-15%',
      width: size,
      opacity,
      animation,
      animationDelay,
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <svg viewBox="0 0 120 60" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <radialGradient id={`cloudGrad${size}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%"  stopColor="#ffffff" />
            <stop offset="80%" stopColor="#f0f7ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </radialGradient>
        </defs>
        <g fill={`url(#cloudGrad${size})`}>
          <ellipse cx="40" cy="38" rx="22" ry="14" />
          <ellipse cx="62" cy="32" rx="26" ry="18" />
          <ellipse cx="84" cy="38" rx="20" ry="13" />
          <ellipse cx="50" cy="42" rx="14" ry="10" />
          <ellipse cx="74" cy="44" rx="16" ry="9" />
        </g>
        {/* Subtle inner highlight */}
        <ellipse cx="55" cy="28" rx="14" ry="6" fill="#ffffff" opacity="0.6" />
      </svg>
    </div>
  );
}

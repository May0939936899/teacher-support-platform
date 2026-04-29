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
        @keyframes spfade   { to { opacity: 0; visibility: hidden; } }
        @keyframes spTrain  { 0% { left: -260px; }           100% { left: calc(100% + 260px); } }
        @keyframes spWheel  { to { transform: rotate(360deg); } }
        @keyframes spRoad   { to { background-position: -60px 0; } }
        @keyframes spSparkle{ 0%,100%{ opacity:0.3; transform:scale(0.8) } 50%{ opacity:1; transform:scale(1.15) } }
        @keyframes spFloat  { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
        @keyframes spTitleIn{ from{opacity:0; transform: translateY(20px) scale(0.95)} to{opacity:1; transform: translateY(0) scale(1)} }
        @keyframes spRainbow{ 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>

      {/* Sparkles around title */}
      {[
        {l:'42%',t:'30%',d:0,   s:18, c:'#7c4dff'},
        {l:'60%',t:'29%',d:0.4, s:14, c:'#ffc107'},
        {l:'48%',t:'42%',d:0.8, s:12, c:'#00b4e6'},
        {l:'58%',t:'42%',d:1.2, s:14, c:'#e6007e'},
      ].map((s,i) => (
        <div key={i} style={{
          position:'absolute', left:s.l, top:s.t, fontSize:s.s,
          color:s.c, animation:`spSparkle 1.6s ${s.d}s ease infinite`,
          textShadow:`0 0 8px ${s.c}88`,
          zIndex: 3,
        }}>✦</div>
      ))}

      {/* Logo + Title */}
      <div style={{
        zIndex:3, textAlign:'center',
        animation:'spTitleIn 0.7s ease both, spFloat 4s ease-in-out infinite',
        marginBottom: 'clamp(40px,8vh,80px)',
      }}>
        <h1 style={{
          margin:0, fontSize:'clamp(38px,7vw,76px)',
          fontWeight:900, letterSpacing:'0.02em',
          background: 'linear-gradient(90deg,#1976d2 0%,#1565c0 28%,#c2185b 50%,#7c4dff 78%,#1976d2 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip:'text', backgroundClip:'text',
          WebkitTextFillColor:'transparent', color:'transparent',
          animation:'spRainbow 5s linear infinite',
          filter:'drop-shadow(0 4px 18px rgba(124,77,255,0.25))',
          lineHeight: 1.05,
        }}>
          SPUBUS MAGIC
        </h1>
        <p style={{
          margin:'10px 0 0', fontSize:'clamp(13px,1.4vw,16px)',
          color:'#475569', fontWeight:500, letterSpacing:'0.04em',
        }}>
          คณะบริหารธุรกิจ &nbsp; มหาวิทยาลัยศรีปทุม
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

      {/* BTS Train */}
      <div style={{
        position:'absolute',
        bottom:'clamp(80px,13vh,150px)',
        animation:`spTrain 5.5s linear infinite`,
        zIndex:3,
      }}>
        <svg width="clamp(280,32vw,440)" height="48" viewBox="0 0 440 60" style={{
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

      {/* Trees (left + right of the bridge) */}
      <div style={{ position:'absolute', left:'clamp(30px,5vw,80px)', bottom:'clamp(28px,5vh,68px)', zIndex:2 }}>
        <span style={{ fontSize:'clamp(28px,3.5vw,44px)', display:'inline-block' }}>🌲</span>
      </div>
      <div style={{ position:'absolute', left:'clamp(80px,8vw,140px)', bottom:'clamp(20px,4vh,55px)', zIndex:2 }}>
        <span style={{ fontSize:'clamp(22px,3vw,34px)', display:'inline-block' }}>🌳</span>
      </div>
      {[ '70%','78%','86%','92%' ].map((l,i)=>(
        <div key={i} style={{
          position:'absolute', left:l,
          bottom:`clamp(${20+(i%2)*6}px, ${4+(i%2)*1}vh, ${55+(i%2)*8}px)`,
          fontSize:'clamp(22px,2.8vw,38px)', zIndex:2,
        }}>{i%2===0?'🌲':'🌳'}</div>
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

'use client';
import { useState, useEffect } from 'react';

export default function BtsHeroScene() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
      <header className="hero-header">
        <style>{`
          @keyframes trainRight {
            from { transform: translateX(-460px); }
            to   { transform: translateX(calc(100vw + 460px)); }
          }
          @keyframes trainLeft {
            from { transform: translateX(calc(100vw + 400px)) scaleX(-1); }
            to   { transform: translateX(-400px) scaleX(-1); }
          }
          @keyframes railShine { to { stroke-dashoffset: -80; } }
          @keyframes headBlink { 0%,90%,100%{opacity:1} 95%{opacity:0.4} }
          @keyframes bushSway  { 0%{transform:rotate(-1deg)} 25%{transform:rotate(2.5deg)} 50%{transform:rotate(-0.5deg)} 75%{transform:rotate(1.8deg)} 100%{transform:rotate(-1deg)} }
          @keyframes leafRustle { 0%{transform:skewX(0deg)} 20%{transform:skewX(3deg)} 40%{transform:skewX(-2deg)} 60%{transform:skewX(1.5deg)} 80%{transform:skewX(-1deg)} 100%{transform:skewX(0deg)} }
          @keyframes branchBob { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(2deg)} 70%{transform:rotate(-1.5deg)} }
          @keyframes starTwinkle { 0%,100%{opacity:0.12} 50%{opacity:0.65} }
          @keyframes winLight { 0%,100%{opacity:0.55} 50%{opacity:0.75} }

          /* ── Mobile responsive ── */
          @media (max-width: 768px) {
            .hero-header { min-height: 220px !important; padding-top: 16px !important; }
            .hero-header .hero-content h1 { font-size: 28px !important; }
            .hero-header .hero-content .subtitle { font-size: 12px !important; }
            .bts-skyline-wrap { height: 120px !important; bottom: 60px !important; }
            .bts-rail-wrap { height: 60px !important; }
            .bts-sign-wrap { display: none !important; }
            .bts-train-right, .bts-train-left { height: 26px !important; }
            .bts-train-right svg, .bts-train-left svg { width: 220px !important; height: 26px !important; }
          }
        `}</style>

        {/* ── Smooth City Skyline Background ── */}
        <div className="bts-skyline-wrap" style={{ position:'absolute', bottom: isMobile ? '50px' : '100px', left:0, right:0,
          height: isMobile ? '100px' : '240px', pointerEvents:'none', zIndex:0, opacity: isMobile ? 0.12 : 1 }}>
          <svg width="100%" height="240" viewBox="0 0 1400 240" preserveAspectRatio="xMidYMax slice">
            <defs>
              {/* Vertical fade — buildings dissolve upward */}
              <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="1"/>
                <stop offset="30%" stopColor="white" stopOpacity="0"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </linearGradient>
              {/* Horizontal center fade */}
              <linearGradient id="centerFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8aaad4" stopOpacity="0.2"/>
                <stop offset="30%" stopColor="#8aaad4" stopOpacity="0.18"/>
                <stop offset="42%" stopColor="#8aaad4" stopOpacity="0.06"/>
                <stop offset="50%" stopColor="#8aaad4" stopOpacity="0.03"/>
                <stop offset="58%" stopColor="#8aaad4" stopOpacity="0.06"/>
                <stop offset="70%" stopColor="#8aaad4" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#8aaad4" stopOpacity="0.2"/>
              </linearGradient>
            </defs>

            {/* === BACK ROW — softer, lighter silhouettes === */}
            <g opacity="0.08" fill="#6688bb">
              <rect x="30" y="30" width="65" height="210" rx="3"/>
              <rect x="110" y="60" width="50" height="180" rx="3"/>
              <rect x="200" y="20" width="55" height="220" rx="3"/>
              <rect x="310" y="50" width="60" height="190" rx="3"/>
              <rect x="420" y="35" width="50" height="205" rx="3"/>
              <rect x="520" y="55" width="55" height="185" rx="3"/>
              <rect x="620" y="40" width="60" height="200" rx="3"/>
              <rect x="730" y="25" width="50" height="215" rx="3"/>
              <rect x="830" y="50" width="55" height="190" rx="3"/>
              <rect x="930" y="30" width="60" height="210" rx="3"/>
              <rect x="1040" y="45" width="50" height="195" rx="3"/>
              <rect x="1130" y="20" width="65" height="220" rx="3"/>
              <rect x="1240" y="55" width="55" height="185" rx="3"/>
              <rect x="1330" y="35" width="60" height="205" rx="3"/>
            </g>

            {/* === FRONT ROW — more detailed buildings with windows === */}
            {/* Building styles: tall, medium, short with varied spacing */}
            {[
              {x:10, w:80, h:180, op:0.16},
              {x:100, w:65, h:140, op:0.14},
              {x:175, w:90, h:200, op:0.16},
              {x:280, w:60, h:120, op:0.13},
              {x:350, w:75, h:170, op:0.14},
              {x:440, w:60, h:145, op:0.08},
              {x:515, w:80, h:185, op:0.06},
              {x:610, w:55, h:130, op:0.05},
              {x:680, w:70, h:160, op:0.05},
              {x:765, w:60, h:140, op:0.06},
              {x:840, w:80, h:175, op:0.08},
              {x:935, w:65, h:130, op:0.13},
              {x:1010, w:75, h:165, op:0.14},
              {x:1100, w:90, h:195, op:0.16},
              {x:1205, w:60, h:130, op:0.14},
              {x:1280, w:80, h:175, op:0.16},
            ].map((b,i) => {
              const top = 240 - b.h;
              const cols = Math.floor(b.w / 22);
              const rows = Math.floor(b.h / 22);
              return (
                <g key={`bld${i}`} opacity={b.op}>
                  {/* Main body */}
                  <rect x={b.x} y={top} width={b.w} height={b.h} rx="4" fill="#2a4a80"/>
                  {/* Roof accent */}
                  <rect x={b.x} y={top} width={b.w} height="8" rx="3" fill="#1a2e5c"/>
                  {/* SPU gold bar on tallest ones */}
                  {b.h >= 180 && <rect x={b.x + b.w*0.3} y={top} width={b.w*0.3} height="8" rx="3" fill="#c8960a" opacity="0.8"/>}
                  {/* Window grid */}
                  {Array.from({length: cols}, (_, c) =>
                    Array.from({length: rows}, (_, r) => (
                      <rect key={`w${i}-${c}-${r}`}
                        x={b.x + 6 + c*22} y={top + 14 + r*22}
                        width="14" height="10" rx="2"
                        fill="#7ab4e0"
                        style={{animation:`winLight ${1.5+(c+r)%4*0.3}s ease-in-out infinite`,
                          animationDelay:`${(c*r)%7*0.2}s`}}
                      />
                    ))
                  )}
                  {/* Subtle vertical lines (pillars) */}
                  {[0.25, 0.5, 0.75].map(p => (
                    <line key={`pil${i}-${p}`}
                      x1={b.x + b.w*p} y1={top+8}
                      x2={b.x + b.w*p} y2={240}
                      stroke="rgba(10,26,68,0.08)" strokeWidth="1.5"/>
                  ))}
                </g>
              );
            })}

            {/* === Smooth fade-out top edge === */}
            <rect x="0" y="0" width="1400" height="80" fill="url(#skyFade)"/>

            {/* === Center horizontal fade to protect text === */}
            <rect x="0" y="0" width="1400" height="240" fill="url(#centerFade)" style={{mixBlendMode:'screen'}}/>
          </svg>
        </div>

        {/* Twinkling stars */}
        {[...Array(14)].map((_, i) => (
          <div key={i} style={{
            position:'absolute',
            width: i%3===0 ? '3px':'2px', height: i%3===0 ? '3px':'2px',
            borderRadius:'50%',
            background: i%3===0 ? '#00ADEF' : i%3===1 ? '#E3007E' : '#ffffff',
            top:`${(i*11+4)%70}%`, left:`${(i*17+6)%97}%`,
            animation:`starTwinkle ${1.4+(i%3)*0.7}s ease-in-out infinite`,
            animationDelay:`${i*0.25}s`, pointerEvents:'none',
          }}/>
        ))}

        <div className="hero-content" style={{ position:'relative', zIndex:1 }}>
          <h1><span className="text-gradient">SPUBUS BiZ CONTENT</span></h1>
          <p className="subtitle">คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม</p>
        </div>

        {/* Bang Bua Station Sign — HTML overlay above rail */}
        <div className="bts-sign-wrap" style={{ position:'relative', zIndex:10, pointerEvents:'none', height:0, display: isMobile ? 'none' : 'block' }}>
          <div style={{ position:'absolute', left:'18%', bottom:'-60px', display:'flex', alignItems:'flex-end' }}>
            {/* Pole — left side, reaches down to rail */}
            <div style={{ width:'8px', height:'110px', background:'linear-gradient(to bottom, #9aabb8, #7a8d9c)', borderRadius:'2px', marginRight:'6px', flexShrink:0 }}/>
            {/* Sign board — attached to right of pole */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'#003399', border:'3px solid white', borderRadius:'10px', padding:'8px 16px', boxShadow:'0 3px 12px rgba(0,0,0,0.2)', marginBottom:'60px' }}>
              <div>
                <div style={{ color:'white', fontSize:'14px', fontWeight:700, fontFamily:'sans-serif', lineHeight:1.2 }}>บางบัว</div>
                <div style={{ color:'white', fontSize:'18px', fontWeight:800, fontFamily:'sans-serif', lineHeight:1.2 }}>Bang Bua</div>
              </div>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#f5c518', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'#003399', fontSize:'13px', fontWeight:900, fontFamily:'sans-serif' }}>N15</span>
              </div>
            </div>
          </div>
        </div>

        {/* BTS-style elevated rail scene */}
        <div className="bts-rail-wrap" style={{ position:'relative', width:'100%', height: isMobile ? '55px' : '104px', marginTop:'4px', overflow:'hidden' }}>

          {/* Static structure: beam + T-columns + bushes */}
          <svg width="100%" height="104" viewBox="0 0 1400 104" preserveAspectRatio="xMidYMax slice"
            style={{ position:'absolute', bottom:0, left:0, width:'100%', pointerEvents:'none' }}>

            {/* ── Realistic Trees — LEFT side ── */}
            {/* Tree 1 — small */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'bushSway 3.2s ease-in-out infinite' }}>
              <rect x="43" y="82" width="4" height="18" rx="1.5" fill="#5a3825"/>
              <ellipse cx="45" cy="78" rx="14" ry="10" fill="#1b5e20"/>
              <ellipse cx="40" cy="74" rx="10" ry="8" fill="#2e7d32"/>
              <ellipse cx="50" cy="72" rx="11" ry="9" fill="#388e3c"/>
              <ellipse cx="45" cy="69" rx="8" ry="7" fill="#43a047"/>
            </g>
            {/* Tree 2 — tall */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'bushSway 3.8s ease-in-out infinite', animationDelay:'0.4s' }}>
              <rect x="78" y="72" width="5" height="28" rx="2" fill="#4e342e"/>
              <line x1="75" y1="88" x2="70" y2="94" stroke="#5d4037" strokeWidth="2" strokeLinecap="round"/>
              <ellipse cx="80" cy="66" rx="18" ry="14" fill="#1b5e20"/>
              <ellipse cx="74" cy="60" rx="14" ry="11" fill="#2e7d32"/>
              <ellipse cx="86" cy="58" rx="15" ry="12" fill="#388e3c"/>
              <ellipse cx="80" cy="54" rx="12" ry="10" fill="#43a047"/>
              <ellipse cx="76" cy="51" rx="8" ry="6" fill="#66bb6a"/>
            </g>
            {/* Tree 3 — medium bush */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'leafRustle 4s ease-in-out infinite', animationDelay:'0.8s' }}>
              <rect x="128" y="86" width="3" height="14" rx="1" fill="#5a3825"/>
              <ellipse cx="130" cy="83" rx="12" ry="9" fill="#1b5e20"/>
              <ellipse cx="125" cy="79" rx="10" ry="8" fill="#2e7d32"/>
              <ellipse cx="135" cy="78" rx="11" ry="8" fill="#388e3c"/>
              <ellipse cx="130" cy="75" rx="8" ry="6" fill="#4caf50"/>
            </g>
            {/* Ground bushes left */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'branchBob 2.6s ease-in-out infinite' }}>
              <ellipse cx="60"  cy="99" rx="20" ry="5" fill="#2e7d32" opacity="0.7"/>
              <ellipse cx="100" cy="99" rx="16" ry="4" fill="#388e3c" opacity="0.6"/>
              <ellipse cx="140" cy="99" rx="18" ry="5" fill="#2e7d32" opacity="0.5"/>
            </g>

            {/* ── Realistic Trees — RIGHT side ── */}
            {/* Tree 4 — tall */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'bushSway 3.5s ease-in-out infinite', animationDelay:'1.2s' }}>
              <rect x="1238" y="72" width="5" height="28" rx="2" fill="#4e342e"/>
              <line x1="1235" y1="88" x2="1230" y2="94" stroke="#5d4037" strokeWidth="2" strokeLinecap="round"/>
              <ellipse cx="1240" cy="66" rx="18" ry="14" fill="#1b5e20"/>
              <ellipse cx="1234" cy="60" rx="14" ry="11" fill="#2e7d32"/>
              <ellipse cx="1246" cy="58" rx="15" ry="12" fill="#388e3c"/>
              <ellipse cx="1240" cy="54" rx="12" ry="10" fill="#43a047"/>
              <ellipse cx="1236" cy="51" rx="8" ry="6" fill="#66bb6a"/>
            </g>
            {/* Tree 5 — small */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'leafRustle 3.6s ease-in-out infinite', animationDelay:'0.6s' }}>
              <rect x="1288" y="82" width="4" height="18" rx="1.5" fill="#5a3825"/>
              <ellipse cx="1290" cy="78" rx="14" ry="10" fill="#1b5e20"/>
              <ellipse cx="1285" cy="74" rx="10" ry="8" fill="#2e7d32"/>
              <ellipse cx="1295" cy="72" rx="11" ry="9" fill="#388e3c"/>
              <ellipse cx="1290" cy="69" rx="8" ry="7" fill="#43a047"/>
            </g>
            {/* Tree 6 — medium */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'bushSway 4.2s ease-in-out infinite', animationDelay:'1.5s' }}>
              <rect x="1338" y="78" width="4" height="22" rx="2" fill="#4e342e"/>
              <ellipse cx="1340" cy="72" rx="16" ry="12" fill="#1b5e20"/>
              <ellipse cx="1334" cy="66" rx="12" ry="10" fill="#2e7d32"/>
              <ellipse cx="1346" cy="64" rx="13" ry="10" fill="#388e3c"/>
              <ellipse cx="1340" cy="61" rx="10" ry="8" fill="#43a047"/>
              <ellipse cx="1337" cy="58" rx="7" ry="5" fill="#66bb6a"/>
            </g>
            {/* Ground bushes right */}
            <g style={{ transformBox:'fill-box', transformOrigin:'50% 100%', animation:'branchBob 2.8s ease-in-out infinite', animationDelay:'0.3s' }}>
              <ellipse cx="1250" cy="99" rx="18" ry="5" fill="#2e7d32" opacity="0.7"/>
              <ellipse cx="1295" cy="99" rx="16" ry="4" fill="#388e3c" opacity="0.6"/>
              <ellipse cx="1345" cy="99" rx="20" ry="5" fill="#2e7d32" opacity="0.5"/>
            </g>

            {/* sign moved to HTML overlay */}

            {/* T-shaped support columns */}
            {[90,250,410,570,730,890,1050,1210,1370].map(x => (
              <g key={`c${x}`}>
                {/* Cap (wide top) */}
                <rect x={x-32} y="68" width="64" height="10" rx="2" fill="#b8bfc8"/>
                <rect x={x-32} y="68" width="64" height="3"  rx="1" fill="#ccd2da"/>
                {/* Stem */}
                <rect x={x-12} y="78" width="24" height="22" rx="2" fill="#adb4be"/>
                {/* Base */}
                <rect x={x-18} y="98" width="36" height="5"  rx="1" fill="#a0a8b2"/>
              </g>
            ))}

            {/* Wide concrete beam */}
            <rect x="0" y="56" width="1400" height="14" fill="#c5ccd4"/>
            <rect x="0" y="56" width="1400" height="4"  fill="#d8dee6"/>
            <rect x="0" y="68" width="1400" height="2"  fill="rgba(0,0,0,0.07)"/>
            {/* Beam top surface */}
            <rect x="0" y="52" width="1400" height="6"  fill="#cdd4dc"/>
            <rect x="0" y="52" width="1400" height="2"  fill="#dce2ea"/>
            {/* Rail */}
            <rect x="0" y="49" width="1400" height="4" rx="1.5" fill="#98a4b2"/>
            <line x1="0" y1="50" x2="1400" y2="50"
              stroke="rgba(255,255,255,0.45)" strokeWidth="1.2"
              strokeDasharray="40 40"
              style={{ animation:'railShine 1.4s linear infinite' }}/>
          </svg>

          {/* ── MAIN TRAIN: left → right, slanted nose ── */}
          <div className="bts-train-right" style={{
            position:'absolute', bottom: isMobile ? '28px' : '44px', left:0,
            animation:'trainRight 18s linear infinite',
            animationFillMode:'backwards',
            willChange:'transform',
          }}>
            {/* viewBox 0 0 412 50 — 3 cars */}
            <svg width={isMobile ? "200" : "380"} height={isMobile ? "24" : "46"} viewBox="0 0 412 50">

              {/* CAR 1 — smooth aerodynamic front */}
              {/* Body — smooth cubic bezier nose */}
              <path d="M30,4 L136,4 L136,46 L6,46 C2,46 0,40 0,36 L0,18 C0,10 6,4 14,4 Z" fill="#f5f7fa"/>
              {/* Red top stripe — curved */}
              <path d="M30,4 L136,4 L136,12 L16,12 C10,12 6,8 14,4 Z" fill="#e8394a"/>
              {/* Thin white accent line below red */}
              <path d="M14,12 L136,12 L136,13.5 L14,13.5 Z" fill="white" opacity="0.5"/>
              {/* Navy bottom stripe — curved */}
              <path d="M4,38 L136,38 L136,46 L6,46 C2,46 0,42 2,38 Z" fill="#2a4a8c"/>
              {/* Thin white accent above navy */}
              <path d="M3,36.5 L136,36.5 L136,38 L4,38 Z" fill="white" opacity="0.4"/>
              {/* Windshield — large curved glass */}
              <path d="M18,13.5 L34,13.5 L34,36.5 L6,36.5 C2,36.5 1,30 1,25 C1,20 4,14 18,13.5 Z" fill="#4a6ea0" opacity="0.9"/>
              {/* Windshield reflection */}
              <path d="M16,15 L24,15 L18,28 L8,28 C6,28 5,24 8,18 Z" fill="white" opacity="0.15"/>
              {/* Windshield divider */}
              <line x1="20" y1="13.5" x2="14" y2="36.5" stroke="#2a3a5e" strokeWidth="0.8" opacity="0.5"/>
              {/* Headlight — round modern LED */}
              <ellipse cx="8" cy="16" rx="5" ry="3" fill="white" style={{animation:'headBlink 3s ease-in-out infinite'}}/>
              <ellipse cx="8" cy="16" rx="3" ry="1.8" fill="#fff8c4" opacity="0.9"/>
              {/* Lower marker light */}
              <ellipse cx="5" cy="34" rx="3" ry="2" fill="#ffd54f" opacity="0.75"/>
              {/* Destination display */}
              <rect x="20" y="5.5" width="22" height="5" rx="2" fill="#1a1a2e"/>
              <rect x="21" y="6" width="20" height="4" rx="1.5" fill="#ff8800" opacity="0.9"/>
              {/* Window surround 1 */}
              <rect x="40" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="42" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="62" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              {/* Door */}
              <rect x="88" y="13" width="20" height="22" rx="3" fill="#5068a0"/>
              <line x1="98" y1="13" x2="98" y2="35" stroke="#2a3a5e" strokeWidth="0.8"/>
              <rect x="94" y="23" width="8" height="2" rx="1" fill="#8098c0"/>
              {/* Window surround 2 */}
              <rect x="112" y="14" width="22" height="20" rx="4" fill="#5068a0"/>
              <rect x="114" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              {/* Bogies with wheels */}
              <rect x="20" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <circle cx="28" cy="48" r="2" fill="#333"/>
              <circle cx="42" cy="48" r="2" fill="#333"/>
              <rect x="96" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <circle cx="104" cy="48" r="2" fill="#333"/>
              <circle cx="118" cy="48" r="2" fill="#333"/>
              {/* Coupler */}
              <rect x="136" y="20" width="6" height="12" rx="3" fill="#7080a0"/>

              {/* CAR 2 — middle */}
              <rect x="142" y="4"  width="132" height="42" rx="2" fill="#f5f7fa"/>
              <rect x="142" y="4"  width="132" height="9"  rx="1" fill="#e8394a"/>
              <rect x="142" y="37" width="132" height="9"  rx="1" fill="#2a4a8c"/>
              <rect x="148" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="150" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="170" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="196" y="13" width="20" height="21" rx="3" fill="#5068a0"/>
              <line x1="206" y1="13" x2="206" y2="34" stroke="#2a3a5e" strokeWidth="1"/>
              <rect x="202" y="23" width="8" height="2" rx="1" fill="#5a6e98"/>
              <rect x="220" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="222" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="242" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="150" y="44" width="26" height="5" rx="2" fill="#1e2840"/>
              <rect x="238" y="44" width="26" height="5" rx="2" fill="#1e2840"/>
              <rect x="274" y="20" width="6" height="12" rx="3" fill="#7080a0"/>

              {/* CAR 3 — smooth aerodynamic rear */}
              {/* Body — smooth cubic bezier tail */}
              <path d="M280,4 L398,4 C406,4 412,10 412,18 L412,36 C412,40 410,46 406,46 L280,46 Z" fill="#f5f7fa"/>
              {/* Red top stripe — curved */}
              <path d="M280,4 L398,4 C404,4 408,8 396,12 L280,12 Z" fill="#e8394a"/>
              {/* Thin white accent */}
              <path d="M280,12 L398,12 L398,13.5 L280,13.5 Z" fill="white" opacity="0.5"/>
              {/* Navy bottom stripe — curved */}
              <path d="M280,38 L408,38 C410,42 410,46 406,46 L280,46 Z" fill="#2a4a8c"/>
              {/* Thin white accent */}
              <path d="M280,36.5 L408,36.5 L408,38 L280,38 Z" fill="white" opacity="0.4"/>
              {/* Rear windshield — curved glass */}
              <path d="M378,13.5 L406,13.5 C410,14 412,20 412,25 C412,30 410,36 406,36.5 L378,36.5 Z" fill="#4a6ea0" opacity="0.9"/>
              {/* Glass reflection */}
              <path d="M390,15 L400,15 C404,18 406,22 404,28 L394,28 Z" fill="white" opacity="0.15"/>
              {/* Glass divider */}
              <line x1="392" y1="13.5" x2="398" y2="36.5" stroke="#2a3a5e" strokeWidth="0.8" opacity="0.5"/>
              {/* Tail lights — red LED */}
              <ellipse cx="406" cy="16" rx="4" ry="2.5" fill="#ff3344" opacity="0.9"/>
              <ellipse cx="406" cy="16" rx="2.5" ry="1.5" fill="#ff6677"/>
              {/* Lower tail light */}
              <ellipse cx="408" cy="34" rx="3" ry="2" fill="#ff3344" opacity="0.75"/>
              {/* Destination display */}
              <rect x="370" y="5.5" width="22" height="5" rx="2" fill="#1a1a2e"/>
              <rect x="371" y="6" width="20" height="4" rx="1.5" fill="#ff8800" opacity="0.9"/>
              {/* Window surround 1 */}
              <rect x="285" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="287" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="307" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              {/* Door */}
              <rect x="333" y="13" width="20" height="22" rx="3" fill="#5068a0"/>
              <line x1="343" y1="13" x2="343" y2="35" stroke="#2a3a5e" strokeWidth="0.8"/>
              {/* Window surround 2 */}
              <rect x="357" y="14" width="18" height="20" rx="4" fill="#5068a0"/>
              <rect x="359" y="16" width="14" height="16" rx="3" fill="#9ab0d8"/>
              {/* Bogies with wheels */}
              <rect x="288" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <circle cx="296" cy="48" r="2" fill="#333"/>
              <circle cx="310" cy="48" r="2" fill="#333"/>
              <rect x="358" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <circle cx="366" cy="48" r="2" fill="#333"/>
              <circle cx="380" cy="48" r="2" fill="#333"/>
            </svg>
          </div>

          {/* ── SECOND TRAIN: right → left, same size ── */}
          <div className="bts-train-left" style={{
            position:'absolute', bottom: isMobile ? '28px' : '44px', left:0,
            animation:'trainLeft 22s linear infinite', animationDelay:'8s',
            animationFillMode:'backwards',
            willChange:'transform',
          }}>
            <svg width={isMobile ? "200" : "380"} height={isMobile ? "24" : "46"} viewBox="0 0 412 50">
              {/* Car 1 — smooth aerodynamic front (same as main train) */}
              <path d="M30,4 L136,4 L136,46 L6,46 C2,46 0,40 0,36 L0,18 C0,10 6,4 14,4 Z" fill="#f5f7fa"/>
              <path d="M30,4 L136,4 L136,12 L16,12 C10,12 6,8 14,4 Z" fill="#e8394a"/>
              <path d="M14,12 L136,12 L136,13.5 L14,13.5 Z" fill="white" opacity="0.5"/>
              <path d="M4,38 L136,38 L136,46 L6,46 C2,46 0,42 2,38 Z" fill="#2a4a8c"/>
              <path d="M3,36.5 L136,36.5 L136,38 L4,38 Z" fill="white" opacity="0.4"/>
              <path d="M18,13.5 L34,13.5 L34,36.5 L6,36.5 C2,36.5 1,30 1,25 C1,20 4,14 18,13.5 Z" fill="#4a6ea0" opacity="0.9"/>
              <path d="M16,15 L24,15 L18,28 L8,28 C6,28 5,24 8,18 Z" fill="white" opacity="0.15"/>
              <ellipse cx="8" cy="16" rx="5" ry="3" fill="white" opacity="0.9"/>
              <ellipse cx="5" cy="34" rx="3" ry="2" fill="#ffd54f" opacity="0.75"/>
              <rect x="20" y="5.5" width="22" height="5" rx="2" fill="#1a1a2e"/>
              <rect x="21" y="6" width="20" height="4" rx="1.5" fill="#ff8800" opacity="0.9"/>
              <rect x="40" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="42" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="62" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="88" y="13" width="20" height="22" rx="3" fill="#5068a0"/>
              <rect x="112" y="14" width="22" height="20" rx="4" fill="#5068a0"/>
              <rect x="114" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="20" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <rect x="96" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <rect x="136" y="20" width="6" height="12" rx="3" fill="#7080a0"/>
              {/* Car 2 */}
              <rect x="142" y="4"  width="132" height="42" rx="2" fill="#f5f7fa"/>
              <rect x="142" y="4"  width="132" height="9"  rx="1" fill="#e8394a"/>
              <rect x="142" y="37" width="132" height="9"  rx="1" fill="#2a4a8c"/>
              <rect x="148" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="150" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="170" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="196" y="13" width="20" height="22" rx="3" fill="#5068a0"/>
              <rect x="220" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="222" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="242" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="150" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <rect x="238" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <rect x="274" y="20" width="6" height="12" rx="3" fill="#7080a0"/>
              {/* Car 3 — smooth aerodynamic rear */}
              <path d="M280,4 L398,4 C406,4 412,10 412,18 L412,36 C412,40 410,46 406,46 L280,46 Z" fill="#f5f7fa"/>
              <path d="M280,4 L398,4 C404,4 408,8 396,12 L280,12 Z" fill="#e8394a"/>
              <path d="M280,12 L398,12 L398,13.5 L280,13.5 Z" fill="white" opacity="0.5"/>
              <path d="M280,38 L408,38 C410,42 410,46 406,46 L280,46 Z" fill="#2a4a8c"/>
              <path d="M280,36.5 L408,36.5 L408,38 L280,38 Z" fill="white" opacity="0.4"/>
              <path d="M378,13.5 L406,13.5 C410,14 412,20 412,25 C412,30 410,36 406,36.5 L378,36.5 Z" fill="#4a6ea0" opacity="0.9"/>
              <ellipse cx="406" cy="16" rx="4" ry="2.5" fill="#ff3344" opacity="0.9"/>
              <ellipse cx="408" cy="34" rx="3" ry="2" fill="#ff3344" opacity="0.75"/>
              <rect x="370" y="5.5" width="22" height="5" rx="2" fill="#1a1a2e"/>
              <rect x="371" y="6" width="20" height="4" rx="1.5" fill="#ff8800" opacity="0.9"/>
              <rect x="285" y="14" width="44" height="20" rx="4" fill="#5068a0"/>
              <rect x="287" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="307" y="16" width="18" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="333" y="13" width="20" height="22" rx="3" fill="#5068a0"/>
              <rect x="357" y="14" width="18" height="20" rx="4" fill="#5068a0"/>
              <rect x="359" y="16" width="14" height="16" rx="3" fill="#9ab0d8"/>
              <rect x="288" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
              <rect x="358" y="44" width="30" height="5" rx="2.5" fill="#1e2840"/>
            </svg>
          </div>

        </div>
      </header>
  );
}

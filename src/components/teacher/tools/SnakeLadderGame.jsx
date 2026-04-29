'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const FONT = "'Kanit','Noto Sans Thai',sans-serif";
const BG   = 'linear-gradient(160deg,#020918,#050f2a,#0a0520)';

// Board constants (must match route.js)
const SNAKES  = { 17:7, 54:34, 62:19, 64:60, 87:36, 93:73, 95:56, 99:78 };
const LADDERS = { 4:23, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91 };
const EVENTS  = { 3:true, 10:true, 15:true, 22:true, 25:true, 30:true, 35:true, 42:true, 45:true, 50:true, 55:true, 58:true, 60:true, 65:true, 70:true, 75:true, 80:true, 82:true, 88:true, 92:true };

// ── Theme Configuration ──────────────────────────────────────────────────────
const THEMES = {
  funpark: {
    label: '🎡 สวนสนุก', key: 'funpark',
    grad:   'linear-gradient(145deg,#ff6a00 0%,#ee0979 45%,#ffd700 100%)',
    overlayGrad: 'radial-gradient(ellipse at 30% 30%,rgba(255,215,0,0.35) 0%,transparent 60%)',
    cell1: '#fff8e1', cell2: '#ffe0b2',
    border: '#ff6a00', snakeColor: '#e53e3e', ladderColor: '#f59e0b',
    boardBg: 'linear-gradient(160deg,#fff8e1,#fff3cd)',
    particles: [
      {e:'⭐',x:12,y:10,s:22,d:0,  dr:2.5,a:'fpBounce'},
      {e:'🎈',x:72,y:7, s:24,d:0.5,dr:3,  a:'fpBounce'},
      {e:'✨',x:44,y:5, s:16,d:1,  dr:2.8,a:'sparkle'},
      {e:'🎠',x:7, y:55,s:22,d:0.8,dr:3.5,a:'fpBounce'},
      {e:'🎪',x:83,y:48,s:18,d:0.3,dr:2.2,a:'sway'},
      {e:'⭐',x:57,y:58,s:14,d:1.2,dr:2,  a:'sparkle'},
      {e:'🎢',x:32,y:30,s:30,d:0,  dr:0,  a:'none'},
    ],
    description: 'สีสันสดใส เกมสนุกเหมือนสวนสนุก',
  },
  snow: {
    label: '❄️ เมืองหิมะ', key: 'snow',
    grad:   'linear-gradient(160deg,#1a5fa8 0%,#2e86de 45%,#a8d8f0 100%)',
    overlayGrad: 'radial-gradient(ellipse at 70% 20%,rgba(255,255,255,0.4) 0%,transparent 55%)',
    cell1: '#e3f2fd', cell2: '#bbdefb',
    border: '#2e86de', snakeColor: '#1d4ed8', ladderColor: '#38bdf8',
    boardBg: 'linear-gradient(160deg,#e3f2fd,#dbeafe)',
    particles: [
      {e:'❄️',x:18,y:4, s:22,d:0,  dr:3,  a:'snowFall'},
      {e:'❄️',x:46,y:8, s:16,d:0.7,dr:3.5,a:'snowFall'},
      {e:'❄️',x:78,y:3, s:24,d:1.2,dr:2.8,a:'snowFall'},
      {e:'❄️',x:33,y:44,s:14,d:0.4,dr:4,  a:'snowFall'},
      {e:'❄️',x:66,y:50,s:20,d:1.8,dr:3.2,a:'snowFall'},
      {e:'⛄',x:54,y:54,s:28,d:0,  dr:0,  a:'none'},
    ],
    description: 'บรรยากาศหิมะ สีฟ้าสดชื่น',
  },
  japan: {
    label: '🏯 เมืองญี่ปุ่น', key: 'japan',
    grad:   'linear-gradient(145deg,#9d0059 0%,#e91e8c 45%,#ffd6ef 100%)',
    overlayGrad: 'radial-gradient(ellipse at 55% 25%,rgba(255,200,220,0.4) 0%,transparent 60%)',
    cell1: '#fce4ec', cell2: '#f8bbd0',
    border: '#e91e8c', snakeColor: '#be185d', ladderColor: '#f472b6',
    boardBg: 'linear-gradient(160deg,#fce4ec,#fbcfe8)',
    particles: [
      {e:'🌸',x:8, y:8, s:22,d:0,  dr:3,  a:'petalFall'},
      {e:'🌸',x:36,y:4, s:16,d:0.8,dr:3.8,a:'petalFall'},
      {e:'🌸',x:68,y:12,s:24,d:0.3,dr:2.8,a:'petalFall'},
      {e:'🌸',x:22,y:48,s:14,d:1.5,dr:4,  a:'petalFall'},
      {e:'🌸',x:85,y:45,s:20,d:0.6,dr:3.2,a:'petalFall'},
      {e:'⛩️',x:42,y:28,s:30,d:0,  dr:0,  a:'none'},
    ],
    description: 'ซากุระบาน บรรยากาศญี่ปุ่น',
  },
  forest: {
    label: '🌲 ป่าลึกลับ', key: 'forest',
    grad:   'linear-gradient(160deg,#071e14 0%,#1a5c3a 50%,#2d8a58 100%)',
    overlayGrad: 'radial-gradient(ellipse at 25% 70%,rgba(34,197,94,0.25) 0%,transparent 55%)',
    cell1: '#e8f5e9', cell2: '#c8e6c9',
    border: '#16a34a', snakeColor: '#166534', ladderColor: '#22c55e',
    boardBg: 'linear-gradient(160deg,#e8f5e9,#dcfce7)',
    particles: [
      {e:'✨',x:14,y:14,s:14,d:0,  dr:2,  a:'firefly'},
      {e:'✨',x:54,y:9, s:18,d:0.5,dr:2.5,a:'firefly'},
      {e:'✨',x:80,y:32,s:12,d:1,  dr:1.8,a:'firefly'},
      {e:'✨',x:28,y:52,s:14,d:0.8,dr:3,  a:'firefly'},
      {e:'✨',x:66,y:54,s:20,d:1.4,dr:2.2,a:'firefly'},
      {e:'🌙',x:76,y:7, s:24,d:0,  dr:5,  a:'moonSway'},
      {e:'🍄',x:14,y:58,s:22,d:0,  dr:0,  a:'none'},
    ],
    description: 'ป่ามนต์สเน่ห์ แสงหิ่งห้อย',
  },
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700;900&display=swap');
  * { box-sizing:border-box; }
  @keyframes fpBounce { 0%,100%{transform:translateY(0)scale(1)} 50%{transform:translateY(-16px)scale(1.18)} }
  @keyframes sparkle  { 0%,100%{opacity:0.2;transform:scale(0.6)rotate(0deg)} 50%{opacity:1;transform:scale(1.5)rotate(200deg)} }
  @keyframes sway     { 0%,100%{transform:translateX(0)rotate(-5deg)} 50%{transform:translateX(10px)rotate(8deg)} }
  @keyframes snowFall { 0%{transform:translateY(-20px)rotate(0deg);opacity:1} 100%{transform:translateY(100px)rotate(380deg);opacity:0.15} }
  @keyframes petalFall{ 0%{transform:translateY(-12px)translateX(0)rotate(0deg);opacity:1} 100%{transform:translateY(90px)translateX(16px)rotate(210deg);opacity:0.25} }
  @keyframes firefly  { 0%,100%{opacity:0.08;transform:scale(0.4)translateY(0)} 50%{opacity:1;transform:scale(1.7)translateY(-6px)} }
  @keyframes moonSway { 0%,100%{transform:rotate(-10deg)scale(1)} 50%{transform:rotate(10deg)scale(1.08)} }
  @keyframes confetti { 0%{transform:translateY(-30px)rotate(0deg);opacity:1} 100%{transform:translateY(110vh)rotate(800deg);opacity:0} }
  @keyframes cardBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
  @keyframes themeCardIn { from{opacity:0;transform:scale(0.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 12px currentColor} 50%{box-shadow:0 0 28px currentColor, 0 0 56px currentColor} }
  @keyframes selectPop { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1.04)} }
  @keyframes playerIn  { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse2    { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
  @keyframes diceAppear { from{opacity:0;transform:scale(0.6)rotate(-20deg)} to{opacity:1;transform:scale(1)rotate(0)} }
`;

// ── Board helpers ─────────────────────────────────────────────────────────────
const CELL = 62;

function squareToXY(n) {
  const idx = n - 1;
  const row = Math.floor(idx / 10);
  const col = idx % 10;
  const actualCol = row % 2 === 0 ? col : 9 - col;
  return { x: actualCol * CELL + CELL / 2, y: (9 - row) * CELL + CELL / 2 };
}

// ── Dice face ─────────────────────────────────────────────────────────────────
const DOT_POS = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,28],[72,28],[28,50],[72,50],[28,72],[72,72]],
};

function DiceFace({ value, size = 60, color = '#6366f1' }) {
  const dots = DOT_POS[value] || DOT_POS[1];
  const dr = size * 0.09;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display:'block' }}>
      <defs>
        <linearGradient id={`dg-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect x={2} y={2} width={96} height={96} rx={22} fill={color} />
      <rect x={2} y={2} width={96} height={96} rx={22} fill={`url(#dg-${value})`} />
      <rect x={6} y={6} width={50} height={42} rx={12} fill="rgba(255,255,255,0.12)" />
      <rect x={2} y={2} width={96} height={96} rx={22} fill="none"
        stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      {dots.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx+1} cy={cy+1} r={dr*100/size*0.88} fill="rgba(0,0,0,0.25)" />
          <circle cx={cx} cy={cy} r={dr*100/size*0.88} fill="#fff" opacity={0.96} />
        </g>
      ))}
    </svg>
  );
}

// ── Step sound (Web Audio API, soft tap) ──────────────────────────────────
function playStepSound() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(); const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(380, ac.currentTime);
    g.gain.setValueAtTime(0.05, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05);
    o.start(ac.currentTime); o.stop(ac.currentTime + 0.06);
    setTimeout(() => { try { ac.close(); } catch {} }, 200);
  } catch {}
}

// ── Animated step-by-step positions (one square per `interval` ms) ─────────
function useAnimatedPlayerPositions(players, interval = 200, onStep) {
  const [, forceRender] = useState(0);
  const displayRef = useRef({});
  const timerRef   = useRef(null);

  useEffect(() => {
    let initialized = false;
    players.forEach(p => {
      if (displayRef.current[p.id] === undefined) {
        displayRef.current[p.id] = p.position;
        initialized = true;
      }
    });
    if (initialized) forceRender(n => n + 1);

    const needsAnim = players.some(p => displayRef.current[p.id] !== p.position);
    if (!needsAnim || timerRef.current) return;

    const tick = () => {
      let stepped = false, stillAnimating = false;
      players.forEach(p => {
        const cur = displayRef.current[p.id];
        if (cur !== undefined && cur !== p.position) {
          const diff = Math.abs(p.position - cur);
          const stride = diff > 6 ? 2 : 1;
          const step = stride * (p.position > cur ? 1 : -1);
          let next = cur + step;
          if ((step > 0 && next > p.position) || (step < 0 && next < p.position)) next = p.position;
          displayRef.current[p.id] = next;
          stepped = true;
          if (next !== p.position) stillAnimating = true;
        }
      });
      if (stepped && onStep) onStep();
      forceRender(n => n + 1);
      if (stillAnimating) timerRef.current = setTimeout(tick, interval);
      else timerRef.current = null;
    };
    timerRef.current = setTimeout(tick, interval);
    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  }, [players, interval, onStep]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return displayRef.current;
}

// ── SVG Board ─────────────────────────────────────────────────────────────────
function SnakeAndLadderBoard({ players, theme, currentPlayerIdx = 0, onStep }) {
  const t = THEMES[theme] || THEMES.funpark;
  const size = CELL * 10;
  const animatedPositions = useAnimatedPlayerPositions(players, 200, onStep);

  // Build cells
  const cells = [];
  for (let dRow = 0; dRow < 10; dRow++) {
    for (let col = 0; col < 10; col++) {
      const boardRow = 9 - dRow;
      const actualCol = boardRow % 2 === 0 ? col : 9 - col;
      const n = boardRow * 10 + actualCol + 1;
      const x = col * CELL, y = dRow * CELL;
      const isEven      = (boardRow + actualCol) % 2 === 0;
      const isSnakeHead = SNAKES[n]  !== undefined;
      const isLadderBot = LADDERS[n] !== undefined;
      const isEvent     = EVENTS[n]  !== undefined;
      const isStart     = n === 1;
      const isEnd       = n === 100;

      let fill = isEven ? t.cell1 : t.cell2;
      if (isSnakeHead)  fill = 'rgba(239,68,68,0.22)';
      if (isLadderBot)  fill = 'rgba(34,197,94,0.22)';
      if (isEvent)      fill = 'rgba(251,191,36,0.25)';
      if (isStart)      fill = 'rgba(99,102,241,0.18)';
      if (isEnd)        fill = 'rgba(251,191,36,0.32)';

      cells.push({ n, x, y, fill, isSnakeHead, isLadderBot, isEvent, isStart, isEnd });
    }
  }

  // Snake elements — S-curve with gradient & snake head
  const snakeElems = Object.entries(SNAKES).map(([head, tail]) => {
    const hN = Number(head), tN = Number(tail);
    const h = squareToXY(hN), ta = squareToXY(tN);
    const dx = ta.x - h.x, dy = ta.y - h.y;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len * 22, py = dx / len * 22;
    const cx1 = h.x + dx * 0.28 + px, cy1 = h.y + dy * 0.28 + py;
    const cx2 = h.x + dx * 0.72 - px, cy2 = h.y + dy * 0.72 - py;
    const d = `M ${h.x} ${h.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ta.x} ${ta.y}`;
    const gId = `sg${hN}`;
    // Head direction for eyes (angle from h toward cx1)
    const hAngle = Math.atan2(cy1 - h.y, cx1 - h.x);
    const ex = Math.cos(hAngle + Math.PI) * 5;
    const ey = Math.sin(hAngle + Math.PI) * 5;
    const perp = hAngle + Math.PI / 2;
    const e1x = h.x + ex + Math.cos(perp) * 4;
    const e1y = h.y + ey + Math.sin(perp) * 4;
    const e2x = h.x + ex - Math.cos(perp) * 4;
    const e2y = h.y + ey - Math.sin(perp) * 4;
    const tongueDir = hAngle - Math.PI;
    const tx1 = h.x + Math.cos(tongueDir) * 10;
    const ty1 = h.y + Math.sin(tongueDir) * 10;
    const tk1x = tx1 + Math.cos(tongueDir + 0.5) * 6;
    const tk1y = ty1 + Math.sin(tongueDir + 0.5) * 6;
    const tk2x = tx1 + Math.cos(tongueDir - 0.5) * 6;
    const tk2y = ty1 + Math.sin(tongueDir - 0.5) * 6;
    return (
      <g key={`s${hN}`}>
        <defs>
          <linearGradient id={gId} gradientUnits="userSpaceOnUse"
            x1={h.x} y1={h.y} x2={ta.x} y2={ta.y}>
            <stop offset="0%"   stopColor={t.snakeColor} />
            <stop offset="100%" stopColor={t.snakeColor} stopOpacity="0.42" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <path d={d} stroke="rgba(0,0,0,0.22)" strokeWidth={14} fill="none"
          strokeLinecap="round" transform="translate(2,2)" />
        {/* Body */}
        <path d={d} stroke={`url(#${gId})`} strokeWidth={11} fill="none" strokeLinecap="round" />
        {/* Scale texture */}
        <path d={d} stroke="rgba(255,255,255,0.18)" strokeWidth={11} fill="none"
          strokeLinecap="round" strokeDasharray="3,9" />
        {/* Tongue */}
        <line x1={h.x} y1={h.y} x2={tx1} y2={ty1} stroke="#f87171" strokeWidth={1.8} />
        <line x1={tx1} y1={ty1} x2={tk1x} y2={tk1y} stroke="#f87171" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={tx1} y1={ty1} x2={tk2x} y2={tk2y} stroke="#f87171" strokeWidth={1.5} strokeLinecap="round" />
        {/* Head */}
        <ellipse cx={h.x} cy={h.y} rx={10} ry={8} fill={t.snakeColor}
          stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
        {/* Eyes */}
        <circle cx={e1x} cy={e1y} r={2.6} fill="#fff" />
        <circle cx={e2x} cy={e2y} r={2.6} fill="#fff" />
        <circle cx={e1x} cy={e1y} r={1.4} fill="#1a1a1a" />
        <circle cx={e2x} cy={e2y} r={1.4} fill="#1a1a1a" />
        <circle cx={e1x+0.5} cy={e1y-0.5} r={0.5} fill="#fff" />
        <circle cx={e2x+0.5} cy={e2y-0.5} r={0.5} fill="#fff" />
      </g>
    );
  });

  // Ladder elements — warm gold rails + rungs
  const ladderElems = Object.entries(LADDERS).map(([base, top]) => {
    const bN = Number(base), tpN = Number(top);
    const b = squareToXY(bN), tp = squareToXY(tpN);
    const dx = tp.x - b.x, dy = tp.y - b.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * 5.5, ny = dx / len * 5.5;
    const rungCount = Math.max(4, Math.round(len / 16));
    const lgId = `lg${bN}`;
    return (
      <g key={`l${bN}`}>
        <defs>
          <linearGradient id={lgId} gradientUnits="userSpaceOnUse"
            x1={b.x} y1={b.y} x2={tp.x} y2={tp.y}>
            <stop offset="0%"   stopColor={t.ladderColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={t.ladderColor} />
          </linearGradient>
        </defs>
        {/* Rail shadows */}
        <line x1={b.x+nx+1} y1={b.y+ny+1} x2={tp.x+nx+1} y2={tp.y+ny+1}
          stroke="rgba(0,0,0,0.2)" strokeWidth={5} strokeLinecap="round" />
        <line x1={b.x-nx+1} y1={b.y-ny+1} x2={tp.x-nx+1} y2={tp.y-ny+1}
          stroke="rgba(0,0,0,0.2)" strokeWidth={5} strokeLinecap="round" />
        {/* Rails */}
        <line x1={b.x+nx} y1={b.y+ny} x2={tp.x+nx} y2={tp.y+ny}
          stroke={`url(#${lgId})`} strokeWidth={4.5} strokeLinecap="round" />
        <line x1={b.x-nx} y1={b.y-ny} x2={tp.x-nx} y2={tp.y-ny}
          stroke={`url(#${lgId})`} strokeWidth={4.5} strokeLinecap="round" />
        {/* Rungs */}
        {Array.from({ length: rungCount - 1 }).map((_, i) => {
          const frac = (i + 1) / rungCount;
          const rx = b.x + dx * frac, ry = b.y + dy * frac;
          return (
            <line key={i}
              x1={rx+nx} y1={ry+ny} x2={rx-nx} y2={ry-ny}
              stroke={t.ladderColor} strokeWidth={3} strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
        {/* Top cap */}
        <circle cx={tp.x} cy={tp.y} r={7.5} fill={t.ladderColor}
          stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
        <text x={tp.x} y={tp.y+1} textAnchor="middle" dominantBaseline="middle" fontSize={9}>🪜</text>
      </g>
    );
  });

  // Player tokens — group by ANIMATED position
  const posBySquare = {};
  (players || []).forEach(p => {
    const pos = animatedPositions[p.id] ?? p.position;
    if (!posBySquare[pos]) posBySquare[pos] = [];
    posBySquare[pos].push(p);
  });

  const tokens = [];
  Object.entries(posBySquare).forEach(([sq, ps]) => {
    const n = Number(sq);
    if (n < 1) return;
    const center = squareToXY(n);
    ps.forEach((p, i) => {
      const count = ps.length;
      const angle = (i / count) * Math.PI * 2;
      const offR = count > 1 ? 9 : 0;
      const cx = center.x + Math.cos(angle) * offR;
      const cy = center.y + Math.sin(angle) * offR;
      const isCurrent = players.indexOf(p) === currentPlayerIdx;
      tokens.push(
        <g key={`tk-${p.id}`}>
          {/* Ground shadow ellipse */}
          <ellipse cx={cx} cy={cy + 9} rx={11} ry={3} fill="rgba(0,0,0,0.35)" />
          {/* Glow ring for current player */}
          {isCurrent && (
            <circle cx={cx} cy={cy} r={18} fill="none" stroke={p.color} strokeWidth={2.5} opacity={0.4}>
              <animate attributeName="r" values="16;24;16" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.05;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}
          {/* Token group with bounce animation if current */}
          <g>
            {isCurrent && (
              <animateTransform attributeName="transform" type="translate"
                values="0 0; 0 -4; 0 0" dur="0.9s" repeatCount="indefinite" />
            )}
            {/* Token base shadow */}
            <circle cx={cx+0.5} cy={cy+1} r={13} fill="rgba(0,0,0,0.4)" />
            {/* Token */}
            <circle cx={cx} cy={cy} r={13} fill={p.color}
              stroke="#fff" strokeWidth={isCurrent ? 2.5 : 1.5} opacity={1} />
            {/* Highlight (top-left shine) */}
            <ellipse cx={cx-3} cy={cy-3} rx={4} ry={3} fill="rgba(255,255,255,0.4)" />
            {/* Avatar */}
            <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" fontSize={14}
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
              {p.avatar}
            </text>
          </g>
        </g>
      );
    });
  });

  return (
    <div style={{
      perspective: '1400px',
      perspectiveOrigin: '50% 30%',
      padding: '8px 0',
      width: 'fit-content',
      maxWidth: '100%',
      margin: '0 auto',
    }}>
      <div style={{
        transform: 'rotateX(18deg) rotateZ(-1deg)',
        transformStyle: 'preserve-3d',
        filter: `drop-shadow(0 18px 18px rgba(0,0,0,0.55)) drop-shadow(0 0 32px ${t.border}44)`,
        borderRadius: 14,
      }}>
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        borderRadius: 14, border: `2.5px solid ${t.border}`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.15)`,
        background: t.boardBg,
        maxWidth: '100%', display: 'block',
      }}
    >
      <defs>
        {/* Cell depth gradient */}
        <linearGradient id="cellShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="rgba(255,255,255,0.35)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.10)" />
        </linearGradient>
        {/* Event sparkle gradient */}
        <radialGradient id="eventGlow">
          <stop offset="0%" stopColor="rgba(251,191,36,0.6)" />
          <stop offset="100%" stopColor="rgba(251,191,36,0)" />
        </radialGradient>
      </defs>

      {/* Grid with depth */}
      {cells.map(cell => (
        <g key={cell.n}>
          {/* Cell base */}
          <rect x={cell.x} y={cell.y} width={CELL} height={CELL}
            fill={cell.fill} stroke="rgba(0,0,0,0.12)" strokeWidth={0.5} rx={1.5} />
          {/* Depth shine (top to bottom) */}
          <rect x={cell.x} y={cell.y} width={CELL} height={CELL}
            fill="url(#cellShine)" rx={1.5} pointerEvents="none" />
          {/* Number */}
          <text x={cell.x+3} y={cell.y+10} fontSize={7.5} fill="rgba(0,0,0,0.4)"
            fontFamily={FONT} fontWeight={700}>{cell.n}</text>
          {/* Special icons */}
          {cell.isStart && (
            <text x={cell.x+CELL/2} y={cell.y+CELL/2+8} textAnchor="middle" fontSize={18}>
              🏁
            </text>
          )}
          {cell.isEnd && (
            <g>
              <circle cx={cell.x+CELL/2} cy={cell.y+CELL/2} r={CELL*0.45}
                fill="url(#eventGlow)">
                <animate attributeName="r" values={`${CELL*0.4};${CELL*0.55};${CELL*0.4}`} dur="2s" repeatCount="indefinite" />
              </circle>
              <text x={cell.x+CELL/2} y={cell.y+CELL/2+8} textAnchor="middle" fontSize={20}>🏆</text>
            </g>
          )}
          {cell.isEvent && !cell.isStart && !cell.isEnd && (
            <g>
              <circle cx={cell.x+CELL/2} cy={cell.y+CELL/2} r={CELL*0.32}
                fill="url(#eventGlow)" opacity={0.5}>
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <text x={cell.x+CELL/2} y={cell.y+CELL/2+5} textAnchor="middle" fontSize={14}>
                ❓
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Ladders with shimmer */}
      <g>
        {ladderElems}
      </g>

      {/* Snakes with subtle slither */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -1.2; 0 0; 0 1.2; 0 0" dur="3.2s" repeatCount="indefinite" />
        {snakeElems}
      </g>

      {/* Player tokens */}
      {tokens}
    </svg>
      </div>
    </div>
  );
}

// ── Animated Theme Card ───────────────────────────────────────────────────────
function ThemeCard({ th, isSelected, onClick, animDelay = 0 }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: 22, overflow: 'hidden',
        cursor: 'pointer', height: 144,
        border: `2.5px solid ${isSelected ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.1)'}`,
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: isSelected
          ? `0 12px 48px ${th.border}99, 0 0 0 4px ${th.border}33`
          : '0 6px 28px rgba(0,0,0,0.45)',
        animation: `themeCardIn 0.5s ${animDelay}s ease both`,
      }}
    >
      {/* Gradient background */}
      <div style={{ position:'absolute', inset:0, background: th.grad }} />
      {/* Radial overlay for depth */}
      <div style={{ position:'absolute', inset:0, background: th.overlayGrad }} />

      {/* Particles */}
      {th.particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          fontSize: p.s, lineHeight: 1, pointerEvents: 'none', zIndex: 1,
          animation: p.a === 'none' ? 'none' : `${p.a} ${p.dr}s ${p.d}s ease-in-out infinite`,
          filter: p.a === 'firefly' ? 'brightness(2) saturate(1.5)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}>
          {p.e}
        </div>
      ))}

      {/* Shine effect on hover */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 50%)',
          borderRadius: 20,
        }} />
      )}

      {/* Bottom gradient for text */}
      <div style={{
        position: 'absolute', bottom:0, left:0, right:0, height:'65%',
        background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 60%,transparent 100%)',
        zIndex: 3,
      }} />

      {/* Selected check */}
      {isSelected && (
        <div style={{
          position:'absolute', top:12, right:12, zIndex:5,
          background:'#fff', borderRadius:'50%',
          width:26, height:26,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:14, fontWeight:900, color:'#16a34a',
          boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
          animation:'selectPop 0.35s ease',
        }}>✓</div>
      )}

      {/* Label + description */}
      <div style={{ position:'absolute', bottom:12, left:14, right:14, zIndex:4 }}>
        <div style={{
          fontSize:19, fontWeight:900, color:'#fff',
          fontFamily:FONT, textShadow:'0 2px 10px rgba(0,0,0,0.6)',
          lineHeight:1.2, marginBottom:3,
        }}>
          {th.label}
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontFamily:FONT }}>
          {th.description}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SnakeLadderGame() {
  const [lang,       setLang]       = useState('th');
  const [phase,      setPhase]      = useState('theme');
  const [theme,      setTheme]      = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [roomCode,   setRoomCode]   = useState('');
  const [session,    setSession]    = useState(null);
  const [creating,   setCreating]   = useState(false);
  const [starting,   setStarting]   = useState(false);
  const [error,      setError]      = useState('');
  const pollRef = useRef(null);

  const T = {
    th: {
      title: 'บันไดงู', subtitle: 'Snake & Ladder Multiplayer',
      pickTheme: 'เลือกธีมโลกเกม', createRoom: 'สร้างห้องเกม',
      creating: 'กำลังสร้าง…', startGame: 'เริ่มเกม',
      starting: 'กำลังเริ่ม…',
      waitPlayers: (n) => `รอผู้เล่ม (${n}/2 ขึ้นไป)`,
      players: 'ผู้เล่ม', scanQR: 'สแกน QR เพื่อเข้าเกม',
      waitingFor: 'รอผู้เล่มเข้าร่วม…',
      currentTurn: 'ถึงตา', position: 'ตำแหน่ง', lastResult: 'ผลล่าสุด',
      winner: 'ผู้ชนะ!', newGame: 'เกมใหม่', endGame: 'จบเกม',
      legend: ['🐍 งู = ตกลง','🪜 บันได = ขึ้น','🎯 ถึง 100 = ชนะ'],
      log: 'บันทึกเกม', maxPlayersLabel: 'ผู้เล่มสูงสุด',
    },
    en: {
      title: 'Snake & Ladder', subtitle: 'Multiplayer Board Game',
      pickTheme: 'Choose Game Theme', createRoom: 'Create Room',
      creating: 'Creating…', startGame: 'Start Game',
      starting: 'Starting…',
      waitPlayers: (n) => `Waiting (${n}/2+)`,
      players: 'Players', scanQR: 'Scan QR to join',
      waitingFor: 'Waiting for players…',
      currentTurn: "Turn:", position: 'Position', lastResult: 'Last Roll',
      winner: 'Winner!', newGame: 'New Game', endGame: 'End Game',
      legend: ['🐍 Snake = slide down','🪜 Ladder = climb up','🎯 100 = win'],
      log: 'Game Log', maxPlayersLabel: 'Max players',
    },
  };
  const tx = T[lang];

  // ── Poll ──────────────────────────────────────────────────────────────────
  const poll = useCallback(async (code) => {
    try {
      const res  = await fetch(`/api/teacher/snakelad?code=${code}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        if (data.session.phase === 'playing')  setPhase('playing');
        if (data.session.phase === 'finished') setPhase('finished');
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    pollRef.current = setInterval(() => poll(roomCode), 2000);
    return () => clearInterval(pollRef.current);
  }, [roomCode, poll]);

  // ── Create room ───────────────────────────────────────────────────────────
  const createRoom = async () => {
    if (!theme) return;
    setCreating(true); setError('');
    try {
      const res  = await fetch('/api/teacher/snakelad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', theme, maxPlayers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRoomCode(data.code); setSession(data.session); setPhase('lobby');
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  };

  const startGame = async () => {
    setStarting(true); setError('');
    try {
      const res  = await fetch('/api/teacher/snakelad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', code: roomCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSession(data.session); setPhase('playing');
    } catch (e) { setError(e.message); }
    finally { setStarting(false); }
  };

  const resetGame = async () => {
    try {
      const res  = await fetch('/api/teacher/snakelad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', code: roomCode }),
      });
      const data = await res.json();
      if (res.ok && data.session) { setSession(data.session); setPhase('lobby'); }
    } catch { /* ignore */ }
  };

  const studentUrl = typeof window !== 'undefined' && roomCode
    ? `${window.location.origin}/student/snakelad?code=${roomCode}` : '';
  const qrUrl = studentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(studentUrl)}` : '';

  const players   = session?.players || [];
  const curIdx    = session?.currentPlayerIdx ?? 0;
  const curPlayer = players[curIdx] || null;
  const curTheme  = THEMES[session?.theme || theme || 'funpark'];

  // Confetti positions (memoised — fixed per mount)
  const confetti = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      left:  `${(i * 37 + 5) % 100}%`,
      delay: `${(i * 0.17) % 3}s`,
      dur:   `${2.5 + (i * 0.23) % 2}s`,
      color: ['#FF6B9D','#FFD93D','#6BCB77','#4D96FF','#FF6B6B','#C77DFF','#fbbf24'][i % 7],
      shape: i % 3 === 0 ? '50%' : '0',
    })),
    []
  );

  const LangBtn = () => (
    <button onClick={() => setLang(l => l === 'th' ? 'en' : 'th')} style={{
      position:'fixed', top:12, right:16, zIndex:100,
      padding:'4px 14px', borderRadius:20,
      border:'1px solid rgba(255,255,255,0.2)',
      background:'rgba(0,0,0,0.45)', color:'#fff',
      fontSize:12, cursor:'pointer', fontFamily:FONT,
      backdropFilter:'blur(10px)',
    }}>
      {lang === 'th' ? 'EN' : 'ไทย'}
    </button>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // THEME SELECTION
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'theme') {
    return (
      <div style={{ fontFamily:FONT, background:BG, minHeight:'100vh', padding:'28px 20px', color:'#fff' }}>
        <style>{GLOBAL_CSS}</style>
        <LangBtn />
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          {/* Hero */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{
              fontSize:72, marginBottom:10,
              filter:'drop-shadow(0 0 24px rgba(99,102,241,0.6))',
              animation:'fpBounce 3s ease infinite',
            }}>🎲</div>
            <h1 style={{ margin:'0 0 6px', fontSize:36, fontWeight:900, letterSpacing:1 }}>
              {tx.title}
            </h1>
            <p style={{ color:'rgba(165,180,252,0.55)', fontSize:13, margin:0, letterSpacing:4 }}>
              {tx.subtitle.toUpperCase()}
            </p>
          </div>

          <div style={{
            textAlign:'center', fontSize:16, fontWeight:700,
            color:'rgba(255,255,255,0.55)', marginBottom:20,
          }}>
            ✦ {tx.pickTheme} ✦
          </div>

          {/* Theme cards — 2×2 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:28 }}>
            {Object.values(THEMES).map((th, i) => (
              <ThemeCard
                key={th.key}
                th={th}
                isSelected={theme === th.key}
                onClick={() => setTheme(th.key)}
                animDelay={i * 0.08}
              />
            ))}
          </div>

          {/* Max players */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:14,
            marginBottom:24,
          }}>
            <span style={{ color:'rgba(255,255,255,0.45)', fontSize:14, fontWeight:700 }}>
              {tx.maxPlayersLabel}
            </span>
            <button onClick={() => setMaxPlayers(n => Math.max(2, n - 1))} style={{
              width:38, height:38, borderRadius:'50%',
              border:'1px solid rgba(255,255,255,0.2)',
              background:'rgba(255,255,255,0.08)', color:'#fff',
              fontSize:22, fontWeight:900, cursor:'pointer', fontFamily:FONT,
            }}>−</button>
            <span style={{ fontSize:30, fontWeight:900, color:'#a5b4fc', minWidth:44, textAlign:'center' }}>
              {maxPlayers}
            </span>
            <button onClick={() => setMaxPlayers(n => Math.min(50, n + 1))} style={{
              width:38, height:38, borderRadius:'50%',
              border:'1px solid rgba(255,255,255,0.2)',
              background:'rgba(255,255,255,0.08)', color:'#fff',
              fontSize:22, fontWeight:900, cursor:'pointer', fontFamily:FONT,
            }}>+</button>
          </div>

          {error && (
            <div style={{ textAlign:'center', color:'#f87171', fontSize:14, marginBottom:14 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ textAlign:'center' }}>
            <button
              onClick={createRoom}
              disabled={!theme || creating}
              style={{
                padding:'17px 56px', borderRadius:16, border:'none',
                background: theme && !creating
                  ? `linear-gradient(135deg,${curTheme.border},${curTheme.border}cc)`
                  : 'rgba(255,255,255,0.07)',
                color: theme && !creating ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize:19, fontWeight:900, cursor: theme && !creating ? 'pointer' : 'not-allowed',
                fontFamily:FONT,
                boxShadow: theme && !creating ? `0 0 40px ${curTheme.border}55` : 'none',
                transition:'all 0.3s',
              }}
            >
              {creating ? tx.creating : `🎲 ${tx.createRoom}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <div style={{ fontFamily:FONT, background:BG, minHeight:'100vh', padding:'28px 20px', color:'#fff' }}>
        <style>{GLOBAL_CSS}</style>
        <LangBtn />
        <div style={{ maxWidth:820, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:44, marginBottom:6 }}>🎲</div>
            <h1 style={{ margin:'0 0 8px', fontSize:26, fontWeight:900 }}>{tx.title}</h1>
            {/* Theme badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background: curTheme.grad, borderRadius:24,
              padding:'5px 18px', fontSize:13, fontWeight:700, marginBottom:4,
            }}>
              <span>{curTheme.label}</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center' }}>
            {/* QR panel */}
            <div style={{
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:22, padding:'26px', textAlign:'center', minWidth:240, flex:'0 0 auto',
            }}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:10,
                background:'rgba(99,102,241,0.22)', border:'1px solid rgba(99,102,241,0.5)',
                borderRadius:14, padding:'8px 22px', marginBottom:18,
              }}>
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11, letterSpacing:2 }}>CODE</span>
                <span style={{ color:'#a5b4fc', fontFamily:'monospace', letterSpacing:7, fontWeight:900, fontSize:26 }}>
                  {roomCode}
                </span>
              </div>
              {qrUrl && (
                <div style={{ marginBottom:14 }}>
                  <img src={qrUrl} alt="QR" style={{
                    display:'block', margin:'0 auto', borderRadius:12,
                    background:'#fff', padding:8, width:190, height:190,
                  }} />
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:'8px 0 0' }}>{tx.scanQR}</p>
                </div>
              )}
              <div style={{
                background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'6px 10px',
                fontSize:10, color:'rgba(255,255,255,0.25)', wordBreak:'break-all', marginBottom:16, textAlign:'left',
              }}>{studentUrl}</div>
              {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:10 }}>⚠️ {error}</div>}
              <button
                onClick={startGame}
                disabled={players.length < 2 || starting}
                style={{
                  width:'100%', padding:'14px', borderRadius:12, border:'none',
                  background: players.length >= 2 && !starting
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : 'rgba(255,255,255,0.07)',
                  color: players.length >= 2 && !starting ? '#fff' : 'rgba(255,255,255,0.25)',
                  fontSize:16, fontWeight:900,
                  cursor: players.length >= 2 && !starting ? 'pointer' : 'not-allowed',
                  fontFamily:FONT, marginBottom:8,
                }}
              >
                {starting ? tx.starting : players.length >= 2 ? `▶ ${tx.startGame}` : tx.waitPlayers(players.length)}
              </button>
              <button
                onClick={() => { setPhase('theme'); setRoomCode(''); setSession(null); clearInterval(pollRef.current); }}
                style={{
                  width:'100%', padding:'8px', borderRadius:8,
                  border:'1px solid rgba(239,68,68,0.3)',
                  background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)',
                  fontSize:13, cursor:'pointer', fontFamily:FONT,
                }}
              >← กลับ</button>
            </div>

            {/* Players panel */}
            <div style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:22, padding:'22px', flex:1, minWidth:220,
            }}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800, color:'rgba(255,255,255,0.65)' }}>
                {tx.players} ({players.length})
              </h3>
              {players.length === 0 ? (
                <div style={{ color:'rgba(255,255,255,0.22)', fontSize:14, textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:30, marginBottom:8 }}>⏳</div>
                  {tx.waitingFor}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {players.map((p, i) => (
                    <div key={p.id} style={{
                      display:'flex', alignItems:'center', gap:10,
                      background:'rgba(255,255,255,0.04)',
                      borderRadius:12, padding:'11px 14px',
                      border:`1px solid ${p.color}40`,
                      animation:`playerIn 0.4s ${i*0.07}s ease both`,
                    }}>
                      <span style={{ fontSize:20 }}>{p.avatar}</span>
                      <div style={{ width:11, height:11, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                      <span style={{ color:'#fff', fontWeight:700, flex:1, fontSize:14 }}>{p.name}</span>
                      <span style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>#{i+1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FINISHED
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'finished' && session) {
    const winnerName   = session.winner;
    const winnerPlayer = players.find(p => p.name === winnerName) || players.find(p => p.position === 100);
    return (
      <div style={{
        fontFamily:FONT, background:BG, minHeight:'100vh',
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', color:'#fff', padding:24,
      }}>
        <style>{GLOBAL_CSS}</style>
        <LangBtn />
        {confetti.map((c, i) => (
          <div key={i} style={{
            position:'fixed', left:c.left, top:'-30px',
            width:10, height:10, borderRadius:c.shape,
            background:c.color,
            animation:`confetti ${c.dur} ${c.delay} linear infinite`,
            zIndex:0,
          }} />
        ))}
        <div style={{
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(99,102,241,0.4)',
          borderRadius:28, padding:'40px 32px', maxWidth:440, textAlign:'center',
          position:'relative', zIndex:1,
        }}>
          <div style={{ fontSize:80, animation:'cardBounce 1s ease infinite', marginBottom:14 }}>🏆</div>
          <h2 style={{ margin:'0 0 10px', fontSize:30, fontWeight:900 }}>{tx.winner}</h2>
          {winnerPlayer && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:24 }}>
              <span style={{ fontSize:26 }}>{winnerPlayer.avatar}</span>
              <span style={{ fontSize:24, fontWeight:900, color:winnerPlayer.color }}>{winnerPlayer.name}</span>
            </div>
          )}
          <div style={{
            background:'rgba(0,0,0,0.22)', borderRadius:14, padding:14, marginBottom:22, textAlign:'left',
          }}>
            {[...players].sort((a,b)=>b.position-a.position).map((p,i)=>(
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                borderBottom: i < players.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.4)', width:20, textAlign:'center' }}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                </span>
                <span style={{ fontSize:18 }}>{p.avatar}</span>
                <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                <span style={{
                  flex:1, fontSize:14,
                  color:p.name===winnerName?p.color:'rgba(255,255,255,0.7)',
                  fontWeight:p.name===winnerName?900:500,
                }}>{p.name}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>ช่อง {p.position}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={resetGame} style={{
              padding:14, borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color:'#fff', fontSize:16, fontWeight:900, cursor:'pointer', fontFamily:FONT,
            }}>🎲 {tx.newGame}</button>
            <button onClick={() => { setPhase('theme'); setRoomCode(''); setSession(null); clearInterval(pollRef.current); }} style={{
              padding:10, borderRadius:10, border:'1px solid rgba(239,68,68,0.3)',
              background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)',
              fontSize:13, cursor:'pointer', fontFamily:FONT,
            }}>ออกเกม</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAYING
  // ══════════════════════════════════════════════════════════════════════════
  const lastEvent = session?.lastEvent;
  const lastRoll  = session?.lastRoll;
  const log       = session?.log || [];

  const eventColor = () => {
    if (!lastEvent) return '#a5b4fc';
    if (lastEvent.type === 'snake')      return '#ef4444';
    if (lastEvent.type === 'ladder')     return '#22c55e';
    if (lastEvent.type === 'win')        return '#fbbf24';
    if (lastEvent.type === 'extra_roll') return '#f59e0b';
    return '#a5b4fc';
  };

  return (
    <div style={{
      fontFamily:FONT, background:BG, minHeight:'100vh',
      display:'flex', flexDirection:'column', color:'#fff',
      padding:12, overflow:'hidden',
    }}>
      <style>{GLOBAL_CSS}</style>
      <LangBtn />

      {/* Top bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:10, flexShrink:0, flexWrap:'wrap', gap:8,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🎲</span>
          <span style={{ fontWeight:900, fontSize:18 }}>{tx.title}</span>
          <div style={{
            background: curTheme.grad, borderRadius:20,
            padding:'2px 14px', fontSize:12, fontWeight:700,
          }}>{curTheme.label}</div>
          <div style={{
            background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.4)',
            borderRadius:8, padding:'2px 10px',
            fontFamily:'monospace', letterSpacing:2, fontSize:14, color:'#a5b4fc',
          }}>{roomCode}</div>
        </div>
        <button
          onClick={() => { clearInterval(pollRef.current); setPhase('theme'); setRoomCode(''); setSession(null); }}
          style={{
            padding:'6px 14px', borderRadius:8,
            border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)',
            color:'rgba(239,68,68,0.7)', fontSize:12, cursor:'pointer', fontFamily:FONT,
          }}
        >{tx.endGame}</button>
      </div>

      {/* Main layout */}
      <div style={{ display:'flex', gap:14, flex:1, minHeight:0, alignItems:'flex-start' }}>
        {/* Board */}
        <div style={{ flex:'0 0 60%', maxWidth:'60%', display:'flex', justifyContent:'center' }}>
          <SnakeAndLadderBoard
            players={players}
            theme={session?.theme || 'funpark'}
            currentPlayerIdx={curIdx}
            onStep={playStepSound}
          />
        </div>

        {/* Side panel */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minWidth:0, overflow:'auto', maxHeight:'calc(100vh - 80px)' }}>

          {curPlayer && (
            <div style={{
              background:`${curPlayer.color}1e`,
              border:`2px solid ${curPlayer.color}88`,
              borderRadius:14, padding:'11px 14px', textAlign:'center',
            }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>{tx.currentTurn}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>{curPlayer.avatar}</span>
                <span style={{ fontWeight:900, fontSize:18, color:curPlayer.color }}>{curPlayer.name}</span>
              </div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:3 }}>
                {tx.position} {curPlayer.position}
              </div>
            </div>
          )}

          {(lastRoll || lastEvent) && (
            <div style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12, padding:'12px 14px', textAlign:'center',
              animation:'diceAppear 0.3s ease',
            }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>{tx.lastResult}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                {lastRoll && <DiceFace value={lastRoll} size={52} color={eventColor()} />}
                <div>
                  {lastRoll && (
                    <div style={{ fontSize:22, fontWeight:900, color:eventColor() }}>{lastRoll}</div>
                  )}
                  {lastEvent?.msg && (
                    <div style={{ fontSize:13, fontWeight:700, color:eventColor() }}>{lastEvent.msg}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Player list */}
          <div style={{
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:12, padding:'10px 12px',
          }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>
              {tx.players} ({players.length})
            </div>
            {players.map((p, i) => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:8, padding:'7px 8px',
                borderRadius:8, marginBottom:4,
                background: i===curIdx ? `${p.color}18` : 'transparent',
                border: i===curIdx ? `1px solid ${p.color}55` : '1px solid transparent',
              }}>
                <span style={{ fontSize:16 }}>{p.avatar}</span>
                <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13, fontWeight:i===curIdx?800:500, color:i===curIdx?'#fff':'rgba(255,255,255,0.6)' }}>
                  {p.name}
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                  {p.position===0?'START':`ช่อง ${p.position}`}
                </span>
                {i===curIdx && <span style={{ fontSize:10, color:p.color }}>▶</span>}
              </div>
            ))}
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div style={{
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
              borderRadius:12, padding:'10px 12px', maxHeight:160, overflow:'auto',
            }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginBottom:7 }}>{tx.log}</div>
              {log.slice(0,14).map((e, i) => (
                <div key={i} style={{
                  fontSize:12, color:'rgba(255,255,255,0.5)', padding:'3px 0',
                  borderBottom: i < Math.min(log.length,14)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ color:'rgba(255,255,255,0.75)', fontWeight:700 }}>{e.player}</span>
                  {' '}ทอย {e.roll} → ช่อง {e.toPos}
                  {e.event && <span style={{ color:'#fbbf24', marginLeft:6 }}>{e.event}</span>}
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', lineHeight:2 }}>
            {tx.legend.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

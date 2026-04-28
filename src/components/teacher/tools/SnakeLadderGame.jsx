'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const FONT  = "'Kanit','Noto Sans Thai',sans-serif";
const BG    = 'linear-gradient(160deg,#020918,#050f2a,#0a0520)';

// Board constants (must match route.js)
const SNAKES  = { 17:7, 54:34, 62:19, 64:60, 87:36, 93:73, 95:56, 99:78 };
const LADDERS = { 4:23, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91 };
const EVENTS  = { 10:true, 25:true, 45:true, 60:true, 75:true, 88:true };

const THEMES = {
  funpark: {
    label:  '🎡 สวนสนุก',
    key:    'funpark',
    grad:   'linear-gradient(135deg,#FFD93D,#FF6B9D)',
    cell1:  '#FFF9C4',
    cell2:  '#FFCCBC',
    border: '#FFD93D',
  },
  snow: {
    label:  '❄️ เมืองหิมะ',
    key:    'snow',
    grad:   'linear-gradient(135deg,#74b9ff,#dfe6e9)',
    cell1:  '#E3F2FD',
    cell2:  '#BBDEFB',
    border: '#74b9ff',
  },
  japan: {
    label:  '🏯 เมืองญี่ปุ่น',
    key:    'japan',
    grad:   'linear-gradient(135deg,#fd79a8,#e17055)',
    cell1:  '#FCE4EC',
    cell2:  '#F8BBD0',
    border: '#fd79a8',
  },
  forest: {
    label:  '🌲 ป่าลึกลับ',
    key:    'forest',
    grad:   'linear-gradient(135deg,#00b894,#1e3c2f)',
    cell1:  '#E8F5E9',
    cell2:  '#C8E6C9',
    border: '#00b894',
  },
};

// ── Board helpers ─────────────────────────────────────────────────────────────
const CELL = 56; // px per cell

function squareToXY(n) {
  const idx  = n - 1;
  const row  = Math.floor(idx / 10);
  const col  = idx % 10;
  const actualCol = row % 2 === 0 ? col : 9 - col;
  return { x: actualCol * CELL + CELL / 2, y: (9 - row) * CELL + CELL / 2 };
}

// ── SVG Board ─────────────────────────────────────────────────────────────────
function SnakeAndLadderBoard({ players, theme }) {
  const t = THEMES[theme] || THEMES.funpark;
  const size = CELL * 10; // 560

  // Build grid cells (row top-to-bottom, col left-to-right)
  const cells = [];
  for (let displayRow = 0; displayRow < 10; displayRow++) {
    for (let col = 0; col < 10; col++) {
      // displayRow 0 = top row visually = boardRow 9
      const boardRow = 9 - displayRow;
      const actualCol = boardRow % 2 === 0 ? col : 9 - col;
      const n = boardRow * 10 + actualCol + 1;
      const x = col * CELL;
      const y = displayRow * CELL;
      const isEven = (boardRow + actualCol) % 2 === 0;
      const isSnakeHead  = SNAKES[n]  !== undefined;
      const isLadderBase = LADDERS[n] !== undefined;
      const isEvent      = EVENTS[n]  !== undefined;
      const isStart      = n === 1;
      const isEnd        = n === 100;

      let fill = isEven ? t.cell1 : t.cell2;
      if (isSnakeHead)  fill = 'rgba(239,68,68,0.25)';
      if (isLadderBase) fill = 'rgba(34,197,94,0.25)';
      if (isEvent)      fill = 'rgba(251,191,36,0.30)';
      if (isStart)      fill = 'rgba(99,102,241,0.20)';
      if (isEnd)        fill = 'rgba(251,191,36,0.35)';

      cells.push({ n, x, y, fill, isSnakeHead, isLadderBase, isEvent, isStart, isEnd });
    }
  }

  // Snake curves (quadratic bezier from head to tail)
  const snakeElems = Object.entries(SNAKES).map(([head, tail]) => {
    const h = squareToXY(Number(head));
    const t2 = squareToXY(Number(tail));
    const mx = (h.x + t2.x) / 2 + 28;
    const my = (h.y + t2.y) / 2;
    return (
      <g key={`snake-${head}`}>
        <path
          d={`M ${h.x} ${h.y} Q ${mx} ${my} ${t2.x} ${t2.y}`}
          stroke="#ef4444"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          opacity={0.75}
        />
        {/* head circle */}
        <circle cx={h.x} cy={h.y} r={7} fill="#ef4444" opacity={0.9} />
        <text x={h.x} y={h.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#fff">🐍</text>
      </g>
    );
  });

  // Ladder lines (green thick from base to top)
  const ladderElems = Object.entries(LADDERS).map(([base, top]) => {
    const b = squareToXY(Number(base));
    const tp = squareToXY(Number(top));
    const dx = (tp.x - b.x);
    const dy = (tp.y - b.y);
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * 5;
    const ny = dx / len * 5;
    // Two rails + rungs
    const railCount = Math.max(3, Math.round(len / 20));
    const rungs = [];
    for (let i = 1; i < railCount; i++) {
      const t3 = i / railCount;
      const rx = b.x + dx * t3;
      const ry = b.y + dy * t3;
      rungs.push(
        <line
          key={i}
          x1={rx + nx} y1={ry + ny}
          x2={rx - nx} y2={ry - ny}
          stroke="#22c55e" strokeWidth={2} opacity={0.8}
        />
      );
    }
    return (
      <g key={`ladder-${base}`}>
        <line x1={b.x + nx} y1={b.y + ny} x2={tp.x + nx} y2={tp.y + ny} stroke="#22c55e" strokeWidth={3} opacity={0.8} />
        <line x1={b.x - nx} y1={b.y - ny} x2={tp.x - nx} y2={tp.y - ny} stroke="#22c55e" strokeWidth={3} opacity={0.8} />
        {rungs}
        <circle cx={tp.x} cy={tp.y} r={6} fill="#22c55e" opacity={0.9} />
        <text x={tp.x} y={tp.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#fff">🪜</text>
      </g>
    );
  });

  // Player tokens (offset if multiple on same square)
  const posBySquare = {};
  (players || []).forEach(p => {
    if (!posBySquare[p.position]) posBySquare[p.position] = [];
    posBySquare[p.position].push(p);
  });

  const playerTokens = [];
  Object.entries(posBySquare).forEach(([sq, ps]) => {
    const n = Number(sq);
    if (n < 1) return;
    const center = squareToXY(n);
    const count = ps.length;
    ps.forEach((p, i) => {
      const offsetX = count > 1 ? (i - (count - 1) / 2) * 12 : 0;
      const offsetY = count > 1 ? (i % 2 === 0 ? -6 : 6) : 0;
      const cx = center.x + offsetX;
      const cy = center.y + offsetY;
      playerTokens.push(
        <g key={`player-${p.id}`}>
          <circle cx={cx} cy={cy} r={10} fill={p.color} stroke="#fff" strokeWidth={1.5} opacity={0.95} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={11}>{p.avatar}</text>
        </g>
      );
    });
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        borderRadius: 12,
        border: `3px solid ${t.border}`,
        boxShadow: `0 0 32px ${t.border}55`,
        background: t.cell1,
        maxWidth: '100%',
        display: 'block',
      }}
    >
      {/* Grid cells */}
      {cells.map(cell => (
        <g key={cell.n}>
          <rect
            x={cell.x} y={cell.y}
            width={CELL} height={CELL}
            fill={cell.fill}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={0.5}
          />
          {/* Square number */}
          <text
            x={cell.x + 3}
            y={cell.y + 10}
            fontSize={8}
            fill="rgba(0,0,0,0.4)"
            fontFamily={FONT}
            fontWeight={600}
          >
            {cell.n}
          </text>
          {/* Special labels */}
          {cell.isStart && (
            <text x={cell.x + CELL / 2} y={cell.y + CELL / 2 + 8} textAnchor="middle" fontSize={14}>🏁</text>
          )}
          {cell.isEnd && (
            <text x={cell.x + CELL / 2} y={cell.y + CELL / 2 + 8} textAnchor="middle" fontSize={14}>🏆</text>
          )}
        </g>
      ))}

      {/* Ladders (draw before snakes so snakes appear on top) */}
      {ladderElems}

      {/* Snakes */}
      {snakeElems}

      {/* Player tokens (on top) */}
      {playerTokens}
    </svg>
  );
}

// ── Dice face ─────────────────────────────────────────────────────────────────
const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function DiceFace({ value, size = 60, color = '#6366f1' }) {
  const dots = DOT_POSITIONS[value] || [];
  const r = size * 0.09;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x={2} y={2} width={96} height={96} rx={18} fill={color} />
      <rect x={5} y={5} width={90} height={90} rx={15} fill="rgba(255,255,255,0.07)" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r * 100 / size * 0.7} fill="#fff" opacity={0.95} />
      ))}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SnakeLadderGame() {
  const [lang,          setLang]          = useState('th');
  const [phase,         setPhase]         = useState('theme');  // theme | lobby | playing | finished
  const [theme,         setTheme]         = useState(null);
  const [roomCode,      setRoomCode]      = useState('');
  const [session,       setSession]       = useState(null);
  const [creating,      setCreating]      = useState(false);
  const [starting,      setStarting]      = useState(false);
  const [error,         setError]         = useState('');

  const pollRef = useRef(null);

  const T = {
    th: {
      title:        'งูและบันได',
      subtitle:     'Snake & Ladder Multiplayer',
      pickTheme:    'เลือกธีมเกม',
      createRoom:   'สร้างห้องเกม',
      creating:     'กำลังสร้าง…',
      startGame:    'เริ่มเกม',
      starting:     'กำลังเริ่ม…',
      waitPlayers:  (n) => `รอผู้เล่น (${n}/2 ขึ้นไป)`,
      players:      'ผู้เล่ม',
      scanQR:       'สแกน QR เพื่อเข้าเกม',
      waitingFor:   'รอผู้เล่มเข้าร่วม…',
      currentTurn:  'ถึงตา',
      position:     'ตำแหน่ง',
      lastResult:   'ผลล่าสุด',
      winner:       'ผู้ชนะ!',
      newGame:      'เกมใหม่',
      endGame:      'จบเกม',
      legend:       ['🐍 งู = ตกลง', '🪜 บันได = ขึ้น', '🎯 ถึง 100 = ชนะ'],
      log:          'บันทึกเกม',
    },
    en: {
      title:        'Snake & Ladder',
      subtitle:     'Multiplayer Board Game',
      pickTheme:    'Pick a Theme',
      createRoom:   'Create Room',
      creating:     'Creating…',
      startGame:    'Start Game',
      starting:     'Starting…',
      waitPlayers:  (n) => `Waiting for players (${n}/2+)`,
      players:      'Players',
      scanQR:       'Scan QR to join',
      waitingFor:   'Waiting for players to join…',
      currentTurn:  "It's turn:",
      position:     'Position',
      lastResult:   'Last Result',
      winner:       'Winner!',
      newGame:      'New Game',
      endGame:      'End Game',
      legend:       ['🐍 Snake = slide down', '🪜 Ladder = climb up', '🎯 Reach 100 = win'],
      log:          'Game Log',
    },
  };
  const tx = T[lang];

  // ── Poll ─────────────────────────────────────────────────────────────────────
  const poll = useCallback(async (code) => {
    try {
      const res = await fetch(`/api/teacher/snakelad?code=${code}`);
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

  // ── Create room ───────────────────────────────────────────────────────────────
  const createRoom = async () => {
    if (!theme) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRoomCode(data.code);
      setSession(data.session);
      setPhase('lobby');
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Start game ────────────────────────────────────────────────────────────────
  const startGame = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', code: roomCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSession(data.session);
      setPhase('playing');
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  };

  // ── Reset game ────────────────────────────────────────────────────────────────
  const resetGame = async () => {
    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', code: roomCode }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setPhase('lobby');
      }
    } catch { /* ignore */ }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const studentUrl = typeof window !== 'undefined' && roomCode
    ? `${window.location.origin}/student/snakelad?code=${roomCode}`
    : '';
  const qrUrl = studentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(studentUrl)}`
    : '';

  const players    = session?.players || [];
  const curIdx     = session?.currentPlayerIdx ?? 0;
  const curPlayer  = players[curIdx] || null;
  const curTheme   = THEMES[session?.theme || theme || 'funpark'];

  // ── Lang button ───────────────────────────────────────────────────────────────
  const LangBtn = () => (
    <button
      onClick={() => setLang(l => l === 'th' ? 'en' : 'th')}
      style={{
        position: 'fixed', top: 12, right: 16, zIndex: 100,
        padding: '4px 12px', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(0,0,0,0.4)', color: '#fff',
        fontSize: 12, cursor: 'pointer', fontFamily: FONT,
        backdropFilter: 'blur(8px)',
      }}
    >
      {lang === 'th' ? 'EN' : 'ไทย'}
    </button>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: THEME SELECTION
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'theme') {
    return (
      <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', padding: '32px 24px', color: '#fff' }}>
        <LangBtn />
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>🎲</div>
            <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: 1 }}>{tx.title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '6px 0 0' }}>{tx.subtitle}</p>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
            {tx.pickTheme}
          </h2>

          {/* Theme cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
            {Object.values(THEMES).map(th => (
              <button
                key={th.key}
                onClick={() => setTheme(th.key)}
                style={{
                  background: theme === th.key ? th.grad : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${theme === th.key ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 16,
                  padding: '28px 20px',
                  cursor: 'pointer',
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#fff',
                  fontFamily: FONT,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  boxShadow: theme === th.key ? `0 0 24px ${th.border}66` : 'none',
                  transform: theme === th.key ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {th.label}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ textAlign: 'center', color: '#f87171', fontSize: 14, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={createRoom}
              disabled={!theme || creating}
              style={{
                padding: '16px 48px',
                borderRadius: 14,
                border: 'none',
                background: (theme && !creating) ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
                color: (theme && !creating) ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: 18,
                fontWeight: 900,
                cursor: (theme && !creating) ? 'pointer' : 'not-allowed',
                fontFamily: FONT,
                boxShadow: theme ? '0 0 32px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              {creating ? tx.creating : `🎲 ${tx.createRoom}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: LOBBY (waiting for players)
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', padding: '32px 24px', color: '#fff' }}>
        <LangBtn />
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 6 }}>🎲</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>{tx.title}</h1>
            <div style={{
              display: 'inline-block',
              background: curTheme.grad,
              borderRadius: 20,
              padding: '4px 18px',
              fontSize: 13,
              fontWeight: 700,
              marginTop: 8,
            }}>
              {curTheme.label}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* QR + join code */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '28px',
              textAlign: 'center',
              minWidth: 240,
              flex: '0 0 auto',
            }}>
              {/* Room code badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.5)',
                borderRadius: 14,
                padding: '8px 20px',
                marginBottom: 20,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>CODE</span>
                <span style={{ color: '#a5b4fc', fontFamily: 'monospace', letterSpacing: 6, fontWeight: 900, fontSize: 24 }}>
                  {roomCode}
                </span>
              </div>

              {/* QR */}
              {qrUrl && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    style={{ display: 'block', margin: '0 auto', borderRadius: 10, background: '#fff', padding: 8, width: 200, height: 200 }}
                  />
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '8px 0 0' }}>{tx.scanQR}</p>
                </div>
              )}

              {/* URL hint */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                wordBreak: 'break-all',
                marginBottom: 20,
                textAlign: 'left',
              }}>
                {studentUrl}
              </div>

              {error && (
                <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>
              )}

              {/* Start button */}
              <button
                onClick={startGame}
                disabled={players.length < 2 || starting}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: (players.length >= 2 && !starting)
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : 'rgba(255,255,255,0.07)',
                  color: (players.length >= 2 && !starting) ? '#fff' : 'rgba(255,255,255,0.25)',
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: (players.length >= 2 && !starting) ? 'pointer' : 'not-allowed',
                  fontFamily: FONT,
                  marginBottom: 10,
                }}
              >
                {starting ? tx.starting : (players.length >= 2 ? `▶ ${tx.startGame}` : tx.waitPlayers(players.length))}
              </button>

              <button
                onClick={() => { setPhase('theme'); setRoomCode(''); setSession(null); clearInterval(pollRef.current); }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)',
                  color: 'rgba(239,68,68,0.7)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                ← กลับ
              </button>
            </div>

            {/* Player list */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '24px',
              flex: 1,
              minWidth: 220,
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
                {tx.players} ({players.length})
              </h3>
              {players.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                  {tx.waitingFor}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {players.map((p, i) => (
                    <div key={p.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      border: `1px solid ${p.color}44`,
                    }}>
                      <span style={{ fontSize: 20 }}>{p.avatar}</span>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <span style={{ color: '#fff', fontWeight: 700, flex: 1, fontSize: 15 }}>{p.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>#{i + 1}</span>
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

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: FINISHED
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'finished' && session) {
    const winnerName = session.winner;
    const winnerPlayer = players.find(p => p.name === winnerName) || players.find(p => p.position === 100);
    return (
      <div style={{
        fontFamily: FONT,
        background: BG,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: 24,
      }}>
        <LangBtn />
        <style>{`
          @keyframes confetti {
            0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        `}</style>

        {/* Confetti dots */}
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{
            position: 'fixed',
            left: `${Math.random() * 100}%`,
            top: '-20px',
            width: 10,
            height: 10,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            background: ['#FF6B9D','#FFD93D','#6BCB77','#4D96FF','#FF6B6B','#C77DFF'][i % 6],
            animation: `confetti ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`,
            zIndex: 0,
          }} />
        ))}

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 28,
          padding: '44px 36px',
          maxWidth: 440,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ fontSize: 88, animation: 'bounce 1s ease infinite', marginBottom: 16 }}>🏆</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 900 }}>{tx.winner}</h2>
          {winnerPlayer && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 28,
            }}>
              <span style={{ fontSize: 28 }}>{winnerPlayer.avatar}</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: winnerPlayer.color }}>{winnerPlayer.name}</span>
            </div>
          )}

          {/* Final standings */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 14,
            padding: '14px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            {[...players].sort((a, b) => b.position - a.position).map((p, i) => (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', width: 20, textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={{ fontSize: 18 }}>{p.avatar}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontSize: 14,
                  color: p.name === winnerName ? p.color : 'rgba(255,255,255,0.7)',
                  fontWeight: p.name === winnerName ? 900 : 500,
                }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>ช่อง {p.position}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={resetGame}
              style={{
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              🎲 {tx.newGame}
            </button>
            <button
              onClick={() => { setPhase('theme'); setRoomCode(''); setSession(null); clearInterval(pollRef.current); }}
              style={{
                padding: '10px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: 'rgba(239,68,68,0.7)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              ออกเกม
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: PLAYING
  // ════════════════════════════════════════════════════════════════════════════
  const lastEvent = session?.lastEvent;
  const lastRoll  = session?.lastRoll;
  const log       = session?.log || [];

  const eventColor = () => {
    if (!lastEvent) return '#a5b4fc';
    if (lastEvent.type === 'snake')    return '#ef4444';
    if (lastEvent.type === 'ladder')   return '#22c55e';
    if (lastEvent.type === 'win')      return '#fbbf24';
    if (lastEvent.type === 'extra_roll') return '#f59e0b';
    return '#a5b4fc';
  };

  return (
    <div style={{
      fontFamily: FONT,
      background: BG,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      padding: '12px',
      overflow: 'hidden',
    }}>
      <LangBtn />

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🎲</span>
          <span style={{ fontWeight: 900, fontSize: 18 }}>{tx.title}</span>
          <span style={{
            background: curTheme.grad,
            borderRadius: 20,
            padding: '2px 14px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {curTheme.label}
          </span>
          <span style={{
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 8,
            padding: '2px 10px',
            fontFamily: 'monospace',
            letterSpacing: 2,
            fontSize: 14,
            color: '#a5b4fc',
          }}>{roomCode}</span>
        </div>
        <button
          onClick={() => { clearInterval(pollRef.current); setPhase('theme'); setRoomCode(''); setSession(null); }}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)',
            color: 'rgba(239,68,68,0.7)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          {tx.endGame}
        </button>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>

        {/* Board — 60% */}
        <div style={{ flex: '0 0 60%', maxWidth: '60%', display: 'flex', justifyContent: 'center' }}>
          <SnakeAndLadderBoard
            players={players}
            theme={session?.theme || 'funpark'}
          />
        </div>

        {/* Side panel — 40% */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'auto', maxHeight: 'calc(100vh - 80px)' }}>

          {/* Current turn */}
          {curPlayer && (
            <div style={{
              background: `${curPlayer.color}22`,
              border: `2px solid ${curPlayer.color}80`,
              borderRadius: 14,
              padding: '12px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{tx.currentTurn}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{curPlayer.avatar}</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: curPlayer.color }}>{curPlayer.name}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>
                {tx.position} {curPlayer.position}
              </div>
            </div>
          )}

          {/* Dice + last event */}
          {(lastRoll || lastEvent) && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '12px 14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{tx.lastResult}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {lastRoll && <DiceFace value={lastRoll} size={50} color={eventColor()} />}
                <div>
                  {lastRoll && (
                    <div style={{ fontSize: 20, fontWeight: 900, color: eventColor() }}>
                      {lastRoll}
                    </div>
                  )}
                  {lastEvent?.msg && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: eventColor() }}>
                      {lastEvent.msg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Player list */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
              {tx.players} ({players.length})
            </div>
            {players.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 8px',
                borderRadius: 8,
                marginBottom: 4,
                background: i === curIdx ? `${p.color}18` : 'transparent',
                border: i === curIdx ? `1px solid ${p.color}60` : '1px solid transparent',
              }}>
                <span style={{ fontSize: 16 }}>{p.avatar}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontSize: 13,
                  fontWeight: i === curIdx ? 800 : 500,
                  color: i === curIdx ? '#fff' : 'rgba(255,255,255,0.6)',
                }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  {p.position === 0 ? 'START' : `ช่อง ${p.position}`}
                </span>
                {i === curIdx && <span style={{ fontSize: 10, color: p.color }}>▶</span>}
              </div>
            ))}
          </div>

          {/* Game log */}
          {log.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '10px 12px',
              maxHeight: 180,
              overflow: 'auto',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{tx.log}</div>
              {log.slice(0, 15).map((entry, i) => (
                <div key={i} style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  padding: '3px 0',
                  borderBottom: i < log.slice(0, 15).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{entry.player}</span>
                  {' '}ทอย {entry.roll} → ช่อง {entry.toPos}
                  {entry.event && (
                    <span style={{ color: '#fbbf24', marginLeft: 6 }}>{entry.event}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.9 }}>
            {tx.legend.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const FONT = "'Kanit','Noto Sans Thai',sans-serif";

// Board constants (must match route.js)
const SNAKES  = { 17:7, 54:34, 62:19, 64:60, 87:36, 93:73, 95:56, 99:78 };
const LADDERS = { 4:23, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91 };
const EVENTS  = { 10:true, 25:true, 45:true, 60:true, 75:true, 88:true };

const CSS = `
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes popIn   { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shake   { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-20deg)} 40%{transform:rotate(20deg)} 60%{transform:rotate(-15deg)} 80%{transform:rotate(15deg)} }
  @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes dotPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
`;

// ── Dice face ──────────────────────────────────────────────────────────────────
const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

function DiceFace({ value, size = 80, color = '#6366f1', rolling = false }) {
  const dots = DOT_POSITIONS[value] || DOT_POSITIONS[1];
  const r = size * 0.085;
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      style={{ animation: rolling ? 'shake 0.35s ease infinite' : 'none', display: 'block' }}
    >
      <rect x={2} y={2} width={96} height={96} rx={20} fill={color} />
      <rect x={5} y={5} width={90} height={90} rx={17} fill="rgba(255,255,255,0.08)" />
      <rect x={2} y={2} width={96} height={50} rx={20} fill="rgba(255,255,255,0.06)" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r * 100 / size * 0.9} fill="#fff" opacity={0.95} />
      ))}
    </svg>
  );
}

// ── Mini board (SVG 200×200) ────────────────────────────────────────────────────
const MINI = 20; // px per cell in mini board

function squareToXYMini(n) {
  const idx = n - 1;
  const row = Math.floor(idx / 10);
  const col = idx % 10;
  const actualCol = row % 2 === 0 ? col : 9 - col;
  return { x: actualCol * MINI + MINI / 2, y: (9 - row) * MINI + MINI / 2 };
}

const THEME_MINI = {
  funpark: { c1: '#FFF9C4', c2: '#FFCCBC', border: '#FFD93D' },
  snow:    { c1: '#E3F2FD', c2: '#BBDEFB', border: '#74b9ff' },
  japan:   { c1: '#FCE4EC', c2: '#F8BBD0', border: '#fd79a8' },
  forest:  { c1: '#E8F5E9', c2: '#C8E6C9', border: '#00b894' },
};

function MiniBoard({ players, theme }) {
  const tc = THEME_MINI[theme] || THEME_MINI.funpark;
  const size = MINI * 10;

  const cells = [];
  for (let displayRow = 0; displayRow < 10; displayRow++) {
    for (let col = 0; col < 10; col++) {
      const boardRow = 9 - displayRow;
      const actualCol = boardRow % 2 === 0 ? col : 9 - col;
      const n = boardRow * 10 + actualCol + 1;
      const x = col * MINI;
      const y = displayRow * MINI;
      const isEven = (boardRow + actualCol) % 2 === 0;
      let fill = isEven ? tc.c1 : tc.c2;
      if (SNAKES[n]  !== undefined) fill = 'rgba(239,68,68,0.22)';
      if (LADDERS[n] !== undefined) fill = 'rgba(34,197,94,0.22)';
      if (EVENTS[n])               fill = 'rgba(251,191,36,0.22)';
      cells.push({ n, x, y, fill });
    }
  }

  // Player positions
  const posBySquare = {};
  (players || []).forEach(p => {
    if (!posBySquare[p.position]) posBySquare[p.position] = [];
    posBySquare[p.position].push(p);
  });

  const tokens = [];
  Object.entries(posBySquare).forEach(([sq, ps]) => {
    const n = Number(sq);
    if (n < 1) return;
    const center = squareToXYMini(n);
    ps.forEach((p, i) => {
      const off = ps.length > 1 ? (i - (ps.length - 1) / 2) * 5 : 0;
      tokens.push(
        <circle
          key={`token-${p.id}`}
          cx={center.x + off}
          cy={center.y}
          r={5}
          fill={p.color}
          stroke="#fff"
          strokeWidth={1}
          opacity={0.95}
        />
      );
    });
  });

  // Snake lines
  const snakeLines = Object.entries(SNAKES).map(([head, tail]) => {
    const h  = squareToXYMini(Number(head));
    const t2 = squareToXYMini(Number(tail));
    return <line key={`sl-${head}`} x1={h.x} y1={h.y} x2={t2.x} y2={t2.y} stroke="#ef4444" strokeWidth={1.5} opacity={0.6} />;
  });

  // Ladder lines
  const ladderLines = Object.entries(LADDERS).map(([base, top]) => {
    const b  = squareToXYMini(Number(base));
    const tp = squareToXYMini(Number(top));
    return <line key={`ll-${base}`} x1={b.x} y1={b.y} x2={tp.x} y2={tp.y} stroke="#22c55e" strokeWidth={1.5} opacity={0.6} />;
  });

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        borderRadius: 8,
        border: `2px solid ${tc.border}`,
        background: tc.c1,
        display: 'block',
      }}
    >
      {cells.map(c => (
        <rect key={c.n} x={c.x} y={c.y} width={MINI} height={MINI} fill={c.fill} stroke="rgba(0,0,0,0.07)" strokeWidth={0.3} />
      ))}
      {ladderLines}
      {snakeLines}
      {tokens}
    </svg>
  );
}

// ── Player ID persistence ──────────────────────────────────────────────────────
function getOrCreatePlayerId() {
  try {
    let id = localStorage.getItem('snaklad_player_id');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('snaklad_player_id', id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Inner component (uses searchParams)
// ════════════════════════════════════════════════════════════════════════════
function StudentSnakeLadderInner() {
  const searchParams = useSearchParams();
  const codeParam    = (searchParams.get('code') || '').toUpperCase();

  // Screens: join | waiting | playing | finished
  const [screen,     setScreen]     = useState(codeParam ? 'join' : 'join');
  const [codeInput,  setCodeInput]  = useState(codeParam);
  const [nameInput,  setNameInput]  = useState('');
  const [joinError,  setJoinError]  = useState('');
  const [joining,    setJoining]    = useState(false);

  const [myCode,     setMyCode]     = useState('');
  const [myPlayerId, setMyPlayerId] = useState('');
  const [session,    setSession]    = useState(null);

  const [rolling,    setRolling]    = useState(false);
  const [diceAnim,   setDiceAnim]   = useState(1);
  const [rollResult, setRollResult] = useState(null); // { rolled, event, msg }
  const [showResult, setShowResult] = useState(false);

  const pollRef  = useRef(null);
  const animRef  = useRef(null);

  // ── Poll session ─────────────────────────────────────────────────────────────
  const pollSession = async (code) => {
    try {
      const res = await fetch(`/api/teacher/snakelad?code=${code}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        if (data.session.phase === 'playing')  setScreen(s => s === 'waiting' ? 'playing' : s === 'playing' ? 'playing' : s);
        if (data.session.phase === 'finished') { setScreen('finished'); clearInterval(pollRef.current); }
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(animRef.current);
    };
  }, []);

  // ── Start polling ──────────────────────────────────────────────────────────
  const startPolling = (code) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollSession(code), 2000);
  };

  // ── Join ─────────────────────────────────────────────────────────────────────
  const joinGame = async () => {
    const code = codeInput.trim().toUpperCase();
    const name = nameInput.trim();
    if (code.length < 4)  { setJoinError('กรุณากรอกรหัสห้อง'); return; }
    if (!name)            { setJoinError('กรุณากรอกชื่อของคุณ'); return; }
    setJoining(true);
    setJoinError('');

    // ensure player ID exists
    const pid = getOrCreatePlayerId();
    setMyPlayerId(pid);

    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code, name }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || 'เข้าร่วมไม่ได้'); setJoining(false); return; }

      // Store actual playerId returned from server
      const pid2 = data.playerId || pid;
      setMyPlayerId(pid2);
      try { localStorage.setItem('snaklad_player_id', pid2); } catch {}

      setMyCode(code);
      setSession(data.session);
      setScreen('waiting');
      startPolling(code);
    } catch {
      setJoinError('เชื่อมต่อไม่ได้ — ลองใหม่อีกครั้ง');
    } finally {
      setJoining(false);
    }
  };

  // ── Roll dice ─────────────────────────────────────────────────────────────────
  const rollDice = async () => {
    if (rolling) return;
    setRolling(true);
    setShowResult(false);
    setRollResult(null);

    // Animate dice spinning
    let frame = 0;
    clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      setDiceAnim(Math.floor(Math.random() * 6) + 1);
      frame++;
      if (frame > 10) clearInterval(animRef.current);
    }, 80);

    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'roll', code: myCode, playerId: myPlayerId }),
      });
      const data = await res.json();

      clearInterval(animRef.current);

      if (!res.ok) {
        setDiceAnim(1);
        setRolling(false);
        setRollResult({ error: data.error || 'ลองใหม่' });
        setShowResult(true);
        return;
      }

      const { session: newSession, rolled, event } = data;

      // Land on result
      setDiceAnim(rolled);
      setSession(newSession);

      // Build message
      let msg = `ทอยได้ ${rolled} 🎲`;
      let msgColor = '#a5b4fc';
      if (event) {
        msg = event.msg;
        if (event.type === 'snake')      msgColor = '#ef4444';
        else if (event.type === 'ladder') msgColor = '#22c55e';
        else if (event.type === 'win')    msgColor = '#fbbf24';
        else if (event.type === 'extra_roll') msgColor = '#f59e0b';
        else if (event.type === 'forward')    msgColor = '#22c55e';
        else if (event.type === 'backward')   msgColor = '#f97316';
        else if (event.type === 'skip')       msgColor = '#94a3b8';
      }

      setRollResult({ rolled, event, msg, msgColor });
      setShowResult(true);

      if (newSession.phase === 'finished') {
        setScreen('finished');
        clearInterval(pollRef.current);
      }
    } catch {
      clearInterval(animRef.current);
      setRollResult({ error: 'เชื่อมต่อไม่ได้' });
      setShowResult(true);
    } finally {
      setRolling(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────────
  const players    = session?.players || [];
  const curIdx     = session?.currentPlayerIdx ?? 0;
  const curPlayer  = players[curIdx] || null;
  const myPlayer   = players.find(p => p.id === myPlayerId);
  const isMyTurn   = curPlayer?.id === myPlayerId;
  const gameTheme  = session?.theme || 'funpark';

  // Update screen when session changes to 'playing' from waiting
  useEffect(() => {
    if (session?.phase === 'playing' && screen === 'waiting') {
      setScreen('playing');
    }
  }, [session, screen]);

  // ════════════════════════════════════════════════════════════════════════════
  // JOIN SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'join') {
    return (
      <div style={{
        minHeight: '100dvh', height: '100dvh',
        background: 'linear-gradient(160deg,#020918,#050f2a,#0a0520)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', fontFamily: FONT,
      }}>
        <style>{CSS}</style>
        <div style={{ width: '100%', maxWidth: 380, animation: 'slideUp 0.5s ease' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🎲</div>
            <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>
              งูและบันได
            </h1>
            <p style={{ color: 'rgba(165,180,252,0.5)', fontSize: 12, margin: 0, letterSpacing: 3 }}>
              SNAKE &amp; LADDER
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '24px 20px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Code input */}
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
                รหัสห้องเกม
              </label>
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setJoinError(''); }}
                onKeyDown={e => e.key === 'Enter' && joinGame()}
                placeholder="XXXXXX"
                maxLength={8}
                autoFocus
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 12,
                  border: `2px solid ${joinError ? '#f87171' : codeInput.length >= 4 ? '#a5b4fc' : 'rgba(255,255,255,0.12)'}`,
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontSize: 28, fontWeight: 900, textAlign: 'center', letterSpacing: 8,
                  fontFamily: "'Courier New',monospace",
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Name input */}
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
                ชื่อของคุณ
              </label>
              <input
                value={nameInput}
                onChange={e => { setNameInput(e.target.value.slice(0, 20)); setJoinError(''); }}
                onKeyDown={e => e.key === 'Enter' && joinGame()}
                placeholder="ใส่ชื่อของคุณ"
                maxLength={20}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 12,
                  border: `2px solid ${nameInput.trim() ? 'rgba(165,180,252,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontSize: 18, fontWeight: 700, textAlign: 'center',
                  fontFamily: FONT, outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {joinError && (
              <div style={{ color: '#fca5a5', fontSize: 14, textAlign: 'center', fontWeight: 600 }}>
                ⚠️ {joinError}
              </div>
            )}

            <button
              onClick={joinGame}
              disabled={codeInput.length < 4 || !nameInput.trim() || joining}
              style={{
                width: '100%', padding: '16px',
                borderRadius: 12, border: 'none',
                background: (codeInput.length >= 4 && nameInput.trim() && !joining)
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : 'rgba(255,255,255,0.07)',
                color: (codeInput.length >= 4 && nameInput.trim() && !joining)
                  ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: 18, fontWeight: 900,
                cursor: (codeInput.length >= 4 && nameInput.trim() && !joining) ? 'pointer' : 'not-allowed',
                fontFamily: FONT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              {joining ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  กำลังเชื่อมต่อ…
                </>
              ) : 'เข้าร่วมเกม →'}
            </button>
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 16 }}>
            📱 หรือสแกน QR Code บนจอหน้าห้อง
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WAITING SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'waiting') {
    return (
      <div style={{
        minHeight: '100dvh', height: '100dvh',
        background: 'linear-gradient(160deg,#020918,#050f2a,#0a0520)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: FONT, textAlign: 'center', color: '#fff',
      }}>
        <style>{CSS}</style>
        <div style={{ animation: 'slideUp 0.5s ease', width: '100%', maxWidth: 380 }}>
          {/* Room badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 20, padding: '8px 20px', marginBottom: 28,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>ห้อง</span>
            <span style={{ color: '#a5b4fc', fontFamily: 'monospace', letterSpacing: 5, fontWeight: 900, fontSize: 20 }}>
              {myCode}
            </span>
          </div>

          {/* Animated waiting indicator */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 52, animation: 'bounce 2s ease infinite' }}>🎲</div>
          </div>

          <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 900, margin: '0 0 6px' }}>
            เข้าร่วมแล้ว!
          </h2>

          {myPlayer && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${myPlayer.color}22`,
              border: `1px solid ${myPlayer.color}60`,
              borderRadius: 14, padding: '6px 16px', marginBottom: 12,
            }}>
              <span style={{ fontSize: 18 }}>{myPlayer.avatar}</span>
              <span style={{ color: myPlayer.color, fontWeight: 800, fontSize: 15 }}>{myPlayer.name}</span>
            </div>
          )}

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            รอ host เริ่มเกม
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: '50%', background: 'rgba(165,180,252,0.6)',
                  display: 'inline-block',
                  animation: `dotPulse 1.4s ${i * 0.2}s ease infinite`,
                }} />
              ))}
            </span>
          </p>

          {/* Player list */}
          {players.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '16px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                ผู้เล่ม ({players.length})
              </div>
              {players.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize: 18 }}>{p.avatar}</span>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{
                    color: p.id === myPlayerId ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontWeight: p.id === myPlayerId ? 800 : 500,
                    fontSize: 15, flex: 1,
                  }}>
                    {p.name} {p.id === myPlayerId && (
                      <span style={{ fontSize: 12, color: 'rgba(165,180,252,0.6)' }}>(คุณ)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FINISHED SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'finished') {
    const winnerName   = session?.winner;
    const winnerPlayer = players.find(p => p.name === winnerName) || players.find(p => p.position === 100);
    const iWon         = winnerPlayer?.id === myPlayerId;

    return (
      <div style={{
        minHeight: '100dvh', height: '100dvh',
        background: iWon
          ? 'linear-gradient(160deg,#0a1f14,#0d2b1a)'
          : 'linear-gradient(160deg,#020918,#050f2a,#0a0520)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: FONT, textAlign: 'center', color: '#fff',
      }}>
        <style>{CSS}</style>

        <div style={{ animation: 'popIn 0.6s ease', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 88, animation: iWon ? 'bounce 1s ease infinite' : 'fadeIn 0.5s ease', marginBottom: 12 }}>
            {iWon ? '🏆' : '🎮'}
          </div>
          <h2 style={{
            margin: '0 0 10px', fontSize: 30, fontWeight: 900,
            color: iWon ? '#34d399' : '#f1f5f9',
          }}>
            {iWon ? 'คุณชนะ! 🎉' : 'เกมจบแล้ว'}
          </h2>

          {winnerPlayer && !iWon && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: '0 0 4px' }}>ผู้ชนะคือ</p>
              <span style={{ fontSize: 22, fontWeight: 900, color: winnerPlayer.color }}>
                {winnerPlayer.avatar} {winnerPlayer.name}
              </span>
            </div>
          )}
          {iWon && (
            <p style={{ color: 'rgba(52,211,153,0.8)', fontSize: 15, margin: '0 0 16px' }}>
              ยินดีด้วย! คุณถึงช่อง 100 แล้ว! 🎯
            </p>
          )}

          {/* Final standings */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '16px',
            textAlign: 'left',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>อันดับสุดท้าย</div>
            {[...players].sort((a, b) => b.position - a.position).map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', width: 22, textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                </span>
                <span style={{ fontSize: 18 }}>{p.avatar}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontSize: 14,
                  color: p.name === winnerName ? p.color : 'rgba(255,255,255,0.7)',
                  fontWeight: p.name === winnerName ? 900 : 500,
                }}>
                  {p.name} {p.id === myPlayerId && (
                    <span style={{ fontSize: 11, color: 'rgba(165,180,252,0.5)' }}>(คุณ)</span>
                  )}
                  {p.name === winnerName && ' 🏆'}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>ช่อง {p.position}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setScreen('join');
              setMyCode('');
              setSession(null);
              setRollResult(null);
              setShowResult(false);
              setCodeInput(codeParam);
              setNameInput('');
            }}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', fontSize: 18, fontWeight: 900,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            🎲 เล่นใหม่
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100dvh', height: '100dvh',
      background: 'linear-gradient(160deg,#020918,#050f2a,#0a0520)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'stretch',
      fontFamily: FONT, color: '#fff',
      overflow: 'hidden',
    }}>
      <style>{CSS}</style>

      {/* Top strip: room code + my position */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 14, padding: '5px 14px',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>ห้อง</span>
          <span style={{ color: '#a5b4fc', fontFamily: 'monospace', letterSpacing: 3, fontWeight: 900, fontSize: 14 }}>
            {myCode}
          </span>
        </div>

        {myPlayer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: `${myPlayer.color}22`,
            border: `1px solid ${myPlayer.color}60`,
            borderRadius: 14, padding: '5px 14px',
          }}>
            <span style={{ fontSize: 16 }}>{myPlayer.avatar}</span>
            <span style={{ color: myPlayer.color, fontWeight: 800, fontSize: 13 }}>{myPlayer.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }}>
              ช่อง {myPlayer.position}
            </span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '16px',
        overflow: 'hidden',
        gap: 12,
      }}>

        {/* Mini board — always shown */}
        <div style={{ flexShrink: 0 }}>
          <MiniBoard players={players} theme={gameTheme} />
        </div>

        {isMyTurn ? (
          /* ── MY TURN ── */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flex: 1, width: '100%', maxWidth: 340,
            gap: 12,
          }}>
            {/* "Your turn" label */}
            <div style={{
              fontSize: 18, fontWeight: 900, color: '#a5b4fc',
              textAlign: 'center',
              animation: 'pulse 2s ease infinite',
            }}>
              ถึงตาคุณแล้ว! 🎯
            </div>

            {/* Dice button — big rounded square */}
            <button
              onClick={rollDice}
              disabled={rolling}
              style={{
                width: 140, height: 140,
                borderRadius: 32,
                border: 'none',
                background: rolling
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                cursor: rolling ? 'not-allowed' : 'pointer',
                boxShadow: rolling ? 'none' : '0 0 48px rgba(99,102,241,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
                transition: 'box-shadow 0.2s',
              }}
            >
              <DiceFace
                value={rolling ? diceAnim : (rollResult?.rolled || diceAnim)}
                size={108}
                color={rolling ? '#4338ca' : '#6366f1'}
                rolling={rolling}
              />
            </button>

            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              {rolling ? 'กำลังทอย…' : 'แตะเพื่อทอยลูกเต๋า!'}
            </div>

            {/* Roll result card */}
            {showResult && rollResult && (
              <div style={{
                background: rollResult.error ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${rollResult.error ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 16,
                padding: '14px 24px',
                textAlign: 'center',
                animation: 'popIn 0.3s ease',
                width: '100%',
              }}>
                {rollResult.error ? (
                  <div style={{ color: '#f87171', fontSize: 14, fontWeight: 700 }}>
                    ⚠️ {rollResult.error}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 900, color: rollResult.msgColor || '#a5b4fc', marginBottom: 4 }}>
                      {rollResult.event?.type === 'snake'  && '🐍'}
                      {rollResult.event?.type === 'ladder' && '🪜'}
                      {rollResult.event?.type === 'win'    && '🏆'}
                      {rollResult.event?.type === 'extra_roll' && '🎲'}
                      {rollResult.event?.type === 'forward'    && '⭐'}
                      {rollResult.event?.type === 'backward'   && '😱'}
                      {rollResult.event?.type === 'skip'       && '😴'}
                      {!rollResult.event && '🎲'}
                      {' '}{rollResult.msg}
                    </div>
                    {rollResult.event?.from !== undefined && rollResult.event?.to !== undefined && (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                        {rollResult.event.from} → {rollResult.event.to}
                      </div>
                    )}
                    {myPlayer && (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                        ตำแหน่งปัจจุบัน: ช่อง {myPlayer.position}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── OTHER'S TURN ── */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flex: 1, width: '100%', maxWidth: 340,
            gap: 12,
          }}>
            {/* Whose turn */}
            {curPlayer && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>ถึงตา</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{curPlayer.avatar}</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: curPlayer.color }}>{curPlayer.name}</span>
                </div>
              </div>
            )}

            {/* Waiting spinner */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 40, padding: '14px 24px',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '3px solid rgba(165,180,252,0.3)',
                borderTopColor: '#a5b4fc',
                animation: 'spin 1s linear infinite',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700 }}>
                รอผู้เล่นอื่น…
              </span>
            </div>

            {/* Player standings */}
            <div style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                ผู้เล่ม ({players.length})
              </div>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0',
                  borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ fontSize: 14 }}>{p.avatar}</span>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{
                    flex: 1, fontSize: 13,
                    color: i === curIdx ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontWeight: i === curIdx ? 800 : 500,
                  }}>
                    {p.name}
                    {p.id === myPlayerId && (
                      <span style={{ fontSize: 10, color: 'rgba(165,180,252,0.5)', marginLeft: 4 }}>(คุณ)</span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {p.position === 0 ? 'START' : `ช่อง ${p.position}`}
                  </span>
                  {i === curIdx && (
                    <span style={{ fontSize: 10, color: p.color }}>▶</span>
                  )}
                </div>
              ))}
            </div>

            {/* Last event from session */}
            {session?.lastEvent?.msg && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 14, fontWeight: 700, textAlign: 'center',
                color: 'rgba(255,255,255,0.6)',
              }}>
                ผลล่าสุด: {session.lastEvent.msg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Page wrapper with Suspense
// ════════════════════════════════════════════════════════════════════════════
export default function StudentSnakeLadderPage() {
  return (
    <Suspense fallback={
      <div style={{
        height: '100dvh', minHeight: '100vh',
        background: 'linear-gradient(160deg,#020918,#050f2a,#0a0520)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Kanit',sans-serif",
      }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>กำลังโหลด…</span>
      </div>
    }>
      <StudentSnakeLadderInner />
    </Suspense>
  );
}

'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const FONT = "'Kanit','Noto Sans Thai',sans-serif";
const BG   = 'linear-gradient(160deg,#020918,#050f2a,#0a0520)';

const CSS = `
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes popIn   { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shake   { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-20deg)} 40%{transform:rotate(20deg)} 60%{transform:rotate(-15deg)} 80%{transform:rotate(15deg)} }
  @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes dotPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
  @keyframes cardSlideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes diceGlow { 0%,100%{box-shadow:0 0 32px rgba(99,102,241,0.4)} 50%{box-shadow:0 0 64px rgba(139,92,246,0.8)} }
`;

// ── Avatars & Colors ──────────────────────────────────────────────────────────
const AVATARS = ['🐶','🐱','🐻','🦊','🐸','🦁','🐯','🐨','🐼','🦄','🐧','🦋'];
const COLORS  = [
  '#FF6B9D','#4ECDC4','#FFE66D','#A8E6CF','#DDA0DD',
  '#87CEEB','#FFA07A','#98FB98','#F08080','#9370DB',
];

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

// ════════════════════════════════════════════════════════════════════════════
// Inner component
// ════════════════════════════════════════════════════════════════════════════
function StudentSnakeLadderInner() {
  const searchParams = useSearchParams();
  const codeParam    = (searchParams.get('code') || '').toUpperCase();

  // Screens: join | character | waiting | playing | finished
  const [screen,          setScreen]          = useState('join');
  const [codeInput,       setCodeInput]       = useState(codeParam);
  const [nameInput,       setNameInput]       = useState('');
  const [joinError,       setJoinError]       = useState('');
  const [joining,         setJoining]         = useState(false);

  // Character selection
  const [selectedAvatar,  setSelectedAvatar]  = useState(AVATARS[0]);
  const [selectedColor,   setSelectedColor]   = useState(COLORS[0]);

  const [myCode,          setMyCode]          = useState('');
  const [myPlayerId,      setMyPlayerId]       = useState('');
  const [session,         setSession]         = useState(null);

  const [rolling,         setRolling]         = useState(false);
  const [diceAnim,        setDiceAnim]        = useState(1);
  const [rollResult,      setRollResult]      = useState(null); // { rolled, event, msg, msgColor }
  const [showCard,        setShowCard]        = useState(false);

  const pollRef  = useRef(null);
  const animRef  = useRef(null);
  const cardTimerRef = useRef(null);

  // ── Poll session ─────────────────────────────────────────────────────────────
  const pollSession = useCallback(async (code) => {
    try {
      const res = await fetch(`/api/teacher/snakelad?code=${code}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        if (data.session.phase === 'playing')  setScreen(s => s === 'waiting' ? 'playing' : s);
        if (data.session.phase === 'finished') { setScreen('finished'); clearInterval(pollRef.current); }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(animRef.current);
      clearTimeout(cardTimerRef.current);
    };
  }, []);

  // ── Start polling ──────────────────────────────────────────────────────────
  const startPolling = useCallback((code) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollSession(code), 2000);
  }, [pollSession]);

  // Update screen when session phase changes
  useEffect(() => {
    if (session?.phase === 'playing' && screen === 'waiting') setScreen('playing');
    if (session?.phase === 'finished' && screen !== 'finished') {
      setScreen('finished');
      clearInterval(pollRef.current);
    }
  }, [session, screen]);

  // ── Step 1: validate join inputs, go to character screen ─────────────────────
  const goToCharacter = () => {
    const code = codeInput.trim().toUpperCase();
    const name = nameInput.trim();
    if (code.length < 4)  { setJoinError('กรุณากรอกรหัสห้อง'); return; }
    if (!name)            { setJoinError('กรุณากรอกชื่อของคุณ'); return; }
    setJoinError('');
    setScreen('character');
  };

  // ── Step 2: actually join with chosen avatar & color ──────────────────────────
  const joinGame = async (avatar, color) => {
    const code = codeInput.trim().toUpperCase();
    const name = nameInput.trim();
    setJoining(true);
    setJoinError('');

    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code, name, avatar, color }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || 'เข้าร่วมไม่ได้'); setScreen('join'); setJoining(false); return; }

      const pid = data.playerId;
      setMyPlayerId(pid);
      try { localStorage.setItem('snaklad_player_id', pid); } catch {}

      setMyCode(code);
      setSession(data.session);
      setScreen('waiting');
      startPolling(code);
    } catch {
      setJoinError('เชื่อมต่อไม่ได้ — ลองใหม่อีกครั้ง');
      setScreen('join');
    } finally {
      setJoining(false);
    }
  };

  // ── Roll dice ─────────────────────────────────────────────────────────────────
  const rollDice = async () => {
    if (rolling) return;
    setRolling(true);
    setShowCard(false);
    setRollResult(null);
    clearTimeout(cardTimerRef.current);

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
        setShowCard(true);
        return;
      }

      const { session: newSession, rolled, event } = data;
      setDiceAnim(rolled);
      setSession(newSession);

      let msg = `ทอยได้ ${rolled}`;
      let msgColor = '#a5b4fc';
      if (event) {
        msg = event.msg;
        if (event.type === 'snake')       msgColor = '#ef4444';
        else if (event.type === 'ladder') msgColor = '#22c55e';
        else if (event.type === 'win')    msgColor = '#fbbf24';
        else if (event.type === 'extra_roll') msgColor = '#f59e0b';
        else if (event.type === 'forward')    msgColor = '#22c55e';
        else if (event.type === 'backward')   msgColor = '#f97316';
        else if (event.type === 'skip')       msgColor = '#94a3b8';
      }

      setRollResult({ rolled, event, msg, msgColor });
      setShowCard(true);

      // Auto-dismiss card after 3s
      cardTimerRef.current = setTimeout(() => setShowCard(false), 3000);

      if (newSession.phase === 'finished') {
        setScreen('finished');
        clearInterval(pollRef.current);
      }
    } catch {
      clearInterval(animRef.current);
      setRollResult({ error: 'เชื่อมต่อไม่ได้' });
      setShowCard(true);
    } finally {
      setRolling(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────────
  const players   = session?.players || [];
  const curIdx    = session?.currentPlayerIdx ?? 0;
  const curPlayer = players[curIdx] || null;
  const myPlayer  = players.find(p => p.id === myPlayerId);
  const isMyTurn  = curPlayer?.id === myPlayerId;

  // ── Event card color ──────────────────────────────────────────────────────────
  const cardBg = () => {
    if (!rollResult?.event) return 'linear-gradient(135deg,#312e81,#1e1b4b)';
    const t = rollResult.event.type;
    if (t === 'snake')    return 'linear-gradient(135deg,#7f1d1d,#450a0a)';
    if (t === 'ladder')   return 'linear-gradient(135deg,#14532d,#052e16)';
    if (t === 'win')      return 'linear-gradient(135deg,#78350f,#451a03)';
    return 'linear-gradient(135deg,#312e81,#1e1b4b)';
  };
  const cardBorder = () => {
    if (!rollResult?.event) return 'rgba(99,102,241,0.5)';
    const t = rollResult.event.type;
    if (t === 'snake')  return 'rgba(239,68,68,0.5)';
    if (t === 'ladder') return 'rgba(34,197,94,0.5)';
    if (t === 'win')    return 'rgba(251,191,36,0.6)';
    return 'rgba(99,102,241,0.5)';
  };

  // ════════════════════════════════════════════════════════════════════════════
  // JOIN SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'join') {
    return (
      <div style={{
        minHeight: '100dvh', height: '100dvh', background: BG,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', fontFamily: FONT,
      }}>
        <style>{CSS}</style>
        <div style={{ width: '100%', maxWidth: 380, animation: 'slideUp 0.5s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🎲</div>
            <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>
              บันไดงู
            </h1>
            <p style={{ color: 'rgba(165,180,252,0.5)', fontSize: 12, margin: 0, letterSpacing: 3 }}>
              SNAKE &amp; LADDER
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '24px 20px',
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
                onKeyDown={e => e.key === 'Enter' && goToCharacter()}
                placeholder="XXXXXX"
                maxLength={8}
                autoFocus
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  border: `2px solid ${joinError ? '#f87171' : codeInput.length >= 4 ? '#a5b4fc' : 'rgba(255,255,255,0.12)'}`,
                  background: 'rgba(0,0,0,0.35)', color: '#fff',
                  fontSize: 28, fontWeight: 900, textAlign: 'center', letterSpacing: 8,
                  fontFamily: "'Courier New',monospace", outline: 'none', transition: 'border-color 0.2s',
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
                onKeyDown={e => e.key === 'Enter' && goToCharacter()}
                placeholder="ใส่ชื่อของคุณ"
                maxLength={20}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  border: `2px solid ${nameInput.trim() ? 'rgba(165,180,252,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  background: 'rgba(0,0,0,0.35)', color: '#fff',
                  fontSize: 18, fontWeight: 700, textAlign: 'center',
                  fontFamily: FONT, outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>

            {joinError && (
              <div style={{ color: '#fca5a5', fontSize: 14, textAlign: 'center', fontWeight: 600 }}>
                ⚠️ {joinError}
              </div>
            )}

            <button
              onClick={goToCharacter}
              disabled={codeInput.length < 4 || !nameInput.trim()}
              style={{
                width: '100%', padding: '16px', borderRadius: 12, border: 'none',
                background: (codeInput.length >= 4 && nameInput.trim())
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : 'rgba(255,255,255,0.07)',
                color: (codeInput.length >= 4 && nameInput.trim()) ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: 18, fontWeight: 900,
                cursor: (codeInput.length >= 4 && nameInput.trim()) ? 'pointer' : 'not-allowed',
                fontFamily: FONT, transition: 'all 0.2s',
              }}
            >
              ถัดไป →
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
  // CHARACTER SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'character') {
    return (
      <div style={{
        minHeight: '100dvh', background: BG,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '28px 20px 32px', fontFamily: FONT, color: '#fff',
        overflowY: 'auto',
      }}>
        <style>{CSS}</style>
        <div style={{ width: '100%', maxWidth: 400, animation: 'slideUp 0.4s ease' }}>
          {/* Name display */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>สวัสดี!</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{nameInput.trim()}</div>
            <div style={{ fontSize: 12, color: 'rgba(165,180,252,0.5)', marginTop: 2 }}>เลือกตัวละครของคุณ</div>
          </div>

          {/* Big selected avatar preview */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 96, height: 96, borderRadius: 24,
              background: `${selectedColor}22`,
              border: `3px solid ${selectedColor}`,
              fontSize: 56,
              boxShadow: `0 0 32px ${selectedColor}44`,
              animation: 'popIn 0.3s ease',
            }}>
              {selectedAvatar}
            </div>
          </div>

          {/* Avatar grid — 4 cols × 3 rows */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>เลือกตัวละคร</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  style={{
                    padding: '12px 0',
                    borderRadius: 12,
                    border: `2px solid ${av === selectedAvatar ? selectedColor : 'rgba(255,255,255,0.1)'}`,
                    background: av === selectedAvatar ? `${selectedColor}22` : 'rgba(255,255,255,0.04)',
                    fontSize: 28, cursor: 'pointer',
                    transition: 'all 0.15s',
                    transform: av === selectedAvatar ? 'scale(1.12)' : 'scale(1)',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color dots — 2 rows of 5 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>เลือกสี</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: '50%',
                    border: `3px solid ${c === selectedColor ? '#fff' : 'transparent'}`,
                    background: c,
                    cursor: 'pointer',
                    boxShadow: c === selectedColor ? `0 0 16px ${c}` : 'none',
                    transform: c === selectedColor ? 'scale(1.18)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {joinError && (
            <div style={{ color: '#fca5a5', fontSize: 14, textAlign: 'center', fontWeight: 600, marginBottom: 12 }}>
              ⚠️ {joinError}
            </div>
          )}

          <button
            onClick={() => joinGame(selectedAvatar, selectedColor)}
            disabled={joining}
            style={{
              width: '100%', padding: '18px', borderRadius: 14, border: 'none',
              background: joining ? 'rgba(255,255,255,0.07)' : `linear-gradient(135deg,${selectedColor},${selectedColor}bb)`,
              color: '#fff', fontSize: 20, fontWeight: 900,
              cursor: joining ? 'not-allowed' : 'pointer', fontFamily: FONT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: joining ? 'none' : `0 0 32px ${selectedColor}44`,
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
            ) : `${selectedAvatar} เข้าร่วมเกม →`}
          </button>

          <button
            onClick={() => setScreen('join')}
            style={{
              width: '100%', marginTop: 10, padding: '10px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            ← ย้อนกลับ
          </button>
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
        minHeight: '100dvh', height: '100dvh', background: BG,
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
            borderRadius: 20, padding: '8px 20px', marginBottom: 24,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>ห้อง</span>
            <span style={{ color: '#a5b4fc', fontFamily: 'monospace', letterSpacing: 5, fontWeight: 900, fontSize: 20 }}>
              {myCode}
            </span>
          </div>

          {/* Big character display */}
          {myPlayer && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 80, height: 80, borderRadius: 20,
                background: `${myPlayer.color}22`,
                border: `3px solid ${myPlayer.color}`,
                fontSize: 44,
                boxShadow: `0 0 24px ${myPlayer.color}44`,
                marginBottom: 10,
              }}>
                {myPlayer.avatar}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `${myPlayer.color}22`,
                border: `1px solid ${myPlayer.color}60`,
                borderRadius: 14, padding: '6px 16px',
                display: 'block',
              }}>
                <span style={{ color: myPlayer.color, fontWeight: 900, fontSize: 18 }}>{myPlayer.name}</span>
              </div>
            </div>
          )}

          <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>
            เข้าร่วมแล้ว!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            รอ host เริ่มเกม
            <span style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
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
              borderRadius: 16, padding: '16px', textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                ผู้เล่น ({players.length})
              </div>
              {players.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
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
          : BG,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: FONT, textAlign: 'center', color: '#fff',
        overflowY: 'auto',
      }}>
        <style>{CSS}</style>

        <div style={{ animation: 'popIn 0.6s ease', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 88, animation: iWon ? 'bounce 1s ease infinite' : 'fadeIn 0.5s ease', marginBottom: 12 }}>
            {iWon ? '🏆' : '🎮'}
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 30, fontWeight: 900, color: iWon ? '#34d399' : '#f1f5f9' }}>
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

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '16px', textAlign: 'left', marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>อันดับสุดท้าย</div>
            {[...players].sort((a, b) => b.position - a.position).map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', width: 22, textAlign: 'center' }}>
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
                  {p.id === myPlayerId && (
                    <span style={{ fontSize: 11, color: 'rgba(165,180,252,0.5)', marginLeft: 4 }}>(คุณ)</span>
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
              setShowCard(false);
              setCodeInput(codeParam);
              setNameInput('');
              setSelectedAvatar(AVATARS[0]);
              setSelectedColor(COLORS[0]);
            }}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
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
  // PLAYING SCREEN — simplified, no mini board
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100dvh', height: '100dvh', background: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'stretch', fontFamily: FONT, color: '#fff',
      overflow: 'hidden', position: 'relative',
    }}>
      <style>{CSS}</style>

      {/* Players strip — horizontal chips */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.35)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {players.map((p, i) => (
          <div key={p.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: i === curIdx ? `${p.color}25` : 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${i === curIdx ? p.color : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 20, padding: '5px 10px',
            flexShrink: 0,
            transition: 'all 0.3s',
          }}>
            <span style={{ fontSize: 14 }}>{p.avatar}</span>
            <span style={{
              fontSize: 12, fontWeight: i === curIdx ? 900 : 600,
              color: i === curIdx ? '#fff' : 'rgba(255,255,255,0.55)',
              maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.name}</span>
            <span style={{
              fontSize: 10, color: i === curIdx ? p.color : 'rgba(255,255,255,0.35)',
              fontWeight: 700,
            }}>
              {p.position === 0 ? 'START' : p.position}
            </span>
            {i === curIdx && <span style={{ fontSize: 9, color: p.color }}>▶</span>}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 24px', gap: 20,
      }}>

        {/* Turn indicator */}
        <div style={{ textAlign: 'center' }}>
          {isMyTurn ? (
            <div style={{ fontSize: 22, fontWeight: 900, color: '#a5b4fc', animation: 'pulse 2s ease infinite' }}>
              ถึงตาคุณ! 🎲
            </div>
          ) : curPlayer ? (
            <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              รอ {curPlayer.name} {curPlayer.avatar} ทอย…
            </div>
          ) : null}
        </div>

        {/* BIG DICE BUTTON */}
        <button
          onClick={isMyTurn && !rolling ? rollDice : undefined}
          style={{
            width: 120, height: 120,
            borderRadius: 28,
            border: 'none',
            background: isMyTurn
              ? (rolling ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)')
              : 'rgba(255,255,255,0.04)',
            cursor: isMyTurn && !rolling ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 12,
            animation: isMyTurn && !rolling ? 'diceGlow 2s ease infinite' : 'none',
            opacity: isMyTurn ? 1 : 0.4,
            transition: 'opacity 0.3s',
          }}
        >
          <DiceFace
            value={rolling ? diceAnim : (rollResult?.rolled || diceAnim)}
            size={96}
            color={rolling ? '#4338ca' : '#6366f1'}
            rolling={rolling}
          />
        </button>

        {/* Hint under dice */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
          {isMyTurn
            ? (rolling ? 'กำลังทอย…' : 'แตะเพื่อทอยลูกเต๋า!')
            : 'รอผู้เล่นอื่น…'}
        </div>

        {/* My position badge */}
        {myPlayer && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${myPlayer.color}18`,
            border: `1px solid ${myPlayer.color}50`,
            borderRadius: 14, padding: '8px 18px',
          }}>
            <span style={{ fontSize: 18 }}>{myPlayer.avatar}</span>
            <span style={{ color: myPlayer.color, fontWeight: 900, fontSize: 15 }}>{myPlayer.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              ตำแหน่ง: ช่อง {myPlayer.position === 0 ? 'START' : myPlayer.position}
            </span>
          </div>
        )}
      </div>

      {/* EVENT CARD — slide-up modal overlay */}
      {showCard && rollResult && (
        <div
          onClick={() => { setShowCard(false); clearTimeout(cardTimerRef.current); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 50, padding: '0 16px 40px',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 380,
            background: rollResult.error ? 'linear-gradient(135deg,#450a0a,#7f1d1d)' : cardBg(),
            border: `2px solid ${rollResult.error ? 'rgba(239,68,68,0.5)' : cardBorder()}`,
            borderRadius: 24, padding: '28px 24px',
            textAlign: 'center',
            animation: 'cardSlideUp 0.35s ease',
          }}>
            {rollResult.error ? (
              <div style={{ color: '#f87171', fontSize: 18, fontWeight: 700 }}>
                ⚠️ {rollResult.error}
              </div>
            ) : (
              <>
                {/* Dice label */}
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                  🎲 ทอยได้ {rollResult.rolled}
                </div>
                {/* Big dice face */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <DiceFace value={rollResult.rolled} size={90} color={rollResult.msgColor || '#6366f1'} />
                </div>
                {/* Event message */}
                <div style={{
                  fontSize: 22, fontWeight: 900,
                  color: rollResult.msgColor || '#a5b4fc',
                  marginBottom: 10,
                }}>
                  {rollResult.msg}
                </div>
                {/* Position change */}
                {rollResult.event?.from !== undefined && rollResult.event?.to !== undefined && (
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                    ช่อง {rollResult.event.from} → ช่อง {rollResult.event.to}
                  </div>
                )}
                {myPlayer && (
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                    ตำแหน่งของคุณ: ช่อง {myPlayer.position}
                  </div>
                )}
                {/* Dismiss hint */}
                <div style={{
                  marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)',
                  animation: 'dotPulse 1.5s ease infinite',
                }}>
                  แตะเพื่อปิด
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

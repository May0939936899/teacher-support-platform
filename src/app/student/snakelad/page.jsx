'use client';
import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentSplash from '@/components/StudentSplash';

const FONT = "'Kanit','Noto Sans Thai',sans-serif";
const BG   = 'linear-gradient(160deg,#020918,#050f2a,#0a0520)';

// ── Avatars & Colors ──────────────────────────────────────────────────────────
const AVATARS = ['🐶','🐱','🐻','🦊','🐸','🦁','🐯','🐨','🐼','🦄','🐧','🦋'];
const COLORS  = [
  '#FF6B9D','#4ECDC4','#FFE66D','#A8E6CF','#DDA0DD',
  '#87CEEB','#FFA07A','#98FB98','#F08080','#9370DB',
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700;900&display=swap');
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }

  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes popIn      { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }
  @keyframes slideUp    { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUpBig { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes dotPulse   { 0%,100%{opacity:0.25;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
  @keyframes pulse3d    { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.4)} 50%{box-shadow:0 0 48px rgba(139,92,246,0.85), 0 0 80px rgba(99,102,241,0.3)} }
  @keyframes shake      { 0%,100%{transform:rotate(0deg)} 15%{transform:rotate(-18deg) scale(0.92)} 30%{transform:rotate(22deg) scale(1.06)} 45%{transform:rotate(-14deg) scale(0.95)} 60%{transform:rotate(18deg) scale(1.04)} 75%{transform:rotate(-10deg)} 90%{transform:rotate(8deg)} }
  @keyframes diceLand   { 0%{transform:scale(1.45) rotate(-12deg)} 35%{transform:scale(0.88) rotate(5deg)} 60%{transform:scale(1.1) rotate(-3deg)} 80%{transform:scale(0.97) rotate(1deg)} 100%{transform:scale(1) rotate(0deg)} }
  @keyframes bounce2    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes confetti2  { 0%{transform:translateY(-30px)rotate(0deg);opacity:1} 100%{transform:translateY(110vh)rotate(800deg);opacity:0} }
  @keyframes timerBar   { from{width:100%} to{width:0%} }
  @keyframes playerGlow { 0%,100%{filter:drop-shadow(0 0 4px currentColor)} 50%{filter:drop-shadow(0 0 12px currentColor)} }
  @keyframes trackIn    { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
  @keyframes myTurnFlash { 0%,100%{background:rgba(99,102,241,0.15)} 50%{background:rgba(99,102,241,0.35)} }
  @keyframes avatarPick  { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1.12)} }
  @keyframes cardFlipIn  { 0%{transform:perspective(700px) rotateY(-90deg);opacity:0} 100%{transform:perspective(700px) rotateY(0deg);opacity:1} }
  @keyframes cardMystery { 0%{transform:scale(0.8) translateY(60px);opacity:0} 60%{transform:scale(1.06) translateY(-4px)} 100%{transform:scale(1) translateY(0);opacity:1} }
  @keyframes questionPulse { 0%,100%{transform:scale(1);text-shadow:0 0 20px rgba(165,180,252,0.5)} 50%{transform:scale(1.12);text-shadow:0 0 40px rgba(165,180,252,1)} }
  @keyframes musicNote   { 0%{transform:translateY(0) rotate(-10deg);opacity:1} 100%{transform:translateY(-24px) rotate(15deg);opacity:0} }
`;

// ── Web Audio Sounds (no external deps) ──────────────────────────────────────
function playSound(type) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const tone = (freq, start, dur, wave = 'sine', vol = 0.18) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = wave;
      o.frequency.setValueAtTime(freq, ac.currentTime + start);
      g.gain.setValueAtTime(vol, ac.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
      o.start(ac.currentTime + start);
      o.stop(ac.currentTime + start + dur + 0.01);
    };
    const sweep = (f1, f2, start, dur, wave = 'sawtooth', vol = 0.2) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = wave;
      o.frequency.setValueAtTime(f1, ac.currentTime + start);
      o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + start + dur);
      g.gain.setValueAtTime(vol, ac.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
      o.start(ac.currentTime + start);
      o.stop(ac.currentTime + start + dur + 0.01);
    };

    if (type === 'roll') {
      // Rattling dice clicks
      [0, 0.07, 0.14, 0.21, 0.28, 0.35].forEach(t => tone(200 + Math.random()*400, t, 0.05, 'square', 0.09));
    } else if (type === 'land') {
      tone(260, 0, 0.12, 'triangle', 0.18);
    } else if (type === 'snake') {
      sweep(650, 100, 0, 0.65, 'sawtooth', 0.22);
      tone(150, 0.3, 0.4, 'square', 0.05);
    } else if (type === 'ladder') {
      [261, 329, 392, 523, 659].forEach((f, i) => tone(f, i * 0.1, 0.18, 'sine', 0.18));
    } else if (type === 'win') {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.13, 0.25, 'triangle', 0.22));
      setTimeout(() => {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.18, 'sine', 0.15));
      }, 800);
    } else if (type === 'event') {
      sweep(400, 800, 0, 0.15, 'sine', 0.14);
      tone(1000, 0.12, 0.12, 'sine', 0.1);
    } else if (type === 'extra') {
      [440, 880].forEach((f, i) => tone(f, i * 0.12, 0.15, 'triangle', 0.16));
    } else if (type === 'join') {
      [392, 523, 659].forEach((f, i) => tone(f, i * 0.12, 0.2, 'sine', 0.15));
    } else if (type === 'flip') {
      // Card flip whoosh
      sweep(200, 600, 0, 0.12, 'sine', 0.12);
      tone(800, 0.1, 0.1, 'sine', 0.08);
    } else if (type === 'mystery') {
      // Mystery card appear
      tone(440, 0, 0.15, 'triangle', 0.1);
      tone(554, 0.08, 0.12, 'triangle', 0.08);
    } else if (type === 'step') {
      // Soft footstep / tap on each square
      tone(380, 0, 0.04, 'sine', 0.07);
      tone(190, 0, 0.05, 'triangle', 0.04);
    }
    setTimeout(() => { try { ac.close(); } catch {} }, 3500);
  } catch { /* Web Audio not supported */ }
}

// ── Background music (Web Audio API looping melody) ──────────────────────────
function createBgMusic(theme) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    let stopped = false;
    const MELODIES = {
      funpark: { notes:[523,659,784,880,784,659,523,440], tempo:0.36, vol:0.025, wave:'triangle' },
      snow:    { notes:[440,494,523,494,440,415,370,415], tempo:0.62, vol:0.022, wave:'sine' },
      japan:   { notes:[330,370,415,494,415,370,330,294], tempo:0.52, vol:0.024, wave:'triangle' },
      forest:  { notes:[220,247,294,247,220,196,220,247], tempo:0.68, vol:0.020, wave:'sine' },
    };
    const m = MELODIES[theme] || MELODIES.funpark;
    let idx = 0;

    const playNote = () => {
      if (stopped) return;
      const freq = m.notes[idx % m.notes.length];
      const o = ac.createOscillator();
      const g = ac.createGain();
      const o2 = ac.createOscillator(); // harmonic
      const g2 = ac.createGain();
      o.type  = m.wave;
      o2.type = 'sine';
      o.frequency.setValueAtTime(freq, ac.currentTime);
      o2.frequency.setValueAtTime(freq * 2, ac.currentTime); // octave up, very soft
      g.gain.setValueAtTime(m.vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + m.tempo * 0.85);
      g2.gain.setValueAtTime(m.vol * 0.3, ac.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + m.tempo * 0.5);
      o.connect(g);   g.connect(ac.destination);
      o2.connect(g2); g2.connect(ac.destination);
      o.start(ac.currentTime);  o.stop(ac.currentTime + m.tempo);
      o2.start(ac.currentTime); o2.stop(ac.currentTime + m.tempo * 0.5);
      idx++;
      setTimeout(playNote, m.tempo * 1000);
    };

    playNote();
    return { stop: () => { stopped = true; try { ac.close(); } catch {} } };
  } catch {
    return { stop: () => {} };
  }
}

// ── Haptic feedback ──────────────────────────────────────────────────────────
function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
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

function DiceFace({ value, size = 100, color = '#6366f1' }) {
  const dots = DOT_POS[value] || DOT_POS[1];
  const dr = size * 0.088;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display:'block' }}>
      <defs>
        <linearGradient id={`ddg-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      {/* Outer cube */}
      <rect x={2} y={2} width={96} height={96} rx={22} fill={color} />
      {/* Gradient overlay */}
      <rect x={2} y={2} width={96} height={96} rx={22} fill={`url(#ddg-${value})`} />
      {/* Top-left shine */}
      <rect x={6} y={6} width={52} height={44} rx={13} fill="rgba(255,255,255,0.14)" />
      {/* Border */}
      <rect x={2} y={2} width={96} height={96} rx={22} fill="none"
        stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} />
      {/* Dots */}
      {dots.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx+1.2} cy={cy+1.2} r={dr*100/size*0.88} fill="rgba(0,0,0,0.3)" />
          <circle cx={cx} cy={cy} r={dr*100/size*0.88} fill="#fff" opacity={0.95} />
          <circle cx={cx-1} cy={cy-1} r={dr*100/size*0.3} fill="rgba(255,255,255,0.5)" />
        </g>
      ))}
    </svg>
  );
}

// ── Animated step-by-step movement hook ──────────────────────────────────────
// Walks each player's display position toward their real position, one square
// at a time, with `interval` ms between steps. Calls onStep on each tick.
function useAnimatedPositions(players, interval = 200, onStep) {
  const [, forceRender] = useState(0);
  const displayRef = useRef({});
  const timerRef   = useRef(null);

  useEffect(() => {
    // Initialize new players to their current position
    let initialized = false;
    players.forEach(p => {
      if (displayRef.current[p.id] === undefined) {
        displayRef.current[p.id] = p.position;
        initialized = true;
      }
    });
    if (initialized) forceRender(n => n + 1);

    // Check if any player needs animating
    const needsAnim = players.some(p => displayRef.current[p.id] !== p.position);
    if (!needsAnim || timerRef.current) return;

    const tick = () => {
      let stepped = false;
      let stillAnimating = false;
      players.forEach(p => {
        const cur = displayRef.current[p.id];
        if (cur !== undefined && cur !== p.position) {
          // Snake/ladder big jumps move 2 squares per tick (faster slide)
          const diff = Math.abs(p.position - cur);
          const stride = diff > 6 ? 2 : 1;
          const step = stride * (p.position > cur ? 1 : -1);
          let next = cur + step;
          if ((step > 0 && next > p.position) || (step < 0 && next < p.position)) {
            next = p.position;
          }
          displayRef.current[p.id] = next;
          stepped = true;
          if (next !== p.position) stillAnimating = true;
        }
      });
      if (stepped && onStep) onStep();
      forceRender(n => n + 1);

      if (stillAnimating) {
        timerRef.current = setTimeout(tick, interval);
      } else {
        timerRef.current = null;
      }
    };

    timerRef.current = setTimeout(tick, interval);
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [players, interval, onStep]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return displayRef.current;
}

// ════════════════════════════════════════════════════════════════════════════
// Inner component
// ════════════════════════════════════════════════════════════════════════════
function StudentSnakeLadderInner() {
  const searchParams = useSearchParams();
  const codeParam    = (searchParams.get('code') || '').toUpperCase();

  const [screen,         setScreen]         = useState('join');
  const [codeInput,      setCodeInput]      = useState(codeParam);
  const [nameInput,      setNameInput]      = useState('');
  const [joinError,      setJoinError]      = useState('');
  const [joining,        setJoining]        = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedColor,  setSelectedColor]  = useState(COLORS[0]);
  const [myCode,         setMyCode]         = useState('');
  const [myPlayerId,     setMyPlayerId]     = useState('');
  const [session,        setSession]        = useState(null);
  const [rolling,        setRolling]        = useState(false);
  const [diceAnim,       setDiceAnim]       = useState(1);
  const [landed,         setLanded]         = useState(false);
  const [rollResult,     setRollResult]     = useState(null);
  const [showCard,       setShowCard]       = useState(false);
  const [cardRevealed,   setCardRevealed]   = useState(false);
  const [musicOn,        setMusicOn]        = useState(false);
  const [showMusicNote,  setShowMusicNote]  = useState(false);

  const pollRef        = useRef(null);
  const animRef        = useRef(null);
  const cardTimerRef   = useRef(null);
  const revealTimerRef = useRef(null);
  const bgMusicRef     = useRef(null);

  // ── Poll ─────────────────────────────────────────────────────────────────
  const pollSession = useCallback(async (code) => {
    try {
      const res  = await fetch(`/api/teacher/snakelad?code=${code}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.session) {
        setSession(prev => {
          // Detect position change for sound on other player moves
          if (prev && data.session.phase === 'playing') {
            const prevPlayers = prev.players || [];
            const newPlayers  = data.session.players || [];
            newPlayers.forEach((np, i) => {
              const pp = prevPlayers[i];
              if (pp && np.position !== pp.position && np.id !== '') {
                // Subtle movement sound for others
              }
            });
          }
          return data.session;
        });
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
      clearTimeout(revealTimerRef.current);
      if (bgMusicRef.current) { bgMusicRef.current.stop(); bgMusicRef.current = null; }
    };
  }, []);

  // ── Card reveal timer: show ? card first, then flip ──────────────────────
  useEffect(() => {
    if (showCard && rollResult && !rollResult.error) {
      setCardRevealed(false);
      playSound('mystery');
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = setTimeout(() => {
        setCardRevealed(true);
        playSound('flip');
      }, 700);
    } else {
      setCardRevealed(false);
    }
    return () => clearTimeout(revealTimerRef.current);
  }, [showCard]); // eslint-disable-line

  // ── Background music toggle ───────────────────────────────────────────────
  useEffect(() => {
    const theme = session?.theme || 'funpark';
    if (musicOn && screen === 'playing') {
      if (!bgMusicRef.current) bgMusicRef.current = createBgMusic(theme);
    } else {
      if (bgMusicRef.current) { bgMusicRef.current.stop(); bgMusicRef.current = null; }
    }
  }, [musicOn, screen, session?.theme]);

  const startPolling = useCallback((code) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollSession(code), 2000);
  }, [pollSession]);

  useEffect(() => {
    if (session?.phase === 'playing'  && screen === 'waiting') setScreen('playing');
    if (session?.phase === 'finished' && screen !== 'finished') {
      setScreen('finished');
      clearInterval(pollRef.current);
    }
  }, [session, screen]);

  // Auto-enable background music when entering playing screen
  useEffect(() => {
    if (screen === 'playing' && !musicOn) {
      // Slight delay so it doesn't compete with join sound
      const t = setTimeout(() => setMusicOn(true), 600);
      return () => clearTimeout(t);
    }
  }, [screen]); // eslint-disable-line

  // ── Step 1: go to character screen ───────────────────────────────────────
  const goToCharacter = () => {
    const code = codeInput.trim().toUpperCase();
    const name = nameInput.trim();
    if (code.length < 4) { setJoinError('กรุณากรอกรหัสห้อง'); return; }
    if (!name)           { setJoinError('กรุณากรอกชื่อของคุณ'); return; }
    setJoinError('');
    setScreen('character');
  };

  // ── Step 2: join with avatar & color ─────────────────────────────────────
  const joinGame = async (avatar, color) => {
    const code = codeInput.trim().toUpperCase();
    const name = nameInput.trim();
    setJoining(true); setJoinError('');
    try {
      const res  = await fetch('/api/teacher/snakelad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code, name, avatar, color }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || 'เข้าร่วมไม่ได้'); setScreen('join'); setJoining(false); return; }

      const pid = data.playerId;
      setMyPlayerId(pid);
      try { localStorage.setItem('snaklad_pid', pid); } catch {}
      setMyCode(code);
      setSession(data.session);
      setScreen('waiting');
      startPolling(code);
      playSound('join');
    } catch {
      setJoinError('เชื่อมต่อไม่ได้ — ลองใหม่อีกครั้ง');
      setScreen('join');
    } finally { setJoining(false); }
  };

  // ── Roll dice ─────────────────────────────────────────────────────────────
  const rollDice = async () => {
    if (rolling) return;
    setRolling(true);
    setLanded(false);
    setShowCard(false);
    setRollResult(null);
    clearTimeout(cardTimerRef.current);

    // Haptic + sound
    vibrate([30, 10, 30]);
    playSound('roll');

    // Rapid number animation
    let frame = 0;
    clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      setDiceAnim(Math.floor(Math.random() * 6) + 1);
      frame++;
      if (frame > 12) clearInterval(animRef.current);
    }, 70);

    try {
      const res  = await fetch('/api/teacher/snakelad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'roll', code: myCode, playerId: myPlayerId }),
      });
      const data = await res.json();
      clearInterval(animRef.current);

      if (!res.ok) {
        setDiceAnim(1); setRolling(false);
        setRollResult({ error: data.error || 'ลองใหม่' });
        setShowCard(true);
        return;
      }

      const { session: newSession, rolled, event } = data;
      setDiceAnim(rolled);
      setSession(newSession);

      // Land animation
      setLanded(true);
      setTimeout(() => setLanded(false), 600);

      // Sound based on event
      if (event?.type === 'snake')       { playSound('snake');  vibrate([50, 20, 50, 20, 80]); }
      else if (event?.type === 'ladder') { playSound('ladder'); vibrate([30, 10, 60]); }
      else if (event?.type === 'win')    { playSound('win');    vibrate([100, 50, 100, 50, 200]); }
      else if (event?.type === 'extra_roll') { playSound('extra'); vibrate([40]); }
      else if (event?.type === 'forward' || event?.type === 'backward') { playSound('event'); vibrate([30]); }
      else { playSound('land'); vibrate([20]); }

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
      cardTimerRef.current = setTimeout(() => setShowCard(false), 3500);

      if (newSession.phase === 'finished') { setScreen('finished'); clearInterval(pollRef.current); }
    } catch {
      clearInterval(animRef.current);
      setRollResult({ error: 'เชื่อมต่อไม่ได้' });
      setShowCard(true);
    } finally { setRolling(false); }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const players   = session?.players || [];
  const curIdx    = session?.currentPlayerIdx ?? 0;
  const curPlayer = players[curIdx] || null;
  const myPlayer  = players.find(p => p.id === myPlayerId);
  const isMyTurn  = curPlayer?.id === myPlayerId;

  // ── Animated step-by-step positions for race track ───────────────────────
  const onStep = useCallback(() => playSound('step'), []);
  const animatedPositions = useAnimatedPositions(players, 200, onStep);

  const cardBg = () => {
    if (!rollResult?.event) return 'linear-gradient(160deg,#1e1b4b,#312e81)';
    const t = rollResult.event.type;
    if (t === 'snake')  return 'linear-gradient(160deg,#450a0a,#7f1d1d)';
    if (t === 'ladder') return 'linear-gradient(160deg,#052e16,#14532d)';
    if (t === 'win')    return 'linear-gradient(160deg,#451a03,#78350f)';
    if (t === 'extra_roll') return 'linear-gradient(160deg,#3d2000,#92400e)';
    return 'linear-gradient(160deg,#1e1b4b,#312e81)';
  };
  const cardBorder = () => {
    if (!rollResult?.event) return 'rgba(99,102,241,0.55)';
    const t = rollResult.event.type;
    if (t === 'snake')      return 'rgba(239,68,68,0.6)';
    if (t === 'ladder')     return 'rgba(34,197,94,0.6)';
    if (t === 'win')        return 'rgba(251,191,36,0.7)';
    if (t === 'extra_roll') return 'rgba(245,158,11,0.65)';
    return 'rgba(99,102,241,0.55)';
  };
  const cardIcon = () => {
    if (!rollResult?.event) return null;
    const t = rollResult.event.type;
    if (t === 'snake')      return '🐍';
    if (t === 'ladder')     return '🪜';
    if (t === 'win')        return '🏆';
    if (t === 'extra_roll') return '🎲';
    if (t === 'forward')    return '⭐';
    if (t === 'backward')   return '💀';
    if (t === 'skip')       return '😴';
    return '🎯';
  };

  // Confetti (for finish)
  const confetti = useMemo(() =>
    Array.from({ length: 28 }).map((_, i) => ({
      left:  `${(i * 41 + 3) % 100}%`,
      delay: `${(i * 0.15) % 3}s`,
      dur:   `${2.5 + (i * 0.21) % 2}s`,
      color: ['#FF6B9D','#FFD93D','#6BCB77','#4D96FF','#FF6B6B','#C77DFF','#fbbf24'][i % 7],
      shape: i % 3 === 0 ? '50%' : '0',
    })),
    []
  );

  // ══════════════════════════════════════════════════════════════════════════
  // JOIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'join') {
    return (
      <div style={{
        minHeight:'100dvh', height:'100dvh', background:BG,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'24px 20px', fontFamily:FONT, overflowY:'auto',
      }}>
        <style>{CSS}</style>
        <div style={{ width:'100%', maxWidth:370, animation:'slideUp 0.5s ease' }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:72, marginBottom:10, filter:'drop-shadow(0 0 28px rgba(99,102,241,0.7))' }}>🎲</div>
            <h1 style={{ margin:'0 0 4px', fontSize:32, fontWeight:900, color:'#fff', letterSpacing:1 }}>
              บันไดงู
            </h1>
            <p style={{ color:'rgba(165,180,252,0.45)', fontSize:12, margin:0, letterSpacing:4 }}>
              SNAKE &amp; LADDER
            </p>
          </div>

          <div style={{
            background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:22, padding:'24px 20px',
            display:'flex', flexDirection:'column', gap:14,
            backdropFilter:'blur(12px)',
          }}>
            {/* Code input */}
            <div>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:8, letterSpacing:1 }}>
                รหัสห้องเกม
              </label>
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')); setJoinError(''); }}
                onKeyDown={e => e.key === 'Enter' && goToCharacter()}
                placeholder="XXXXXX"
                maxLength={8}
                autoFocus
                style={{
                  width:'100%', padding:'16px', borderRadius:14,
                  border:`2px solid ${joinError ? '#f87171' : codeInput.length >= 4 ? '#a5b4fc' : 'rgba(255,255,255,0.12)'}`,
                  background:'rgba(0,0,0,0.4)', color:'#fff',
                  fontSize:30, fontWeight:900, textAlign:'center', letterSpacing:10,
                  fontFamily:"'Courier New',monospace", outline:'none',
                  transition:'border-color 0.2s', caretColor:'#a5b4fc',
                }}
              />
            </div>

            {/* Name input */}
            <div>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:8, letterSpacing:1 }}>
                ชื่อของคุณ
              </label>
              <input
                value={nameInput}
                onChange={e => { setNameInput(e.target.value.slice(0,20)); setJoinError(''); }}
                onKeyDown={e => e.key === 'Enter' && goToCharacter()}
                placeholder="ใส่ชื่อของคุณ"
                maxLength={20}
                style={{
                  width:'100%', padding:'15px', borderRadius:14,
                  border:`2px solid ${nameInput.trim() ? 'rgba(165,180,252,0.55)' : 'rgba(255,255,255,0.12)'}`,
                  background:'rgba(0,0,0,0.4)', color:'#fff',
                  fontSize:18, fontWeight:700, textAlign:'center',
                  fontFamily:FONT, outline:'none',
                  transition:'border-color 0.2s', caretColor:'#a5b4fc',
                }}
              />
            </div>

            {joinError && (
              <div style={{ color:'#fca5a5', fontSize:14, textAlign:'center', fontWeight:600 }}>
                ⚠️ {joinError}
              </div>
            )}

            <button
              onClick={goToCharacter}
              disabled={codeInput.length < 4 || !nameInput.trim()}
              style={{
                width:'100%', padding:'17px', borderRadius:14, border:'none',
                background: codeInput.length >= 4 && nameInput.trim()
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : 'rgba(255,255,255,0.07)',
                color: codeInput.length >= 4 && nameInput.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize:18, fontWeight:900,
                cursor: codeInput.length >= 4 && nameInput.trim() ? 'pointer' : 'not-allowed',
                fontFamily:FONT,
                boxShadow: codeInput.length >= 4 && nameInput.trim() ? '0 0 32px rgba(99,102,241,0.5)' : 'none',
                transition:'all 0.25s',
              }}
            >
              ถัดไป →
            </button>
          </div>

          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:12, marginTop:18 }}>
            📱 หรือสแกน QR Code บนจอหน้าห้อง
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CHARACTER SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'character') {
    return (
      <div style={{
        minHeight:'100dvh', background:BG,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'flex-start',
        padding:'24px 20px 32px', fontFamily:FONT, color:'#fff', overflowY:'auto',
      }}>
        <style>{CSS}</style>
        <div style={{ width:'100%', maxWidth:400, animation:'slideUp 0.4s ease' }}>
          <div style={{ textAlign:'center', marginBottom:18 }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>สวัสดี!</div>
            <div style={{ fontSize:26, fontWeight:900 }}>{nameInput.trim()}</div>
            <div style={{ fontSize:13, color:'rgba(165,180,252,0.55)', marginTop:2 }}>สร้างตัวละครของคุณ</div>
          </div>

          {/* Big preview */}
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width:100, height:100, borderRadius:26,
              background:`${selectedColor}22`, border:`3px solid ${selectedColor}`,
              fontSize:60, boxShadow:`0 0 40px ${selectedColor}55`,
              animation:'popIn 0.3s ease',
            }}>
              {selectedAvatar}
            </div>
          </div>

          {/* Avatar grid */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:10, letterSpacing:1 }}>
              เลือกตัวละคร
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {AVATARS.map(av => (
                <button key={av} onClick={() => {
                  setSelectedAvatar(av);
                  vibrate([15]);
                }} style={{
                  padding:'13px 0', borderRadius:14,
                  border:`2px solid ${av === selectedAvatar ? selectedColor : 'rgba(255,255,255,0.1)'}`,
                  background: av === selectedAvatar ? `${selectedColor}22` : 'rgba(255,255,255,0.04)',
                  fontSize:30, cursor:'pointer',
                  transition:'all 0.18s',
                  transform: av === selectedAvatar ? 'scale(1.14)' : 'scale(1)',
                  animation: av === selectedAvatar ? 'avatarPick 0.3s ease' : 'none',
                }}>
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color dots */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:10, letterSpacing:1 }}>
              เลือกสี
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => {
                  setSelectedColor(c);
                  vibrate([10]);
                }} style={{
                  width:'100%', aspectRatio:'1', borderRadius:'50%',
                  border:`3px solid ${c === selectedColor ? '#fff' : 'transparent'}`,
                  background:c, cursor:'pointer',
                  boxShadow: c === selectedColor ? `0 0 18px ${c}, 0 0 32px ${c}55` : 'none',
                  transform: c === selectedColor ? 'scale(1.22)' : 'scale(1)',
                  transition:'all 0.18s',
                }} />
              ))}
            </div>
          </div>

          {joinError && (
            <div style={{ color:'#fca5a5', fontSize:14, textAlign:'center', fontWeight:600, marginBottom:12 }}>
              ⚠️ {joinError}
            </div>
          )}

          <button
            onClick={() => joinGame(selectedAvatar, selectedColor)}
            disabled={joining}
            style={{
              width:'100%', padding:'19px', borderRadius:16, border:'none',
              background: joining
                ? 'rgba(255,255,255,0.07)'
                : `linear-gradient(135deg,${selectedColor}ee,${selectedColor}88)`,
              color:'#fff', fontSize:20, fontWeight:900,
              cursor: joining ? 'not-allowed' : 'pointer', fontFamily:FONT,
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              boxShadow: joining ? 'none' : `0 0 36px ${selectedColor}55`,
              transition:'all 0.25s',
            }}
          >
            {joining ? (
              <>
                <span style={{
                  width:20, height:20, border:'2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor:'#fff', borderRadius:'50%',
                  animation:'spin 0.7s linear infinite', display:'inline-block',
                }} />
                กำลังเชื่อมต่อ…
              </>
            ) : `${selectedAvatar} เข้าร่วมเกม!`}
          </button>

          <button onClick={() => setScreen('join')} style={{
            width:'100%', marginTop:10, padding:'11px', borderRadius:12,
            border:'1px solid rgba(255,255,255,0.1)', background:'transparent',
            color:'rgba(255,255,255,0.4)', fontSize:14, cursor:'pointer', fontFamily:FONT,
          }}>
            ← ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WAITING SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'waiting') {
    return (
      <div style={{
        minHeight:'100dvh', height:'100dvh', background:BG,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:24, fontFamily:FONT, textAlign:'center', color:'#fff',
      }}>
        <style>{CSS}</style>
        <div style={{ animation:'slideUp 0.5s ease', width:'100%', maxWidth:380 }}>
          {/* Room badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.4)',
            borderRadius:20, padding:'8px 22px', marginBottom:24,
          }}>
            <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11, letterSpacing:2 }}>ห้อง</span>
            <span style={{ color:'#a5b4fc', fontFamily:'monospace', letterSpacing:6, fontWeight:900, fontSize:22 }}>
              {myCode}
            </span>
          </div>

          {/* My character display */}
          {myPlayer && (
            <div style={{ marginBottom:18 }}>
              <div style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:88, height:88, borderRadius:22,
                background:`${myPlayer.color}22`, border:`3px solid ${myPlayer.color}`,
                fontSize:50, boxShadow:`0 0 32px ${myPlayer.color}55`, marginBottom:10,
              }}>
                {myPlayer.avatar}
              </div>
              <div>
                <span style={{ color:myPlayer.color, fontWeight:900, fontSize:20 }}>{myPlayer.name}</span>
              </div>
            </div>
          )}

          <h2 style={{ color:'#f1f5f9', fontSize:20, fontWeight:900, margin:'0 0 4px' }}>
            เข้าร่วมแล้ว! ✅
          </h2>
          <div style={{
            color:'rgba(255,255,255,0.4)', fontSize:14, margin:'0 0 24px',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            รอ host เริ่มเกม
            {[0,1,2].map(i => (
              <span key={i} style={{
                width:6, height:6, borderRadius:'50%', background:'rgba(165,180,252,0.6)',
                display:'inline-block', animation:`dotPulse 1.4s ${i*0.22}s ease infinite`,
              }} />
            ))}
          </div>

          {players.length > 0 && (
            <div style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:18, padding:16, textAlign:'left',
            }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:10, letterSpacing:1 }}>
                ผู้เล่มทั้งหมด ({players.length})
              </div>
              {players.map(p => (
                <div key={p.id} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 0',
                  borderBottom:'1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize:20 }}>{p.avatar}</span>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                  <span style={{
                    color: p.id === myPlayerId ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontWeight: p.id === myPlayerId ? 800 : 500,
                    fontSize:15, flex:1,
                  }}>
                    {p.name}
                    {p.id === myPlayerId && (
                      <span style={{ fontSize:11, color:'rgba(165,180,252,0.55)', marginLeft:6 }}>(คุณ)</span>
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

  // ══════════════════════════════════════════════════════════════════════════
  // FINISHED SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'finished') {
    const winnerName   = session?.winner;
    const winnerPlayer = players.find(p => p.name === winnerName) || players.find(p => p.position === 100);
    const iWon         = winnerPlayer?.id === myPlayerId;

    return (
      <div style={{
        minHeight:'100dvh', height:'100dvh',
        background: iWon ? 'linear-gradient(160deg,#071a0f,#0d2b1a)' : BG,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:24, fontFamily:FONT, textAlign:'center', color:'#fff', overflowY:'auto',
      }}>
        <style>{CSS}</style>
        {iWon && confetti.map((c, i) => (
          <div key={i} style={{
            position:'fixed', left:c.left, top:'-30px',
            width:11, height:11, borderRadius:c.shape, background:c.color,
            animation:`confetti2 ${c.dur} ${c.delay} linear infinite`, zIndex:0,
          }} />
        ))}

        <div style={{ animation:'popIn 0.55s ease', maxWidth:360, width:'100%', position:'relative', zIndex:1 }}>
          <div style={{
            fontSize:88,
            animation: iWon ? 'bounce2 1s ease infinite' : 'fadeIn 0.5s ease',
            marginBottom:14,
            filter: iWon ? 'drop-shadow(0 0 24px rgba(251,191,36,0.7))' : 'none',
          }}>
            {iWon ? '🏆' : '🎮'}
          </div>
          <h2 style={{ margin:'0 0 10px', fontSize:30, fontWeight:900, color: iWon ? '#fbbf24' : '#f1f5f9' }}>
            {iWon ? 'คุณชนะ! 🎉' : 'เกมจบแล้ว'}
          </h2>

          {winnerPlayer && !iWon && (
            <div style={{ marginBottom:16 }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:15, margin:'0 0 4px' }}>ผู้ชนะคือ</p>
              <span style={{ fontSize:22, fontWeight:900, color:winnerPlayer.color }}>
                {winnerPlayer.avatar} {winnerPlayer.name}
              </span>
            </div>
          )}
          {iWon && (
            <p style={{ color:'rgba(251,191,36,0.8)', fontSize:15, margin:'0 0 18px' }}>
              ยินดีด้วย! คุณถึงช่อง 100 แล้ว! 🎯
            </p>
          )}

          <div style={{
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:18, padding:16, textAlign:'left', marginBottom:22,
          }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:10, letterSpacing:1 }}>
              อันดับสุดท้าย
            </div>
            {[...players].sort((a,b) => b.position - a.position).map((p, i) => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                borderBottom: i < players.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.4)', width:22, textAlign:'center' }}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                </span>
                <span style={{ fontSize:18 }}>{p.avatar}</span>
                <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                <span style={{
                  flex:1, fontSize:14,
                  color: p.name===winnerName ? p.color : 'rgba(255,255,255,0.7)',
                  fontWeight: p.name===winnerName ? 900 : 500,
                }}>
                  {p.name}
                  {p.id===myPlayerId && <span style={{ fontSize:11, color:'rgba(165,180,252,0.5)', marginLeft:4 }}>(คุณ)</span>}
                  {p.name===winnerName && ' 🏆'}
                </span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>ช่อง {p.position}</span>
              </div>
            ))}
          </div>

          <button onClick={() => {
            setScreen('join'); setMyCode(''); setSession(null);
            setRollResult(null); setShowCard(false);
            setCodeInput(codeParam); setNameInput('');
            setSelectedAvatar(AVATARS[0]); setSelectedColor(COLORS[0]);
          }} style={{
            width:'100%', padding:17, borderRadius:14, border:'none',
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color:'#fff', fontSize:18, fontWeight:900, cursor:'pointer', fontFamily:FONT,
            boxShadow:'0 0 32px rgba(99,102,241,0.45)',
          }}>
            🎲 เล่นใหม่
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight:'100dvh', height:'100dvh', background:BG,
      display:'flex', flexDirection:'column',
      fontFamily:FONT, color:'#fff', overflow:'hidden', position:'relative',
    }}>
      <style>{CSS}</style>

      {/* ── Top header: room + info ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px',
        background:'rgba(0,0,0,0.4)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>🎲</span>
          <div style={{
            background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.35)',
            borderRadius:10, padding:'3px 12px',
            fontFamily:'monospace', letterSpacing:4, fontSize:16, fontWeight:900, color:'#a5b4fc',
          }}>{myCode}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Music toggle */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => {
                const next = !musicOn;
                setMusicOn(next);
                if (next) { setShowMusicNote(true); setTimeout(() => setShowMusicNote(false), 1200); }
                vibrate([10]);
              }}
              style={{
                width:36, height:36, borderRadius:'50%',
                border:`1px solid ${musicOn ? 'rgba(165,180,252,0.6)' : 'rgba(255,255,255,0.15)'}`,
                background: musicOn ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)',
                color: musicOn ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.2s',
              }}
            >
              {musicOn ? '🎵' : '🔇'}
            </button>
            {showMusicNote && (
              <div style={{
                position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)',
                fontSize:14, animation:'musicNote 1.2s ease forwards', pointerEvents:'none',
              }}>🎵</div>
            )}
          </div>
          {myPlayer && (
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:18 }}>{myPlayer.avatar}</span>
              <div style={{ width:9, height:9, borderRadius:'50%', background:myPlayer.color }} />
              <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{myPlayer.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Race Track ── */}
      <div style={{
        padding:'10px 16px',
        background:'rgba(0,0,0,0.25)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:1 }}>
            RACE TRACK
          </span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>
            {players.length} ผู้เล่ม
          </span>
        </div>
        <div style={{
          position:'relative', height:38,
          background:'rgba(255,255,255,0.06)',
          borderRadius:12, overflow:'hidden',
          border:'1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Track lane marks */}
          {[10,20,30,40,50,60,70,80,90].map(pct => (
            <div key={pct} style={{
              position:'absolute', left:`${pct}%`, top:0, bottom:0,
              width:1, background:'rgba(255,255,255,0.05)',
            }} />
          ))}
          {/* START label */}
          <div style={{ position:'absolute', left:4, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:700 }}>S</div>
          {/* GOAL */}
          <div style={{ position:'absolute', right:3, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🏁</div>
          {/* Player tokens on track — animated position */}
          {players.map((p) => {
            const animPos = animatedPositions[p.id] ?? p.position;
            const pct = Math.max(2, Math.min(90, (animPos / 100) * 90));
            const isMine = p.id === myPlayerId;
            const isMoving = animPos !== p.position;
            return (
              <div key={p.id} style={{
                position:'absolute',
                left:`${pct}%`,
                top:'50%',
                transform: `translate(-50%,-50%) ${isMoving ? 'translateY(-3px)' : ''}`,
                fontSize: isMine ? 22 : 18,
                transition:'left 0.18s linear, transform 0.15s ease',
                zIndex: isMine ? 3 : 2,
                filter: isMine
                  ? `drop-shadow(0 0 8px ${p.color}) drop-shadow(0 0 3px ${p.color})`
                  : `drop-shadow(0 1px 3px rgba(0,0,0,0.5))`,
              }}>
                {p.avatar}
              </div>
            );
          })}
        </div>
        {/* Position labels */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, paddingLeft:2, paddingRight:2 }}>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>0</span>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>50</span>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>100</span>
        </div>
      </div>

      {/* ── Players strip ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        padding:'8px 14px',
        background:'rgba(0,0,0,0.2)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        flexShrink:0, overflowX:'auto',
      }}>
        {players.map((p, i) => (
          <div key={p.id} style={{
            display:'inline-flex', alignItems:'center', gap:5,
            background: i===curIdx ? `${p.color}28` : 'rgba(255,255,255,0.05)',
            border:`1.5px solid ${i===curIdx ? p.color : 'rgba(255,255,255,0.1)'}`,
            borderRadius:20, padding:'5px 10px', flexShrink:0,
            transition:'all 0.4s',
          }}>
            <span style={{ fontSize:14 }}>{p.avatar}</span>
            <span style={{
              fontSize:12, fontWeight: i===curIdx?900:600,
              color: i===curIdx?'#fff':'rgba(255,255,255,0.5)',
              maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{p.name}</span>
            <span style={{
              fontSize:11, fontWeight:700,
              color: i===curIdx ? p.color : 'rgba(255,255,255,0.3)',
            }}>
              {p.position===0?'S':p.position}
            </span>
            {i===curIdx && (
              <span style={{ fontSize:9, color:p.color, animation:'dotPulse 1s ease infinite' }}>▶</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Main: turn + dice ── */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'16px 24px', gap:20,
      }}>

        {/* Turn indicator */}
        <div style={{
          textAlign:'center',
          padding:'12px 28px', borderRadius:20,
          background: isMyTurn ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
          border:`1px solid ${isMyTurn ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
          animation: isMyTurn ? 'myTurnFlash 2s ease infinite' : 'none',
          minWidth:220,
        }}>
          {isMyTurn ? (
            <div style={{ fontSize:22, fontWeight:900, color:'#c4b5fd' }}>
              ✨ ถึงตาคุณแล้ว! ✨
            </div>
          ) : curPlayer ? (
            <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.55)' }}>
              {curPlayer.avatar} รอ {curPlayer.name} ทอย…
            </div>
          ) : null}
        </div>

        {/* 3D Dice Button */}
        <div style={{
          animation: rolling ? 'shake 0.3s ease infinite' : (landed ? 'diceLand 0.55s ease' : 'none'),
        }}>
          <button
            onClick={isMyTurn && !rolling ? rollDice : undefined}
            style={{
              width:130, height:130, borderRadius:30, border:'none',
              background: isMyTurn
                ? (rolling ? 'rgba(255,255,255,0.07)' : 'linear-gradient(145deg,#4f46e5,#7c3aed)')
                : 'rgba(255,255,255,0.04)',
              cursor: isMyTurn && !rolling ? 'pointer' : 'default',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:14,
              animation: isMyTurn && !rolling ? 'pulse3d 2.5s ease infinite' : 'none',
              opacity: isMyTurn ? 1 : 0.38,
              transition:'opacity 0.4s, transform 0.15s',
              transform: isMyTurn && !rolling ? 'scale(1)' : 'scale(0.95)',
              boxShadow: isMyTurn && !rolling
                ? '0 12px 40px rgba(99,102,241,0.55), 0 4px 12px rgba(0,0,0,0.4)'
                : '0 4px 16px rgba(0,0,0,0.4)',
            }}
            onTouchStart={() => {
              if (isMyTurn && !rolling) {
                vibrate([10]);
              }
            }}
          >
            <DiceFace
              value={rolling ? diceAnim : (rollResult?.rolled || diceAnim)}
              size={102}
              color={rolling ? '#3730a3' : '#4f46e5'}
            />
          </button>
        </div>

        {/* Hint text */}
        <div style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.45)', textAlign:'center' }}>
          {isMyTurn
            ? (rolling ? '🎲 กำลังทอย…' : '👆 แตะลูกเต๋าเพื่อทอย!')
            : '⌛ รอผู้เล่นอื่น…'}
        </div>

        {/* My position badge */}
        {myPlayer && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:10,
            background:`${myPlayer.color}18`, border:`1px solid ${myPlayer.color}55`,
            borderRadius:16, padding:'9px 20px',
          }}>
            <span style={{ fontSize:20 }}>{myPlayer.avatar}</span>
            <span style={{ color:myPlayer.color, fontWeight:900, fontSize:15 }}>{myPlayer.name}</span>
            <span style={{ color:'rgba(255,255,255,0.55)', fontSize:13 }}>
              ช่อง {myPlayer.position === 0 ? 'เริ่มต้น' : myPlayer.position}
            </span>
            {myPlayer.position > 0 && (
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>
                / 100
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── EVENT CARD OVERLAY ── */}
      {showCard && rollResult && (
        <div
          onClick={() => { setShowCard(false); clearTimeout(cardTimerRef.current); clearTimeout(revealTimerRef.current); }}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.7)',
            display:'flex', alignItems:'flex-end', justifyContent:'center',
            zIndex:50, padding:'0 16px 44px',
          }}
        >
          {/* ── MYSTERY CARD (? face — before reveal) ── */}
          {!cardRevealed && !rollResult.error && (
            <div style={{
              width:'100%', maxWidth:400,
              background:'linear-gradient(160deg,#1e1b4b,#312e81)',
              border:'2.5px solid rgba(165,180,252,0.55)',
              borderRadius:28, padding:'36px 24px',
              textAlign:'center',
              animation:'cardMystery 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow:'0 -8px 60px rgba(99,102,241,0.5)',
            }}>
              {/* Card back pattern */}
              <div style={{
                width:80, height:80, borderRadius:20,
                background:'linear-gradient(135deg,rgba(165,180,252,0.2),rgba(99,102,241,0.4))',
                border:'2px solid rgba(165,180,252,0.3)',
                margin:'0 auto 20px',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <div style={{
                  fontSize:48, fontWeight:900, color:'rgba(165,180,252,0.9)',
                  animation:'questionPulse 0.8s ease infinite',
                }}>?</div>
              </div>
              <div style={{ fontSize:16, fontWeight:900, color:'rgba(165,180,252,0.7)' }}>
                🎴 กำลังเปิดการ์ด...
              </div>
              <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:10 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width:6, height:6, borderRadius:'50%', background:'rgba(165,180,252,0.5)',
                    display:'inline-block', animation:`dotPulse 0.9s ${i*0.15}s ease infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* ── REVEALED CARD ── */}
          {(cardRevealed || rollResult.error) && (
            <div style={{
              width:'100%', maxWidth:400,
              background: rollResult.error ? 'linear-gradient(160deg,#450a0a,#7f1d1d)' : cardBg(),
              border:`2.5px solid ${rollResult.error ? 'rgba(239,68,68,0.55)' : cardBorder()}`,
              borderRadius:28, padding:'28px 24px 24px',
              textAlign:'center',
              animation: rollResult.error ? 'slideUpBig 0.38s ease' : 'cardFlipIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow:`0 -8px 60px ${rollResult.error ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.6)'}`,
            }}>
            {rollResult.error ? (
              <div>
                <div style={{ fontSize:42, marginBottom:10 }}>⚠️</div>
                <div style={{ color:'#f87171', fontSize:18, fontWeight:700 }}>{rollResult.error}</div>
              </div>
            ) : (
              <>
                {/* Card icon */}
                {cardIcon() && (
                  <div style={{
                    fontSize:60, marginBottom:10,
                    filter:`drop-shadow(0 0 20px ${rollResult.msgColor}aa)`,
                    animation:'bounce2 1s ease infinite',
                  }}>
                    {cardIcon()}
                  </div>
                )}
                {/* Dice number */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:16,
                }}>
                  <DiceFace value={rollResult.rolled} size={76} color={rollResult.msgColor || '#6366f1'} />
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>ทอยได้</div>
                    <div style={{ fontSize:48, fontWeight:900, color:rollResult.msgColor||'#a5b4fc', lineHeight:1 }}>
                      {rollResult.rolled}
                    </div>
                  </div>
                </div>
                {/* Event message */}
                <div style={{
                  fontSize:22, fontWeight:900, color:rollResult.msgColor||'#a5b4fc',
                  marginBottom:10, textShadow:`0 0 24px ${rollResult.msgColor}66`,
                  lineHeight:1.3,
                }}>
                  {rollResult.msg}
                </div>
                {/* Position change arrow */}
                {rollResult.event?.from !== undefined && rollResult.event?.to !== undefined && (
                  <div style={{
                    fontSize:16, color:'rgba(255,255,255,0.65)', marginBottom:10,
                    background:'rgba(0,0,0,0.3)', borderRadius:12, padding:'8px 16px', display:'inline-flex',
                    alignItems:'center', gap:8,
                  }}>
                    <span>ช่อง {rollResult.event.from}</span>
                    <span style={{ fontSize:20 }}>→</span>
                    <span style={{ fontWeight:900, color:'#fff', fontSize:18 }}>ช่อง {rollResult.event.to}</span>
                  </div>
                )}
                {myPlayer && (
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>
                    ตำแหน่งปัจจุบัน: ช่อง <strong style={{ color:'#fff', fontSize:16 }}>{myPlayer.position}</strong>
                    <span style={{ color:'rgba(255,255,255,0.3)' }}> / 100</span>
                  </div>
                )}
                {/* Auto-dismiss timer bar */}
                <div style={{
                  height:4, borderRadius:2, background:'rgba(255,255,255,0.1)',
                  marginTop:20, overflow:'hidden',
                }}>
                  <div style={{
                    height:'100%', borderRadius:2,
                    background: `linear-gradient(to right,${rollResult.msgColor||'#a5b4fc'},${rollResult.msgColor||'#a5b4fc'}88)`,
                    animation:'timerBar 3.5s linear forwards',
                    boxShadow:`0 0 8px ${rollResult.msgColor}66`,
                  }} />
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:8 }}>
                  แตะที่ไหนก็ได้เพื่อปิด
                </div>
              </>
            )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Suspense wrapper
// ════════════════════════════════════════════════════════════════════════════
export default function StudentSnakeLadderPage() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <>
      {showSplash && <StudentSplash duration={2200} onFinish={() => setShowSplash(false)} />}
      <Suspense fallback={
        <div style={{
          height:'100dvh', minHeight:'100vh',
          background:'linear-gradient(160deg,#020918,#050f2a,#0a0520)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'Kanit',sans-serif",
        }}>
          <span style={{ color:'rgba(255,255,255,0.35)', fontSize:16 }}>กำลังโหลด…</span>
        </div>
      }>
        <StudentSnakeLadderInner />
      </Suspense>
    </>
  );
}

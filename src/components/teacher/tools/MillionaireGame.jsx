'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', sans-serif";
const LS_KEY = 'millionaire_questions';

const PRIZES = [
  { level: 1,  amount: '500',       value: 500,     safe: false },
  { level: 2,  amount: '1,000',     value: 1000,    safe: false },
  { level: 3,  amount: '2,000',     value: 2000,    safe: false },
  { level: 4,  amount: '3,000',     value: 3000,    safe: false },
  { level: 5,  amount: '5,000',     value: 5000,    safe: true  },
  { level: 6,  amount: '10,000',    value: 10000,   safe: false },
  { level: 7,  amount: '20,000',    value: 20000,   safe: false },
  { level: 8,  amount: '30,000',    value: 30000,   safe: false },
  { level: 9,  amount: '50,000',    value: 50000,   safe: false },
  { level: 10, amount: '100,000',   value: 100000,  safe: true  },
  { level: 11, amount: '150,000',   value: 150000,  safe: false },
  { level: 12, amount: '250,000',   value: 250000,  safe: false },
  { level: 13, amount: '500,000',   value: 500000,  safe: false },
  { level: 14, amount: '750,000',   value: 750000,  safe: false },
  { level: 15, amount: '1,000,000', value: 1000000, safe: false },
];

const SAMPLE_QUESTIONS = [
  { question: 'เมืองหลวงของประเทศไทยคือ?', options: { A: 'เชียงใหม่', B: 'กรุงเทพมหานคร', C: 'พัทยา', D: 'ภูเก็ต' }, answer: 'B' },
  { question: 'น้ำ 1 ลิตร มีกี่มิลลิลิตร?', options: { A: '100', B: '500', C: '1,000', D: '2,000' }, answer: 'C' },
  { question: 'ดาวเคราะห์ดวงใดอยู่ใกล้ดวงอาทิตย์มากที่สุด?', options: { A: 'ศุกร์', B: 'โลก', C: 'อังคาร', D: 'พุธ' }, answer: 'D' },
  { question: 'ประเทศไทยมีกี่จังหวัด?', options: { A: '72', B: '75', C: '76', D: '77' }, answer: 'D' },
  { question: 'ใครเป็นผู้ประพันธ์เพลงชาติไทย?', options: { A: 'หลวงประดิษฐ์ไพเราะ', B: 'พระเจนดุริยางค์', C: 'หลวงวิจิตรวาทการ', D: 'สุนทรภู่' }, answer: 'B' },
];

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

// Color scheme per option — light theme
const OPT = {
  A: { dark: '#dbeafe', mid: '#3b82f6', neon: '#1e3a8a', glow: '#3b82f6' },
  B: { dark: '#ffedd5', mid: '#f97316', neon: '#7c2d12', glow: '#f97316' },
  C: { dark: '#dcfce7', mid: '#16a34a', neon: '#14532d', glow: '#16a34a' },
  D: { dark: '#fdf4ff', mid: '#c026d3', neon: '#6b21a8', glow: '#c026d3' },
};

const TEAM_CFG = [
  { color: '#2563eb', bg: '#eff6ff', dim: '#dbeafe', emoji: '🔵', label: 'ทีม A' },
  { color: '#db2777', bg: '#fdf2f8', dim: '#fce7f3', emoji: '🔴', label: 'ทีม B' },
];

// Kahoot-style answer colours (visible on dark bg)
const KC = {
  A: { bg: 'linear-gradient(135deg,#9b1c1c,#dc2626)', border: '#f87171', glow: '#ef4444', bar: '#dc2626', shape: '▲' },
  B: { bg: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: '#93c5fd', glow: '#3b82f6', bar: '#2563eb', shape: '◆' },
  C: { bg: 'linear-gradient(135deg,#78350f,#d97706)', border: '#fcd34d', glow: '#f59e0b', bar: '#d97706', shape: '●' },
  D: { bg: 'linear-gradient(135deg,#14532d,#16a34a)', border: '#86efac', glow: '#22c55e', bar: '#16a34a', shape: '■' },
};

// ── Confetti ─────────────────────────────────────────────────────────────────
function makeConfetti(n = 90) {
  const colors = ['#ffd700','#ff6b35','#00d4ff','#7c4dff','#ff4da6','#10b981','#ffc107'];
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    sz: 6 + Math.random() * 10,
    color: colors[i % colors.length],
    speed: 2 + Math.random() * 3,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    delay: Math.random() * 1.2,
  }));
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function getCtx(ref) {
  if (!ref.current) try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  return ref.current;
}
function wake(ref) { const c = getCtx(ref); if (c?.state === 'suspended') c.resume(); return c; }

function beep(ref, freq, type, gain, dur) {
  const ctx = wake(ref); if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.start(now); o.stop(now + dur + 0.02);
  } catch {}
}

function playTick(ref, fast = false) {
  const ctx = wake(ref); if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(fast ? 1400 : 900, now);
    g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    o.start(now); o.stop(now + 0.08);
  } catch {}
}

function playSelect(ref) {
  [440, 554, 659].forEach((f, i) => {
    const ctx = wake(ref); if (!ctx) return;
    try {
      const t = ctx.currentTime + i * 0.08;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(t); o.stop(t + 0.2);
    } catch {}
  });
}

function playCorrect(ref) {
  [523, 659, 784, 1047, 1319].forEach((f, i) => {
    const ctx = wake(ref); if (!ctx) return;
    try {
      const t = ctx.currentTime + i * 0.11;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.start(t); o.stop(t + 0.45);
    } catch {}
  });
}

function playWrong(ref) {
  [380, 260, 170].forEach((f, i) => {
    const ctx = wake(ref); if (!ctx) return;
    try {
      const t = ctx.currentTime + i * 0.16;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      o.start(t); o.stop(t + 0.3);
    } catch {}
  });
}

function playWin(ref) {
  [523,659,784,1047,1319,1047,1319,1568].forEach((f, i) => {
    const ctx = wake(ref); if (!ctx) return;
    try {
      const t = ctx.currentTime + i * 0.12;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = i >= 5 ? 'sine' : 'triangle'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.28, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.start(t); o.stop(t + 0.5);
    } catch {}
  });
  beep(ref, 80, 'sine', 0.4, 0.3);
}

// ── Safe haven ────────────────────────────────────────────────────────────────
function getSafeHaven(level) {
  const safe = PRIZES.filter(p => p.safe && p.level < level);
  return safe.length ? safe[safe.length - 1] : null;
}

// ── Timer — big digital block countdown ───────────────────────────────────────
function TimerCircle({ seconds, maxSeconds }) {
  const frac = maxSeconds > 0 ? seconds / maxSeconds : 0;
  const col   = frac > 0.5 ? '#10b981' : frac > 0.25 ? '#f59e0b' : '#ef4444';
  const glow  = frac > 0.5 ? 'rgba(16,185,129,0.55)' : frac > 0.25 ? 'rgba(245,158,11,0.55)' : 'rgba(239,68,68,0.65)';
  const urgent = frac <= 0.25;
  const tens = Math.floor(seconds / 10);
  const ones = seconds % 10;
  const barW = (frac * 100).toFixed(1) + '%';

  const box = {
    width: 110, height: 140,
    background: 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.55) 100%)',
    border: `3px solid ${col}70`,
    borderRadius: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 104, fontWeight: 900,
    color: col,
    fontFamily: "'Courier New','SF Mono',monospace",
    boxShadow: `0 0 32px ${glow}, 0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)`,
    textShadow: `0 0 28px ${col}, 0 0 8px ${col}`,
    lineHeight: 1,
    position: 'relative', overflow: 'hidden',
    flexShrink: 0,
    animation: urgent ? 'awardPulse 0.5s ease-in-out infinite' : 'none',
    transition: 'border-color 0.5s, box-shadow 0.5s',
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Digit boxes */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Tens */}
        <div style={box}>
          {tens}
          {/* Flip-clock mid-line */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'rgba(0,0,0,0.35)' }} />
        </div>

        {/* Colon separator */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 18,
          color: col, fontSize: 36, fontWeight: 900, opacity: 0.8,
          textShadow: `0 0 12px ${col}`,
          animation: 'colonBlink 1s ease-in-out infinite',
        }}>
          <span>●</span><span>●</span>
        </div>

        {/* Ones */}
        <div style={box}>
          {ones}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'rgba(0,0,0,0.35)' }} />
        </div>
      </div>

      {/* วินาที label */}
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 4, fontWeight: 700 }}>
        วินาที
      </div>

      {/* Progress bar */}
      <div style={{ width: 240, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: barW,
          background: `linear-gradient(90deg,${col}80,${col})`,
          borderRadius: 99,
          transition: 'width 0.95s linear, background 0.5s',
          boxShadow: `0 0 10px ${col}`,
        }} />
      </div>
    </div>
  );
}

// ── Audience poll modal ───────────────────────────────────────────────────────
function AudienceModal({ options, correctAnswer, onClose }) {
  const correctPct = 55 + Math.floor(Math.random() * 21);
  const remaining = 100 - correctPct;
  const wrongs = OPTION_KEYS.filter(k => k !== correctAnswer && options[k]);
  const perWrong = wrongs.length > 0 ? Math.floor(remaining / wrongs.length) : 0;
  const pcts = {};
  OPTION_KEYS.forEach(k => {
    if (!options[k]) { pcts[k] = 0; return; }
    if (k === correctAnswer) { pcts[k] = correctPct; return; }
    const idx = wrongs.indexOf(k);
    pcts[k] = idx === wrongs.length - 1 ? remaining - perWrong * (wrongs.length - 1) : perWrong;
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: 22, padding: '36px 40px', maxWidth: 440, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 44, marginBottom: 6 }}>👥</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24, fontFamily: FONT }}>ผลโหวตจากห้องเรียน</div>
        {OPTION_KEYS.filter(k => options[k]).map(k => (
          <div key={k} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: OPT[k].neon, fontSize: 14, fontFamily: FONT, fontWeight: 700 }}>{k}: {options[k]}</span>
              <span style={{ color: OPT[k].neon, fontWeight: 700, fontSize: 14 }}>{pcts[k]}%</span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 10, height: 28, overflow: 'hidden', border: `1px solid ${OPT[k].mid}30` }}>
              <div style={{ width: `${pcts[k]}%`, height: '100%', background: `linear-gradient(90deg,${OPT[k].mid}80,${OPT[k].mid})`, borderRadius: 10, transition: 'width 1.3s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 8px ${OPT[k].glow}50` }} />
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: 18, padding: '10px 32px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontFamily: FONT, fontSize: 14 }}>ปิด</button>
      </div>
    </div>
  );
}

// Max possible cumulative score = sum of all 15 prizes
const MAX_SCORE = 500+1000+2000+3000+5000+10000+20000+30000+50000+100000+150000+250000+500000+750000+1000000; // 1,882,500

// ── Team Panel — vertical money bar + score + votes ───────────────────────────
function TeamPanel({ teamIdx, name, score, color, border, glow, dimBg, borderSide, emoji, nameColor, voteRoom, voteData, currentQuestion, KC, anim }) {
  const barPct = Math.min(100, (score / MAX_SCORE) * 100);
  const borderStyle = borderSide === 'right'
    ? { borderRight: `1px solid ${color}40` }
    : { borderLeft: `1px solid ${color}40` };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 14px', gap: 6,
      background: `linear-gradient(180deg,${dimBg} 0%,rgba(0,0,0,0.04) 100%)`,
      animation: `${anim} 0.5s ease`,
      ...borderStyle,
    }}>
      {/* Avatar */}
      <div style={{ width: 64, height: 64, borderRadius: '50%', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}25`, border: `3px solid ${border}`, boxShadow: `0 0 28px ${glow}`, marginBottom: 4 }}>
        {emoji}
      </div>

      {/* Team name */}
      <div style={{ color: nameColor, fontSize: 15, fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>{name}</div>

      {/* Score */}
      <div style={{ color: '#ffd700', fontSize: 38, fontWeight: 900, lineHeight: 1, textAlign: 'center', textShadow: '0 0 28px rgba(255,215,0,0.6)' }}>
        ฿{score.toLocaleString()}
      </div>

      {/* Vertical money bar */}
      <div style={{ width: 36, height: 130, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', position: 'relative', marginTop: 6, border: `1px solid ${color}30` }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${barPct}%`,
          background: `linear-gradient(180deg,${color},${color}80)`,
          borderRadius: 99,
          transition: 'height 1.2s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 12px ${glow}`,
        }} />
        {barPct > 0 && (
          <div style={{ position: 'absolute', bottom: `${barPct}%`, left: '50%', transform: 'translate(-50%,50%)', width: 20, height: 4, background: '#ffd700', borderRadius: 99, boxShadow: '0 0 8px rgba(255,215,0,0.8)' }} />
        )}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, letterSpacing: 1 }}>คะแนนรวม</div>

      {/* Vote mini-bars */}
      {voteRoom && voteData?.total > 0 && (
        <div style={{ marginTop: 12, width: '100%' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textAlign: 'center', letterSpacing: 1 }}>โหวต</div>
          {['A','B','C','D'].filter(k => currentQuestion?.options?.[k]).map(k => {
            const pct = Math.round((voteData[k]||0) / voteData.total * 100);
            return (
              <div key={k} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                  <span style={{ fontWeight: 700 }}>{KC[k].shape} {k}</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: KC[k].bar, borderRadius: 99, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MillionaireGame() {
  // Setup
  const [gameMode, setGameMode] = useState('solo'); // 'solo' | 'teams'
  const [teamNames, setTeamNames] = useState(['ทีม A', 'ทีม B']);
  const [setupTab, setSetupTab] = useState('manual');
  const [questions, setQuestions] = useState(SAMPLE_QUESTIONS.map((q, i) => ({ ...q, id: String(i) })));
  const [collapsed, setCollapsed] = useState({});
  const [useTimer, setUseTimer]       = useState(false); // false = no timer
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerMins, setTimerMins]   = useState(0);
  const [timerSecs, setTimerSecs]   = useState(30);

  // AI
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('ปานกลาง');
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  // Game
  const [gamePhase, setGamePhase] = useState('setup');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lifelines, setLifelines] = useState({ fifty: true, audience: true, skip: true });
  const [showAudience, setShowAudience] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [finalPrize, setFinalPrize] = useState('0');
  const [gameQuestions, setGameQuestions] = useState([]);

  // Team
  const [teamScores, setTeamScores] = useState([0, 0]);
  const [teamWinner, setTeamWinner] = useState(null); // null | 0 | 1 | 'tie'
  const [awardPending, setAwardPending] = useState(false);

  // Student voting (Kahoot-style)
  const [voteRoom, setVoteRoom] = useState(null);       // room code string
  const [showQR, setShowQR] = useState(false);          // QR panel visible
  const [voteData, setVoteData] = useState({ A: 0, B: 0, C: 0, D: 0, total: 0 });
  const voteRoomRef = useRef(null);
  const votePollRef = useRef(null);
  const teamVotesRef = useRef([{ A:0,B:0,C:0,D:0 }, { A:0,B:0,C:0,D:0 }]);

  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

  // ── Vote room helpers ──────────────────────────────────────
  const genRoomCode = () => {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join('');
  };

  const createVoteRoom = useCallback(async () => {
    const code = genRoomCode();
    voteRoomRef.current = code;
    setVoteRoom(code);
    try {
      await fetch('/api/teacher/millionaire', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', room: code, mode: gameMode, teamNames }),
      });
    } catch {}
    return code;
  }, [gameMode, teamNames]);

  const pushQuestion = useCallback(async (q, idx, roomCode) => {
    const code = roomCode || voteRoomRef.current;
    if (!code || !q) return;
    setVoteData({ A: 0, B: 0, C: 0, D: 0, total: 0 });
    try {
      await fetch('/api/teacher/millionaire', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // Include answerKey so solo mode can auto-reveal on vote
        body: JSON.stringify({ action: 'set_question', room: code, question: { question: q.question, options: q.options, answerKey: q.answer }, questionIndex: idx }),
      });
    } catch {}
  }, []);

  const revealToStudents = useCallback(async (correctAnswer) => {
    const code = voteRoomRef.current;
    if (!code) return;
    try {
      await fetch('/api/teacher/millionaire', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reveal', room: code, correctAnswer }),
      });
    } catch {}
  }, []);

  const closeVoteRoom = useCallback(async () => {
    const code = voteRoomRef.current;
    clearInterval(votePollRef.current);
    if (!code) return;
    voteRoomRef.current = null;
    setVoteRoom(null);
    setShowQR(false);
    try { await fetch(`/api/teacher/millionaire?room=${code}`, { method: 'DELETE' }); } catch {}
  }, []);

  // Poll votes while game is playing
  useEffect(() => {
    if (!voteRoom || (gamePhase !== 'playing' && gamePhase !== 'locked' && gamePhase !== 'reveal')) {
      clearInterval(votePollRef.current);
      return;
    }
    clearInterval(votePollRef.current);
    votePollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/teacher/millionaire?room=${voteRoom}&action=get_votes`);
        if (res.ok) {
          const d = await res.json();
          setVoteData({ ...d.votes, total: d.total });
          if (d.teamVotes) teamVotesRef.current = d.teamVotes;
        }
      } catch {}
    }, 2000);
    return () => clearInterval(votePollRef.current);
  }, [voteRoom, gamePhase]);

  // Persist questions
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) setQuestions(p); }
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(questions)); } catch {} }, [questions]);

  // Timer
  const stopTimer = useCallback(() => { clearInterval(timerRef.current); clearInterval(tickRef.current); }, []);

  const handleTimeout = useCallback(() => {
    setGamePhase('reveal');
    setSelectedAnswer(null);
    playWrong(audioRef);

    if (gameMode === 'solo') {
      setTimeout(() => {
        setFinalPrize(getSafeHaven(currentQ + 1)?.amount || '0');
        setGamePhase('lost');
      }, 2200);
      return;
    }

    // Teams: auto-reveal correct answer to students
    const q = gameQuestions[currentQ];
    if (q) revealToStudents(q.answer);

    // After 2.5s: auto-determine winner from team vote data → award → advance
    setTimeout(() => {
      const tv = teamVotesRef.current;
      const correct = q?.answer;
      const votes0 = correct ? (tv[0]?.[correct] || 0) : 0;
      const votes1 = correct ? (tv[1]?.[correct] || 0) : 0;

      let winner = -1;
      if (votes0 > votes1) winner = 0;
      else if (votes1 > votes0) winner = 1;

      if (winner >= 0) {
        const val = PRIZES[Math.min(currentQ, 14)].value;
        setTeamScores(prev => { const n = [...prev]; n[winner] += val; return n; });
        playCorrect(audioRef);
        toast.success(`⏰ หมดเวลา! ✅ ${teamNames[winner]} ตอบถูก +฿${PRIZES[Math.min(currentQ, 14)].amount}`);
      } else {
        toast('⏰ หมดเวลา — ไม่มีทีมใดตอบถูก', { icon: '💀' });
      }

      // Advance to next question after 1.5s
      setTimeout(() => {
        if (currentQ + 1 >= gameQuestions.length) {
          setTeamScores(prev => {
            const w = prev[0] > prev[1] ? 0 : prev[1] > prev[0] ? 1 : 'tie';
            setTeamWinner(w);
            return prev;
          });
          playWin(audioRef);
          setGamePhase('won');
          launchConfetti();
        } else {
          const nextQ = currentQ + 1;
          setCurrentQ(nextQ);
          setGamePhase('playing');
          pushQuestion(gameQuestions[nextQ], nextQ, null);
        }
      }, 1500);
    }, 2500);
  }, [gameMode, currentQ, gameQuestions, revealToStudents, teamNames, pushQuestion]);

  const startTimer = useCallback((secs) => {
    stopTimer();
    setTimeLeft(secs);
    let rem = secs;
    const sched = (fast) => {
      clearInterval(tickRef.current);
      tickRef.current = setInterval(() => playTick(audioRef, fast), fast ? 500 : 1000);
    };
    sched(false);
    timerRef.current = setInterval(() => {
      rem -= 1;
      setTimeLeft(rem);
      if (rem === 5) sched(true);
      if (rem <= 0) { stopTimer(); handleTimeout(); }
    }, 1000);
  }, [stopTimer, handleTimeout]);

  const [timerStarted, setTimerStarted] = useState(false);

  // Reset state on new question — but do NOT auto-start timer
  useEffect(() => {
    if (gamePhase === 'playing') {
      setSelectedAnswer(null);
      setHiddenOptions([]);
      setAwardPending(false);
      setTimeLeft(timerSeconds);   // show full time, paused
      setTimerStarted(false);
      stopTimer();
    }
  }, [currentQ, gamePhase]); // eslint-disable-line

  // Teacher manually starts (or just opens) the question for students
  const beginTimer = useCallback(async () => {
    if (timerStarted || gamePhase !== 'playing') return;
    setTimerStarted(true);
    if (useTimer) startTimer(timerSeconds); // only countdown if timer mode is on
    // Tell students they can now see the question
    const code = voteRoomRef.current;
    if (code) {
      try {
        await fetch('/api/teacher/millionaire', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start_timer', room: code }),
        });
      } catch {}
    }
  }, [timerStarted, gamePhase, startTimer, timerSeconds, useTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // Start game
  const startGame = useCallback(async () => {
    const valid = questions.filter(q => q.question?.trim() && q.options?.A && q.options?.B && q.options?.C && q.options?.D && q.answer);
    if (valid.length < 3) { toast.error('ต้องมีคำถามที่สมบูรณ์อย่างน้อย 3 ข้อ'); return; }
    const sliced = valid.slice(0, 15);
    setGameQuestions(sliced);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setHiddenOptions([]);
    setLifelines({ fifty: true, audience: true, skip: true });
    setTeamScores([0, 0]);
    setTeamWinner(null);
    setFinalPrize('0');
    setAwardPending(false);
    setConfettiActive(false);
    setGamePhase('playing');
    // Create vote room + push first question (timer starts only when host presses ▶)
    const code = await createVoteRoom();
    setShowQR(true);
    pushQuestion(sliced[0], 0, code);
  }, [questions, timerSeconds, startTimer, createVoteRoom, pushQuestion]);

  // Solo: reveal correct answer and auto-advance (teacher presses one button)
  const revealSolo = useCallback(() => {
    stopTimer();
    const q = gameQuestions[currentQ];
    if (!q) return;
    setSelectedAnswer(q.answer);   // highlight correct tile green
    setGamePhase('reveal');
    revealToStudents(q.answer);
    playCorrect(audioRef);
    setTimeout(() => {
      if (currentQ + 1 >= gameQuestions.length) {
        playWin(audioRef);
        setFinalPrize(PRIZES[Math.min(gameQuestions.length, 15) - 1].amount);
        setGamePhase('won');
        launchConfetti();
      } else {
        const nextQ = currentQ + 1;
        setCurrentQ(nextQ);
        setGamePhase('playing');
        pushQuestion(gameQuestions[nextQ], nextQ, null);
      }
    }, 2200);
  }, [stopTimer, gameQuestions, currentQ, revealToStudents, pushQuestion]);

  // Solo: select answer (kept for backward compat but no longer used via tile click)
  const selectAnswer = useCallback((key) => {
    if (gamePhase !== 'playing' || hiddenOptions.includes(key)) return;
    stopTimer();
    setSelectedAnswer(key);
    setGamePhase('locked');
    playSelect(audioRef);
    setTimeout(() => {
      const q = gameQuestions[currentQ];
      setGamePhase('reveal');
      revealToStudents(q.answer);
      if (key === q.answer) {
        playCorrect(audioRef);
        setTimeout(() => {
          if (currentQ + 1 >= gameQuestions.length) {
            playWin(audioRef);
            setFinalPrize(PRIZES[Math.min(gameQuestions.length, 15) - 1].amount);
            setGamePhase('won');
            launchConfetti();
          } else {
            const nextQ = currentQ + 1;
            setCurrentQ(nextQ);
            setGamePhase('playing');
            pushQuestion(gameQuestions[nextQ], nextQ, null);
          }
        }, 1800);
      } else {
        playWrong(audioRef);
        setTimeout(() => {
          setFinalPrize(getSafeHaven(currentQ + 1)?.amount || '0');
          setGamePhase('lost');
        }, 1800);
      }
    }, 2600);
  }, [gamePhase, hiddenOptions, stopTimer, gameQuestions, currentQ, revealToStudents, pushQuestion]);

  // Teams: reveal answer
  const revealAnswer = useCallback(() => {
    stopTimer();
    const q = gameQuestions[currentQ];
    setGamePhase('reveal');
    setAwardPending(true);
    playSelect(audioRef);
    if (q) revealToStudents(q.answer);
  }, [stopTimer, gameQuestions, currentQ, revealToStudents]);

  // Teams: award to team
  const awardTeam = useCallback((teamIdx) => {
    if (!awardPending) return;
    setAwardPending(false);
    if (teamIdx >= 0) {
      const val = PRIZES[Math.min(currentQ, 14)].value;
      setTeamScores(prev => { const n = [...prev]; n[teamIdx] += val; return n; });
      playCorrect(audioRef);
      toast.success(`✅ ${teamNames[teamIdx]} ได้ ฿${PRIZES[Math.min(currentQ, 14)].amount}!`);
    } else {
      playWrong(audioRef);
      toast('❌ ทั้งคู่ผิด', { icon: '💀' });
    }
    setTimeout(() => {
      if (currentQ + 1 >= gameQuestions.length) {
        setTeamScores(prev => {
          const w = prev[0] > prev[1] ? 0 : prev[1] > prev[0] ? 1 : 'tie';
          setTeamWinner(w);
          return prev;
        });
        playWin(audioRef);
        setGamePhase('won');
        launchConfetti();
      } else {
        const nextQ = currentQ + 1;
        setCurrentQ(nextQ);
        setGamePhase('playing');
        pushQuestion(gameQuestions[nextQ], nextQ, null);
      }
    }, 1200);
  }, [awardPending, currentQ, gameQuestions, teamNames, pushQuestion]);

  // Walk away
  const walkAway = useCallback(() => {
    stopTimer();
    const prize = getSafeHaven(currentQ + 1)?.amount || (currentQ > 0 ? PRIZES[currentQ - 1].amount : '0');
    setFinalPrize(prize);
    setGamePhase('won');
    toast('🚶 เดินออกพร้อมรางวัล ฿' + prize);
    launchConfetti();
  }, [stopTimer, currentQ]);

  // Lifelines
  const useFiftyFifty = useCallback(() => {
    if (!lifelines.fifty || gamePhase !== 'playing') return;
    const q = gameQuestions[currentQ];
    const wrongs = OPTION_KEYS.filter(k => k !== q.answer && q.options[k]);
    setHiddenOptions(wrongs.sort(() => Math.random() - 0.5).slice(0, 2));
    setLifelines(l => ({ ...l, fifty: false }));
    toast('🎯 50:50 ตัดตัวเลือกผิด 2 ข้อ!');
  }, [lifelines.fifty, gamePhase, gameQuestions, currentQ]);

  const useAudience = useCallback(() => {
    if (!lifelines.audience || gamePhase !== 'playing') return;
    setLifelines(l => ({ ...l, audience: false }));
    setShowAudience(true);
    toast('👥 ผลโหวตจากห้องเรียน!');
    setTimeout(() => setShowAudience(false), 5500);
  }, [lifelines.audience, gamePhase]);

  const useSkip = useCallback(() => {
    if (!lifelines.skip || gamePhase !== 'playing') return;
    stopTimer();
    setLifelines(l => ({ ...l, skip: false }));
    toast('⏭ ข้ามข้อ!');
    if (currentQ + 1 >= gameQuestions.length) {
      playWin(audioRef);
      setFinalPrize(PRIZES[Math.min(gameQuestions.length, 15) - 1].amount);
      setGamePhase('won');
      launchConfetti();
    } else {
      setCurrentQ(n => n + 1);
      setGamePhase('playing');
    }
  }, [lifelines.skip, gamePhase, stopTimer, currentQ, gameQuestions]);

  const launchConfetti = () => { setConfetti(makeConfetti(100)); setConfettiActive(true); setTimeout(() => setConfettiActive(false), 5000); };

  // Question management
  const addQuestion = () => {
    if (questions.length >= 15) { toast.error('สูงสุด 15 คำถาม'); return; }
    const id = Date.now().toString();
    setQuestions(qs => [...qs, { id, question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A' }]);
    setCollapsed(c => ({ ...c, [id]: false }));
  };
  const removeQuestion = (id) => setQuestions(qs => qs.filter(q => q.id !== id));
  const updateQuestion = (id, f, v) => setQuestions(qs => qs.map(q => q.id === id ? { ...q, [f]: v } : q));
  const updateOption = (id, k, v) => setQuestions(qs => qs.map(q => q.id === id ? { ...q, options: { ...q.options, [k]: v } } : q));
  const toggleCollapse = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  // AI generate
  const generateWithAI = async () => {
    if (!aiTopic.trim()) { toast.error('กรุณาใส่หัวข้อ'); return; }
    setAiLoading(true);
    try {
      const prompt = `สร้างคำถามแบบปรนัย ${aiCount} ข้อ เกี่ยวกับ "${aiTopic}" ระดับ ${aiDifficulty}\n\nตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น:\n[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B"}]`;
      const res = await fetch('/api/teacher/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: 'custom', payload: { prompt } }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const match = (data.result || '').match(/\[[\s\S]*\]/);
      if (!match) throw new Error('AI ตอบผิด format');
      const parsed = JSON.parse(match[0]).map((q, i) => ({
        id: `ai_${Date.now()}_${i}`,
        question: q.question || '',
        options: { A: q.options?.A || '', B: q.options?.B || '', C: q.options?.C || '', D: q.options?.D || '' },
        answer: ['A', 'B', 'C', 'D'].includes(q.answer) ? q.answer : 'A',
      }));
      setAiPreview(parsed);
      toast.success(`AI สร้าง ${parsed.length} คำถามแล้ว!`);
    } catch (e) { toast.error('ไม่สำเร็จ: ' + e.message); }
    finally { setAiLoading(false); }
  };

  const acceptAi = () => { if (!aiPreview) return; setQuestions(qs => [...qs, ...aiPreview].slice(0, 15)); setAiPreview(null); toast.success(`เพิ่ม ${aiPreview.length} คำถาม!`); setSetupTab('manual'); };
  const replaceAi = () => { if (!aiPreview) return; setQuestions(aiPreview.slice(0, 15)); setAiPreview(null); toast.success('แทนที่ทั้งหมดแล้ว!'); setSetupTab('manual'); };

  const restartGame = async () => {
    stopTimer();
    setCurrentQ(0); setSelectedAnswer(null); setHiddenOptions([]);
    setLifelines({ fifty: true, audience: true, skip: true });
    setTeamScores([0, 0]); setTeamWinner(null); setFinalPrize('0');
    setConfettiActive(false); setAwardPending(false);
    setGamePhase('playing');
    const code = await createVoteRoom();
    setShowQR(true);
    pushQuestion(gameQuestions[0], 0, code);
  };
  const goToSetup = () => {
    stopTimer(); closeVoteRoom();
    setGamePhase('setup'); setCurrentQ(0); setSelectedAnswer(null); setHiddenOptions([]);
    setLifelines({ fifty: true, audience: true, skip: true });
    setTeamScores([0, 0]); setTeamWinner(null); setConfettiActive(false); setAwardPending(false);
  };

  const currentQuestion = gameQuestions[currentQ];
  const currentLevel = currentQ + 1;
  const prizeEntry = PRIZES[Math.min(currentQ, 14)];

  // Answer button style
  const ansStyle = (key) => {
    const isHidden = hiddenOptions.includes(key);
    if (isHidden) return null;
    const opt = OPT[key];
    const isSel = selectedAnswer === key;
    const q = gameQuestions[currentQ];
    const isCorrect = q && key === q.answer;

    if (gamePhase === 'reveal') {
      if (isCorrect) return { bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '#16a34a', color: '#14532d', shadow: `0 0 20px rgba(22,163,74,0.25)` };
      if (isSel) return { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', border: '#ef4444', color: '#991b1b', shadow: `0 0 20px rgba(239,68,68,0.25)` };
      return { bg: '#f1f5f9', border: '#e2e8f0', color: '#94a3b8', shadow: 'none' };
    }
    if (gamePhase === 'locked' && isSel) return { bg: `linear-gradient(135deg,${opt.dark},${opt.dark})`, border: opt.mid, color: opt.neon, shadow: `0 0 20px ${opt.glow}40` };
    return { bg: opt.dark, border: `${opt.mid}60`, color: opt.neon, shadow: 'none' };
  };

  // ── Global CSS ────────────────────────────────────────────────────────────────
  const CSS = `
    @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
    @keyframes goldPulse{0%,100%{filter:brightness(1) drop-shadow(0 0 12px rgba(255,215,0,0.4))}50%{filter:brightness(1.15) drop-shadow(0 0 32px rgba(255,215,0,0.8))}}
    @keyframes heroPulse{0%,100%{filter:brightness(1) drop-shadow(0 0 16px rgba(96,165,250,0.5))}50%{filter:brightness(1.12) drop-shadow(0 0 36px rgba(244,114,182,0.7))}}
    @keyframes winBounce{0%{transform:scale(0.2) rotate(-15deg);opacity:0}60%{transform:scale(1.12) rotate(4deg);opacity:1}80%{transform:scale(0.96) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes ladderBlink{0%,100%{background:linear-gradient(90deg,#fef3c7,#fde68a);border-color:#f59e0b}50%{background:linear-gradient(90deg,#fde68a,#fcd34d);border-color:#d97706}}
    @keyframes urgentPulse{0%,100%{opacity:1}50%{opacity:0.35}}
    @keyframes borderGlow{0%,100%{box-shadow:0 0 10px rgba(59,130,246,0.08),inset 0 0 20px rgba(59,130,246,0.02)}50%{box-shadow:0 0 24px rgba(59,130,246,0.16),inset 0 0 40px rgba(59,130,246,0.04)}}
    @keyframes revealPop{0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
    @keyframes slideL{from{transform:translateX(-24px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes slideR{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes awardPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
    @keyframes teamWin{0%{transform:scale(0.9);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
    @keyframes starTwinkle{0%,100%{opacity:0.2;transform:scale(1)}50%{opacity:0.9;transform:scale(1.6)}}
    @keyframes colonBlink{0%,100%{opacity:0.9}50%{opacity:0.2}}
    @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
  `;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: 'linear-gradient(160deg,#020918 0%,#050f2a 45%,#0a0520 100%)', position: 'relative', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* Starfield BG — blue/white/pink stars */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 90 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5,
            height: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5,
            borderRadius: '50%',
            background: ['rgba(96,165,250,0.7)', 'rgba(255,255,255,0.6)', 'rgba(244,114,182,0.65)', 'rgba(147,197,253,0.55)', 'rgba(251,207,232,0.5)'][i % 5],
            top: `${(i * 17 + 5) % 95}%`,
            left: `${(i * 23 + 11) % 97}%`,
            animation: `starTwinkle ${2 + (i % 5) * 0.7}s ease-in-out ${(i * 0.13) % 2}s infinite`,
          }} />
        ))}
        {/* Blue glow top-center */}
        <div style={{ position: 'absolute', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)', top: '-120px', left: '50%', transform: 'translateX(-50%)' }} />
        {/* Pink glow bottom-right */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.1) 0%,transparent 70%)', bottom: '0%', right: '-5%' }} />
        {/* Cyan glow bottom-left */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,180,230,0.08) 0%,transparent 70%)', bottom: '15%', left: '-5%' }} />
      </div>

      {/* Confetti */}
      {confettiActive && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9990, overflow: 'hidden' }}>
          {confetti.map(p => (
            <div key={p.id} style={{
              position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
              width: p.sz, height: p.shape === 'rect' ? p.sz * 0.5 : p.sz,
              borderRadius: p.shape === 'circle' ? '50%' : 3,
              background: p.color,
              animation: `confettiFall ${p.speed}s ease-in forwards`,
              animationDelay: `${p.delay}s`,
            }} />
          ))}
        </div>
      )}

      {/* Audience modal */}
      {showAudience && currentQuestion && (
        <AudienceModal options={currentQuestion.options} correctAnswer={currentQuestion.answer} onClose={() => setShowAudience(false)} />
      )}

      {/* ═══════════════ SETUP ═══════════════ */}
      {gamePhase === 'setup' && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px 48px', position: 'relative', zIndex: 1 }}>

          {/* ── HERO HEADER — BLUE / WHITE / PINK ── */}
          <div style={{ textAlign: 'center', marginBottom: 36, paddingTop: 20 }}>
            {/* Icon with layered glow */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
              <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.22) 0%,rgba(59,130,246,0.12) 50%,transparent 70%)', animation: 'heroPulse 3s ease-in-out infinite' }} />
              <div style={{ fontSize: 96, lineHeight: 1, filter: 'drop-shadow(0 0 24px rgba(96,165,250,0.8)) drop-shadow(0 0 48px rgba(236,72,153,0.5))' }}>🎰</div>
            </div>

            {/* Main title — blue→white→pink */}
            <h1 style={{
              margin: '14px 0 6px',
              fontSize: 'clamp(46px,9vw,78px)',
              fontWeight: 900,
              background: 'linear-gradient(135deg,#93c5fd 0%,#ffffff 40%,#f9a8d4 75%,#f472b6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'heroPulse 3.5s ease-in-out infinite',
              letterSpacing: 4, lineHeight: 1.1,
            }}>
              เกมเศรษฐี
            </h1>

            {/* Subtitle */}
            <p style={{ color: 'rgba(147,197,253,0.65)', fontSize: 12, margin: '0 0 20px', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 600 }}>
              Who Wants to Be a Millionaire? — Classroom Edition
            </p>

            {/* Prize tags — blue/pink palette */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: '฿500', color: 'rgba(147,197,253,0.5)', border: 'rgba(96,165,250,0.3)' },
                { label: '฿5K',  color: 'rgba(196,181,253,0.5)', border: 'rgba(167,139,250,0.3)' },
                { label: '฿100K', color: 'rgba(249,168,212,0.5)', border: 'rgba(244,114,182,0.3)' },
                { label: '฿1,000,000', color: null, border: null, highlight: true },
              ].map((p, i) => (
                <span key={i} style={{
                  padding: '5px 14px', borderRadius: 20,
                  background: p.highlight ? 'linear-gradient(135deg,#1d4ed8,#7c3aed,#db2777)' : `rgba(255,255,255,0.06)`,
                  border: `1px solid ${p.highlight ? 'rgba(255,255,255,0.3)' : (p.border || 'rgba(255,255,255,0.15)')}`,
                  color: p.highlight ? '#fff' : (p.color || 'rgba(255,255,255,0.5)'),
                  fontSize: 12, fontWeight: p.highlight ? 900 : 600,
                  boxShadow: p.highlight ? '0 0 20px rgba(124,58,237,0.5),0 0 40px rgba(219,39,119,0.3)' : 'none',
                }}>
                  {i < 3 ? '· · ·' : '🏅'} {p.label}
                </span>
              ))}
            </div>
          </div>

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            {[
              { id: 'solo', icon: '👤', title: 'โหมดเดี่ยว', desc: 'ตอบคำถามขึ้นบันได สู่รางวัล 1 ล้าน', selBg: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(147,51,234,0.12))', selBorder: '#60a5fa', selColor: '#93c5fd', selShadow: '0 0 28px rgba(59,130,246,0.3)' },
              { id: 'teams', icon: '⚔️', title: 'แข่ง 2 ทีม', desc: 'สองทีมแข่งกัน ทีมคะแนนสูงสุดชนะ', selBg: 'linear-gradient(135deg,rgba(236,72,153,0.18),rgba(124,58,237,0.12))', selBorder: '#f472b6', selColor: '#f9a8d4', selShadow: '0 0 28px rgba(236,72,153,0.3)' },
            ].map(m => (
              <button key={m.id} onClick={() => setGameMode(m.id)} style={{
                padding: '20px 16px', borderRadius: 18, cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
                background: gameMode === m.id ? m.selBg : 'rgba(255,255,255,0.04)',
                border: `2px solid ${gameMode === m.id ? m.selBorder : 'rgba(255,255,255,0.09)'}`,
                boxShadow: gameMode === m.id ? `${m.selShadow}, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
                transition: 'all 0.25s', backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: gameMode === m.id ? m.selColor : 'rgba(255,255,255,0.8)', marginBottom: 5 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>{m.desc}</div>
                {gameMode === m.id && <div style={{ marginTop: 10, color: m.selColor, fontSize: 12, fontWeight: 700 }}>✓ เลือกแล้ว</div>}
              </button>
            ))}
          </div>

          {/* Team names */}
          {gameMode === 'teams' && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 16, padding: '18px 20px', marginBottom: 18, animation: 'fadeUp 0.3s ease', backdropFilter: 'blur(10px)' }}>
              <div style={{ color: '#93c5fd', fontSize: 14, fontWeight: 800, marginBottom: 14 }}>⚔️ ตั้งชื่อทีม</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 26, filter: `drop-shadow(0 0 8px ${TEAM_CFG[i].color})` }}>{TEAM_CFG[i].emoji}</span>
                    <input
                      value={teamNames[i]}
                      onChange={e => setTeamNames(n => { const nn = [...n]; nn[i] = e.target.value; return nn; })}
                      maxLength={12}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `2px solid ${TEAM_CFG[i].color}70`, background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: FONT, fontSize: 16, fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timer */}
          <div style={{ marginBottom: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '16px 20px', backdropFilter: 'blur(10px)' }}>
            <div style={{ color: 'rgba(147,197,253,0.8)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>⏱️ การจับเวลา</div>

            {/* Toggle: no timer vs with timer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: useTimer ? 14 : 0 }}>
              {[
                { val: false, icon: '🎭', label: 'ไม่จับเวลา', desc: 'ผู้คุมควบคุมจังหวะเอง' },
                { val: true,  icon: '⏱️', label: 'จับเวลา',   desc: 'นับถอยหลังต่อข้อ' },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setUseTimer(opt.val)} style={{
                  padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, transition: 'all 0.2s',
                  background: useTimer === opt.val ? 'linear-gradient(135deg,rgba(59,130,246,0.22),rgba(124,58,237,0.16))' : 'rgba(255,255,255,0.05)',
                  boxShadow: useTimer === opt.val ? '0 0 20px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
                  outline: useTimer === opt.val ? '2px solid rgba(96,165,250,0.5)' : '2px solid transparent',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ color: useTimer === opt.val ? '#93c5fd' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 800 }}>{opt.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
                  {useTimer === opt.val && <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 700, marginTop: 6 }}>✓ เลือกแล้ว</div>}
                </button>
              ))}
            </div>

            {/* Duration picker — only show when timer is on */}
            {useTimer && (
              <div style={{ animation: 'fadeUp 0.2s ease' }}>
                {/* Presets */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { label: '15 วิ', s: 15 }, { label: '30 วิ', s: 30 }, { label: '45 วิ', s: 45 },
                    { label: '1 นาที', s: 60 }, { label: '1:30', s: 90 }, { label: '2 นาที', s: 120 },
                    { label: '3 นาที', s: 180 }, { label: '5 นาที', s: 300 },
                  ].map(({ label, s }) => (
                    <button key={s} onClick={() => { setTimerSeconds(s); setTimerMins(Math.floor(s / 60)); setTimerSecs(s % 60); }} style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, transition: 'all 0.15s',
                      background: timerSeconds === s ? 'linear-gradient(135deg,#1d4ed8,#7c3aed)' : 'rgba(255,255,255,0.08)',
                      color: timerSeconds === s ? '#fff' : 'rgba(255,255,255,0.45)',
                      fontWeight: timerSeconds === s ? 800 : 400,
                      boxShadow: timerSeconds === s ? '0 0 14px rgba(59,130,246,0.5)' : 'none',
                    }}>{label}</button>
                  ))}
                </div>

                {/* Custom input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, flexShrink: 0 }}>กำหนดเอง:</span>
                  <input type="number" min={0} max={59} value={timerMins}
                    onChange={e => { const m = Math.max(0,Math.min(59,parseInt(e.target.value)||0)); setTimerMins(m); const t=m*60+timerSecs; if(t>0) setTimerSeconds(t); }}
                    style={{ width: 52, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 15, fontWeight: 800, textAlign: 'center', fontFamily: FONT, outline: 'none' }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>นาที</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>:</span>
                  <input type="number" min={0} max={59} value={timerSecs}
                    onChange={e => { const s = Math.max(0,Math.min(59,parseInt(e.target.value)||0)); setTimerSecs(s); const t=timerMins*60+s; if(t>0) setTimerSeconds(t); }}
                    style={{ width: 52, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 15, fontWeight: 800, textAlign: 'center', fontFamily: FONT, outline: 'none' }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>วินาที</span>
                  <div style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 13, fontWeight: 900, fontFamily: 'monospace' }}>
                    {timerMins > 0 ? `${timerMins}:${String(timerSecs).padStart(2,'0')}` : `${timerSecs}s`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 18, gap: 4, border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(10px)' }}>
            {[{ id: 'manual', label: '✏️ สร้างเอง' }, { id: 'ai', label: '🤖 AI สร้างให้' }].map(t => (
              <button key={t.id} onClick={() => setSetupTab(t.id)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: FONT, transition: 'all 0.2s',
                background: setupTab === t.id ? 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(124,58,237,0.2))' : 'transparent',
                color: setupTab === t.id ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                fontWeight: setupTab === t.id ? 700 : 400,
                boxShadow: setupTab === t.id ? '0 0 14px rgba(59,130,246,0.2)' : 'none',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Manual tab */}
          {setupTab === 'manual' && (
            <div>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, marginBottom: 10, overflow: 'hidden', animation: 'fadeUp 0.25s ease', backdropFilter: 'blur(10px)' }}>
                  <div onClick={() => toggleCollapse(q.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>ข้อ {idx + 1}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question || '(ยังไม่มีคำถาม)'}</span>
                    {q.answer && <span style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, border: '1px solid rgba(96,165,250,0.3)' }}>✓ {q.answer}</span>}
                    <button onClick={e => { e.stopPropagation(); removeQuestion(q.id); }} style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)', color: '#f9a8d4', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>🗑</button>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>{collapsed[q.id] ? '▼' : '▲'}</span>
                  </div>
                  {!collapsed[q.id] && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <textarea placeholder="คำถาม..." value={q.question} onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                        style={{ width: '100%', marginTop: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', fontFamily: FONT, fontSize: 15, resize: 'vertical', minHeight: 56, outline: 'none', boxSizing: 'border-box' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        {OPTION_KEYS.map(key => (
                          <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: q.answer === key ? OPT[key].mid : 'rgba(255,255,255,0.07)', color: q.answer === key ? '#fff' : OPT[key].mid, fontSize: 12, fontWeight: 800, border: `1.5px solid ${OPT[key].mid}` }}>{key}</span>
                            <input placeholder={`ตัวเลือก ${key}`} value={q.options[key]} onChange={e => updateOption(q.id, key, e.target.value)}
                              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(0,0,0,0.25)', color: '#f1f5f9', fontFamily: FONT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>เฉลย:</span>
                        {OPTION_KEYS.map(key => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                            <input type="radio" name={`ans_${q.id}`} checked={q.answer === key} onChange={() => updateQuestion(q.id, 'answer', key)} style={{ accentColor: OPT[key].mid }} />
                            <span style={{ color: q.answer === key ? OPT[key].mid : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: q.answer === key ? 700 : 400 }}>{key}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {questions.length < 15 && (
                <button onClick={addQuestion} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px dashed rgba(96,165,250,0.35)', background: 'transparent', color: 'rgba(147,197,253,0.75)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: FONT, marginBottom: 12, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.35)'; e.currentTarget.style.background = 'transparent'; }}>
                  ➕ เพิ่มคำถาม ({questions.length}/15)
                </button>
              )}
            </div>
          )}

          {/* AI tab */}
          {setupTab === 'ai' && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 24, marginBottom: 16, backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>🤖 AI สร้างคำถาม</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: 'rgba(147,197,253,0.65)', fontSize: 12, display: 'block', marginBottom: 6 }}>หัวข้อ *</label>
                <input placeholder="เช่น บัญชีการเงิน, กฎหมายธุรกิจ, ประวัติศาสตร์..." value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', fontFamily: FONT, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[{ label: 'ความยาก', val: aiDifficulty, opts: ['ง่าย', 'ปานกลาง', 'ยาก'], set: setAiDifficulty }, { label: 'จำนวน', val: aiCount, opts: [3, 5, 7, 10, 15], set: v => setAiCount(Number(v)) }].map(({ label, val, opts, set }) => (
                  <div key={label}>
                    <label style={{ color: 'rgba(147,197,253,0.65)', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
                    <select value={val} onChange={e => set(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(0,0,0,0.4)', color: '#f1f5f9', fontFamily: FONT, fontSize: 13, outline: 'none' }}>
                      {opts.map(o => <option key={o} value={o}>{o}{label === 'จำนวน' ? ' ข้อ' : ''}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={generateWithAI} disabled={aiLoading} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: aiLoading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#1d4ed8,#7c3aed,#db2777)', color: aiLoading ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: aiLoading ? 'not-allowed' : 'pointer', boxShadow: aiLoading ? 'none' : '0 0 24px rgba(124,58,237,0.4)' }}>
                {aiLoading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>AI กำลังสร้าง...</span> : '✨ AI สร้างเลย'}
              </button>
              {aiPreview && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ color: '#93c5fd', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✅ {aiPreview.length} คำถามพร้อมแล้ว</div>
                  {aiPreview.map((q, i) => (
                    <div key={q.id} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 12, marginBottom: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ color: '#f9a8d4', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>ข้อ {i + 1} · เฉลย: {q.answer}</div>
                      <div style={{ color: '#f1f5f9', fontSize: 13, marginBottom: 6 }}>{q.question}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        {OPTION_KEYS.map(k => <div key={k} style={{ fontSize: 12, color: q.answer === k ? OPT[k].mid : 'rgba(255,255,255,0.3)', fontWeight: q.answer === k ? 700 : 400 }}>{k}: {q.options[k]} {q.answer === k && '✓'}</div>)}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <button onClick={acceptAi} style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(96,165,250,0.3)', cursor: 'pointer', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontWeight: 700, fontSize: 13, fontFamily: FONT }}>➕ เพิ่มต่อจากเดิม</button>
                    <button onClick={replaceAi} style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(244,114,182,0.3)', cursor: 'pointer', background: 'rgba(236,72,153,0.15)', color: '#f9a8d4', fontWeight: 700, fontSize: 13, fontFamily: FONT }}>🔄 แทนที่ทั้งหมด</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>📋 คำถาม: <strong style={{ color: '#93c5fd' }}>{questions.length}</strong>/15</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>✅ พร้อม: <strong style={{ color: '#86efac' }}>{questions.filter(q => q.question?.trim() && q.options?.A && q.options?.B && q.options?.C && q.options?.D && q.answer).length}</strong></span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>⏱️ {timerSeconds}s/ข้อ</span>
            {gameMode === 'teams' && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>⚔️ {teamNames[0]} vs {teamNames[1]}</span>}
          </div>

          {/* Start button — BLUE → PURPLE → PINK */}
          <button onClick={startGame} style={{
            width: '100%', padding: 24, borderRadius: 18, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#1d4ed8 0%,#7c3aed 50%,#db2777 100%)',
            color: '#fff', fontWeight: 900, fontSize: 26, fontFamily: FONT,
            boxShadow: '0 8px 40px rgba(124,58,237,0.55), 0 0 0 1px rgba(255,255,255,0.1)',
            transition: 'all 0.22s', letterSpacing: 2,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02) translateY(-3px)'; e.currentTarget.style.boxShadow = '0 18px 60px rgba(124,58,237,0.7), 0 0 0 2px rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(124,58,237,0.55), 0 0 0 1px rgba(255,255,255,0.1)'; }}>
            {gameMode === 'teams' ? '⚔️ เริ่มแข่งขัน!' : '▶ เริ่มเกม!'}
          </button>
        </div>
      )}

      {/* ═══════════════ GAME SCREEN ═══════════════ */}
      {(gamePhase === 'playing' || gamePhase === 'locked' || gamePhase === 'reveal') && currentQuestion && (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(160deg,#0d1117 0%,#1a1035 50%,#0d1117 100%)',
          position: 'relative', zIndex: 1, overflow: 'hidden',
        }}>

          {/* ── TOP BAR (56px) ── */}
          <div style={{
            flexShrink: 0, height: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', gap: 10,
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'relative', zIndex: 2,
          }}>
            {/* Left: branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>🎰</span>
              <div style={{ color: '#ffd700', fontWeight: 900, fontSize: 14, lineHeight: 1 }}>เกมเศรษฐี</div>
            </div>

            {/* Center: question + prize */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 12px', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 }}>
                ข้อ {currentLevel}/{gameQuestions.length}
              </div>
              <div style={{ background: 'linear-gradient(135deg,#78350f,#d97706,#fbbf24)', color: '#000', borderRadius: 8, padding: '4px 14px', fontSize: 13, fontWeight: 900, boxShadow: '0 2px 10px rgba(251,191,36,0.4)' }}>
                💰 ฿{prizeEntry?.amount}
              </div>
            </div>

            {/* Right: QR + timer + back */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {voteRoom && (
                <button onClick={() => setShowQR(v => !v)} style={{
                  padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 700,
                  background: showQR ? 'rgba(0,180,230,0.25)' : 'rgba(0,180,230,0.12)',
                  border: `1px solid rgba(0,180,230,${showQR ? '0.7' : '0.3'})`,
                  color: '#00b4e6', transition: 'all 0.15s',
                }}>📱 QR {voteRoom}</button>
              )}
              {useTimer && (
                <div style={{ color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#10b981', fontSize: 13, fontWeight: 900, fontFamily: 'monospace', minWidth: 32, textAlign: 'center' }}>
                  ⏱{timeLeft}
                </div>
              )}
              {gameMode === 'solo' && gamePhase === 'playing' && (
                <button onClick={walkAway} style={{ padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: FONT, fontSize: 11, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>🚶</button>
              )}
              <button onClick={goToSetup} style={{ padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: FONT, fontSize: 11, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>🏠</button>
            </div>
          </div>

          {/* ── MAIN AREA (flex: 1) ── */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

            {/* ════ LEFT PANEL — question + answers (no scroll, flex layout) ════ */}
            <div style={{
              flex: 3, display: 'flex', flexDirection: 'column',
              padding: '10px 14px', gap: 10, overflow: 'hidden',
              background: 'rgba(255,255,255,0.02)',
            }}>

              {/* Timer widget */}
              {useTimer && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <TimerCircle seconds={timeLeft} maxSeconds={timerSeconds} />
                </div>
              )}

              {/* Status label (read-only indicator) */}
              {gamePhase === 'playing' && timerStarted && (
                <div style={{ flexShrink: 0, textAlign: 'center', fontSize: 11, color: '#34d399', fontWeight: 700, letterSpacing: 1 }}>
                  {useTimer ? '⏱ กำลังนับ...' : '✅ คำถามเปิดแล้ว — รอนักศึกษาตอบ'}
                </div>
              )}

              {/* Question card (capped height — tiles always fill remaining space) */}
              <div style={{
                flexShrink: 0,
                background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: 18, padding: '16px 20px',
                textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                animation: 'borderGlow 4s ease-in-out infinite',
                maxHeight: '24%', overflowY: 'auto',
              }}>
                <p style={{ color: '#fff', fontSize: 19, fontWeight: 700, lineHeight: 1.65, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer tiles 2x2 — fills ALL remaining space */}
              <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
                {OPTION_KEYS.map(key => {
                  const isHidden = hiddenOptions.includes(key);
                  if (isHidden) return <div key={key} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', minHeight: 72 }} />;
                  const kc = KC[key];
                  const canClick = false; // teacher never clicks tiles — use reveal button instead
                  const q = gameQuestions[currentQ];
                  const isCorrect = q && key === q.answer;
                  const isSel = selectedAnswer === key;
                  let bg = kc.bg, borderCol = kc.border, opacity = 1;
                  if (gamePhase === 'reveal') {
                    if (isCorrect) { bg = 'linear-gradient(135deg,#052e16,#16a34a)'; borderCol = '#4ade80'; }
                    else if (isSel) { bg = 'linear-gradient(135deg,#450a0a,#dc2626)'; borderCol = '#f87171'; }
                    else { bg = 'rgba(255,255,255,0.04)'; borderCol = 'rgba(255,255,255,0.1)'; opacity = 0.45; }
                  } else if (gamePhase === 'locked' && isSel) {
                    borderCol = '#ffd700';
                  }
                  // vote pct
                  const votePct = voteRoom && voteData.total > 0 ? Math.round((voteData[key] || 0) / voteData.total * 100) : 0;
                  return (
                    <button key={key} onClick={() => canClick && selectAnswer(key)} disabled={!canClick}
                      style={{
                        padding: '14px 16px', borderRadius: 12, outline: 'none',
                        background: bg, border: `2px solid ${borderCol}`,
                        color: '#fff', cursor: canClick ? 'pointer' : 'default',
                        fontFamily: FONT, fontSize: 15, fontWeight: 700,
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.2s', opacity,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                        minHeight: 72,
                        animation: gamePhase === 'reveal' && isCorrect ? 'revealPop 0.45s ease' : 'none',
                        position: 'relative', overflow: 'hidden',
                      }}
                      onMouseEnter={e => { if (canClick) e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', fontSize: 18, fontWeight: 900 }}>{kc.shape}</span>
                      <span style={{ lineHeight: 1.4, flex: 1 }}>{currentQuestion.options[key]}</span>
                      {/* Vote % bar at tile bottom */}
                      {voteRoom && voteData.total > 0 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: '0 0 10px 10px' }}>
                          <div style={{ height: '100%', width: `${votePct}%`, background: 'rgba(255,255,255,0.7)', borderRadius: '0 0 10px 10px', transition: 'width 0.8s ease' }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Locked indicator */}
              {gamePhase === 'locked' && (
                <div style={{ flexShrink: 0, color: '#ffd700', fontSize: 13, fontWeight: 800, textAlign: 'center', animation: 'goldPulse 0.9s ease-in-out infinite' }}>
                  ⏳ กำลังตรวจคำตอบ...
                </div>
              )}

              {/* Reveal feedback (small inline, below tiles) */}
              {gamePhase === 'reveal' && (
                <div style={{ flexShrink: 0, textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
                  {gameMode === 'solo' && selectedAnswer === currentQuestion.answer && (
                    <div style={{ color: '#4ade80', fontSize: 14, fontWeight: 800 }}>✅ ถูกต้อง! +฿{prizeEntry?.amount}</div>
                  )}
                  {gameMode === 'solo' && selectedAnswer && selectedAnswer !== currentQuestion.answer && (
                    <div style={{ color: '#f87171', fontSize: 13, fontWeight: 700 }}>❌ เฉลย: {currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}</div>
                  )}
                  {gameMode === 'solo' && !selectedAnswer && (
                    <div style={{ color: '#f87171', fontSize: 13, fontWeight: 700 }}>⏰ หมดเวลา! เฉลย: {currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}</div>
                  )}
                  {gameMode === 'teams' && (
                    <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, padding: '7px 14px', display: 'inline-block' }}>
                      <div style={{ color: '#fcd34d', fontSize: 13, fontWeight: 900 }}>
                        ✅ เฉลย: {currentQuestion.answer} — {currentQuestion.options[currentQuestion.answer]}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ════ RIGHT PANEL — action zone (always visible) + scrollable info ════ */}
            <div style={{
              flex: 2, display: 'flex', flexDirection: 'column',
              background: 'rgba(0,0,0,0.25)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>

              {/* ── PRIMARY ACTION ZONE — always visible, never scrolls ── */}
              <div style={{ flexShrink: 0, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: 70 }}>

                {/* Step 1: Open question */}
                {gamePhase === 'playing' && !timerStarted && (
                  <button onClick={beginTimer} style={{
                    width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg,#d97706,#fbbf24)',
                    color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: FONT,
                    boxShadow: '0 6px 24px rgba(251,191,36,0.55)',
                    animation: 'awardPulse 1.4s ease-in-out infinite',
                  }}>
                    {useTimer ? '▶ เริ่มจับเวลา' : '▶ เปิดคำถาม'}
                  </button>
                )}

                {/* Step 2 (teams): Reveal answer */}
                {gameMode === 'teams' && gamePhase === 'playing' && timerStarted && (
                  <button onClick={revealAnswer} style={{
                    width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                    color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: FONT,
                    boxShadow: '0 6px 24px rgba(59,130,246,0.5)',
                  }}>🔍 เฉลยคำตอบ</button>
                )}

                {/* Step 3 (teams): Award team */}
                {gameMode === 'teams' && gamePhase === 'reveal' && awardPending && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: 1, marginBottom: 2 }}>ทีมไหนตอบถูก?</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[0, 1].map(i => (
                        <button key={i} onClick={() => awardTeam(i)} style={{
                          padding: '14px 8px', borderRadius: 12,
                          border: `2px solid ${i === 0 ? 'rgba(59,130,246,0.7)' : 'rgba(236,72,153,0.7)'}`,
                          background: i === 0 ? 'rgba(37,99,235,0.25)' : 'rgba(219,39,119,0.25)',
                          color: '#fff', fontWeight: 900, fontSize: 13,
                          cursor: 'pointer', fontFamily: FONT,
                          animation: 'awardPulse 1.8s ease-in-out infinite',
                          boxShadow: `0 0 24px ${i === 0 ? 'rgba(59,130,246,0.4)' : 'rgba(236,72,153,0.4)'}`,
                        }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          🏆 {TEAM_CFG[i].emoji} {teamNames[i]}<br />
                          <span style={{ fontSize: 11, opacity: 0.8 }}>+฿{prizeEntry?.amount}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => awardTeam(-1)} style={{
                      padding: '10px', borderRadius: 10,
                      border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(239,68,68,0.1)',
                      color: '#f87171', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', fontFamily: FONT,
                    }}>❌ ผิดทั้งคู่</button>
                  </div>
                )}

                {/* Solo: reveal correct answer + auto-advance */}
                {gameMode === 'solo' && gamePhase === 'playing' && timerStarted && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 1 }}>
                      รอนักเรียนตอบ · {voteData.total > 0 ? `${voteData.total} คนโหวตแล้ว` : 'ยังไม่มีโหวต'}
                    </div>
                    <button onClick={revealSolo} style={{
                      width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                      color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: FONT,
                      boxShadow: '0 6px 24px rgba(59,130,246,0.45)',
                    }}>🔍 เฉลยและข้อถัดไป</button>
                  </div>
                )}

                {/* Locked */}
                {gamePhase === 'locked' && (
                  <div style={{ color: '#ffd700', fontSize: 14, fontWeight: 800, textAlign: 'center', padding: '8px 0', animation: 'goldPulse 0.9s ease-in-out infinite' }}>
                    ⏳ กำลังตรวจคำตอบ...
                  </div>
                )}
              </div>

              {/* ── SCROLLABLE INFO ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px' }}>

                {/* Team scores */}
                {gameMode === 'teams' && (
                  <div style={{ paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>⚔️ คะแนนทีม</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[0, 1].map(i => {
                        const colors = [
                          { color: '#2563eb', glow: 'rgba(37,99,235,0.4)', dimBg: 'rgba(37,99,235,0.12)' },
                          { color: '#db2777', glow: 'rgba(219,39,119,0.4)', dimBg: 'rgba(219,39,119,0.12)' },
                        ][i];
                        const barPct = Math.min(100, (teamScores[i] / MAX_SCORE) * 100);
                        return (
                          <div key={i} style={{ background: colors.dimBg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${colors.color}30` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 16 }}>{TEAM_CFG[i].emoji}</span>
                              <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, flex: 1 }}>{teamNames[i]}</span>
                            </div>
                            <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 900, marginBottom: 6 }}>฿{teamScores[i].toLocaleString()}</div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${barPct}%`, background: colors.color, borderRadius: 99, transition: 'width 1.2s ease', boxShadow: `0 0 8px ${colors.glow}` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live votes */}
                {voteRoom && voteData.total > 0 && (
                  <div style={{ paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                      👥 โหวต · {voteData.total} คน
                    </div>
                    {['A', 'B', 'C', 'D'].filter(k => currentQuestion?.options?.[k]).map(key => {
                      const count = voteData[key] || 0;
                      const pct = voteData.total > 0 ? Math.round((count / voteData.total) * 100) : 0;
                      return (
                        <div key={key} style={{ marginBottom: 7 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 11 }}>
                            <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{KC[key].shape} {key}: {currentQuestion.options[key]}</span>
                            <span style={{ color: 'rgba(255,255,255,0.45)' }}>{pct}% ({count})</span>
                          </div>
                          <div style={{ height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: KC[key].bar, borderRadius: 99, transition: 'width 0.9s ease', boxShadow: `0 0 6px ${KC[key].glow}60` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* QR Code */}
                {showQR && voteRoom && (
                  <div style={{ paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>📱 สแกนเข้าร่วม</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ background: '#fff', borderRadius: 10, padding: 5, boxShadow: '0 0 16px rgba(0,180,230,0.3)', flexShrink: 0 }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/student/millionaire?room=${voteRoom}` : `/student/millionaire?room=${voteRoom}`)}&color=0d1117&bgcolor=ffffff&margin=4`}
                          alt="QR" width={100} height={100} style={{ display: 'block', borderRadius: 6 }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#00b4e6', letterSpacing: 5, fontFamily: 'monospace', lineHeight: 1, marginBottom: 4 }}>{voteRoom}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {typeof window !== 'undefined' ? window.location.origin : ''}/student/millionaire
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Solo lifelines */}
                {gameMode === 'solo' && (
                  <div style={{ paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>🎯 ตัวช่วย</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {[
                        { k: 'fifty', icon: '✂️', label: '50:50 — ตัดตัวเลือกผิด 2 ข้อ', action: useFiftyFifty },
                        { k: 'audience', icon: '👥', label: 'ถามห้องเรียน', action: useAudience },
                        { k: 'skip', icon: '⏭', label: 'ข้ามข้อ', action: useSkip },
                      ].map(ll => {
                        const active = lifelines[ll.k] && gamePhase === 'playing';
                        return (
                          <button key={ll.k} onClick={ll.action} disabled={!active} style={{
                            padding: '9px 12px', borderRadius: 9, cursor: active ? 'pointer' : 'not-allowed',
                            background: active ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                            color: active ? '#ffd700' : 'rgba(255,255,255,0.2)',
                            fontSize: 12, fontWeight: 700, fontFamily: FONT,
                            textAlign: 'left', opacity: active ? 1 : 0.4,
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            <span>{ll.icon}</span><span>{ll.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ WIN ═══════════════ */}
      {gamePhase === 'won' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #fffbeb, #fef3c7)', padding: 32, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {gameMode === 'teams' ? (
            <div style={{ animation: 'winBounce 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ fontSize: 80, marginBottom: 12 }}>⚔️</div>
              <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 28px', color: '#d97706', animation: 'goldPulse 2s ease-in-out infinite' }}>
                {teamWinner === 'tie' ? '🤝 เสมอกัน!' : teamWinner !== null ? `🏆 ${teamNames[teamWinner]} ชนะ!` : 'จบการแข่งขัน!'}
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 480, margin: '0 auto 36px' }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ background: TEAM_CFG[i].bg, border: `2.5px solid ${i === teamWinner ? '#d97706' : TEAM_CFG[i].color}`, borderRadius: 20, padding: '28px 20px', textAlign: 'center', boxShadow: i === teamWinner ? '0 0 30px rgba(217,119,6,0.2)' : `0 0 16px ${TEAM_CFG[i].color}20`, animation: i === teamWinner ? 'teamWin 0.6s ease, awardPulse 2s 0.6s ease-in-out infinite' : 'teamWin 0.6s ease' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>{i === teamWinner ? '🏆' : TEAM_CFG[i].emoji}</div>
                    <div style={{ color: TEAM_CFG[i].color, fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{teamNames[i]}</div>
                    <div style={{ color: '#d97706', fontSize: 28, fontWeight: 900 }}>฿{teamScores[i].toLocaleString()}</div>
                    {i === teamWinner && <div style={{ color: '#d97706', fontSize: 12, marginTop: 6 }}>👑 ผู้ชนะ</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ animation: 'winBounce 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ fontSize: 80, marginBottom: 12 }}>🎉</div>
              <h1 style={{ fontSize: 52, fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(135deg,#d97706,#ea580c,#d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'goldPulse 2s ease-in-out infinite' }}>ยินดีด้วย!</h1>
              <div style={{ color: '#64748b', fontSize: 18, marginBottom: 14 }}>คุณได้รับรางวัล</div>
              <div style={{ fontSize: 64, fontWeight: 900, color: '#d97706', textShadow: '0 0 32px rgba(217,119,6,0.35)', marginBottom: 36, animation: 'goldPulse 1.5s ease-in-out infinite' }}>฿{finalPrize}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={restartGame} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#854d0e,#ffd700)', color: '#000', fontWeight: 800, fontSize: 16, fontFamily: FONT, boxShadow: '0 4px 20px rgba(217,119,6,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>🔄 เล่นอีกครั้ง</button>
            <button onClick={goToSetup} style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', background: '#ffffff', color: '#64748b', fontWeight: 600, fontSize: 16, fontFamily: FONT, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#ffffff'; }}>🏠 กลับตั้งค่า</button>
          </div>
        </div>
      )}

      {/* ═══════════════ LOST ═══════════════ */}
      {gamePhase === 'lost' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #fff1f2, #fee2e2)', padding: 32, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 80, marginBottom: 12, animation: 'winBounce 0.6s ease' }}>💔</div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#ef4444', margin: '0 0 12px' }}>เสียใจด้วย!</h1>
          {currentQuestion && (
            <div style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>
              เฉลยข้อ {currentLevel}: <span style={{ color: '#16a34a', fontWeight: 700 }}>{currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}</span>
            </div>
          )}
          <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: 20, padding: '24px 44px', marginBottom: 36, boxShadow: '0 4px 16px rgba(239,68,68,0.1)' }}>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>รางวัลที่ได้รับ (Safe Haven)</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: finalPrize === '0' ? '#cbd5e1' : '#d97706' }}>
              ฿{finalPrize === '0' ? '0' : finalPrize}
            </div>
            {finalPrize === '0' && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>ไม่ถึง Safe Haven (ข้อ 5)</div>}
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={restartGame} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#854d0e,#ffd700)', color: '#000', fontWeight: 800, fontSize: 16, fontFamily: FONT }}>🔄 เล่นอีกครั้ง</button>
            <button onClick={goToSetup} style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', background: '#ffffff', color: '#64748b', fontWeight: 600, fontSize: 16, fontFamily: FONT }}>🏠 กลับตั้งค่า</button>
          </div>
        </div>
      )}
    </div>
  );
}

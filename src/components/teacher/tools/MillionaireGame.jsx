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

// Color scheme per option — WWTBAM-inspired
const OPT = {
  A: { dark: '#051a40', mid: '#1d4ed8', neon: '#93c5fd', glow: '#3b82f6' },
  B: { dark: '#3b1a00', mid: '#c2410c', neon: '#fdba74', glow: '#f97316' },
  C: { dark: '#022c1a', mid: '#047857', neon: '#6ee7b7', glow: '#10b981' },
  D: { dark: '#3b0028', mid: '#9d174d', neon: '#f9a8d4', glow: '#e6007e' },
};

const TEAM_CFG = [
  { color: '#3b82f6', bg: '#051a40', dim: '#0a2a6e', emoji: '🔵', label: 'ทีม A' },
  { color: '#e6007e', bg: '#3b0028', dim: '#6e0050', emoji: '🔴', label: 'ทีม B' },
];

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

// ── Timer SVG circle ──────────────────────────────────────────────────────────
function TimerCircle({ seconds, maxSeconds, size = 100 }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const frac = maxSeconds > 0 ? seconds / maxSeconds : 0;
  const col = frac > 0.5 ? '#10b981' : frac > 0.25 ? '#f59e0b' : '#ef4444';
  const urgent = frac <= 0.25;
  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0a1530" strokeWidth={9} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={9}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - frac)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s', filter: urgent ? `drop-shadow(0 0 6px ${col})` : 'none' }}
      />
      <text x={size / 2} y={size / 2 + 9} textAnchor="middle"
        fontSize={size * 0.28} fontWeight={900} fill={col} fontFamily={FONT}
        style={{ animation: urgent ? 'urgentPulse 0.5s ease-in-out infinite' : 'none' }}>
        {seconds}
      </text>
    </svg>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'linear-gradient(135deg,#0d1a3a,#1a0d4a)', border: '2px solid #4a3a8a', borderRadius: 22, padding: '36px 40px', maxWidth: 440, width: '90%', textAlign: 'center', boxShadow: '0 0 80px rgba(124,77,255,0.5)' }}>
        <div style={{ fontSize: 44, marginBottom: 6 }}>👥</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#ffd700', marginBottom: 24, fontFamily: FONT }}>ผลโหวตจากห้องเรียน</div>
        {OPTION_KEYS.filter(k => options[k]).map(k => (
          <div key={k} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: OPT[k].neon, fontSize: 14, fontFamily: FONT, fontWeight: 700 }}>{k}: {options[k]}</span>
              <span style={{ color: OPT[k].neon, fontWeight: 700, fontSize: 14 }}>{pcts[k]}%</span>
            </div>
            <div style={{ background: '#0a1020', borderRadius: 10, height: 28, overflow: 'hidden', border: `1px solid ${OPT[k].mid}40` }}>
              <div style={{ width: `${pcts[k]}%`, height: '100%', background: `linear-gradient(90deg,${OPT[k].mid},${OPT[k].neon})`, borderRadius: 10, transition: 'width 1.3s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 12px ${OPT[k].glow}` }} />
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: 18, padding: '10px 32px', borderRadius: 10, border: '1px solid #4a3a8a', background: 'transparent', color: '#8899bb', cursor: 'pointer', fontFamily: FONT, fontSize: 14 }}>ปิด</button>
      </div>
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
  const [timerSeconds, setTimerSeconds] = useState(30);

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

  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

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
    } else {
      setAwardPending(true);
    }
  }, [gameMode, currentQ]);

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

  useEffect(() => {
    if (gamePhase === 'playing') {
      setSelectedAnswer(null);
      setHiddenOptions([]);
      setAwardPending(false);
      startTimer(timerSeconds);
    }
  }, [currentQ, gamePhase]); // eslint-disable-line

  useEffect(() => () => stopTimer(), [stopTimer]);

  // Start game
  const startGame = useCallback(() => {
    const valid = questions.filter(q => q.question?.trim() && q.options?.A && q.options?.B && q.options?.C && q.options?.D && q.answer);
    if (valid.length < 3) { toast.error('ต้องมีคำถามที่สมบูรณ์อย่างน้อย 3 ข้อ'); return; }
    setGameQuestions(valid.slice(0, 15));
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
    startTimer(timerSeconds);
  }, [questions, timerSeconds, startTimer]);

  // Solo: select answer
  const selectAnswer = useCallback((key) => {
    if (gamePhase !== 'playing' || hiddenOptions.includes(key)) return;
    stopTimer();
    setSelectedAnswer(key);
    setGamePhase('locked');
    playSelect(audioRef);
    setTimeout(() => {
      const q = gameQuestions[currentQ];
      setGamePhase('reveal');
      if (key === q.answer) {
        playCorrect(audioRef);
        setTimeout(() => {
          if (currentQ + 1 >= gameQuestions.length) {
            playWin(audioRef);
            setFinalPrize(PRIZES[Math.min(gameQuestions.length, 15) - 1].amount);
            setGamePhase('won');
            launchConfetti();
          } else {
            setCurrentQ(n => n + 1);
            setGamePhase('playing');
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
  }, [gamePhase, hiddenOptions, stopTimer, gameQuestions, currentQ]);

  // Teams: reveal answer
  const revealAnswer = useCallback(() => {
    stopTimer();
    setGamePhase('reveal');
    setAwardPending(true);
    playSelect(audioRef);
  }, [stopTimer]);

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
        setCurrentQ(n => n + 1);
        setGamePhase('playing');
      }
    }, 1200);
  }, [awardPending, currentQ, gameQuestions.length, teamNames]);

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

  const restartGame = () => { stopTimer(); setCurrentQ(0); setSelectedAnswer(null); setHiddenOptions([]); setLifelines({ fifty: true, audience: true, skip: true }); setTeamScores([0, 0]); setTeamWinner(null); setFinalPrize('0'); setConfettiActive(false); setAwardPending(false); setGamePhase('playing'); };
  const goToSetup = () => { stopTimer(); setGamePhase('setup'); setCurrentQ(0); setSelectedAnswer(null); setHiddenOptions([]); setLifelines({ fifty: true, audience: true, skip: true }); setTeamScores([0, 0]); setTeamWinner(null); setConfettiActive(false); setAwardPending(false); };

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
      if (isCorrect) return { bg: 'linear-gradient(135deg,#064e3b,#065f46)', border: '#10b981', color: '#6ee7b7', shadow: `0 0 28px #10b98170` };
      if (isSel) return { bg: 'linear-gradient(135deg,#450a0a,#6b1a1a)', border: '#ef4444', color: '#fca5a5', shadow: `0 0 28px #ef444460` };
      return { bg: opt.dark, border: '#1a2030', color: '#2a3a5a', shadow: 'none' };
    }
    if (gamePhase === 'locked' && isSel) return { bg: `linear-gradient(135deg,${opt.dark},${opt.mid}80)`, border: opt.neon, color: opt.neon, shadow: `0 0 32px ${opt.glow}` };
    return { bg: opt.dark, border: `${opt.mid}90`, color: opt.neon, shadow: 'none' };
  };

  // ── Global CSS ────────────────────────────────────────────────────────────────
  const CSS = `
    @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
    @keyframes goldPulse{0%,100%{text-shadow:0 0 24px rgba(255,215,0,0.5),0 0 48px rgba(255,165,0,0.3)}50%{text-shadow:0 0 48px rgba(255,215,0,1),0 0 96px rgba(255,165,0,0.6)}}
    @keyframes winBounce{0%{transform:scale(0.2) rotate(-15deg);opacity:0}60%{transform:scale(1.12) rotate(4deg);opacity:1}80%{transform:scale(0.96) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes ladderBlink{0%,100%{background:linear-gradient(90deg,#3d2a00,#5a3d00)}50%{background:linear-gradient(90deg,#6a4800,#8a6200)}}
    @keyframes urgentPulse{0%,100%{opacity:1}50%{opacity:0.35}}
    @keyframes borderGlow{0%,100%{box-shadow:0 0 12px rgba(80,120,255,0.15),inset 0 0 30px rgba(80,120,255,0.04)}50%{box-shadow:0 0 32px rgba(80,120,255,0.4),inset 0 0 60px rgba(80,120,255,0.08)}}
    @keyframes revealPop{0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
    @keyframes slideL{from{transform:translateX(-24px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes slideR{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes awardPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
    @keyframes teamWin{0%{transform:scale(0.9);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
    @keyframes starTwinkle{0%,100%{opacity:0.2;transform:scale(1)}50%{opacity:0.8;transform:scale(1.4)}}
  `;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#020818', position: 'relative', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* Starfield BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5,
            height: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5,
            borderRadius: '50%',
            background: ['#ffd700', '#93c5fd', '#fff', '#c4b5fd', '#6ee7b7'][i % 5],
            top: `${(i * 17 + 5) % 95}%`,
            left: `${(i * 23 + 11) % 97}%`,
            animation: `starTwinkle ${2 + (i % 5) * 0.7}s ease-in-out ${(i * 0.13) % 2}s infinite`,
          }} />
        ))}
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
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 8, filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))' }}>🎰</div>
            <h1 style={{ margin: '0 0 6px', fontSize: 44, fontWeight: 900, background: 'linear-gradient(135deg,#ffd700,#ff8c00,#ff4500,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'goldPulse 3s ease-in-out infinite', letterSpacing: 2 }}>
              เกมเศรษฐี
            </h1>
            <p style={{ color: '#4a5a8a', fontSize: 14, margin: 0, letterSpacing: 1 }}>Who Wants to Be a Millionaire? — Classroom Edition</p>
          </div>

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            {[
              { id: 'solo', icon: '👤', title: 'โหมดเดี่ยว', desc: 'ตอบคำถามขึ้นบันได สู่รางวัล 1 ล้าน' },
              { id: 'teams', icon: '⚔️', title: 'แข่ง 2 ทีม', desc: 'สองทีมแข่งกัน ทีมคะแนนสูงสุดชนะ' },
            ].map(m => (
              <button key={m.id} onClick={() => setGameMode(m.id)} style={{
                padding: '18px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
                background: gameMode === m.id ? 'linear-gradient(135deg,#1a1200,#2d2000)' : '#0a0f1f',
                border: `2px solid ${gameMode === m.id ? '#ffd700' : '#1e2a4a'}`,
                boxShadow: gameMode === m.id ? '0 0 24px rgba(255,215,0,0.25)' : 'none',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: gameMode === m.id ? '#ffd700' : '#6677aa', marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: '#2a3a5a' }}>{m.desc}</div>
                {gameMode === m.id && <div style={{ marginTop: 8, color: '#ffd700', fontSize: 12 }}>✓ เลือกแล้ว</div>}
              </button>
            ))}
          </div>

          {/* Team names */}
          {gameMode === 'teams' && (
            <div style={{ background: '#0a0f1f', border: '1px solid #1e2a4a', borderRadius: 14, padding: '18px 20px', marginBottom: 18, animation: 'fadeUp 0.3s ease' }}>
              <div style={{ color: '#ffd700', fontSize: 14, fontWeight: 800, marginBottom: 14 }}>⚔️ ตั้งชื่อทีม</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24, filter: `drop-shadow(0 0 6px ${TEAM_CFG[i].color})` }}>{TEAM_CFG[i].emoji}</span>
                    <input
                      value={teamNames[i]}
                      onChange={e => setTeamNames(n => { const nn = [...n]; nn[i] = e.target.value; return nn; })}
                      maxLength={12}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `2px solid ${TEAM_CFG[i].color}60`, background: TEAM_CFG[i].bg, color: TEAM_CFG[i].color, fontFamily: FONT, fontSize: 16, fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, background: '#0a0f1f', border: '1px solid #1e2a4a', borderRadius: 14, padding: '12px 20px', flexWrap: 'wrap' }}>
            <span style={{ color: '#4a5a8a', fontSize: 13, fontWeight: 600 }}>⏱️ เวลาต่อข้อ:</span>
            {[15, 30, 45, 60].map(s => (
              <button key={s} onClick={() => setTimerSeconds(s)} style={{ padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, background: timerSeconds === s ? 'linear-gradient(135deg,#854d0e,#ffd700)' : '#1e2a4a', color: timerSeconds === s ? '#000' : '#4a5a8a', fontWeight: timerSeconds === s ? 800 : 400, transition: 'all 0.15s' }}>{s}s</button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#0a0f1f', borderRadius: 12, padding: 4, marginBottom: 18, gap: 4, border: '1px solid #1e2a4a' }}>
            {[{ id: 'manual', label: '✏️ สร้างเอง' }, { id: 'ai', label: '🤖 AI สร้างให้' }].map(t => (
              <button key={t.id} onClick={() => setSetupTab(t.id)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: setupTab === t.id ? 'linear-gradient(135deg,#1a1200,#2d2000)' : 'transparent', color: setupTab === t.id ? '#ffd700' : '#4a5a8a', fontWeight: setupTab === t.id ? 700 : 400, fontSize: 14, fontFamily: FONT, transition: 'all 0.2s' }}>{t.label}</button>
            ))}
          </div>

          {/* Manual tab */}
          {setupTab === 'manual' && (
            <div>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ background: '#0a0f1f', border: '1px solid #1e2a4a', borderRadius: 14, marginBottom: 10, overflow: 'hidden', animation: 'fadeUp 0.25s ease' }}>
                  <div onClick={() => toggleCollapse(q.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ background: 'linear-gradient(135deg,#854d0e,#ffd700)', color: '#000', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>ข้อ {idx + 1}</span>
                    <span style={{ color: '#4a5a8a', flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question || '(ยังไม่มีคำถาม)'}</span>
                    {q.answer && <span style={{ background: '#022c1a', color: '#10b981', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>✓ {q.answer}</span>}
                    <button onClick={e => { e.stopPropagation(); removeQuestion(q.id); }} style={{ background: '#2a0a0a', border: 'none', color: '#ef4444', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>🗑</button>
                    <span style={{ color: '#2a3a5a', fontSize: 14 }}>{collapsed[q.id] ? '▼' : '▲'}</span>
                  </div>
                  {!collapsed[q.id] && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid #1e2a4a' }}>
                      <textarea placeholder="คำถาม..." value={q.question} onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                        style={{ width: '100%', marginTop: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a5a', background: '#050c1f', color: '#e2e8f0', fontFamily: FONT, fontSize: 15, resize: 'vertical', minHeight: 56, outline: 'none', boxSizing: 'border-box' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        {OPTION_KEYS.map(key => (
                          <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: q.answer === key ? OPT[key].mid : OPT[key].dark, color: q.answer === key ? '#fff' : OPT[key].neon, fontSize: 12, fontWeight: 800, border: `1.5px solid ${OPT[key].mid}` }}>{key}</span>
                            <input placeholder={`ตัวเลือก ${key}`} value={q.options[key]} onChange={e => updateOption(q.id, key, e.target.value)}
                              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${OPT[key].mid}40`, background: OPT[key].dark, color: OPT[key].neon, fontFamily: FONT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: '#4a5a8a', fontSize: 12 }}>เฉลย:</span>
                        {OPTION_KEYS.map(key => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                            <input type="radio" name={`ans_${q.id}`} checked={q.answer === key} onChange={() => updateQuestion(q.id, 'answer', key)} style={{ accentColor: OPT[key].neon }} />
                            <span style={{ color: q.answer === key ? OPT[key].neon : '#2a3a5a', fontSize: 13, fontWeight: q.answer === key ? 700 : 400 }}>{key}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {questions.length < 15 && (
                <button onClick={addQuestion} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px dashed #2a3a5a', background: 'transparent', color: '#3b82f6', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: FONT, marginBottom: 12, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3a5a'; }}>
                  ➕ เพิ่มคำถาม ({questions.length}/15)
                </button>
              )}
            </div>
          )}

          {/* AI tab */}
          {setupTab === 'ai' && (
            <div style={{ background: '#0a0f1f', border: '1px solid #1e2a4a', borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ffd700', marginBottom: 16 }}>🤖 AI สร้างคำถาม</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: '#4a5a8a', fontSize: 12, display: 'block', marginBottom: 6 }}>หัวข้อ *</label>
                <input placeholder="เช่น บัญชีการเงิน, กฎหมายธุรกิจ, ประวัติศาสตร์..." value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a3a5a', background: '#050c1f', color: '#e2e8f0', fontFamily: FONT, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[{ label: 'ความยาก', val: aiDifficulty, opts: ['ง่าย', 'ปานกลาง', 'ยาก'], set: setAiDifficulty }, { label: 'จำนวน', val: aiCount, opts: [3, 5, 7, 10, 15], set: v => setAiCount(Number(v)) }].map(({ label, val, opts, set }) => (
                  <div key={label}>
                    <label style={{ color: '#4a5a8a', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
                    <select value={val} onChange={e => set(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #2a3a5a', background: '#050c1f', color: '#e2e8f0', fontFamily: FONT, fontSize: 13, outline: 'none' }}>
                      {opts.map(o => <option key={o} value={o}>{o}{label === 'จำนวน' ? ' ข้อ' : ''}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={generateWithAI} disabled={aiLoading} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: aiLoading ? '#1e2a4a' : 'linear-gradient(135deg,#7c4dff,#00b4e6)', color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                {aiLoading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>AI กำลังสร้าง...</span> : '✨ AI สร้างเลย'}
              </button>
              {aiPreview && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ color: '#10b981', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✅ {aiPreview.length} คำถามพร้อมแล้ว</div>
                  {aiPreview.map((q, i) => (
                    <div key={q.id} style={{ background: '#050c1f', borderRadius: 10, padding: 12, marginBottom: 8, border: '1px solid #1e2a4a' }}>
                      <div style={{ color: '#ffd700', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>ข้อ {i + 1} · เฉลย: {q.answer}</div>
                      <div style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 6 }}>{q.question}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        {OPTION_KEYS.map(k => <div key={k} style={{ fontSize: 12, color: q.answer === k ? OPT[k].neon : '#2a3a5a', fontWeight: q.answer === k ? 700 : 400 }}>{k}: {q.options[k]} {q.answer === k && '✓'}</div>)}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <button onClick={acceptAi} style={{ padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#022c1a,#065f46)', color: '#6ee7b7', fontWeight: 700, fontSize: 13, fontFamily: FONT }}>➕ เพิ่มต่อจากเดิม</button>
                    <button onClick={replaceAi} style={{ padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1a0d4a,#2d1a7a)', color: '#c4b5fd', fontWeight: 700, fontSize: 13, fontFamily: FONT }}>🔄 แทนที่ทั้งหมด</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div style={{ background: '#0a0f1f', border: '1px solid #1e2a4a', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ color: '#4a5a8a', fontSize: 13 }}>📋 คำถาม: <strong style={{ color: '#ffd700' }}>{questions.length}</strong>/15</span>
            <span style={{ color: '#4a5a8a', fontSize: 13 }}>✅ พร้อม: <strong style={{ color: '#10b981' }}>{questions.filter(q => q.question?.trim() && q.options?.A && q.options?.B && q.options?.C && q.options?.D && q.answer).length}</strong></span>
            <span style={{ color: '#4a5a8a', fontSize: 13 }}>⏱️ {timerSeconds}s/ข้อ</span>
            {gameMode === 'teams' && <span style={{ color: '#4a5a8a', fontSize: 13 }}>⚔️ {teamNames[0]} vs {teamNames[1]}</span>}
          </div>

          {/* Start */}
          <button onClick={startGame} style={{ width: '100%', padding: 22, borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#854d0e,#ca8a04,#ffd700,#ff8c00)', color: '#000', fontWeight: 900, fontSize: 24, fontFamily: FONT, boxShadow: '0 8px 40px rgba(255,215,0,0.45)', transition: 'all 0.2s', letterSpacing: 2 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 14px 56px rgba(255,215,0,0.65)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(255,215,0,0.45)'; }}>
            {gameMode === 'teams' ? '⚔️ เริ่มแข่งขัน!' : '▶ เริ่มเกม!'}
          </button>
        </div>
      )}

      {/* ═══════════════ GAME SCREEN ═══════════════ */}
      {(gamePhase === 'playing' || gamePhase === 'locked' || gamePhase === 'reveal') && currentQuestion && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

          {/* Team score bar */}
          {gameMode === 'teams' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 20px', gap: 12, background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid #1e2a4a', backdropFilter: 'blur(8px)' }}>
              {[0, 1].map((i, arrIdx) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: arrIdx === 0 ? 'flex-start' : 'flex-end', flexDirection: arrIdx === 0 ? 'row' : 'row-reverse', animation: arrIdx === 0 ? 'slideL 0.4s ease' : 'slideR 0.4s ease' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: TEAM_CFG[i].bg, border: `2.5px solid ${TEAM_CFG[i].color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: `0 0 14px ${TEAM_CFG[i].color}50`, flexShrink: 0 }}>{TEAM_CFG[i].emoji}</div>
                  <div style={{ textAlign: arrIdx === 0 ? 'left' : 'right' }}>
                    <div style={{ color: TEAM_CFG[i].color, fontSize: 13, fontWeight: 800 }}>{teamNames[i]}</div>
                    <div style={{ color: '#ffd700', fontSize: 22, fontWeight: 900, textShadow: '0 0 12px rgba(255,215,0,0.5)' }}>฿{teamScores[i].toLocaleString()}</div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ffd700', fontSize: 22 }}>⚔️</div>
                <div style={{ color: '#2a3a5a', fontSize: 11, fontWeight: 600 }}>ข้อ {currentLevel}/{gameQuestions.length}</div>
              </div>
            </div>
          )}

          {/* Solo top bar */}
          {gameMode === 'solo' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #1e2a4a', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
              <div style={{ color: '#ffd700', fontWeight: 800, fontSize: 18, textShadow: '0 0 12px rgba(255,215,0,0.5)' }}>🎰 เกมเศรษฐี</div>
              <div style={{ color: '#2a3a5a', fontSize: 13 }}>ข้อ {currentLevel}/{gameQuestions.length} · ฿{prizeEntry?.amount}</div>
              {gamePhase === 'playing' && (
                <button onClick={walkAway} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #1e2a4a', background: 'transparent', color: '#4a5a8a', cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>🚶 เดินออก</button>
              )}
            </div>
          )}

          {/* Main layout */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '190px 1fr 180px', maxWidth: 1140, margin: '0 auto', width: '100%', padding: '20px 16px', boxSizing: 'border-box', gap: 0 }}>

            {/* Left: timer + lifelines */}
            <div style={{ paddingRight: 16 }}>
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <div style={{ color: '#2a3a5a', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>⏱️ เวลาเหลือ</div>
                <TimerCircle seconds={timeLeft} maxSeconds={timerSeconds} size={96} />
              </div>
              <div>
                <div style={{ color: '#2a3a5a', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>💡 ความช่วยเหลือ</div>
                {[
                  { k: 'fifty', icon: '🎯', label: '50:50', desc: 'ตัด 2 ตัวผิด', action: useFiftyFifty },
                  { k: 'audience', icon: '👥', label: 'ถามห้อง', desc: 'ดูผลโหวต', action: useAudience },
                  { k: 'skip', icon: '⏭', label: 'ข้ามข้อ', desc: 'ข้ามฟรี 1 ข้อ', action: useSkip },
                ].map(ll => {
                  const active = lifelines[ll.k] && gamePhase === 'playing';
                  return (
                    <button key={ll.k} onClick={ll.action} disabled={!active} style={{ width: '100%', marginBottom: 8, padding: '10px 12px', borderRadius: 12, border: lifelines[ll.k] ? '1px solid #2a3a6a' : '1px solid #0d1228', background: lifelines[ll.k] ? 'linear-gradient(135deg,#0d1530,#1a2040)' : '#050c1f', color: lifelines[ll.k] ? '#e2e8f0' : '#1e2a4a', cursor: active ? 'pointer' : 'not-allowed', fontFamily: FONT, textAlign: 'left', opacity: lifelines[ll.k] ? 1 : 0.3, transition: 'all 0.2s', boxShadow: active ? `0 0 12px rgba(80,120,255,0.1)` : 'none' }}
                      onMouseEnter={e => { if (active) e.currentTarget.style.boxShadow = '0 0 20px rgba(80,120,255,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = active ? '0 0 12px rgba(80,120,255,0.1)' : 'none'; }}>
                      <div style={{ fontSize: 18, marginBottom: 2 }}>{ll.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{ll.label}</div>
                      <div style={{ fontSize: 10, color: lifelines[ll.k] ? '#4a5a8a' : '#1e2a4a' }}>{lifelines[ll.k] ? ll.desc : 'ใช้แล้ว'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center: question + answers */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}>
              {/* Prize badge */}
              <div style={{ background: 'linear-gradient(135deg,#854d0e,#ca8a04,#ffd700)', color: '#000', borderRadius: 20, padding: '6px 28px', fontSize: 15, fontWeight: 900, marginBottom: 20, letterSpacing: 1, boxShadow: '0 4px 24px rgba(255,215,0,0.35)' }}>
                💰 ฿{prizeEntry?.amount}
              </div>

              {/* Question box */}
              <div style={{ background: 'linear-gradient(135deg,#0d1a40,#050c25)', border: '1.5px solid #2a3a6a', borderRadius: 20, padding: '28px 32px', marginBottom: 28, width: '100%', boxSizing: 'border-box', textAlign: 'center', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'borderGlow 3s ease-in-out infinite', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 240, height: 140, background: 'radial-gradient(ellipse,rgba(100,130,255,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
                <p style={{ color: '#fff', fontSize: 21, fontWeight: 700, lineHeight: 1.65, margin: 0, textShadow: '0 0 20px rgba(100,130,255,0.25)' }}>
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer grid — WWTBAM parallelogram style */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
                {OPTION_KEYS.map(key => {
                  const isHidden = hiddenOptions.includes(key);
                  if (isHidden) return <div key={key} style={{ visibility: 'hidden', height: 58 }} />;
                  const s = ansStyle(key);
                  const canClick = gamePhase === 'playing' && gameMode === 'solo';
                  const isRevealCorrect = gamePhase === 'reveal' && currentQuestion.answer === key;
                  return (
                    <button key={key} onClick={() => canClick && selectAnswer(key)} disabled={!canClick}
                      style={{ padding: '14px 18px', borderRadius: 12, background: s.bg, border: `2px solid ${s.border}`, color: s.color, boxShadow: s.shadow, cursor: canClick ? 'pointer' : 'default', fontFamily: FONT, fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.22s', outline: 'none', animation: isRevealCorrect ? 'revealPop 0.4s ease' : 'none', clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)' }}
                      onMouseEnter={e => { if (canClick) { e.currentTarget.style.boxShadow = `0 0 28px ${OPT[key].glow}70`; e.currentTarget.style.borderColor = OPT[key].neon; e.currentTarget.style.transform = 'scale(1.015)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = s.shadow; e.currentTarget.style.borderColor = s.border; e.currentTarget.style.transform = 'scale(1)'; }}>
                      <span style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg === OPT[key].dark ? OPT[key].mid : (gamePhase === 'reveal' && currentQuestion.answer === key ? '#10b981' : gamePhase === 'reveal' && selectedAnswer === key ? '#ef4444' : OPT[key].mid), color: '#fff', fontSize: 14, fontWeight: 900, boxShadow: `0 0 10px ${OPT[key].glow}60` }}>{key}</span>
                      <span>{currentQuestion.options[key]}</span>
                    </button>
                  );
                })}
              </div>

              {/* States */}
              {gamePhase === 'locked' && (
                <div style={{ marginTop: 22, color: '#ffd700', fontSize: 16, fontWeight: 700, animation: 'goldPulse 0.8s ease-in-out infinite' }}>⏳ กำลังตรวจคำตอบ...</div>
              )}

              {/* Teams: reveal button */}
              {gameMode === 'teams' && gamePhase === 'playing' && (
                <button onClick={revealAnswer} style={{ marginTop: 22, padding: '13px 40px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1e3a6e,#3b82f6)', color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: FONT, boxShadow: '0 4px 20px rgba(59,130,246,0.45)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  🔍 เฉลยคำตอบ
                </button>
              )}

              {/* Reveal feedback */}
              {gamePhase === 'reveal' && (
                <div style={{ marginTop: 22, textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
                  {selectedAnswer === currentQuestion.answer && gameMode === 'solo' && (
                    <div style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>✅ ถูกต้อง! ได้รับ ฿{prizeEntry?.amount}</div>
                  )}
                  {selectedAnswer && selectedAnswer !== currentQuestion.answer && gameMode === 'solo' && (
                    <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 700 }}>❌ ผิด! เฉลย: {currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}</div>
                  )}
                  {!selectedAnswer && gameMode === 'solo' && (
                    <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 700 }}>⏰ หมดเวลา! เฉลย: {currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}</div>
                  )}

                  {/* Teams: show answer + award buttons */}
                  {gameMode === 'teams' && (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: '#ffd700', fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
                          ✅ เฉลย: {currentQuestion.answer} — {currentQuestion.options[currentQuestion.answer]}
                        </div>
                        <div style={{ color: '#4a5a8a', fontSize: 12 }}>กดทีมที่ตอบถูกต้อง</div>
                      </div>
                      {awardPending && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, animation: 'fadeUp 0.3s ease' }}>
                          {[0, 1].map(i => (
                            <button key={i} onClick={() => awardTeam(i)} style={{ padding: '16px 8px', borderRadius: 14, border: `2.5px solid ${TEAM_CFG[i].color}`, background: TEAM_CFG[i].bg, color: TEAM_CFG[i].color, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 0 20px ${TEAM_CFG[i].color}45`, animation: 'awardPulse 1.8s ease-in-out infinite', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = `0 0 32px ${TEAM_CFG[i].color}70`; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 0 20px ${TEAM_CFG[i].color}45`; }}>
                              ✅ {teamNames[i]}<br />
                              <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>+฿{prizeEntry?.amount}</span>
                            </button>
                          ))}
                          <button onClick={() => awardTeam(-1)} style={{ padding: '16px 12px', borderRadius: 14, border: '1.5px solid #1e2a4a', background: '#050c1f', color: '#2a3a5a', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', alignSelf: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2a4a'; e.currentTarget.style.color = '#2a3a5a'; }}>
                            ❌ ผิดทั้งคู่
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: prize ladder */}
            <div style={{ paddingLeft: 16 }}>
              <div style={{ color: '#2a3a5a', fontSize: 11, fontWeight: 700, letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>🏆 รางวัล</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...PRIZES].reverse().map(prize => {
                  const isCurr = prize.level === currentLevel;
                  const isPast = prize.level < currentLevel;
                  return (
                    <div key={prize.level} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: isCurr ? 'linear-gradient(90deg,#3d2a00,#5a3d00)' : prize.safe && !isPast ? 'rgba(16,185,129,0.07)' : 'transparent', border: isCurr ? '1px solid #ffc107' : prize.safe ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent', animation: isCurr ? 'ladderBlink 2s ease-in-out infinite' : 'none', boxShadow: isCurr ? '0 0 14px rgba(255,193,7,0.35)' : 'none' }}>
                      <span style={{ color: isPast ? '#10b981' : isCurr ? '#ffd700' : prize.safe ? '#34d399' : '#1e2a4a', fontSize: 10 }}>
                        {isPast ? '✓' : prize.safe ? '🛡' : `${prize.level}.`}
                      </span>
                      <span style={{ color: isCurr ? '#ffd700' : isPast ? '#34d399' : prize.safe ? '#34d399' : '#1e2a4a', fontWeight: isCurr ? 900 : isPast ? 600 : 400, flex: 1, textAlign: 'right' }}>
                        ฿{prize.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ WIN ═══════════════ */}
      {gamePhase === 'won' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center,#1a1200 0%,#020818 70%)', padding: 32, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {gameMode === 'teams' ? (
            <div style={{ animation: 'winBounce 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ fontSize: 80, marginBottom: 12, filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.6))' }}>⚔️</div>
              <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 28px', color: '#ffd700', animation: 'goldPulse 2s ease-in-out infinite' }}>
                {teamWinner === 'tie' ? '🤝 เสมอกัน!' : teamWinner !== null ? `🏆 ${teamNames[teamWinner]} ชนะ!` : 'จบการแข่งขัน!'}
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 480, margin: '0 auto 36px' }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ background: TEAM_CFG[i].bg, border: `2.5px solid ${i === teamWinner ? '#ffd700' : TEAM_CFG[i].color}`, borderRadius: 20, padding: '28px 20px', textAlign: 'center', boxShadow: i === teamWinner ? '0 0 40px rgba(255,215,0,0.4)' : `0 0 24px ${TEAM_CFG[i].color}30`, animation: i === teamWinner ? 'teamWin 0.6s ease, awardPulse 2s 0.6s ease-in-out infinite' : 'teamWin 0.6s ease' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>{i === teamWinner ? '🏆' : TEAM_CFG[i].emoji}</div>
                    <div style={{ color: TEAM_CFG[i].color, fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{teamNames[i]}</div>
                    <div style={{ color: '#ffd700', fontSize: 28, fontWeight: 900, textShadow: '0 0 16px rgba(255,215,0,0.5)' }}>฿{teamScores[i].toLocaleString()}</div>
                    {i === teamWinner && <div style={{ color: '#ffd700', fontSize: 12, marginTop: 6 }}>👑 ผู้ชนะ</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ animation: 'winBounce 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ fontSize: 80, marginBottom: 12, filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.6))' }}>🎉</div>
              <h1 style={{ fontSize: 52, fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(135deg,#ffd700,#ff8c00,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'goldPulse 2s ease-in-out infinite' }}>ยินดีด้วย!</h1>
              <div style={{ color: '#4a5a8a', fontSize: 18, marginBottom: 14 }}>คุณได้รับรางวัล</div>
              <div style={{ fontSize: 64, fontWeight: 900, color: '#ffd700', textShadow: '0 0 48px rgba(255,215,0,0.9)', marginBottom: 36, animation: 'goldPulse 1.5s ease-in-out infinite' }}>฿{finalPrize}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={restartGame} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#854d0e,#ffd700)', color: '#000', fontWeight: 800, fontSize: 16, fontFamily: FONT, boxShadow: '0 4px 20px rgba(255,215,0,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>🔄 เล่นอีกครั้ง</button>
            <button onClick={goToSetup} style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid #2a3a5a', cursor: 'pointer', background: 'transparent', color: '#4a5a8a', fontWeight: 600, fontSize: 16, fontFamily: FONT, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4a5a8a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a3a5a'}>🏠 กลับตั้งค่า</button>
          </div>
        </div>
      )}

      {/* ═══════════════ LOST ═══════════════ */}
      {gamePhase === 'lost' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center,#1a0a0a 0%,#020818 70%)', padding: 32, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 80, marginBottom: 12, animation: 'winBounce 0.6s ease', filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' }}>💔</div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#ef4444', margin: '0 0 12px' }}>เสียรางวัล!</h1>
          {currentQuestion && (
            <div style={{ color: '#4a5a8a', fontSize: 15, marginBottom: 24 }}>
              เฉลยข้อ {currentLevel}: <span style={{ color: '#10b981', fontWeight: 700 }}>{currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}</span>
            </div>
          )}
          <div style={{ background: 'linear-gradient(135deg,#1a0d0a,#2a1a0a)', border: '1px solid #3a2a1a', borderRadius: 20, padding: '24px 44px', marginBottom: 36 }}>
            <div style={{ color: '#4a5a8a', fontSize: 13, marginBottom: 6 }}>รางวัลที่ได้รับ (Safe Haven)</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: finalPrize === '0' ? '#1e2a4a' : '#ffd700', textShadow: finalPrize !== '0' ? '0 0 30px rgba(255,215,0,0.5)' : 'none' }}>
              ฿{finalPrize === '0' ? '0' : finalPrize}
            </div>
            {finalPrize === '0' && <div style={{ color: '#1e2a4a', fontSize: 12, marginTop: 4 }}>ไม่ถึง Safe Haven (ข้อ 5)</div>}
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={restartGame} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#854d0e,#ffd700)', color: '#000', fontWeight: 800, fontSize: 16, fontFamily: FONT }}>🔄 เล่นอีกครั้ง</button>
            <button onClick={goToSetup} style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid #2a3a5a', cursor: 'pointer', background: 'transparent', color: '#4a5a8a', fontWeight: 600, fontSize: 16, fontFamily: FONT }}>🏠 กลับตั้งค่า</button>
          </div>
        </div>
      )}
    </div>
  );
}

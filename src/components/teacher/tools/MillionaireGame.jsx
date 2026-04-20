'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', sans-serif";
const LS_KEY = 'millionaire_questions';

const PRIZES = [
  { level: 1,  amount: '500',       safe: false },
  { level: 2,  amount: '1,000',     safe: false },
  { level: 3,  amount: '2,000',     safe: false },
  { level: 4,  amount: '3,000',     safe: false },
  { level: 5,  amount: '5,000',     safe: true  },
  { level: 6,  amount: '10,000',    safe: false },
  { level: 7,  amount: '20,000',    safe: false },
  { level: 8,  amount: '30,000',    safe: false },
  { level: 9,  amount: '50,000',    safe: false },
  { level: 10, amount: '100,000',   safe: true  },
  { level: 11, amount: '150,000',   safe: false },
  { level: 12, amount: '250,000',   safe: false },
  { level: 13, amount: '500,000',   safe: false },
  { level: 14, amount: '750,000',   safe: false },
  { level: 15, amount: '1,000,000', safe: false },
];

const SAMPLE_QUESTIONS = [
  { question: 'เมืองหลวงของประเทศไทยคือ?', options: { A: 'เชียงใหม่', B: 'กรุงเทพมหานคร', C: 'พัทยา', D: 'ภูเก็ต' }, answer: 'B' },
  { question: 'น้ำ 1 ลิตร มีกี่มิลลิลิตร?', options: { A: '100', B: '500', C: '1,000', D: '2,000' }, answer: 'C' },
  { question: 'ดาวเคราะห์ดวงใดอยู่ใกล้ดวงอาทิตย์มากที่สุด?', options: { A: 'ศุกร์', B: 'โลก', C: 'อังคาร', D: 'พุธ' }, answer: 'D' },
  { question: 'ประเทศไทยมีกี่จังหวัด?', options: { A: '72', B: '75', C: '76', D: '77' }, answer: 'D' },
  { question: 'ใครเป็นผู้แต่งเพลงชาติไทย?', options: { A: 'หลวงประดิษฐ์ไพเราะ', B: 'พระเจนดุริยางค์', C: 'หลวงวิจิตรวาทการ', D: 'สุนทรภู่' }, answer: 'B' },
];

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

// ── Confetti helpers ──────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#ffc107', '#ff6b35', '#00d4ff', '#7c4dff', '#ff4da6', '#00e676'];

function generateConfetti(count = 80) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    size: 6 + Math.random() * 10,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    speed: 2 + Math.random() * 3,
    drift: (Math.random() - 0.5) * 3,
    rotation: Math.random() * 360,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    delay: Math.random() * 0.8,
  }));
}

// ── Web Audio helpers ─────────────────────────────────────────────────────────
function getAudioCtx(ref) {
  if (!ref.current) {
    try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return ref.current;
}

function resumeCtx(ref) {
  const ctx = getAudioCtx(ref);
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTick(audioCtxRef, fast = false) {
  const ctx = resumeCtx(audioCtxRef);
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fast ? 1200 : 800, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now); osc.stop(now + 0.07);
  } catch {}
}

function playSelect(audioCtxRef) {
  const ctx = resumeCtx(audioCtxRef);
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [440, 554].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
      osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.18);
    });
  } catch {}
}

function playCorrect(audioCtxRef) {
  const ctx = resumeCtx(audioCtxRef);
  if (!ctx) return;
  try {
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.4);
    });
  } catch {}
}

function playWrong(audioCtxRef) {
  const ctx = resumeCtx(audioCtxRef);
  if (!ctx) return;
  try {
    const notes = [400, 300, 200];
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch {}
}

function playWin(audioCtxRef) {
  const ctx = resumeCtx(audioCtxRef);
  if (!ctx) return;
  try {
    const fanfare = [523, 659, 784, 1047, 1319, 1047, 1319];
    fanfare.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = i >= 4 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t); osc.stop(t + 0.45);
    });
    // Bass hit
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.connect(bassGain); bassGain.connect(ctx.destination);
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, ctx.currentTime);
    bassGain.gain.setValueAtTime(0.4, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    bass.start(ctx.currentTime); bass.stop(ctx.currentTime + 0.35);
  } catch {}
}

// ── Safe haven prize helper ────────────────────────────────────────────────────
function getSafeHavenPrize(currentLevel) {
  // Find the highest safe level that has been passed (currentLevel is 1-based, index into questions done)
  const safeHavens = PRIZES.filter(p => p.safe && p.level < currentLevel);
  if (safeHavens.length === 0) return '0';
  return safeHavens[safeHavens.length - 1].amount;
}

// ── Timer SVG circle ──────────────────────────────────────────────────────────
function TimerCircle({ seconds, maxSeconds }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const fraction = seconds / maxSeconds;
  const dashoffset = circumference * (1 - fraction);
  const color = fraction > 0.5 ? '#10b981' : fraction > 0.25 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={90} height={90} style={{ display: 'block', margin: '0 auto' }}>
      {/* BG ring */}
      <circle cx={45} cy={45} r={radius} fill="none" stroke="#1a2040" strokeWidth={8} />
      {/* Progress arc */}
      <circle
        cx={45} cy={45} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
      />
      {/* Center text */}
      <text x={45} y={50} textAnchor="middle" fontSize={22} fontWeight={900} fill={color} fontFamily={FONT}>
        {seconds}
      </text>
    </svg>
  );
}

// ── Audience poll modal ────────────────────────────────────────────────────────
function AudienceModal({ options, correctAnswer, onClose }) {
  // Generate fake poll: correct gets 55-75%, others share rest
  const correctPct = 55 + Math.floor(Math.random() * 21);
  const remaining = 100 - correctPct;
  const wrongs = OPTION_KEYS.filter(k => k !== correctAnswer && options[k]);
  const perWrong = wrongs.length > 0 ? Math.floor(remaining / wrongs.length) : 0;
  const lastWrong = remaining - perWrong * (wrongs.length - 1);

  const pcts = {};
  OPTION_KEYS.forEach(k => {
    if (!options[k]) { pcts[k] = 0; return; }
    if (k === correctAnswer) pcts[k] = correctPct;
    else {
      const idx = wrongs.indexOf(k);
      pcts[k] = idx === wrongs.length - 1 ? lastWrong : perWrong;
    }
  });

  const BAR_COLORS = { A: '#3b82f6', B: '#f59e0b', C: '#22c55e', D: '#ef4444' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0d1a3a, #1a0d4a)',
        border: '2px solid #4a3a8a', borderRadius: 20, padding: '36px 40px',
        maxWidth: 420, width: '90%', textAlign: 'center',
        boxShadow: '0 0 60px rgba(124,77,255,0.4)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#ffd700', marginBottom: 24, fontFamily: FONT }}>
          ผลโหวตจากห้อง
        </div>
        {OPTION_KEYS.filter(k => options[k]).map(k => (
          <div key={k} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#ccc', fontSize: 14, fontFamily: FONT }}>{k}: {options[k]}</span>
              <span style={{ color: BAR_COLORS[k], fontWeight: 700, fontSize: 14 }}>{pcts[k]}%</span>
            </div>
            <div style={{ background: '#1a2040', borderRadius: 8, height: 28, overflow: 'hidden' }}>
              <div style={{
                width: `${pcts[k]}%`, height: '100%',
                background: BAR_COLORS[k],
                borderRadius: 8,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
        <div style={{ color: '#888', fontSize: 12, marginTop: 16, fontFamily: FONT }}>
          ปิดอัตโนมัติใน 5 วินาที...
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MillionaireGame() {
  // ── Setup state ──────────────────────────────────────────────────────────────
  const [setupTab, setSetupTab] = useState('manual'); // 'manual' | 'ai'
  const [questions, setQuestions] = useState(
    SAMPLE_QUESTIONS.map((q, i) => ({ ...q, id: String(i) }))
  );
  const [collapsed, setCollapsed] = useState({}); // which question cards are collapsed

  // AI generate state
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('ปานกลาง');
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null); // questions from AI before accepting

  // Timer config
  const [timerSeconds, setTimerSeconds] = useState(30);

  // ── Game state ────────────────────────────────────────────────────────────────
  const [gamePhase, setGamePhase] = useState('setup'); // setup | playing | locked | reveal | won | lost
  const [currentQ, setCurrentQ] = useState(0); // 0-based index
  const [selectedAnswer, setSelectedAnswer] = useState(null); // 'A'|'B'|'C'|'D'|null
  const [hiddenOptions, setHiddenOptions] = useState([]); // for 50:50
  const [timeLeft, setTimeLeft] = useState(30);
  const [lifelines, setLifelines] = useState({ fifty: true, audience: true, skip: true });
  const [showAudience, setShowAudience] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [finalPrize, setFinalPrize] = useState('0');
  const [gameQuestions, setGameQuestions] = useState([]); // questions actually used in game

  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const tickIntervalRef = useRef(null);

  // ── Persist questions ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setQuestions(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(questions)); } catch {}
  }, [questions]);

  // ── Timer logic ───────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(tickIntervalRef.current);
  }, []);

  const startTimer = useCallback((seconds) => {
    stopTimer();
    setTimeLeft(seconds);
    let remaining = seconds;

    // Tick sound interval
    const scheduleTickInterval = () => {
      const fast = remaining <= 5;
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = setInterval(() => {
        playTick(audioCtxRef, fast);
      }, fast ? 500 : 1000);
    };
    scheduleTickInterval();

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);

      // Switch to faster ticking at 5s
      if (remaining === 5) scheduleTickInterval();

      if (remaining <= 0) {
        stopTimer();
        // Time out: auto-lock with no answer → reveal correct → lose
        handleTimeout();
      }
    }, 1000);
  }, [stopTimer]); // eslint-disable-line

  const handleTimeout = useCallback(() => {
    setGamePhase('reveal');
    setSelectedAnswer(null);
    playWrong(audioCtxRef);
    setTimeout(() => {
      setGamePhase('lost');
      setFinalPrize(getSafeHavenPrize(currentQ + 1));
    }, 2000);
  }, [currentQ]);

  // keep handleTimeout in startTimer closure updated
  useEffect(() => {
    // nothing; handleTimeout is used in interval closure, so it reads currentQ via closure — fine
  }, [currentQ]);

  // ── Game control ──────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const valid = questions.filter(
      q => q.question?.trim() && q.options?.A && q.options?.B && q.options?.C && q.options?.D && q.answer
    );
    if (valid.length < 3) {
      toast.error('ต้องมีคำถามที่สมบูรณ์อย่างน้อย 3 ข้อ');
      return;
    }
    // Use up to 15 questions
    const used = valid.slice(0, 15);
    setGameQuestions(used);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setHiddenOptions([]);
    setLifelines({ fifty: true, audience: true, skip: true });
    setGamePhase('playing');
    startTimer(timerSeconds);
  }, [questions, timerSeconds, startTimer]);

  // start timer each time we advance to a new question in 'playing' phase
  useEffect(() => {
    if (gamePhase === 'playing') {
      setSelectedAnswer(null);
      setHiddenOptions([]);
      startTimer(timerSeconds);
    }
  }, [currentQ, gamePhase]); // eslint-disable-line

  // cleanup on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Answer selection ──────────────────────────────────────────────────────────
  const selectAnswer = useCallback((key) => {
    if (gamePhase !== 'playing') return;
    if (hiddenOptions.includes(key)) return;
    stopTimer();
    setSelectedAnswer(key);
    setGamePhase('locked');
    playSelect(audioCtxRef);

    // 2.5s dramatic pause → reveal
    setTimeout(() => {
      const q = gameQuestions[currentQ];
      const correct = q.answer;
      setGamePhase('reveal');

      if (key === correct) {
        playCorrect(audioCtxRef);
        // After 1.5s → next question or win
        setTimeout(() => {
          if (currentQ + 1 >= gameQuestions.length) {
            // Won all questions
            playWin(audioCtxRef);
            setFinalPrize(PRIZES[Math.min(gameQuestions.length, 15) - 1].amount);
            setGamePhase('won');
            launchConfetti();
          } else {
            setCurrentQ(q => q + 1);
            setGamePhase('playing');
          }
        }, 1500);
      } else {
        playWrong(audioCtxRef);
        setTimeout(() => {
          setFinalPrize(getSafeHavenPrize(currentQ + 1));
          setGamePhase('lost');
        }, 1500);
      }
    }, 2500);
  }, [gamePhase, hiddenOptions, stopTimer, gameQuestions, currentQ]);

  // ── Walk away ────────────────────────────────────────────────────────────────
  const walkAway = useCallback(() => {
    stopTimer();
    const safePrize = getSafeHavenPrize(currentQ + 1);
    // The prize they definitely keep is safe haven; but if already past level 1, they keep current level
    const currentPrize = currentQ > 0 ? PRIZES[currentQ - 1].amount : '0';
    const keepPrize = safePrize !== '0' ? safePrize : (currentQ > 0 ? currentPrize : '0');
    setFinalPrize(keepPrize);
    setGamePhase('won');
    toast('🚶 เดินออกพร้อมรางวัล ฿' + keepPrize);
    launchConfetti();
  }, [stopTimer, currentQ]);

  // ── Lifelines ─────────────────────────────────────────────────────────────────
  const useFiftyFifty = useCallback(() => {
    if (!lifelines.fifty || gamePhase !== 'playing') return;
    const q = gameQuestions[currentQ];
    const wrongs = OPTION_KEYS.filter(k => k !== q.answer && q.options[k]);
    // Pick 2 wrong options to hide
    const shuffled = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(shuffled);
    setLifelines(l => ({ ...l, fifty: false }));
    toast('🎯 50:50 ใช้แล้ว! ตัดตัวเลือกผิด 2 ข้อ');
  }, [lifelines.fifty, gamePhase, gameQuestions, currentQ]);

  const useAudience = useCallback(() => {
    if (!lifelines.audience || gamePhase !== 'playing') return;
    setLifelines(l => ({ ...l, audience: false }));
    setShowAudience(true);
    toast('👥 ถามห้องเรียบร้อย!');
    setTimeout(() => setShowAudience(false), 5000);
  }, [lifelines.audience, gamePhase]);

  const useSkip = useCallback(() => {
    if (!lifelines.skip || gamePhase !== 'playing') return;
    stopTimer();
    setLifelines(l => ({ ...l, skip: false }));
    toast('⏭ ข้ามข้อแล้ว!');
    if (currentQ + 1 >= gameQuestions.length) {
      playWin(audioCtxRef);
      setFinalPrize(PRIZES[Math.min(gameQuestions.length, 15) - 1].amount);
      setGamePhase('won');
      launchConfetti();
    } else {
      setCurrentQ(q => q + 1);
      setGamePhase('playing');
    }
  }, [lifelines.skip, gamePhase, stopTimer, currentQ, gameQuestions]);

  // ── Confetti ──────────────────────────────────────────────────────────────────
  const launchConfetti = () => {
    setConfetti(generateConfetti(90));
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 4000);
  };

  // ── Setup: question management ────────────────────────────────────────────────
  const addQuestion = () => {
    if (questions.length >= 15) { toast.error('สูงสุด 15 คำถาม'); return; }
    const id = Date.now().toString();
    setQuestions(qs => [...qs, { id, question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A' }]);
    setCollapsed(c => ({ ...c, [id]: false }));
  };

  const removeQuestion = (id) => {
    setQuestions(qs => qs.filter(q => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (id, key, value) => {
    setQuestions(qs => qs.map(q => q.id === id
      ? { ...q, options: { ...q.options, [key]: value } }
      : q
    ));
  };

  const toggleCollapse = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  // ── AI Generate ───────────────────────────────────────────────────────────────
  const generateWithAI = async () => {
    if (!aiTopic.trim()) { toast.error('กรุณาใส่หัวข้อ'); return; }
    setAiLoading(true);
    try {
      const prompt = `สร้างคำถามแบบปรนัย (Multiple Choice) จำนวน ${aiCount} ข้อ เกี่ยวกับหัวข้อ "${aiTopic}" ระดับความยาก: ${aiDifficulty}

ตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น รูปแบบ:
[
  {
    "question": "คำถาม",
    "options": {"A": "ตัวเลือก A", "B": "ตัวเลือก B", "C": "ตัวเลือก C", "D": "ตัวเลือก D"},
    "answer": "B"
  }
]

ตัวอักษรเฉลยต้องเป็น "A", "B", "C" หรือ "D" เท่านั้น คำถามต้องมีความหลากหลายและน่าสนใจ`;

      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'custom', payload: { prompt } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      const text = data.result || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('AI ตอบไม่ตรง format');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('ไม่พบคำถาม');

      const preview = parsed.map((q, i) => ({
        id: `ai_${Date.now()}_${i}`,
        question: q.question || '',
        options: { A: q.options?.A || '', B: q.options?.B || '', C: q.options?.C || '', D: q.options?.D || '' },
        answer: ['A', 'B', 'C', 'D'].includes(q.answer) ? q.answer : 'A',
      }));
      setAiPreview(preview);
      toast.success(`AI สร้าง ${preview.length} คำถามแล้ว! ตรวจสอบก่อนนำไปใช้`);
    } catch (err) {
      toast.error('ไม่สำเร็จ: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const acceptAiQuestions = () => {
    if (!aiPreview) return;
    const combined = [...questions, ...aiPreview].slice(0, 15);
    setQuestions(combined);
    setAiPreview(null);
    toast.success(`เพิ่ม ${aiPreview.length} คำถามแล้ว!`);
    setSetupTab('manual');
  };

  const replaceWithAiQuestions = () => {
    if (!aiPreview) return;
    setQuestions(aiPreview.slice(0, 15));
    setAiPreview(null);
    toast.success(`แทนที่ด้วย ${aiPreview.length} คำถามจาก AI!`);
    setSetupTab('manual');
  };

  // ── Restart ───────────────────────────────────────────────────────────────────
  const restartGame = () => {
    stopTimer();
    setCurrentQ(0);
    setSelectedAnswer(null);
    setHiddenOptions([]);
    setLifelines({ fifty: true, audience: true, skip: true });
    setConfettiActive(false);
    setFinalPrize('0');
    setGamePhase('playing');
    // gameQuestions stays the same
    // startTimer will fire from effect watching gamePhase === 'playing'
  };

  const goToSetup = () => {
    stopTimer();
    setGamePhase('setup');
    setCurrentQ(0);
    setSelectedAnswer(null);
    setHiddenOptions([]);
    setLifelines({ fifty: true, audience: true, skip: true });
    setConfettiActive(false);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────────
  const currentQuestion = gameQuestions[currentQ];
  const currentLevel = currentQ + 1; // 1-based
  const prizeEntry = PRIZES[Math.min(currentQ, 14)];

  // Answer button styling
  const getAnswerStyle = (key) => {
    const base = {
      width: '100%', padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
      fontFamily: FONT, fontSize: 15, fontWeight: 600, textAlign: 'left',
      transition: 'all 0.2s', outline: 'none', display: 'flex', alignItems: 'center', gap: 10,
    };
    if (hiddenOptions.includes(key)) {
      return { ...base, background: 'transparent', border: '1px solid transparent', color: 'transparent', cursor: 'default', pointerEvents: 'none' };
    }
    const isSelected = selectedAnswer === key;
    const q = gameQuestions[currentQ];
    const isCorrect = q && key === q.answer;

    if (gamePhase === 'reveal') {
      if (isCorrect) return { ...base, background: 'linear-gradient(135deg, #0a3d1e, #0d5a2a)', border: '2px solid #10b981', color: '#6ee7b7' };
      if (isSelected && !isCorrect) return { ...base, background: 'linear-gradient(135deg, #3d0a0a, #5a1010)', border: '2px solid #ef4444', color: '#fca5a5' };
      return { ...base, background: 'linear-gradient(135deg, #1a2040, #0d1530)', border: '1px solid #3a4a7a', color: '#666' };
    }
    if (gamePhase === 'locked' && isSelected) {
      return { ...base, background: 'linear-gradient(135deg, #3d2a00, #5a3d00)', border: '2px solid #ffc107', color: '#ffc107' };
    }
    return {
      ...base,
      background: 'linear-gradient(135deg, #1a2040, #0d1530)',
      border: '1px solid #3a4a7a',
      color: '#e2e8f0',
    };
  };

  // ── CSS Keyframes (injected once) ─────────────────────────────────────────────
  const globalStyles = `
    @keyframes confettiFall {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      80%  { opacity: 1; }
      100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }
    @keyframes goldPulse {
      0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,165,0,0.4); }
      50%       { text-shadow: 0 0 40px rgba(255,215,0,1),   0 0 80px rgba(255,165,0,0.7); }
    }
    @keyframes winBounce {
      0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
      60%  { transform: scale(1.1) rotate(3deg); opacity: 1; }
      80%  { transform: scale(0.95) rotate(-1deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes questionGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(100,130,255,0.2); }
      50%       { box-shadow: 0 0 40px rgba(100,130,255,0.5); }
    }
    @keyframes lifelinePulse {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.07); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes ladderHighlight {
      0%, 100% { background: linear-gradient(90deg, #3d2a00, #5a3d00); }
      50%       { background: linear-gradient(90deg, #5a3d00, #7a5200); }
    }
  `;

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#0a0e1f' }}>
      <style>{globalStyles}</style>

      {/* Confetti overlay */}
      {confettiActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
          {confetti.map(p => (
            <div key={p.id} style={{
              position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
              width: p.shape === 'rect' ? p.size : p.size,
              height: p.shape === 'rect' ? p.size * 0.5 : p.size,
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
        <AudienceModal
          options={currentQuestion.options}
          correctAnswer={currentQuestion.answer}
          onClose={() => setShowAudience(false)}
        />
      )}

      {/* ══════════════════ SETUP SCREEN ══════════════════════════════════════ */}
      {gamePhase === 'setup' && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎰</div>
            <h1 style={{
              margin: '0 0 8px', fontSize: 38, fontWeight: 900,
              background: 'linear-gradient(135deg, #ffd700, #ffaa00, #ff6600)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'goldPulse 3s ease-in-out infinite',
            }}>
              เกมเศรษฐี
            </h1>
            <p style={{ color: '#8899bb', fontSize: 16, margin: 0 }}>
              Who Wants to Be a Millionaire? — สไตล์ห้องเรียน
            </p>
          </div>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: '#111827', borderRadius: 12, padding: 4, marginBottom: 28, gap: 4 }}>
            {[
              { id: 'manual', label: '✏️ สร้างเอง' },
              { id: 'ai', label: '🤖 AI สร้างให้' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setSetupTab(tab.id)} style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: setupTab === tab.id ? 'linear-gradient(135deg, #2a1a5e, #1a2a5e)' : 'transparent',
                color: setupTab === tab.id ? '#ffd700' : '#8899bb',
                fontWeight: setupTab === tab.id ? 700 : 400, fontSize: 15, fontFamily: FONT,
                boxShadow: setupTab === tab.id ? '0 2px 12px rgba(255,215,0,0.15)' : 'none',
                transition: 'all 0.2s',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Timer config */}
          <div style={{ background: '#111827', borderRadius: 14, padding: '16px 20px', marginBottom: 20, border: '1px solid #1e2a4a', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: '#8899bb', fontSize: 14 }}>⏱️ เวลาต่อข้อ:</span>
            {[15, 30, 45, 60].map(s => (
              <button key={s} onClick={() => setTimerSeconds(s)} style={{
                padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT,
                background: timerSeconds === s ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : '#1e2a4a',
                color: timerSeconds === s ? '#000' : '#8899bb',
                fontWeight: timerSeconds === s ? 700 : 400, fontSize: 14,
              }}>
                {s}s
              </button>
            ))}
          </div>

          {/* ── Manual tab ── */}
          {setupTab === 'manual' && (
            <div>
              {questions.map((q, idx) => (
                <div key={q.id} style={{
                  background: '#111827', borderRadius: 14, border: '1px solid #1e2a4a',
                  marginBottom: 12, overflow: 'hidden',
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  {/* Card header */}
                  <div
                    onClick={() => toggleCollapse(q.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
                      cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    <span style={{
                      background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                      color: '#000', borderRadius: 8, padding: '3px 10px',
                      fontSize: 13, fontWeight: 800, flexShrink: 0,
                    }}>
                      ข้อ {idx + 1}
                    </span>
                    <span style={{ color: '#8899bb', flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.question || '(ยังไม่มีคำถาม)'}
                    </span>
                    {q.answer && (
                      <span style={{ background: '#0d3d1e', color: '#10b981', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                        เฉลย: {q.answer}
                      </span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }} style={{
                      background: '#3d0a0a', border: 'none', color: '#ef4444', borderRadius: 6,
                      padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                    }}>
                      🗑
                    </button>
                    <span style={{ color: '#4a5a8a', fontSize: 16 }}>{collapsed[q.id] ? '▼' : '▲'}</span>
                  </div>

                  {/* Card body */}
                  {!collapsed[q.id] && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid #1e2a4a' }}>
                      <textarea
                        placeholder="คำถาม..."
                        value={q.question}
                        onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                        style={{
                          width: '100%', marginTop: 14, padding: '10px 14px', borderRadius: 8,
                          border: '1px solid #2a3a5a', background: '#0d1530', color: '#e2e8f0',
                          fontFamily: FONT, fontSize: 15, resize: 'vertical', minHeight: 60,
                          outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                        {OPTION_KEYS.map(key => (
                          <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: q.answer === key ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : '#1e2a4a',
                              color: q.answer === key ? '#000' : '#8899bb',
                              fontSize: 13, fontWeight: 700,
                            }}>
                              {key}
                            </span>
                            <input
                              placeholder={`ตัวเลือก ${key}`}
                              value={q.options[key]}
                              onChange={e => updateOption(q.id, key, e.target.value)}
                              style={{
                                flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #2a3a5a',
                                background: '#0d1530', color: '#e2e8f0', fontFamily: FONT, fontSize: 14,
                                outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {/* Answer radio */}
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: '#8899bb', fontSize: 13 }}>เฉลย:</span>
                        {OPTION_KEYS.map(key => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`answer_${q.id}`}
                              checked={q.answer === key}
                              onChange={() => updateQuestion(q.id, 'answer', key)}
                              style={{ accentColor: '#ffd700' }}
                            />
                            <span style={{ color: q.answer === key ? '#ffd700' : '#8899bb', fontSize: 14, fontWeight: q.answer === key ? 700 : 400 }}>
                              {key}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {questions.length < 15 && (
                <button onClick={addQuestion} style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: '1px dashed #3a4a7a',
                  background: 'transparent', color: '#4a8aff', cursor: 'pointer',
                  fontSize: 15, fontWeight: 600, fontFamily: FONT, marginBottom: 16,
                }}>
                  ➕ เพิ่มคำถาม ({questions.length}/15)
                </button>
              )}
            </div>
          )}

          {/* ── AI tab ── */}
          {setupTab === 'ai' && (
            <div style={{ background: '#111827', borderRadius: 14, padding: 24, border: '1px solid #1e2a4a', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#ffd700', marginBottom: 18 }}>🤖 AI สร้างคำถามให้</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#8899bb', fontSize: 13, display: 'block', marginBottom: 6 }}>หัวข้อ *</label>
                <input
                  placeholder="เช่น คณิตศาสตร์ ชั้น ม.3, ประวัติศาสตร์ไทย, วิทยาศาสตร์..."
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a3a5a',
                    background: '#0d1530', color: '#e2e8f0', fontFamily: FONT, fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ color: '#8899bb', fontSize: 13, display: 'block', marginBottom: 6 }}>ความยาก</label>
                  <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)} style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a3a5a',
                    background: '#0d1530', color: '#e2e8f0', fontFamily: FONT, fontSize: 14, outline: 'none',
                  }}>
                    {['ง่าย', 'ปานกลาง', 'ยาก'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#8899bb', fontSize: 13, display: 'block', marginBottom: 6 }}>จำนวนคำถาม</label>
                  <select value={aiCount} onChange={e => setAiCount(Number(e.target.value))} style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a3a5a',
                    background: '#0d1530', color: '#e2e8f0', fontFamily: FONT, fontSize: 14, outline: 'none',
                  }}>
                    {[3,5,7,10,12,15].map(n => <option key={n} value={n}>{n} ข้อ</option>)}
                  </select>
                </div>
              </div>

              <button onClick={generateWithAI} disabled={aiLoading} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer',
                background: aiLoading ? '#2a3a5a' : 'linear-gradient(135deg, #7c4dff, #00b4e6)',
                color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: FONT,
              }}>
                {aiLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    AI กำลังสร้างคำถาม...
                  </span>
                ) : '✨ AI สร้างคำถาม'}
              </button>

              {/* Preview from AI */}
              {aiPreview && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ color: '#10b981', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                    ✅ AI สร้าง {aiPreview.length} คำถามแล้ว — ตรวจสอบก่อนเริ่ม
                  </div>
                  {aiPreview.map((q, i) => (
                    <div key={q.id} style={{ background: '#0d1530', borderRadius: 10, padding: 14, marginBottom: 8, border: '1px solid #2a3a5a' }}>
                      <div style={{ color: '#ffd700', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>ข้อ {i + 1}</div>
                      <div style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 8 }}>{q.question}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {OPTION_KEYS.map(k => (
                          <div key={k} style={{
                            fontSize: 13, color: q.answer === k ? '#10b981' : '#8899bb',
                            fontWeight: q.answer === k ? 700 : 400,
                          }}>
                            {k}: {q.options[k]} {q.answer === k && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <button onClick={acceptAiQuestions} style={{
                      padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #0a3d1e, #0d5a2a)', color: '#6ee7b7',
                      fontWeight: 700, fontSize: 14, fontFamily: FONT,
                    }}>
                      ➕ เพิ่มต่อจากเดิม
                    </button>
                    <button onClick={replaceWithAiQuestions} style={{
                      padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #1a0d4a, #2d1a7a)', color: '#c4b5fd',
                      fontWeight: 700, fontSize: 14, fontFamily: FONT,
                    }}>
                      🔄 แทนที่ทั้งหมด
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats bar */}
          <div style={{ background: '#111827', borderRadius: 12, padding: '12px 18px', marginBottom: 16, border: '1px solid #1e2a4a', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ color: '#8899bb', fontSize: 14 }}>
              📋 คำถาม: <strong style={{ color: '#ffd700' }}>{questions.length}</strong>/15
            </span>
            <span style={{ color: '#8899bb', fontSize: 14 }}>
              ✅ พร้อมใช้: <strong style={{ color: '#10b981' }}>
                {questions.filter(q => q.question?.trim() && q.options?.A && q.options?.B && q.options?.C && q.options?.D && q.answer).length}
              </strong>
            </span>
            <span style={{ color: '#8899bb', fontSize: 14 }}>
              ⏱️ เวลาต่อข้อ: <strong style={{ color: '#ffd700' }}>{timerSeconds}s</strong>
            </span>
          </div>

          {/* Start button */}
          <button onClick={startGame} style={{
            width: '100%', padding: '20px', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #b8860b, #ffd700, #ff8c00)',
            color: '#000', fontWeight: 900, fontSize: 22, fontFamily: FONT,
            boxShadow: '0 8px 32px rgba(255,215,0,0.35)',
            transition: 'all 0.2s',
            letterSpacing: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,215,0,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,215,0,0.35)'; }}
          >
            ▶ เริ่มเกม!
          </button>
        </div>
      )}

      {/* ══════════════════ PLAYING / LOCKED / REVEAL ════════════════════════ */}
      {(gamePhase === 'playing' || gamePhase === 'locked' || gamePhase === 'reveal') && currentQuestion && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #020818 0%, #0a0e1f 100%)' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #1e2a4a' }}>
            <div style={{ color: '#ffd700', fontWeight: 800, fontSize: 18 }}>🎰 เกมเศรษฐี</div>
            <div style={{ color: '#8899bb', fontSize: 14 }}>
              ข้อ {currentLevel}/{gameQuestions.length} · รางวัล ฿{prizeEntry?.amount}
            </div>
            {gamePhase === 'playing' && (
              <button onClick={walkAway} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid #3a4a7a',
                background: 'transparent', color: '#8899bb', cursor: 'pointer', fontSize: 13, fontFamily: FONT,
              }}>
                🚶 เดินออก
              </button>
            )}
          </div>

          {/* Main area: 3-column layout */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 200px', gap: 0, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 16px' }}>

            {/* ── Left: Lifelines + Timer ── */}
            <div style={{ paddingRight: 20 }}>
              {/* Timer */}
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <div style={{ color: '#8899bb', fontSize: 12, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>
                  ⏱️ เวลาที่เหลือ
                </div>
                <TimerCircle seconds={timeLeft} maxSeconds={timerSeconds} />
              </div>

              {/* Lifelines */}
              <div>
                <div style={{ color: '#8899bb', fontSize: 12, marginBottom: 12, fontWeight: 700, letterSpacing: 1 }}>
                  💡 ความช่วยเหลือ
                </div>
                {[
                  { key: 'fifty',    icon: '🎯', label: '50:50',    desc: 'ตัดตัวเลือกผิด 2 ข้อ', action: useFiftyFifty },
                  { key: 'audience', icon: '👥', label: 'ถามห้อง',  desc: 'ดูผลโหวตนักเรียน', action: useAudience },
                  { key: 'skip',     icon: '⏭', label: 'ข้ามข้อ',  desc: 'ข้ามโดยไม่เสียรางวัล', action: useSkip },
                ].map(ll => (
                  <button key={ll.key} onClick={ll.action} disabled={!lifelines[ll.key] || gamePhase !== 'playing'} style={{
                    width: '100%', marginBottom: 10, padding: '10px 12px', borderRadius: 10,
                    border: lifelines[ll.key] ? '1px solid #3a4a7a' : '1px solid #1e2a4a',
                    background: lifelines[ll.key]
                      ? 'linear-gradient(135deg, #1a2040, #0d1530)'
                      : '#0a0e1f',
                    color: lifelines[ll.key] ? '#e2e8f0' : '#333',
                    cursor: lifelines[ll.key] && gamePhase === 'playing' ? 'pointer' : 'not-allowed',
                    fontFamily: FONT, textAlign: 'left',
                    opacity: lifelines[ll.key] ? 1 : 0.4,
                    animation: lifelines[ll.key] && gamePhase === 'playing' ? 'lifelinePulse 3s ease-in-out infinite' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>{ll.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{ll.label}</div>
                    <div style={{ fontSize: 11, color: lifelines[ll.key] ? '#8899bb' : '#333' }}>{ll.desc}</div>
                    {!lifelines[ll.key] && (
                      <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>ใช้แล้ว</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Center: Question + Answers ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
              {/* Question badge */}
              <div style={{
                background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                color: '#000', borderRadius: 20, padding: '6px 24px',
                fontSize: 14, fontWeight: 800, marginBottom: 20, letterSpacing: 1,
              }}>
                ข้อ {currentLevel} / {gameQuestions.length}
              </div>

              {/* Question box */}
              <div style={{
                background: 'linear-gradient(135deg, #0d1530, #1a2040)',
                border: '1px solid #3a4a7a', borderRadius: 16,
                padding: '28px 32px', marginBottom: 32,
                textAlign: 'center', width: '100%', boxSizing: 'border-box',
                animation: 'questionGlow 3s ease-in-out infinite',
                minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer grid 2×2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
                {OPTION_KEYS.map(key => (
                  <button
                    key={key}
                    onClick={() => selectAnswer(key)}
                    disabled={gamePhase !== 'playing' || hiddenOptions.includes(key)}
                    style={getAnswerStyle(key)}
                    onMouseEnter={e => {
                      if (gamePhase === 'playing' && !hiddenOptions.includes(key)) {
                        e.currentTarget.style.borderColor = '#6a7aaa';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(100,130,255,0.2)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (gamePhase === 'playing' && !hiddenOptions.includes(key)) {
                        e.currentTarget.style.borderColor = '#3a4a7a';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: hiddenOptions.includes(key) ? 'transparent'
                        : gamePhase === 'reveal' && key === currentQuestion.answer ? '#10b981'
                        : gamePhase === 'reveal' && key === selectedAnswer ? '#ef4444'
                        : selectedAnswer === key ? '#ffc107'
                        : '#2a3a5a',
                      fontSize: 14, fontWeight: 800, color: '#fff',
                    }}>
                      {hiddenOptions.includes(key) ? '' : key}
                    </span>
                    <span style={{ visibility: hiddenOptions.includes(key) ? 'hidden' : 'visible' }}>
                      {currentQuestion.options[key]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Phase indicators */}
              {gamePhase === 'locked' && (
                <div style={{ marginTop: 24, color: '#ffc107', fontSize: 16, fontWeight: 700, animation: 'goldPulse 1s ease-in-out infinite' }}>
                  ⏳ กำลังประมวลผล...
                </div>
              )}
              {gamePhase === 'reveal' && selectedAnswer && selectedAnswer !== currentQuestion.answer && (
                <div style={{ marginTop: 24, color: '#ef4444', fontSize: 16, fontWeight: 700 }}>
                  ❌ ผิด! คำตอบที่ถูกคือ {currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}
                </div>
              )}
              {gamePhase === 'reveal' && selectedAnswer === currentQuestion.answer && (
                <div style={{ marginTop: 24, color: '#10b981', fontSize: 16, fontWeight: 700 }}>
                  ✅ ถูกต้อง! ได้รางวัล ฿{prizeEntry?.amount}
                </div>
              )}
              {gamePhase === 'reveal' && !selectedAnswer && (
                <div style={{ marginTop: 24, color: '#ef4444', fontSize: 16, fontWeight: 700 }}>
                  ⏰ หมดเวลา! คำตอบที่ถูกคือ {currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}
                </div>
              )}
            </div>

            {/* ── Right: Prize Ladder ── */}
            <div style={{ paddingLeft: 16 }}>
              <div style={{ color: '#8899bb', fontSize: 12, marginBottom: 10, fontWeight: 700, letterSpacing: 1, textAlign: 'center' }}>
                🏆 รางวัล
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[...PRIZES].reverse().map(prize => {
                  const isCurrent = prize.level === currentLevel;
                  const isPassed = prize.level < currentLevel;
                  const isSafe = prize.safe;
                  return (
                    <div key={prize.level} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                      background: isCurrent
                        ? 'linear-gradient(90deg, #3d2a00, #5a3d00)'
                        : isSafe && !isPassed
                          ? 'rgba(16,185,129,0.08)'
                          : 'transparent',
                      border: isCurrent
                        ? '1px solid #ffc107'
                        : isSafe
                          ? '1px solid rgba(16,185,129,0.3)'
                          : '1px solid transparent',
                      animation: isCurrent ? 'ladderHighlight 2s ease-in-out infinite' : 'none',
                    }}>
                      <span style={{ color: isPassed ? '#10b981' : isCurrent ? '#ffd700' : isSafe ? '#6ee7b7' : '#4a5a8a', fontSize: 11 }}>
                        {isPassed ? '✓' : isSafe ? '🛡️' : `${prize.level}.`}
                      </span>
                      <span style={{
                        color: isCurrent ? '#ffd700' : isPassed ? '#6ee7b7' : isSafe ? '#6ee7b7' : '#4a5a8a',
                        fontWeight: isCurrent ? 800 : isPassed ? 600 : 400,
                        flex: 1, textAlign: 'right',
                      }}>
                        ฿{prize.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile: show prize ladder collapsed at bottom */}
          <style>{`
            @media (max-width: 768px) {
              .millionaire-grid { grid-template-columns: 1fr !important; }
              .millionaire-ladder { display: none; }
            }
          `}</style>
        </div>
      )}

      {/* ══════════════════ WON SCREEN ════════════════════════════════════════ */}
      {gamePhase === 'won' && (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #1a1000 0%, #0a0e1f 70%)',
          padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 80, marginBottom: 16, animation: 'winBounce 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>🎉</div>
          <h1 style={{
            fontSize: 52, fontWeight: 900, margin: '0 0 8px',
            background: 'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'goldPulse 2s ease-in-out infinite',
          }}>
            ยินดีด้วย!
          </h1>
          <div style={{ color: '#8899bb', fontSize: 20, marginBottom: 24 }}>
            คุณได้รับรางวัล
          </div>
          <div style={{
            fontSize: 64, fontWeight: 900, color: '#ffd700',
            textShadow: '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,165,0,0.5)',
            marginBottom: 8,
            animation: 'goldPulse 1.5s ease-in-out infinite',
          }}>
            ฿{finalPrize}
          </div>
          <div style={{ color: '#8899bb', fontSize: 16, marginBottom: 40 }}>
            บาท
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={restartGame} style={{
              padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #b8860b, #ffd700)', color: '#000',
              fontWeight: 800, fontSize: 16, fontFamily: FONT,
            }}>
              🔄 เล่นอีกครั้ง
            </button>
            <button onClick={goToSetup} style={{
              padding: '14px 32px', borderRadius: 12, border: '1px solid #3a4a7a', cursor: 'pointer',
              background: 'transparent', color: '#8899bb',
              fontWeight: 600, fontSize: 16, fontFamily: FONT,
            }}>
              🏠 กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════ LOST SCREEN ══════════════════════════════════════ */}
      {gamePhase === 'lost' && (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0a0e1f 70%)',
          padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>💔</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#ef4444', margin: '0 0 8px' }}>
            เสียรางวัล!
          </h1>
          <div style={{ color: '#8899bb', fontSize: 18, marginBottom: 12 }}>
            {currentQuestion && (
              <>
                คำตอบที่ถูกต้องของข้อ {currentLevel} คือ:
                <div style={{ marginTop: 8, color: '#10b981', fontSize: 20, fontWeight: 700 }}>
                  {currentQuestion.answer}: {currentQuestion.options[currentQuestion.answer]}
                </div>
              </>
            )}
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1a0d0a, #2a1a0a)',
            border: '1px solid #3a2a1a', borderRadius: 16, padding: '24px 40px', marginTop: 24, marginBottom: 32,
          }}>
            <div style={{ color: '#8899bb', fontSize: 14, marginBottom: 6 }}>รางวัลที่ยังคงไว้ได้ (Safe Haven)</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: finalPrize === '0' ? '#4a5a8a' : '#ffd700' }}>
              ฿{finalPrize === '0' ? '0' : finalPrize}
            </div>
            {finalPrize === '0' && (
              <div style={{ color: '#4a5a8a', fontSize: 13, marginTop: 4 }}>
                (ไม่ถึง Safe Haven ข้อ 5)
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={restartGame} style={{
              padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #b8860b, #ffd700)', color: '#000',
              fontWeight: 800, fontSize: 16, fontFamily: FONT,
            }}>
              🔄 เล่นอีกครั้ง
            </button>
            <button onClick={goToSetup} style={{
              padding: '14px 32px', borderRadius: 12, border: '1px solid #3a4a7a', cursor: 'pointer',
              background: 'transparent', color: '#8899bb',
              fontWeight: 600, fontSize: 16, fontFamily: FONT,
            }}>
              🏠 กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

// ── Constants ────────────────────────────────────────────────────────────────
const FONT = "'Kanit', 'Noto Sans Thai', sans-serif";

const BG        = '#0b0b24';
const CYAN      = '#00b4e6';
const MAGENTA   = '#e6007e';
const GOLD      = '#ffc107';
const SURFACE   = '#16163a';
const SURFACE2  = '#1e1e4a';

const ANSWER_CFG = [
  { color: '#e21b3c', light: '#ff4d6a', icon: '▲', label: 'A' },
  { color: '#1368ce', light: '#3a8ee6', icon: '◆', label: 'B' },
  { color: '#d89e00', light: '#ffc107', icon: '●', label: 'C' },
  { color: '#26890c', light: '#36c410', icon: '■', label: 'D' },
];

const DEFAULT_Q = () => ({
  q: '',
  choices: ['', '', '', ''],
  answer: 0,
  time: 20,
});

const IMPORT_EXAMPLE = `1. เมืองหลวงของไทยคืออะไร?
A. เชียงใหม่
B. กรุงเทพมหานคร
C. ภูเก็ต
D. พัทยา
เฉลย: B

2. น้ำ 1 ลิตร มีกี่มิลลิลิตร?
A. 100
B. 500
C. 1000
D. 2000
เฉลย: C`;

// Parse spreadsheet format (tab or comma separated: Q, A, B, C, D, Answer)
function parseSheetText(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  const questions = [];
  const ansMap = { A:0, B:1, C:2, D:3, a:0, b:1, c:2, d:3, '1':0, '2':1, '3':2, '4':3 };
  for (const line of lines) {
    const sep = line.includes('\t') ? '\t' : ',';
    const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 5) continue;
    const [q, a, b, c, d, ans] = cols;
    if (!q || !a || !b || !c || !d) continue;
    const answer = ansMap[ans?.trim()] ?? 0;
    questions.push({ q, choices:[a,b,c,d], answer, time:20 });
  }
  return questions;
}

const SHEET_EXAMPLE = `คำถาม\tA\tB\tC\tD\tเฉลย
เมืองหลวงของไทยคืออะไร?\tเชียงใหม่\tกรุงเทพมหานคร\tภูเก็ต\tพัทยา\tB
น้ำ 1 ลิตร มีกี่มิลลิลิตร?\t100\t500\t1000\t2000\tC`;

// ── Audio ─────────────────────────────────────────────────────────────────────
function getCtx(ref) {
  if (!ref.current) {
    try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return ref.current;
}
function wake(ref) {
  const c = getCtx(ref);
  if (c?.state === 'suspended') c.resume();
  return c;
}
function note(ctx, freq, type, gain, start, dur) {
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.start(start); o.stop(start + dur + 0.02);
  } catch {}
}
function playStart(ref) {
  const c = wake(ref); if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => note(c, f, 'triangle', 0.2, t + i * 0.1, 0.3));
}
function playReveal(ref) {
  const c = wake(ref); if (!c) return;
  const t = c.currentTime;
  try {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(100, t);
    o.frequency.exponentialRampToValueAtTime(1600, t + 0.5);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.start(t); o.stop(t + 0.6);
  } catch {}
}
function playTick(ref, fast = false) {
  const c = wake(ref); if (!c) return;
  try {
    const now = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(fast ? 1400 : 900, now);
    g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    o.start(now); o.stop(now + 0.1);
  } catch {}
}
function playNextQ(ref) {
  const c = wake(ref); if (!c) return;
  const t = c.currentTime;
  [330, 392, 494, 659].forEach((f, i) => note(c, f, 'triangle', 0.15, t + i * 0.08, 0.2));
}
function playFinish(ref) {
  const c = wake(ref); if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => note(c, f, 'sine', 0.2, t + i * 0.12, 0.45));
}

// ── Parse import text ─────────────────────────────────────────────────────────
// Supports:
//   • Blank line between questions (new default)
//   • --- separator (legacy, still works)
//   • Numbered questions: "1. คำถาม" or "Q: คำถาม"
//   • Choices: "A. ตัวเลือก" or "A: ตัวเลือก" or "A) ตัวเลือก"
//   • Answer: "เฉลย: B" or "Ans: B" or "ตอบ: B"
function parseImportText(text) {
  // Split on blank line(s) OR --- separator
  const blocks = text.split(/\n[ \t]*\n|---+/).map(b => b.trim()).filter(Boolean);
  const questions = [];
  const ansMap = { A:0, B:1, C:2, D:3, ก:0, ข:1, ค:2, ง:3, '1':0, '2':1, '3':2, '4':3 };

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let q = '', choices = ['', '', '', ''], answer = 0, time = 20;

    for (const line of lines) {
      // ── Question ──────────────────────────────────────────────────────────
      if (/^Q[:.]\s*/i.test(line)) {
        q = line.replace(/^Q[:.]\s*/i, '').trim();
      } else if (/^\d+[.)]\s+/.test(line)) {
        // "1. คำถาม" or "2) คำถาม"
        q = line.replace(/^\d+[.)]\s+/, '').trim();
      }
      // ── Choices ───────────────────────────────────────────────────────────
      else if (/^A[:.)\s]/i.test(line)) choices[0] = line.replace(/^A[:.)\s]+/i, '').trim();
      else if (/^B[:.)\s]/i.test(line)) choices[1] = line.replace(/^B[:.)\s]+/i, '').trim();
      else if (/^C[:.)\s]/i.test(line)) choices[2] = line.replace(/^C[:.)\s]+/i, '').trim();
      else if (/^D[:.)\s]/i.test(line)) choices[3] = line.replace(/^D[:.)\s]+/i, '').trim();
      // ── Answer ────────────────────────────────────────────────────────────
      else if (/^(Ans|Answer|เฉลย|ตอบ)[:.)\s]/i.test(line)) {
        const k = line.replace(/^(Ans|Answer|เฉลย|ตอบ)[:.)\s]+/i, '').trim().toUpperCase();
        answer = ansMap[k] ?? 0;
      }
      // ── Time ──────────────────────────────────────────────────────────────
      else if (/^Time[:.]\s*/i.test(line)) {
        const t = parseInt(line.replace(/^Time[:.]\s*/i, ''));
        if ([10, 20, 30].includes(t)) time = t;
      }
    }
    if (q) questions.push({ q, choices, answer, time });
  }
  return questions;
}

// ── Generate room code ────────────────────────────────────────────────────────
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── CSS animations ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes buss-fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes buss-popIn   { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes buss-slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes buss-pulse   { 0%,100%{opacity:1} 50%{opacity:0.6} }
  @keyframes buss-bar     { from{width:100%} to{width:0%} }
  @keyframes buss-glow    { 0%,100%{box-shadow:0 0 12px #00b4e6} 50%{box-shadow:0 0 28px #00b4e6, 0 0 48px #e6007e} }
  @keyframes buss-confetti-fall {
    0%   { transform: translateY(-10px) rotate(0deg); opacity:1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
  }
  @keyframes buss-podium-rise { from{transform:scaleY(0);opacity:0} to{transform:scaleY(1);opacity:1} }
  @keyframes buss-bar-grow    { from{height:0;opacity:0} to{opacity:1} }
  @keyframes buss-count-pop   { 0%{transform:scale(0)} 70%{transform:scale(1.25)} 100%{transform:scale(1)} }
  @keyframes buss-star-spin   { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.3)} 100%{transform:rotate(360deg) scale(1)} }
  @keyframes buss-bounce-in   { 0%{transform:translateY(40px);opacity:0} 60%{transform:translateY(-8px)} 100%{transform:translateY(0);opacity:1} }
`;

// ── Main component ────────────────────────────────────────────────────────────
export default function BusSanookGame() {
  const audioRef = useRef(null);

  // Setup state
  const [questions,  setQuestions]  = useState([DEFAULT_Q()]);
  const [editingIdx, setEditingIdx] = useState(0);
  const [importing,  setImporting]  = useState(false);
  const [importText, setImportText] = useState('');
  const [importErr,  setImportErr]  = useState('');
  const [importTab,  setImportTab]  = useState('text'); // 'text' | 'sheet'
  const [parsedPreview, setParsedPreview] = useState([]);
  const [barsVisible, setBarsVisible] = useState(false);
  const [globalTime, setGlobalTime] = useState(20);
  const [maxPlayers, setMaxPlayers] = useState(50);

  // Room / game state
  const [phase,      setPhase]     = useState('setup'); // setup|lobby|question|reveal|finished
  const [room,       setRoom]      = useState('');
  const [gameState,  setGameState] = useState(null);
  const [creating,   setCreating]  = useState(false);
  const [createErr,  setCreateErr] = useState('');

  // Timer
  const [timeLeft,   setTimeLeft]  = useState(0);
  const [timerMax,   setTimerMax]  = useState(20);
  const timerRef = useRef(null);

  // QR
  const [qrDataUrl,  setQrDataUrl] = useState('');

  // Action states
  const [revealing,  setRevealing] = useState(false);
  const [nexting,    setNexting]   = useState(false);
  const [autoRevealScheduled, setAutoRevealScheduled] = useState(false);
  const autoRevealRef = useRef(null);

  const pollRef = useRef(null);

  // ── Inject CSS ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'buss-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id; el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // ── QR Code generation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!room || phase !== 'lobby') return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = `${appUrl}/student/bussanook?room=${room}`;
    QRCode.toDataURL(url, { width: 220, margin: 2, color: { dark: '#0b0b24', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [room, phase]);

  // ── Polling ──────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/teacher/bussanook?room=${room}`);
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data);
      if (data.phase && data.phase !== phase) {
        setPhase(data.phase);
      }
    } catch {}
  }, [room, phase]);

  useEffect(() => {
    if (!room || phase === 'setup') return;
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current);
  }, [room, phase, poll]);

  // ── Client-side countdown timer ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'question' || !gameState?.questionStartTime) {
      clearInterval(timerRef.current);
      return;
    }
    const limit = gameState.timeLimit || gameState.questions?.[gameState.currentQ]?.time || 20;
    setTimerMax(limit);

    const tick = () => {
      const elapsed = (Date.now() - gameState.questionStartTime) / 1000;
      const remaining = Math.max(0, limit - elapsed);
      setTimeLeft(remaining);

      if (remaining < limit * 0.3) playTick(audioRef, true);
      else if (remaining < limit * 0.6) playTick(audioRef, false);

      // Auto-reveal when timer hits 0
      if (remaining <= 0 && !autoRevealScheduled) {
        setAutoRevealScheduled(true);
        clearInterval(timerRef.current);
        if (autoRevealRef.current) clearTimeout(autoRevealRef.current);
        autoRevealRef.current = setTimeout(() => {
          handleReveal();
        }, 1000);
      }
    };

    clearInterval(timerRef.current);
    tick();
    timerRef.current = setInterval(tick, 100);
    return () => {
      clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, gameState?.questionStartTime, gameState?.currentQ]);

  // Reset auto-reveal flag on new question
  useEffect(() => {
    if (phase === 'question') setAutoRevealScheduled(false);
  }, [phase, gameState?.currentQ]);

  // Auto-reveal when ALL players have answered
  // NOTE: compute from gameState directly (allAnswered/playerCount defined later → TDZ)
  const autoRevealAllRef = useRef(null);
  useEffect(() => {
    const pCount = gameState?.players?.length ?? 0;
    const aCount = gameState?.answers ? Object.keys(gameState.answers).length : 0;
    const allAns = pCount > 0 && aCount >= pCount;
    if (phase === 'question' && allAns && pCount > 0 && !autoRevealScheduled) {
      if (autoRevealAllRef.current) clearTimeout(autoRevealAllRef.current);
      autoRevealAllRef.current = setTimeout(() => { handleReveal(); }, 800);
    }
    return () => { if (autoRevealAllRef.current) clearTimeout(autoRevealAllRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, gameState?.players?.length, gameState?.answers, autoRevealScheduled]);

  // Animate bars on reveal
  useEffect(() => {
    if (phase === 'reveal') {
      setBarsVisible(false);
      const t = setTimeout(() => setBarsVisible(true), 150);
      return () => clearTimeout(t);
    }
  }, [phase, gameState?.currentQ]);

  // Auto-parse import text → live preview cards
  useEffect(() => {
    if (!importing) { setParsedPreview([]); return; }
    if (!importText.trim()) { setParsedPreview([]); setImportErr(''); return; }
    const parsed = importTab === 'sheet' ? parseSheetText(importText) : parseImportText(importText);
    setParsedPreview(parsed);
    setImportErr('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importText, importTab, importing]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
      if (autoRevealRef.current) clearTimeout(autoRevealRef.current);
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  async function handleCreateRoom() {
    const validQs = questions.filter(q => q.q.trim() && q.choices.every(c => c.trim()));
    if (validQs.length === 0) {
      setCreateErr('กรุณาเพิ่มคำถามให้ครบก่อนเปิดห้อง');
      return;
    }
    setCreating(true);
    setCreateErr('');
    const code = genCode();
    try {
      const res = await fetch('/api/teacher/bussanook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:     'create',
          room:       code,
          questions:  validQs,
          timeLimit:  globalTime,
          maxPlayers,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateErr(data.error || 'เกิดข้อผิดพลาด'); setCreating(false); return; }
      setRoom(code);
      setPhase('lobby');
    } catch {
      setCreateErr('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
    setCreating(false);
  }

  async function handleStartGame() {
    if (!gameState?.players?.length) return;
    playStart(audioRef);
    const res = await fetch('/api/teacher/bussanook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', room }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) { await poll(); }
    }
  }

  async function handleReveal() {
    if (revealing) return;
    setRevealing(true);
    playReveal(audioRef);
    const res = await fetch('/api/teacher/bussanook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reveal', room }),
    });
    if (res.ok) await poll();
    setRevealing(false);
  }

  async function handleNext() {
    if (nexting) return;
    setNexting(true);
    playNextQ(audioRef);
    const res = await fetch('/api/teacher/bussanook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'next', room }),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.phase === 'finished') playFinish(audioRef);
      await poll();
    }
    setNexting(false);
  }

  async function handleReset() {
    const res = await fetch('/api/teacher/bussanook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', room }),
    });
    if (res.ok) { await poll(); }
  }

  // ── Question editor helpers ──────────────────────────────────────────────
  function updateQuestion(idx, field, val) {
    setQuestions(prev => {
      const next = prev.map((q, i) => i === idx ? { ...q, [field]: val } : q);
      return next;
    });
  }
  function updateChoice(idx, ci, val) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      const choices = [...q.choices]; choices[ci] = val;
      return { ...q, choices };
    }));
  }
  function addQuestion() {
    const newIdx = questions.length;
    setQuestions(prev => [...prev, DEFAULT_Q()]);
    setEditingIdx(newIdx);
  }
  function removeQuestion(idx) {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(prev => Math.min(prev, questions.length - 2));
  }
  function handleImport() {
    if (parsedPreview.length === 0) { setImportErr('ไม่พบคำถามที่ถูกรูปแบบ — ตรวจสอบตัวอย่างแล้วลองใหม่'); return; }
    setQuestions(parsedPreview);
    setEditingIdx(0);
    setImporting(false);
    setImportText('');
    setParsedPreview([]);
    setImportErr('');
  }
  // ── Preview helpers (import modal live editing) ───────────────────────────
  function updatePreviewQ(idx, field, val) {
    setParsedPreview(prev => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));
  }
  function updatePreviewChoice(idx, ci, val) {
    setParsedPreview(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      const choices = [...q.choices]; choices[ci] = val;
      return { ...q, choices };
    }));
  }
  function removePreviewQ(idx) {
    setParsedPreview(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Timer color ──────────────────────────────────────────────────────────
  const timerPct = timerMax > 0 ? (timeLeft / timerMax) * 100 : 0;
  const timerColor = timerPct > 50 ? '#26890c' : timerPct > 20 ? GOLD : '#e21b3c';

  // ── Derived state ────────────────────────────────────────────────────────
  const currentQData   = gameState?.questions?.[gameState?.currentQ ?? 0];
  const totalQ         = gameState?.questions?.length ?? 0;
  const currentQIdx    = gameState?.currentQ ?? 0;
  const answerCount    = gameState?.answers ? Object.keys(gameState.answers).length : 0;
  const playerCount    = gameState?.players?.length ?? 0;
  const allAnswered    = playerCount > 0 && answerCount >= playerCount;
  const sortedPlayers  = gameState?.players
    ? [...gameState.players].sort((a, b) => b.score - a.score)
    : [];

  // Top 3 this round
  const roundToppers = phase === 'reveal' && gameState?.answers
    ? Object.entries(gameState.answers)
        .filter(([, a]) => a.correct)
        .map(([pid, a]) => {
          const pl = gameState.players?.find(p => p.id === pid);
          return { name: pl?.name || '?', points: a.points };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 3)
    : [];

  // Distribution
  const distribution = currentQData
    ? [0, 1, 2, 3].map(ci => {
        const count = gameState?.answers
          ? Object.values(gameState.answers).filter(a => a.choice === ci).length
          : 0;
        return { ci, count, pct: answerCount > 0 ? Math.round((count / answerCount) * 100) : 0 };
      })
    : [];

  // ── RENDER: SETUP ────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const editQ = questions[editingIdx] || questions[0];
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG, fontFamily:FONT, color:'#fff', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:SURFACE, padding:'12px 20px', display:'flex', alignItems:'center', gap:12, borderBottom:`2px solid ${CYAN}`, flexShrink:0 }}>
          <span style={{ fontSize:24, fontWeight:900, color:CYAN, letterSpacing:2, textShadow:`0 0 16px ${CYAN}` }}>🎮 BUS-SANOOK</span>
          <span style={{ color:'#aaa', fontSize:14 }}>สร้างเกมคำถาม Kahoot-style</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button onClick={() => setImporting(true)} style={btnStyle('#555')}>
              📥 นำเข้าคำถาม
            </button>
          </div>
        </div>

        {/* Import Modal — visual quiz-creator style */}
        {importing && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}
            onClick={e => { if(e.target===e.currentTarget){ setImporting(false); setImportErr(''); setImportText(''); setParsedPreview([]); } }}>
            <div style={{ background:SURFACE2, borderRadius:20, width:'min(740px,97vw)', maxHeight:'94vh', display:'flex', flexDirection:'column', border:`1px solid ${CYAN}33`, boxShadow:`0 0 60px ${CYAN}22`, overflow:'hidden' }}>

              {/* Modal header */}
              <div style={{ padding:'16px 22px 12px', borderBottom:`1px solid #252550`, flexShrink:0 }}>
                <div style={{ fontWeight:900, fontSize:19, color:CYAN }}>📥 นำเข้าคำถาม</div>
                <div style={{ fontSize:12, color:'#555', marginTop:2 }}>วางข้อมูล → ระบบแปลงเป็นคำถามทันที → ตรวจสอบแล้วกด นำเข้า</div>
              </div>

              {/* Scrollable body */}
              <div style={{ flex:1, overflowY:'auto', padding:'14px 22px' }}>

                {/* Tabs */}
                <div style={{ display:'flex', gap:4, background:'#080820', borderRadius:10, padding:4, marginBottom:12 }}>
                  {[
                    { id:'text',  label:'📝 แบบข้อความ' },
                    { id:'sheet', label:'📊 Excel / Google Sheets' },
                  ].map(tab => (
                    <button key={tab.id}
                      onClick={() => { setImportTab(tab.id); setImportErr(''); setImportText(''); setParsedPreview([]); }}
                      style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:FONT, fontWeight:700, fontSize:13,
                        background: importTab===tab.id ? `${CYAN}22` : 'transparent',
                        borderBottom: importTab===tab.id ? `2px solid ${CYAN}` : '2px solid transparent',
                        color: importTab===tab.id ? CYAN : '#666',
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ─── Text tab ─── */}
                {importTab === 'text' && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:11, color:'#555' }}>รูปแบบ: <code style={{color:'#aaa'}}>1. คำถาม</code> → <code style={{color:'#aaa'}}>A. B. C. D.</code> → <code style={{color:'#aaa'}}>เฉลย: B</code> เว้น 1 บรรทัดระหว่างข้อ</span>
                      <button onClick={() => setImportText(IMPORT_EXAMPLE)} style={{ ...btnStyle('#1a1a3a'), fontSize:11, padding:'3px 10px', color:CYAN }}>📋 ดูตัวอย่าง</button>
                    </div>
                    <textarea value={importText} onChange={e => setImportText(e.target.value)}
                      placeholder="วางข้อความที่นี่..."
                      rows={6}
                      style={{ width:'100%', background:'#080820', color:'#ddd', border:`1px solid #2a2a5a`, borderRadius:10, padding:12, fontFamily:'monospace', fontSize:12, resize:'vertical', boxSizing:'border-box', outline:'none' }}
                    />
                  </div>
                )}

                {/* ─── Sheet tab ─── */}
                {importTab === 'sheet' && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ background:'#08081e', borderRadius:10, padding:'10px 14px', marginBottom:8, fontSize:12, color:'#777', lineHeight:1.8 }}>
                      คอลัมน์: <strong style={{color:'#ccc'}}>คำถาม</strong> · <strong style={{color:ANSWER_CFG[0].light}}>A</strong> · <strong style={{color:ANSWER_CFG[1].light}}>B</strong> · <strong style={{color:ANSWER_CFG[2].light}}>C</strong> · <strong style={{color:ANSWER_CFG[3].light}}>D</strong> · <strong style={{color:GOLD}}>เฉลย (A/B/C/D)</strong>
                      <br/>เปิด Excel / Google Sheets → เลือกทุก row → Copy → วางด้านล่าง
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
                      <button onClick={() => setImportText(SHEET_EXAMPLE)} style={{ ...btnStyle('#1a1a3a'), fontSize:11, padding:'3px 10px', color:CYAN }}>📋 ดูตัวอย่าง</button>
                    </div>
                    <textarea value={importText} onChange={e => setImportText(e.target.value)}
                      placeholder="วางข้อมูลจาก Excel / Google Sheets ที่นี่..."
                      rows={5}
                      style={{ width:'100%', background:'#080820', color:'#ddd', border:`1px solid #2a2a5a`, borderRadius:10, padding:12, fontFamily:'monospace', fontSize:12, resize:'vertical', boxSizing:'border-box', outline:'none' }}
                    />
                  </div>
                )}

                {/* ─── Live preview cards ─── */}
                {parsedPreview.length > 0 && (
                  <div>
                    {/* Divider */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 14px' }}>
                      <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,#3a3a6a)' }} />
                      <span style={{ fontSize:12, fontWeight:700, color:CYAN, padding:'4px 14px', background:`${CYAN}18`, borderRadius:20, border:`1px solid ${CYAN}33`, whiteSpace:'nowrap' }}>
                        ✅ พบ {parsedPreview.length} ข้อ — แก้ไขได้ก่อนนำเข้า
                      </span>
                      <div style={{ flex:1, height:1, background:'linear-gradient(90deg,#3a3a6a,transparent)' }} />
                    </div>

                    {/* Question cards */}
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {parsedPreview.map((q, idx) => (
                        <div key={idx} style={{ background:'#0e0e28', borderRadius:14, padding:'14px 16px', border:`1px solid ${CYAN}22`, animation:'buss-slideUp 0.25s ease' }}>
                          {/* Card top row */}
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                            <span style={{ background:`${CYAN}22`, color:CYAN, borderRadius:6, padding:'2px 10px', fontSize:11, fontWeight:800 }}>ข้อ {idx+1}</span>
                            <span style={{ fontSize:11, color:'#444', marginLeft:4 }}>เวลา:</span>
                            {[10,20,30].map(t => (
                              <button key={t} onClick={() => updatePreviewQ(idx,'time',t)}
                                style={{ padding:'2px 8px', borderRadius:6, border:`1px solid ${q.time===t ? CYAN : '#333'}`,
                                  background: q.time===t ? `${CYAN}22` : 'transparent',
                                  color: q.time===t ? CYAN : '#555', cursor:'pointer', fontFamily:FONT, fontSize:11 }}>
                                {t}s
                              </button>
                            ))}
                            <button onClick={() => removePreviewQ(idx)}
                              style={{ marginLeft:'auto', background:'#2a0808', color:'#ff6b6b', border:'1px solid #ff222222', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontFamily:FONT, fontSize:11 }}>
                              🗑️ ลบ
                            </button>
                          </div>

                          {/* Question textarea */}
                          <textarea
                            value={q.q}
                            onChange={e => updatePreviewQ(idx,'q',e.target.value)}
                            rows={2}
                            placeholder="คำถาม..."
                            style={{ ...inputStyle, width:'100%', fontSize:14, fontWeight:600, resize:'none', marginBottom:10, boxSizing:'border-box' }}
                          />

                          {/* Answer choices grid */}
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            {[0,1,2,3].map(ci => {
                              const cfg = ANSWER_CFG[ci];
                              const isCor = q.answer === ci;
                              return (
                                <div key={ci}
                                  onClick={() => updatePreviewQ(idx,'answer',ci)}
                                  style={{ display:'flex', alignItems:'center', gap:7,
                                    background: isCor ? `${cfg.color}33` : `${cfg.color}0d`,
                                    border:`2px solid ${isCor ? cfg.color : cfg.color+'33'}`,
                                    borderRadius:10, padding:'7px 10px', cursor:'pointer', transition:'all 0.15s',
                                  }}>
                                  <span style={{ fontSize:13, color: isCor ? cfg.light : cfg.color+'88', fontWeight:700, flexShrink:0 }}>{cfg.icon}</span>
                                  <input
                                    type="text"
                                    value={q.choices[ci] || ''}
                                    onChange={e => { e.stopPropagation(); updatePreviewChoice(idx,ci,e.target.value); }}
                                    onClick={e => e.stopPropagation()}
                                    placeholder={`ตัวเลือก ${['A','B','C','D'][ci]}`}
                                    style={{ background:'transparent', border:'none', outline:'none', color: isCor ? '#fff' : '#999', fontFamily:FONT, fontSize:13, flex:1, minWidth:0 }}
                                  />
                                  {isCor && <span style={{ fontSize:13, color:cfg.light, flexShrink:0 }}>✓</span>}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ marginTop:6, fontSize:11, color:'#3a3a6a' }}>
                            คลิกที่ตัวเลือกเพื่อเปลี่ยนเฉลย · เฉลย: <span style={{ color:ANSWER_CFG[q.answer].light, fontWeight:700 }}>{['A','B','C','D'][q.answer]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No match warning */}
                {importText.trim() && parsedPreview.length === 0 && (
                  <div style={{ background:'#180808', color:'#ff8080', borderRadius:10, padding:'12px 16px', fontSize:13, border:'1px solid #ff333322', textAlign:'center', marginTop:8 }}>
                    ⚠️ ไม่พบคำถามที่ถูกรูปแบบ — ลองกด "ดูตัวอย่าง" แล้ว copy รูปแบบนั้น
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ padding:'12px 22px', borderTop:`1px solid #252550`, display:'flex', gap:10, alignItems:'center', justifyContent:'flex-end', flexShrink:0, background:'#14143200' }}>
                {parsedPreview.length > 0 && (
                  <span style={{ fontSize:12, color:'#555', marginRight:'auto' }}>พบ {parsedPreview.length} ข้อ · แก้ไขได้ก่อนกด นำเข้า</span>
                )}
                <button onClick={() => { setImporting(false); setImportErr(''); setImportText(''); setParsedPreview([]); }} style={btnStyle('#383850')}>
                  ยกเลิก
                </button>
                <button onClick={handleImport} disabled={parsedPreview.length === 0}
                  style={{ ...btnStyle(parsedPreview.length > 0 ? CYAN : '#333', parsedPreview.length > 0 ? '#000' : '#555'), opacity: parsedPreview.length > 0 ? 1 : 0.45, fontWeight:900 }}>
                  ✅ นำเข้า {parsedPreview.length > 0 ? `${parsedPreview.length} ข้อ` : '(วางข้อมูลก่อน)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body: 2 panels */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Left: question list */}
          <div style={{ width:240, background:SURFACE, borderRight:`1px solid #333`, display:'flex', flexDirection:'column', flexShrink:0 }}>
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#aaa' }}>คำถาม ({questions.length})</span>
              <button onClick={addQuestion} style={{ background:CYAN, color:'#000', border:'none', borderRadius:6, padding:'4px 10px', fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:FONT }}>+ เพิ่ม</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:8 }}>
              {questions.map((q, i) => (
                <div
                  key={i}
                  onClick={() => setEditingIdx(i)}
                  style={{
                    padding:'8px 10px', borderRadius:8, marginBottom:6, cursor:'pointer',
                    background: editingIdx === i ? CYAN + '22' : '#ffffff08',
                    border: `1px solid ${editingIdx === i ? CYAN : '#333'}`,
                    position:'relative',
                  }}
                >
                  <div style={{ fontSize:12, color: editingIdx === i ? CYAN : '#ccc', fontWeight:600 }}>ข้อ {i + 1}</div>
                  <div style={{ fontSize:11, color:'#999', marginTop:2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:160 }}>
                    {q.q || '(ยังไม่ได้ใส่คำถาม)'}
                  </div>
                  <div style={{ position:'absolute', right:6, top:6, fontSize:10, background:ANSWER_CFG[q.answer].color, color:'#fff', padding:'1px 5px', borderRadius:4 }}>
                    {['A','B','C','D'][q.answer]}
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); removeQuestion(i); }}
                      style={{ position:'absolute', right:6, bottom:6, background:'none', border:'none', color:'#f44', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}
                    >×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: editor */}
          <div style={{ flex:1, overflowY:'auto', padding:20 }}>
            <div style={{ maxWidth:680 }}>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:12, color:CYAN }}>แก้ไขข้อ {editingIdx + 1}</div>

              {/* Question text */}
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>คำถาม</label>
                <textarea
                  value={editQ?.q || ''}
                  onChange={e => updateQuestion(editingIdx, 'q', e.target.value)}
                  placeholder="พิมพ์คำถามที่นี่..."
                  rows={3}
                  style={{ ...inputStyle, width:'100%', resize:'vertical' }}
                />
              </div>

              {/* Choices */}
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>ตัวเลือก (เลือกข้อที่ถูกต้อง)</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[0,1,2,3].map(ci => (
                    <div key={ci} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input
                        type="radio"
                        name={`correct-${editingIdx}`}
                        checked={editQ?.answer === ci}
                        onChange={() => updateQuestion(editingIdx, 'answer', ci)}
                        style={{ accentColor: ANSWER_CFG[ci].color, width:16, height:16, cursor:'pointer', flexShrink:0 }}
                      />
                      <div style={{ display:'flex', alignItems:'center', flex:1, gap:6, background:`${ANSWER_CFG[ci].color}22`, border:`2px solid ${editQ?.answer === ci ? ANSWER_CFG[ci].color : ANSWER_CFG[ci].color+'66'}`, borderRadius:8, padding:'6px 10px' }}>
                        <span style={{ color: ANSWER_CFG[ci].color, fontWeight:700, minWidth:20 }}>{ANSWER_CFG[ci].icon}</span>
                        <input
                          type="text"
                          value={editQ?.choices?.[ci] || ''}
                          onChange={e => updateChoice(editingIdx, ci, e.target.value)}
                          placeholder={`ตัวเลือก ${['A','B','C','D'][ci]}`}
                          style={{ background:'transparent', border:'none', outline:'none', color:'#fff', fontFamily:FONT, fontSize:14, flex:1, minWidth:0 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div style={{ marginBottom:8 }}>
                <label style={labelStyle}>เวลา (วินาที)</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[10, 20, 30].map(t => (
                    <button
                      key={t}
                      onClick={() => updateQuestion(editingIdx, 'time', t)}
                      style={{
                        padding:'6px 18px', borderRadius:8, border:`2px solid ${editQ?.time === t ? CYAN : '#444'}`,
                        background: editQ?.time === t ? CYAN + '33' : 'transparent',
                        color: editQ?.time === t ? CYAN : '#aaa', cursor:'pointer', fontFamily:FONT, fontWeight:700, fontSize:14,
                      }}
                    >{t}s</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ background:SURFACE, borderTop:`1px solid #333`, padding:'12px 20px', display:'flex', alignItems:'center', gap:16, flexShrink:0, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, color:'#aaa' }}>เวลาเริ่มต้น:</span>
            {[10, 20, 30].map(t => (
              <button key={t} onClick={() => { setGlobalTime(t); setQuestions(prev => prev.map(q => ({ ...q, time: t }))); }}
                style={{ padding:'4px 12px', borderRadius:6, border:`1px solid ${globalTime === t ? CYAN : '#444'}`, background: globalTime === t ? CYAN+'33' : 'transparent', color: globalTime === t ? CYAN : '#aaa', cursor:'pointer', fontFamily:FONT, fontSize:13 }}>
                {t}s
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, color:'#aaa' }}>ผู้เล่นสูงสุด:</span>
            <input type="number" min={1} max={200} value={maxPlayers} onChange={e => setMaxPlayers(+e.target.value)}
              style={{ ...inputStyle, width:70, padding:'4px 8px', fontSize:13 }} />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            {createErr && <span style={{ color:'#ff6b6b', fontSize:13 }}>{createErr}</span>}
            <button
              onClick={handleCreateRoom}
              disabled={creating || questions.filter(q => q.q.trim()).length === 0}
              style={{
                ...btnStyle(MAGENTA),
                fontSize:16, padding:'10px 28px', fontWeight:900,
                opacity: (creating || questions.filter(q => q.q.trim()).length === 0) ? 0.5 : 1,
                animation: 'buss-glow 2.5s infinite',
              }}
            >
              {creating ? '⏳ กำลังสร้าง...' : '🚀 เปิดห้อง'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: LOBBY ────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const joinUrl = `${appUrl}/student/bussanook?room=${room}`;
    const players = gameState?.players || [];

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG, fontFamily:FONT, color:'#fff', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:SURFACE, padding:'10px 20px', display:'flex', alignItems:'center', gap:12, borderBottom:`2px solid ${CYAN}`, flexShrink:0 }}>
          <span style={{ fontSize:22, fontWeight:900, color:CYAN, letterSpacing:2, textShadow:`0 0 16px ${CYAN}` }}>🎮 BUS-SANOOK</span>
          <span style={{ background:`${CYAN}22`, color:CYAN, borderRadius:6, padding:'2px 10px', fontSize:13, fontWeight:600 }}>LOBBY</span>
          <button onClick={() => setPhase('setup')} style={{ ...btnStyle('#444'), marginLeft:'auto', fontSize:13 }}>✏️ แก้ไขคำถาม</button>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Left: code + QR */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ fontSize:14, color:'#aaa', letterSpacing:2 }}>รหัสห้อง</div>
            <div style={{
              fontSize:72, fontWeight:900, letterSpacing:12, fontFamily:'monospace',
              color:CYAN, textShadow:`0 0 24px ${CYAN}, 0 0 48px ${CYAN}66`,
              animation:'buss-glow 2.5s infinite',
            }}>{room}</div>
            <div style={{ fontSize:13, color:'#888' }}>{joinUrl}</div>
            {qrDataUrl && (
              <div style={{ background:'#fff', borderRadius:16, padding:10, boxShadow:`0 0 24px ${CYAN}44` }}>
                <img src={qrDataUrl} alt="QR Code" style={{ display:'block', width:200, height:200 }} />
              </div>
            )}
            <div style={{ fontSize:13, color:'#aaa', textAlign:'center' }}>
              สแกน QR หรือไปที่ URL แล้วใส่รหัส <strong style={{ color:CYAN }}>{room}</strong>
            </div>
          </div>

          {/* Right: players */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:28, fontWeight:900, color:GOLD }}>{players.length}</span>
              <span style={{ color:'#aaa', fontSize:15 }}>คน รอเข้าเล่น</span>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, flex:1, alignContent:'flex-start', overflowY:'auto', maxHeight:300 }}>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600,
                  background: `hsl(${(i * 47) % 360},60%,35%)`,
                  border: `1px solid hsl(${(i * 47) % 360},60%,55%)`,
                  animation:'buss-popIn 0.3s ease',
                }}>{p.name}</div>
              ))}
              {players.length === 0 && <div style={{ color:'#555', fontSize:14 }}>รอผู้เล่นเข้าห้อง...</div>}
            </div>
            <div style={{ paddingTop:8 }}>
              <div style={{ fontSize:12, color:'#666', marginBottom:8 }}>{gameState?.questions?.length || 0} คำถาม • สูงสุด {gameState?.maxPlayers} คน</div>
              <button
                onClick={handleStartGame}
                disabled={players.length === 0}
                style={{
                  ...btnStyle('#26890c'),
                  fontSize:18, padding:'14px 36px', width:'100%', fontWeight:900,
                  opacity: players.length === 0 ? 0.4 : 1,
                  boxShadow: players.length > 0 ? '0 0 20px #26890c88' : 'none',
                }}
              >▶ เริ่มเกม</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: QUESTION ─────────────────────────────────────────────────────
  if (phase === 'question' && currentQData) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG, fontFamily:FONT, color:'#fff', overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{ background:SURFACE, padding:'10px 20px', display:'flex', alignItems:'center', gap:16, borderBottom:'1px solid #333', flexShrink:0 }}>
          <span style={{ color:CYAN, fontWeight:700, fontSize:15 }}>ข้อ {currentQIdx + 1}/{totalQ}</span>
          <div style={{ flex:1, background:'#2a2a4a', borderRadius:20, height:12, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:20,
              background: `linear-gradient(90deg, ${timerColor}, ${timerColor}aa)`,
              width: `${timerPct}%`,
              transition: 'width 0.1s linear, background 0.5s',
            }} />
          </div>
          <div style={{ fontSize:36, fontWeight:900, fontFamily:'monospace', color:timerColor, minWidth:50, textAlign:'right', textShadow:`0 0 12px ${timerColor}` }}>
            {Math.ceil(timeLeft)}
          </div>
        </div>

        {/* Question */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:24 }}>
          <div style={{
            fontSize:'clamp(20px,3.5vw,36px)', fontWeight:800, textAlign:'center', lineHeight:1.4,
            maxWidth:800, color:'#fff', textShadow:'0 2px 8px #000',
            animation:'buss-popIn 0.4s ease',
          }}>{currentQData.q}</div>

          {/* 4 tiles — show symbols only */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, width:'100%', maxWidth:640 }}>
            {[0,1,2,3].map(ci => {
              const cfg = ANSWER_CFG[ci];
              return (
                <div key={ci} style={{
                  background: cfg.color, borderRadius:16,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'clamp(28px,5vw,52px)', fontWeight:900, color:'#fff',
                  aspectRatio:'2/1', minHeight:80,
                  boxShadow:`0 4px 16px ${cfg.color}66`,
                  letterSpacing:4,
                }}>
                  <span style={{ marginRight:8 }}>{cfg.icon}</span>
                  <span style={{ fontSize:'0.5em', opacity:0.9 }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ background:SURFACE, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #333', flexShrink:0 }}>
          <div style={{
            background: allAnswered ? '#26890c44' : SURFACE2,
            border: `1px solid ${allAnswered ? '#26890c' : '#444'}`,
            borderRadius:20, padding:'6px 16px', fontSize:14, color: allAnswered ? '#36c410' : '#aaa',
          }}>
            {answerCount}/{playerCount} ตอบแล้ว {allAnswered ? '✓ ครบแล้ว!' : ''}
          </div>
          <button
            onClick={handleReveal}
            disabled={revealing}
            style={{
              ...btnStyle(allAnswered ? GOLD : '#555', allAnswered ? '#000' : '#fff'),
              fontSize:16, padding:'10px 28px', fontWeight:700,
              animation: allAnswered ? 'buss-pulse 1.2s infinite' : 'none',
              boxShadow: allAnswered ? `0 0 20px ${GOLD}88` : 'none',
            }}
          >
            {revealing ? '⏳...' : '🔍 เฉลย'}
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: REVEAL ───────────────────────────────────────────────────────
  if (phase === 'reveal' && currentQData) {
    const correctIdx = currentQData.answer;
    const isLast = currentQIdx + 1 >= totalQ;
    const maxCount = Math.max(...distribution.map(d => d.count), 1);
    const BAR_MAX_H = 200;

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG, fontFamily:FONT, color:'#fff', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:SURFACE, padding:'10px 20px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid #333`, flexShrink:0 }}>
          <span style={{ color:GOLD, fontWeight:800, fontSize:16 }}>✨ เฉลย — ข้อ {currentQIdx + 1}/{totalQ}</span>
          <span style={{ marginLeft:'auto', color:'#aaa', fontSize:13 }}>{answerCount}/{playerCount} คนตอบ</span>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14, alignItems:'center' }}>

          {/* Question */}
          <div style={{
            textAlign:'center', fontSize:'clamp(15px,2.2vw,24px)', fontWeight:800, color:'#fff',
            background: `linear-gradient(135deg, ${SURFACE}, #1a1a3e)`,
            padding:'14px 24px', borderRadius:14, maxWidth:700, width:'100%',
            border:'1px solid #333', animation:'buss-bounce-in 0.5s ease',
          }}>
            {currentQData.q}
          </div>

          {/* ── CUTE BAR CHART ── */}
          <div style={{
            background:`linear-gradient(135deg, ${SURFACE}, #12122e)`,
            borderRadius:20, padding:'24px 16px 16px', maxWidth:700, width:'100%',
            border:'1px solid #2a2a5a', boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {/* Bars container */}
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:12, height:BAR_MAX_H + 40, paddingBottom:0 }}>
              {[0,1,2,3].map((ci, barIdx) => {
                const cfg = ANSWER_CFG[ci];
                const isCorrect = ci === correctIdx;
                const dist = distribution[ci];
                const targetH = barsVisible ? Math.max((dist.count / maxCount) * BAR_MAX_H, 8) : 0;
                const DELAY = `${barIdx * 0.1}s`;

                return (
                  <div key={ci} style={{ flex:1, maxWidth:130, display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

                    {/* Count bubble — bounces in */}
                    <div style={{
                      fontSize:26, fontWeight:900,
                      color: isCorrect ? cfg.light : '#666',
                      marginBottom:6,
                      animation: barsVisible ? `buss-count-pop 0.5s ${DELAY} both` : 'none',
                      minHeight:36, display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {dist.count}
                      {isCorrect && dist.count > 0 && (
                        <span style={{ fontSize:16, marginLeft:2, animation:`buss-star-spin 1.5s ${DELAY} infinite` }}>⭐</span>
                      )}
                    </div>

                    {/* The bar */}
                    <div style={{
                      width:'100%',
                      height: targetH,
                      minHeight: isCorrect ? 8 : 0,
                      background: isCorrect
                        ? `linear-gradient(180deg, ${cfg.light} 0%, ${cfg.color} 100%)`
                        : `linear-gradient(180deg, ${cfg.color}55 0%, ${cfg.color}22 100%)`,
                      borderRadius:'14px 14px 6px 6px',
                      border: isCorrect ? `2px solid ${cfg.color}` : `2px solid ${cfg.color}33`,
                      boxShadow: isCorrect ? `0 0 20px ${cfg.color}66, 0 4px 16px ${cfg.color}44` : 'none',
                      transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${DELAY}`,
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start',
                      paddingTop: targetH > 28 ? 8 : 0,
                      position:'relative', overflow:'visible',
                    }}>
                      {isCorrect && targetH > 24 && (
                        <span style={{ fontSize:18, animation:'buss-popIn 0.4s 0.5s both' }}>✓</span>
                      )}
                      {/* Shimmer line on correct */}
                      {isCorrect && (
                        <div style={{
                          position:'absolute', top:0, left:0, right:0, height:3,
                          background:`linear-gradient(90deg, transparent, ${cfg.light}, transparent)`,
                          borderRadius:'14px 14px 0 0',
                          animation:'buss-pulse 1.5s infinite',
                        }} />
                      )}
                    </div>

                    {/* % badge */}
                    <div style={{
                      fontSize:13, fontWeight:800, marginTop:6,
                      color: isCorrect ? '#fff' : '#555',
                      background: isCorrect ? cfg.color : '#ffffff11',
                      padding:'2px 10px', borderRadius:20,
                      animation: barsVisible ? `buss-fadeIn 0.4s ${DELAY} both` : 'none',
                    }}>
                      {dist.pct}%
                    </div>

                    {/* Answer button */}
                    <div style={{
                      marginTop:8, width:'100%',
                      background: isCorrect
                        ? `linear-gradient(135deg, ${cfg.color}, ${cfg.light})`
                        : `${cfg.color}33`,
                      border: `2px solid ${isCorrect ? cfg.color : cfg.color+'44'}`,
                      borderRadius:12, padding:'8px 6px',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                      opacity: isCorrect ? 1 : 0.45,
                      boxShadow: isCorrect ? `0 4px 12px ${cfg.color}55` : 'none',
                      transform: isCorrect ? 'scale(1.04)' : 'scale(1)',
                      transition:'transform 0.3s',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ fontSize:14 }}>{cfg.icon}</span>
                        <span style={{ fontWeight:900, fontSize:14 }}>{cfg.label}</span>
                        {isCorrect && <span style={{ fontSize:12 }}>✓</span>}
                      </div>
                      <div style={{
                        fontSize:11, color: isCorrect ? 'rgba(255,255,255,0.9)' : '#aaa',
                        textAlign:'center', lineHeight:1.3,
                        overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                      }}>
                        {currentQData.choices[ci] || '-'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top scorers this round */}
          {roundToppers.length > 0 && (
            <div style={{
              background:`linear-gradient(135deg, #1a1400, #2a2000)`,
              borderRadius:14, padding:'12px 18px', maxWidth:700, width:'100%',
              border:`1px solid ${GOLD}44`, animation:'buss-bounce-in 0.5s 0.3s both',
            }}>
              <div style={{ fontWeight:700, color:GOLD, marginBottom:8, fontSize:14 }}>🏆 คนได้คะแนนสูงสุดรอบนี้</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {roundToppers.map((p, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'5px 12px',
                    background:`${GOLD}18`, borderRadius:20, border:`1px solid ${GOLD}44`,
                  }}>
                    <span style={{ fontSize:16 }}>{['🥇','🥈','🥉'][i]}</span>
                    <span style={{ fontWeight:700, fontSize:13 }}>{p.name}</span>
                    <span style={{ color:GOLD, fontWeight:900, fontSize:13 }}>+{p.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scoreboard Top 5 */}
          {sortedPlayers.length > 0 && (
            <div style={{
              background:SURFACE, borderRadius:14, padding:'12px 18px', maxWidth:700, width:'100%',
              border:'1px solid #2a2a5a', animation:'buss-bounce-in 0.5s 0.4s both',
            }}>
              <div style={{ fontWeight:700, color:CYAN, marginBottom:8, fontSize:14 }}>📊 คะแนนรวม (Top 5)</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {sortedPlayers.slice(0, 5).map((p, i) => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ minWidth:26, color: i === 0 ? GOLD : '#777', fontWeight:700, fontSize:14 }}>#{i+1}</span>
                    <div style={{ flex:1, background:'#ffffff0a', borderRadius:8, overflow:'hidden', height:22, position:'relative' }}>
                      <div style={{
                        position:'absolute', left:0, top:0, bottom:0,
                        width: sortedPlayers[0]?.score > 0 ? `${(p.score/sortedPlayers[0].score)*100}%` : '0%',
                        background: i === 0 ? `${GOLD}44` : `${CYAN}22`,
                        transition:'width 1s ease',
                      }} />
                      <span style={{ position:'relative', padding:'0 8px', fontSize:13, lineHeight:'22px' }}>{p.name}</span>
                    </div>
                    <span style={{ fontWeight:800, color: i===0 ? GOLD : CYAN, fontSize:14, minWidth:40, textAlign:'right' }}>{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background:SURFACE, padding:'12px 20px', display:'flex', justifyContent:'flex-end', borderTop:'1px solid #333', flexShrink:0 }}>
          <button
            onClick={handleNext}
            disabled={nexting}
            style={{ ...btnStyle(CYAN, '#000'), fontSize:16, padding:'10px 32px', fontWeight:900, boxShadow:`0 0 16px ${CYAN}44` }}
          >
            {nexting ? '⏳...' : isLast ? '🏆 ดูผลสุดท้าย' : 'ถัดไป →'}
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: FINISHED ─────────────────────────────────────────────────────
  if (phase === 'finished') {
    const top3 = sortedPlayers.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd visually

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG, fontFamily:FONT, color:'#fff', overflow:'hidden' }}>

        {/* Confetti */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} style={{
              position:'absolute', left:`${Math.random() * 100}%`, top:'-20px',
              width: 8 + Math.random() * 8, height: 8 + Math.random() * 8,
              background: [CYAN, MAGENTA, GOLD, '#ff6b35', '#a855f7'][i % 5],
              borderRadius: i % 2 === 0 ? '50%' : 2,
              animation: `buss-confetti-fall ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`,
            }} />
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:24, position:'relative', zIndex:1 }}>
          <div style={{ textAlign:'center', fontSize:28, fontWeight:900, color:GOLD, marginBottom:8, animation:'buss-popIn 0.6s', textShadow:`0 0 24px ${GOLD}` }}>
            🎉 สิ้นสุดเกม!
          </div>
          <div style={{ textAlign:'center', fontSize:15, color:'#aaa', marginBottom:28 }}>BUS-SANOOK · {room}</div>

          {/* Podium */}
          {top3.length > 0 && (
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:8, marginBottom:32, maxWidth:480, margin:'0 auto 32px' }}>
              {[
                { player: top3[1], rank: 2, height: 90,  color: '#aaa',   emoji: '🥈', order: 0 },
                { player: top3[0], rank: 1, height: 130, color: GOLD,     emoji: '🥇', order: 1 },
                { player: top3[2], rank: 3, height: 70,  color: '#cd7f32', emoji: '🥉', order: 2 },
              ].map(({ player, rank, height, color, emoji }) => player ? (
                <div key={rank} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ fontSize: rank === 1 ? 28 : 20 }}>{emoji}</div>
                  <div style={{ fontSize: rank === 1 ? 15 : 13, fontWeight:700, textAlign:'center', maxWidth:100, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: rank === 1 ? 18 : 14, fontWeight:900, color }}>
                    {player.score} pt
                  </div>
                  <div style={{
                    width:'100%', height, background:`linear-gradient(180deg, ${color}88, ${color}44)`,
                    borderRadius:'8px 8px 0 0', border:`2px solid ${color}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20, fontWeight:900, color,
                    transformOrigin:'bottom', animation:'buss-podium-rise 0.6s ease',
                  }}>
                    {rank}
                  </div>
                </div>
              ) : <div style={{ flex:1 }} />)}
            </div>
          )}

          {/* Full leaderboard */}
          <div style={{ background:SURFACE, borderRadius:16, padding:16, maxWidth:500, margin:'0 auto' }}>
            <div style={{ fontWeight:700, color:CYAN, marginBottom:12, fontSize:15 }}>📋 ตารางคะแนนสุดท้าย</div>
            {sortedPlayers.map((p, i) => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                borderRadius:8, background: i % 2 === 0 ? '#ffffff08' : 'transparent',
                marginBottom:2,
              }}>
                <span style={{ minWidth:28, color: i === 0 ? GOLD : i < 3 ? '#aaa' : '#555', fontWeight:700, fontSize:16 }}>
                  {i === 0 ? '👑' : `#${i + 1}`}
                </span>
                <span style={{ flex:1, fontWeight: i < 3 ? 700 : 400 }}>{p.name}</span>
                <span style={{ fontWeight:700, color: i === 0 ? GOLD : CYAN, fontSize:16 }}>{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background:SURFACE, padding:'12px 20px', display:'flex', justifyContent:'center', borderTop:'1px solid #333', flexShrink:0, position:'relative', zIndex:1 }}>
          <button onClick={handleReset} style={{ ...btnStyle(MAGENTA), fontSize:16, padding:'10px 32px', fontWeight:900 }}>
            🔄 เล่นอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // ── Fallback loading ─────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', background:BG, fontFamily:FONT, color:CYAN, fontSize:20 }}>
      ⏳ กำลังโหลด...
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function btnStyle(bg, color = '#fff') {
  return {
    background: bg,
    color,
    border: 'none',
    borderRadius: 10,
    padding: '8px 18px',
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: 14,
    transition: 'opacity 0.2s, transform 0.1s',
  };
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: '#aaa',
  marginBottom: 6,
  fontWeight: 600,
  letterSpacing: 1,
};

const inputStyle = {
  background: '#0d0d2b',
  color: '#fff',
  border: '1px solid #444',
  borderRadius: 8,
  padding: '8px 12px',
  fontFamily: FONT,
  fontSize: 14,
  outline: 'none',
};

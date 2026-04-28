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

const IMPORT_EXAMPLE = `Q:เมืองหลวงของไทยคืออะไร?
A:เชียงใหม่
B:กรุงเทพมหานคร
C:ภูเก็ต
D:พัทยา
Ans:B
---
Q:น้ำ 1 ลิตร มีกี่มิลลิลิตร?
A:100
B:500
C:1000
D:2000
Ans:C`;

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
function parseImportText(text) {
  const blocks = text.split(/---+/).map(b => b.trim()).filter(Boolean);
  const questions = [];
  const ansMap = { A: 0, B: 1, C: 2, D: 3 };

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let q = '', choices = ['', '', '', ''], answer = 0, time = 20;
    for (const line of lines) {
      if (line.startsWith('Q:'))   q = line.slice(2).trim();
      else if (line.startsWith('A:'))  choices[0] = line.slice(2).trim();
      else if (line.startsWith('B:'))  choices[1] = line.slice(2).trim();
      else if (line.startsWith('C:'))  choices[2] = line.slice(2).trim();
      else if (line.startsWith('D:'))  choices[3] = line.slice(2).trim();
      else if (line.startsWith('Ans:')) {
        const k = line.slice(4).trim().toUpperCase();
        answer = ansMap[k] ?? 0;
      } else if (line.startsWith('Time:')) {
        const t = parseInt(line.slice(5));
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
    setImportErr('');
    const parsed = parseImportText(importText);
    if (parsed.length === 0) { setImportErr('ไม่พบคำถามที่ถูกรูปแบบ กรุณาตรวจสอบรูปแบบอีกครั้ง'); return; }
    setQuestions(parsed);
    setEditingIdx(0);
    setImporting(false);
    setImportText('');
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

        {/* Import Modal */}
        {importing && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:SURFACE2, borderRadius:16, padding:28, width:'min(600px,95vw)', border:`1px solid ${CYAN}` }}>
              <div style={{ fontWeight:700, fontSize:18, marginBottom:12, color:CYAN }}>📥 นำเข้าคำถาม</div>
              <div style={{ fontSize:13, color:'#aaa', marginBottom:8 }}>รูปแบบ: แยกแต่ละข้อด้วย --- (ดูตัวอย่างด้านล่าง)</div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={IMPORT_EXAMPLE}
                style={{ width:'100%', height:200, background:'#0d0d2b', color:'#fff', border:`1px solid #444`, borderRadius:8, padding:10, fontFamily:FONT, fontSize:13, resize:'vertical' }}
              />
              {importErr && <div style={{ color:'#ff6b6b', fontSize:13, marginTop:6 }}>{importErr}</div>}
              <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
                <button onClick={() => { setImporting(false); setImportErr(''); }} style={btnStyle('#555')}>ยกเลิก</button>
                <button onClick={handleImport} style={btnStyle(CYAN, '#000')}>นำเข้า</button>
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

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG, fontFamily:FONT, color:'#fff', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:SURFACE, padding:'10px 20px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid #333`, flexShrink:0 }}>
          <span style={{ color:GOLD, fontWeight:700, fontSize:15 }}>🔍 เฉลย — ข้อ {currentQIdx + 1}/{totalQ}</span>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Question */}
          <div style={{ textAlign:'center', fontSize:'clamp(16px,2.5vw,26px)', fontWeight:700, color:'#fff', animation:'buss-fadeIn 0.5s' }}>
            {currentQData.q}
          </div>

          {/* Answer tiles with distribution */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:700, margin:'0 auto', width:'100%' }}>
            {[0,1,2,3].map(ci => {
              const cfg = ANSWER_CFG[ci];
              const isCorrect = ci === correctIdx;
              const dist = distribution[ci];
              return (
                <div key={ci} style={{
                  borderRadius:14, overflow:'hidden', position:'relative',
                  border: `3px solid ${isCorrect ? '#fff' : 'transparent'}`,
                  opacity: isCorrect ? 1 : 0.45,
                  boxShadow: isCorrect ? `0 0 28px ${cfg.color}` : 'none',
                  animation: isCorrect ? 'buss-popIn 0.5s ease' : 'none',
                }}>
                  <div style={{ background: cfg.color, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>{cfg.icon}</span>
                    <span style={{ fontWeight:700, fontSize:14, flex:1, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {currentQData.choices[ci]}
                    </span>
                    {isCorrect && <span style={{ fontSize:20 }}>✓</span>}
                    <span style={{ fontSize:13, fontWeight:700 }}>{dist?.count || 0}</span>
                  </div>
                  <div style={{ background:'#1a1a3a', height:8 }}>
                    <div style={{ height:'100%', background:cfg.color, width:`${dist?.pct || 0}%`, transition:'width 0.8s ease' }} />
                  </div>
                  <div style={{ background:'#11112a', padding:'2px 14px', fontSize:11, color:'#aaa' }}>
                    {dist?.pct || 0}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top 3 this round */}
          {roundToppers.length > 0 && (
            <div style={{ background:SURFACE, borderRadius:14, padding:'14px 18px', maxWidth:700, margin:'0 auto', width:'100%' }}>
              <div style={{ fontWeight:700, color:GOLD, marginBottom:10, fontSize:15 }}>🏆 คนได้คะแนนสูงสุดรอบนี้</div>
              {roundToppers.map((p, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>{['🥇','🥈','🥉'][i]}</span>
                  <span style={{ fontWeight:700 }}>{p.name}</span>
                  <span style={{ marginLeft:'auto', color:GOLD, fontWeight:700 }}>+{p.points}</span>
                </div>
              ))}
            </div>
          )}

          {/* Scoreboard preview */}
          {sortedPlayers.length > 0 && (
            <div style={{ background:SURFACE, borderRadius:14, padding:'14px 18px', maxWidth:700, margin:'0 auto', width:'100%' }}>
              <div style={{ fontWeight:700, color:CYAN, marginBottom:10, fontSize:15 }}>📊 คะแนนรวม (Top 5)</div>
              {sortedPlayers.slice(0, 5).map((p, i) => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <span style={{ minWidth:24, color: i === 0 ? GOLD : '#888', fontWeight:700 }}>#{i + 1}</span>
                  <span style={{ flex:1 }}>{p.name}</span>
                  <span style={{ fontWeight:700, color:CYAN }}>{p.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background:SURFACE, padding:'12px 20px', display:'flex', justifyContent:'flex-end', borderTop:'1px solid #333', flexShrink:0 }}>
          <button
            onClick={handleNext}
            disabled={nexting}
            style={{ ...btnStyle(CYAN, '#000'), fontSize:16, padding:'10px 32px', fontWeight:900 }}
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

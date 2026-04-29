'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', purple: '#7c4dff', gold: '#ffc107' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', sans-serif";
const LS_KEY = 'spinwheel_items';

const SEGMENT_COLORS = [
  '#00b4e6', '#e6007e', '#7c4dff', '#ffc107',
  '#10b981', '#f97316', '#3b82f6', '#ec4899',
];

const DEFAULT_ITEMS = [
  'สมชาย', 'สมหญิง', 'วิชัย', 'นภา',
  'ธนกร', 'พิมพ์ใจ', 'อนุชา', 'กัลยา',
];

// ---- Confetti helpers ----
const CONFETTI_COLORS = ['#00b4e6', '#e6007e', '#7c4dff', '#ffc107', '#10b981', '#f97316'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function generateConfettiParticles(count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(5, 95),
    y: randomBetween(-20, -5),
    size: randomBetween(6, 14),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: randomBetween(0, 360),
    speed: randomBetween(1.5, 4),
    drift: randomBetween(-1, 1),
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }));
}

// ---- Draw wheel on canvas ----
function drawWheel(canvas, items, rotationAngle) {
  if (!canvas || items.length === 0) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  const numSegments = items.length;
  const arc = (2 * Math.PI) / numSegments;

  ctx.clearRect(0, 0, size, size);

  // Shadow ring
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < numSegments; i++) {
    const startAngle = rotationAngle + i * arc;
    const endAngle = startAngle + arc;
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Segment border
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(10, Math.min(16, Math.floor(radius / (numSegments * 0.5))))}px ${FONT}`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    // Truncate text if too long
    const label = items[i].length > 12 ? items[i].slice(0, 12) + '…' : items[i];
    ctx.fillText(label, radius - 12, 5);
    ctx.restore();
  }

  // Center cap
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a1a3e';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center icon
  ctx.fillStyle = '#fff';
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎯', cx, cy);
}

// ---- Web Audio helpers ----
function getAudioCtx(ref) {
  if (!ref.current) {
    try {
      ref.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch {}
  }
  return ref.current;
}

// C major pentatonic scale across 2.5 octaves — always sounds musical
const PIANO_SCALE = [
  261.63, 293.66, 329.63, 392.00, 440.00,   // C4 D4 E4 G4 A4
  523.25, 587.33, 659.25, 783.99, 880.00,   // C5 D5 E5 G5 A5
  1046.50, 1174.66, 1318.51, 1567.98,       // C6 D6 E6 G6
];

// Piano synthesis: triangle fundamental + sine harmonics → warm piano timbre
function playPianoNote(audioCtxRef, noteIndex, velocity = 0.7) {
  const ctx = getAudioCtx(audioCtxRef);
  if (!ctx) return;
  try {
    const freq = PIANO_SCALE[noteIndex % PIANO_SCALE.length];
    const now = ctx.currentTime;
    const decayTime = 0.25 + (1 - velocity) * 0.3; // slower = longer sustain

    // Fundamental (triangle for warmth)
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.38 * velocity, now + 0.004);
    g1.gain.exponentialRampToValueAtTime(0.001, now + decayTime);
    osc1.start(now); osc1.stop(now + decayTime + 0.05);

    // 2nd harmonic (sine, quieter — gives piano brightness)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.10 * velocity, now + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.001, now + decayTime * 0.6);
    osc2.start(now); osc2.stop(now + decayTime);

    // 3rd harmonic (very soft)
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.connect(g3); g3.connect(ctx.destination);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);
    g3.gain.setValueAtTime(0, now);
    g3.gain.linearRampToValueAtTime(0.03 * velocity, now + 0.004);
    g3.gain.exponentialRampToValueAtTime(0.001, now + decayTime * 0.4);
    osc3.start(now); osc3.stop(now + decayTime);
  } catch {}
}

function playWinFanfare(audioCtxRef) {
  const ctx = getAudioCtx(audioCtxRef);
  if (!ctx) return;
  try {
    // Piano fanfare: C5-E5-G5-C6-E6 arpeggio with full piano timbre
    const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    melody.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.12;
      const isFinal = i === melody.length - 1;
      const decayTime = isFinal ? 1.2 : 0.5;
      const vol = isFinal ? 0.45 : 0.32;

      // Fundamental
      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.connect(g1); g1.connect(ctx.destination);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, t);
      g1.gain.setValueAtTime(0, t);
      g1.gain.linearRampToValueAtTime(vol, t + 0.004);
      g1.gain.exponentialRampToValueAtTime(0.001, t + decayTime);
      osc1.start(t); osc1.stop(t + decayTime + 0.05);

      // Harmonic
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.connect(g2); g2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, t);
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(vol * 0.22, t + 0.004);
      g2.gain.exponentialRampToValueAtTime(0.001, t + decayTime * 0.5);
      osc2.start(t); osc2.stop(t + decayTime);
    });
  } catch {}
}

export default function SpinWheel() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastSegmentRef = useRef(-1);
  const noteIndexRef = useRef(0);
  const [rawText, setRawText] = useState(DEFAULT_ITEMS.join('\n'));
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [originalItems, setOriginalItems] = useState(DEFAULT_ITEMS);
  const [spinning, setSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [removeWinner, setRemoveWinner] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  // Mode: 'wheel' | 'boxes'
  const [mode, setMode]               = useState('wheel');
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const boxesAnimRef = useRef(null);

  // Canvas size (responsive)
  const CANVAS_SIZE = 540;

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setOriginalItems(parsed);
          setRawText(parsed.join('\n'));
        }
      }
    } catch {}
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // Redraw wheel whenever items or rotation changes
  useEffect(() => {
    drawWheel(canvasRef.current, items, rotationAngle);
  }, [items, rotationAngle]);

  // Parse textarea into items
  const applyItems = useCallback(() => {
    const parsed = rawText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    if (parsed.length < 2) {
      toast.error('กรุณาใส่รายการอย่างน้อย 2 รายการ');
      return;
    }
    setItems(parsed);
    setOriginalItems(parsed);
    toast.success(`บันทึก ${parsed.length} รายการแล้ว`);
  }, [rawText]);

  // Spin logic with requestAnimationFrame + Web Audio ticks
  const spin = useCallback(() => {
    if (spinning) return;
    if (items.length < 2) {
      toast.error('ต้องมีรายการอย่างน้อย 2 รายการ');
      return;
    }
    // Resume audio context (browser requires user gesture)
    const ctx = getAudioCtx(audioCtxRef);
    if (ctx && ctx.state === 'suspended') ctx.resume();

    setShowWinner(false);
    setWinner(null);
    lastSegmentRef.current = -1;

    const totalRotation = (Math.random() * 3 + 5) * 2 * Math.PI; // 5-8 full spins (slower)
    const duration = 4500 + Math.random() * 2000; // 4.5-6.5 seconds (more time for tick sounds)
    const startTime = performance.now();
    const startAngle = rotationAngle;
    const numSegments = items.length;
    const arc = (2 * Math.PI) / numSegments;
    const pointerAngle = (3 * Math.PI) / 2;

    setSpinning(true);
    noteIndexRef.current = 0; // reset note sequence each spin

    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const currentAngle = startAngle + totalRotation * eased;

      setRotationAngle(currentAngle);
      drawWheel(canvasRef.current, items, currentAngle);

      // Detect segment change → play tick
      const normalizedAngle = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const relativeAngle = ((pointerAngle - normalizedAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const currentSegment = Math.floor(relativeAngle / arc) % numSegments;
      if (currentSegment !== lastSegmentRef.current) {
        lastSegmentRef.current = currentSegment;
        // Ascend scale while spinning fast, use full scale length
        // velocity: louder when fast (progress near 0), softer near end
        const velocity = 0.45 + (1 - progress) * 0.55;
        playPianoNote(audioCtxRef, noteIndexRef.current, velocity);
        noteIndexRef.current = (noteIndexRef.current + 1) % PIANO_SCALE.length;
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        const winnerIndex = Math.floor(relativeAngle / arc) % numSegments;
        const winnerName = items[winnerIndex];

        setWinner(winnerName);
        setSpinning(false);

        // 🎉 Win fanfare
        playWinFanfare(audioCtxRef);

        // Confetti burst
        setConfetti(generateConfettiParticles(70));
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 3500);

        setShowWinner(true);
        toast.success(`🎉 ผู้ชนะคือ "${winnerName}"!`);

        if (removeWinner) {
          const newItems = items.filter((_, idx) => idx !== winnerIndex);
          setItems(newItems.length > 0 ? newItems : items);
          if (newItems.length === 0) toast('รายการหมดแล้ว กรุณารีเซ็ต');
        }
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }, [spinning, items, rotationAngle, removeWinner]);

  // ── Box Mode: cycle highlight through boxes, slow down, settle on winner ──
  const spinBoxes = useCallback(() => {
    if (spinning) return;
    if (items.length < 2) {
      toast.error('ต้องมีรายการอย่างน้อย 2 รายการ');
      return;
    }
    const ctx = getAudioCtx(audioCtxRef);
    if (ctx && ctx.state === 'suspended') ctx.resume();

    setShowWinner(false);
    setWinner(null);
    setSpinning(true);
    noteIndexRef.current = 0;

    const winnerIndex = Math.floor(Math.random() * items.length);

    // Build a tick schedule: fast → slow (eased)
    const totalTicks = 22 + Math.floor(Math.random() * 8); // 22-30 highlights
    const totalDuration = 3500;
    const schedule = [];
    let elapsed = 0;
    for (let i = 0; i < totalTicks; i++) {
      const progress = i / (totalTicks - 1);
      // easeOut: ticks start fast (small interval), end slow (large interval)
      const eased = Math.pow(progress, 2.4);
      const interval = 60 + eased * 360;     // 60ms → 420ms
      elapsed += interval;
      schedule.push(elapsed);
    }
    // Normalize total duration
    const scale = totalDuration / elapsed;
    const normalized = schedule.map(t => t * scale);

    let tickIdx = 0;
    let lastIdx = -1;

    const doTick = () => {
      if (tickIdx >= normalized.length) {
        // Final settle on winner
        setHighlightedIdx(winnerIndex);
        const finalName = items[winnerIndex];
        setWinner(finalName);
        playWinFanfare(audioCtxRef);
        setConfetti(generateConfettiParticles(70));
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 3500);
        setShowWinner(true);
        toast.success(`🎉 ผู้โชคดีคือ "${finalName}"!`);
        setSpinning(false);
        if (removeWinner) {
          const newItems = items.filter((_, idx) => idx !== winnerIndex);
          setTimeout(() => {
            setItems(newItems.length > 0 ? newItems : items);
            setHighlightedIdx(-1);
            if (newItems.length === 0) toast('รายการหมดแล้ว กรุณารีเซ็ต');
          }, 2000);
        }
        return;
      }
      // Pick a random index different from last (so we always see a change)
      let idx;
      if (tickIdx === normalized.length - 1) {
        idx = winnerIndex; // make sure last visible tick is the winner
      } else {
        do { idx = Math.floor(Math.random() * items.length); }
        while (items.length > 1 && idx === lastIdx);
      }
      lastIdx = idx;
      setHighlightedIdx(idx);
      // Tick sound
      const progress = tickIdx / normalized.length;
      const velocity = 0.45 + (1 - progress) * 0.55;
      playPianoNote(audioCtxRef, noteIndexRef.current, velocity);
      noteIndexRef.current = (noteIndexRef.current + 1) % PIANO_SCALE.length;

      const nextWait = (tickIdx === 0 ? normalized[0] : normalized[tickIdx] - normalized[tickIdx - 1]);
      tickIdx++;
      boxesAnimRef.current = setTimeout(doTick, Math.max(40, nextWait));
    };

    doTick();
  }, [spinning, items, removeWinner]);

  // Choose which spin to run based on mode
  const handleSpin = useCallback(() => {
    if (mode === 'boxes') return spinBoxes();
    return spin();
  }, [mode, spin, spinBoxes]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (boxesAnimRef.current) clearTimeout(boxesAnimRef.current);
    };
  }, []);

  const resetList = useCallback(() => {
    setItems(originalItems);
    setRawText(originalItems.join('\n'));
    setWinner(null);
    setShowWinner(false);
    toast.success('รีเซ็ตรายการแล้ว');
  }, [originalItems]);

  // ---- Render ----
  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', padding: '24px 16px' }}>
      {/* Confetti overlay */}
      {confettiActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {confetti.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.shape === 'rect' ? `${p.size}px` : `${p.size}px`,
                height: p.shape === 'rect' ? `${p.size * 0.5}px` : `${p.size}px`,
                borderRadius: p.shape === 'circle' ? '50%' : '2px',
                background: p.color,
                transform: `rotate(${p.rotation}deg)`,
                animation: `confettiFall ${p.speed}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes confettiFall {
              0%   { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
              80%  { opacity: 1; }
              100% { transform: translateY(105vh) rotate(720deg) translateX(${Math.random() > 0.5 ? '80' : '-80'}px); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Winner Modal */}
      {showWinner && winner && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '24px',
          }}
          onClick={() => setShowWinner(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '24px', padding: '48px 40px',
              textAlign: 'center', maxWidth: '420px', width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes popIn {
                from { transform: scale(0.5); opacity: 0; }
                to   { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>🎉</div>
            <div style={{ color: '#64748b', fontSize: '16px', marginBottom: '8px', fontFamily: FONT }}>ผู้โชคดีคือ</div>
            <div style={{
              fontSize: '42px', fontWeight: 900, color: CI.magenta,
              fontFamily: FONT, wordBreak: 'break-word', lineHeight: 1.2,
              marginBottom: '24px',
              textShadow: '0 2px 12px rgba(230,0,126,0.2)',
            }}>
              {winner}
            </div>
            {removeWinner && (
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                ลบ "{winner}" ออกจากรายการแล้ว
              </div>
            )}
            <button
              onClick={() => setShowWinner(false)}
              style={{
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                color: '#fff', border: 'none', borderRadius: '12px',
                padding: '12px 32px', fontSize: '16px', fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
              }}
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1a1a3e', margin: 0, fontFamily: FONT }}>
          🎡 วงล้อสุ่ม
        </h1>
        <p style={{ color: '#64748b', margin: '6px 0 0', fontFamily: FONT }}>สุ่มชื่อหรือหัวข้อด้วยวงล้อแบบ interactive</p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(300px,1fr) minmax(560px,1.6fr)', gap: '28px' }}>
        {/* Left: Controls */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', color: '#1a1a3e', fontSize: '16px', fontWeight: 700, fontFamily: FONT }}>
            รายการ ({items.length} รายการ)
          </h3>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="ใส่ชื่อหรือรายการ (หนึ่งบรรทัดต่อหนึ่งรายการ)"
            style={{
              width: '100%', height: '200px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
              padding: '12px', fontSize: '14px', fontFamily: FONT, color: '#1a1a3e',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7,
            }}
          />
          <button
            onClick={applyItems}
            style={{
              marginTop: '10px', width: '100%', padding: '10px',
              background: `linear-gradient(135deg, ${CI.cyan}, #0090c0)`,
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            ✅ บันทึกรายการ
          </button>

          {/* Options */}
          <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontFamily: FONT, color: '#1a1a3e', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={removeWinner}
                onChange={e => setRemoveWinner(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: CI.magenta, cursor: 'pointer' }}
              />
              ✅ ลบรายการที่ถูกเลือกออกหลังหมุน
            </label>
          </div>

          {/* Reset */}
          <button
            onClick={resetList}
            style={{
              marginTop: '12px', width: '100%', padding: '10px',
              background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0',
              borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            🔄 รีเซ็ต ({originalItems.length} รายการ)
          </button>

          {/* Current items preview */}
          {items.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontFamily: FONT }}>รายการปัจจุบัน:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {items.map((item, i) => (
                  <span
                    key={i}
                    style={{
                      background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] + '22',
                      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                      border: `1px solid ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}44`,
                      borderRadius: '20px', padding: '3px 10px',
                      fontSize: '12px', fontFamily: FONT, fontWeight: 600,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Wheel OR Boxes */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Mode toggle */}
          <div style={{
            display:'flex', gap:6, background:'#f1f5f9', borderRadius:12,
            padding:5, marginBottom:18, width:'100%', maxWidth:400,
          }}>
            {[
              { id:'wheel', icon:'🎡', label:'วงล้อหมุน' },
              { id:'boxes', icon:'✨', label:'กล่องสุ่ม' },
            ].map(m => (
              <button key={m.id}
                onClick={() => !spinning && setMode(m.id)}
                disabled={spinning}
                style={{
                  flex:1, padding:'10px 12px', borderRadius:9, border:'none',
                  background: mode === m.id
                    ? `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`
                    : 'transparent',
                  color: mode === m.id ? '#fff' : '#64748b',
                  cursor: spinning ? 'not-allowed' : 'pointer',
                  fontFamily:FONT, fontWeight:800, fontSize:14,
                  boxShadow: mode === m.id ? `0 4px 14px ${CI.purple}40` : 'none',
                  transition:'all 0.2s',
                }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* ════════════ WHEEL MODE ════════════ */}
          {mode === 'wheel' && (
            <>
              <div style={{ position: 'relative' }}>
                {/* Pointer */}
                <div style={{
                  position: 'absolute',
                  top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '14px solid transparent',
                  borderRight: '14px solid transparent',
                  borderTop: '28px solid #e6007e',
                  filter: 'drop-shadow(0 3px 6px rgba(230,0,126,0.5))',
                  zIndex: 5,
                }} />
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  style={{ display: 'block', maxWidth: '100%', borderRadius: '50%' }}
                />
              </div>
            </>
          )}

          {/* ════════════ BOXES MODE ════════════ */}
          {mode === 'boxes' && (
            <div style={{
              width:'100%', minHeight: 480,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding:'12px 0',
            }}>
              <style>{`
                @keyframes boxPop {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.18) rotate(2deg); }
                  100% { transform: scale(1); }
                }
                @keyframes winnerPulse {
                  0%,100% { transform: scale(1.08); box-shadow: 0 0 0 4px rgba(255,255,255,0.6), 0 0 32px rgba(230,0,126,0.6); }
                  50%     { transform: scale(1.14); box-shadow: 0 0 0 8px rgba(255,255,255,0.4), 0 0 48px rgba(230,0,126,0.85); }
                }
                @keyframes winnerStar {
                  0%,100% { transform: rotate(-8deg) scale(1); }
                  50%     { transform: rotate(8deg) scale(1.15); }
                }
              `}</style>

              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))',
                gap:14, width:'100%', padding:'8px',
              }}>
                {items.map((item, i) => {
                  const isHi    = highlightedIdx === i;
                  const isWin   = !spinning && winner === item;
                  const color   = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                  return (
                    <div key={i} style={{
                      position:'relative',
                      background: isHi || isWin
                        ? `linear-gradient(135deg, ${color}, ${color}dd)`
                        : `${color}15`,
                      border: `3px solid ${isHi || isWin ? color : color + '55'}`,
                      borderRadius: 18,
                      padding: '20px 14px',
                      textAlign:'center',
                      transform: isWin
                        ? 'scale(1.08)'
                        : isHi ? 'scale(1.06)' : 'scale(1)',
                      transition: spinning ? 'transform 0.12s ease, background 0.12s' : 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow: isWin
                        ? `0 0 0 4px rgba(255,255,255,0.6), 0 0 32px ${color}cc`
                        : isHi
                          ? `0 8px 24px ${color}66, 0 0 0 3px ${color}33`
                          : `0 2px 8px rgba(0,0,0,0.05)`,
                      animation: isWin ? 'winnerPulse 1.2s ease infinite' : 'none',
                      cursor: 'default',
                      minHeight: 76,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <div style={{
                        fontSize: isHi || isWin ? 18 : 16,
                        fontWeight: 800,
                        color: isHi || isWin ? '#fff' : color,
                        fontFamily:FONT,
                        lineHeight:1.3,
                        textShadow: isHi || isWin ? '0 2px 6px rgba(0,0,0,0.25)' : 'none',
                        wordBreak:'break-word',
                      }}>
                        {item}
                      </div>
                      {isWin && (
                        <>
                          <div style={{
                            position:'absolute', top:-14, right:-10,
                            background:'#fff', color: CI.magenta,
                            padding:'4px 10px', borderRadius:14,
                            fontSize:11, fontWeight:900,
                            fontFamily:FONT, letterSpacing:0.5,
                            boxShadow:'0 4px 12px rgba(230,0,126,0.4)',
                            transform:'rotate(8deg)',
                            zIndex:2,
                          }}>
                            ⭐ ผู้โชคดี
                          </div>
                          <div style={{
                            position:'absolute', top:-22, left:-8,
                            fontSize:28,
                            animation:'winnerStar 0.8s ease-in-out infinite',
                          }}>👑</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spin button — works for both modes */}
          <button
            onClick={handleSpin}
            disabled={spinning}
            style={{
              marginTop: '20px',
              padding: '14px 48px',
              background: spinning
                ? '#e2e8f0'
                : `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
              color: spinning ? '#94a3b8' : '#fff',
              border: 'none',
              borderRadius: '50px',
              fontSize: '22px',
              fontWeight: 900,
              cursor: spinning ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
              boxShadow: spinning ? 'none' : `0 6px 24px rgba(230,0,126,0.35)`,
              transition: 'all 0.2s',
              letterSpacing: '2px',
            }}
          >
            {spinning
              ? (mode === 'boxes' ? '✨ กำลังสุ่ม...' : '⏳ กำลังหมุน...')
              : (mode === 'boxes' ? '🎲 สุ่มผู้โชคดี!' : '🎯 หมุน!')}
          </button>

          {/* Winner display below */}
          {winner && !showWinner && (
            <div style={{
              marginTop: '16px',
              padding: '14px 24px',
              background: `linear-gradient(135deg, ${CI.magenta}15, ${CI.purple}15)`,
              border: `2px solid ${CI.magenta}`,
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontFamily: FONT }}>ผู้โชคดีล่าสุด</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: CI.magenta, fontFamily: FONT }}>🎉 {winner}</div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stack columns */}
      <style>{`
        @media (max-width: 680px) {
          .spinwheel-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

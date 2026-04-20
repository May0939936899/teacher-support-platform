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

function playTick(audioCtxRef, intensity = 1) {
  const ctx = getAudioCtx(audioCtxRef);
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Bell / ding sound: sine harmonics with quick attack, melodic decay
    const baseFreq = 660 + intensity * 280;
    [[1.0, 0.22], [2.76, 0.10], [5.4, 0.045]].forEach(([harmonic, vol]) => {
      const freq = baseFreq * harmonic;
      if (freq > 9000) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * Math.min(intensity, 1), now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.22);
    });
  } catch {}
}

function playWinFanfare(audioCtxRef) {
  const ctx = getAudioCtx(audioCtxRef);
  if (!ctx) return;
  try {
    // Ascending cheerful melody: C5-E5-G5-C6 + harmony
    const melody = [523, 659, 784, 1047, 1319];
    melody.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.13;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = i === melody.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    // Short drum hit at start
    const noise = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.type = 'sawtooth';
    noise.frequency.setValueAtTime(80, ctx.currentTime);
    noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.2);
  } catch {}
}

export default function SpinWheel() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastSegmentRef = useRef(-1);
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

  // Canvas size (responsive)
  const CANVAS_SIZE = 400;

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

    const totalRotation = (Math.random() * 4 + 8) * 2 * Math.PI; // 8-12 full spins
    const duration = 3000 + Math.random() * 2000; // 3-5 seconds
    const startTime = performance.now();
    const startAngle = rotationAngle;
    const numSegments = items.length;
    const arc = (2 * Math.PI) / numSegments;
    const pointerAngle = (3 * Math.PI) / 2;

    setSpinning(true);

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
        // intensity: louder/higher when fast (early), softer when slow (near end)
        playTick(audioCtxRef, 1 - progress * 0.6);
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

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
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

      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(320px,1fr)', gap: '24px' }}>
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

        {/* Right: Wheel */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Pointer arrow */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
            {/* Pointer triangle at top */}
            <div style={{
              width: 0, height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '26px solid #e6007e',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
              position: 'absolute',
              top: '-4px',
              zIndex: 10,
            }} />
          </div>

          <div style={{ position: 'relative' }}>
            {/* Pointer */}
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
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

          {/* Spin button */}
          <button
            onClick={spin}
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
            {spinning ? '⏳ กำลังหมุน...' : '🎯 หมุน!'}
          </button>

          {/* Winner display below wheel */}
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

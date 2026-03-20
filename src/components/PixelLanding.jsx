'use client';
import { useState, useEffect, useRef } from 'react';

const PIXEL_CHARS = [
  // B
  [
    [1,1,1,0],
    [1,0,0,1],
    [1,1,1,0],
    [1,0,0,1],
    [1,1,1,0],
  ],
  // i
  [
    [1],
    [0],
    [1],
    [1],
    [1],
  ],
  // Z
  [
    [1,1,1,1],
    [0,0,1,0],
    [0,1,0,0],
    [1,0,0,0],
    [1,1,1,1],
  ],
];

const COLORS = ['#00ADEF', '#E3007E', '#004175', '#00ADEF', '#E3007E'];

export default function PixelLanding({ onComplete }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('pixels'); // pixels → title → fade
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState([]);
  const [showSkip, setShowSkip] = useState(false);

  // Show skip button after 1s
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Main animation timeline
  useEffect(() => {
    let frame;
    let start = null;
    const duration = 3500; // total animation ms

    function animate(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 0.4) setPhase('pixels');
      else if (p < 0.85) setPhase('title');
      else setPhase('fade');

      if (p >= 1) {
        onComplete();
        return;
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  // Generate floating particles
  useEffect(() => {
    const pts = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      speed: Math.random() * 20 + 10,
      delay: Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(pts);
  }, []);

  const pixelOpacity = phase === 'pixels' ? 1 : phase === 'title' ? Math.max(0, 1 - (progress - 0.4) * 4) : 0;
  const titleOpacity = phase === 'title' ? Math.min(1, (progress - 0.4) * 3) : phase === 'fade' ? Math.max(0, 1 - (progress - 0.85) * 6) : 0;
  const fadeOverlay = phase === 'fade' ? Math.min(1, (progress - 0.85) * 6.5) : 0;

  return (
    <div className="pixel-landing" style={{ opacity: fadeOverlay < 1 ? 1 : 0 }}>
      {/* Animated background particles */}
      <div className="pixel-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="pixel-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
              animationDuration: `${p.speed}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Pixel art "BiZ" */}
      <div className="pixel-logo-area" style={{ opacity: pixelOpacity, transform: `scale(${0.8 + pixelOpacity * 0.2})` }}>
        <div className="pixel-grid-container">
          {PIXEL_CHARS.map((charGrid, ci) => (
            <div key={ci} className="pixel-char" style={{ marginRight: ci < PIXEL_CHARS.length - 1 ? '12px' : 0 }}>
              {charGrid.map((row, ri) => (
                <div key={ri} className="pixel-row">
                  {row.map((cell, xi) => (
                    <div
                      key={xi}
                      className={`pixel-cell ${cell ? 'active' : ''}`}
                      style={{
                        animationDelay: `${(ci * 5 + ri * row.length + xi) * 60}ms`,
                        backgroundColor: cell ? COLORS[ci % COLORS.length] : 'transparent',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="pixel-subtitle-text">CONTENT</div>
      </div>

      {/* Full title reveal */}
      <div className="pixel-title-area" style={{ opacity: titleOpacity, transform: `translateY(${(1 - titleOpacity) * 30}px)` }}>
        <h1 className="pixel-main-title">
          <span className="pixel-biz">SPUBUS</span> BIZ CONTENT
        </h1>
        <p className="pixel-tagline">AI-Powered Content Generator</p>
        <p className="pixel-school">คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม</p>
      </div>

      {/* White fade overlay for transition */}
      <div className="pixel-fade-overlay" style={{ opacity: fadeOverlay }} />

      {/* Skip button */}
      {showSkip && (
        <button className="pixel-skip-btn" onClick={onComplete}>
          ข้าม →
        </button>
      )}

      {/* Progress bar */}
      <div className="pixel-progress">
        <div className="pixel-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const CATEGORIES = [
  { key: 'structure', label: 'โครงสร้าง', icon: '🏗️', color: CI.cyan },
  { key: 'depth', label: 'ความลึกเนื้อหา', icon: '🔬', color: CI.purple },
  { key: 'citations', label: 'การอ้างอิง', icon: '📚', color: CI.gold },
  { key: 'grammar', label: 'ไวยากรณ์', icon: '✏️', color: CI.magenta },
  { key: 'clarity', label: 'ความชัดเจน', icon: '💡', color: '#4caf50' },
];

function getGrade(score) {
  if (score >= 90) return { grade: 'A', color: '#4caf50' };
  if (score >= 80) return { grade: 'B+', color: '#8bc34a' };
  if (score >= 70) return { grade: 'B', color: CI.gold };
  if (score >= 60) return { grade: 'C+', color: '#ff9800' };
  if (score >= 50) return { grade: 'C', color: '#ff5722' };
  return { grade: 'D', color: CI.magenta };
}

// CSS-based radar chart using clip-path polygon
function RadarChart({ scores }) {
  const size = 240;
  const center = size / 2;
  const maxRadius = size / 2 - 20;
  const categories = CATEGORIES;
  const n = categories.length;

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridLevels.map(level => {
          const points = Array.from({ length: n }, (_, i) => {
            const p = getPoint(i, level);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon key={level} points={points} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          );
        })}

        {/* Axis lines */}
        {categories.map((_, i) => {
          const p = getPoint(i, 100);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />;
        })}

        {/* Data polygon */}
        <polygon
          points={categories.map((cat, i) => {
            const p = getPoint(i, scores[cat.key] || 0);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill={`${CI.cyan}33`}
          stroke={CI.cyan}
          strokeWidth={2}
        />

        {/* Data points */}
        {categories.map((cat, i) => {
          const p = getPoint(i, scores[cat.key] || 0);
          return <circle key={cat.key} cx={p.x} cy={p.y} r={4} fill={cat.color} />;
        })}

        {/* Labels */}
        {categories.map((cat, i) => {
          const p = getPoint(i, 115);
          return (
            <text key={cat.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.8)" fontSize={12} fontFamily={FONT}>
              {cat.icon} {scores[cat.key] || 0}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function WritingQuality() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return toast.error('กรุณาวางงานเขียนที่ต้องการวิเคราะห์');
    if (text.trim().length < 50) return toast.error('ข้อความสั้นเกินไป (ขั้นต่ำ 50 ตัวอักษร)');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'writing-quality',
          payload: { text }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success('วิเคราะห์เสร็จแล้ว!');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const overallScore = result ? Math.round(
    CATEGORIES.reduce((sum, cat) => sum + (result.scores?.[cat.key] || 0), 0) / CATEGORIES.length
  ) : 0;

  const gradeInfo = getGrade(overallScore);

  return (
    <div style={{ fontFamily: FONT, color: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>📝</span>
        <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.purple}, ${CI.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Writing Quality Analyzer
        </h2>
      </div>

      {/* Input */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>วางงานเขียนของนักศึกษา</label>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{text.length} ตัวอักษร</span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="วางเนื้อหางานเขียน เช่น รายงาน บทความ เรียงความ ที่นี่..."
          rows={10}
          style={{
            width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, color: '#fff', fontSize: 16, fontFamily: FONT, outline: 'none', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            marginTop: 14, width: '100%', padding: '14px 24px',
            background: `linear-gradient(135deg, ${CI.purple}, ${CI.magenta})`,
            color: '#fff', border: 'none', borderRadius: 12, fontFamily: FONT, fontSize: 17,
            cursor: loading ? 'wait' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '⏳ กำลังวิเคราะห์...' : '🔍 วิเคราะห์คุณภาพงานเขียน'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div>
          {/* Overall Score + Radar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Score Card */}
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24,
              border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
            }}>
              <h3 style={{ fontSize: 16, margin: '0 0 16px 0', color: 'rgba(255,255,255,0.6)' }}>คะแนนรวม</h3>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: `conic-gradient(${gradeInfo.color} ${overallScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%', background: CI.dark,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700 }}>{overallScore}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/100</span>
                </div>
              </div>
              <div style={{
                display: 'inline-block', padding: '8px 24px', borderRadius: 10,
                background: `${gradeInfo.color}22`, border: `1px solid ${gradeInfo.color}44`,
                fontSize: 20, fontWeight: 700, color: gradeInfo.color,
              }}>
                เกรดแนะนำ: {gradeInfo.grade}
              </div>
            </div>

            {/* Radar Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ fontSize: 16, margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>Radar Chart</h3>
              <RadarChart scores={result.scores || {}} />
            </div>
          </div>

          {/* Category Scores */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            {CATEGORIES.map(cat => {
              const score = result.scores?.[cat.key] || 0;
              const feedback = result.feedback?.[cat.key] || '';
              return (
                <div key={cat.key} style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 18,
                  border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${cat.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{cat.icon} {cat.label}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: cat.color }}>{score}/100</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: cat.color, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                  {feedback && (
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>{feedback}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Feedback */}
          {result.overallFeedback && (
            <div style={{
              background: `linear-gradient(135deg, ${CI.purple}11, ${CI.magenta}11)`,
              borderRadius: 16, padding: 24, border: `1px solid ${CI.purple}33`,
            }}>
              <h3 style={{ fontSize: 17, margin: '0 0 12px 0', color: CI.gold }}>💬 ความเห็นโดยรวม</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
                {result.overallFeedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

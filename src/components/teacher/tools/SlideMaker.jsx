'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

export default function SlideMaker() {
  const [topic, setTopic] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [numSlides, setNumSlides] = useState(8);
  const [style, setStyle] = useState('academic');
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedNote, setExpandedNote] = useState(null);
  const [editingSlide, setEditingSlide] = useState(null);

  const generateSlides = async () => {
    if (!topic.trim()) return toast.error('กรุณาระบุหัวข้อ');
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'slide-maker',
          payload: { topic, keyPoints, numSlides, style }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Parse the AI response
      let parsed;
      const raw = data.result || '';
      try {
        // Try to extract JSON from the response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        // If parsing fails, create slides from text
        toast.error('ไม่สามารถ parse ข้อมูล กรุณาลองใหม่');
        setLoading(false);
        return;
      }

      setSlides(parsed.slides || []);
      toast.success(`สร้าง ${parsed.slides?.length || 0} สไลด์สำเร็จ! 🎉`);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSlide = (idx, field, value) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const updateBullet = (slideIdx, bulletIdx, value) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      const bullets = [...(s.bullets || [])];
      bullets[bulletIdx] = value;
      return { ...s, bullets };
    }));
  };

  const addBullet = (slideIdx) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      return { ...s, bullets: [...(s.bullets || []), ''] };
    }));
  };

  const removeBullet = (slideIdx, bulletIdx) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      return { ...s, bullets: (s.bullets || []).filter((_, bi) => bi !== bulletIdx) };
    }));
  };

  const moveSlide = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const arr = [...slides];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSlides(arr);
  };

  const removeSlide = (idx) => {
    setSlides(prev => prev.filter((_, i) => i !== idx));
  };

  const copyAll = () => {
    const text = slides.map((s, i) => (
      `--- Slide ${i + 1}: ${s.title} ---\n${(s.bullets || []).map(b => `• ${b}`).join('\n')}\n\n[Speaker Notes]\n${s.speakerNotes || ''}`
    )).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('📋 คัดลอกทั้งหมดแล้ว');
  };

  const getSlidesText = () => slides.map((s, i) =>
    `=== Slide ${i + 1}: ${s.title} ===\n${(s.bullets || []).map(b => `• ${b}`).join('\n')}\n\nSpeaker Notes:\n${s.speakerNotes || ''}`
  ).join('\n\n' + '='.repeat(50) + '\n\n');

  const downloadText = () => {
    const text = getSlidesText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slides-${topic.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('💾 ดาวน์โหลด TXT สำเร็จ');
  };

  const downloadPDF = async () => {
    const { buildTextHTML, downloadHTMLAsPDF } = await import('@/lib/teacher/exportUtils');
    const html = buildTextHTML(`สไลด์: ${topic}`, getSlidesText());
    await downloadHTMLAsPDF(html, `slides-${topic.replace(/\s+/g, '-')}`);
    toast.success('💾 ดาวน์โหลด PDF สำเร็จ');
  };

  const STYLES = [
    { id: 'academic', label: '🎓 Academic', desc: 'เหมาะสำหรับการสอน' },
    { id: 'business', label: '💼 Business', desc: 'สำหรับนำเสนอธุรกิจ' },
    { id: 'creative', label: '🎨 Creative', desc: 'สไตล์สร้างสรรค์' },
    { id: 'minimal', label: '✨ Minimal', desc: 'เรียบง่าย กระชับ' },
  ];

  const SLIDE_COLORS = [
    `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
    `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
    `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
    `linear-gradient(135deg, #f59e0b, #ef4444)`,
    `linear-gradient(135deg, #22c55e, ${CI.cyan})`,
    `linear-gradient(135deg, ${CI.purple}, #ec4899)`,
  ];

  return (
    <div style={{ fontFamily: FONT, maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
        }}>🎞️</div>
        <div>
          <h2 style={{
            fontSize: '24px', margin: 0, fontWeight: 800, color: '#1e293b',
          }}>AI Slide Maker</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>สร้างเนื้อหาสไลด์ด้วย AI พร้อม Speaker Notes</p>
        </div>
      </div>

      {/* Input Section */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '15px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>หัวข้อการนำเสนอ *</label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="เช่น Digital Marketing สำหรับ SME ไทย"
            style={{
              width: '100%', padding: '14px 18px', background: '#f8fafc',
              border: '2px solid #e2e8f0', borderRadius: '14px', color: '#1e293b',
              fontSize: '16px', fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = CI.cyan}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '15px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>ประเด็นสำคัญ (บรรทัดละประเด็น)</label>
          <textarea
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            placeholder={"เช่น\nความสำคัญของ Digital Marketing\nกลยุทธ์ SEO & SEM\nSocial Media Marketing\nการวัดผล ROI"}
            rows={4}
            style={{
              width: '100%', padding: '14px 18px', background: '#f8fafc',
              border: '2px solid #e2e8f0', borderRadius: '14px', color: '#1e293b',
              fontSize: '16px', fontFamily: FONT, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              transition: 'border 0.2s', lineHeight: 1.7,
            }}
            onFocus={e => e.target.style.borderColor = CI.cyan}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ fontSize: '15px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>จำนวนสไลด์</label>
            <select
              value={numSlides}
              onChange={e => setNumSlides(Number(e.target.value))}
              style={{
                width: '100%', padding: '12px 16px', background: '#f8fafc',
                border: '2px solid #e2e8f0', borderRadius: '14px', color: '#1e293b',
                fontSize: '16px', fontFamily: FONT, outline: 'none',
              }}
            >
              {[5, 6, 7, 8, 10, 12, 15].map(n => (
                <option key={n} value={n}>{n} สไลด์</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: '300px' }}>
            <label style={{ fontSize: '15px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>สไตล์</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                  border: `2px solid ${style === s.id ? CI.cyan : '#e2e8f0'}`,
                  background: style === s.id ? `${CI.cyan}08` : '#fff',
                  color: style === s.id ? CI.cyan : '#64748b',
                  cursor: 'pointer', fontFamily: FONT, textAlign: 'center',
                  transition: 'all 0.15s',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generateSlides}
          disabled={loading}
          style={{
            width: '100%', padding: '16px 24px', border: 'none', borderRadius: '14px',
            background: loading ? '#e2e8f0' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
            color: loading ? '#94a3b8' : '#fff',
            fontSize: '18px', fontWeight: 800, fontFamily: FONT,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: loading ? 'none' : `0 4px 16px ${CI.cyan}30`,
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ กำลังสร้างสไลด์...' : '✨ สร้างสไลด์ด้วย AI'}
        </button>
      </div>

      {/* Slides Output */}
      {slides.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 800, color: '#1e293b' }}>
              📊 ผลลัพธ์: {slides.length} สไลด์
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={copyAll} style={{
                padding: '10px 20px', borderRadius: '10px', border: `2px solid ${CI.cyan}`,
                background: '#fff', color: CI.cyan, fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>📋 คัดลอกทั้งหมด</button>
              <DownloadDropdown
                options={[
                  { label: 'Text', icon: '📝', ext: 'TXT', color: '#64748b', onClick: downloadText },
                  { label: 'PDF', icon: '📄', ext: 'PDF', color: '#dc2626', onClick: downloadPDF },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {slides.map((slide, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Slide Header */}
                <div style={{
                  background: SLIDE_COLORS[idx % SLIDE_COLORS.length],
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    width: '40px', height: '40px',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 800, flexShrink: 0,
                  }}>{idx + 1}</span>

                  {editingSlide === idx ? (
                    <input value={slide.title} onChange={e => updateSlide(idx, 'title', e.target.value)}
                      onBlur={() => setEditingSlide(null)} autoFocus
                      style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '17px', fontWeight: 700, fontFamily: FONT, outline: 'none' }} />
                  ) : (
                    <h4 onClick={() => setEditingSlide(idx)} style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff', cursor: 'pointer', flex: 1 }}>
                      {slide.title}
                    </h4>
                  )}

                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => moveSlide(idx, -1)} disabled={idx === 0}
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', borderRadius: '6px', padding: '4px 8px', fontSize: '14px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1}
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: idx === slides.length - 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', padding: '4px 8px', fontSize: '14px', opacity: idx === slides.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => removeSlide(idx)}
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '6px', padding: '4px 8px', fontSize: '14px' }}>✕</button>
                  </div>
                </div>

                {/* Slide Content */}
                <div style={{ padding: '20px 24px' }}>
                  {(slide.bullets || []).length > 0 && (
                    <ul style={{ margin: '0 0 14px 0', paddingLeft: '20px', listStyle: 'none' }}>
                      {slide.bullets.map((b, bi) => (
                        <li key={bi} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ color: CI.cyan, fontWeight: 800, fontSize: '16px', lineHeight: '24px', flexShrink: 0 }}>•</span>
                          <input value={b} onChange={e => updateBullet(idx, bi, e.target.value)}
                            style={{
                              flex: 1, fontSize: '15px', lineHeight: 1.6, color: '#374151', border: 'none',
                              background: 'transparent', fontFamily: FONT, outline: 'none', padding: '2px 0',
                              borderBottom: '1px solid transparent',
                            }}
                            onFocus={e => e.target.style.borderBottomColor = CI.cyan + '40'}
                            onBlur={e => e.target.style.borderBottomColor = 'transparent'} />
                          <button onClick={() => removeBullet(idx, bi)}
                            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px', flexShrink: 0, padding: '2px' }}>✕</button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button onClick={() => addBullet(idx)} style={{
                    fontSize: '13px', padding: '4px 12px', borderRadius: '6px',
                    border: `1px dashed ${CI.cyan}40`, background: 'none', color: CI.cyan,
                    cursor: 'pointer', fontFamily: FONT, fontWeight: 600, marginBottom: '12px',
                  }}>+ เพิ่ม bullet</button>

                  {slide.speakerNotes && (
                    <div>
                      <button
                        onClick={() => setExpandedNote(expandedNote === idx ? null : idx)}
                        style={{
                          background: `${CI.gold}10`, border: `1px solid ${CI.gold}30`,
                          borderRadius: '10px', padding: '10px 16px', color: '#92400e',
                          fontSize: '14px', cursor: 'pointer', fontFamily: FONT,
                          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                        }}
                      >
                        🎤 Speaker Notes {expandedNote === idx ? '▲' : '▼'}
                      </button>
                      {expandedNote === idx && (
                        <textarea
                          value={slide.speakerNotes}
                          onChange={e => updateSlide(idx, 'speakerNotes', e.target.value)}
                          rows={3}
                          style={{
                            marginTop: '10px', padding: '14px', width: '100%', boxSizing: 'border-box',
                            background: `${CI.gold}06`, borderRadius: '12px', fontSize: '15px',
                            lineHeight: 1.7, color: '#475569', borderLeft: `3px solid ${CI.gold}`,
                            border: `1px solid ${CI.gold}20`, borderLeftWidth: '3px',
                            fontFamily: FONT, outline: 'none', resize: 'vertical',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

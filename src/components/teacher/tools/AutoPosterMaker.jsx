'use client';
import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const SIZE_PRESETS = [
  { id: 'ig-post', label: 'Instagram Post', w: 1080, h: 1080 },
  { id: 'fb-post', label: 'Facebook Post', w: 1200, h: 630 },
  { id: 'ig-story', label: 'IG/TikTok Story', w: 1080, h: 1920 },
  { id: 'fb-cover', label: 'Facebook Cover', w: 820, h: 312 },
  { id: 'yt-thumb', label: 'YouTube Thumbnail', w: 1280, h: 720 },
  { id: 'a4', label: 'A4 Portrait', w: 2480, h: 3508 },
];

const STYLES = [
  { id: 'modern', label: 'Modern', icon: '🎨' },
  { id: 'minimal', label: 'Minimal', icon: '⬜' },
  { id: 'colorful', label: 'Colorful', icon: '🌈' },
  { id: 'professional', label: 'Professional', icon: '💼' },
  { id: 'playful', label: 'Playful', icon: '🎉' },
  { id: 'retro', label: 'Retro', icon: '📻' },
];

const COLOR_SCHEMES = [
  { id: 'ci', label: 'Cyan & Magenta (CI)', colors: [CI.cyan, CI.magenta, CI.dark] },
  { id: 'warm', label: 'Warm', colors: ['#ff6b35', '#f7c948', '#fef3c7'] },
  { id: 'cool', label: 'Cool', colors: ['#0ea5e9', '#6366f1', '#e0f2fe'] },
  { id: 'pastel', label: 'Pastel', colors: ['#fbb6ce', '#b794f4', '#c6f6d5'] },
  { id: 'dark', label: 'Dark', colors: ['#1e293b', '#334155', '#f8fafc'] },
  { id: 'gold-purple', label: 'Gold & Purple', colors: [CI.gold, CI.purple, '#1a0a3e'] },
];

/* ── Poster style generators ── */
const getStyleBackground = (styleId, colors) => {
  const [c1, c2, c3] = colors;
  switch (styleId) {
    case 'modern':
      return `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3 || c1} 100%)`;
    case 'minimal':
      return '#ffffff';
    case 'colorful':
      return `linear-gradient(45deg, ${c1} 0%, ${c2} 33%, ${c3 || c1} 66%, ${c1} 100%)`;
    case 'professional':
      return `linear-gradient(180deg, ${c3 || '#0f172a'} 0%, ${c3 || '#0f172a'} 60%, ${c1} 100%)`;
    case 'playful':
      return `linear-gradient(160deg, ${c1}44 0%, ${c2}44 50%, ${c3 || c1}44 100%)`;
    case 'retro':
      return `linear-gradient(180deg, #f5e6d3 0%, #e8d5b7 50%, #d4a574 100%)`;
    default:
      return `linear-gradient(135deg, ${c1}, ${c2})`;
  }
};

const getTextColor = (styleId, colors) => {
  switch (styleId) {
    case 'minimal': return '#1e293b';
    case 'professional': return CI.gold;
    case 'retro': return '#5c3d2e';
    case 'playful': return '#1e293b';
    case 'dark': return '#f8fafc';
    default: return '#ffffff';
  }
};

const getSubTextColor = (styleId, colors) => {
  switch (styleId) {
    case 'minimal': return '#475569';
    case 'professional': return '#e2e8f0';
    case 'retro': return '#7c5a42';
    case 'playful': return '#334155';
    default: return '#ffffffcc';
  }
};

const getAccentColor = (styleId, colors) => {
  const [c1, c2] = colors;
  switch (styleId) {
    case 'minimal': return c1;
    case 'professional': return CI.gold;
    case 'retro': return '#c4704b';
    case 'playful': return c2;
    default: return '#ffffff33';
  }
};

const getDecorations = (styleId, colors, w, h) => {
  const accent = getAccentColor(styleId, colors);
  switch (styleId) {
    case 'modern':
      return (
        <>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: '#ffffff15', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '30%', height: '30%', borderRadius: '50%', background: '#ffffff10', pointerEvents: 'none' }} />
        </>
      );
    case 'minimal':
      return (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${colors[1]}, ${colors[0]})` }} />
        </>
      );
    case 'colorful':
      return (
        <>
          <div style={{ position: 'absolute', top: '5%', left: '5%', width: '20%', height: '20%', borderRadius: '50%', background: '#ffffff22', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: '15%', height: '15%', borderRadius: '50%', background: '#ffffff18', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', right: '3%', width: '8%', height: '8%', borderRadius: '50%', background: '#ffffff25', pointerEvents: 'none' }} />
        </>
      );
    case 'professional':
      return (
        <>
          <div style={{ position: 'absolute', bottom: '40%', left: 0, right: 0, height: '1px', background: `${CI.gold}44` }} />
          <div style={{ position: 'absolute', top: '8%', left: '5%', width: '60px', height: '3px', background: CI.gold }} />
        </>
      );
    case 'playful':
      return (
        <>
          <div style={{ position: 'absolute', top: '5%', right: '8%', fontSize: '2em', pointerEvents: 'none', opacity: 0.3 }}>✨</div>
          <div style={{ position: 'absolute', bottom: '15%', left: '5%', fontSize: '1.8em', pointerEvents: 'none', opacity: 0.3 }}>🎈</div>
          <div style={{ position: 'absolute', top: '50%', right: '5%', fontSize: '1.5em', pointerEvents: 'none', opacity: 0.25 }}>⭐</div>
          <div style={{ position: 'absolute', top: '20%', left: '10%', width: '12%', height: '12%', borderRadius: '50%', background: `${colors[0]}33`, pointerEvents: 'none' }} />
        </>
      );
    case 'retro':
      return (
        <>
          <div style={{ position: 'absolute', inset: '3%', border: '2px solid #c4704b44', borderRadius: '4px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '2px', background: '#c4704b66' }} />
        </>
      );
    default:
      return null;
  }
};

/* ── input/label styles ── */
const lbl = { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#334155' };
const inp = {
  width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
  fontSize: '15px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

export default function AutoPosterMaker() {
  const posterRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    date: '',
    time: '',
    location: '',
    speakers: '',
    cta: '',
  });

  const [platform, setPlatform] = useState('ig-post');
  const [designStyle, setDesignStyle] = useState('modern');
  const [colorScheme, setColorScheme] = useState('ci');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [exporting, setExporting] = useState(false);

  const selectedSize = SIZE_PRESETS.find(s => s.id === platform);
  const selectedColors = COLOR_SCHEMES.find(c => c.id === colorScheme)?.colors || COLOR_SCHEMES[0].colors;

  const update = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  /* ── Generate poster content via AI ── */
  const generatePoster = useCallback(async () => {
    if (!form.title) {
      toast.error('กรุณากรอกหัวข้อโปสเตอร์');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'poster_content',
          payload: {
            title: form.title,
            subtitle: form.subtitle,
            description: form.description,
            date: form.date,
            time: form.time,
            location: form.location,
            speakers: form.speakers,
            cta: form.cta,
            style: designStyle,
            platform: platform,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate content');

      // Try to parse structured content from AI result
      let content;
      try {
        // AI might return JSON or structured text
        const raw = data.result || data.content || '';
        if (typeof raw === 'object') {
          content = raw;
        } else {
          // Try JSON parse first
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            content = JSON.parse(jsonMatch[0]);
          } else {
            content = {
              headline: form.title,
              subtitle: form.subtitle || raw.slice(0, 80),
              body: form.description || raw.slice(0, 200),
              cta: form.cta || 'สมัครเลย!',
              details: { date: form.date, time: form.time, location: form.location },
              speakers: form.speakers ? form.speakers.split(',').map(s => s.trim()) : [],
            };
          }
        }
      } catch {
        content = {
          headline: form.title,
          subtitle: form.subtitle || '',
          body: form.description || '',
          cta: form.cta || 'สมัครเลย!',
          details: { date: form.date, time: form.time, location: form.location },
          speakers: form.speakers ? form.speakers.split(',').map(s => s.trim()) : [],
        };
      }

      setGeneratedContent(content);
      toast.success('สร้างโปสเตอร์สำเร็จ!');
    } catch (e) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
      // Fallback: generate poster from form data directly
      setGeneratedContent({
        headline: form.title,
        subtitle: form.subtitle || '',
        body: form.description || '',
        cta: form.cta || 'ลงทะเบียนเลย!',
        details: { date: form.date, time: form.time, location: form.location },
        speakers: form.speakers ? form.speakers.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      toast('ใช้ข้อมูลจากฟอร์มแทน', { icon: 'ℹ️' });
    } finally {
      setLoading(false);
    }
  }, [form, designStyle, platform]);

  /* ── Export as PNG ── */
  const exportPNG = useCallback(async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: posterRef.current.scrollWidth,
        height: posterRef.current.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `poster-${platform}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('ดาวน์โหลดสำเร็จ!');
    } catch (e) {
      toast.error('ไม่สามารถ Export ได้: ' + e.message);
    } finally {
      setExporting(false);
    }
  }, [platform]);

  /* ── Preview poster ── */
  const previewMaxWidth = 480;
  const aspect = selectedSize.w / selectedSize.h;
  const previewW = Math.min(previewMaxWidth, 480);
  const previewH = previewW / aspect;
  const isPortrait = selectedSize.h > selectedSize.w;

  const textColor = getTextColor(designStyle, selectedColors);
  const subColor = getSubTextColor(designStyle, selectedColors);
  const accent = getAccentColor(designStyle, selectedColors);

  const fontScale = isPortrait ? 1 : (aspect > 2 ? 0.65 : 0.85);

  const renderPosterPreview = () => {
    const c = generatedContent;
    if (!c) return null;

    const hasSpeakers = c.speakers && c.speakers.length > 0;
    const hasDetails = c.details && (c.details.date || c.details.time || c.details.location);

    return (
      <div
        ref={posterRef}
        style={{
          width: `${previewW}px`,
          height: `${previewH}px`,
          background: getStyleBackground(designStyle, selectedColors),
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: `${8 * fontScale}% ${6 * fontScale}%`,
          boxSizing: 'border-box',
          fontFamily: designStyle === 'retro'
            ? "'Georgia', 'Sarabun', serif"
            : FONT,
          textAlign: 'center',
        }}
      >
        {/* Decorations */}
        {getDecorations(designStyle, selectedColors, previewW, previewH)}

        {/* Content container */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${6 * fontScale}px` }}>

          {/* Tag / Category */}
          {c.subtitle && (
            <div style={{
              fontSize: `${11 * fontScale}px`,
              color: designStyle === 'professional' ? CI.gold : (designStyle === 'minimal' ? selectedColors[0] : '#ffffffbb'),
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontWeight: 600,
              marginBottom: `${4 * fontScale}px`,
              padding: `${2 * fontScale}px ${12 * fontScale}px`,
              borderRadius: '20px',
              background: designStyle === 'minimal' ? `${selectedColors[0]}15` : '#ffffff15',
            }}>
              {c.subtitle}
            </div>
          )}

          {/* Headline */}
          <h1 style={{
            margin: 0,
            fontSize: `${Math.min(28, 24 * fontScale)}px`,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.3,
            maxWidth: '90%',
            textShadow: designStyle === 'minimal' || designStyle === 'playful' ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {c.headline}
          </h1>

          {/* Body text */}
          {c.body && (
            <p style={{
              margin: `${4 * fontScale}px 0`,
              fontSize: `${12 * fontScale}px`,
              color: subColor,
              lineHeight: 1.5,
              maxWidth: '85%',
              display: '-webkit-box',
              WebkitLineClamp: isPortrait ? 4 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {c.body}
            </p>
          )}

          {/* Divider */}
          {(hasDetails || hasSpeakers) && (
            <div style={{
              width: '40px',
              height: '2px',
              background: accent,
              margin: `${4 * fontScale}px 0`,
              borderRadius: '1px',
            }} />
          )}

          {/* Event details */}
          {hasDetails && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: `${8 * fontScale}px ${16 * fontScale}px`,
              fontSize: `${11 * fontScale}px`,
              color: subColor,
            }}>
              {c.details.date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📅 {c.details.date}
                </span>
              )}
              {c.details.time && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🕐 {c.details.time}
                </span>
              )}
              {c.details.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📍 {c.details.location}
                </span>
              )}
            </div>
          )}

          {/* Speakers */}
          {hasSpeakers && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: `${6 * fontScale}px`,
              marginTop: `${4 * fontScale}px`,
            }}>
              {c.speakers.map((speaker, i) => (
                <span key={i} style={{
                  fontSize: `${10 * fontScale}px`,
                  color: designStyle === 'professional' ? '#e2e8f0' : textColor,
                  background: designStyle === 'minimal' ? `${selectedColors[0]}10` : '#ffffff15',
                  padding: `${3 * fontScale}px ${10 * fontScale}px`,
                  borderRadius: '12px',
                  fontWeight: 500,
                }}>
                  🎤 {speaker}
                </span>
              ))}
            </div>
          )}

          {/* CTA Button */}
          {c.cta && (
            <div style={{
              marginTop: `${10 * fontScale}px`,
              padding: `${7 * fontScale}px ${24 * fontScale}px`,
              borderRadius: '24px',
              background: designStyle === 'minimal'
                ? `linear-gradient(135deg, ${selectedColors[0]}, ${selectedColors[1]})`
                : designStyle === 'professional'
                  ? CI.gold
                  : designStyle === 'retro'
                    ? '#c4704b'
                    : '#ffffff',
              color: designStyle === 'minimal' || designStyle === 'professional' || designStyle === 'retro' ? '#fff' : selectedColors[0],
              fontSize: `${12 * fontScale}px`,
              fontWeight: 700,
              letterSpacing: '0.5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              {c.cta}
            </div>
          )}

          {/* SPU BUS Branding */}
          <div style={{
            marginTop: `${12 * fontScale}px`,
            fontSize: `${9 * fontScale}px`,
            color: designStyle === 'minimal' ? '#94a3b8' : '#ffffff66',
            fontWeight: 500,
            letterSpacing: '1px',
          }}>
            SPU BUS
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#1e293b' }}>
          🎨 AI Auto Poster Maker
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: '15px', color: '#64748b' }}>
          สร้างโปสเตอร์สวยๆ ด้วย AI — กรอกรายละเอียด เลือกสไตล์ แล้วกดสร้าง!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: generatedContent ? '400px 1fr' : '1fr', gap: '24px' }}>
        {/* ──────── LEFT: Form Panel ──────── */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', alignSelf: 'start' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
            📝 รายละเอียดโปสเตอร์
          </h3>

          {/* Title */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>หัวข้อโปสเตอร์ *</label>
            <input
              value={form.title}
              onChange={update('title')}
              placeholder="เช่น สัมมนาการตลาดดิจิทัล 2026"
              style={inp}
            />
          </div>

          {/* Subtitle */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>หัวข้อรอง / Tagline</label>
            <input
              value={form.subtitle}
              onChange={update('subtitle')}
              placeholder="เช่น เรียนรู้เทคนิคจากผู้เชี่ยวชาญตัวจริง"
              style={inp}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>รายละเอียด</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับงาน/กิจกรรม..."
              rows={3}
              style={{ ...inp, resize: 'vertical', minHeight: '70px' }}
            />
          </div>

          {/* Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={lbl}>📅 วันที่</label>
              <input value={form.date} onChange={update('date')} placeholder="25 เม.ย. 2026" style={inp} />
            </div>
            <div>
              <label style={lbl}>🕐 เวลา</label>
              <input value={form.time} onChange={update('time')} placeholder="09:00 - 16:00 น." style={inp} />
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>📍 สถานที่</label>
            <input value={form.location} onChange={update('location')} placeholder="ห้อง Auditorium อาคาร 11" style={inp} />
          </div>

          {/* Speakers */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>🎤 วิทยากร (คั่นด้วย ,)</label>
            <input value={form.speakers} onChange={update('speakers')} placeholder="ดร.สมชาย, คุณวิภา, Prof. John" style={inp} />
          </div>

          {/* CTA */}
          <div style={{ marginBottom: '18px' }}>
            <label style={lbl}>🔗 Call to Action</label>
            <input value={form.cta} onChange={update('cta')} placeholder="ลงทะเบียนเลย!" style={inp} />
          </div>

          {/* ── Platform Size ── */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>📐 ขนาดโปสเตอร์</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {SIZE_PRESETS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setPlatform(s.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: platform === s.id ? `2px solid ${CI.cyan}` : '1.5px solid #e2e8f0',
                    background: platform === s.id ? `${CI.cyan}10` : '#fff',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: platform === s.id ? 700 : 500,
                    color: platform === s.id ? CI.cyan : '#64748b',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>{s.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>{s.w}x{s.h}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Design Style ── */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>🎨 สไตล์</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setDesignStyle(s.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: designStyle === s.id ? `2px solid ${CI.magenta}` : '1.5px solid #e2e8f0',
                    background: designStyle === s.id ? `${CI.magenta}10` : '#fff',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: designStyle === s.id ? 700 : 500,
                    color: designStyle === s.id ? CI.magenta : '#64748b',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Color Scheme ── */}
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>🎯 โทนสี</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {COLOR_SCHEMES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColorScheme(c.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: colorScheme === c.id ? `2px solid ${CI.purple}` : '1.5px solid #e2e8f0',
                    background: colorScheme === c.id ? `${CI.purple}10` : '#fff',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: colorScheme === c.id ? 700 : 500,
                    color: colorScheme === c.id ? CI.purple : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {c.colors.map((clr, i) => (
                      <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: clr, border: '1px solid #e2e8f055' }} />
                    ))}
                  </div>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePoster}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '17px',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(0,180,230,0.3)',
            }}
          >
            {loading ? '⏳ กำลังสร้างโปสเตอร์...' : '✨ สร้างโปสเตอร์'}
          </button>
        </div>

        {/* ──────── RIGHT: Preview Panel ──────── */}
        {generatedContent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Preview card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
                  👁️ ตัวอย่างโปสเตอร์
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {selectedSize.label} ({selectedSize.w}x{selectedSize.h})
                </span>
              </div>

              {/* Poster Canvas */}
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                {renderPosterPreview()}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', width: '100%' }}>
                <button
                  onClick={exportPNG}
                  disabled={exporting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                    color: '#fff',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    opacity: exporting ? 0.6 : 1,
                  }}
                >
                  {exporting ? '⏳ กำลัง Export...' : '📥 ดาวน์โหลด PNG'}
                </button>
                <button
                  onClick={generatePoster}
                  disabled={loading}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: `1.5px solid ${CI.magenta}`,
                    background: '#fff',
                    color: CI.magenta,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '15px',
                    fontFamily: 'inherit',
                  }}
                >
                  🔄 สร้างใหม่
                </button>
              </div>
            </div>

            {/* Generated Content Details */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
            }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: '#1e293b', fontWeight: 700 }}>
                📋 เนื้อหาที่สร้าง
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#475569' }}>
                {generatedContent.headline && (
                  <div>
                    <strong style={{ color: '#1e293b' }}>Headline:</strong> {generatedContent.headline}
                  </div>
                )}
                {generatedContent.subtitle && (
                  <div>
                    <strong style={{ color: '#1e293b' }}>Subtitle:</strong> {generatedContent.subtitle}
                  </div>
                )}
                {generatedContent.body && (
                  <div>
                    <strong style={{ color: '#1e293b' }}>Body:</strong> {generatedContent.body}
                  </div>
                )}
                {generatedContent.cta && (
                  <div>
                    <strong style={{ color: '#1e293b' }}>CTA:</strong> {generatedContent.cta}
                  </div>
                )}
              </div>

              {/* Copy content button */}
              <button
                onClick={() => {
                  const text = [
                    generatedContent.headline,
                    generatedContent.subtitle,
                    generatedContent.body,
                    generatedContent.details?.date && `📅 ${generatedContent.details.date}`,
                    generatedContent.details?.time && `🕐 ${generatedContent.details.time}`,
                    generatedContent.details?.location && `📍 ${generatedContent.details.location}`,
                    generatedContent.speakers?.length && `🎤 ${generatedContent.speakers.join(', ')}`,
                    generatedContent.cta,
                  ].filter(Boolean).join('\n');
                  navigator.clipboard.writeText(text);
                  toast.success('คัดลอกข้อความแล้ว!');
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  background: '#fff',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              >
                📋 คัดลอกข้อความ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const HEADLINES = [
  'ประชาสัมพันธ์กิจกรรม โครงการ หรือเวิร์กชอปของคณะ',
  'โปรโมทหลักสูตรและเปิดรับสมัครนักศึกษาใหม่',
  'แชร์ความสำเร็จและประสบการณ์ของศิษย์เก่า/นักศึกษาปัจจุบัน',
  'สรุปกิจกรรม ศึกษาดูงาน หรือ Business Trip',
  'แนะนำจุดเด่นและบรรยากาศการเรียนการสอนของคณะ',
  'ให้ความรู้ ทริคทางธุรกิจ หรือเทรนด์ใหม่ๆ ที่น่าสนใจ',
  'เชิญชวนร่วมงาน Open House และแนะแนวการศึกษา',
  'ประกาศข่าวสารและความร่วมมือกับองค์กรธุรกิจชั้นนำ',
  'แนะนำวิทยากรพิเศษ / Guest Speaker',
  'รับสมัคร Workshop / อบรมพิเศษ',
];

const CATEGORIES = [
  'คณะบริหารธุรกิจ (ภาพรวม)',
  'สาขาการบริหารและการจัดการสมัยใหม่',
  'สาขาการตลาดดิจิทัล',
  'สาขาธุรกิจระหว่างประเทศ',
  'สาขาบริหารธุรกิจ',
  'ศูนย์บ่มเพาะธุรกิจ',
  'กิจการนักศึกษา',
];

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'line', name: 'LINE', icon: '💚' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'lemon8', name: 'Lemon8', icon: '🍋' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
];

const TONES = [
  { id: 'professional', name: 'ทางการ น่าเชื่อถือ', icon: '💼' },
  { id: 'fun', name: 'สนุกสนาน เป็นกันเอง', icon: '🎉' },
  { id: 'concise', name: 'สั้น กระชับ ตรงประเด็น', icon: '⚡' },
  { id: 'emoji', name: 'เน้นอิโมจิ สีสันสะดุดตา', icon: '🎨' },
];

export default function MarketingContentWriter() {
  const [form, setForm] = useState({
    title: '',
    category: '',
    platform: 'facebook',
    tone: 'professional',
    eventName: '',
    speaker: '',
    dateInfo: '',
    location: '',
    keyPoints: '',
  });
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const extractText = async () => {
    if (!preview) { toast.error('กรุณาอัปโหลดรูปภาพก่อน'); return; }
    setExtracting(true);
    const tid = toast.loading('AI กำลังอ่านข้อความจากรูปภาพ...');
    try {
      const mediaType = preview.split(';')[0].split(':')[1] || 'image/jpeg';
      const imageBase64 = preview.split(',')[1];
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'image_to_content', payload: { imageBase64, mediaType } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR failed');
      setForm(v => ({ ...v, keyPoints: data.result || data.text || '' }));
      toast.success('AI อ่านข้อมูลสำเร็จ!', { id: tid });
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + (e.message || 'กรุณาลองใหม่'), { id: tid });
    } finally {
      setExtracting(false);
    }
  };

  const generate = async () => {
    if (!form.title) { toast.error('กรุณาเลือกหัวข้อโพสต์'); return; }
    if (!form.category) { toast.error('กรุณาเลือกหมวดหมู่/สาขา'); return; }
    setLoading(true);
    const tid = toast.loading('Gemini กำลังเขียนเนื้อหา...');
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'marketing_content',
          payload: {
            title: form.title,
            category: form.category,
            platform: form.platform,
            tone: form.tone,
            eventName: form.eventName,
            speaker: form.speaker,
            dateInfo: form.dateInfo,
            location: form.location,
            keyPoints: form.keyPoints,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data.result || data.content || '');
      toast.success('สร้างคอนเทนต์สำเร็จ!', { id: tid });
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + (e.message || 'กรุณาลองใหม่'), { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success('คัดลอกแล้ว!');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '480px 1fr' : '1fr', gap: '24px' }}>
        {/* ---- Form Card ---- */}
        <div style={card}>
          <h3 style={{ margin: '0 0 4px', fontSize: '22px', color: '#1e293b', fontWeight: 700 }}>
            ✍️ สร้างคอนเทนต์การตลาด
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#94a3b8' }}>
            ระบุรายละเอียดแล้วให้ AI เขียนแคปชั่นให้ปังทุกแพลตฟอร์ม
          </p>

          {/* Headline */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>เป้าหมายของโพสต์ *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {HEADLINES.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm(v => ({ ...v, title: h }))}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                    border: form.title === h ? `2px solid ${CI.cyan}` : '1px solid #e2e8f0',
                    background: form.title === h ? '#e0f7fa' : '#f8fafc',
                    color: form.title === h ? CI.dark : '#64748b',
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: form.title === h ? 700 : 500,
                    transition: 'all 0.15s',
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
            <input
              value={form.title}
              onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
              placeholder="หรือพิมพ์เป้าหมายเอง..."
              style={inp}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>หมวดหมู่ / สาขา *</label>
            <select
              value={form.category}
              onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
              style={{ ...inp, color: form.category ? '#1e293b' : '#94a3b8' }}
            >
              <option value="" disabled hidden>เลือกหมวดหมู่ / สาขา...</option>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ color: '#1e293b' }}>{c}</option>)}
            </select>
          </div>

          {/* Platform */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>แพลตฟอร์มปลายทาง</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm(v => ({ ...v, platform: p.id }))}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: form.platform === p.id ? `2px solid ${CI.cyan}` : '1px solid #e2e8f0',
                    background: form.platform === p.id ? '#e0f7fa' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    fontWeight: form.platform === p.id ? 700 : 500,
                    color: form.platform === p.id ? CI.dark : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>โทนการเขียน (Tone & Style)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TONES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm(v => ({ ...v, tone: t.id }))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: form.tone === t.id ? `2px solid ${CI.purple}` : '1px solid #e2e8f0',
                    background: form.tone === t.id ? '#ede7f6' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    fontWeight: form.tone === t.id ? 700 : 500,
                    color: form.tone === t.id ? CI.dark : '#64748b',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Event Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>ชื่อกิจกรรม / โครงการ / ซีรีส์</label>
            <input
              value={form.eventName}
              onChange={e => setForm(v => ({ ...v, eventName: e.target.value }))}
              placeholder='เช่น "SPUBUS MANAGEMENT TALK : THE WINNER STORIES"'
              style={inp}
            />
          </div>

          {/* Speaker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>วิทยากร / บุคคลสำคัญ (ถ้ามี)</label>
            <input
              value={form.speaker}
              onChange={e => setForm(v => ({ ...v, speaker: e.target.value }))}
              placeholder='เช่น "คุณศรศักดิ์ อังสุภานิช ประธานสภาอุตฯ จ.สตูล"'
              style={inp}
            />
          </div>

          {/* Date & Location row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>วัน/เวลา (ถ้ามี)</label>
              <input
                value={form.dateInfo}
                onChange={e => setForm(v => ({ ...v, dateInfo: e.target.value }))}
                placeholder='เช่น "4-7 มีนาคม 2569"'
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>สถานที่ (ถ้ามี)</label>
              <input
                value={form.location}
                onChange={e => setForm(v => ({ ...v, location: e.target.value }))}
                placeholder='เช่น "ไต้หวัน" หรือ "ห้อง Auditorium"'
                style={inp}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>อัปโหลดรูปภาพ (ไม่บังคับ)</label>
            {preview ? (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    cursor: 'pointer', fontSize: '16px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={extractText}
                  disabled={extracting}
                  style={{
                    width: '100%', padding: '10px', border: 'none',
                    background: extracting ? '#94a3b8' : `linear-gradient(135deg, ${CI.gold}, #ff9800)`,
                    color: extracting ? '#fff' : CI.dark,
                    cursor: extracting ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: '14px', fontFamily: 'inherit',
                  }}
                >
                  {extracting ? '⏳ กำลังวิเคราะห์...' : '✨ AI ช่วยอ่านข้อความจากรูปภาพ'}
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '28px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 600 }}>คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>AI จะช่วยอ่านข้อความจากรูปภาพให้อัตโนมัติ</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => handleFile(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
          </div>

          {/* Key Points */}
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>
              ประเด็นสำคัญ (Key Points)
              {form.keyPoints && (
                <span style={{
                  marginLeft: '8px', fontSize: '11px', padding: '2px 8px',
                  borderRadius: '6px', background: '#e0f2fe', color: CI.cyan, fontWeight: 700,
                }}>
                  ผลลัพธ์จาก AI
                </span>
              )}
            </label>
            <textarea
              value={form.keyPoints}
              onChange={e => setForm(v => ({ ...v, keyPoints: e.target.value }))}
              placeholder="พิมพ์ไฮไลท์สั้นๆ หรืออัปโหลดรูปภาพแล้วกดปุ่ม AI ช่วยอ่าน..."
              rows={form.keyPoints ? 6 : 3}
              style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '17px', fontFamily: 'inherit',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? '⏳ Gemini กำลังเขียนเนื้อหา...' : '✨ สร้างแคปชั่น (Generate Content)'}
          </button>
        </div>

        {/* ---- Result Card ---- */}
        {result && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: 700 }}>
                📝 คอนเทนต์ที่สร้างแล้ว
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={copyResult} style={actBtn}>📋 คัดลอก</button>
                <button
                  onClick={() => {
                    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'marketing_content.txt';
                    a.click();
                    toast.success('ดาวน์โหลดแล้ว');
                  }}
                  style={{ ...actBtn, background: CI.cyan, color: '#fff', border: 'none' }}
                >
                  ⬇️ Download
                </button>
              </div>
            </div>

            {/* Platform & Tone tags */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={tagStyle}>
                {PLATFORMS.find(p => p.id === form.platform)?.icon} {PLATFORMS.find(p => p.id === form.platform)?.name}
              </span>
              <span style={{ ...tagStyle, background: '#ede7f6', color: CI.purple }}>
                {TONES.find(t => t.id === form.tone)?.icon} {TONES.find(t => t.id === form.tone)?.name}
              </span>
            </div>

            <div style={{
              background: '#f8fafc', borderRadius: '12px', padding: '24px',
              minHeight: '400px', fontSize: '16px', lineHeight: 1.9,
              color: '#1e293b', whiteSpace: 'pre-wrap', fontFamily: FONT, overflowY: 'auto',
            }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Shared inline style objects ---- */
const card = {
  background: '#fff',
  borderRadius: '16px',
  padding: '28px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const lbl = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#64748b',
  display: 'block',
  marginBottom: '6px',
};

const inp = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#1e293b',
  fontFamily: 'inherit',
};

const actBtn = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: '15px',
  fontFamily: 'inherit',
  fontWeight: 600,
};

const tagStyle = {
  fontSize: '13px',
  padding: '4px 12px',
  borderRadius: '8px',
  background: '#e0f7fa',
  color: '#00838f',
  fontWeight: 600,
};

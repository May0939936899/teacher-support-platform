'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STYLES = [
  { value: 'academic', label: 'Academic', desc: 'ภาษาทางวิชาการ' },
  { value: 'casual', label: 'Casual', desc: 'ภาษาทั่วไป สบายๆ' },
  { value: 'formal', label: 'Formal', desc: 'ภาษาทางการ สุภาพ' },
];

export default function AITranslator() {
  const [sourceText, setSourceText] = useState('');
  const [direction, setDirection] = useState('th-en'); // th-en | en-th
  const [style, setStyle] = useState('academic');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleSourceChange = (text) => {
    setSourceText(text);
    setCharCount(text.length);
  };

  const translate = async () => {
    if (!sourceText.trim()) return toast.error('กรุณาใส่ข้อความที่ต้องการแปล');
    setLoading(true);
    setTranslation('');
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'ai-translator',
          payload: { text: sourceText, direction, style }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranslation(data.translation || data.result || '');
      toast.success('แปลสำเร็จ!');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const swapDirection = () => {
    setDirection(d => d === 'th-en' ? 'en-th' : 'th-en');
    if (translation) {
      setSourceText(translation);
      setTranslation('');
      setCharCount(translation.length);
    }
  };

  const copyTranslation = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    toast.success('คัดลอกแล้ว');
  };

  const clearAll = () => {
    setSourceText('');
    setTranslation('');
    setCharCount(0);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONT,
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.7,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: FONT, color: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🌐</span>
        <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Translator
        </h2>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Direction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: direction === 'th-en' ? CI.gold : CI.cyan }}>
            {direction === 'th-en' ? '🇹🇭 ไทย' : '🇬🇧 English'}
          </span>
          <button onClick={swapDirection} style={{
            background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
            border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 16, cursor: 'pointer', fontFamily: FONT,
          }}>⇄</button>
          <span style={{ fontSize: 15, fontWeight: 600, color: direction === 'th-en' ? CI.cyan : CI.gold }}>
            {direction === 'th-en' ? '🇬🇧 English' : '🇹🇭 ไทย'}
          </span>
        </div>

        {/* Style */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STYLES.map(s => (
            <button key={s.value} onClick={() => setStyle(s.value)} title={s.desc} style={{
              padding: '8px 16px',
              background: style === s.value ? `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})` : 'rgba(255,255,255,0.08)',
              border: style === s.value ? 'none' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: FONT,
              fontWeight: style === s.value ? 600 : 400,
            }}>
              {s.label}
            </button>
          ))}
        </div>

        <button onClick={clearAll} style={{
          padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: FONT, marginLeft: 'auto',
        }}>🗑️ ล้าง</button>
      </div>

      {/* Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Source */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 15, color: CI.gold, fontWeight: 600 }}>
              {direction === 'th-en' ? '🇹🇭 ต้นฉบับ (ไทย)' : '🇬🇧 Original (English)'}
            </label>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{charCount} ตัวอักษร</span>
          </div>
          <textarea
            value={sourceText}
            onChange={e => handleSourceChange(e.target.value)}
            placeholder={direction === 'th-en' ? 'พิมพ์หรือวางข้อความภาษาไทยที่นี่...' : 'Type or paste English text here...'}
            rows={10}
            style={inputStyle}
          />
        </div>

        {/* Translation */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 15, color: CI.cyan, fontWeight: 600 }}>
              {direction === 'th-en' ? '🇬🇧 Translation (English)' : '🇹🇭 คำแปล (ไทย)'}
            </label>
            {translation && (
              <button onClick={copyTranslation} style={{
                background: 'rgba(0,180,230,0.15)', border: '1px solid rgba(0,180,230,0.3)', borderRadius: 6,
                padding: '4px 10px', color: CI.cyan, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
              }}>📋 คัดลอก</button>
            )}
          </div>
          <div style={{
            ...inputStyle,
            minHeight: 230,
            background: translation ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
            whiteSpace: 'pre-wrap',
            color: translation ? '#fff' : 'rgba(255,255,255,0.3)',
          }}>
            {loading ? '⏳ กำลังแปล...' : translation || (direction === 'th-en' ? 'Translation will appear here...' : 'คำแปลจะแสดงที่นี่...')}
          </div>
        </div>
      </div>

      {/* Translate Button */}
      <button
        onClick={translate}
        disabled={loading || !sourceText.trim()}
        style={{
          width: '100%',
          padding: '14px 24px',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontFamily: FONT,
          fontSize: 17,
          cursor: loading ? 'wait' : 'pointer',
          fontWeight: 600,
          opacity: loading || !sourceText.trim() ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? '⏳ กำลังแปล...' : '✨ แปลด้วย AI'}
      </button>
    </div>
  );
}

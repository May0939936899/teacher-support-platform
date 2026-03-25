'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const LANGUAGES = [
  // Auto
  { code: 'auto', label: 'ตรวจอัตโนมัติ', flag: '🔍', group: 'auto' },
  // เอเชียตะวันออกเฉียงใต้
  { code: 'th', label: 'ไทย', flag: '🇹🇭', group: 'sea' },
  { code: 'en', label: 'English', flag: '🇬🇧', group: 'sea' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩', group: 'sea' },
  { code: 'ms', label: 'Melayu', flag: '🇲🇾', group: 'sea' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', group: 'sea' },
  { code: 'my', label: 'မြန်မာ', flag: '🇲🇲', group: 'sea' },
  { code: 'km', label: 'ខ្មែរ', flag: '🇰🇭', group: 'sea' },
  { code: 'lo', label: 'ລາວ', flag: '🇱🇦', group: 'sea' },
  { code: 'tl', label: 'Filipino', flag: '🇵🇭', group: 'sea' },
  // เอเชียตะวันออก
  { code: 'zh', label: '中文 (简体)', flag: '🇨🇳', group: 'ea' },
  { code: 'zh-tw', label: '中文 (繁體)', flag: '🇹🇼', group: 'ea' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', group: 'ea' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', group: 'ea' },
  // เอเชียใต้
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', group: 'sa' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩', group: 'sa' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰', group: 'sa' },
  { code: 'ta', label: 'தமிழ்', flag: '🇱🇰', group: 'sa' },
  // ยุโรปตะวันตก
  { code: 'fr', label: 'Français', flag: '🇫🇷', group: 'eu' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', group: 'eu' },
  { code: 'es', label: 'Español', flag: '🇪🇸', group: 'eu' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', group: 'eu' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', group: 'eu' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', group: 'eu' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪', group: 'eu' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴', group: 'eu' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰', group: 'eu' },
  { code: 'fi', label: 'Suomi', flag: '🇫🇮', group: 'eu' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', group: 'eu' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿', group: 'eu' },
  { code: 'ro', label: 'Română', flag: '🇷🇴', group: 'eu' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷', group: 'eu' },
  // ยุโรปตะวันออก / กลาง
  { code: 'ru', label: 'Русский', flag: '🇷🇺', group: 'ee' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', group: 'ee' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', group: 'ee' },
  // ตะวันออกกลาง / แอฟริกา
  { code: 'ar', label: 'العربية', flag: '🇸🇦', group: 'me' },
  { code: 'he', label: 'עברית', flag: '🇮🇱', group: 'me' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷', group: 'me' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪', group: 'me' },
];

const GROUPS = {
  auto: '🔍 ตรวจอัตโนมัติ',
  sea: '🌏 เอเชียตะวันออกเฉียงใต้',
  ea: '🏯 เอเชียตะวันออก',
  sa: '🛕 เอเชียใต้',
  eu: '🏰 ยุโรป',
  ee: '🌍 ยุโรปตะวันออก / กลาง',
  me: '🕌 ตะวันออกกลาง / แอฟริกา',
};

const STYLES = [
  { value: 'formal', label: '🏛️ ทางการ' },
  { value: 'academic', label: '📚 วิชาการ' },
  { value: 'casual', label: '💬 ทั่วไป' },
  { value: 'business', label: '💼 ธุรกิจ' },
];

// Popular quick-pick languages (ไม่รวม auto)
const QUICK_LANGS = ['th', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ar', 'ru'];

function LangSelect({ value, onChange, includeAuto = false, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === value) || LANGUAGES[1];
  const filtered = LANGUAGES.filter(l => {
    if (!includeAuto && l.code === 'auto') return false;
    if (!search) return true;
    return l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.flag.includes(search) || l.code.includes(search.toLowerCase());
  });

  // group filtered results
  const grouped = {};
  filtered.forEach(l => {
    if (!grouped[l.group]) grouped[l.group] = [];
    grouped[l.group].push(l);
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4, fontWeight: 600, letterSpacing: 1 }}>{label}</div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 12,
          background: open ? 'rgba(0,180,230,0.12)' : 'rgba(255,255,255,0.07)',
          border: `1.5px solid ${open ? CI.cyan : 'rgba(255,255,255,0.12)'}`,
          color: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 16, fontWeight: 600,
          transition: 'all 0.15s',
        }}
      >
        <span>{current.flag} {current.label}</span>
        <span style={{ opacity: 0.5, fontSize: 12 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: '#1a1a3e', border: `1.5px solid ${CI.cyan}40`, borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
          maxHeight: 360, display: 'flex', flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 ค้นหาภาษา..."
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Quick picks */}
          {!search && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {QUICK_LANGS.filter(c => includeAuto || c !== 'auto').map(code => {
                const lang = LANGUAGES.find(l => l.code === code);
                if (!lang) return null;
                return (
                  <button key={code} onClick={() => { onChange(code); setOpen(false); setSearch(''); }} style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
                    background: value === code ? CI.cyan : 'rgba(255,255,255,0.1)',
                    border: 'none', color: '#fff', fontWeight: value === code ? 700 : 400,
                  }}>
                    {lang.flag} {lang.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* All languages grouped */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {Object.entries(grouped).map(([group, langs]) => (
              <div key={group}>
                <div style={{ padding: '8px 14px 4px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {GROUPS[group]}
                </div>
                {langs.map(lang => (
                  <button key={lang.code} onClick={() => { onChange(lang.code); setOpen(false); setSearch(''); }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 16px', border: 'none', cursor: 'pointer', fontFamily: FONT,
                    background: value === lang.code ? `${CI.cyan}20` : 'transparent',
                    color: value === lang.code ? CI.cyan : '#fff',
                    fontSize: 15, fontWeight: value === lang.code ? 700 : 400,
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => { if (value !== lang.code) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (value !== lang.code) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 20 }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {value === lang.code && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AITranslator() {
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [style, setStyle] = useState('formal');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [detectedLang, setDetectedLang] = useState('');

  const handleSourceChange = (text) => {
    setSourceText(text);
    setCharCount(text.length);
    setTranslation('');
    setDetectedLang('');
  };

  const translate = async () => {
    if (!sourceText.trim()) return toast.error('กรุณาใส่ข้อความที่ต้องการแปล');
    setLoading(true);
    setTranslation('');
    setDetectedLang('');
    try {
      const srcLabel = sourceLang === 'auto' ? 'ตรวจสอบและระบุภาษาต้นทางเองแล้วแปล' : (LANGUAGES.find(l => l.code === sourceLang)?.label || sourceLang);
      const tgtLabel = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang;

      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'ai-translator',
          payload: {
            text: sourceText,
            sourceLang: srcLabel,
            targetLang: tgtLabel,
            style,
          }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const result = data.translation || data.result || '';
      setTranslation(result);
      if (sourceLang === 'auto' && result) {
        setDetectedLang('ตรวจพบภาษาต้นทางอัตโนมัติ');
      }
      toast.success('แปลสำเร็จ!');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const swapLangs = () => {
    if (sourceLang === 'auto') return toast('เลือกภาษาต้นทางก่อนสลับ', { icon: 'ℹ️' });
    const prev = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prev);
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
    setDetectedLang('');
  };

  const srcLang = LANGUAGES.find(l => l.code === sourceLang);
  const tgtLang = LANGUAGES.find(l => l.code === targetLang);

  return (
    <div style={{ fontFamily: FONT, color: '#fff', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🌐</span>
          <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Translator
          </h2>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>40+ ภาษาทั่วโลก</span>
        </div>
        <button onClick={clearAll} style={{
          padding: '7px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: FONT,
        }}>🗑️ ล้างทั้งหมด</button>
      </div>

      {/* Language bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16,
        background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 20px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <LangSelect value={sourceLang} onChange={setSourceLang} includeAuto label="ภาษาต้นทาง" />

        {/* Swap */}
        <button onClick={swapLangs} title="สลับภาษา" style={{
          padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 20,
          flexShrink: 0, marginBottom: 0, lineHeight: 1, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = `${CI.cyan}25`; e.currentTarget.style.borderColor = CI.cyan; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
        >⇄</button>

        <LangSelect value={targetLang} onChange={setTargetLang} includeAuto={false} label="ภาษาปลายทาง" />
      </div>

      {/* Style */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', marginRight: 4 }}>สไตล์:</span>
        {STYLES.map(s => (
          <button key={s.value} onClick={() => setStyle(s.value)} style={{
            padding: '7px 16px', borderRadius: 8,
            background: style === s.value ? `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})` : 'rgba(255,255,255,0.07)',
            border: style === s.value ? 'none' : '1px solid rgba(255,255,255,0.12)',
            color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: FONT,
            fontWeight: style === s.value ? 700 : 400,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Text areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Source */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: CI.gold }}>
              {srcLang?.flag} {srcLang?.label}
              {detectedLang && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: 8 }}>({detectedLang})</span>}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{charCount.toLocaleString()} ตัวอักษร</span>
          </div>
          <textarea
            value={sourceText}
            onChange={e => handleSourceChange(e.target.value)}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') translate(); }}
            placeholder="พิมพ์หรือวางข้อความที่ต้องการแปล... (Ctrl+Enter เพื่อแปล)"
            rows={12}
            style={{
              width: '100%', padding: '16px', background: 'transparent', border: 'none',
              color: '#fff', fontSize: 16, fontFamily: FONT, outline: 'none', resize: 'vertical',
              lineHeight: 1.7, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Translation */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', border: `1px solid ${translation ? CI.cyan + '30' : 'rgba(255,255,255,0.1)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: CI.cyan }}>
              {tgtLang?.flag} {tgtLang?.label}
            </span>
            {translation && (
              <button onClick={copyTranslation} style={{
                background: `${CI.cyan}20`, border: `1px solid ${CI.cyan}40`, borderRadius: 6,
                padding: '4px 12px', color: CI.cyan, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
              }}>📋 คัดลอก</button>
            )}
          </div>
          <div style={{
            padding: '16px', minHeight: 260, whiteSpace: 'pre-wrap', lineHeight: 1.7,
            fontSize: 16, color: translation ? '#fff' : 'rgba(255,255,255,0.25)',
          }}>
            {loading
              ? <span style={{ color: CI.cyan }}>⏳ กำลังแปล...</span>
              : translation || `คำแปล ${tgtLang?.label || ''} จะแสดงที่นี่...`
            }
          </div>
        </div>
      </div>

      {/* Translate Button */}
      <button
        onClick={translate}
        disabled={loading || !sourceText.trim()}
        style={{
          width: '100%', padding: '15px 24px',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          color: '#fff', border: 'none', borderRadius: 14, fontFamily: FONT,
          fontSize: 17, cursor: loading ? 'wait' : 'pointer', fontWeight: 700,
          opacity: loading || !sourceText.trim() ? 0.55 : 1, transition: 'opacity 0.2s',
          boxShadow: loading || !sourceText.trim() ? 'none' : `0 4px 20px ${CI.cyan}40`,
        }}
      >
        {loading ? '⏳ กำลังแปล...' : `✨ แปลเป็น ${tgtLang?.flag || ''} ${tgtLang?.label || ''}`}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
        กด Ctrl+Enter เพื่อแปลได้เลย
      </p>
    </div>
  );
}

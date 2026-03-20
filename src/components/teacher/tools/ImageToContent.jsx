'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const OUTPUT_TYPES = [
  { key: 'caption', label: 'Caption', icon: '\ud83d\udcdd', desc: '\u0e04\u0e33\u0e1a\u0e23\u0e23\u0e22\u0e32\u0e22\u0e20\u0e32\u0e1e\u0e2a\u0e31\u0e49\u0e19\u0e46' },
  { key: 'social_post', label: 'Social Post', icon: '\ud83d\udcf1', desc: '\u0e42\u0e1e\u0e2a\u0e15\u0e4c\u0e42\u0e0b\u0e40\u0e0a\u0e35\u0e22\u0e25\u0e21\u0e35\u0e40\u0e14\u0e35\u0e22' },
  { key: 'content_summary', label: 'Content Summary', icon: '\ud83d\udcc4', desc: '\u0e2a\u0e23\u0e38\u0e1b\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32\u0e08\u0e32\u0e01\u0e20\u0e32\u0e1e' },
  { key: 'alt_text', label: 'Alt Text', icon: '\u267f', desc: 'Alternative text \u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a accessibility' },
];

const LS_KEY = 'image_to_content_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(h.slice(0, 50))); } catch {}
}

export default function ImageToContent() {
  const [imageBase64, setImageBase64] = useState('');
  const [imageName, setImageName] = useState('');
  const [outputType, setOutputType] = useState('caption');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e\u0e40\u0e17\u0e48\u0e32\u0e19\u0e31\u0e49\u0e19');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('\u0e44\u0e1f\u0e25\u0e4c\u0e43\u0e2b\u0e0d\u0e48\u0e40\u0e01\u0e34\u0e19 10MB');
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageBase64(ev.target.result);
      setResult('');
    };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!imageBase64) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e2d\u0e31\u0e1b\u0e42\u0e2b\u0e25\u0e14\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e\u0e01\u0e48\u0e2d\u0e19');
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'image_to_content',
          payload: { image: imageBase64, outputType }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const content = data.content || data.result || '';
      setResult(content);

      // Save to history
      const entry = {
        id: Date.now().toString(),
        imageName,
        outputType,
        content,
        thumbnail: imageBase64,
        createdAt: new Date().toISOString(),
      };
      const updated = [entry, ...history].slice(0, 50);
      setHistory(updated);
      saveHistory(updated);
      toast.success('\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e41\u0e25\u0e49\u0e27!');
    } catch (err) {
      toast.error('\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (t) => {
    navigator.clipboard.writeText(t);
    toast.success('\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27!');
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    toast.success('\u0e25\u0e49\u0e32\u0e07\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34\u0e41\u0e25\u0e49\u0e27');
  };

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  };

  return (
    <div style={{ fontFamily: FONT, color: CI.dark, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>{'\ud83d\uddbc\ufe0f'}</span>
        <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {'\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e \u2192 \u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32 AI'}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Upload & Preview */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.magenta }}>{'\ud83d\udcf7'} \u0e2d\u0e31\u0e1b\u0e42\u0e2b\u0e25\u0e14\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e</h3>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #ccc', borderRadius: 12, padding: 40, textAlign: 'center',
              cursor: 'pointer', background: '#fafafa', transition: 'border-color 0.2s',
              marginBottom: 16,
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = CI.cyan}
            onMouseOut={e => e.currentTarget.style.borderColor = '#ccc'}
          >
            {imageBase64 ? (
              <img src={imageBase64} alt="preview" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 10, objectFit: 'contain' }} />
            ) : (
              <div>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{'\ud83d\udcf7'}</div>
                <p style={{ fontSize: 15, color: '#999', margin: 0 }}>{'\u0e04\u0e25\u0e34\u0e01\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e'}</p>
                <p style={{ fontSize: 13, color: '#bbb', margin: '4px 0 0 0' }}>JPG, PNG, GIF, WebP ({'\u0e44\u0e21\u0e48\u0e40\u0e01\u0e34\u0e19'} 10MB)</p>
              </div>
            )}
          </div>

          {imageName && <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{'\ud83d\udcc1'} {imageName}</p>}
        </div>

        {/* Output Type Selection */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.purple }}>{'\ud83c\udfaf'} \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OUTPUT_TYPES.map(t => (
              <div
                key={t.key}
                onClick={() => setOutputType(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  background: outputType === t.key ? `linear-gradient(135deg, ${CI.cyan}15, ${CI.purple}15)` : '#f8f9fa',
                  border: outputType === t.key ? `2px solid ${CI.cyan}` : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: 24 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: outputType === t.key ? CI.cyan : CI.dark }}>{t.label}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={generate}
            disabled={loading || !imageBase64}
            style={{
              width: '100%', marginTop: 20, padding: '14px 24px',
              background: `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
              color: '#fff', border: 'none', borderRadius: 12, fontFamily: FONT, fontSize: 17,
              cursor: loading || !imageBase64 ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: loading || !imageBase64 ? 0.5 : 1,
            }}
          >
            {loading ? '\u23f3 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e2a\u0e23\u0e49\u0e32\u0e07...' : '\u2728 \u0e2a\u0e23\u0e49\u0e32\u0e07\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 17, margin: 0, color: CI.cyan }}>{'\u2728'} \u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32\u0e17\u0e35\u0e48\u0e2a\u0e23\u0e49\u0e32\u0e07</h3>
            <button onClick={() => copyText(result)} style={{
              padding: '6px 14px', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT, fontWeight: 600,
            }}>{'\ud83d\udccb'} \u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01</button>
          </div>
          <div style={{
            padding: 16, background: '#f8f9fa', borderRadius: 10, fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: CI.dark,
          }}>
            {result}
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{
            padding: '8px 16px', background: `linear-gradient(135deg, ${CI.purple}, ${CI.cyan})`,
            color: '#fff', border: 'none', borderRadius: 10, fontFamily: FONT, fontSize: 14, cursor: 'pointer', fontWeight: 600,
          }}>
            {'\ud83d\udcda'} \u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34\u0e01\u0e32\u0e23\u0e2a\u0e23\u0e49\u0e32\u0e07 ({history.length})
          </button>
          {showHistory && history.length > 0 && (
            <button onClick={clearHistory} style={{
              padding: '6px 12px', background: 'rgba(230,0,126,0.1)', border: `1px solid ${CI.magenta}44`,
              borderRadius: 8, color: CI.magenta, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
            }}>{'\ud83d\uddd1\ufe0f'} \u0e25\u0e49\u0e32\u0e07\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14</button>
          )}
        </div>

        {showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: 15 }}>{'\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34'}</p>
            )}
            {history.map(entry => (
              <div key={entry.id} style={{ ...cardStyle, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {entry.thumbnail && (
                  <img src={entry.thumbnail} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, padding: '2px 8px', background: `${CI.purple}15`, borderRadius: 4, color: CI.purple, fontWeight: 600 }}>
                      {OUTPUT_TYPES.find(t => t.key === entry.outputType)?.label || entry.outputType}
                    </span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>{entry.imageName}</span>
                    <span style={{ fontSize: 12, color: '#ccc', marginLeft: 'auto' }}>
                      {new Date(entry.createdAt).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {entry.content}
                  </p>
                  <button onClick={() => copyText(entry.content)} style={{
                    marginTop: 6, padding: '4px 10px', background: '#f0f0f0', border: 'none', borderRadius: 6,
                    color: '#666', fontSize: 12, cursor: 'pointer', fontFamily: FONT,
                  }}>{'\ud83d\udccb'} \u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

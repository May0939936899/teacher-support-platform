'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', purple: '#7c4dff' };
const FONT = "'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";
const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#ccfbf1', '#fce7f3'];

function StudentInteractiveInner() {
  const searchParams = useSearchParams();
  const room = searchParams.get('room') || '';
  const modeParam = searchParams.get('mode') || '';

  const [mode, setMode] = useState(modeParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitCount, setSubmitCount] = useState(0);
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);

  // Fetch session info
  useEffect(() => {
    if (!room) { setError('ไม่พบ Room Code'); setLoading(false); return; }

    fetch(`/api/teacher/interactive?room=${room}&action=info`)
      .then(r => r.json())
      .then(data => {
        if (data.error && data.error === 'Room not found') {
          setError('ห้องนี้ไม่พบหรือหมดอายุแล้ว');
        } else {
          setMode(data.mode || modeParam);
          if (data.poll) setPoll(data.poll);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        setLoading(false);
      });
  }, [room, modeParam]);

  const submit = async (text) => {
    try {
      const res = await fetch('/api/teacher/interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room, action: 'submit',
          text: text || input,
          from: name || 'นักศึกษา',
          color: mode === 'brainstorm' ? stickyColor : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitCount(prev => prev + 1);
        setSelectedOption(null); // reset poll selection
        setInput('');            // reset text input
        return true;
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
        return false;
      }
    } catch {
      alert('ไม่สามารถส่งข้อมูลได้ ลองใหม่อีกครั้ง');
      return false;
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#64748b', fontSize: '18px' }}>กำลังเชื่อมต่อ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
            <h2 style={{ margin: '0 0 8px', color: CI.dark, fontSize: '22px' }}>ไม่พบห้อง</h2>
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>{error}</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '16px' }}>Room Code: {room}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`,
        padding: '20px 24px', color: '#fff', textAlign: 'center',
      }}>
        <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>
          <span style={{ color: '#fff' }}>SPUBUS</span>
          <span style={{ color: '#fff' }}> SUPPORT</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.1)', borderRadius: '8px',
          padding: '6px 16px', fontSize: '14px',
        }}>
          Room: <span style={{ fontWeight: 800, letterSpacing: '3px', fontFamily: "'Courier New', monospace", fontSize: '18px' }}>{room}</span>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {/* Name input */}
        {!name && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', color: CI.dark, textAlign: 'center' }}>
              👋 ยินดีต้อนรับ!
            </h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '15px', textAlign: 'center' }}>
              กรุณาระบุชื่อ-นามสกุล หรือรหัสนักศึกษา
            </p>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && input.trim()) {
                  setName(input.trim());
                  setInput('');
                }
              }}
              placeholder="ชื่อ-นามสกุล หรือรหัสนักศึกษา"
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            <button
              onClick={() => {
                if (input.trim()) { setName(input.trim()); setInput(''); }
              }}
              disabled={!input.trim()}
              style={{
                ...btnStyle,
                opacity: input.trim() ? 1 : 0.5,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              เข้าร่วม →
            </button>
          </div>
        )}

        {/* Word Cloud input */}
        {name && mode === 'wordcloud' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', color: CI.dark }}>☁️ Word Cloud</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
              พิมพ์คำที่คุณนึกถึง (ส่งได้หลายครั้ง)
            </p>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) submit(); }}
              placeholder="พิมพ์คำ..."
              style={{ ...inputStyle, marginBottom: '12px', fontSize: '20px', textAlign: 'center' }}
            />
            <button
              onClick={() => submit()}
              disabled={!input.trim()}
              style={{
                ...btnStyle,
                opacity: input.trim() ? 1 : 0.5,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              ✨ ส่งคำ
            </button>
            {submitCount > 0 && (
              <p style={{ textAlign: 'center', color: '#10b981', fontSize: '15px', marginTop: '12px', fontWeight: 600 }}>
                ✅ ส่งแล้ว {submitCount} คำ
              </p>
            )}
          </div>
        )}

        {/* Poll voting */}
        {name && mode === 'poll' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', color: CI.dark }}>📊 Live Poll</h3>
            {poll ? (
              <>
                <p style={{ margin: '0 0 20px', color: '#1e293b', fontSize: '18px', fontWeight: 600 }}>
                  {poll.question}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {poll.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      style={{
                        padding: '14px 16px', borderRadius: '12px',
                        border: selectedOption === idx ? `2px solid ${CI.cyan}` : '2px solid #e2e8f0',
                        background: selectedOption === idx ? '#e0f7fa' : '#fff',
                        color: CI.dark, fontSize: '16px', fontWeight: selectedOption === idx ? 700 : 500,
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%',
                        background: selectedOption === idx ? CI.cyan : '#e2e8f0',
                        color: selectedOption === idx ? '#fff' : '#64748b',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700, marginRight: '10px',
                      }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
                {submitCount > 0 && (
                  <p style={{ margin: '0 0 10px', color: '#10b981', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
                    ✅ โหวตแล้ว {submitCount} ครั้ง — เลือกใหม่เพื่อโหวตซ้ำได้
                  </p>
                )}
                <button
                  onClick={() => {
                    if (selectedOption !== null) submit(String(selectedOption));
                  }}
                  disabled={selectedOption === null}
                  style={{
                    ...btnStyle,
                    opacity: selectedOption !== null ? 1 : 0.5,
                    cursor: selectedOption !== null ? 'pointer' : 'not-allowed',
                  }}
                >
                  🗳️ {submitCount > 0 ? 'โหวตซ้ำ' : 'โหวต'}
                </button>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: '16px', textAlign: 'center', margin: '20px 0' }}>
                ⏳ รอ...อาจารย์ยังไม่เปิด Poll
              </p>
            )}
          </div>
        )}


        {/* Brainstorm input */}
        {name && mode === 'brainstorm' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', color: CI.dark }}>💡 Brainstorm Board</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
              แชร์ไอเดียของคุณ (ส่งได้หลายครั้ง)
            </p>

            {/* Color picker */}
            <div style={{ marginBottom: '14px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>🎨 เลือกสีโพสอิท</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {STICKY_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setStickyColor(c)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      border: stickyColor === c ? '3px solid #475569' : '2px solid #e2e8f0',
                      background: c, cursor: 'pointer', transition: 'all 0.15s',
                      transform: stickyColor === c ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: stickyColor === c ? '0 3px 10px rgba(0,0,0,0.2)' : '1px 2px 4px rgba(0,0,0,0.08)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preview sticky note */}
            <div style={{
              background: stickyColor, borderRadius: '4px', padding: '14px',
              minHeight: '60px', marginBottom: '12px',
              boxShadow: '2px 3px 8px rgba(0,0,0,0.1)',
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="พิมพ์ไอเดียของคุณ..."
                rows={3}
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  fontSize: '16px', color: '#1e293b', outline: 'none',
                  resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={() => submit()}
              disabled={!input.trim()}
              style={{
                ...btnStyle,
                opacity: input.trim() ? 1 : 0.5,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              💡 ส่งไอเดีย
            </button>
            {submitCount > 0 && (
              <p style={{ textAlign: 'center', color: '#10b981', fontSize: '15px', marginTop: '12px', fontWeight: 600 }}>
                ✅ ส่งแล้ว {submitCount} ไอเดีย
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        {name && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '20px' }}>
            เข้าในชื่อ: {name} | Room: {room}
          </p>
        )}
      </div>
    </div>
  );
}

export default function StudentInteractivePage() {
  return (
    <Suspense fallback={
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#64748b', fontSize: '18px', fontFamily: FONT }}>กำลังโหลด...</p>
        </div>
      </div>
    }>
      <StudentInteractiveInner />
    </Suspense>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f0f4f8',
  fontFamily: FONT,
};

const cardStyle = {
  background: '#fff',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  marginBottom: '16px',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '12px',
  border: '2px solid #e2e8f0',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#1e293b',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

const btnStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '12px',
  border: 'none',
  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
  color: '#fff',
  fontSize: '17px',
  fontWeight: 700,
  fontFamily: 'inherit',
  transition: 'opacity 0.2s',
};

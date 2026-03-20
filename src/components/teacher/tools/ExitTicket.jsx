'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const QUESTION_TYPES = [
  { id: 'mc', label: 'Multiple Choice', icon: '🔘' },
  { id: 'short', label: 'Short Answer', icon: '✏️' },
  { id: 'scale', label: 'Scale 1-5', icon: '⭐' },
];

function generateMockResults(questions) {
  const names = ['สมชาย', 'สมหญิง', 'วิชัย', 'มานี', 'ปิติ', 'อรุณ', 'จันทร์', 'กมล', 'ธนา', 'พิมล',
    'สุดา', 'เจษฎา', 'นันทา', 'ชัยวัฒน์', 'ศิริ', 'พรรณี', 'ดวงใจ', 'สมบัติ', 'ลัดดา', 'ประยุทธ์'];
  const count = 15 + Math.floor(Math.random() * 10);
  return Array.from({ length: count }, (_, i) => ({
    name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
    answers: questions.map(q => {
      if (q.type === 'mc') return q.options[Math.floor(Math.random() * q.options.filter(o => o).length)] || 'A';
      if (q.type === 'scale') return Math.floor(Math.random() * 5) + 1;
      return ['ดีมาก', 'เข้าใจ', 'ยังไม่เข้าใจ', 'ต้องทบทวน', 'สนุก', 'ชอบกิจกรรม'][Math.floor(Math.random() * 6)];
    }),
  }));
}

export default function ExitTicket() {
  const [tab, setTab] = useState('build'); // build | preview | results
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [mockResults, setMockResults] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const qrRef = useRef(null);

  const addQuestion = (type) => {
    setQuestions(prev => [...prev, {
      id: Date.now().toString(),
      type,
      text: '',
      options: type === 'mc' ? ['', '', '', ''] : [],
    }]);
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const updateOption = (qIdx, oIdx, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[oIdx] = value;
      copy[qIdx] = { ...copy[qIdx], options: opts };
      return copy;
    });
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const generateLink = () => {
    if (!title || questions.length === 0) {
      toast.error('กรุณากรอกชื่อและเพิ่มคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/teacher?exit-ticket=${code}`;
    setShareLink(link);
    toast.success('สร้างลิงก์แล้ว!');
    // Generate QR
    if (qrRef.current) {
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(qrRef.current, link, { width: 180, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }, () => {});
      }).catch(() => {});
    }
  };

  const showResults = () => {
    if (questions.length === 0) {
      toast.error('กรุณาเพิ่มคำถามก่อน');
      return;
    }
    const results = generateMockResults(questions);
    setMockResults(results);
    setTab('results');
    toast.success('แสดงผลลัพธ์จำลอง');
  };

  const getScaleStats = (qIdx) => {
    if (!mockResults) return [];
    const counts = [0, 0, 0, 0, 0];
    mockResults.forEach(r => {
      const val = r.answers[qIdx];
      if (val >= 1 && val <= 5) counts[val - 1]++;
    });
    return counts;
  };

  const getMCStats = (qIdx) => {
    if (!mockResults) return {};
    const counts = {};
    mockResults.forEach(r => {
      const val = r.answers[qIdx];
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[
          { id: 'build', label: '🛠️ สร้าง', },
          { id: 'preview', label: '👁️ พรีวิว' },
          { id: 'results', label: '📊 ผลลัพธ์' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: tab === t.id ? '#fff' : 'none',
            color: tab === t.id ? CI.dark : '#64748b',
            fontWeight: tab === t.id ? 700 : 400,
            boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            fontSize: '15px', transition: 'all 0.2s', fontFamily: FONT,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* BUILD TAB */}
      {tab === 'build' && (
        <div style={{ display: 'grid', gridTemplateColumns: shareLink ? '1fr 320px' : '1fr', gap: '24px' }}>
          <div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '22px', color: CI.dark, fontWeight: 700 }}>🎫 สร้าง Exit Ticket</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>ชื่อ Exit Ticket *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น Exit Ticket บทที่ 5" style={inp} />
              </div>

              <label style={lbl}>เพิ่มคำถาม</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {QUESTION_TYPES.map(qt => (
                  <button key={qt.id} onClick={() => addQuestion(qt.id)} style={{
                    padding: '10px 16px', borderRadius: '10px', border: '2px dashed #e2e8f0',
                    background: '#f8fafc', cursor: 'pointer', fontSize: '15px', fontFamily: FONT,
                    color: '#475569', fontWeight: 600, transition: 'all 0.2s',
                  }}>
                    {qt.icon} + {qt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions list */}
            {questions.map((q, idx) => (
              <div key={q.id} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff', borderRadius: '6px', padding: '3px 10px', fontSize: '15px', fontWeight: 700 }}>
                    ข้อ {idx + 1}
                  </span>
                  <span style={{ fontSize: '15px', color: '#64748b' }}>
                    {QUESTION_TYPES.find(t => t.id === q.type)?.icon} {QUESTION_TYPES.find(t => t.id === q.type)?.label}
                  </span>
                  <button onClick={() => removeQuestion(idx)} style={{ marginLeft: 'auto', background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '15px', fontFamily: FONT }}>
                    ✕ ลบ
                  </button>
                </div>
                <input
                  placeholder="พิมพ์คำถาม..."
                  value={q.text}
                  onChange={e => updateQuestion(idx, 'text', e.target.value)}
                  style={{ ...inp, marginBottom: '10px' }}
                />
                {q.type === 'mc' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', color: '#64748b', width: '24px', textAlign: 'center' }}>{String.fromCharCode(65 + oi)}.</span>
                        <input
                          placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                          value={opt}
                          onChange={e => updateOption(idx, oi, e.target.value)}
                          style={{ ...inp, flex: 1 }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'scale' && (
                  <div style={{ display: 'flex', gap: '12px', padding: '10px 0' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} style={{
                        width: '44px', height: '44px', borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0',
                        color: '#64748b', fontSize: '18px', fontWeight: 700,
                      }}>
                        {n}
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'short' && (
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', color: '#94a3b8', fontSize: '15px' }}>
                    นักศึกษาจะพิมพ์คำตอบสั้นๆ ที่นี่...
                  </div>
                )}
              </div>
            ))}

            {questions.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={generateLink} style={{
                  flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '17px', fontFamily: FONT,
                }}>
                  🔗 สร้างลิงก์แชร์
                </button>
                <button onClick={showResults} style={{
                  flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid ${CI.cyan}`,
                  background: '#fff', color: CI.cyan, cursor: 'pointer', fontWeight: 700, fontSize: '17px', fontFamily: FONT,
                }}>
                  📊 ดูผลจำลอง
                </button>
              </div>
            )}
          </div>

          {/* Share panel */}
          {shareLink && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: CI.dark }}>🔗 แชร์ Exit Ticket</h4>
              <canvas ref={qrRef} style={{ borderRadius: '12px', display: 'block', margin: '0 auto 16px' }} />
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', fontSize: '14px', color: '#475569', wordBreak: 'break-all', marginBottom: '12px' }}>
                {shareLink}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('คัดลอกลิงก์แล้ว'); }} style={{
                width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                background: CI.cyan, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '15px', fontFamily: FONT,
              }}>
                📋 คัดลอกลิงก์
              </button>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW TAB */}
      {tab === 'preview' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
            borderRadius: '16px', padding: '28px', color: '#fff', marginBottom: '20px',
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>{title || 'Exit Ticket'}</h2>
            <p style={{ margin: 0, opacity: 0.85, fontSize: '15px' }}>กรุณาตอบคำถามด้านล่างก่อนออกจากห้องเรียน</p>
          </div>
          {questions.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '16px' }}>
              ยังไม่มีคำถาม กลับไปแท็บ "สร้าง" เพื่อเพิ่มคำถาม
            </div>
          )}
          {questions.map((q, idx) => (
            <div key={q.id} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '16px', color: CI.dark, fontWeight: 600 }}>
                {idx + 1}. {q.text || '(ยังไม่มีคำถาม)'}
              </p>
              {q.type === 'mc' && q.options.map((opt, oi) => (
                opt && (
                  <div key={oi} style={{
                    padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0',
                    marginBottom: '6px', fontSize: '15px', color: '#475569', cursor: 'pointer',
                  }}>
                    {String.fromCharCode(65 + oi)}. {opt}
                  </div>
                )
              ))}
              {q.type === 'scale' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} style={{
                      width: '48px', height: '48px', borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0',
                      cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: '#475569',
                    }}>
                      {n}
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'short' && (
                <textarea placeholder="พิมพ์คำตอบที่นี่..." style={{ ...inp, minHeight: '70px', resize: 'vertical' }} readOnly />
              )}
            </div>
          ))}
          {questions.length > 0 && (
            <button disabled style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
              color: '#fff', fontWeight: 700, fontSize: '17px', fontFamily: FONT, opacity: 0.7,
            }}>
              ✅ ส่งคำตอบ (พรีวิว)
            </button>
          )}
        </div>
      )}

      {/* RESULTS TAB */}
      {tab === 'results' && (
        <div>
          {!mockResults ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <p style={{ fontSize: '18px' }}>ยังไม่มีข้อมูล</p>
              <button onClick={showResults} style={{
                padding: '12px 28px', borderRadius: '12px', border: 'none',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: FONT,
              }}>
                📊 สร้างข้อมูลจำลอง
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '20px', color: CI.dark }}>📊 ผลลัพธ์ Exit Ticket</h3>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '15px' }}>จำนวนผู้ตอบ: {mockResults.length} คน</p>

                {questions.map((q, idx) => (
                  <div key={q.id} style={{ marginBottom: '28px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                    <p style={{ fontWeight: 700, fontSize: '16px', color: CI.dark, marginBottom: '12px' }}>
                      ข้อ {idx + 1}: {q.text || '(ไม่มีคำถาม)'}
                    </p>

                    {q.type === 'mc' && (() => {
                      const stats = getMCStats(idx);
                      const max = Math.max(...Object.values(stats), 1);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(stats).map(([opt, count]) => (
                            <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ width: '120px', fontSize: '15px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
                              <div style={{ flex: 1, height: '28px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${(count / max) * 100}%`, height: '100%',
                                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                                  borderRadius: '6px', transition: 'width 0.5s',
                                }} />
                              </div>
                              <span style={{ fontSize: '15px', fontWeight: 700, color: CI.dark, width: '40px', textAlign: 'right' }}>{count}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {q.type === 'scale' && (() => {
                      const stats = getScaleStats(idx);
                      const max = Math.max(...stats, 1);
                      const avg = mockResults.reduce((s, r) => s + r.answers[idx], 0) / mockResults.length;
                      return (
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px', marginBottom: '8px' }}>
                            {stats.map((count, i) => (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: CI.dark, marginBottom: '4px' }}>{count}</span>
                                <div style={{
                                  width: '100%', height: `${(count / max) * 90}%`,
                                  background: `linear-gradient(to top, ${CI.cyan}, ${CI.magenta})`,
                                  borderRadius: '6px 6px 0 0', minHeight: '4px',
                                }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <div key={n} style={{ flex: 1, textAlign: 'center', fontSize: '15px', color: '#64748b', fontWeight: 600 }}>{n}</div>
                            ))}
                          </div>
                          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '16px', color: CI.cyan, fontWeight: 700 }}>
                            ค่าเฉลี่ย: {avg.toFixed(1)} / 5.0
                          </div>
                        </div>
                      );
                    })()}

                    {q.type === 'short' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {mockResults.slice(0, 12).map((r, ri) => (
                          <span key={ri} style={{
                            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px',
                            padding: '6px 12px', fontSize: '14px', color: '#0369a1',
                          }}>
                            {r.answers[idx]}
                          </span>
                        ))}
                        {mockResults.length > 12 && (
                          <span style={{ padding: '6px 12px', fontSize: '14px', color: '#94a3b8' }}>
                            +{mockResults.length - 12} คำตอบเพิ่มเติม
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };

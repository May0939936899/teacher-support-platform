'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function parseTime(str) {
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseInt(str) || 0;
}

function getYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function generateQR(text, canvas) {
  import('qrcode').then(QRCode => {
    QRCode.toCanvas(canvas, text, { width: 200, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
  });
}

// LocalStorage-based quiz storage
function saveQuizSession(code, data) {
  const sessions = JSON.parse(localStorage.getItem('video_quiz_sessions') || '{}');
  sessions[code] = { ...data, updatedAt: Date.now() };
  localStorage.setItem('video_quiz_sessions', JSON.stringify(sessions));
}

function getQuizSession(code) {
  const sessions = JSON.parse(localStorage.getItem('video_quiz_sessions') || '{}');
  return sessions[code.toUpperCase()] || null;
}

function getAllSessions() {
  return JSON.parse(localStorage.getItem('video_quiz_sessions') || '{}');
}

export default function VideoQuiz() {
  const [mode, setMode] = useState(null); // null | teacher | student
  const [videoUrl, setVideoUrl] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [publishedCode, setPublishedCode] = useState('');
  const qrRef = useRef(null);

  // Student states
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentQuiz, setStudentQuiz] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [studentSubmitted, setStudentSubmitted] = useState(false);
  const [studentResults, setStudentResults] = useState(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);

  // Check URL params for auto-join
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vq = params.get('video-quiz');
      if (vq) {
        setMode('student');
        setStudentCode(vq.toUpperCase());
      }
    }
  }, []);

  // QR Code generation
  useEffect(() => {
    if (publishedCode && qrRef.current) {
      const url = `${window.location.origin}/teacher?video-quiz=${publishedCode}`;
      generateQR(url, qrRef.current);
    }
  }, [publishedCode]);

  // ===== TEACHER: QUIZ BUILDER =====
  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: '00:00',
      text: '',
      type: 'mc',
      options: ['', '', '', ''],
      answer: 0,
    }]);
  };

  const updateQ = (idx, field, value) => {
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

  const removeQ = (idx) => setQuestions(prev => prev.filter((_, i) => i !== idx));

  const sortedQuestions = [...questions].sort((a, b) => parseTime(a.timestamp) - parseTime(b.timestamp));

  const publishQuiz = () => {
    if (!videoUrl) { toast.error('กรุณาใส่ URL วิดีโอ'); return; }
    if (questions.length === 0) { toast.error('กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ'); return; }
    const hasEmpty = questions.some(q => !q.text);
    if (hasEmpty) { toast.error('กรุณากรอกคำถามให้ครบ'); return; }

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quizData = {
      code,
      title: quizTitle || 'Video Quiz',
      videoUrl,
      ytId: getYouTubeId(videoUrl),
      questions: sortedQuestions,
      createdAt: Date.now(),
      submissions: [],
    };
    saveQuizSession(code, quizData);
    setPublishedCode(code);
    toast.success(`🎬 สร้าง Video Quiz รหัส ${code} แล้ว!`);
  };

  // ===== STUDENT: JOIN & ANSWER =====
  const joinQuiz = () => {
    if (!studentCode) { toast.error('กรุณากรอกรหัส'); return; }
    if (!studentName) { toast.error('กรุณากรอกชื่อ'); return; }
    const quiz = getQuizSession(studentCode);
    if (!quiz) { toast.error('ไม่พบ Quiz — กรุณาตรวจสอบรหัส'); return; }
    setStudentQuiz(quiz);
    setCurrentQIdx(0);
    setStudentAnswers({});
    setStudentSubmitted(false);
    setStudentResults(null);
    toast.success(`เข้าร่วม "${quiz.title}" แล้ว! 🎬`);
  };

  const selectAnswer = (qId, value) => {
    if (studentSubmitted) return;
    setStudentAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const submitQuiz = () => {
    if (!studentQuiz) return;
    const results = studentQuiz.questions.map(q => {
      const userAnswer = studentAnswers[q.id];
      let correct = false;
      if (q.type === 'mc' || q.type === 'tf') {
        correct = userAnswer === q.answer;
      } else if (q.type === 'short') {
        correct = typeof userAnswer === 'string' && typeof q.answer === 'string' &&
          userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
      }
      return { questionId: q.id, userAnswer, correctAnswer: q.answer, correct };
    });

    const score = results.filter(r => r.correct).length;
    const total = results.length;
    setStudentResults({ results, score, total });
    setStudentSubmitted(true);

    // Save submission
    const quiz = getQuizSession(studentCode);
    if (quiz) {
      quiz.submissions = [...(quiz.submissions || []), {
        name: studentName,
        answers: studentAnswers,
        score,
        total,
        submittedAt: Date.now(),
      }];
      saveQuizSession(studentCode, quiz);
    }

    toast.success(`ส่งคำตอบแล้ว! ได้ ${score}/${total} คะแนน`);
  };

  const ytId = getYouTubeId(videoUrl);

  // ===== MODE SELECTION =====
  if (mode === null) {
    return (
      <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', fontFamily: FONT }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎬</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>Video Quiz</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>ดูวิดีโอ + ตอบคำถาม</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <button onClick={() => setMode('teacher')} style={{
            padding: '40px 24px', borderRadius: '24px', border: '2px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)', fontFamily: FONT,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = CI.cyan; e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>👩‍🏫</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>อาจารย์</div>
            <div style={{ fontSize: '15px', color: '#94a3b8' }}>สร้าง Video Quiz</div>
          </button>
          <button onClick={() => setMode('student')} style={{
            padding: '40px 24px', borderRadius: '24px', border: '2px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)', fontFamily: FONT,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = CI.magenta; e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎓</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>นักศึกษา</div>
            <div style={{ fontSize: '15px', color: '#94a3b8' }}>เข้าร่วมตอบคำถาม</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      {/* Back button */}
      <button onClick={() => { setMode(null); setPublishedCode(''); setStudentQuiz(null); setStudentSubmitted(false); }}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', marginBottom: '16px', padding: '4px 0' }}>
        ← เลือกบทบาทใหม่
      </button>

      {/* ===== TEACHER MODE ===== */}
      {mode === 'teacher' && !publishedCode && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          <div>
            {/* Video URL input */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '22px', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>🎬</span> สร้าง Video Quiz
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>ชื่อ Quiz</label>
                <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="เช่น Quiz บทที่ 3 - Marketing Mix" style={inp}
                  onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>URL วิดีโอ YouTube *</label>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={inp}
                  onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              {ytId && (
                <div style={{ borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
                  <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ width: '100%', height: '280px', border: 'none' }} allowFullScreen title="Video preview" />
                </div>
              )}
            </div>

            {/* Questions */}
            {questions.map((q, idx) => (
              <div key={q.id} style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff', borderRadius: '8px', padding: '4px 12px', fontSize: '15px', fontWeight: 800 }}>
                    Q{idx + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', color: '#94a3b8' }}>⏱️</span>
                    <input value={q.timestamp} onChange={e => updateQ(idx, 'timestamp', e.target.value)} placeholder="MM:SS"
                      style={{ ...inp, width: '90px', textAlign: 'center', fontSize: '15px', fontWeight: 700 }} />
                  </div>
                  <select value={q.type} onChange={e => updateQ(idx, 'type', e.target.value)}
                    style={{ ...inp, width: '160px', fontSize: '14px' }}>
                    <option value="mc">Multiple Choice</option>
                    <option value="tf">True / False</option>
                    <option value="short">Short Answer</option>
                  </select>
                  <button onClick={() => removeQ(idx)} style={{ marginLeft: 'auto', background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', fontFamily: FONT, fontWeight: 600 }}>
                    🗑️ ลบ
                  </button>
                </div>
                <input value={q.text} onChange={e => updateQ(idx, 'text', e.target.value)} placeholder="พิมพ์คำถาม..."
                  style={{ ...inp, marginBottom: '12px' }}
                  onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                {q.type === 'mc' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div onClick={() => updateQ(idx, 'answer', oi)} style={{
                          width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                          background: q.answer === oi ? CI.cyan : '#f1f5f9',
                          color: q.answer === oi ? '#fff' : '#94a3b8', transition: 'all 0.15s',
                        }}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <input value={opt} onChange={e => updateOption(idx, oi, e.target.value)}
                          placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                          style={{ ...inp, flex: 1 }} />
                      </div>
                    ))}
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>คลิกตัวอักษรเพื่อเลือกคำตอบที่ถูกต้อง</div>
                  </div>
                )}
                {q.type === 'tf' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['ถูก (True)', 'ผิด (False)'].map((opt, oi) => (
                      <button key={oi} onClick={() => updateQ(idx, 'answer', oi)} style={{
                        flex: 1, padding: '12px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, fontFamily: FONT, cursor: 'pointer',
                        border: `2px solid ${q.answer === oi ? CI.cyan : '#e2e8f0'}`,
                        background: q.answer === oi ? `${CI.cyan}10` : '#fff',
                        color: q.answer === oi ? CI.cyan : '#64748b',
                      }}>
                        {oi === 0 ? '✓' : '✗'} {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === 'short' && (
                  <input value={typeof q.answer === 'string' ? q.answer : ''} onChange={e => updateQ(idx, 'answer', e.target.value)}
                    placeholder="เฉลย (สำหรับตรวจอัตโนมัติ)" style={inp} />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '14px' }}>
              <button onClick={addQuestion} style={{
                flex: 1, padding: '16px', borderRadius: '14px', border: `2px dashed ${CI.cyan}30`,
                background: `${CI.cyan}04`, color: CI.cyan, cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: FONT,
              }}>+ เพิ่มคำถาม</button>
              <button onClick={publishQuiz} disabled={questions.length === 0} style={{
                flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
                background: questions.length > 0 ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : '#e2e8f0',
                color: questions.length > 0 ? '#fff' : '#94a3b8',
                cursor: questions.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 800, fontSize: '17px', fontFamily: FONT,
                boxShadow: questions.length > 0 ? `0 4px 16px ${CI.cyan}30` : 'none',
              }}>🚀 เผยแพร่ Quiz ({questions.length} ข้อ)</button>
            </div>
          </div>

          {/* Timeline sidebar */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>⏱️ Timeline</h4>
            {sortedQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', fontSize: '15px' }}>
                เพิ่มคำถามเพื่อดู Timeline
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px', background: `linear-gradient(to bottom, ${CI.cyan}, ${CI.magenta})` }} />
                {sortedQuestions.map((q, idx) => (
                  <div key={q.id} style={{ position: 'relative', marginBottom: '20px', paddingLeft: '14px' }}>
                    <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, border: '2px solid #fff', boxShadow: `0 0 0 2px ${CI.cyan}` }} />
                    <div style={{ fontSize: '14px', fontWeight: 700, color: CI.cyan }}>{q.timestamp}</div>
                    <div style={{ fontSize: '14px', color: '#1e293b', marginTop: '2px', fontWeight: 600 }}>{q.text || `คำถามข้อ ${idx + 1}`}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                      {q.type === 'mc' ? 'Multiple Choice' : q.type === 'tf' ? 'True/False' : 'Short Answer'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TEACHER: Published View ===== */}
      {mode === 'teacher' && publishedCode && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`,
            borderRadius: '24px', padding: '40px', color: '#fff', textAlign: 'center', marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(11,11,36,0.3)',
          }}>
            <div style={{ fontSize: '15px', opacity: 0.7, marginBottom: '8px', letterSpacing: '2px' }}>🎬 VIDEO QUIZ CODE</div>
            <div style={{
              fontSize: '64px', fontWeight: 900, letterSpacing: '14px',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.gold})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{publishedCode}</div>
            <div style={{ fontSize: '16px', opacity: 0.8, marginTop: '10px' }}>
              📝 {questions.length} คำถาม | 🎬 {quizTitle || 'Video Quiz'}
            </div>

            <canvas ref={qrRef} style={{ borderRadius: '16px', margin: '20px auto', display: 'block', background: '#fff', padding: '10px' }} />
            <div style={{ fontSize: '13px', opacity: 0.6 }}>นักศึกษาสแกน QR หรือกรอกรหัสเพื่อเข้าร่วม</div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center' }}>
              <button onClick={() => {
                const url = `${window.location.origin}/teacher?video-quiz=${publishedCode}`;
                navigator.clipboard.writeText(url); toast.success('📋 คัดลอก URL แล้ว');
              }} style={{ padding: '12px 24px', borderRadius: '12px', border: `1px solid ${CI.cyan}40`, background: 'transparent', color: CI.cyan, cursor: 'pointer', fontSize: '15px', fontFamily: FONT, fontWeight: 700 }}>
                📋 คัดลอก URL
              </button>
              <button onClick={() => { navigator.clipboard.writeText(publishedCode); toast.success('📋 คัดลอกรหัส'); }}
                style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: CI.cyan, color: '#fff', cursor: 'pointer', fontSize: '15px', fontFamily: FONT, fontWeight: 700 }}>
                📋 คัดลอกรหัส
              </button>
            </div>
          </div>

          {/* Submissions */}
          {(() => {
            const quiz = getQuizSession(publishedCode);
            const subs = quiz?.submissions || [];
            return (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
                  📊 ผู้ส่งคำตอบ ({subs.length} คน)
                </h4>
                {subs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '15px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.5 }}>⏳</div>
                    รอนักศึกษาส่งคำตอบ...
                  </div>
                ) : (
                  <div>
                    {subs.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', marginBottom: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{s.name}</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8' }}>{new Date(s.submittedAt).toLocaleString('th-TH')}</div>
                        </div>
                        <div style={{
                          padding: '6px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '16px',
                          background: s.score === s.total ? '#dcfce7' : s.score >= s.total / 2 ? `${CI.gold}15` : '#fef2f2',
                          color: s.score === s.total ? '#16a34a' : s.score >= s.total / 2 ? '#92400e' : '#ef4444',
                        }}>
                          {s.score}/{s.total}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setPublishedCode('')} style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: FONT, width: '100%' }}>
                  🎬 สร้าง Quiz ใหม่
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== STUDENT MODE ===== */}
      {mode === 'student' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Join screen */}
          {!studentQuiz && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '44px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎬</div>
              <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '26px', fontWeight: 800 }}>เข้าร่วม Video Quiz</h2>
              <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '28px' }}>กรอกรหัสที่อาจารย์ให้มา</p>

              <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ ...lbl, textAlign: 'left' }}>รหัส Quiz *</label>
                  <input placeholder="เช่น AB12" value={studentCode}
                    onChange={e => setStudentCode(e.target.value.toUpperCase())} maxLength={6}
                    style={{ ...inp, textAlign: 'center', fontSize: '32px', letterSpacing: '10px', fontWeight: 900, padding: '16px' }}
                    onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={{ ...lbl, textAlign: 'left' }}>ชื่อของคุณ *</label>
                  <input placeholder="ชื่อ-นามสกุล" value={studentName}
                    onChange={e => setStudentName(e.target.value)} style={inp}
                    onFocus={e => e.target.style.borderColor = CI.magenta} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <button onClick={joinQuiz} disabled={!studentCode || !studentName} style={{
                  padding: '16px', borderRadius: '14px', border: 'none',
                  background: studentCode && studentName ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : '#e2e8f0',
                  color: studentCode && studentName ? '#fff' : '#94a3b8',
                  cursor: studentCode && studentName ? 'pointer' : 'not-allowed',
                  fontWeight: 800, fontSize: '18px', fontFamily: FONT,
                }}>🎬 เข้าร่วม</button>
              </div>
            </div>
          )}

          {/* Quiz in progress */}
          {studentQuiz && !studentSubmitted && (
            <div>
              {/* Video */}
              {studentQuiz.ytId && (
                <div style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', background: '#000', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <iframe src={`https://www.youtube.com/embed/${studentQuiz.ytId}`}
                    style={{ width: '100%', height: '400px', border: 'none' }} allowFullScreen title="Video" />
                </div>
              )}

              {/* Quiz header */}
              <div style={{
                background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`, color: '#fff',
                borderRadius: '16px', padding: '18px 24px', marginBottom: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{studentQuiz.title}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>{studentQuiz.questions.length} คำถาม</div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: CI.cyan }}>
                  ตอบแล้ว {Object.keys(studentAnswers).length}/{studentQuiz.questions.length}
                </div>
              </div>

              {/* Questions */}
              {studentQuiz.questions.map((q, idx) => {
                const answered = studentAnswers[q.id] !== undefined;
                return (
                  <div key={q.id} style={{
                    background: '#fff', borderRadius: '18px', padding: '24px', marginBottom: '14px',
                    border: `2px solid ${answered ? '#dcfce7' : '#e2e8f0'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{
                        background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff',
                        borderRadius: '10px', padding: '6px 14px', fontSize: '14px', fontWeight: 800,
                      }}>Q{idx + 1}</span>
                      <span style={{ fontSize: '14px', color: CI.cyan, fontWeight: 700 }}>⏱️ {q.timestamp}</span>
                      {answered && <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '3px 10px', borderRadius: '8px' }}>✓ ตอบแล้ว</span>}
                    </div>
                    <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight: 700, lineHeight: 1.5 }}>{q.text}</h4>

                    {q.type === 'mc' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {q.options.filter(o => o).map((opt, oi) => (
                          <button key={oi} onClick={() => selectAnswer(q.id, oi)} style={{
                            padding: '14px 18px', borderRadius: '14px', textAlign: 'left',
                            border: `2px solid ${studentAnswers[q.id] === oi ? CI.cyan : '#e2e8f0'}`,
                            background: studentAnswers[q.id] === oi ? `${CI.cyan}10` : '#fff',
                            color: studentAnswers[q.id] === oi ? CI.cyan : '#475569',
                            cursor: 'pointer', fontSize: '16px', fontFamily: FONT, fontWeight: studentAnswers[q.id] === oi ? 700 : 500,
                            display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s',
                          }}>
                            <span style={{
                              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: 800, flexShrink: 0,
                              background: studentAnswers[q.id] === oi ? CI.cyan : '#f1f5f9',
                              color: studentAnswers[q.id] === oi ? '#fff' : '#94a3b8',
                            }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'tf' && (
                      <div style={{ display: 'flex', gap: '14px' }}>
                        {['✓ ถูก', '✗ ผิด'].map((opt, oi) => (
                          <button key={oi} onClick={() => selectAnswer(q.id, oi)} style={{
                            flex: 1, padding: '16px', borderRadius: '14px',
                            border: `2px solid ${studentAnswers[q.id] === oi ? CI.cyan : '#e2e8f0'}`,
                            background: studentAnswers[q.id] === oi ? `${CI.cyan}10` : '#fff',
                            color: studentAnswers[q.id] === oi ? CI.cyan : '#475569',
                            cursor: 'pointer', fontSize: '18px', fontFamily: FONT, fontWeight: 700,
                            transition: 'all 0.15s', textAlign: 'center',
                          }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'short' && (
                      <input value={studentAnswers[q.id] || ''} onChange={e => selectAnswer(q.id, e.target.value)}
                        placeholder="พิมพ์คำตอบ..." style={{ ...inp, fontSize: '16px' }}
                        onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    )}
                  </div>
                );
              })}

              <button onClick={submitQuiz}
                disabled={Object.keys(studentAnswers).length === 0}
                style={{
                  width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
                  background: Object.keys(studentAnswers).length > 0
                    ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : '#e2e8f0',
                  color: Object.keys(studentAnswers).length > 0 ? '#fff' : '#94a3b8',
                  cursor: Object.keys(studentAnswers).length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 800, fontSize: '20px', fontFamily: FONT, marginTop: '8px',
                  boxShadow: Object.keys(studentAnswers).length > 0 ? `0 4px 20px ${CI.cyan}30` : 'none',
                }}>
                📩 ส่งคำตอบ ({Object.keys(studentAnswers).length}/{studentQuiz.questions.length} ข้อ)
              </button>
            </div>
          )}

          {/* Results */}
          {studentSubmitted && studentResults && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '44px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '72px', marginBottom: '8px' }}>
                {studentResults.score === studentResults.total ? '🏆' : studentResults.score >= studentResults.total / 2 ? '👏' : '📚'}
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 900, color: '#1e293b' }}>ผลลัพธ์</h2>
              <div style={{
                fontSize: '56px', fontWeight: 900, margin: '16px 0',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {studentResults.score}/{studentResults.total}
              </div>
              <div style={{ fontSize: '18px', color: '#64748b', marginBottom: '28px' }}>
                {studentResults.score === studentResults.total ? 'เยี่ยมมาก! ได้เต็ม! 🎉' :
                 studentResults.score >= studentResults.total / 2 ? 'ทำได้ดี! 💪' : 'ลองทบทวนอีกครั้งนะ 📖'}
              </div>

              {/* Question results */}
              <div style={{ textAlign: 'left' }}>
                {studentResults.results.map((r, i) => {
                  const q = studentQuiz.questions[i];
                  return (
                    <div key={i} style={{
                      padding: '16px 20px', borderRadius: '14px', marginBottom: '10px',
                      background: r.correct ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${r.correct ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px' }}>{r.correct ? '✅' : '❌'}</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>Q{i + 1}: {q.text}</span>
                      </div>
                      {!r.correct && (
                        <div style={{ fontSize: '14px', color: '#64748b', paddingLeft: '28px' }}>
                          เฉลย: {q.type === 'mc' ? q.options[q.answer] : q.type === 'tf' ? (q.answer === 0 ? 'ถูก' : 'ผิด') : q.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' };
const inp = {
  width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0',
  fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit',
  transition: 'border 0.2s',
};

'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// Generate fingerprint from browser properties
function getBrowserFingerprint() {
  const nav = navigator;
  const str = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function generateQR(text, canvas) {
  // Use qrcode library dynamically
  import('qrcode').then(QRCode => {
    QRCode.toCanvas(canvas, text, {
      width: 220,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    }, err => {
      if (err) console.error(err);
    });
  });
}

const QUESTION_TYPES = ['MC', 'TF', 'SHORT'];

export default function SmartQuiz() {
  const [mode, setMode] = useState('teacher'); // teacher | student
  const [quiz, setQuiz] = useState({ title: '', description: '', timeLimit: 30, questions: [] });
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [studentView, setStudentView] = useState({ sessionCode: '', step: 'join', answers: {}, submitted: false });
  const [liveResults, setLiveResults] = useState({});
  const qrRef = useRef(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teacher_quiz_sessions');
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  const saveSessions = (s) => {
    setSessions(s);
    localStorage.setItem('teacher_quiz_sessions', JSON.stringify(s));
  };

  const addQuestion = () => {
    setQuiz(q => ({
      ...q,
      questions: [...q.questions, {
        id: Date.now().toString(),
        type: 'MC',
        text: '',
        options: ['', '', '', ''],
        answer: '',
        points: 1,
      }],
    }));
  };

  const updateQuestion = (idx, field, value) => {
    setQuiz(q => {
      const qs = [...q.questions];
      qs[idx] = { ...qs[idx], [field]: value };
      return { ...q, questions: qs };
    });
  };

  const updateOption = (qIdx, oIdx, value) => {
    setQuiz(q => {
      const qs = [...q.questions];
      const opts = [...qs[qIdx].options];
      opts[oIdx] = value;
      qs[qIdx] = { ...qs[qIdx], options: opts };
      return { ...q, questions: qs };
    });
  };

  const removeQuestion = (idx) => {
    setQuiz(q => ({ ...q, questions: q.questions.filter((_, i) => i !== idx) }));
  };

  const startSession = () => {
    if (!quiz.title || quiz.questions.length === 0) {
      toast.error('กรุณากรอกชื่อ Quiz และเพิ่มคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session = {
      id: code,
      quiz: { ...quiz },
      createdAt: Date.now(),
      expiresAt: Date.now() + quiz.timeLimit * 60000,
      responses: [],
      active: true,
    };
    const updated = [session, ...sessions];
    saveSessions(updated);
    setActiveSession(session);
    toast.success(`สร้าง Session สำเร็จ! Code: ${code}`);
  };

  const endSession = (sessionId) => {
    const updated = sessions.map(s => s.id === sessionId ? { ...s, active: false } : s);
    saveSessions(updated);
    if (activeSession?.id === sessionId) setActiveSession({ ...activeSession, active: false });
    toast('ปิด Session แล้ว');
  };

  // Student side: join session
  const joinSession = () => {
    const code = studentView.sessionCode.toUpperCase();
    const session = sessions.find(s => s.id === code && s.active && Date.now() < s.expiresAt);
    if (!session) {
      toast.error('ไม่พบ Session หรือหมดเวลาแล้ว');
      return;
    }
    const fp = getBrowserFingerprint();
    const alreadyAnswered = session.responses.some(r => r.fingerprint === fp);
    if (alreadyAnswered) {
      toast.error('คุณได้ตอบคำถามนี้ไปแล้ว');
      return;
    }
    setStudentView(v => ({ ...v, step: 'quiz', session, fingerprint: fp }));
  };

  const submitAnswers = () => {
    const session = sessions.find(s => s.id === studentView.session.id);
    if (!session) return;

    const fp = studentView.fingerprint || getBrowserFingerprint();
    let score = 0;
    const details = session.quiz.questions.map(q => {
      const ans = studentView.answers[q.id] || '';
      const correct = q.type === 'MC' || q.type === 'TF'
        ? ans.toLowerCase() === q.answer.toLowerCase()
        : true; // short answer: manual grade
      if (correct && (q.type === 'MC' || q.type === 'TF')) score += q.points;
      return { questionId: q.id, answer: ans, correct, points: correct ? q.points : 0 };
    });

    const response = {
      fingerprint: fp,
      submittedAt: Date.now(),
      score,
      details,
    };

    const updated = sessions.map(s =>
      s.id === session.id
        ? { ...s, responses: [...s.responses, response] }
        : s
    );
    saveSessions(updated);
    setStudentView(v => ({ ...v, submitted: true, score, total: session.quiz.questions.reduce((a, q) => a + q.points, 0) }));
    toast.success('ส่งคำตอบแล้ว!');
  };

  // Generate QR
  useEffect(() => {
    if (activeSession && qrRef.current) {
      const url = `${window.location.origin}/teacher?quiz=${activeSession.id}`;
      generateQR(url, qrRef.current);
    }
  }, [activeSession]);

  // Check if coming from QR scan
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const quizCode = params.get('quiz');
      if (quizCode) {
        setMode('student');
        setStudentView(v => ({ ...v, sessionCode: quizCode }));
      }
    }
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[{ id: 'teacher', label: '👩‍🏫 อาจารย์', }, { id: 'student', label: '👨‍🎓 นักศึกษา' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: mode === m.id ? '#fff' : 'none',
            color: mode === m.id ? '#0f766e' : '#64748b',
            fontWeight: mode === m.id ? 700 : 400,
            boxShadow: mode === m.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            fontSize: '14px', transition: 'all 0.2s',
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ===== TEACHER MODE ===== */}
      {mode === 'teacher' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeSession ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Quiz builder */}
          <div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1e293b' }}>📝 สร้าง Quiz</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  placeholder="ชื่อ Quiz *"
                  value={quiz.title}
                  onChange={e => setQuiz(q => ({ ...q, title: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  placeholder="คำอธิบาย (ไม่บังคับ)"
                  value={quiz.description}
                  onChange={e => setQuiz(q => ({ ...q, description: e.target.value }))}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>เวลา (นาที):</label>
                  <input
                    type="number" min="5" max="180"
                    value={quiz.timeLimit}
                    onChange={e => setQuiz(q => ({ ...q, timeLimit: parseInt(e.target.value) || 30 }))}
                    style={{ ...inputStyle, width: '80px' }}
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            {quiz.questions.map((q, idx) => (
              <div key={q.id} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ background: '#0d9488', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>
                    ข้อ {idx + 1}
                  </span>
                  <select
                    value={q.type}
                    onChange={e => updateQuestion(idx, 'type', e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontSize: '12px' }}
                  >
                    <option value="MC">Multiple Choice</option>
                    <option value="TF">True/False</option>
                    <option value="SHORT">Short Answer</option>
                  </select>
                  <input
                    type="number" min="1" max="10"
                    value={q.points}
                    onChange={e => updateQuestion(idx, 'points', parseInt(e.target.value) || 1)}
                    style={{ ...inputStyle, width: '60px', fontSize: '12px' }}
                    placeholder="คะแนน"
                    title="คะแนน"
                  />
                  <button onClick={() => removeQuestion(idx)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>
                    ✕
                  </button>
                </div>
                <textarea
                  placeholder="คำถาม *"
                  value={q.text}
                  onChange={e => updateQuestion(idx, 'text', e.target.value)}
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
                />
                {q.type === 'MC' && (
                  <div style={{ marginTop: '10px' }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', width: '20px' }}>{String.fromCharCode(65 + oi)}.</span>
                        <input
                          placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                          value={opt}
                          onChange={e => updateOption(idx, oi, e.target.value)}
                          style={{ ...inputStyle, flex: 1, fontSize: '13px' }}
                        />
                        <input
                          type="radio"
                          name={`correct_${q.id}`}
                          checked={q.answer === String.fromCharCode(65 + oi)}
                          onChange={() => updateQuestion(idx, 'answer', String.fromCharCode(65 + oi))}
                          title="เฉลย"
                        />
                      </div>
                    ))}
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>คลิก ○ ที่คำตอบถูกต้อง</div>
                  </div>
                )}
                {q.type === 'TF' && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    {['True', 'False'].map(opt => (
                      <label key={opt} style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="radio" name={`tf_${q.id}`} checked={q.answer === opt} onChange={() => updateQuestion(idx, 'answer', opt)} />
                        {opt === 'True' ? '✓ ถูก' : '✗ ผิด'}
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'SHORT' && (
                  <input
                    placeholder="เฉลย (สำหรับ AI ตรวจ)"
                    value={q.answer}
                    onChange={e => updateQuestion(idx, 'answer', e.target.value)}
                    style={{ ...inputStyle, marginTop: '10px', fontSize: '13px' }}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={addQuestion} style={{ ...btnStyle, background: '#f0fdfa', color: '#0f766e', border: '1px dashed #0d9488', flex: 1 }}>
                + เพิ่มคำถาม
              </button>
              <button onClick={startSession} style={{ ...btnStyle, background: '#0d9488', color: '#fff', flex: 1 }}>
                🚀 เริ่ม Session
              </button>
            </div>
          </div>

          {/* Active session + QR */}
          {activeSession && (
            <div>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #99f6e4', marginBottom: '16px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 4px', color: '#0f766e', fontSize: '16px' }}>🟢 Session Active</h3>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', letterSpacing: '4px', margin: '8px 0' }}>
                  {activeSession.id}
                </div>
                <canvas ref={qrRef} style={{ borderRadius: '12px', display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  หมดเวลา: {new Date(activeSession.expiresAt).toLocaleTimeString('th-TH')}
                </div>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/teacher?quiz=${activeSession.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success('คัดลอก URL แล้ว');
                  }}
                  style={{ ...btnStyle, background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', width: '100%', marginBottom: '8px' }}
                >
                  📋 คัดลอก URL
                </button>
                <button onClick={() => endSession(activeSession.id)} style={{ ...btnStyle, background: '#fee2e2', color: '#dc2626', width: '100%' }}>
                  ⏹ ปิด Session
                </button>
              </div>

              {/* Live results */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>
                  📊 ผลแบบ Live ({sessions.find(s => s.id === activeSession.id)?.responses?.length || 0} คน)
                </h3>
                {(sessions.find(s => s.id === activeSession.id)?.responses || []).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>คนที่ {i + 1}</span>
                    <span style={{ fontWeight: 600, color: '#0f766e' }}>{r.score} คะแนน</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>{new Date(r.submittedAt).toLocaleTimeString('th-TH')}</span>
                  </div>
                ))}
                {(sessions.find(s => s.id === activeSession.id)?.responses || []).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
                    รอนักศึกษาตอบ...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== STUDENT MODE ===== */}
      {mode === 'student' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {studentView.step === 'join' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h2 style={{ margin: '0 0 8px', color: '#1e293b' }}>เข้าร่วม Quiz</h2>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>กรอก Session Code ที่อาจารย์ให้</p>
              <input
                placeholder="Session Code (เช่น ABC123)"
                value={studentView.sessionCode}
                onChange={e => setStudentView(v => ({ ...v, sessionCode: e.target.value.toUpperCase() }))}
                style={{ ...inputStyle, fontSize: '20px', textAlign: 'center', letterSpacing: '4px', fontWeight: 700, marginBottom: '16px' }}
              />
              <button onClick={joinSession} style={{ ...btnStyle, background: '#0d9488', color: '#fff', width: '100%', padding: '14px' }}>
                เข้าร่วม →
              </button>
            </div>
          )}

          {studentView.step === 'quiz' && !studentView.submitted && (
            <div>
              <div style={{ background: '#0d9488', color: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 4px' }}>{studentView.session?.quiz.title}</h2>
                <p style={{ margin: 0, opacity: 0.85, fontSize: '13px' }}>{studentView.session?.quiz.description}</p>
              </div>
              {studentView.session?.quiz.questions.map((q, idx) => (
                <div key={q.id} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ background: '#0d9488', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                      ข้อ {idx + 1}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', borderRadius: '4px', padding: '2px 6px' }}>
                      {q.points} คะแนน
                    </span>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b', lineHeight: 1.6 }}>{q.text}</p>

                  {q.type === 'MC' && q.options.map((opt, oi) => (
                    opt && (
                      <label key={oi} style={{
                        display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 14px',
                        borderRadius: '10px', marginBottom: '6px', cursor: 'pointer',
                        border: `2px solid ${studentView.answers[q.id] === String.fromCharCode(65 + oi) ? '#0d9488' : '#e2e8f0'}`,
                        background: studentView.answers[q.id] === String.fromCharCode(65 + oi) ? '#f0fdfa' : '#fff',
                        transition: 'all 0.15s',
                      }}>
                        <input
                          type="radio" name={`sq_${q.id}`}
                          checked={studentView.answers[q.id] === String.fromCharCode(65 + oi)}
                          onChange={() => setStudentView(v => ({ ...v, answers: { ...v.answers, [q.id]: String.fromCharCode(65 + oi) } }))}
                          style={{ accentColor: '#0d9488' }}
                        />
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{String.fromCharCode(65 + oi)}.</span>
                        <span style={{ fontSize: '14px' }}>{opt}</span>
                      </label>
                    )
                  ))}

                  {q.type === 'TF' && ['True', 'False'].map(opt => (
                    <label key={opt} style={{
                      display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 14px',
                      borderRadius: '10px', marginBottom: '6px', cursor: 'pointer',
                      border: `2px solid ${studentView.answers[q.id] === opt ? '#0d9488' : '#e2e8f0'}`,
                      background: studentView.answers[q.id] === opt ? '#f0fdfa' : '#fff',
                    }}>
                      <input
                        type="radio" name={`sq_${q.id}`}
                        checked={studentView.answers[q.id] === opt}
                        onChange={() => setStudentView(v => ({ ...v, answers: { ...v.answers, [q.id]: opt } }))}
                        style={{ accentColor: '#0d9488' }}
                      />
                      {opt === 'True' ? '✓ ถูก' : '✗ ผิด'}
                    </label>
                  ))}

                  {q.type === 'SHORT' && (
                    <textarea
                      placeholder="พิมพ์คำตอบที่นี่..."
                      value={studentView.answers[q.id] || ''}
                      onChange={e => setStudentView(v => ({ ...v, answers: { ...v.answers, [q.id]: e.target.value } }))}
                      style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  )}
                </div>
              ))}
              <button onClick={submitAnswers} style={{ ...btnStyle, background: '#0d9488', color: '#fff', width: '100%', padding: '14px', fontSize: '15px' }}>
                ✅ ส่งคำตอบ
              </button>
            </div>
          )}

          {studentView.submitted && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', border: '1px solid #99f6e4', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ color: '#0f766e', margin: '0 0 8px' }}>ส่งคำตอบแล้ว!</h2>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>ขอบคุณที่ตอบแบบทดสอบ</p>
              <div style={{ background: '#f0fdfa', borderRadius: '12px', padding: '20px', display: 'inline-block' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#0f766e' }}>
                  {studentView.score}/{studentView.total}
                </div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>คะแนน</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past sessions */}
      {mode === 'teacher' && sessions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>📋 Session ที่ผ่านมา</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map(s => (
              <div key={s.id} style={{
                background: '#fff', borderRadius: '12px', padding: '14px 20px', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                  background: s.active && Date.now() < s.expiresAt ? '#dcfce7' : '#f1f5f9',
                  color: s.active && Date.now() < s.expiresAt ? '#16a34a' : '#94a3b8',
                }}>
                  {s.active && Date.now() < s.expiresAt ? 'Active' : 'ปิดแล้ว'}
                </span>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{s.quiz.title}</span>
                <span style={{ color: '#64748b', fontSize: '12px', marginLeft: 'auto' }}>Code: <b>{s.id}</b></span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>{s.responses.length} คน</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1e293b',
  fontFamily: 'inherit',
};

const btnStyle = {
  padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
  fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '6px', transition: 'all 0.2s', fontFamily: 'inherit',
};

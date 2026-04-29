'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import StudentSplash from '@/components/StudentSplash';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// MM:SS or HH:MM:SS → seconds
function parseTimestamp(str) {
  if (!str) return 0;
  const parts = str.split(':').map(s => parseInt(s, 10) || 0);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseInt(str, 10) || 0;
}

// Web Audio sounds — beep / correct / wrong
function playSfx(type) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const tone = (freq, start, dur, wave = 'sine', vol = 0.18) => {
      const o = ac.createOscillator(); const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = wave;
      o.frequency.setValueAtTime(freq, ac.currentTime + start);
      g.gain.setValueAtTime(vol, ac.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
      o.start(ac.currentTime + start); o.stop(ac.currentTime + start + dur + 0.01);
    };
    if (type === 'beep') {
      // Classic quiz "ปี๊บปี๊บ" alert sound
      tone(880, 0,    0.12, 'sine', 0.22);
      tone(880, 0.16, 0.12, 'sine', 0.22);
      tone(1100, 0.32, 0.18, 'sine', 0.20);
    } else if (type === 'correct') {
      // Cheerful 3-note ascending
      [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.14, 'triangle', 0.20));
    } else if (type === 'wrong') {
      // Sad 2-note descending
      tone(392, 0,    0.20, 'sawtooth', 0.18);
      tone(294, 0.18, 0.30, 'sawtooth', 0.18);
    } else if (type === 'finish') {
      // Fanfare for completion
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.24, 'triangle', 0.22));
    }
    setTimeout(() => { try { ac.close(); } catch {} }, 2500);
  } catch {}
}

async function fetchQuizFromServer(code) {
  const res = await fetch(`/api/teacher/videoquiz?code=${code.toUpperCase()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { __error: data.error || 'ไม่พบ Quiz หรือหมดอายุแล้ว' };
  return data;
}

async function submitToServer(code, submission) {
  const res = await fetch('/api/teacher/videoquiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'submit', code, ...submission }),
  });
  return res.ok;
}

const lbl = { fontSize: '15px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' };
const inp = {
  width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0',
  fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit',
  transition: 'border 0.2s',
};

function VideoQuizStudentInner() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [studentCode, setStudentCode] = useState(codeParam.toUpperCase());
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentQuiz, setStudentQuiz] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [studentSubmitted, setStudentSubmitted] = useState(false);
  const [studentResults, setStudentResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // seconds remaining
  // Pop-up quiz state
  const [popupQ,         setPopupQ]         = useState(null);  // current question being asked
  const [popupSelected,  setPopupSelected]  = useState(null);
  const [popupFeedback,  setPopupFeedback]  = useState(null);  // 'correct' | 'wrong' | null
  const [askedQIds,      setAskedQIds]      = useState({});    // {id: true} — already asked
  const [ytReady,        setYtReady]        = useState(false);
  const [videoFinished,  setVideoFinished]  = useState(false);
  const [watchProgress,  setWatchProgress]  = useState(0);     // 0..1
  const [skipToast,      setSkipToast]      = useState(false);

  const timerRef    = useRef(null);
  const answersRef  = useRef({});
  const quizRef     = useRef(null);
  const codeRef     = useRef('');
  const playerRef   = useRef(null);
  const playerDivId = useRef('yt-player-' + Math.random().toString(36).slice(2, 8));
  const watchRef    = useRef(null);
  const askedRef    = useRef({});
  const maxWatchedRef = useRef(0);   // highest currentTime user has reached

  // Keep refs in sync for use inside timer callback
  useEffect(() => { answersRef.current = studentAnswers; }, [studentAnswers]);

  const doSubmit = useCallback(async (answers, quiz, code, name, sid, timedOut = false) => {
    if (!quiz) return;
    clearInterval(timerRef.current);
    const results = quiz.questions.map(q => {
      const userAnswer = answers[q.id];
      let correct = false;
      if (q.type === 'mc' || q.type === 'tf') {
        correct = q.answer !== null && userAnswer === q.answer;
      } else if (q.type === 'short') {
        correct = q.answer && typeof userAnswer === 'string' && typeof q.answer === 'string' &&
          userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
      }
      return { questionId: q.id, userAnswer, correctAnswer: q.answer, correct };
    });
    const score = results.filter(r => r.correct).length;
    const total = results.length;
    setStudentResults({ results, score, total, timedOut });
    setStudentSubmitted(true);
    setTimeLeft(0);
    await submitToServer(code, { name, studentId: sid, answers, score, total });
    if (timedOut) {
      toast('⏰ หมดเวลา! เฉลยอัตโนมัติ', { icon: '🔔', duration: 4000 });
    } else {
      toast.success(`ส่งคำตอบแล้ว! ได้ ${score}/${total} คะแนน`);
    }
  }, []);

  const joinQuiz = async () => {
    if (!studentCode) { toast.error('กรุณากรอกรหัส Quiz'); return; }
    if (!studentName) { toast.error('กรุณากรอกชื่อ-นามสกุล'); return; }
    toast.loading('กำลังโหลด Quiz...', { id: 'join' });
    const quiz = await fetchQuizFromServer(studentCode);
    toast.dismiss('join');
    if (!quiz || quiz.__error) { toast.error(quiz?.__error || 'ไม่พบ Quiz หรือหมดอายุแล้ว — กรุณาตรวจสอบรหัส', { duration: 5000 }); return; }
    quizRef.current = quiz;
    codeRef.current = studentCode;
    setStudentQuiz(quiz);
    setStudentAnswers({});
    answersRef.current = {};
    setStudentSubmitted(false);
    setStudentResults(null);
    toast.success(`เข้าร่วม "${quiz.title}" แล้ว! 🎬`);

    // Start countdown if timeLimit set
    if (quiz.timeLimit > 0) {
      setTimeLeft(quiz.timeLimit);
      let remaining = quiz.timeLimit;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          doSubmit(answersRef.current, quizRef.current, codeRef.current, studentName, studentId, true);
        }
      }, 1000);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(watchRef.current);
    try { playerRef.current?.destroy?.(); } catch {}
  }, []);

  // Keep askedRef in sync
  useEffect(() => { askedRef.current = askedQIds; }, [askedQIds]);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) { setYtReady(true); return; }
    const existing = document.getElementById('yt-iframe-api');
    if (!existing) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) { setYtReady(true); clearInterval(interval); }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Initialize player when quiz loaded + API ready
  const ytIdForInit = studentQuiz ? getYouTubeId(studentQuiz.videoUrl) : null;
  useEffect(() => {
    if (!studentQuiz || !ytReady || !ytIdForInit || studentSubmitted) return;
    if (playerRef.current) return; // already initialized

    // small delay to ensure div is in DOM
    const initTimer = setTimeout(() => {
      const div = document.getElementById(playerDivId.current);
      if (!div) return;
      try {
        playerRef.current = new window.YT.Player(playerDivId.current, {
          videoId: ytIdForInit,
          // controls=1 so student can press PLAY (we still anti-skip in code)
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, controls: 1 },
          events: {
            onReady: () => {
              maxWatchedRef.current = 0;
              setVideoFinished(false);

              // ── Auto-rescale question timestamps to fit actual video duration
              // Default distribution: 30%, 50%, 80% for 3 questions
              try {
                const dur = playerRef.current.getDuration?.() || 0;
                if (dur > 0 && quizRef.current?.questions) {
                  const qs = quizRef.current.questions;
                  const maxQ = Math.max(...qs.map(q => parseTimestamp(q.timestamp) || 0));
                  if (maxQ > dur - 5) {
                    const sorted = [...qs].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
                    const PCTS_3 = [0.30, 0.50, 0.80];
                    sorted.forEach((q, i) => {
                      const pct = sorted.length === 3
                        ? PCTS_3[i]
                        : 0.25 + (i * 0.6) / Math.max(1, sorted.length - 1);
                      const sec = Math.floor(dur * pct);
                      const m = Math.floor(sec / 60);
                      const s = sec % 60;
                      q.timestamp = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                    });
                  }
                }
              } catch {}

              clearInterval(watchRef.current);
              watchRef.current = setInterval(() => {
                if (!playerRef.current?.getCurrentTime) return;
                const t = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration?.() || 0;

                // ── Anti-skip: snap back if user jumps forward > 3.5s ahead
                if (t > maxWatchedRef.current + 3.5) {
                  try { playerRef.current.seekTo(maxWatchedRef.current, true); } catch {}
                  setSkipToast(true);
                  clearTimeout(window.__skipTimer);
                  window.__skipTimer = setTimeout(() => setSkipToast(false), 2200);
                  return;
                }
                if (t > maxWatchedRef.current) maxWatchedRef.current = t;

                // ── Watch progress display
                if (dur > 0) setWatchProgress(Math.min(1, t / dur));

                // ── Detect finish (within 1.2s of end)
                if (dur > 0 && t >= dur - 1.2) setVideoFinished(true);

                // ── Trigger question pop-up (window: qSec-1.0 .. qSec+3.0)
                const qs = quizRef.current?.questions || [];
                for (const q of qs) {
                  const qSec = parseTimestamp(q.timestamp);
                  if (askedRef.current[q.id]) continue;
                  if (qSec > 0 && t >= qSec - 1.0 && t <= qSec + 3.0) {
                    askedRef.current = { ...askedRef.current, [q.id]: true };
                    setAskedQIds(askedRef.current);
                    try { playerRef.current.pauseVideo(); } catch {}
                    setPopupSelected(null);
                    setPopupFeedback(null);
                    setPopupQ(q);
                    playSfx('beep');
                    return;
                  }
                }
              }, 250);
            },
            onStateChange: (e) => {
              // 0 = ended → mark finished, play fanfare, auto-submit
              if (e.data === 0) {
                setVideoFinished(true);
                playSfx('finish');
                if (!studentSubmitted) {
                  doSubmit(answersRef.current, quizRef.current, codeRef.current, studentName, studentId, false);
                }
              }
            },
          },
        });
      } catch (e) {
        console.warn('YT init error', e);
      }
    }, 100);

    return () => clearTimeout(initTimer);
  }, [studentQuiz, ytReady, ytIdForInit, studentSubmitted, studentName, studentId, doSubmit]);

  // Handle pop-up answer
  const submitPopupAnswer = () => {
    if (!popupQ || popupSelected === null) return;
    const correct = popupQ.answer !== null && popupSelected === popupQ.answer;
    setPopupFeedback(correct ? 'correct' : 'wrong');
    playSfx(correct ? 'correct' : 'wrong');
    // Save answer
    setStudentAnswers(prev => {
      const next = { ...prev, [popupQ.id]: popupSelected };
      answersRef.current = next;
      return next;
    });
    // After 1.8s, close pop-up and resume video
    setTimeout(() => {
      setPopupQ(null);
      setPopupSelected(null);
      setPopupFeedback(null);
      try { playerRef.current?.playVideo(); } catch {}
    }, 1800);
  };

  const skipPopup = () => {
    if (!popupQ) return;
    // Mark as unanswered, resume
    setPopupQ(null); setPopupSelected(null); setPopupFeedback(null);
    try { playerRef.current?.playVideo(); } catch {}
  };

  const selectAnswer = (qId, value) => {
    if (studentSubmitted) return;
    setStudentAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const submitQuiz = () => doSubmit(answersRef.current, quizRef.current, codeRef.current, studentName, studentId, false);

  function formatTimeLeft(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  const ytId = studentQuiz ? getYouTubeId(studentQuiz.videoUrl) : null;
  const answeredCount = Object.keys(studentAnswers).length;
  const totalQ = studentQuiz ? studentQuiz.questions.length : 0;

  // ===== STEP 1 — Join Screen =====
  if (!studentQuiz) {
    const canJoin = studentCode && studentName;
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0f9ff 0%, #fdf2ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: FONT,
      }}>
        <div style={{
          background: '#fff', borderRadius: '28px', padding: '40px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          width: '100%', maxWidth: '440px',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '56px', marginBottom: '10px' }}>🎬</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 900, color: '#1e293b' }}>
              Video Quiz
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px' }}>
              กรอกข้อมูลเพื่อเข้าทำ Quiz
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Quiz Code */}
            <div>
              <label style={lbl}>รหัส Quiz</label>
              <input
                placeholder="เช่น AB12X"
                value={studentCode}
                onChange={e => setStudentCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{
                  ...inp,
                  textAlign: 'center', fontSize: '32px', letterSpacing: '10px',
                  fontWeight: 900, padding: '14px',
                  borderColor: studentCode ? CI.cyan : '#e2e8f0',
                }}
                onFocus={e => e.target.style.borderColor = CI.cyan}
                onBlur={e => e.target.style.borderColor = studentCode ? CI.cyan : '#e2e8f0'}
              />
            </div>

            {/* Student Name */}
            <div>
              <label style={lbl}>ชื่อ-นามสกุล <span style={{ color: CI.magenta }}>*</span></label>
              <input
                placeholder="ชื่อ-นามสกุล"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && joinQuiz()}
                style={inp}
                onFocus={e => e.target.style.borderColor = CI.magenta}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Student ID (optional) */}
            <div>
              <label style={{ ...lbl, color: '#94a3b8' }}>
                รหัสนักศึกษา <span style={{ fontWeight: 400, fontSize: '13px' }}>(ถ้ามี)</span>
              </label>
              <input
                placeholder="เช่น 6512345678"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                style={inp}
                onFocus={e => e.target.style.borderColor = CI.purple}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Join button */}
            <button
              onClick={joinQuiz}
              disabled={!canJoin}
              style={{
                padding: '18px', borderRadius: '16px', border: 'none',
                background: canJoin
                  ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`
                  : '#e2e8f0',
                color: canJoin ? '#fff' : '#94a3b8',
                cursor: canJoin ? 'pointer' : 'not-allowed',
                fontWeight: 900, fontSize: '20px', fontFamily: FONT,
                boxShadow: canJoin ? `0 6px 20px ${CI.cyan}40` : 'none',
                transition: 'all 0.2s',
                letterSpacing: '1px',
              }}
            >
              เข้าร่วม
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== STEP 3 — Results Screen =====
  if (studentSubmitted && studentResults) {
    const pct = Math.round((studentResults.score / studentResults.total) * 100);
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px 16px', fontFamily: FONT }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Score card */}
          <div style={{
            background: `linear-gradient(135deg, ${CI.dark} 0%, #1a1a4e 100%)`,
            borderRadius: '28px', padding: '40px 32px', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(11,11,36,0.25)', marginBottom: '20px',
            animation: 'fadeUp 0.4s ease',
          }}>
            {studentResults.timedOut && (
              <div style={{
                background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '12px', padding: '10px 18px', marginBottom: '24px',
                fontSize: '15px', fontWeight: 700, color: '#fca5a5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                ⏰ หมดเวลา — ส่งอัตโนมัติ
              </div>
            )}

            <div style={{ fontSize: '60px', marginBottom: '8px' }}>
              {studentResults.score === studentResults.total ? '🏆' : studentResults.score >= studentResults.total / 2 ? '👏' : '📚'}
            </div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              🎓 {studentName}{studentId ? ` | 🎫 ${studentId}` : ''}
            </div>

            {/* Big score */}
            <div style={{
              fontSize: '80px', fontWeight: 900, lineHeight: 1,
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.gold})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: '16px 0 8px',
            }}>
              {studentResults.score}/{studentResults.total}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
              {pct}% &nbsp;•&nbsp;{' '}
              {studentResults.score === studentResults.total
                ? 'เยี่ยมมาก! ได้เต็ม! 🎉'
                : studentResults.score >= studentResults.total / 2
                ? 'ทำได้ดี! 💪'
                : 'ลองทบทวนอีกครั้งนะ 📖'}
            </div>
          </div>

          {/* Question review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {studentResults.results.map((r, i) => {
              const q = studentQuiz.questions[i];
              const correctLabel = q.type === 'mc'
                ? (q.options?.[q.answer] ?? `ข้อ ${String.fromCharCode(65 + q.answer)}`)
                : q.type === 'tf' ? (q.answer === 0 ? '✓ ถูก' : '✗ ผิด')
                : q.answer;
              const userLabel = r.userAnswer === undefined ? '(ไม่ได้ตอบ)'
                : q.type === 'mc' ? (q.options?.[r.userAnswer] ?? `ข้อ ${String.fromCharCode(65 + r.userAnswer)}`)
                : q.type === 'tf' ? (r.userAnswer === 0 ? '✓ ถูก' : '✗ ผิด')
                : r.userAnswer;

              return (
                <div key={i} style={{
                  background: '#fff', borderRadius: '18px', padding: '20px',
                  border: `2px solid ${r.correct ? '#bbf7d0' : '#fecaca'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                }}>
                  {/* Question header */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '22px', flexShrink: 0, lineHeight: 1,
                    }}>{r.correct ? '✅' : '❌'}</span>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                        ข้อ {i + 1}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', lineHeight: 1.5 }}>
                        {q.text}
                      </span>
                    </div>
                  </div>

                  {/* Answer details */}
                  <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{
                      fontSize: '14px', fontWeight: 700, color: '#16a34a',
                      background: '#f0fdf4', borderRadius: '8px', padding: '6px 12px',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}>
                      ✓ เฉลย: {correctLabel}
                    </div>
                    {!r.correct && (
                      <div style={{
                        fontSize: '14px', color: '#ef4444', fontWeight: 600,
                        background: '#fef2f2', borderRadius: '8px', padding: '6px 12px',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                      }}>
                        ✗ คำตอบของคุณ: {userLabel}
                      </div>
                    )}
                    {r.correct && (
                      <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                        ✅ ถูก
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ===== STEP 2 — Quiz Screen =====
  const timePct = studentQuiz.timeLimit > 0 && timeLeft !== null
    ? Math.max(0, (timeLeft / studentQuiz.timeLimit) * 100) : 100;
  const timerRed = timeLeft !== null && timeLeft <= 60;
  const timerPulse = timeLeft !== null && timeLeft <= 30;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: FONT }}>
      <style>{`@keyframes timerPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.06)}}`}</style>

      {/* Sticky timer bar at top */}
      {timeLeft !== null && studentQuiz.timeLimit > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: timerRed ? '#ef4444' : CI.dark,
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
            {studentQuiz.title}
          </div>
          <div style={{
            fontSize: '26px', fontWeight: 900, fontFamily: "'Courier New', monospace",
            color: '#fff',
            animation: timerPulse ? 'timerPulse 0.8s ease-in-out infinite' : 'none',
          }}>
            ⏱️ {formatTimeLeft(timeLeft)}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {timeLeft !== null && studentQuiz.timeLimit > 0 && (
        <div style={{ height: '5px', background: 'rgba(0,0,0,0.08)' }}>
          <div style={{
            height: '100%', transition: 'width 1s linear, background 1s',
            width: `${timePct}%`,
            background: timerRed ? '#ef4444' : timePct < 30 ? '#f59e0b' : CI.cyan,
          }} />
        </div>
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>

        {/* YouTube embed (controlled via IFrame API for timed quizzes) */}
        {ytId && (
          <div style={{
            borderRadius: '20px', overflow: 'hidden', marginBottom: '20px',
            background: '#000', boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            position: 'relative', paddingTop: '56.25%', /* 16:9 */
          }}>
            <div
              id={playerDivId.current}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Skip-blocked floating toast */}
        {skipToast && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: '#ef4444', color: '#fff',
            padding: '12px 22px', borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(239,68,68,0.5)',
            fontSize: '14px', fontWeight: 800, zIndex: 250,
            animation: 'popupBounce 0.4s ease',
          }}>
            🚫 ห้ามข้าม! ต้องดูตามลำดับ
          </div>
        )}

        {/* Hint banner about timed pop-ups */}
        {studentQuiz.questions.some(q => parseTimestamp(q.timestamp) > 0) && !studentSubmitted && (
          <div style={{
            background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: '1px solid #fbbf24', borderRadius: '14px',
            padding: '12px 18px', marginBottom: '16px',
            color: '#92400e', fontSize: '14px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '22px' }}>🔔</span>
            <span>ขณะดูคลิป จะมีคำถามเด้งขึ้นมาอัตโนมัติพร้อมเสียงปี๊บ — ตอบให้ครบเพื่อรับคะแนน!</span>
          </div>
        )}

        {/* ===== POP-UP QUESTION MODAL ===== */}
        {popupQ && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            animation: 'popupFade 0.3s ease',
          }}>
            <style>{`
              @keyframes popupFade { from{opacity:0} to{opacity:1} }
              @keyframes popupBounce { 0%{opacity:0;transform:scale(0.7) translateY(40px)} 60%{opacity:1;transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
              @keyframes correctFlash { 0%,100%{background:linear-gradient(135deg,#dcfce7,#bbf7d0)} 50%{background:linear-gradient(135deg,#86efac,#4ade80)} }
              @keyframes wrongShake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
            `}</style>
            <div style={{
              maxWidth: '520px', width: '100%',
              background: '#fff', borderRadius: '24px',
              padding: '28px 24px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              animation: popupFeedback === 'wrong' ? 'wrongShake 0.4s ease' : 'popupBounce 0.45s cubic-bezier(0.34,1.56,0.64,1)',
              border: `3px solid ${
                popupFeedback === 'correct' ? '#22c55e' :
                popupFeedback === 'wrong'   ? '#ef4444' :
                CI.cyan
              }`,
              transition: 'border-color 0.3s',
            }}>
              {/* Alert header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                  color: '#fff', borderRadius: '12px', padding: '6px 14px',
                  fontSize: '13px', fontWeight: 900, letterSpacing: '1px',
                }}>🔔 คำถามเด้งขึ้น!</div>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>⏱️ {popupQ.timestamp}</span>
              </div>

              {/* Question */}
              <h3 style={{
                margin: '0 0 18px', fontSize: '20px', fontWeight: 800,
                color: '#1e293b', lineHeight: 1.4,
              }}>
                {popupQ.text}
              </h3>

              {/* Options (MC) */}
              {popupQ.type === 'mc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {popupQ.options.filter(o => o).map((opt, oi) => {
                    const selected = popupSelected === oi;
                    const isCorrectAns = oi === popupQ.answer;
                    const showCorrect = popupFeedback && isCorrectAns;
                    const showWrong   = popupFeedback === 'wrong' && selected && !isCorrectAns;
                    let bg = '#fafafa', borderColor = '#e2e8f0', color = '#475569';
                    if (showCorrect) { bg = '#dcfce7'; borderColor = '#22c55e'; color = '#166534'; }
                    else if (showWrong) { bg = '#fee2e2'; borderColor = '#ef4444'; color = '#991b1b'; }
                    else if (selected) { bg = `${CI.cyan}15`; borderColor = CI.cyan; color = CI.cyan; }
                    return (
                      <button
                        key={oi}
                        onClick={() => !popupFeedback && setPopupSelected(oi)}
                        disabled={!!popupFeedback}
                        style={{
                          padding: '14px 16px', borderRadius: '14px', textAlign: 'left',
                          border: `2px solid ${borderColor}`, background: bg, color,
                          cursor: popupFeedback ? 'default' : 'pointer',
                          fontSize: '16px', fontFamily: FONT, fontWeight: selected || showCorrect ? 700 : 500,
                          display: 'flex', alignItems: 'center', gap: '12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{
                          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '15px', fontWeight: 900,
                          background: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : (selected ? CI.cyan : '#f1f5f9'),
                          color: (showCorrect || showWrong || selected) ? '#fff' : '#94a3b8',
                        }}>
                          {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + oi)}
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TF */}
              {popupQ.type === 'tf' && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  {[{ label: '✓ ถูก', val: 0 }, { label: '✗ ผิด', val: 1 }].map(({ label, val }) => {
                    const selected = popupSelected === val;
                    const isCorrectAns = val === popupQ.answer;
                    const showCorrect = popupFeedback && isCorrectAns;
                    const showWrong = popupFeedback === 'wrong' && selected && !isCorrectAns;
                    let bg = '#fafafa', borderColor = '#e2e8f0', color = '#64748b';
                    if (showCorrect) { bg = '#dcfce7'; borderColor = '#22c55e'; color = '#166534'; }
                    else if (showWrong) { bg = '#fee2e2'; borderColor = '#ef4444'; color = '#991b1b'; }
                    else if (selected) { bg = `${CI.cyan}15`; borderColor = CI.cyan; color = CI.cyan; }
                    return (
                      <button key={val}
                        onClick={() => !popupFeedback && setPopupSelected(val)}
                        disabled={!!popupFeedback}
                        style={{
                          flex: 1, padding: '18px', borderRadius: '14px',
                          border: `2px solid ${borderColor}`, background: bg, color,
                          cursor: popupFeedback ? 'default' : 'pointer',
                          fontSize: '20px', fontFamily: FONT, fontWeight: 700,
                        }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Feedback message */}
              {popupFeedback === 'correct' && (
                <div style={{
                  background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
                  border: '2px solid #22c55e', borderRadius: '12px',
                  padding: '12px 16px', marginBottom: '14px',
                  color: '#166534', fontWeight: 800, fontSize: '16px',
                  textAlign: 'center', animation: 'correctFlash 0.6s ease 2',
                }}>
                  🎉 ถูกต้อง! เก่งมาก
                </div>
              )}
              {popupFeedback === 'wrong' && (
                <div style={{
                  background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
                  border: '2px solid #ef4444', borderRadius: '12px',
                  padding: '12px 16px', marginBottom: '14px',
                  color: '#991b1b', fontWeight: 800, fontSize: '16px',
                  textAlign: 'center',
                }}>
                  ❌ ยังไม่ถูก — ดูเฉลยข้างบน
                  {popupQ.explanation && (
                    <div style={{ fontWeight: 500, fontSize: '13px', marginTop: '6px', color: '#7f1d1d' }}>
                      💡 {popupQ.explanation}
                    </div>
                  )}
                </div>
              )}

              {/* Submit button (only when not yet shown feedback) */}
              {!popupFeedback && (
                <button
                  onClick={submitPopupAnswer}
                  disabled={popupSelected === null}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                    background: popupSelected !== null
                      ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`
                      : '#e2e8f0',
                    color: popupSelected !== null ? '#fff' : '#94a3b8',
                    cursor: popupSelected !== null ? 'pointer' : 'not-allowed',
                    fontSize: '17px', fontWeight: 900, fontFamily: FONT,
                    boxShadow: popupSelected !== null ? `0 6px 20px ${CI.cyan}40` : 'none',
                  }}
                >
                  ส่งคำตอบ
                </button>
              )}
            </div>
          </div>
        )}

        {/* Student info + progress badge */}
        <div style={{
          background: '#fff', borderRadius: '14px', padding: '12px 18px', marginBottom: '16px',
          border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px', color: '#0369a1' }}>
            <span>🎓 <strong>{studentName}</strong></span>
            {studentId && (
              <>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span>🎫 <strong>{studentId}</strong></span>
              </>
            )}
          </div>
          <div style={{
            fontSize: '13px', fontWeight: 700, color: CI.cyan,
            background: `${CI.cyan}10`, borderRadius: '8px', padding: '4px 12px',
          }}>
            ตอบแล้ว {answeredCount}/{totalQ}
          </div>
        </div>

        {/* Quiz title */}
        <div style={{
          background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`,
          borderRadius: '16px', padding: '16px 20px', marginBottom: '18px', color: '#fff',
        }}>
          <div style={{ fontSize: '18px', fontWeight: 800 }}>{studentQuiz.title}</div>
          <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '2px' }}>
            {totalQ} คำถาม {studentQuiz.timeLimit > 0 ? `• ${Math.ceil(studentQuiz.timeLimit / 60)} นาที` : ''}
          </div>
        </div>

        {/* Questions — only show ones already triggered (askedQIds) */}
        {studentQuiz.questions.filter(q => askedQIds[q.id]).length > 0 && (
          <div style={{
            fontSize: '13px', color: '#94a3b8', fontWeight: 700,
            marginBottom: '10px', letterSpacing: '0.05em',
          }}>
            ✅ คำถามที่ตอบแล้ว ({studentQuiz.questions.filter(q => askedQIds[q.id]).length}/{totalQ})
          </div>
        )}
        {studentQuiz.questions.filter(q => askedQIds[q.id]).map((q) => {
          const idx = studentQuiz.questions.indexOf(q);
          const answered = studentAnswers[q.id] !== undefined;
          return (
            <div key={q.id} style={{
              background: '#fff', borderRadius: '20px', padding: '22px', marginBottom: '14px',
              border: `2px solid ${answered ? '#86efac' : '#e2e8f0'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              {/* Question header */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                  color: '#fff', borderRadius: '10px', padding: '5px 13px',
                  fontSize: '14px', fontWeight: 800, flexShrink: 0,
                }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>⏱️ {q.timestamp}</span>
                {answered && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '12px', color: '#16a34a', fontWeight: 700,
                    background: '#dcfce7', padding: '3px 10px', borderRadius: '8px',
                  }}>✓ ตอบแล้ว</span>
                )}
              </div>

              <h4 style={{ margin: '0 0 16px', fontSize: '17px', color: '#1e293b', fontWeight: 700, lineHeight: 1.5 }}>
                {q.text}
              </h4>

              {q.type === 'mc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.filter(o => o).map((opt, oi) => {
                    const selected = studentAnswers[q.id] === oi;
                    return (
                      <button key={oi} onClick={() => selectAnswer(q.id, oi)} style={{
                        padding: '13px 16px', borderRadius: '14px', textAlign: 'left',
                        border: `2px solid ${selected ? CI.cyan : '#e2e8f0'}`,
                        background: selected ? `${CI.cyan}10` : '#fafafa',
                        color: selected ? CI.cyan : '#475569',
                        cursor: 'pointer', fontSize: '15px', fontFamily: FONT,
                        fontWeight: selected ? 700 : 500,
                        display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'all 0.15s',
                        boxShadow: selected ? `0 2px 12px ${CI.cyan}25` : 'none',
                      }}>
                        <span style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 800,
                          background: selected ? CI.cyan : '#f1f5f9',
                          color: selected ? '#fff' : '#94a3b8',
                        }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'tf' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[{ label: '✓ ถูก', val: 0 }, { label: '✗ ผิด', val: 1 }].map(({ label, val }) => {
                    const selected = studentAnswers[q.id] === val;
                    return (
                      <button key={val} onClick={() => selectAnswer(q.id, val)} style={{
                        flex: 1, padding: '16px', borderRadius: '14px', textAlign: 'center',
                        border: `2px solid ${selected ? CI.cyan : '#e2e8f0'}`,
                        background: selected ? `${CI.cyan}10` : '#fafafa',
                        color: selected ? CI.cyan : '#64748b',
                        cursor: 'pointer', fontSize: '18px', fontFamily: FONT, fontWeight: 700,
                        transition: 'all 0.15s',
                        boxShadow: selected ? `0 2px 12px ${CI.cyan}25` : 'none',
                      }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'short' && (
                <input
                  value={studentAnswers[q.id] || ''}
                  onChange={e => selectAnswer(q.id, e.target.value)}
                  placeholder="พิมพ์คำตอบ..."
                  style={{ ...inp, fontSize: '16px' }}
                  onFocus={e => e.target.style.borderColor = CI.cyan}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              )}
            </div>
          );
        })}

        {/* Watch progress badge */}
        <div style={{
          background: videoFinished ? '#dcfce7' : '#fef3c7',
          border: `2px solid ${videoFinished ? '#22c55e' : '#fbbf24'}`,
          borderRadius: '14px', padding: '12px 16px', marginTop: '12px', marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '22px' }}>{videoFinished ? '✅' : '🎬'}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px', fontWeight: 800,
              color: videoFinished ? '#166534' : '#92400e',
            }}>
              {videoFinished ? 'ดูจบแล้ว — ส่งคำตอบได้' : `ดูคลิป ${Math.round(watchProgress*100)}% — ต้องดูจบก่อนส่งคำตอบ`}
            </div>
            <div style={{
              marginTop: 6, height: 6, background: 'rgba(0,0,0,0.08)',
              borderRadius: 3, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.round(watchProgress*100)}%`,
                background: videoFinished ? '#22c55e' : '#fbbf24',
                transition: 'width 0.3s linear',
              }} />
            </div>
          </div>
        </div>

        {/* Submit button — locked until video finishes */}
        <button
          onClick={submitQuiz}
          disabled={!videoFinished || answeredCount === 0}
          style={{
            width: '100%', padding: '20px', borderRadius: '18px', border: 'none',
            background: (videoFinished && answeredCount > 0)
              ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`
              : '#e2e8f0',
            color: (videoFinished && answeredCount > 0) ? '#fff' : '#94a3b8',
            cursor: (videoFinished && answeredCount > 0) ? 'pointer' : 'not-allowed',
            fontWeight: 900, fontSize: '20px', fontFamily: FONT, marginTop: '8px',
            boxShadow: (videoFinished && answeredCount > 0) ? `0 6px 24px ${CI.cyan}35` : 'none',
            transition: 'all 0.2s',
            letterSpacing: '1px',
          }}
        >
          {!videoFinished
            ? `🔒 ดูคลิปให้จบก่อน (${Math.round(watchProgress*100)}%)`
            : `ส่งคำตอบ (${answeredCount}/${totalQ} ข้อ)`}
        </button>

        <div style={{ height: '32px' }} />
      </div>
    </div>
  );
}

export default function StudentVideoQuizPage() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <>
      {showSplash && <StudentSplash duration={2200} onFinish={() => setShowSplash(false)} />}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: CI.dark, color: '#fff', fontSize: '16px', borderRadius: '10px', fontFamily: FONT },
        }}
      />
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: FONT }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
            <div style={{ fontSize: '18px', color: '#64748b' }}>กำลังโหลด...</div>
          </div>
        </div>
      }>
        <VideoQuizStudentInner />
      </Suspense>
    </>
  );
}

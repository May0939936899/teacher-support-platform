'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const FONT = "'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const OPT_STYLE = {
  A: { bg: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: '#3b82f6', emoji: '🔵' },
  B: { bg: 'linear-gradient(135deg,#7c2d12,#c2410c)', border: '#f97316', emoji: '🔴' },
  C: { bg: 'linear-gradient(135deg,#14532d,#16a34a)', border: '#22c55e', emoji: '🟢' },
  D: { bg: 'linear-gradient(135deg,#6b21a8,#9333ea)', border: '#a855f7', emoji: '🟣' },
};

function genVoterId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function StudentMillionaireInner() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room') || '';

  const [room, setRoom] = useState(roomParam);
  const [roomInput, setRoomInput] = useState('');
  const [phase, setPhase] = useState(roomParam ? 'loading' : 'join');
  // loading | waiting | question | voted | revealed | error
  const [questionData, setQuestionData] = useState(null);
  const [voted, setVoted] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [totalVoters, setTotalVoters] = useState(0);
  const [error, setError] = useState('');
  const voterIdRef = useRef(null);
  const questionIndexRef = useRef(-1);

  // Stable voter ID in localStorage
  useEffect(() => {
    let id = '';
    try { id = localStorage.getItem('mill_voter_id') || ''; } catch {}
    if (!id) {
      id = genVoterId();
      try { localStorage.setItem('mill_voter_id', id); } catch {}
    }
    voterIdRef.current = id;
  }, []);

  // Poll for question state
  useEffect(() => {
    if (!room || phase === 'join' || phase === 'error') return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/teacher/millionaire?room=${room}&action=get_question`);
        if (res.status === 404) { setError('ห้องนี้ไม่พบหรือปิดแล้ว'); setPhase('error'); return; }
        if (!res.ok) return;
        const data = await res.json();

        // New question arrived → reset voted state
        if (data.questionIndex !== questionIndexRef.current && data.question) {
          questionIndexRef.current = data.questionIndex;
          setQuestionData(data.question);
          setVoted(null);
          setCorrectAnswer(null);
          if (data.revealed) {
            setCorrectAnswer(data.correctAnswer);
            setPhase('revealed');
          } else {
            setPhase('question');
          }
          return;
        }

        if (!data.question) { setPhase('waiting'); return; }

        setQuestionData(data.question);

        if (data.revealed && phase !== 'revealed') {
          setCorrectAnswer(data.correctAnswer);
          setPhase('revealed');
        }
      } catch {}
    };

    poll();
    const iv = setInterval(poll, 2500);
    return () => clearInterval(iv);
  }, [room, phase]);

  const joinRoom = () => {
    const code = roomInput.trim().toUpperCase();
    if (code.length < 4) return;
    setRoom(code);
    setPhase('loading');
  };

  const vote = async (answer) => {
    if (voted || phase !== 'question') return;
    setVoted(answer);
    setPhase('voted');
    try {
      const res = await fetch('/api/teacher/millionaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', room, answer, voterId: voterIdRef.current }),
      });
      const d = await res.json();
      if (d.votes) {
        setTotalVoters(Object.values(d.votes).reduce((a, b) => a + b, 0));
      }
    } catch {}
  };

  // ── Screens ─────────────────────────────────────────────────

  // Join screen (no room in URL)
  if (phase === 'join') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0b0b24,#1a1a3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎰</div>
        <h2 style={{ color: '#ffd700', fontSize: 26, fontWeight: 900, margin: '0 0 6px' }}>เกมเศรษฐี</h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '0 0 28px' }}>ใส่รหัสห้องเพื่อเข้าร่วมโหวต</p>
        <input
          value={roomInput}
          onChange={e => setRoomInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
          placeholder="รหัสห้อง เช่น AB1234"
          maxLength={8}
          style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid rgba(255,215,0,0.4)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', letterSpacing: 4, fontFamily: "'Courier New', monospace", outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
        />
        <button onClick={joinRoom} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
          เข้าร่วม →
        </button>
      </div>
    </div>
  );

  // Error screen
  if (phase === 'error') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0b0b24,#1a1a3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
        <p style={{ color: '#fca5a5', fontSize: 18, fontWeight: 700 }}>{error || 'เกิดข้อผิดพลาด'}</p>
        <button onClick={() => { setPhase('join'); setRoom(''); }} style={{ marginTop: 20, padding: '10px 28px', borderRadius: 10, border: 'none', background: '#374151', color: '#fff', cursor: 'pointer', fontSize: 15, fontFamily: FONT }}>กลับ</button>
      </div>
    </div>
  );

  // Loading / Waiting screen
  if (phase === 'loading' || phase === 'waiting') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0b0b24,#1a1a3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: 'spin 2s linear infinite' }}>🎰</div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: 700 }}>รอคำถามจากอาจารย์...</p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 8 }}>ห้อง: {room}</p>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // Question screen — student votes
  if (phase === 'question' && questionData) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0b0b24,#1a1a3e)', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Top bar */}
      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#ffd700', fontWeight: 800, fontSize: 15 }}>🎰 เกมเศรษฐี</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>ห้อง: {room}</span>
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 16px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,215,0,0.25)',
          borderRadius: 18, padding: '24px 20px', marginBottom: 24, textAlign: 'center',
          boxShadow: '0 0 40px rgba(255,215,0,0.06)',
        }}>
          <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.65, margin: 0 }}>
            {questionData.question}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {['A', 'B', 'C', 'D'].filter(k => questionData.options?.[k]).map(key => {
            const s = OPT_STYLE[key];
            return (
              <button
                key={key}
                onClick={() => vote(key)}
                style={{
                  padding: '18px 14px', borderRadius: 16,
                  background: s.bg,
                  border: `2px solid ${s.border}60`,
                  color: '#fff', cursor: 'pointer', fontFamily: FONT,
                  fontSize: 16, fontWeight: 700, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: `0 4px 20px ${s.border}30`,
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  lineHeight: 1.4,
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>{key}</span>
                <span>{questionData.options[key]}</span>
              </button>
            );
          })}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          แตะตัวเลือกเพื่อโหวต
        </p>
      </div>
    </div>
  );

  // Voted screen — waiting for reveal
  if (phase === 'voted' && questionData) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0b0b24,#1a1a3e)', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#ffd700', fontWeight: 800, fontSize: 15 }}>🎰 เกมเศรษฐี</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>ห้อง: {room}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        {/* Show selected answer */}
        {voted && (
          <div style={{
            background: OPT_STYLE[voted].bg,
            border: `2px solid ${OPT_STYLE[voted].border}`,
            borderRadius: 20, padding: '20px 32px', marginBottom: 28,
            boxShadow: `0 0 32px ${OPT_STYLE[voted].border}50`,
          }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>คำตอบของคุณ</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>
              {voted}: {questionData.options?.[voted]}
            </div>
          </div>
        )}
        <div style={{ fontSize: 42, marginBottom: 14, animation: 'pulse 1.5s ease-in-out infinite' }}>⏳</div>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: 700 }}>รอผลจากอาจารย์...</p>
        {totalVoters > 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>ผู้โหวตแล้ว: {totalVoters} คน</p>}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    </div>
  );

  // Revealed screen — show correct answer
  if ((phase === 'revealed' || correctAnswer) && questionData) {
    const isCorrect = voted && voted === correctAnswer;
    const isWrong = voted && voted !== correctAnswer;
    return (
      <div style={{ minHeight: '100vh', background: isCorrect ? 'linear-gradient(160deg,#052e16,#14532d)' : isWrong ? 'linear-gradient(160deg,#450a0a,#7f1d1d)' : 'linear-gradient(160deg,#0b0b24,#1a1a3e)', display: 'flex', flexDirection: 'column', fontFamily: FONT, transition: 'background 0.5s' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#ffd700', fontWeight: 800, fontSize: 15 }}>🎰 เกมเศรษฐี</span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>ห้อง: {room}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: 'bounceIn 0.6s ease' }}>
            {isCorrect ? '🎉' : isWrong ? '😢' : '💡'}
          </div>
          <h2 style={{ color: isCorrect ? '#4ade80' : isWrong ? '#f87171' : '#ffd700', fontSize: 26, fontWeight: 900, margin: '0 0 8px' }}>
            {isCorrect ? 'ถูกต้อง!' : isWrong ? 'ผิด...' : 'เฉลยแล้ว!'}
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(74,222,128,0.5)', borderRadius: 16, padding: '14px 24px', marginTop: 16, marginBottom: 12 }}>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 6 }}>เฉลย</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              {correctAnswer}: {questionData.options?.[correctAnswer]}
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 16 }}>รอคำถามข้อต่อไปจากอาจารย์</p>
          <style>{`@keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.1)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}`}</style>
        </div>
      </div>
    );
  }

  return null;
}

export default function StudentMillionairePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0b0b24,#1a1a3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Kanit,sans-serif' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>กำลังโหลด...</span>
      </div>
    }>
      <StudentMillionaireInner />
    </Suspense>
  );
}

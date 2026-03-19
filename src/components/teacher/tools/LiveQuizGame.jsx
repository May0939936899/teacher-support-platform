'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function LiveQuizGame() {
  const [mode, setMode] = useState('teacher');
  const [quiz, setQuiz] = useState({ title: '', questions: [] });
  const [room, setRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [gameState, setGameState] = useState('lobby'); // lobby | question | results | leaderboard
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(20);
  const [answers, setAnswers] = useState({});
  const [studentJoin, setStudentJoin] = useState({ code: '', name: '' });
  const [studentAnswer, setStudentAnswer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('teacher_live_rooms');
    if (saved) setRooms(JSON.parse(saved));
  }, []);

  const saveRooms = (r) => { setRooms(r); localStorage.setItem('teacher_live_rooms', JSON.stringify(r)); };

  const addQuestion = () => {
    setQuiz(q => ({ ...q, questions: [...q.questions, { id: Date.now().toString(), text: '', options: ['', '', '', ''], answer: 'A', timeLimit: 20 }] }));
  };

  const startRoom = () => {
    if (!quiz.title || quiz.questions.length === 0) { toast.error('กรุณาเพิ่มคำถาม'); return; }
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newRoom = { id: code, quiz, players: [], state: 'lobby', currentQ: 0, createdAt: Date.now() };
    saveRooms([newRoom, ...rooms]);
    setRoom(newRoom);
    setGameState('lobby');
    toast.success(`ห้อง ${code} พร้อมแล้ว!`);
  };

  const startGame = () => {
    setGameState('question');
    setCurrentQ(0);
    setTimer(room.quiz.questions[0]?.timeLimit || 20);
    startTimer();
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); nextQuestion(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const nextQuestion = () => {
    setCurrentQ(q => {
      const next = q + 1;
      if (next >= (room?.quiz.questions.length || 0)) {
        setGameState('leaderboard');
        return q;
      }
      setTimer(room.quiz.questions[next]?.timeLimit || 20);
      setTimeout(startTimer, 500);
      return next;
    });
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const currentQuestion = room?.quiz.questions[currentQ];
  const liveRoom = room ? rooms.find(r => r.id === room.id) : null;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[{ id: 'teacher', label: '👩‍🏫 อาจารย์' }, { id: 'student', label: '👨‍🎓 นักศึกษา' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: mode === m.id ? '#fff' : 'none', color: mode === m.id ? '#0d9488' : '#64748b', fontWeight: mode === m.id ? 700 : 400, fontSize: '14px', fontFamily: 'inherit' }}>{m.label}</button>
        ))}
      </div>

      {mode === 'teacher' && !room && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>🎮 สร้าง Live Quiz</h3>
          <input placeholder="ชื่อ Quiz" value={quiz.title} onChange={e => setQuiz(q => ({ ...q, title: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1e293b' }} />
          {quiz.questions.map((q, i) => (
            <div key={q.id} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <input placeholder={`คำถามที่ ${i + 1}`} value={q.text}
                onChange={e => { const qs = [...quiz.questions]; qs[i].text = e.target.value; setQuiz(v => ({ ...v, questions: qs })); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1e293b' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="radio" name={`ans_${q.id}`} checked={q.answer === String.fromCharCode(65 + oi)}
                      onChange={() => { const qs = [...quiz.questions]; qs[i].answer = String.fromCharCode(65 + oi); setQuiz(v => ({ ...v, questions: qs })); }} />
                    <input placeholder={String.fromCharCode(65 + oi)} value={opt}
                      onChange={e => { const qs = [...quiz.questions]; qs[i].options[oi] = e.target.value; setQuiz(v => ({ ...v, questions: qs })); }}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#1e293b' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addQuestion} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px dashed #99f6e4', background: '#f0fdfa', color: '#0f766e', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>+ เพิ่มคำถาม</button>
            <button onClick={startRoom} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#0d9488', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: 'inherit' }}>🚀 สร้างห้อง</button>
          </div>
        </div>
      )}

      {mode === 'teacher' && room && (
        <div>
          <div style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', borderRadius: '16px', padding: '24px', color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '4px' }}>Room Code</div>
            <div style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '8px' }}>{room.id}</div>
            <div style={{ fontSize: '13px', opacity: 0.75 }}>{liveRoom?.players?.length || 0} ผู้เล่นออนไลน์</div>
          </div>
          {gameState === 'lobby' && (
            <div style={{ textAlign: 'center' }}>
              <button onClick={startGame} style={{ padding: '14px 40px', borderRadius: '12px', border: 'none', background: '#0d9488', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '16px', fontFamily: 'inherit' }}>
                ▶ เริ่มเกม!
              </button>
            </div>
          )}
          {gameState === 'question' && currentQuestion && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>ข้อ {currentQ + 1}/{room.quiz.questions.length}</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: timer <= 5 ? '#ef4444' : '#0d9488' }}>⏱ {timer}s</span>
              </div>
              <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px' }}>{currentQuestion.text}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {currentQuestion.options.map((opt, i) => opt && (
                  <div key={i} style={{ padding: '12px', borderRadius: '10px', background: ['#fee2e2','#dcfce7','#dbeafe','#fef3c7'][i], fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
                    {String.fromCharCode(65+i)}. {opt}
                  </div>
                ))}
              </div>
              <button onClick={nextQuestion} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>ข้อถัดไป →</button>
            </div>
          )}
          {gameState === 'leaderboard' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
              <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>เกมจบแล้ว!</h3>
              <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '16px', fontSize: '14px', color: '#92400e' }}>
                ผู้เล่นทั้งหมด: {liveRoom?.players?.length || 0} คน
              </div>
              <button onClick={() => { setRoom(null); setGameState('lobby'); }} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#0d9488', color: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                สร้างเกมใหม่
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'student' && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {!studentJoin.joined ? (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
              <h2 style={{ margin: '0 0 20px', color: '#1e293b' }}>เข้าร่วม Live Quiz</h2>
              <input placeholder="Room Code" value={studentJoin.code}
                onChange={e => setStudentJoin(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '20px', textAlign: 'center', letterSpacing: '6px', fontWeight: 700, marginBottom: '12px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1e293b' }} />
              <input placeholder="ชื่อของคุณ" value={studentJoin.name}
                onChange={e => setStudentJoin(v => ({ ...v, name: e.target.value }))}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1e293b' }} />
              <button onClick={() => {
                if (!studentJoin.code || !studentJoin.name) { toast.error('กรอกให้ครบ'); return; }
                const r = rooms.find(r => r.id === studentJoin.code);
                if (!r) { toast.error('ไม่พบห้อง'); return; }
                setStudentJoin(v => ({ ...v, joined: true, room: r }));
                toast.success('เข้าร่วมแล้ว!');
              }} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: '#0d9488', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: 'inherit' }}>
                เข้าร่วม 🎮
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏳</div>
              <h3 style={{ color: '#1e293b' }}>รอเกมเริ่ม...</h3>
              <p style={{ color: '#64748b' }}>สวัสดี {studentJoin.name}! รอให้อาจารย์เริ่มเกม</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

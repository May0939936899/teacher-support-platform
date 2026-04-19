'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import AntiCheatGuard from './AntiCheatGuard';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";
const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e'];
const OPTION_SHAPES = ['▲', '◆', '●', '■'];
const API = '/api/teacher/livequiz';

// ===== 16 PIXEL CHARACTERS =====
const PIXEL_CHARS = [
  { id: 'knight', name: 'อัศวิน', color: '#3b82f6', pixels: [
    '  ███  ',
    ' █░░░█ ',
    '█░▪░▪░█',
    '█░░░░░█',
    ' █░░░█ ',
    '  █▬█  ',
    ' █████ ',
    '█░███░█',
    '  █ █  ',
    ' ██ ██ ',
  ]},
  { id: 'mage', name: 'จอมเวท', color: '#7c4dff', pixels: [
    '   ▲   ',
    '  ███  ',
    ' █░░░█ ',
    '█░▪░▪░█',
    ' █░░░█ ',
    ' █▬▬▬█ ',
    '██░█░██',
    ' █░█░█ ',
    '  █ █  ',
    ' ██ ██ ',
  ]},
  { id: 'archer', name: 'นักธนู', color: '#22c55e', pixels: [
    '  ▼▼   ',
    ' █░░█  ',
    '█░▪░▪█ ',
    '█░░░░█ ',
    ' █░░█  ',
    ' ████║ ',
    '█░██░║ ',
    ' █░█ ║ ',
    '  █ █  ',
    ' ██ ██ ',
  ]},
  { id: 'healer', name: 'หมอ', color: '#ec4899', pixels: [
    ' ♥♥♥♥  ',
    ' █░░░█ ',
    '█░▪░▪░█',
    '█░░▽░░█',
    ' █░░░█ ',
    ' █✚✚✚█ ',
    '██░█░██',
    ' █░█░█ ',
    '  █ █  ',
    ' ██ ██ ',
  ]},
  { id: 'ninja', name: 'นินจา', color: '#1e293b', pixels: [
    '  ███  ',
    ' █████ ',
    '█▪███▪█',
    '███████',
    ' █████ ',
    '  ███  ',
    ' ██▬██ ',
    '█░███░█',
    '  █ █  ',
    ' ██ ██ ',
  ]},
  { id: 'robot', name: 'หุ่นยนต์', color: '#64748b', pixels: [
    ' █▬▬▬█ ',
    '███████',
    '█■░░░■█',
    '█░░░░░█',
    '███▬███',
    '  ███  ',
    ' █████ ',
    '██░█░██',
    '  █ █  ',
    ' █▬ ▬█ ',
  ]},
  { id: 'princess', name: 'เจ้าหญิง', color: '#f472b6', pixels: [
    ' ♦▲▲▲♦ ',
    ' █░░░█ ',
    '█░▪░▪░█',
    '█░░▽░░█',
    ' █░░░█ ',
    ' █████ ',
    '██░░░██',
    '█░░░░░█',
    ' █████ ',
    '  █ █  ',
  ]},
  { id: 'pirate', name: 'โจรสลัด', color: '#92400e', pixels: [
    ' ▬▬▬▬  ',
    '█░░░░█ ',
    '█▪░░●█ ',
    '█░░░░█ ',
    ' █░░█  ',
    ' ████  ',
    '█░██░█ ',
    ' █░█░█ ',
    '  █ █  ',
    ' ██ ██ ',
  ]},
  { id: 'alien', name: 'เอเลี่ยน', color: '#4ade80', pixels: [
    ' ◉   ◉ ',
    '██████ ',
    '█▪░░▪█ ',
    '█░░░░█ ',
    ' ████  ',
    '  ██   ',
    ' ████  ',
    '█░██░█ ',
    ' █  █  ',
    '██  ██ ',
  ]},
  { id: 'cat', name: 'แมว', color: '#fb923c', pixels: [
    '▲    ▲ ',
    '█▲  ▲█ ',
    '█░▪▪░█ ',
    '█░░▼░█ ',
    '█░▽▽░█ ',
    ' ████  ',
    ' █░░█  ',
    ' █░░█  ',
    ' █  █  ',
    ' █≈ █≈ ',
  ]},
  { id: 'dragon', name: 'มังกร', color: '#dc2626', pixels: [
    '▲     ▲',
    '█▲▲▲▲█',
    '█▪░░░▪█',
    '██░▼░██',
    ' █≈≈≈█ ',
    ' █████ ',
    '██░█░██',
    '█░░░░░█',
    ' █   █ ',
    '███ ███',
  ]},
  { id: 'bear', name: 'หมี', color: '#a16207', pixels: [
    '██   ██',
    '███████',
    '█▪░░░▪█',
    '█░░▼░░█',
    '█░▽▽▽░█',
    ' █████ ',
    '██░█░██',
    '█░░░░░█',
    ' █   █ ',
    ' ██ ██ ',
  ]},
  { id: 'ghost', name: 'ผี', color: '#a78bfa', pixels: [
    '  ███  ',
    ' █████ ',
    '█░░░░░█',
    '█░▪░▪░█',
    '█░░░░░█',
    '█░▽▽▽░█',
    '█░░░░░█',
    '█░░░░░█',
    '█░█░█░█',
    '█ █ █ █',
  ]},
  { id: 'penguin', name: 'เพนกวิน', color: '#1e3a5f', pixels: [
    '  ███  ',
    ' █████ ',
    '█░▪░▪░█',
    '██░▼░██',
    '█░░░░░█',
    '█▓░░░▓█',
    ' █░░░█ ',
    ' █░░░█ ',
    '  ███  ',
    ' ██ ██ ',
  ]},
  { id: 'fox', name: 'จิ้งจอก', color: '#ea580c', pixels: [
    '▲    ▲ ',
    '██▲▲██ ',
    '█░▪▪░█ ',
    '██░▼░██',
    ' █░░░█ ',
    ' █████ ',
    '█░██░█ ',
    ' █░█░█ ',
    '  █ █  ',
    ' ██ ██≈',
  ]},
  { id: 'star', name: 'ดาว', color: '#eab308', pixels: [
    '   ★   ',
    '  ███  ',
    ' █████ ',
    '███████',
    '█░▪░▪░█',
    '█░░▽░░█',
    ' █████ ',
    ' █░█░█ ',
    '  █ █  ',
    ' ██ ██ ',
  ]},
];

function generateQR(text, canvas) {
  import('qrcode').then(QRCode => {
    QRCode.toCanvas(canvas, text, { width: 220, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }, err => { if (err) console.error(err); });
  });
}

function getPlayerId() {
  let id = localStorage.getItem('live_quiz_player_id');
  if (!id) { id = 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6); localStorage.setItem('live_quiz_player_id', id); }
  return id;
}

// Mini Pixel Avatar Component
function PixelAvatar({ charId, size = 40, showName = false, glow = false }) {
  const ch = PIXEL_CHARS.find(c => c.id === charId) || PIXEL_CHARS[0];
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width: size, height: size, borderRadius: '12px',
        background: `linear-gradient(135deg, ${ch.color}20, ${ch.color}40)`,
        border: `2px solid ${ch.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, fontWeight: 900, color: ch.color,
        boxShadow: glow ? `0 0 12px ${ch.color}60` : 'none',
        transition: 'all 0.2s',
      }}>
        {ch.id === 'knight' ? '⚔️' : ch.id === 'mage' ? '🧙' : ch.id === 'archer' ? '🏹' :
         ch.id === 'healer' ? '💗' : ch.id === 'ninja' ? '🥷' : ch.id === 'robot' ? '🤖' :
         ch.id === 'princess' ? '👸' : ch.id === 'pirate' ? '🏴‍☠️' : ch.id === 'alien' ? '👽' :
         ch.id === 'cat' ? '🐱' : ch.id === 'dragon' ? '🐉' : ch.id === 'bear' ? '🐻' :
         ch.id === 'ghost' ? '👻' : ch.id === 'penguin' ? '🐧' : ch.id === 'fox' ? '🦊' : '⭐'}
      </div>
      {showName && <span style={{ fontSize: '11px', color: ch.color, fontWeight: 600 }}>{ch.name}</span>}
    </div>
  );
}

// Live Quiz now uses hybrid storage (Supabase if available, otherwise in-memory)

export default function LiveQuizGame() {
  const [mode, setMode] = useState(null); // null = choose, 'teacher', 'student'
  const [isStudentLocked, setIsStudentLocked] = useState(false);
  const [quiz, setQuiz] = useState({ title: '', questions: [] });
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState('lobby');
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(20);
  const [storageMode, setStorageMode] = useState(null); // 'supabase' or 'memory'
  const [showAnswer, setShowAnswer] = useState(false);

  // Student states
  const [studentJoin, setStudentJoin] = useState({ code: '', name: '', avatar: '' });
  const [studentRoom, setStudentRoom] = useState(null);
  const [studentAnswered, setStudentAnswered] = useState({});
  const [studentSelected, setStudentSelected] = useState(null);
  const [lastAnswerResult, setLastAnswerResult] = useState(null);

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const qrRef = useRef(null);

  // Check URL params for auto-join
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const livequiz = params.get('livequiz');
      if (livequiz) {
        setMode('student');
        setIsStudentLocked(true);
        setStudentJoin(v => ({ ...v, code: livequiz.toUpperCase() }));
      }
    }
  }, []);

  // ===== API HELPERS =====
  const fetchRoom = useCallback(async (code) => {
    try {
      const res = await fetch(`${API}?code=${code}`);
      const data = await res.json();
      if (data.needSetup) return null;
      if (!res.ok) return null;
      return data.room;
    } catch { return null; }
  }, []);

  const createRoom = async () => {
    if (!quiz.title || quiz.questions.length === 0) { toast.error('กรุณาเพิ่มชื่อและคำถามอย่างน้อย 1 ข้อ'); return; }
    const hasEmpty = quiz.questions.some(q => !q.text || q.options.filter(Boolean).length < 2);
    if (hasEmpty) { toast.error('กรุณากรอกคำถามและตัวเลือกให้ครบ'); return; }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz, timeLimit: 60 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoom(data.room);
      setGameState('lobby');
      setStorageMode(data.storage || 'memory');
      toast.success(`🎮 ห้อง ${data.code} พร้อมแล้ว!`);
      startTeacherPolling(data.code);
    } catch (err) {
      // Check if error is about missing table
      toast.error(err.message);
    }
  };

  // ===== TEACHER POLLING =====
  const startTeacherPolling = (code) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await fetchRoom(code);
      if (r) setRoom(r);
    }, 2000);
  };

  // ===== STUDENT POLLING =====
  const startStudentPolling = (code) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await fetchRoom(code);
      if (r) {
        setStudentRoom(prev => {
          if (r.current_q !== prev?.current_q) {
            setStudentSelected(null);
            setLastAnswerResult(null);
          }
          return r;
        });
      }
    }, 1500);
  };

  // Cleanup
  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(pollRef.current); }, []);

  // QR Code
  useEffect(() => {
    if (room && qrRef.current) {
      const url = `${window.location.origin}/teacher?livequiz=${room.id}`;
      generateQR(url, qrRef.current);
    }
  }, [room]);

  // ===== TEACHER: GAME CONTROLS =====
  const updateGameState = async (state, qIdx) => {
    if (!room) return;
    try {
      await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: room.id, game_state: state, current_q: qIdx ?? room.current_q }),
      });
    } catch (err) { console.error(err); }
  };

  const startGame = async () => {
    setGameState('question');
    setCurrentQ(0);
    setShowAnswer(false);
    const tl = room.quiz.questions[0]?.timeLimit || 20;
    setTimer(tl);
    await updateGameState('question', 0);
    startTimerCountdown(tl);
  };

  const startTimerCountdown = (initial) => {
    clearInterval(timerRef.current);
    setTimer(initial);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const nextQuestion = async () => {
    const next = currentQ + 1;
    if (next >= room.quiz.questions.length) {
      setGameState('leaderboard');
      await updateGameState('leaderboard', currentQ);
      clearInterval(timerRef.current);
      return;
    }
    setCurrentQ(next);
    setShowAnswer(false);
    const tl = room.quiz.questions[next]?.timeLimit || 20;
    setTimer(tl);
    await updateGameState('question', next);
    startTimerCountdown(tl);
  };

  const endGame = async () => {
    clearInterval(timerRef.current);
    setGameState('leaderboard');
    await updateGameState('leaderboard', currentQ);
  };

  // ===== STUDENT: JOIN & ANSWER =====
  const joinRoom = async () => {
    if (!studentJoin.code || !studentJoin.name) { toast.error('กรุณากรอก Room Code และชื่อ'); return; }
    if (!studentJoin.avatar) { toast.error('กรุณาเลือกตัวละคร'); return; }
    try {
      const res = await fetch(API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: studentJoin.code,
          action: 'join',
          player: { id: getPlayerId(), name: studentJoin.name, avatar: studentJoin.avatar },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStudentRoom(data.room);
      toast.success(`เข้าร่วมห้อง ${studentJoin.code} แล้ว! 🎮`);
      startStudentPolling(studentJoin.code);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitAnswer = async (selected) => {
    if (!studentRoom || studentAnswered[studentRoom.current_q]) return;
    setStudentSelected(selected);
    try {
      const res = await fetch(API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: studentRoom.id,
          action: 'answer',
          answer: {
            playerId: getPlayerId(),
            playerName: studentJoin.name,
            questionIndex: studentRoom.current_q,
            selected,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStudentAnswered(prev => ({ ...prev, [studentRoom.current_q]: true }));
      setLastAnswerResult(data);
      if (data.correct) toast.success(`ถูกต้อง! +${data.points} คะแนน 🎉`);
      else toast.error('ผิด 😢');
    } catch (err) { toast.error(err.message); }
  };

  // ===== QUIZ BUILDER =====
  const addQuestion = () => {
    setQuiz(q => ({ ...q, questions: [...q.questions, { id: Date.now().toString(), text: '', options: ['', '', '', ''], answer: 'A', timeLimit: 20, points: 10 }] }));
  };

  const removeQuestion = (idx) => { setQuiz(q => ({ ...q, questions: q.questions.filter((_, i) => i !== idx) })); };

  const currentQuestion = room?.quiz?.questions?.[currentQ];
  const studentCurrentQ = studentRoom?.quiz?.questions?.[studentRoom?.current_q];
  const sortedPlayers = room ? [...(room.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0)) : [];
  const answeredCount = room?.responses?.filter(r => r.questionIndex === currentQ).length || 0;

  // Setup SQL modal removed — Live Quiz now works without Supabase setup

  // ===== MODE SELECTION SCREEN — only when NOT locked to student =====
  if (mode === null && !isStudentLocked) {
    return (
      <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', fontFamily: FONT }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎮</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>Live Quiz Game</h2>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>เลือกบทบาทของคุณ</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <button onClick={() => setMode('teacher')} style={{
            padding: '40px 24px', borderRadius: '24px', border: '2px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = CI.cyan; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${CI.cyan}20`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
          >
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>👩‍🏫</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', fontFamily: FONT }}>อาจารย์</div>
            <div style={{ fontSize: '15px', color: '#64748b', fontFamily: FONT }}>สร้างเกมและควบคุม</div>
          </button>

          <button onClick={() => setMode('student')} style={{
            padding: '40px 24px', borderRadius: '24px', border: '2px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = CI.magenta; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${CI.magenta}20`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
          >
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎓</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', fontFamily: FONT }}>นักศึกษา</div>
            <div style={{ fontSize: '15px', color: '#64748b', fontFamily: FONT }}>เข้าร่วมเกม</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: FONT }}>
      {/* Back button — hidden when student is locked via QR/URL */}
      {!isStudentLocked && (
        <button onClick={() => { setMode(null); clearInterval(pollRef.current); clearInterval(timerRef.current); setRoom(null); setStudentRoom(null); setGameState('lobby'); }}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', marginBottom: '16px', padding: '4px 0' }}>
          ← เลือกบทบาทใหม่
        </button>
      )}

      {/* ===== TEACHER: Create Quiz ===== */}
      {mode === 'teacher' && !room && (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: '24px', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🎮</span> สร้าง Live Quiz
          </h3>
          <input placeholder="ชื่อ Quiz เช่น ทดสอบความรู้ Marketing 101" value={quiz.title}
            onChange={e => setQuiz(q => ({ ...q, title: e.target.value }))}
            style={{ width: '100%', padding: '16px 18px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '17px', marginBottom: '24px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1e293b', transition: 'border 0.2s' }}
            onFocus={e => e.target.style.borderColor = CI.cyan}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />

          {quiz.questions.map((q, i) => (
            <div key={q.id} style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '17px', fontWeight: 800, color: CI.cyan }}>ข้อที่ {i + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>คะแนน:</span>
                  <input type="number" min="5" max="100" value={q.points || 10}
                    onChange={e => { const qs = [...quiz.questions]; qs[i].points = parseInt(e.target.value) || 10; setQuiz(v => ({ ...v, questions: qs })); }}
                    style={{ width: '60px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', textAlign: 'center', fontFamily: 'inherit' }} />
                  <button onClick={() => removeQuestion(i)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', borderRadius: '8px', padding: '6px 10px' }}>🗑️</button>
                </div>
              </div>
              <input placeholder={`พิมพ์คำถามข้อที่ ${i + 1}`} value={q.text}
                onChange={e => { const qs = [...quiz.questions]; qs[i].text = e.target.value; setQuiz(v => ({ ...v, questions: qs })); }}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', marginBottom: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1e293b' }}
                onFocus={e => e.target.style.borderColor = CI.cyan}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              {/* Answer key hint */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>🎯 คลิกที่รูปทรงเพื่อเลือก <b>เฉลย</b></span>
                {q.answer ? (
                  <span style={{
                    fontSize: '13px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px',
                    background: OPTION_COLORS[q.answer.charCodeAt(0) - 65] + '18',
                    color: OPTION_COLORS[q.answer.charCodeAt(0) - 65],
                    border: `1.5px solid ${OPTION_COLORS[q.answer.charCodeAt(0) - 65]}50`,
                  }}>✓ เฉลย: ข้อ {q.answer}</span>
                ) : (
                  <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>⚠ ยังไม่ได้เลือกเฉลย</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {q.options.map((opt, oi) => {
                  const isCorrect = q.answer === String.fromCharCode(65 + oi);
                  return (
                    <div key={oi} style={{
                      display: 'flex', gap: '8px', alignItems: 'center',
                      background: isCorrect ? OPTION_COLORS[oi] + '12' : 'transparent',
                      borderRadius: '12px', padding: isCorrect ? '4px 6px 4px 4px' : '0',
                      border: isCorrect ? `2px solid ${OPTION_COLORS[oi]}60` : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}>
                      <div onClick={() => { const qs = [...quiz.questions]; qs[i].answer = String.fromCharCode(65 + oi); setQuiz(v => ({ ...v, questions: qs })); }}
                        style={{
                          width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: 800, cursor: 'pointer', flexShrink: 0,
                          background: isCorrect ? OPTION_COLORS[oi] : '#f1f5f9',
                          color: isCorrect ? '#fff' : '#94a3b8',
                          transition: 'all 0.15s',
                          boxShadow: isCorrect ? `0 4px 12px ${OPTION_COLORS[oi]}50` : 'none',
                          position: 'relative',
                        }}>
                        {isCorrect ? '✓' : OPTION_SHAPES[oi]}
                      </div>
                      <input placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`} value={opt}
                        onChange={e => { const qs = [...quiz.questions]; qs[i].options[oi] = e.target.value; setQuiz(v => ({ ...v, questions: qs })); }}
                        style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: `2px solid ${isCorrect ? OPTION_COLORS[oi] + '80' : OPTION_COLORS[oi] + '25'}`, fontSize: '15px', outline: 'none', fontFamily: 'inherit', color: '#1e293b', background: isCorrect ? '#fff' : `${OPTION_COLORS[oi]}06`, fontWeight: isCorrect ? 700 : 400 }}
                        onFocus={e => e.target.style.borderColor = OPTION_COLORS[oi]}
                        onBlur={e => e.target.style.borderColor = isCorrect ? OPTION_COLORS[oi] + '80' : OPTION_COLORS[oi] + '25'} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>⏱ เวลา:</span>
                <select value={q.timeLimit}
                  onChange={e => { const qs = [...quiz.questions]; qs[i].timeLimit = parseInt(e.target.value); setQuiz(v => ({ ...v, questions: qs })); }}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '15px', fontFamily: 'inherit', color: '#1e293b' }}>
                  {[10, 15, 20, 30, 45, 60].map(s => <option key={s} value={s}>{s} วินาที</option>)}
                </select>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '14px', marginTop: '12px' }}>
            <button onClick={addQuestion} style={{
              flex: 1, padding: '16px', borderRadius: '14px', border: `2px dashed ${CI.cyan}40`,
              background: `${CI.cyan}06`, color: CI.cyan, cursor: 'pointer', fontSize: '17px', fontWeight: 700, fontFamily: 'inherit',
            }}>+ เพิ่มคำถาม</button>
            <button onClick={createRoom} disabled={quiz.questions.length === 0} style={{
              flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
              background: quiz.questions.length > 0 ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : '#e2e8f0',
              color: quiz.questions.length > 0 ? '#fff' : '#94a3b8',
              cursor: quiz.questions.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 800, fontSize: '18px', fontFamily: 'inherit',
              boxShadow: quiz.questions.length > 0 ? `0 4px 16px ${CI.cyan}30` : 'none',
            }}>🚀 สร้างห้อง ({quiz.questions.length} ข้อ)</button>
          </div>
        </div>
      )}

      {/* ===== TEACHER: Room Active ===== */}
      {mode === 'teacher' && room && (
        <div>
          {/* Room code + QR banner */}
          <div style={{
            background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`,
            borderRadius: '24px', padding: '36px', color: '#fff', marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(11,11,36,0.3)',
          }}>
            <div style={{ display: 'flex', gap: '36px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', opacity: 0.7, marginBottom: '8px', letterSpacing: '2px' }}>🎮 ROOM CODE</div>
                <div style={{
                  fontSize: '64px', fontWeight: 900, letterSpacing: '14px',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.gold})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{room.id}</div>
                <div style={{ fontSize: '16px', opacity: 0.8, marginTop: '12px' }}>
                  👥 {room.players?.length || 0} ผู้เล่น | 📝 {room.quiz.questions.length} ข้อ
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <canvas ref={qrRef} style={{ borderRadius: '16px', display: 'block', background: '#fff', padding: '10px' }} />
                <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>สแกน QR เพื่อเข้าร่วม</div>
              </div>
            </div>
          </div>

          {/* Player list in lobby */}
          {gameState === 'lobby' && (
            <div>
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 20px', fontSize: '20px', color: '#1e293b', fontWeight: 800 }}>
                  👥 ผู้เล่นที่เข้าร่วม ({room.players?.length || 0} คน)
                </h4>
                {(room.players || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '12px', opacity: 0.5 }}>⏳</div>
                    <div style={{ color: '#94a3b8', fontSize: '17px' }}>รอนักศึกษาเข้าร่วม...</div>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '8px' }}>แชร์ QR Code หรือ Room Code ด้านบน</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {room.players.map((p) => (
                      <div key={p.id} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px',
                        padding: '16px 12px', textAlign: 'center', transition: 'all 0.2s',
                      }}>
                        <PixelAvatar charId={p.avatar || 'knight'} size={48} />
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: '8px' }}>{p.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => {
                  const url = `${window.location.origin}/teacher?livequiz=${room.id}`;
                  navigator.clipboard.writeText(url); toast.success('📋 คัดลอก URL แล้ว');
                }} style={{
                  flex: 1, padding: '16px', borderRadius: '14px', border: '2px solid #e2e8f0',
                  background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit', fontWeight: 700,
                }}>📋 คัดลอก URL</button>
                <button onClick={startGame} disabled={!room.players?.length} style={{
                  flex: 2, padding: '18px', borderRadius: '14px', border: 'none',
                  background: room.players?.length ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : '#e2e8f0',
                  color: room.players?.length ? '#fff' : '#94a3b8',
                  cursor: room.players?.length ? 'pointer' : 'not-allowed',
                  fontWeight: 900, fontSize: '22px', fontFamily: 'inherit',
                  boxShadow: room.players?.length ? `0 4px 20px ${CI.cyan}40` : 'none',
                }}>▶ เริ่มเกม!</button>
              </div>
            </div>
          )}

          {/* Question display (teacher view) */}
          {gameState === 'question' && currentQuestion && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '17px', color: '#64748b', fontWeight: 700 }}>
                  ข้อ {currentQ + 1} / {room.quiz.questions.length}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Player answer avatars */}
                    {(room.responses || []).filter(r => r.questionIndex === currentQ).slice(0, 8).map((r, i) => {
                      const player = room.players?.find(p => p.id === r.playerId);
                      return <PixelAvatar key={i} charId={player?.avatar || 'knight'} size={28} />;
                    })}
                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>
                      {answeredCount}/{room.players?.length || 0}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '32px', fontWeight: 900, minWidth: '80px', textAlign: 'center',
                    color: timer <= 5 ? '#ef4444' : CI.cyan,
                    background: timer <= 5 ? '#fef2f2' : `${CI.cyan}08`,
                    padding: '8px 20px', borderRadius: '14px',
                    animation: timer <= 5 ? 'pulse 1s infinite' : 'none',
                  }}>
                    {timer}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '28px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: timer <= 5 ? `linear-gradient(90deg, #ef4444, #f97316)` : `linear-gradient(90deg, ${CI.cyan}, ${CI.magenta})`,
                  width: `${(timer / (currentQuestion.timeLimit || 20)) * 100}%`,
                  transition: 'width 1s linear',
                }} />
              </div>

              <h3 style={{ fontSize: '26px', color: '#1e293b', marginBottom: '28px', fontWeight: 800, lineHeight: 1.5 }}>
                {currentQuestion.text}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                {currentQuestion.options.map((opt, i) => opt && (
                  <div key={i} style={{
                    padding: '22px 24px', borderRadius: '16px', background: OPTION_COLORS[i], color: '#fff',
                    fontSize: '19px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '14px',
                    border: showAnswer && currentQuestion.answer === String.fromCharCode(65 + i) ? '4px solid #fff' : 'none',
                    boxShadow: showAnswer && currentQuestion.answer === String.fromCharCode(65 + i) ? `0 0 0 4px ${OPTION_COLORS[i]}, 0 0 20px ${OPTION_COLORS[i]}60` : `0 4px 12px ${OPTION_COLORS[i]}30`,
                    opacity: showAnswer && currentQuestion.answer !== String.fromCharCode(65 + i) ? 0.5 : 1,
                    transition: 'all 0.3s',
                  }}>
                    <span style={{ fontSize: '24px', fontWeight: 900 }}>{OPTION_SHAPES[i]}</span>
                    {opt}
                    {showAnswer && currentQuestion.answer === String.fromCharCode(65 + i) && <span style={{ marginLeft: 'auto', fontSize: '24px' }}>✓</span>}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {!showAnswer && (
                  <button onClick={() => { clearInterval(timerRef.current); setShowAnswer(true); }} style={{
                    padding: '14px 28px', borderRadius: '12px', border: '2px solid #e2e8f0',
                    background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit', fontWeight: 600,
                  }}>👁 แสดงเฉลย</button>
                )}
                <button onClick={endGame} style={{
                  padding: '14px 28px', borderRadius: '12px', border: '2px solid #e2e8f0',
                  background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit', fontWeight: 600,
                }}>⏹ จบเกม</button>
                <button onClick={nextQuestion} style={{
                  padding: '14px 36px', borderRadius: '12px', border: 'none',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff',
                  cursor: 'pointer', fontSize: '17px', fontWeight: 800, fontFamily: 'inherit',
                  boxShadow: `0 4px 16px ${CI.cyan}30`,
                }}>
                  {currentQ + 1 >= room.quiz.questions.length ? '🏆 ดู Leaderboard' : 'ข้อถัดไป →'}
                </button>
              </div>
            </div>
          )}

          {/* ===== LEADERBOARD ===== */}
          {gameState === 'leaderboard' && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '44px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '72px', marginBottom: '8px' }}>🏆</div>
                <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '30px', fontWeight: 900 }}>Leaderboard</h3>
                <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
                  {room.quiz.questions.length} ข้อ | {room.players?.length || 0} ผู้เล่น
                </p>
              </div>

              {/* Top 3 podium */}
              {sortedPlayers.length >= 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', marginBottom: '32px' }}>
                  {/* 2nd place */}
                  {sortedPlayers[1] && (
                    <div style={{ textAlign: 'center', width: '120px' }}>
                      <PixelAvatar charId={sortedPlayers[1].avatar || 'mage'} size={56} glow />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '8px' }}>{sortedPlayers[1].name}</div>
                      <div style={{
                        background: '#e2e8f0', borderRadius: '12px 12px 0 0', padding: '16px 0', marginTop: '8px',
                        fontSize: '20px', fontWeight: 900, color: '#64748b', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                      }}>
                        <div>🥈</div>
                        <div style={{ fontSize: '16px' }}>{sortedPlayers[1].score || 0}</div>
                      </div>
                    </div>
                  )}
                  {/* 1st place */}
                  <div style={{ textAlign: 'center', width: '140px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>👑</div>
                    <PixelAvatar charId={sortedPlayers[0].avatar || 'knight'} size={72} glow />
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginTop: '8px' }}>{sortedPlayers[0].name}</div>
                    <div style={{
                      background: `linear-gradient(135deg, ${CI.gold}30, ${CI.gold}50)`, borderRadius: '12px 12px 0 0',
                      padding: '16px 0', marginTop: '8px', border: `2px solid ${CI.gold}`,
                      fontSize: '22px', fontWeight: 900, color: CI.gold, height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    }}>
                      <div>🥇</div>
                      <div style={{ fontSize: '20px' }}>{sortedPlayers[0].score || 0}</div>
                    </div>
                  </div>
                  {/* 3rd place */}
                  {sortedPlayers[2] && (
                    <div style={{ textAlign: 'center', width: '120px' }}>
                      <PixelAvatar charId={sortedPlayers[2].avatar || 'archer'} size={56} glow />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '8px' }}>{sortedPlayers[2].name}</div>
                      <div style={{
                        background: '#fef3c7', borderRadius: '12px 12px 0 0', padding: '16px 0', marginTop: '8px',
                        fontSize: '20px', fontWeight: 900, color: '#d97706', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                      }}>
                        <div>🥉</div>
                        <div style={{ fontSize: '16px' }}>{sortedPlayers[2].score || 0}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full ranking */}
              <div style={{ maxWidth: '550px', margin: '0 auto' }}>
                {sortedPlayers.map((p, i) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
                    borderRadius: '14px', marginBottom: '8px',
                    background: i === 0 ? `${CI.gold}10` : i < 3 ? '#f8fafc' : '#fff',
                    border: `1px solid ${i === 0 ? CI.gold + '30' : '#e2e8f0'}`,
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: i < 3 ? '18px' : '14px', fontWeight: 800,
                      background: i === 0 ? CI.gold : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#e2e8f0',
                      color: i < 3 ? '#fff' : '#64748b',
                    }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </div>
                    <PixelAvatar charId={p.avatar || 'knight'} size={36} />
                    <div style={{ flex: 1, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: i === 0 ? CI.gold : CI.cyan }}>{p.score || 0}</div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <button onClick={() => { clearInterval(pollRef.current); setRoom(null); setGameState('lobby'); setQuiz({ title: '', questions: [] }); setShowAnswer(false); }} style={{
                  padding: '16px 40px', borderRadius: '14px', border: 'none',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff',
                  cursor: 'pointer', fontWeight: 800, fontSize: '18px', fontFamily: 'inherit',
                  boxShadow: `0 4px 16px ${CI.cyan}30`,
                }}>🎮 สร้างเกมใหม่</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== STUDENT MODE ===== */}
      {mode === 'student' && (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          {/* Join screen */}
          {!studentRoom && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎮</div>
                <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '26px', fontWeight: 800 }}>เข้าร่วม Live Quiz</h2>
                <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>กรอก Room Code, ตั้งชื่อ และเลือกตัวละคร</p>
              </div>

              {/* Room Code */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Room Code</label>
                <input placeholder="เช่น AB12" value={studentJoin.code}
                  onChange={e => setStudentJoin(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                  maxLength={6}
                  style={{
                    width: '100%', padding: '18px', borderRadius: '16px', border: `2px solid ${CI.cyan}30`,
                    fontSize: '36px', textAlign: 'center', letterSpacing: '12px', fontWeight: 900,
                    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: CI.dark,
                    background: `${CI.cyan}04`,
                  }}
                  onFocus={e => e.target.style.borderColor = CI.cyan}
                  onBlur={e => e.target.style.borderColor = CI.cyan + '30'} />
              </div>

              {/* Name */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>ชื่อของคุณ</label>
                <input placeholder="ตั้งชื่อตามใจชอบ เช่น บอส, มินนี่, เจ้าหญิง" value={studentJoin.name}
                  onChange={e => setStudentJoin(v => ({ ...v, name: e.target.value }))}
                  style={{
                    width: '100%', padding: '16px 18px', borderRadius: '14px', border: '2px solid #e2e8f0',
                    fontSize: '17px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1e293b',
                  }}
                  onFocus={e => e.target.style.borderColor = CI.magenta}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Character Selection */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '12px' }}>
                  เลือกตัวละคร Pixel ({studentJoin.avatar ? PIXEL_CHARS.find(c => c.id === studentJoin.avatar)?.name : 'ยังไม่เลือก'})
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {PIXEL_CHARS.map(ch => (
                    <button key={ch.id} onClick={() => setStudentJoin(v => ({ ...v, avatar: ch.id }))}
                      style={{
                        padding: '14px 8px', borderRadius: '16px', border: `2px solid ${studentJoin.avatar === ch.id ? ch.color : '#e2e8f0'}`,
                        background: studentJoin.avatar === ch.id ? `${ch.color}12` : '#fff',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        boxShadow: studentJoin.avatar === ch.id ? `0 0 16px ${ch.color}30` : 'none',
                        transform: studentJoin.avatar === ch.id ? 'scale(1.05)' : 'scale(1)',
                      }}>
                      <PixelAvatar charId={ch.id} size={44} />
                      <div style={{
                        fontSize: '12px', fontWeight: 700, marginTop: '6px',
                        color: studentJoin.avatar === ch.id ? ch.color : '#94a3b8',
                      }}>{ch.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={joinRoom} disabled={!studentJoin.code || !studentJoin.name || !studentJoin.avatar} style={{
                width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
                background: studentJoin.code && studentJoin.name && studentJoin.avatar
                  ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : '#e2e8f0',
                color: studentJoin.code && studentJoin.name && studentJoin.avatar ? '#fff' : '#94a3b8',
                cursor: studentJoin.code && studentJoin.name && studentJoin.avatar ? 'pointer' : 'not-allowed',
                fontWeight: 800, fontSize: '20px', fontFamily: 'inherit',
                boxShadow: studentJoin.code && studentJoin.name && studentJoin.avatar ? `0 4px 20px ${CI.cyan}30` : 'none',
              }}>
                {studentJoin.avatar && <PixelAvatar charId={studentJoin.avatar} size={28} />}
                {' '}เข้าร่วมเกม! 🎮
              </button>
            </div>
          )}

          {/* Waiting in lobby */}
          {studentRoom && studentRoom.game_state === 'lobby' && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '44px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '56px', marginBottom: '8px' }}>
                <PixelAvatar charId={studentJoin.avatar || 'knight'} size={72} glow />
              </div>
              <h3 style={{ color: '#1e293b', fontSize: '24px', fontWeight: 800, margin: '12px 0 8px' }}>รอเกมเริ่ม...</h3>
              <p style={{ color: '#64748b', fontSize: '17px', marginBottom: '24px' }}>
                สวัสดี <b>{studentJoin.name}</b> — รอให้อาจารย์กดเริ่มเกม
              </p>
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', fontSize: '15px', color: '#64748b' }}>
                <div style={{ marginBottom: '12px', fontWeight: 700, fontSize: '16px' }}>
                  👥 ผู้เล่นในห้อง ({studentRoom.players?.length || 0} คน)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {(studentRoom.players || []).map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '12px', fontSize: '14px',
                      background: p.id === getPlayerId() ? `${CI.cyan}12` : '#fff',
                      border: `1px solid ${p.id === getPlayerId() ? CI.cyan + '30' : '#e2e8f0'}`,
                      fontWeight: p.id === getPlayerId() ? 700 : 500,
                      color: p.id === getPlayerId() ? CI.cyan : '#64748b',
                    }}>
                      <PixelAvatar charId={p.avatar || 'knight'} size={22} />
                      {p.name}{p.id === getPlayerId() ? ' (คุณ)' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Waiting animation */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: CI.cyan,
                    animation: `bounce 1.4s ${i * 0.2}s infinite ease-in-out`,
                  }} />
                ))}
              </div>
              <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }`}</style>
            </div>
          )}

          {/* Question for student */}
          {studentRoom && studentRoom.game_state === 'question' && studentCurrentQ && (
            <div>
              <div style={{
                background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`, color: '#fff',
                borderRadius: '20px', padding: '20px 24px', marginBottom: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '13px', opacity: 0.7 }}>ข้อ {studentRoom.current_q + 1} / {studentRoom.quiz.questions.length}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{studentRoom.quiz.title}</div>
                </div>
                <PixelAvatar charId={studentJoin.avatar || 'knight'} size={36} />
              </div>

              <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1e293b', fontWeight: 800, lineHeight: 1.6 }}>
                  {studentCurrentQ.text}
                </h3>

                {studentAnswered[studentRoom.current_q] ? (
                  <div style={{ textAlign: 'center', padding: '28px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '12px' }}>{lastAnswerResult?.correct ? '🎉' : '😢'}</div>
                    <div style={{
                      fontSize: '24px', fontWeight: 800,
                      color: lastAnswerResult?.correct ? '#16a34a' : '#ef4444',
                    }}>
                      {lastAnswerResult?.correct ? `ถูกต้อง! +${lastAnswerResult.points}` : 'ผิด ลองใหม่ข้อหน้า!'}
                    </div>
                    <div style={{ fontSize: '16px', color: '#94a3b8', marginTop: '12px' }}>
                      ⏳ รอข้อถัดไป...
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {studentCurrentQ.options.map((opt, i) => opt && (
                      <button key={i} onClick={() => submitAnswer(String.fromCharCode(65 + i))} style={{
                        padding: '24px 18px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                        background: studentSelected === String.fromCharCode(65 + i)
                          ? OPTION_COLORS[i] : `${OPTION_COLORS[i]}15`,
                        color: studentSelected === String.fromCharCode(65 + i) ? '#fff' : OPTION_COLORS[i],
                        fontSize: '18px', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
                        boxShadow: studentSelected === String.fromCharCode(65 + i) ? `0 4px 16px ${OPTION_COLORS[i]}40` : 'none',
                        display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '22px', fontWeight: 900 }}>{OPTION_SHAPES[i]}</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard for student */}
          {studentRoom && studentRoom.game_state === 'leaderboard' && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '44px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '72px', marginBottom: '8px' }}>🏆</div>
              <h3 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: '26px', fontWeight: 900 }}>ผลลัพธ์</h3>

              {/* Your score card */}
              {(() => {
                const me = studentRoom.players?.find(p => p.id === getPlayerId());
                const sorted = [...(studentRoom.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
                const rank = sorted.findIndex(p => p.id === getPlayerId()) + 1;
                return me ? (
                  <div style={{
                    background: `linear-gradient(135deg, ${CI.cyan}10, ${CI.magenta}10)`,
                    borderRadius: '20px', padding: '28px', marginBottom: '24px',
                    border: `2px solid ${CI.cyan}20`,
                  }}>
                    <PixelAvatar charId={studentJoin.avatar || 'knight'} size={64} glow />
                    <div style={{ fontSize: '15px', color: '#64748b', marginTop: '10px' }}>อันดับของคุณ</div>
                    <div style={{
                      fontSize: '48px', fontWeight: 900,
                      background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>#{rank}</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{me.score || 0} คะแนน</div>
                    {rank === 1 && <div style={{ fontSize: '24px', marginTop: '8px' }}>👑 แชมป์!</div>}
                  </div>
                ) : null;
              })()}

              <div style={{ textAlign: 'left' }}>
                {[...(studentRoom.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, i) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderRadius: '12px', marginBottom: '6px',
                    background: p.id === getPlayerId() ? `${CI.cyan}08` : '#f8fafc',
                    border: p.id === getPlayerId() ? `2px solid ${CI.cyan}20` : '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontSize: i < 3 ? '20px' : '14px', fontWeight: 800, width: '32px', textAlign: 'center' }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}
                    </span>
                    <PixelAvatar charId={p.avatar || 'knight'} size={30} />
                    <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                      {p.name}{p.id === getPlayerId() ? ' (คุณ)' : ''}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: i === 0 ? CI.gold : CI.cyan }}>{p.score || 0}</span>
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

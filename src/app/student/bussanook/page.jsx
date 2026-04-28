'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Constants ────────────────────────────────────────────────────────────────
const FONT    = "'Kanit', 'Noto Sans Thai', sans-serif";
const BG      = '#0b0b24';
const CYAN    = '#00b4e6';
const MAGENTA = '#e6007e';
const GOLD    = '#ffc107';

const ANSWER_CFG = [
  { color: '#e21b3c', light: '#ff4d6a', icon: '▲', label: 'A' },
  { color: '#1368ce', light: '#3a8ee6', icon: '◆', label: 'B' },
  { color: '#d89e00', light: '#ffc107', icon: '●', label: 'C' },
  { color: '#26890c', light: '#36c410', icon: '■', label: 'D' },
];

// ── Player ID ────────────────────────────────────────────────────────────────
function getOrCreatePid(room) {
  if (typeof window === 'undefined') return '';
  const key = `buss_pid_${room}`;
  let pid = localStorage.getItem(key);
  if (!pid) {
    pid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, pid);
  }
  return pid;
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function getCtx(r) {
  if (!r.current) {
    try { r.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return r.current;
}
function wake(r) { const c = getCtx(r); if (c?.state === 'suspended') c.resume(); return c; }
function note(ctx, freq, type, gain, start, dur) {
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.start(start); o.stop(start + dur + 0.02);
  } catch {}
}
function playJoin(r)    { const c = wake(r); if (!c) return; const t = c.currentTime; [523,659,784,1047].forEach((f,i)=>note(c,f,'triangle',0.18,t+i*0.1,0.28)); }
function playTap(r)     { const c = wake(r); if (!c) return; const t = c.currentTime; note(c,660,'square',0.12,t,0.06); note(c,880,'triangle',0.15,t+0.06,0.15); }
function playCorrect(r) { const c = wake(r); if (!c) return; const t = c.currentTime; [523,659,784,1047,1319].forEach((f,i)=>note(c,f,'triangle',0.2,t+i*0.1,0.4)); }
function playWrong(r)   { const c = wake(r); if (!c) return; const t = c.currentTime; [440,349,277,196].forEach((f,i)=>note(c,f,'sawtooth',0.18,t+i*0.16,0.3)); }
function playFinish(r)  { const c = wake(r); if (!c) return; const t = c.currentTime; [523,659,784,1047,1319,1568].forEach((f,i)=>note(c,f,'sine',0.2,t+i*0.12,0.45)); }

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  @keyframes buss-s-fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes buss-s-slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes buss-s-popIn     { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes buss-s-pulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes buss-s-tapIn     { 0%{transform:scale(1)} 30%{transform:scale(0.94)} 100%{transform:scale(1)} }
  @keyframes buss-s-dots      { 0%{content:'.'} 33%{content:'..'} 66%{content:'...'} 100%{content:'.'} }
  @keyframes buss-s-correct   { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 60%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes buss-s-wrong     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
  @keyframes buss-s-pts       { 0%{opacity:0;transform:translateY(20px) scale(0.8)} 50%{opacity:1;transform:translateY(-8px) scale(1.1)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes buss-s-confetti  { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
  @keyframes buss-s-crown     { 0%{transform:scale(0) rotate(-20deg)} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
`;

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function BusSanookStudentInner() {
  const searchParams = useSearchParams();
  const roomParam    = (searchParams.get('room') || '').toUpperCase().trim();

  const audioRef = useRef(null);
  const pollRef  = useRef(null);
  const timerRef = useRef(null);

  const [room,        setRoom]        = useState(roomParam);
  const [roomInput,   setRoomInput]   = useState(roomParam);
  const [pid,         setPid]         = useState('');
  const [name,        setName]        = useState('');
  const [phase,       setPhase]       = useState('join'); // join|lobby|question|waiting|reveal|finished
  const [joining,     setJoining]     = useState(false);
  const [joinError,   setJoinError]   = useState('');

  // Game state from server
  const [serverState, setServerState] = useState(null);

  // Answer state
  const [myChoice,    setMyChoice]    = useState(null);  // 0-3 or null
  const [myAnswer,    setMyAnswer]    = useState(null);  // {choice, timeMs, points, correct}
  const [answering,   setAnswering]   = useState(false);
  const [timedOut,    setTimedOut]    = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [timerMax,    setTimerMax]    = useState(20);

  // Reveal sound played guard
  const revealSoundRef = useRef(false);
  const finishSoundRef = useRef(false);
  const prevPhaseRef   = useRef('join');
  const prevQRef       = useRef(-1);

  // ── Inject CSS ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'buss-student-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id; el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // ── Init PID once room is known ────────────────────────────────────────
  useEffect(() => {
    if (room) setPid(getOrCreatePid(room));
  }, [room]);

  // ── Poll server state ──────────────────────────────────────────────────
  const poll = async (currentRoom, currentPid) => {
    if (!currentRoom || !currentPid) return;
    try {
      const res = await fetch(`/api/teacher/bussanook?room=${currentRoom}&pid=${currentPid}`);
      if (!res.ok) return;
      const data = await res.json();
      setServerState(data);
    } catch {}
  };

  useEffect(() => {
    if (!room || !pid || phase === 'join') return;
    poll(room, pid);
    pollRef.current = setInterval(() => poll(room, pid), 2000);
    return () => clearInterval(pollRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, pid, phase]);

  // ── Sync phase from server state ───────────────────────────────────────
  useEffect(() => {
    if (!serverState) return;
    const sp = serverState.phase;
    const sq = serverState.currentQ ?? 0;

    // New question started — reset local answer state
    if (sq !== prevQRef.current && sp === 'question') {
      setMyChoice(null);
      setMyAnswer(null);
      setTimedOut(false);
      revealSoundRef.current = false;
      prevQRef.current = sq;
    }

    // Phase transitions
    if (sp === 'question' && prevPhaseRef.current !== 'question') {
      setPhase('question');
    } else if (sp === 'reveal' && prevPhaseRef.current !== 'reveal') {
      setPhase('reveal');
      // Play reveal sound
      if (!revealSoundRef.current) {
        revealSoundRef.current = true;
        const ans = serverState.myAnswer;
        if (ans?.correct) playCorrect(audioRef);
        else playWrong(audioRef);
      }
    } else if (sp === 'finished' && prevPhaseRef.current !== 'finished') {
      setPhase('finished');
      if (!finishSoundRef.current) {
        finishSoundRef.current = true;
        playFinish(audioRef);
      }
    } else if (sp === 'lobby' && phase !== 'join') {
      // Game reset — go back to lobby
      setPhase('lobby');
      setMyChoice(null);
      setMyAnswer(null);
      setTimedOut(false);
    }

    // Update myAnswer from server during reveal
    if (sp === 'reveal' && serverState.myAnswer) {
      setMyAnswer(serverState.myAnswer);
    }

    prevPhaseRef.current = sp;
  }, [serverState, phase]);

  // ── Client-side countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'question' || !serverState?.questionStartTime) {
      clearInterval(timerRef.current);
      return;
    }
    const limit = serverState.timeLimit || serverState.question?.time || 20;
    setTimerMax(limit);

    const tick = () => {
      const elapsed  = (Date.now() - serverState.questionStartTime) / 1000;
      const remaining = Math.max(0, limit - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0 && !timedOut && myChoice === null) {
        setTimedOut(true);
        setPhase('waiting');
        clearInterval(timerRef.current);
      }
    };

    clearInterval(timerRef.current);
    tick();
    timerRef.current = setInterval(tick, 100);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, serverState?.questionStartTime, serverState?.currentQ]);

  // ── Cleanup ────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  async function handleJoin() {
    const finalRoom = roomInput.toUpperCase().trim();
    const finalName = name.trim();
    if (!finalRoom) { setJoinError('กรุณาใส่รหัสห้อง'); return; }
    if (!finalName) { setJoinError('กรุณาใส่ชื่อเล่น'); return; }
    setJoining(true);
    setJoinError('');

    const finalPid = getOrCreatePid(finalRoom);
    setPid(finalPid);

    try {
      const res = await fetch('/api/teacher/bussanook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', room: finalRoom, pid: finalPid, name: finalName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || 'เกิดข้อผิดพลาด');
        setJoining(false);
        return;
      }
      playJoin(audioRef);
      setRoom(finalRoom);
      setPhase('lobby');
    } catch {
      setJoinError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
    setJoining(false);
  }

  async function handleAnswer(choice) {
    if (answering || myChoice !== null || timedOut) return;
    if (phase !== 'question') return;

    playTap(audioRef);
    setMyChoice(choice);
    setAnswering(true);
    setPhase('waiting');

    try {
      const res = await fetch('/api/teacher/bussanook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', room, pid, choice }),
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setMyAnswer(data.answer);
      }
    } catch {}
    setAnswering(false);
  }

  // ── Derived ────────────────────────────────────────────────────────────
  const timerPct   = timerMax > 0 ? (timeLeft / timerMax) * 100 : 0;
  const timerColor = timerPct > 50 ? '#26890c' : timerPct > 20 ? GOLD : '#e21b3c';

  const playerCount = serverState?.playerCount ?? 0;
  const currentQIdx = serverState?.currentQ ?? 0;
  const totalQ      = serverState?.totalQ ?? 0;
  const question    = serverState?.question;
  const myRank      = serverState?.players
    ? serverState.players.findIndex(p => p.id === pid) + 1
    : 0;
  const myScore     = serverState?.players?.find(p => p.id === pid)?.score ?? 0;

  // ── RENDER: JOIN ───────────────────────────────────────────────────────
  if (phase === 'join') {
    return (
      <div style={fullPage}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', padding:24 }}>

          {/* Branding */}
          <div style={{ marginBottom:32, textAlign:'center', animation:'buss-s-popIn 0.5s ease' }}>
            <div style={{ fontSize:42, fontWeight:900, color:CYAN, letterSpacing:3, textShadow:`0 0 24px ${CYAN}` }}>🎮</div>
            <div style={{ fontSize:32, fontWeight:900, color:CYAN, letterSpacing:3, textShadow:`0 0 24px ${CYAN}` }}>BUS-SANOOK</div>
            <div style={{ color:'#888', fontSize:14, marginTop:4 }}>เกมคำถามสนุกสนาน</div>
          </div>

          {/* Form */}
          <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:14 }}>
            {/* Room code */}
            <div>
              <label style={sLabelStyle}>รหัสห้อง</label>
              <input
                type="text"
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="เช่น ABCD"
                maxLength={4}
                style={{ ...sInputStyle, textAlign:'center', fontSize:28, letterSpacing:8, fontFamily:'monospace', fontWeight:900, color:CYAN }}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('buss-name-input')?.focus()}
              />
            </div>

            {/* Nickname */}
            <div>
              <label style={sLabelStyle}>ชื่อเล่น</label>
              <input
                id="buss-name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value.slice(0, 20))}
                placeholder="ชื่อที่จะแสดงในเกม"
                maxLength={20}
                style={sInputStyle}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>

            {joinError && (
              <div style={{ color:'#ff6b6b', fontSize:14, textAlign:'center', animation:'buss-s-slideUp 0.3s' }}>
                {joinError}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                ...sBtnStyle(CYAN, '#000'),
                fontSize:18, padding:'14px', fontWeight:900,
                opacity: joining ? 0.6 : 1,
                boxShadow: `0 0 20px ${CYAN}55`,
              }}
            >
              {joining ? '⏳ กำลังเข้า...' : '🚀 เข้าเล่น'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: LOBBY ──────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div style={fullPage}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', padding:24, gap:24 }}>

          <div style={{ fontSize:52, animation:'buss-s-pulse 2s infinite' }}>⏳</div>

          <div style={{ textAlign:'center', animation:'buss-s-slideUp 0.5s' }}>
            <div style={{ fontSize:20, fontWeight:700, color:CYAN }}>รอครูเริ่มเกม</div>
            <div style={{ color:'#aaa', fontSize:14, marginTop:4 }}>ห้อง: <strong style={{ color:CYAN, fontFamily:'monospace', letterSpacing:3 }}>{room}</strong></div>
          </div>

          <div style={{ background:'#ffffff11', borderRadius:20, padding:'12px 24px', textAlign:'center' }}>
            <div style={{ fontSize:40, fontWeight:900, color:GOLD }}>{playerCount}</div>
            <div style={{ color:'#aaa', fontSize:14 }}>คนในห้อง</div>
          </div>

          <div style={{ background:`${CYAN}22`, border:`1px solid ${CYAN}44`, borderRadius:12, padding:'10px 20px', textAlign:'center' }}>
            <span style={{ color:CYAN, fontWeight:600 }}>คุณคือ: </span>
            <span style={{ color:'#fff', fontWeight:700 }}>{name}</span>
          </div>

          <div style={{ color:'#555', fontSize:13, display:'flex', gap:4 }}>
            <span>กำลังรอ</span>
            <span style={{ animation:'buss-s-pulse 1s infinite' }}>...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: QUESTION ──────────────────────────────────────────────────
  if (phase === 'question' && question) {
    return (
      <div style={{ ...fullPage, display:'flex', flexDirection:'column' }}>

        {/* Top bar */}
        <div style={{ background:'#16163a', padding:'10px 16px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ color:CYAN, fontSize:13, fontWeight:600 }}>ข้อ {currentQIdx + 1}/{totalQ}</span>
            <span style={{ marginLeft:'auto', fontSize:26, fontWeight:900, fontFamily:'monospace', color:timerColor, textShadow:`0 0 10px ${timerColor}` }}>
              {Math.ceil(timeLeft)}
            </span>
          </div>
          <div style={{ background:'#2a2a4a', borderRadius:20, height:8, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:20,
              background: timerColor,
              width:`${timerPct}%`,
              transition:'width 0.1s linear',
            }} />
          </div>
        </div>

        {/* Question text */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{
            fontSize:'clamp(16px,5vw,26px)', fontWeight:700, textAlign:'center', lineHeight:1.5, color:'#fff',
            animation:'buss-s-popIn 0.4s ease',
            maxWidth:500,
          }}>
            {question.q}
          </div>
        </div>

        {/* Answer buttons */}
        <div style={{ padding:'0 16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, flexShrink:0 }}>
          {[0,1,2,3].map(ci => {
            const cfg = ANSWER_CFG[ci];
            const isSelected = myChoice === ci;
            return (
              <button
                key={ci}
                onClick={() => handleAnswer(ci)}
                disabled={myChoice !== null || timedOut}
                style={{
                  background: isSelected ? cfg.light : cfg.color,
                  border: `3px solid ${isSelected ? '#fff' : 'transparent'}`,
                  borderRadius:16, color:'#fff', fontFamily:FONT, cursor: myChoice !== null ? 'default' : 'pointer',
                  padding:'16px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  opacity: (myChoice !== null && !isSelected) ? 0.5 : 1,
                  fontSize:14, fontWeight:700, minHeight:80,
                  transition:'transform 0.15s, opacity 0.2s',
                  transform: isSelected ? 'scale(0.97)' : 'scale(1)',
                  boxShadow: isSelected ? `0 0 20px ${cfg.color}` : `0 4px 12px ${cfg.color}44`,
                  animation: isSelected ? 'buss-s-tapIn 0.2s ease' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{ fontSize:28 }}>{cfg.icon}</span>
                <span style={{ fontSize:'clamp(11px,3vw,15px)', lineHeight:1.3, textAlign:'center', wordBreak:'break-word' }}>
                  {question.choices?.[ci] || ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── RENDER: WAITING (after answer or timeout) ──────────────────────────
  if (phase === 'waiting') {
    const chosenCfg = myChoice !== null ? ANSWER_CFG[myChoice] : null;
    return (
      <div style={{ ...fullPage, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:24 }}>

        {/* Chosen answer or timeout */}
        {timedOut && myChoice === null ? (
          <div style={{ textAlign:'center', animation:'buss-s-slideUp 0.4s' }}>
            <div style={{ fontSize:52 }}>⏰</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#ff6b6b', marginTop:8 }}>หมดเวลา!</div>
            <div style={{ color:'#888', fontSize:14, marginTop:4 }}>ไม่ได้เลือกคำตอบ</div>
          </div>
        ) : chosenCfg && (
          <div style={{ textAlign:'center', animation:'buss-s-slideUp 0.4s' }}>
            <div style={{
              background:chosenCfg.color, borderRadius:20, padding:'18px 36px',
              fontSize:32, fontWeight:900, display:'inline-flex', alignItems:'center', gap:12,
              boxShadow:`0 0 24px ${chosenCfg.color}88`,
            }}>
              <span>{chosenCfg.icon}</span>
              <span>{chosenCfg.label}</span>
            </div>
            <div style={{ color:'#aaa', fontSize:14, marginTop:12 }}>{question?.choices?.[myChoice] || ''}</div>
          </div>
        )}

        {/* Waiting indicator */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <div style={{ fontSize:36, animation:'buss-s-pulse 1.5s infinite' }}>⏳</div>
          <div style={{ color:CYAN, fontWeight:600, fontSize:16 }}>รอเฉลย...</div>
        </div>

        {/* Answer count */}
        {serverState && (
          <div style={{ color:'#666', fontSize:13 }}>
            {serverState.answerCount}/{serverState.playerCount} ตอบแล้ว
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: REVEAL ─────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const ans = myAnswer || serverState?.myAnswer;
    const isCorrect = ans?.correct ?? false;
    const points    = ans?.points ?? 0;

    // Correct answer from server
    const correctIdx = serverState?.question?.answer;
    const correctCfg = correctIdx != null ? ANSWER_CFG[correctIdx] : null;

    return (
      <div style={{ ...fullPage, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:24 }}>

        {/* Result */}
        <div style={{ textAlign:'center', animation: isCorrect ? 'buss-s-correct 0.6s ease' : 'buss-s-wrong 0.5s ease' }}>
          {isCorrect ? (
            <>
              <div style={{ fontSize:64 }}>✅</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#26890c', marginTop:8 }}>ถูกต้อง!</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:64 }}>❌</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#e21b3c', marginTop:8 }}>
                {(timedOut || myChoice === null) ? 'หมดเวลา' : 'ผิด'}
              </div>
            </>
          )}
        </div>

        {/* Points */}
        {isCorrect && (
          <div style={{ textAlign:'center', animation:'buss-s-pts 0.6s ease' }}>
            <div style={{ fontSize:44, fontWeight:900, color:GOLD, textShadow:`0 0 20px ${GOLD}` }}>+{points}</div>
            <div style={{ color:'#aaa', fontSize:14 }}>คะแนน</div>
          </div>
        )}

        {/* Correct answer reveal */}
        {correctCfg && (
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#aaa', fontSize:13, marginBottom:6 }}>คำตอบที่ถูก:</div>
            <div style={{
              background:correctCfg.color, borderRadius:12, padding:'10px 24px',
              display:'inline-flex', alignItems:'center', gap:10,
              fontSize:16, fontWeight:700, color:'#fff',
              boxShadow:`0 0 16px ${correctCfg.color}88`,
            }}>
              <span>{correctCfg.icon}</span>
              <span>{serverState?.question?.choices?.[correctIdx] || ''}</span>
            </div>
          </div>
        )}

        {/* Total score + rank */}
        <div style={{ display:'flex', gap:20 }}>
          <div style={{ textAlign:'center', background:'#ffffff11', borderRadius:12, padding:'10px 20px' }}>
            <div style={{ fontSize:26, fontWeight:900, color:CYAN }}>{myScore}</div>
            <div style={{ color:'#888', fontSize:12 }}>คะแนนรวม</div>
          </div>
          {myRank > 0 && (
            <div style={{ textAlign:'center', background:'#ffffff11', borderRadius:12, padding:'10px 20px' }}>
              <div style={{ fontSize:26, fontWeight:900, color:GOLD }}>#{myRank}</div>
              <div style={{ color:'#888', fontSize:12 }}>อันดับ</div>
            </div>
          )}
        </div>

        <div style={{ color:'#555', fontSize:13, animation:'buss-s-pulse 1.5s infinite' }}>
          รอคำถามถัดไป...
        </div>
      </div>
    );
  }

  // ── RENDER: FINISHED ───────────────────────────────────────────────────
  if (phase === 'finished') {
    const finalRank  = serverState?.players
      ? serverState.players.findIndex(p => p.id === pid) + 1
      : 0;
    const finalScore = serverState?.players?.find(p => p.id === pid)?.score ?? myScore;
    const isFirst    = finalRank === 1;

    return (
      <div style={{ ...fullPage, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, overflow:'hidden', position:'relative' }}>

        {/* Confetti */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{
              position:'absolute', left:`${Math.random() * 100}%`, top:'-20px',
              width: 8 + Math.random() * 8, height: 8 + Math.random() * 8,
              background: [CYAN, MAGENTA, GOLD, '#ff6b35', '#a855f7'][i % 5],
              borderRadius: i % 2 === 0 ? '50%' : 2,
              animation: `buss-s-confetti ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`,
            }} />
          ))}
        </div>

        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:20, width:'100%', maxWidth:360 }}>

          {/* Crown / rank badge */}
          <div style={{ textAlign:'center', animation:'buss-s-crown 0.8s ease' }}>
            {isFirst ? (
              <>
                <div style={{ fontSize:72 }}>👑</div>
                <div style={{ fontSize:22, fontWeight:900, color:GOLD, marginTop:4, textShadow:`0 0 20px ${GOLD}` }}>
                  แชมป์! อันดับ 1!
                </div>
              </>
            ) : finalRank === 2 ? (
              <>
                <div style={{ fontSize:60 }}>🥈</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#ccc' }}>อันดับ 2 เยี่ยมมาก!</div>
              </>
            ) : finalRank === 3 ? (
              <>
                <div style={{ fontSize:60 }}>🥉</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#cd7f32' }}>อันดับ 3 สุดยอด!</div>
              </>
            ) : (
              <>
                <div style={{ fontSize:52 }}>🎉</div>
                <div style={{ fontSize:20, fontWeight:700, color:CYAN }}>จบเกมแล้ว!</div>
              </>
            )}
          </div>

          {/* Final score */}
          <div style={{ background:'#ffffff11', borderRadius:16, padding:'16px 32px', textAlign:'center' }}>
            <div style={{ fontSize:48, fontWeight:900, color:GOLD, textShadow:`0 0 16px ${GOLD}` }}>{finalScore}</div>
            <div style={{ color:'#aaa', fontSize:14 }}>คะแนนรวม</div>
          </div>

          {/* Rank */}
          {finalRank > 0 && (
            <div style={{ color:'#aaa', fontSize:16, fontWeight:600 }}>
              อันดับที่ <strong style={{ color:CYAN, fontSize:20 }}>{finalRank}</strong>
              {' '}จาก <strong style={{ color:'#fff' }}>{serverState?.playerCount || playerCount}</strong> คน
            </div>
          )}

          {/* Top 5 leaderboard */}
          {serverState?.players && (
            <div style={{ width:'100%', background:'#16163a', borderRadius:14, padding:'14px 16px' }}>
              <div style={{ fontWeight:700, color:CYAN, marginBottom:10, fontSize:14 }}>🏆 Top 5</div>
              {serverState.players.slice(0, 5).map((p, i) => {
                const isMe = p.id === pid;
                return (
                  <div key={p.id} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
                    borderRadius:8, marginBottom:4,
                    background: isMe ? `${CYAN}22` : i % 2 === 0 ? '#ffffff08' : 'transparent',
                    border: isMe ? `1px solid ${CYAN}55` : '1px solid transparent',
                  }}>
                    <span style={{ minWidth:22, color: i === 0 ? GOLD : '#888', fontWeight:700, fontSize:14 }}>
                      {i === 0 ? '👑' : `#${i+1}`}
                    </span>
                    <span style={{ flex:1, fontSize:14, fontWeight: isMe ? 700 : 400 }}>
                      {p.name}{isMe ? ' (คุณ)' : ''}
                    </span>
                    <span style={{ fontWeight:700, color: i === 0 ? GOLD : '#aaa', fontSize:14 }}>{p.score}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ color:'#555', fontSize:13, textAlign:'center' }}>ขอบคุณที่ร่วมเล่น BUS-SANOOK! 🎮</div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ ...fullPage, display:'flex', alignItems:'center', justifyContent:'center', color:CYAN, fontSize:20 }}>
      ⏳ กำลังโหลด...
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────────────────────
const fullPage = {
  minHeight: '100dvh',
  background: BG,
  fontFamily: FONT,
  color: '#fff',
};

const sLabelStyle = {
  display: 'block',
  fontSize: 13,
  color: '#aaa',
  marginBottom: 6,
  fontWeight: 600,
};

const sInputStyle = {
  width: '100%',
  background: '#16163a',
  color: '#fff',
  border: '2px solid #333',
  borderRadius: 12,
  padding: '14px 16px',
  fontFamily: FONT,
  fontSize: 16,
  outline: 'none',
};

function sBtnStyle(bg, color = '#fff') {
  return {
    width: '100%',
    background: bg,
    color,
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: 16,
    transition: 'opacity 0.2s',
  };
}

// ── Page export with Suspense boundary ────────────────────────────────────────
export default function BusSanookStudentPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100dvh', background:BG, fontFamily:FONT, color:CYAN, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
        ⏳ กำลังโหลด...
      </div>
    }>
      <BusSanookStudentInner />
    </Suspense>
  );
}

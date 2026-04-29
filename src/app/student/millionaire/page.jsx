'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentSplash from '@/components/StudentSplash';

const FONT = "'Kanit', 'Noto Sans Thai', sans-serif";

const PRIZES_FMT = ['500','1,000','2,000','3,000','5,000','10,000','20,000','30,000','50,000','100,000','150,000','250,000','500,000','750,000','1,000,000'];
const SAFE_AT = [5, 10];

const TEAM_CFG = [
  { grad:'linear-gradient(135deg,#1d4ed8,#7c3aed)', border:'#60a5fa', glow:'rgba(59,130,246,0.5)', emoji:'🔵' },
  { grad:'linear-gradient(135deg,#be185d,#9333ea)', border:'#f472b6', glow:'rgba(236,72,153,0.5)', emoji:'🩷' },
];

const TILE = {
  A: { bg:'#c0392b', hover:'#e74c3c', icon:'▲' },
  B: { bg:'#1a5276', hover:'#2980b9', icon:'◆' },
  C: { bg:'#0b5345', hover:'#148f77', icon:'●' },
  D: { bg:'#6e2f1a', hover:'#d35400', icon:'■' },
};

// Keep OPT for revealed-phase answer box coloring
const OPT = {
  A:{ bg:'linear-gradient(135deg,#1e3a8a,#2563eb)', border:'#60a5fa', glow:'#3b82f6', icon:'▲', dark:'#1e3a8a' },
  B:{ bg:'linear-gradient(135deg,#831843,#be185d)', border:'#f472b6', glow:'#ec4899', icon:'◆', dark:'#831843' },
  C:{ bg:'linear-gradient(135deg,#064e3b,#047857)', border:'#34d399', glow:'#10b981', icon:'●', dark:'#064e3b' },
  D:{ bg:'linear-gradient(135deg,#3b0764,#6d28d9)', border:'#a78bfa', glow:'#8b5cf6', icon:'■', dark:'#3b0764' },
};

function genVoterId() { return Math.random().toString(36).slice(2)+Date.now().toString(36); }

// ── Audio ─────────────────────────────────────────────────────────────────────
function getCtx(r) { if(!r.current) try{r.current=new(window.AudioContext||window.webkitAudioContext)();}catch{} return r.current; }
function wake(r){ const c=getCtx(r); if(c?.state==='suspended') c.resume(); return c; }
function note(ctx,freq,type,gain,start,dur){ try{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type=type;o.frequency.setValueAtTime(freq,start); g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(gain,start+0.02); g.gain.exponentialRampToValueAtTime(0.001,start+dur); o.start(start);o.stop(start+dur+0.02); }catch{} }
function playJoin(r){ const c=wake(r);if(!c)return; [523,659,784,1047].forEach((f,i)=>note(c,f,'triangle',0.18,c.currentTime+i*0.1,0.25)); }
function playTeamSelect(r){ const c=wake(r);if(!c)return; const t=c.currentTime; note(c,220,'sine',0.35,t,0.18);note(c,440,'triangle',0.22,t+0.06,0.28);note(c,880,'triangle',0.18,t+0.14,0.35); }
function playVote(r){ const c=wake(r);if(!c)return; const t=c.currentTime; note(c,440,'square',0.12,t,0.06);note(c,660,'triangle',0.18,t+0.07,0.15);note(c,880,'sine',0.14,t+0.14,0.25); }
function playReveal(r){ const c=wake(r);if(!c)return; const t=c.currentTime; try{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sawtooth';o.frequency.setValueAtTime(100,t);o.frequency.exponentialRampToValueAtTime(1800,t+0.5);g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.55);o.start(t);o.stop(t+0.6);}catch{} }
function playCorrect(r){ const c=wake(r);if(!c)return; const t=c.currentTime; [523,659,784,1047,1319,1568].forEach((f,i)=>note(c,f,i<3?'triangle':'sine',0.22,t+i*0.1,0.4)); note(c,65,'sine',0.4,t,0.5); }
function playWrong(r){ const c=wake(r);if(!c)return; const t=c.currentTime; [440,349,277,196].forEach((f,i)=>note(c,f,'sawtooth',0.2,t+i*0.18,0.3)); }
function playQAppear(r){ const c=wake(r);if(!c)return; const t=c.currentTime; note(c,80,'sawtooth',0.12,t,0.4); [200,280,380,500,660].forEach((f,i)=>note(c,f,'triangle',0.13-i*0.015,t+0.05+i*0.07,0.2)); note(c,880,'sine',0.2,t+0.52,0.45); }
function playLifeline(r){ const c=wake(r);if(!c)return; const t=c.currentTime; note(c,880,'triangle',0.15,t,0.1);note(c,1047,'sine',0.18,t+0.08,0.15);note(c,1319,'sine',0.14,t+0.18,0.25); }

// ── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes popIn   { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shakeX  { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
  @keyframes tada    { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 60%{transform:scale(1.1) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes correct { 0%{transform:scale(0.7) rotate(-8deg);opacity:0} 60%{transform:scale(1.1) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
`;

// ── Main component ───────────────────────────────────────────────────────────
function StudentMillionaireInner() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room') || '';

  const [room, setRoom]           = useState(roomParam);
  const [roomInput, setRoomInput] = useState(roomParam); // pre-fill from URL
  const [phase, setPhase]         = useState('join');
  const [gameMode, setGameMode]   = useState('teams');
  const [joining, setJoining]     = useState(false);
  const [joinError, setJoinError] = useState('');

  // Team
  const [teamIdx, setTeamIdx]         = useState(null);
  const [teamNames, setTeamNames]     = useState(['ทีม ฟ้า','ทีม ชมพู']);
  const [draftNames, setDraftNames]   = useState(['','']);
  const [editingTeam, setEditingTeam] = useState(null);

  // Game
  const [questionData, setQuestionData]     = useState(null);
  const [questionNum, setQuestionNum]       = useState(1);
  const [voted, setVoted]                   = useState(null);
  const [correctAnswer, setCorrectAnswer]   = useState(null);
  const [error, setError]                   = useState('');
  const [barState, setBarState]             = useState('idle');

  // Lifelines
  const [lifelines, setLifelines]           = useState({ fifty:true, audience:true, skip:true });
  const [hiddenOptions, setHiddenOptions]   = useState([]);
  const [audienceVotes, setAudienceVotes]   = useState(null);
  const [showAudience, setShowAudience]     = useState(false);
  const [lifelineMsg, setLifelineMsg]       = useState('');

  const voterIdRef       = useRef(null);
  const questionIdxRef   = useRef(-1);
  const pollErrRef       = useRef(0);
  const audioRef         = useRef(null);
  const audioUnlocked    = useRef(false);
  const lastPlayedQRef   = useRef(-1);

  // Stable voter ID
  useEffect(()=>{
    let id=''; try{id=localStorage.getItem('mill_voter_id')||'';}catch{}
    if(!id){id=genVoterId(); try{localStorage.setItem('mill_voter_id',id);}catch{}}
    voterIdRef.current=id;
  },[]);

  // Auto-join when room code is in URL (QR scan)
  useEffect(()=>{
    if(!roomParam) return;
    const autoJoin = async()=>{
      try{
        const res = await fetch(`/api/teacher/millionaire?room=${roomParam}&action=get_question`);
        if(res.status===404){ setError('ไม่พบห้องนี้ — ลองสแกน QR ใหม่'); setPhase('error'); return; }
        if(!res.ok) return;
        const data = await res.json();
        if(data.teamNames){ setTeamNames(data.teamNames); setDraftNames(data.teamNames.map(()=>'')); }
        const mode = data.mode||'teams';
        setGameMode(mode);
        playJoin(audioRef);
        if(mode==='solo'){ setTeamIdx(null); setPhase('waiting'); }
        else setPhase('team_select');
      }catch{
        // network error → fall back to manual join form (roomInput already pre-filled)
      }
    };
    autoJoin();
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  const unlockAudio = ()=>{
    if(audioUnlocked.current) return;
    audioUnlocked.current=true;
    const c=getCtx(audioRef); if(c?.state==='suspended') c.resume();
  };

  // Reset per-question state when question changes
  useEffect(()=>{ setHiddenOptions([]); setAudienceVotes(null); setShowAudience(false); setLifelineMsg(''); },[questionNum]);

  // ── Poll ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!room || phase==='join'||phase==='team_select'||phase==='error') return;
    const poll = async()=>{
      try{
        const res = await fetch(`/api/teacher/millionaire?room=${room}&action=get_question`);
        if(res.status===404){ pollErrRef.current+=1; if(pollErrRef.current>=6){setError('ห้องปิดแล้ว หรือรหัสไม่ถูกต้อง');setPhase('error');} return; }
        pollErrRef.current=0;
        if(!res.ok) return;
        const data = await res.json();
        if(data.teamNames) setTeamNames(data.teamNames);

        if(!data.question){ if(phase!=='waiting') setPhase('waiting'); return; }

        if(data.questionIndex !== questionIdxRef.current){
          questionIdxRef.current = data.questionIndex;
          setQuestionNum(data.questionIndex+1);
          setQuestionData(data.question);
          setVoted(null); setCorrectAnswer(null); setBarState('idle');
          if(data.revealed){
            playReveal(audioRef);
            setTimeout(()=>data.correctAnswer ? playCorrect(audioRef):null,400);
            setCorrectAnswer(data.correctAnswer);
            setBarState('correct');
            setPhase('revealed');
          } else {
            if(lastPlayedQRef.current!==data.questionIndex){ lastPlayedQRef.current=data.questionIndex; playQAppear(audioRef); }
            setPhase('question');
          }
          return;
        }

        setQuestionData(data.question);
        if(data.revealed && phase!=='revealed'){
          playReveal(audioRef);
          setTimeout(()=>{ if(voted===data.correctAnswer) playCorrect(audioRef); else playWrong(audioRef); },500);
          setCorrectAnswer(data.correctAnswer);
          setBarState(voted===data.correctAnswer?'correct':'wrong');
          setPhase('revealed');
        }
      }catch{}
    };
    poll();
    const iv = setInterval(poll,2000);
    return()=>clearInterval(iv);
  },[room,phase,voted]);

  // ── Join ──────────────────────────────────────────────────────────────────
  const joinRoom = async()=>{
    unlockAudio();
    const code = roomInput.trim().toUpperCase();
    if(code.length<4) return;
    setJoining(true); setJoinError('');
    try{
      const res = await fetch(`/api/teacher/millionaire?room=${code}&action=get_question`);
      if(res.status===404){ setJoinError('ไม่พบห้องนี้ — ตรวจสอบรหัสอีกครั้ง'); setJoining(false); return; }
      const data = res.ok ? await res.json() : {};
      if(data.teamNames){ setTeamNames(data.teamNames); setDraftNames(data.teamNames.map(()=>'')); }
      const mode = data.mode||'teams';
      setGameMode(mode); setRoom(code); playJoin(audioRef);
      if(mode==='solo'){ setTeamIdx(null); setPhase('waiting'); }
      else setPhase('team_select');
    }catch{ setJoinError('เชื่อมต่อไม่ได้ — ลองใหม่อีกครั้ง'); }
    finally{ setJoining(false); }
  };

  // ── Select team ───────────────────────────────────────────────────────────
  const selectTeam = async(idx)=>{
    unlockAudio(); playTeamSelect(audioRef);
    setTeamIdx(idx); setEditingTeam(null); setPhase('waiting');
    try{
      const draft = draftNames[idx]?.trim();
      if(draft && draft!==teamNames[idx]){
        const r = await fetch('/api/teacher/millionaire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rename_team',room,teamIdx:idx,name:draft})});
        const d = await r.json(); if(d.teamNames) setTeamNames(d.teamNames);
      }
      await fetch('/api/teacher/millionaire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'join_team',room,voterId:voterIdRef.current,teamIdx:idx})});
    }catch{}
  };

  // ── Vote ──────────────────────────────────────────────────────────────────
  const vote = async(answer)=>{
    if(voted||phase!=='question') return;
    unlockAudio(); playVote(audioRef);
    setVoted(answer); setPhase('voted');
    try{
      const res = await fetch('/api/teacher/millionaire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'vote',room,answer,voterId:voterIdRef.current})});
      const data = await res.json();
      if(data.soloReveal){
        playReveal(audioRef);
        setCorrectAnswer(data.correctAnswer);
        const correct = answer===data.correctAnswer;
        setBarState(correct?'correct':'wrong');
        setTimeout(()=>{ if(correct) playCorrect(audioRef); else playWrong(audioRef); },400);
        setPhase('revealed');
      }
    }catch{}
  };

  // ── Lifelines ─────────────────────────────────────────────────────────────
  const useLifeline = async(type)=>{
    if(!lifelines[type]||phase!=='question') return;
    unlockAudio(); playLifeline(audioRef);
    setLifelines(l=>({...l,[type]:false}));

    if(type==='fifty'){
      setLifelineMsg('✂️ ตัดตัวเลือกผิด 2 ข้อ...');
      try{
        const res = await fetch(`/api/teacher/millionaire?room=${room}&action=get_fifty_fifty`);
        if(res.ok){ const d=await res.json(); if(d.hide) setHiddenOptions(d.hide); }
      }catch{}
      setLifelineMsg('');
    }

    if(type==='audience'){
      setLifelineMsg('👥 กำลังดูผลโหวต...');
      try{
        const res = await fetch(`/api/teacher/millionaire?room=${room}&action=get_votes`);
        if(res.ok){ const d=await res.json(); setAudienceVotes(d.votes); setShowAudience(true); }
      }catch{}
      setLifelineMsg('');
    }

    if(type==='skip'){
      setLifelineMsg('⏭ ข้ามข้อนี้แล้ว');
      setVoted('SKIP'); setPhase('voted');
      setTimeout(()=>setLifelineMsg(''),1500);
    }
  };

  const tc = teamIdx!==null ? TEAM_CFG[teamIdx] : null;
  const prizeIdx = Math.max(0, Math.min(14, questionNum - 1));
  const prizePct = Math.min(100, (questionNum / 15) * 100);

  // ════════════════════════════════════════════════════════════════
  // JOIN
  // ════════════════════════════════════════════════════════════════
  if(phase==='join') return (
    <div style={{height:'100dvh',minHeight:'100vh',background:'#0d1117',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 20px',fontFamily:FONT}} onClick={unlockAudio}>
      <style>{CSS}</style>

      <div style={{width:'100%',maxWidth:380,animation:'slideUp 0.5s ease'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:60,marginBottom:10}}>🎰</div>
          <h1 style={{margin:'0 0 6px',fontSize:30,fontWeight:900,color:'#fff',letterSpacing:2}}>เกมเศรษฐี</h1>
          <p style={{color:'rgba(147,197,253,0.5)',fontSize:11,margin:0,letterSpacing:2}}>WHO WANTS TO BE A MILLIONAIRE?</p>
        </div>

        {/* Card */}
        <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'24px 20px'}}>
          <input
            autoFocus
            value={roomInput}
            onChange={e=>{setRoomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''));setJoinError('');}}
            onKeyDown={e=>e.key==='Enter'&&joinRoom()}
            placeholder="XXXXXX" maxLength={8} disabled={joining}
            style={{
              width:'100%',padding:'16px',borderRadius:12,
              border:`2px solid ${joinError?'#f87171':roomInput.length>=4?'#60a5fa':'rgba(255,255,255,0.12)'}`,
              background:'rgba(0,0,0,0.35)',color:'#fff',
              fontSize:32,fontWeight:900,textAlign:'center',letterSpacing:8,
              fontFamily:"'Courier New',monospace",outline:'none',
              marginBottom:joinError?6:14,transition:'border-color 0.2s',
            }}
          />

          {joinError && <div style={{color:'#fca5a5',fontSize:13,textAlign:'center',marginBottom:10,fontWeight:600}}>⚠️ {joinError}</div>}

          <button onClick={joinRoom} disabled={roomInput.length<4||joining}
            style={{
              width:'100%',padding:'15px',borderRadius:12,border:'none',
              background:(roomInput.length>=4&&!joining)?'linear-gradient(135deg,#1d4ed8,#7c3aed)':'rgba(255,255,255,0.07)',
              color:(roomInput.length>=4&&!joining)?'#fff':'rgba(255,255,255,0.25)',
              fontSize:17,fontWeight:800,cursor:(roomInput.length>=4&&!joining)?'pointer':'not-allowed',
              fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',gap:8,
            }}>
            {joining
              ? <><span style={{display:'inline-block',width:17,height:17,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>กำลังเชื่อมต่อ…</>
              : 'เข้าร่วม →'}
          </button>
        </div>

        <p style={{textAlign:'center',color:'rgba(255,255,255,0.2)',fontSize:12,marginTop:14}}>📱 หรือสแกน QR Code บนจอหน้าห้อง</p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // TEAM SELECT
  // ════════════════════════════════════════════════════════════════
  if(phase==='team_select') return (
    <div style={{height:'100dvh',minHeight:'100vh',background:'#0d1117',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 16px',fontFamily:FONT}} onClick={unlockAudio}>
      <style>{CSS}</style>

      <div style={{textAlign:'center',marginBottom:20,animation:'slideUp 0.4s ease'}}>
        <h2 style={{color:'#f1f5f9',fontSize:20,fontWeight:900,margin:'0 0 8px'}}>เลือกทีมของคุณ</h2>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.07)',borderRadius:20,padding:'4px 14px',border:'1px solid rgba(255,255,255,0.1)'}}>
          <span style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>ห้อง</span>
          <span style={{color:'#60a5fa',fontFamily:'monospace',letterSpacing:3,fontWeight:800,fontSize:14}}>{room}</span>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:12,width:'100%',maxWidth:380,animation:'slideUp 0.5s ease 0.08s both'}}>
        {[0,1].map(i=>{
          const cfg=TEAM_CFG[i]; const isEditing=editingTeam===i;
          const displayName=draftNames[i]?.trim()||teamNames[i];
          return (
            <div key={i} style={{borderRadius:20,background:cfg.grad,border:`2px solid ${cfg.border}50`,overflow:'hidden',boxShadow:`0 8px 28px ${cfg.glow}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px 10px'}}>
                <span style={{fontSize:28}}>{cfg.emoji}</span>
                {isEditing?(
                  <input autoFocus value={draftNames[i]} onChange={e=>setDraftNames(p=>{const n=[...p];n[i]=e.target.value.slice(0,20);return n;})} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape') setEditingTeam(null);}} placeholder={teamNames[i]}
                    style={{flex:1,background:'rgba(0,0,0,0.3)',border:'1.5px solid rgba(255,255,255,0.4)',borderRadius:10,padding:'8px 12px',color:'#fff',fontSize:15,fontWeight:800,fontFamily:FONT,outline:'none'}} onClick={e=>e.stopPropagation()}/>
                ):(
                  <span style={{flex:1,color:'#fff',fontSize:18,fontWeight:900}}>{displayName}</span>
                )}
                <button onClick={e=>{e.stopPropagation();if(isEditing){setEditingTeam(null);}else{setDraftNames(p=>{const n=[...p];n[i]=teamNames[i];return n;});setEditingTeam(i);}}}
                  style={{background:'rgba(255,255,255,0.18)',border:'none',borderRadius:8,padding:'6px 10px',color:'#fff',fontSize:13,cursor:'pointer',fontFamily:FONT,flexShrink:0}}>
                  {isEditing?'✓':'✏️'}
                </button>
              </div>
              <button onClick={()=>selectTeam(i)} style={{width:'100%',padding:'13px',borderTop:'1px solid rgba(255,255,255,0.15)',background:'rgba(0,0,0,0.2)',color:'#fff',fontFamily:FONT,fontSize:16,fontWeight:800,cursor:'pointer',border:'none',letterSpacing:0.5}}>
                เข้าร่วมทีมนี้ →
              </button>
            </div>
          );
        })}
      </div>
      <p style={{color:'rgba(255,255,255,0.2)',fontSize:12,marginTop:18,textAlign:'center'}}>
        💡 แตะ ✏️ เพื่อตั้งชื่อทีม
      </p>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // ERROR
  // ════════════════════════════════════════════════════════════════
  if(phase==='error') return (
    <div style={{height:'100dvh',minHeight:'100vh',background:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:FONT}}>
      <style>{CSS}</style>
      <div style={{textAlign:'center',animation:'popIn 0.4s ease',maxWidth:320}}>
        <div style={{fontSize:60,marginBottom:14}}>😕</div>
        <h2 style={{color:'#f1f5f9',fontSize:21,fontWeight:800,margin:'0 0 8px'}}>การเชื่อมต่อขาดหาย</h2>
        <p style={{color:'rgba(244,114,182,0.9)',fontSize:14,margin:'0 0 24px'}}>{error||'เกิดข้อผิดพลาด'}</p>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {room&&<button onClick={()=>{pollErrRef.current=0;setError('');setPhase(teamIdx!==null?'waiting':'team_select');}} style={{padding:'15px 24px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',color:'#fff',cursor:'pointer',fontSize:16,fontWeight:800,fontFamily:FONT}}>🔄 เชื่อมต่อใหม่</button>}
          <button onClick={()=>{setPhase('join');setRoom('');setRoomInput('');setJoinError('');setError('');setTeamIdx(null);pollErrRef.current=0;}} style={{padding:'13px 24px',borderRadius:14,border:'1px solid rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.55)',cursor:'pointer',fontSize:14,fontFamily:FONT}}>ใส่รหัสห้องใหม่</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // WAITING
  // ════════════════════════════════════════════════════════════════
  if(phase==='waiting') return (
    <div style={{height:'100dvh',minHeight:'100vh',background:'#0d1117',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:FONT,textAlign:'center'}}>
      <style>{CSS}</style>
      <div style={{animation:'slideUp 0.5s ease'}}>

        {/* Team badge */}
        {gameMode==='solo'?(
          <div style={{display:'inline-flex',alignItems:'center',gap:10,background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',border:'2px solid #a78bfa',borderRadius:20,padding:'10px 22px',marginBottom:28,boxShadow:'0 8px 28px rgba(124,58,237,0.5)'}}>
            <span style={{fontSize:22}}>🎮</span>
            <span style={{color:'#fff',fontSize:17,fontWeight:900}}>เล่นคนเดียว</span>
          </div>
        ):tc?(
          <div style={{display:'inline-flex',alignItems:'center',gap:10,background:tc.grad,border:`2px solid ${tc.border}`,borderRadius:20,padding:'10px 22px',marginBottom:28,boxShadow:`0 8px 28px ${tc.glow}`}}>
            <span style={{fontSize:24}}>{tc.emoji}</span>
            <span style={{color:'#fff',fontSize:17,fontWeight:900}}>{teamNames[teamIdx??0]}</span>
          </div>
        ):null}

        {/* Spinner */}
        <div style={{fontSize:56,marginBottom:20,display:'inline-block',animation:'spin 2s linear infinite'}}>⏳</div>

        <h2 style={{color:'#f1f5f9',fontSize:22,fontWeight:900,margin:'0 0 8px'}}>เข้าร่วมสำเร็จ!</h2>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:14,margin:'0 0 6px'}}>รออาจารย์เริ่มคำถาม</p>
        <p style={{color:'rgba(255,255,255,0.2)',fontSize:12,margin:0}}>
          ห้อง: <span style={{color:'#60a5fa',fontFamily:'monospace',letterSpacing:2}}>{room}</span>
        </p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // QUESTION
  // ════════════════════════════════════════════════════════════════
  if(phase==='question' && questionData) {
    const safe = SAFE_AT.includes(questionNum);
    return (
      <div style={{height:'100dvh',minHeight:'100vh',background:'#0d1117',display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:FONT}} onClick={unlockAudio}>
        <style>{CSS}</style>

        {/* ── Top bar (fixed height 50px) ── */}
        <div style={{flexShrink:0,height:50,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 14px',background:'rgba(0,0,0,0.5)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          {/* Team badge */}
          {tc?(
            <div style={{display:'inline-flex',alignItems:'center',gap:6,background:tc.grad,borderRadius:10,padding:'4px 10px',border:`1px solid ${tc.border}50`}}>
              <span style={{fontSize:14}}>{tc.emoji}</span>
              <span style={{color:'#fff',fontSize:12,fontWeight:800}}>{teamNames[teamIdx??0]}</span>
            </div>
          ):<div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(167,139,250,0.2)',borderRadius:10,padding:'4px 10px',border:'1px solid rgba(167,139,250,0.3)'}}><span style={{fontSize:12}}>🎮</span><span style={{color:'#c4b5fd',fontSize:11,fontWeight:700}}>Solo</span></div>}

          {/* Question + safe */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>ข้อ {questionNum}/15</span>
            {safe && <span style={{background:'rgba(251,191,36,0.2)',border:'1px solid rgba(251,191,36,0.5)',borderRadius:6,padding:'1px 6px',fontSize:10,color:'#fbbf24',fontWeight:700}}>🛡</span>}
          </div>

          {/* Prize */}
          <span style={{color:'#ffd700',fontSize:15,fontWeight:900}}>฿{PRIZES_FMT[prizeIdx]}</span>
        </div>

        {/* ── Prize progress bar (4px) ── */}
        <div style={{flexShrink:0,height:4,background:'rgba(255,255,255,0.06)'}}>
          <div style={{height:'100%',width:`${prizePct}%`,background:'linear-gradient(90deg,#1d4ed8,#7c3aed,#b45309)',transition:'width 0.9s ease'}}/>
        </div>

        {/* ── Question card (capped at 30dvh so tiles always get space) ── */}
        <div style={{flexShrink:0,padding:'8px 12px'}}>
          <div style={{background:'rgba(255,255,255,0.07)',border:'1.5px solid rgba(96,165,250,0.25)',borderRadius:16,padding:'14px',textAlign:'center',animation:'slideUp 0.35s ease',maxHeight:'30dvh',overflowY:'auto'}}>
            <div style={{color:'rgba(147,197,253,0.5)',fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:6}}>❓ คำถามข้อ {questionNum}</div>
            <p style={{color:'#fff',fontSize:17,fontWeight:700,lineHeight:1.6,margin:0}}>{questionData.question}</p>
          </div>
        </div>

        {/* ── Answer tiles (flex: 1, fills remaining space) ── */}
        <div style={{flex:1,minHeight:0,padding:'0 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr',gap:10,animation:'slideUp 0.4s ease 0.06s both'}}>
          {['A','B','C','D'].map(key=>{
            if(!questionData.options?.[key]) return null;
            if(hiddenOptions.includes(key)) return <div key={key} style={{borderRadius:12,background:'rgba(255,255,255,0.03)',border:'2px solid rgba(255,255,255,0.06)'}}/>;
            const t=TILE[key];
            return (
              <button key={key} onClick={()=>vote(key)}
                style={{
                  borderRadius:12,border:'none',background:t.bg,
                  color:'#fff',cursor:'pointer',fontFamily:FONT,
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
                  padding:'12px 10px',transition:'transform 0.1s,filter 0.1s',
                  boxShadow:`0 4px 16px rgba(0,0,0,0.4)`,
                }}
                onMouseEnter={e=>{e.currentTarget.style.filter='brightness(1.25)';}}
                onMouseLeave={e=>{e.currentTarget.style.filter='brightness(1)';}}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.93)'}
                onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
              >
                <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,flexShrink:0}}>
                  {key}
                </div>
                <span style={{fontSize:14,textAlign:'center',lineHeight:1.4,wordBreak:'break-word'}}>{questionData.options[key]}</span>
              </button>
            );
          })}
        </div>

        {/* ── Audience votes overlay (fixed above lifelines) ── */}
        {showAudience && audienceVotes && (
          <div style={{
            position:'fixed',bottom:52,left:0,right:0,
            background:'rgba(10,10,20,0.95)',borderTop:'1px solid rgba(255,255,255,0.1)',
            padding:'12px 16px',animation:'slideUp 0.3s ease',zIndex:10,
          }}>
            <div style={{color:'rgba(255,255,255,0.45)',fontSize:11,textAlign:'center',marginBottom:8,fontWeight:700}}>👥 ผลโหวตจากห้องเรียน</div>
            {['A','B','C','D'].filter(k=>questionData.options?.[k]).map(k=>{
              const total=Object.values(audienceVotes).reduce((a,b)=>a+b,0);
              const pct=total>0?Math.round((audienceVotes[k]||0)/total*100):0;
              const t=TILE[k];
              return (
                <div key={k} style={{marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2,fontSize:12,color:'rgba(255,255,255,0.6)'}}>
                    <span style={{fontWeight:700}}>{k}: {questionData.options[k]}</span>
                    <span style={{color:'rgba(255,255,255,0.8)'}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:'rgba(255,255,255,0.08)',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:t.bg,borderRadius:99,transition:'width 1s ease'}}/>
                  </div>
                </div>
              );
            })}
            <button onClick={()=>setShowAudience(false)} style={{marginTop:6,width:'100%',padding:'5px',background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'rgba(255,255,255,0.35)',fontSize:12,cursor:'pointer',fontFamily:FONT}}>ปิด ✕</button>
          </div>
        )}

        {/* ── Lifeline bottom bar (52px) ── */}
        <div style={{flexShrink:0,height:52,display:'flex',alignItems:'center',padding:'0 10px',gap:8,background:'rgba(0,0,0,0.5)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          {[
            {k:'fifty', icon:'✂️', label:'50:50'},
            {k:'audience', icon:'👥', label:'ดูโหวต'},
            {k:'skip', icon:'⏭', label:'ข้ามข้อ'},
          ].map(ll=>{
            const avail=lifelines[ll.k];
            return (
              <button key={ll.k} onClick={()=>avail&&useLifeline(ll.k)} disabled={!avail}
                style={{
                  flex:1,height:36,borderRadius:8,
                  border:`1.5px solid ${avail?'rgba(255,215,0,0.6)':'rgba(255,255,255,0.08)'}`,
                  background:avail?'rgba(255,215,0,0.08)':'rgba(255,255,255,0.02)',
                  color:avail?'#ffd700':'rgba(255,255,255,0.2)',
                  fontFamily:FONT,fontSize:11,fontWeight:700,
                  cursor:avail?'pointer':'not-allowed',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:4,
                  opacity:avail?1:0.4,
                }}
              >
                <span style={{fontSize:14,textDecoration:avail?'none':'line-through'}}>{avail?ll.icon:'✕'}</span>
                <span>{ll.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // VOTED — waiting for teacher reveal
  // ════════════════════════════════════════════════════════════════
  if(phase==='voted' && questionData) {
    const skipped = voted==='SKIP';
    const vTile = (!skipped && voted) ? TILE[voted] : null;
    const safe = SAFE_AT.includes(questionNum);
    return (
      <div style={{height:'100dvh',minHeight:'100vh',background:'#0d1117',display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:FONT}}>
        <style>{CSS}</style>

        {/* Top bar */}
        <div style={{flexShrink:0,height:50,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 14px',background:'rgba(0,0,0,0.5)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          {tc?(
            <div style={{display:'inline-flex',alignItems:'center',gap:6,background:tc.grad,borderRadius:10,padding:'4px 10px',border:`1px solid ${tc.border}50`}}>
              <span style={{fontSize:14}}>{tc.emoji}</span>
              <span style={{color:'#fff',fontSize:12,fontWeight:800}}>{teamNames[teamIdx??0]}</span>
            </div>
          ):<div style={{width:60}}/>}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>ข้อ {questionNum}/15</span>
            {safe && <span style={{background:'rgba(251,191,36,0.2)',border:'1px solid rgba(251,191,36,0.5)',borderRadius:6,padding:'1px 6px',fontSize:10,color:'#fbbf24',fontWeight:700}}>🛡</span>}
          </div>
          <span style={{color:'#ffd700',fontSize:15,fontWeight:900}}>฿{PRIZES_FMT[prizeIdx]}</span>
        </div>
        {/* Prize bar */}
        <div style={{flexShrink:0,height:4,background:'rgba(255,255,255,0.06)'}}>
          <div style={{height:'100%',width:`${prizePct}%`,background:'linear-gradient(90deg,#1d4ed8,#7c3aed,#b45309)',transition:'width 0.9s ease'}}/>
        </div>

        {/* Content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',textAlign:'center'}}>

          {/* Selected answer tile */}
          {!skipped && vTile ? (
            <div style={{
              width:'100%',maxWidth:320,borderRadius:16,background:vTile.bg,
              padding:'20px',marginBottom:24,opacity:0.65,
              animation:'popIn 0.4s ease',display:'flex',flexDirection:'column',alignItems:'center',gap:10,
            }}>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700,letterSpacing:2}}>✅ คำตอบของคุณ</div>
              <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:18}}>{voted}</div>
              <div style={{fontSize:18,fontWeight:900,color:'#fff',lineHeight:1.4}}>{questionData.options?.[voted]}</div>
            </div>
          ):(
            <div style={{width:'100%',maxWidth:320,borderRadius:16,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',padding:'20px',marginBottom:24,animation:'popIn 0.4s ease',textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:8}}>⏭</div>
              <div style={{fontSize:17,fontWeight:800,color:'rgba(255,255,255,0.6)'}}>ข้ามข้อนี้แล้ว</div>
            </div>
          )}

          {/* Spinner */}
          <div style={{display:'inline-flex',alignItems:'center',gap:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:50,padding:'14px 26px',marginBottom:20}}>
            <div style={{width:20,height:20,borderRadius:'50%',border:'3px solid rgba(96,165,250,0.3)',borderTopColor:'#60a5fa',animation:'spin 1s linear infinite'}}/>
            <span style={{color:'rgba(255,255,255,0.65)',fontSize:15,fontWeight:700}}>รอผลจากอาจารย์...</span>
          </div>

          {tc&&(
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:tc.grad,borderRadius:14,padding:'9px 18px',border:`1px solid ${tc.border}`,boxShadow:`0 0 18px ${tc.glow}`}}>
              <span style={{fontSize:18}}>{tc.emoji}</span>
              <span style={{color:'#fff',fontWeight:700,fontSize:14}}>{teamNames[teamIdx??0]}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // REVEALED
  // ════════════════════════════════════════════════════════════════
  if((phase==='revealed'||correctAnswer) && questionData) {
    const skipped  = voted==='SKIP';
    const isCorrect= !skipped && voted===correctAnswer;
    const isWrong  = !skipped && voted && voted!==correctAnswer;

    const resultBg = isCorrect
      ? '#0a1f14'
      : isWrong
      ? '#1a0808'
      : '#0d1117';

    return (
      <div style={{height:'100dvh',minHeight:'100vh',background:resultBg,display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:FONT,position:'relative'}}>
        <style>{CSS}</style>

        {/* Glow burst */}
        <div style={{position:'absolute',inset:0,background:isCorrect?'radial-gradient(circle,rgba(16,185,129,0.18) 0%,transparent 70%)':isWrong?'radial-gradient(circle,rgba(239,68,68,0.15) 0%,transparent 70%)':'none',pointerEvents:'none',zIndex:0}}/>

        <div style={{position:'relative',zIndex:1,flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 20px 32px',textAlign:'center',overflow:'auto'}}>

          {/* Big emoji */}
          <div style={{fontSize:80,marginBottom:12,filter:isCorrect?'drop-shadow(0 0 28px rgba(16,185,129,0.7))':isWrong?'drop-shadow(0 0 28px rgba(239,68,68,0.7))':'none',animation:isCorrect?'correct 0.7s ease':isWrong?'shakeX 0.5s ease':'popIn 0.4s ease'}}>
            {isCorrect?'🎉':isWrong?'😢':skipped?'⏭':'💡'}
          </div>

          {/* Result headline */}
          <h2 style={{fontSize:32,fontWeight:900,margin:'0 0 6px',color:isCorrect?'#34d399':isWrong?'#f87171':'#93c5fd'}}>
            {isCorrect?'ถูกต้อง!':isWrong?'เสียใจด้วย…':skipped?'ข้ามแล้ว':'เฉลยแล้ว!'}
          </h2>

          {/* Prize label */}
          {isCorrect&&(
            <div style={{fontSize:22,fontWeight:900,color:'#ffd700',textShadow:'0 0 14px rgba(255,215,0,0.6)',marginBottom:10,animation:'slideUp 0.4s ease'}}>
              ⬆ +฿{PRIZES_FMT[Math.min(questionNum-1,14)]}
            </div>
          )}
          {isWrong&&(
            <div style={{fontSize:16,color:'rgba(248,113,113,0.8)',marginBottom:10}}>ไม่ได้รับรางวัลข้อนี้</div>
          )}

          {/* Correct answer box */}
          <div style={{background:'rgba(255,255,255,0.08)',border:`2px solid ${isCorrect?'#34d399':isWrong?'#ef4444':'#60a5fa'}`,borderRadius:16,padding:'14px 20px',marginBottom:14,width:'100%',maxWidth:340}}>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,letterSpacing:2,marginBottom:7}}>✅ เฉลยที่ถูกต้อง</div>
            <div style={{color:'#fff',fontSize:17,fontWeight:900,lineHeight:1.4,display:'flex',alignItems:'center',gap:10,justifyContent:'center'}}>
              <span style={{width:34,height:34,borderRadius:'50%',background:TILE[correctAnswer]?.bg||'rgba(255,255,255,0.2)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,flexShrink:0}}>{correctAnswer}</span>
              {questionData.options?.[correctAnswer]}
            </div>
          </div>

          {/* Wrong answer */}
          {isWrong&&(
            <div style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:12,padding:'10px 18px',marginBottom:14,width:'100%',maxWidth:340}}>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginBottom:4}}>คำตอบของคุณ</div>
              <div style={{color:'#f87171',fontSize:16,fontWeight:700}}>{voted}: {questionData.options?.[voted]}</div>
            </div>
          )}

          {/* Team badge */}
          {tc&&(
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:tc.grad,borderRadius:14,padding:'8px 16px',border:`1px solid ${tc.border}`,marginBottom:14}}>
              <span style={{fontSize:16}}>{tc.emoji}</span>
              <span style={{color:'#fff',fontWeight:700,fontSize:13}}>{teamNames[teamIdx??0]}</span>
            </div>
          )}

          <p style={{color:'rgba(255,255,255,0.28)',fontSize:12,margin:0}}>⏳ รอคำถามข้อต่อไป…</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function StudentMillionairePage() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <>
      {showSplash && <StudentSplash duration={2200} onFinish={() => setShowSplash(false)} />}
      <Suspense fallback={
        <div style={{height:'100dvh',minHeight:'100vh',background:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Kanit,sans-serif'}}>
          <span style={{color:'rgba(255,255,255,0.35)',fontSize:16}}>กำลังโหลด…</span>
        </div>
      }>
        <StudentMillionaireInner/>
      </Suspense>
    </>
  );
}

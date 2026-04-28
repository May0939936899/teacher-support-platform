'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const FONT = "'Kanit','Noto Sans Thai',sans-serif";

const CSS = `
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes popIn   { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shake   { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-15deg)} 75%{transform:rotate(15deg)} }
  @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
`;

function genVoterId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function StudentSnakeLadderInner() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room') || '';
  const nameParam = searchParams.get('name') || '';

  const [phase, setPhase]           = useState('join');   // join | lobby | playing | result
  const [roomInput, setRoomInput]   = useState(roomParam.toUpperCase());
  const [nameInput, setNameInput]   = useState(nameParam);
  const [room, setRoom]             = useState('');
  const [joining, setJoining]       = useState(false);
  const [joinError, setJoinError]   = useState('');
  const [gameState, setGameState]   = useState(null);
  const [rolling, setRolling]       = useState(false);
  const [rollMsg, setRollMsg]       = useState('');

  const voterIdRef = useRef(null);
  const pollRef    = useRef(null);

  // Persistent voter ID
  useEffect(() => {
    let id = '';
    try { id = localStorage.getItem('sl_voter_id') || ''; } catch {}
    if (!id) {
      id = genVoterId();
      try { localStorage.setItem('sl_voter_id', id); } catch {}
    }
    voterIdRef.current = id;
  }, []);

  // Auto-join when both room and name are in URL params
  useEffect(() => {
    if (!roomParam || !nameParam) return;
    const autoJoin = async () => {
      try {
        // Wait for voter ID to be set
        await new Promise(r => setTimeout(r, 50));
        const code = roomParam.toUpperCase();
        const res = await fetch(`/api/teacher/snakelad?room=${code}&action=get_state`);
        if (!res.ok) return;
        const state = await res.json();
        if (state.status !== 'waiting') return;
        const joinRes = await fetch('/api/teacher/snakelad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', room: code, voterId: voterIdRef.current, name: nameParam }),
        });
        if (joinRes.ok) {
          setRoom(code);
          setPhase('lobby');
          startPolling(code);
        }
      } catch { /* ignore */ }
    };
    autoJoin();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startPolling = (code) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/teacher/snakelad?room=${code}&action=get_state`);
        if (!res.ok) return;
        const data = await res.json();
        setGameState(data);
        if (data.status === 'playing') {
          setPhase(prev => prev === 'lobby' || prev === 'playing' ? 'playing' : prev);
        }
        if (data.status === 'finished') {
          setPhase('result');
          clearInterval(pollRef.current);
        }
      } catch { /* ignore */ }
    }, 2000);
  };

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Join ─────────────────────────────────────────────────────────────────
  const joinRoom = async () => {
    const code = roomInput.trim().toUpperCase();
    const name = nameInput.trim();
    if (code.length < 4) { setJoinError('กรุณากรอกรหัสห้อง'); return; }
    if (!name) { setJoinError('กรุณากรอกชื่อของคุณ'); return; }
    setJoining(true);
    setJoinError('');
    try {
      // Wait for voter ID
      await new Promise(r => setTimeout(r, 30));
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', room: code, voterId: voterIdRef.current, name }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || 'เข้าร่วมไม่ได้'); setJoining(false); return; }
      setRoom(code);
      setPhase('lobby');
      startPolling(code);
    } catch {
      setJoinError('เชื่อมต่อไม่ได้ — ลองใหม่อีกครั้ง');
    } finally {
      setJoining(false);
    }
  };

  // ── Roll dice ────────────────────────────────────────────────────────────
  const rollDice = async () => {
    if (rolling) return;
    setRolling(true);
    setRollMsg('');
    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'roll', room, voterId: voterIdRef.current }),
      });
      const data = await res.json();
      if (!res.ok) { setRollMsg(data.error || 'ลองใหม่'); setRolling(false); return; }
      setGameState(data);
      if (data.lastEvent === 'snake') {
        setRollMsg(`🐍 โดนงู! ตกจาก ${data.lastFrom} ลงมา ${data.lastTo}`);
      } else if (data.lastEvent === 'ladder') {
        setRollMsg(`🪜 ขึ้นบันได! จาก ${data.lastFrom} ถึง ${data.lastTo}`);
      } else if (data.lastEvent === 'win') {
        setRollMsg('🏆 คุณชนะ!');
      } else if (data.diceResult) {
        setRollMsg(`🎲 ทอยได้ ${data.diceResult}`);
      }
      if (data.status === 'finished') {
        setPhase('result');
        clearInterval(pollRef.current);
      }
    } catch {
      setRollMsg('เชื่อมต่อไม่ได้');
    } finally {
      setRolling(false);
    }
  };

  const myId = voterIdRef.current;
  const players = gameState?.players || [];
  const currentTurn = gameState?.currentTurn ?? 0;
  const currentPlayer = players[currentTurn] || null;
  const isMyTurn = currentPlayer?.id === myId;
  const myPlayer = players.find(p => p.id === myId);

  // ════════════════════════════════════════════════════════════════════════════
  // JOIN
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'join') return (
    <div style={{
      height: '100dvh', minHeight: '100vh',
      background: '#0d1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', fontFamily: FONT,
    }}>
      <style>{CSS}</style>

      <div style={{ width: '100%', maxWidth: 380, animation: 'slideUp 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎲</div>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>งูและบันได</h1>
          <p style={{ color: 'rgba(165,180,252,0.5)', fontSize: 11, margin: 0, letterSpacing: 2 }}>SNAKE & LADDER</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <input
            value={roomInput}
            onChange={e => { setRoomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setJoinError(''); }}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="รหัสห้อง XXXXXX"
            maxLength={8}
            autoFocus
            style={{
              width: '100%', padding: '14px',
              borderRadius: 12,
              border: `2px solid ${joinError ? '#f87171' : roomInput.length >= 4 ? '#a5b4fc' : 'rgba(255,255,255,0.12)'}`,
              background: 'rgba(0,0,0,0.35)', color: '#fff',
              fontSize: 26, fontWeight: 900, textAlign: 'center', letterSpacing: 6,
              fontFamily: "'Courier New',monospace", outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <input
            value={nameInput}
            onChange={e => { setNameInput(e.target.value.slice(0, 20)); setJoinError(''); }}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="ชื่อของคุณ"
            maxLength={20}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 12,
              border: `2px solid ${nameInput.trim() ? 'rgba(165,180,252,0.5)' : 'rgba(255,255,255,0.12)'}`,
              background: 'rgba(0,0,0,0.35)', color: '#fff',
              fontSize: 18, fontWeight: 700, textAlign: 'center',
              fontFamily: FONT, outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />

          {joinError && (
            <div style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
              ⚠️ {joinError}
            </div>
          )}

          <button
            onClick={joinRoom}
            disabled={roomInput.length < 4 || !nameInput.trim() || joining}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 12, border: 'none',
              background: (roomInput.length >= 4 && nameInput.trim() && !joining)
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : 'rgba(255,255,255,0.07)',
              color: (roomInput.length >= 4 && nameInput.trim() && !joining)
                ? '#fff' : 'rgba(255,255,255,0.25)',
              fontSize: 17, fontWeight: 800,
              cursor: (roomInput.length >= 4 && nameInput.trim() && !joining) ? 'pointer' : 'not-allowed',
              fontFamily: FONT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {joining
              ? <><span style={{ display:'inline-block', width:17, height:17, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> กำลังเชื่อมต่อ…</>
              : 'เข้าร่วมเกม →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 14 }}>
          📱 หรือสแกน QR Code บนจอหน้าห้อง
        </p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'lobby') return (
    <div style={{
      height: '100dvh', minHeight: '100vh',
      background: '#0d1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: FONT, textAlign: 'center',
    }}>
      <style>{CSS}</style>

      <div style={{ animation: 'slideUp 0.5s ease', width: '100%', maxWidth: 380 }}>
        {/* Room badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 20, padding: '8px 20px', marginBottom: 24,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>ห้อง</span>
          <span style={{ color: '#a5b4fc', fontFamily: 'monospace', letterSpacing: 4, fontWeight: 900, fontSize: 18 }}>{room}</span>
        </div>

        {/* Spinner */}
        <div style={{ fontSize: 52, marginBottom: 16, display: 'inline-block', animation: 'spin 3s linear infinite' }}>⏳</div>

        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>เข้าร่วมแล้ว!</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 20px' }}>รอ host เริ่มเกม…</p>

        {/* Player list */}
        {players.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '16px',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>ผู้เล่ม ({players.length})</div>
            {players.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                <span style={{
                  color: p.id === myId ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontWeight: p.id === myId ? 800 : 500,
                  fontSize: 14,
                }}>
                  {p.name} {p.id === myId && '(คุณ)'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RESULT
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'result' && gameState) {
    const winnerPlayer = players.find(p => p.id === gameState.winner);
    const iWon = gameState.winner === myId;
    return (
      <div style={{
        height: '100dvh', minHeight: '100vh',
        background: iWon ? 'linear-gradient(160deg,#0a1f14,#0d2b1a)' : '#0d1117',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: FONT, textAlign: 'center',
      }}>
        <style>{CSS}</style>
        <div style={{ animation: 'popIn 0.6s ease', maxWidth: 340 }}>
          <div style={{ fontSize: 80, marginBottom: 12, animation: iWon ? 'bounce 1s ease infinite' : 'fadeIn 0.5s ease' }}>
            {iWon ? '🏆' : '🥈'}
          </div>
          <h2 style={{
            margin: '0 0 8px', fontSize: 28, fontWeight: 900,
            color: iWon ? '#34d399' : '#f1f5f9',
          }}>
            {iWon ? 'คุณชนะ!' : 'เกมจบแล้ว'}
          </h2>
          {winnerPlayer && !iWon && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: '0 0 16px' }}>
              ผู้ชนะคือ <span style={{ color: winnerPlayer.color, fontWeight: 800 }}>{winnerPlayer.name}</span>
            </p>
          )}
          {iWon && (
            <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: 15, margin: '0 0 16px' }}>
              ยินดีด้วย! คุณถึงช่อง 100 แล้ว! 🎉
            </p>
          )}

          {/* Final positions */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '14px',
            textAlign: 'left',
            marginBottom: 20,
          }}>
            {players.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 0',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                <span style={{ flex: 1, fontSize: 14, color: p.id === gameState.winner ? p.color : 'rgba(255,255,255,0.6)', fontWeight: p.id === gameState.winner ? 800 : 500 }}>
                  {p.name} {p.id === myId && '(คุณ)'} {p.id === gameState.winner && '🏆'}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>ช่อง {p.position}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setPhase('join');
              setRoom('');
              setRoomInput('');
              setNameInput('');
              setGameState(null);
              setRollMsg('');
              clearInterval(pollRef.current);
            }}
            style={{
              padding: '14px 32px',
              borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', fontSize: 16, fontWeight: 800,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            🎲 เล่นใหม่
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PLAYING
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      height: '100dvh', minHeight: '100vh',
      background: '#0d1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', fontFamily: FONT, textAlign: 'center',
    }}>
      <style>{CSS}</style>

      {/* Room badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
        borderRadius: 14, padding: '5px 14px', marginBottom: 20, flexShrink: 0,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>ห้อง</span>
        <span style={{ color: '#a5b4fc', fontFamily: 'monospace', letterSpacing: 3, fontWeight: 900, fontSize: 14 }}>{room}</span>
      </div>

      {/* My position */}
      {myPlayer && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: `${myPlayer.color}22`, border: `2px solid ${myPlayer.color}60`,
          borderRadius: 14, padding: '10px 20px', marginBottom: 20, flexShrink: 0,
        }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: myPlayer.color }}/>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{myPlayer.name}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>ช่อง {myPlayer.position}</span>
        </div>
      )}

      {isMyTurn ? (
        /* MY TURN */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 340 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#a5b4fc', marginBottom: 16 }}>
            ถึงตาคุณแล้ว! 🎯
          </div>

          {/* Roll button */}
          <button
            onClick={rollDice}
            disabled={rolling}
            style={{
              width: 140, height: 140, borderRadius: '50%',
              border: 'none',
              background: rolling
                ? 'rgba(255,255,255,0.07)'
                : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff',
              fontSize: 52,
              cursor: rolling ? 'not-allowed' : 'pointer',
              boxShadow: rolling ? 'none' : '0 0 40px rgba(99,102,241,0.5)',
              animation: rolling ? 'spin 0.5s linear infinite' : 'pulse 2s ease infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            🎲
          </button>

          <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            {rolling ? 'กำลังทอย…' : 'แตะเพื่อทอยลูกเต๋า!'}
          </div>

          {/* Roll result */}
          {rollMsg && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '12px 20px',
              fontSize: 16, fontWeight: 800,
              color: rollMsg.includes('งู') ? '#ef4444'
                   : rollMsg.includes('บันได') ? '#10b981'
                   : rollMsg.includes('ชนะ') ? '#fbbf24'
                   : '#a5b4fc',
              animation: 'popIn 0.3s ease',
            }}>
              {rollMsg}
            </div>
          )}
        </div>
      ) : (
        /* OTHER TURN */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 340 }}>
          {currentPlayer && (
            <>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>ถึงตา</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: currentPlayer.color }}/>
                <span style={{ fontSize: 22, fontWeight: 900, color: currentPlayer.color }}>{currentPlayer.name}</span>
              </div>
            </>
          )}

          {/* Spinner */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, padding: '14px 24px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid rgba(165,180,252,0.3)', borderTopColor: '#a5b4fc', animation: 'spin 1s linear infinite' }}/>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700 }}>รอผู้เล่นอื่น…</span>
          </div>

          {/* Last result display */}
          {rollMsg && (
            <div style={{
              marginTop: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '10px 18px',
              fontSize: 14, fontWeight: 700,
              color: rollMsg.includes('งู') ? '#ef4444'
                   : rollMsg.includes('บันได') ? '#10b981'
                   : '#a5b4fc',
            }}>
              {rollMsg}
            </div>
          )}

          {/* All player positions */}
          {players.length > 0 && (
            <div style={{
              marginTop: 20,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '12px 16px',
              width: '100%',
              textAlign: 'left',
            }}>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 0',
                  borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                  <span style={{
                    flex: 1, fontSize: 13,
                    color: i === currentTurn ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontWeight: i === currentTurn ? 800 : 500,
                  }}>
                    {p.name} {p.id === myId && '(คุณ)'}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>ช่อง {p.position}</span>
                  {i === currentTurn && <span style={{ fontSize: 10, color: p.color }}>◀</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentSnakeLadderPage() {
  return (
    <Suspense fallback={
      <div style={{ height:'100dvh', minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Kanit,sans-serif' }}>
        <span style={{ color:'rgba(255,255,255,0.35)', fontSize:16 }}>กำลังโหลด…</span>
      </div>
    }>
      <StudentSnakeLadderInner />
    </Suspense>
  );
}

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const PLAYER_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];
const SNAKES  = { 99:78, 95:56, 87:24, 64:60, 62:19, 54:34, 17:7 };
const LADDERS = { 4:14, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81 };
const FONT = "'Kanit','Noto Sans Thai',sans-serif";

const BG = 'linear-gradient(160deg,#020918,#050f2a,#0a0520)';

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Convert square number (1–100) to grid row/col (0-indexed)
function squareToRC(n) {
  const row = Math.floor((n - 1) / 10);       // 0 = bottom
  const col  = (n - 1) % 10;
  const displayRow = 9 - row;                  // flip: displayRow 0 = top
  const displayCol = row % 2 === 0 ? col : 9 - col;
  return { r: displayRow, c: displayCol };
}

// Build a lookup: gridIndex → square number
const gridToSquare = Array.from({ length: 100 }, (_, i) => {
  const r = Math.floor(i / 10);
  const c = i % 10;
  const boardRow = 9 - r;
  const col = boardRow % 2 === 0 ? c : 9 - c;
  return boardRow * 10 + col + 1;
});

const SNAKE_HEADS = new Set(Object.keys(SNAKES).map(Number));
const LADDER_BOTTOMS = new Set(Object.keys(LADDERS).map(Number));

// ── Board Cell ────────────────────────────────────────────────────────────────
function BoardCell({ squareNum, players }) {
  const isSnake  = SNAKE_HEADS.has(squareNum);
  const isLadder = LADDER_BOTTOMS.has(squareNum);

  let bg = squareNum % 2 === 0 ? '#1a2040' : '#141830';
  if (isSnake)  bg = 'rgba(239,68,68,0.18)';
  if (isLadder) bg = 'rgba(16,185,129,0.18)';

  const here = players.filter(p => p.position === squareNum);

  return (
    <div style={{
      background: bg,
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 3,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '2px 1px 1px',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Square number */}
      <span style={{
        fontSize: '0.52em',
        color: 'rgba(255,255,255,0.35)',
        lineHeight: 1,
        alignSelf: 'flex-start',
        marginLeft: 1,
        flexShrink: 0,
      }}>{squareNum}</span>

      {/* Icon */}
      {isSnake  && <span style={{ fontSize: '0.8em', lineHeight: 1 }}>🐍</span>}
      {isLadder && <span style={{ fontSize: '0.8em', lineHeight: 1 }}>🪜</span>}

      {/* Player dots */}
      {here.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
          marginTop: 'auto',
        }}>
          {here.map(p => (
            <div key={p.id} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: p.color,
              border: '1px solid rgba(255,255,255,0.5)',
              flexShrink: 0,
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────
function Board({ players }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(10, 1fr)',
      gridTemplateRows: 'repeat(10, 1fr)',
      gap: 2,
      width: '100%',
      aspectRatio: '1 / 1',
      background: '#0d1427',
      border: '2px solid rgba(99,102,241,0.4)',
      borderRadius: 8,
      padding: 4,
    }}>
      {gridToSquare.map((sq, i) => (
        <BoardCell key={i} squareNum={sq} players={players} />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SnakeLadderGame() {
  const [phase, setPhase]         = useState('setup');   // setup | playing | finished
  const [roomCode, setRoomCode]   = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [creating, setCreating]   = useState(false);

  const voteRoomRef = useRef('');
  const pollRef     = useRef(null);

  // ── Poll ──────────────────────────────────────────────────────────────────
  const pollState = useCallback(async () => {
    const code = voteRoomRef.current;
    if (!code) return;
    try {
      const res = await fetch(`/api/teacher/snakelad?room=${code}&action=get_state`);
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data);
      if (data.status === 'playing' && phase === 'setup') setPhase('playing');
      if (data.status === 'finished' && phase !== 'finished') setPhase('finished');
    } catch { /* ignore */ }
  }, [phase]);

  useEffect(() => {
    if (!roomCode) return;
    pollRef.current = setInterval(pollState, 2000);
    return () => clearInterval(pollRef.current);
  }, [roomCode, pollState]);

  // ── Create Room ────────────────────────────────────────────────────────────
  const createRoom = async () => {
    setCreating(true);
    const code = roomInput.trim().toUpperCase() || genCode();
    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', room: code }),
      });
      if (!res.ok) throw new Error('Failed');
      voteRoomRef.current = code;
      setRoomCode(code);
      setGameState({
        status: 'waiting', players: [], currentTurn: 0,
        diceResult: null, lastEvent: null, lastFrom: null, lastTo: null,
        winner: null, createdAt: Date.now(),
      });
      toast.success(`สร้างห้อง ${code} แล้ว!`);
    } catch {
      toast.error('สร้างห้องไม่ได้ ลองใหม่อีกครั้ง');
    } finally {
      setCreating(false);
    }
  };

  // ── Start Game ─────────────────────────────────────────────────────────────
  const startGame = async () => {
    const code = voteRoomRef.current;
    try {
      const res = await fetch('/api/teacher/snakelad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', room: code }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'เริ่มเกมไม่ได้'); return; }
      await pollState();
      setPhase('playing');
      toast.success('เกมเริ่มแล้ว!');
    } catch {
      toast.error('เชื่อมต่อไม่ได้');
    }
  };

  // ── Delete Room ────────────────────────────────────────────────────────────
  const deleteRoom = async () => {
    const code = voteRoomRef.current;
    if (!code) return;
    try {
      await fetch(`/api/teacher/snakelad?room=${code}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    clearInterval(pollRef.current);
    voteRoomRef.current = '';
    setRoomCode('');
    setGameState(null);
    setPhase('setup');
    toast('ลบห้องแล้ว');
  };

  const studentUrl = typeof window !== 'undefined' && roomCode
    ? `${window.location.origin}/student/snakelad?room=${roomCode}`
    : '';
  const qrUrl = studentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(studentUrl)}`
    : '';

  const players     = gameState?.players || [];
  const currentTurn = gameState?.currentTurn ?? 0;
  const currentPlayer = players[currentTurn] || null;

  // ════════════════════════════════════════════════════════════════════════════
  // SETUP PHASE
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'setup' || !roomCode) {
    return (
      <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', padding: '32px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎲</div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: 1 }}>งูและบันได</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '6px 0 0' }}>Snake & Ladder — Multiplayer</p>
          </div>

          {!roomCode ? (
            /* Create room form */
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '28px 24px',
              maxWidth: 420,
              margin: '0 auto',
            }}>
              <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                รหัสห้อง (เว้นว่างเพื่อสุ่ม)
              </p>
              <input
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && !creating && createRoom()}
                placeholder="XXXXXX"
                maxLength={8}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  border: '2px solid rgba(99,102,241,0.5)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: 6,
                  fontFamily: "'Courier New',monospace",
                  outline: 'none',
                  marginBottom: 16,
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={createRoom}
                disabled={creating}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: creating ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 800,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                }}
              >
                {creating ? 'กำลังสร้าง…' : '🎲 สร้างห้อง'}
              </button>
            </div>
          ) : (
            /* Lobby: show QR + player list */
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* QR + room code */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '24px',
                textAlign: 'center',
                minWidth: 200,
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.5)',
                  borderRadius: 12,
                  padding: '8px 18px',
                  marginBottom: 16,
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>ห้อง</span>
                  <span style={{ color: '#a5b4fc', fontFamily: 'monospace', letterSpacing: 4, fontWeight: 900, fontSize: 22 }}>{roomCode}</span>
                </div>
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    style={{ display: 'block', margin: '0 auto 12px', borderRadius: 8, background: '#fff', padding: 4 }}
                  />
                )}
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 16px' }}>
                  สแกนเพื่อเข้าเกม
                </p>
                <button
                  onClick={startGame}
                  disabled={players.length < 2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: players.length >= 2
                      ? 'linear-gradient(135deg,#10b981,#059669)'
                      : 'rgba(255,255,255,0.07)',
                    color: players.length >= 2 ? '#fff' : 'rgba(255,255,255,0.25)',
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: players.length >= 2 ? 'pointer' : 'not-allowed',
                    fontFamily: FONT,
                    marginBottom: 8,
                  }}
                >
                  {players.length >= 2 ? '▶ เริ่มเกม' : `รอผู้เล่น (${players.length}/2)`}
                </button>
                <button
                  onClick={deleteRoom}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.08)',
                    color: 'rgba(239,68,68,0.7)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  ลบห้อง
                </button>
              </div>

              {/* Player list */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '24px',
                flex: 1,
                minWidth: 200,
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
                  ผู้เล่น ({players.length})
                </h3>
                {players.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>รอผู้เล่นเข้าร่วม…</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {players.map((p, i) => (
                      <div key={p.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        border: `1px solid ${p.color}40`,
                      }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                        <span style={{ color: '#fff', fontWeight: 700, flex: 1 }}>{p.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>#{i+1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FINISHED PHASE
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'finished' && gameState) {
    const winnerPlayer = players.find(p => p.id === gameState.winner);
    return (
      <div style={{
        fontFamily: FONT,
        background: BG,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: 24,
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 24,
          padding: '40px 32px',
          maxWidth: 400,
        }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900 }}>ชนะเลิศ!</h2>
          {winnerPlayer && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: winnerPlayer.color }}/>
              <span style={{ fontSize: 22, fontWeight: 900, color: winnerPlayer.color }}>{winnerPlayer.name}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button
              onClick={() => {
                setPhase('setup');
                setRoomCode('');
                setRoomInput('');
                setGameState(null);
                voteRoomRef.current = '';
              }}
              style={{
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              🎲 เกมใหม่
            </button>
            <button
              onClick={deleteRoom}
              style={{
                padding: '10px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: 'rgba(239,68,68,0.7)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              ลบห้อง
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PLAYING PHASE
  // ════════════════════════════════════════════════════════════════════════════
  const lastEventLabel = () => {
    if (!gameState) return '';
    const { lastEvent, diceResult, lastFrom, lastTo } = gameState;
    if (lastEvent === 'win') return '🏆 ชนะ!';
    if (lastEvent === 'snake') return `🐍 โดนงู! ${lastFrom} → ${lastTo}`;
    if (lastEvent === 'ladder') return `🪜 ขึ้นบันได! ${lastFrom} → ${lastTo}`;
    if (lastEvent === 'normal' && diceResult) return `🎲 ทอย ${diceResult}`;
    return '';
  };

  return (
    <div style={{
      fontFamily: FONT,
      background: BG,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      padding: '16px 12px',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🎲</span>
          <span style={{ fontWeight: 900, fontSize: 18 }}>งูและบันได</span>
          <span style={{
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 8,
            padding: '2px 10px',
            fontFamily: 'monospace',
            letterSpacing: 2,
            fontSize: 14,
            color: '#a5b4fc',
          }}>{roomCode}</span>
        </div>
        <button
          onClick={deleteRoom}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)',
            color: 'rgba(239,68,68,0.7)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          จบเกม
        </button>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Board — 70% */}
        <div style={{ flex: '0 0 70%', maxWidth: '70%' }}>
          <Board players={players} />
        </div>

        {/* Side panel — 30% */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Current turn */}
          {currentPlayer && (
            <div style={{
              background: `${currentPlayer.color}22`,
              border: `2px solid ${currentPlayer.color}80`,
              borderRadius: 14,
              padding: '12px 14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>ถึงตา</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: currentPlayer.color }}/>
                <span style={{ fontWeight: 900, fontSize: 16, color: currentPlayer.color }}>{currentPlayer.name}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                ตำแหน่ง {currentPlayer.position}
              </div>
            </div>
          )}

          {/* Last event */}
          {gameState?.lastEvent && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '10px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>ผลล่าสุด</div>
              <div style={{
                fontSize: 15,
                fontWeight: 800,
                color: gameState.lastEvent === 'snake' ? '#ef4444'
                     : gameState.lastEvent === 'ladder' ? '#10b981'
                     : gameState.lastEvent === 'win' ? '#fbbf24'
                     : '#a5b4fc',
              }}>
                {lastEventLabel()}
              </div>
            </div>
          )}

          {/* Player list */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '10px 12px',
            flex: 1,
            overflow: 'auto',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>ผู้เล่ม ({players.length})</div>
            {players.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 8,
                marginBottom: 4,
                background: i === currentTurn ? `${p.color}18` : 'transparent',
                border: i === currentTurn ? `1px solid ${p.color}50` : '1px solid transparent',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                <span style={{ flex: 1, fontSize: 13, fontWeight: i === currentTurn ? 800 : 500, color: i === currentTurn ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.position}</span>
                {i === currentTurn && <span style={{ fontSize: 10, color: p.color }}>◀</span>}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.8 }}>
            <div>🐍 งู = ตกลง</div>
            <div>🪜 บันได = ขึ้น</div>
            <div>🎯 ถึง 100 = ชนะ</div>
          </div>
        </div>
      </div>
    </div>
  );
}

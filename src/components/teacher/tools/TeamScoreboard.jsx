'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

// ── Share panel ────────────────────────────────────────────
function SharePanel({ sessionCode, onClose }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/s/scoreboard/${sessionCode}`
    : `/s/scoreboard/${sessionCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=1a1a3e&bgcolor=ffffff&margin=10`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    toast.success('คัดลอกลิงก์แล้ว!');
  };

  return (
    <div style={{
      background: '#fff', border: '2px solid #00b4e6',
      borderRadius: 18, padding: '24px 22px', marginBottom: 20,
      boxShadow: '0 4px 24px #00b4e620',
      animation: 'fadeIn 0.2s ease',
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <strong style={{ fontSize: 16, color: '#1a1a3e' }}>สร้าง QR ให้ผู้เล่น</strong>
          <span style={{
            background: '#10b98120', border: '1px solid #10b98150', borderRadius: 20,
            padding: '2px 10px', fontSize: 12, color: '#10b981', fontWeight: 700,
          }}>● LIVE</span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8',
        }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* QR */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <img src={qrUrl} alt="QR Code" width={140} height={140}
            style={{ borderRadius: 12, border: '2px solid #e2e8f0', display: 'block' }} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>สแกน QR</div>
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>รหัส Session</div>
          <div style={{
            fontSize: 36, fontWeight: 900, letterSpacing: 6, color: '#00b4e6',
            marginBottom: 12, fontFamily: 'monospace',
          }}>{sessionCode}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>ลิงก์โดยตรง</div>
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '8px 12px', fontSize: 12, color: '#475569', wordBreak: 'break-all',
            marginBottom: 10,
          }}>{url}</div>
          <button onClick={copy} style={{
            width: '100%', padding: '10px 0', borderRadius: 10,
            background: 'linear-gradient(135deg,#00b4e6,#7c4dff)', border: 'none',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>📋 คัดลอกลิงก์</button>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0', textAlign: 'center' }}>
            นักศึกษาดูคะแนน + เปลี่ยนชื่อทีมได้ · ปรับคะแนนไม่ได้
          </p>
        </div>
      </div>
    </div>
  );
}

const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', sans-serif";
const LS_KEY = 'team_scoreboard_v2';

const PALETTE = [
  '#00b4e6', '#e6007e', '#7c4dff', '#10b981',
  '#f97316', '#3b82f6', '#ec4899', '#eab308',
  '#ef4444', '#14b8a6', '#8b5cf6', '#06b6d4',
];

const TEAM_EMOJIS = ['🦁', '🐯', '🦊', '🐻', '🐼', '🦄', '🐉', '🦅', '🦋', '🐬', '🦖', '🌟'];
const ADD_OPTIONS = [1, 2, 3, 5, 10];

const DEFAULT_TEAMS = [
  { id: 1, name: 'ทีม 1', emoji: '🦁', score: 0, color: '#00b4e6' },
  { id: 2, name: 'ทีม 2', emoji: '🐯', score: 0, color: '#e6007e' },
  { id: 3, name: 'ทีม 3', emoji: '🦊', score: 0, color: '#7c4dff' },
  { id: 4, name: 'ทีม 4', emoji: '🐻', score: 0, color: '#10b981' },
];

// ── Web Audio ──────────────────────────────────────────────
function getAudioCtx(ref) {
  if (!ref.current) {
    try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return ref.current;
}
function playPop(audioRef, color) {
  const ctx = getAudioCtx(audioRef);
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}
function playMinus(audioRef) {
  const ctx = getAudioCtx(audioRef);
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  } catch {}
}
function playLeaderChange(audioRef) {
  const ctx = getAudioCtx(audioRef);
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    [523, 659, 784].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch {}
}

// ── Helpers ────────────────────────────────────────────────
let nextId = 100;
function makeId() { return ++nextId; }

function getRanks(teams) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return teams.map(t => {
    const rank = sorted.findIndex(s => s.id === t.id) + 1;
    return rank;
  });
}

// ── Edit-in-place name input ───────────────────────────────
function EditableName({ value, onChange, color }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) return (
    <input
      ref={inputRef}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      style={{
        fontSize: 18, fontWeight: 800, fontFamily: FONT, color: '#1a1a3e',
        border: 'none', borderBottom: `2px solid ${color}`,
        background: 'transparent', outline: 'none', width: '100%',
        padding: '2px 0',
      }}
    />
  );

  return (
    <div
      onClick={() => setEditing(true)}
      title="คลิกเพื่อแก้ไขชื่อ"
      style={{
        fontSize: 18, fontWeight: 800, color: '#1a1a3e', fontFamily: FONT,
        cursor: 'text', display: 'flex', alignItems: 'center', gap: 6,
        borderBottom: '2px dashed transparent',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      {value}
      <span style={{ fontSize: 12, color: '#cbd5e1' }}>✏️</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function TeamScoreboard() {
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [history, setHistory] = useState([]);
  const [animating, setAnimating] = useState({});
  const [addAmount, setAddAmount] = useState(1);
  const [prevLeader, setPrevLeader] = useState(null);
  const [sessionCode, setSessionCode] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const audioRef = useRef(null);
  const historyRef = useRef(null);
  const syncTimerRef = useRef(null);
  // Stable refs so callbacks never capture stale state
  const teamsRef = useRef(teams);
  const prevLeaderRef = useRef(prevLeader);
  useEffect(() => { teamsRef.current = teams; }, [teams]);
  useEffect(() => { prevLeaderRef.current = prevLeader; }, [prevLeader]);

  // Auto-sync teams to session when scores/names change
  const syncSession = useCallback(async (teamsToSync, code) => {
    if (!code) return;
    try {
      await fetch('/api/teacher/scoreboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, teams: teamsToSync }),
      });
    } catch {}
  }, []);

  // Debounced sync on teams change
  useEffect(() => {
    if (!sessionCode) return;
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncSession(teams, sessionCode), 400);
    return () => clearTimeout(syncTimerRef.current);
  }, [teams, sessionCode, syncSession]);

  const startSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      const res = await fetch('/api/teacher/scoreboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSessionCode(data.code);
      setShowShare(true);
      toast.success(`สร้าง Session "${data.code}" แล้ว!`);
    } catch (e) {
      toast.error('ไม่สามารถสร้าง session: ' + e.message);
    } finally {
      setSessionLoading(false);
    }
  }, [teams]);

  const stopSession = useCallback(async () => {
    if (!sessionCode) return;
    try {
      await fetch(`/api/teacher/scoreboard?code=${sessionCode}`, { method: 'DELETE' });
    } catch {}
    setSessionCode(null);
    setShowShare(false);
    toast('ปิด session แล้ว', { icon: '🔒' });
  }, [sessionCode]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const { teams: t, history: h } = JSON.parse(saved);
        if (Array.isArray(t) && t.length > 0) { setTeams(t); setHistory(h || []); }
      }
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ teams, history })); } catch {}
  }, [teams, history]);

  const getLeader = useCallback((ts) => {
    if (ts.every(t => t.score === 0)) return null;
    return ts.reduce((a, b) => b.score > a.score ? b : a).id;
  }, []);

  const triggerAnim = (id) => {
    setAnimating(a => ({ ...a, [id]: true }));
    setTimeout(() => setAnimating(a => ({ ...a, [id]: false })), 220);
  };

  const addScore = useCallback((id, pts) => {
    getAudioCtx(audioRef);
    if (audioRef.current?.state === 'suspended') audioRef.current.resume();

    // Pure functional update — no side-effects inside updater
    setTeams(prev => prev.map(t => t.id === id ? { ...t, score: t.score + pts } : t));

    // Read latest teams from ref (never stale)
    const currentTeams = teamsRef.current;
    const nextTeams = currentTeams.map(t => t.id === id ? { ...t, score: t.score + pts } : t);
    const newLeader = getLeader(nextTeams);
    if (newLeader && newLeader !== prevLeaderRef.current) {
      prevLeaderRef.current = newLeader;
      setPrevLeader(newLeader);
      setTimeout(() => playLeaderChange(audioRef), 100);
    } else {
      playPop(audioRef);
    }

    triggerAnim(id);
    const team = currentTeams.find(t => t.id === id);
    const entry = { text: `+${pts} ${team?.emoji || ''} ${team?.name || ''}`, color: team?.color, time: Date.now() };
    setHistory(h => [entry, ...h].slice(0, 20));
    if (historyRef.current) historyRef.current.scrollTop = 0;
  }, [getLeader]); // stable — never recreated on teams change

  const subScore = useCallback((id) => {
    getAudioCtx(audioRef);
    if (audioRef.current?.state === 'suspended') audioRef.current.resume();
    playMinus(audioRef);
    setTeams(prev => prev.map(t => t.id === id ? { ...t, score: Math.max(0, t.score - 1) } : t));
    triggerAnim(id);
    const team = teamsRef.current.find(t => t.id === id);
    const entry = { text: `-1 ${team?.emoji || ''} ${team?.name || ''}`, color: '#94a3b8', time: Date.now() };
    setHistory(h => [entry, ...h].slice(0, 20));
  }, []); // stable — no deps

  const updateName = useCallback((id, name) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const addTeam = useCallback(() => {
    const idx = teamsRef.current.length;
    const newTeam = {
      id: makeId(),
      name: `ทีม ${idx + 1}`,
      emoji: TEAM_EMOJIS[idx % TEAM_EMOJIS.length],
      score: 0,
      color: PALETTE[idx % PALETTE.length],
    };
    setTeams(prev => [...prev, newTeam]);
    toast.success(`เพิ่ม ${newTeam.name} แล้ว`);
  }, []); // stable

  const removeTeam = useCallback((id) => {
    if (teamsRef.current.length <= 2) { toast.error('ต้องมีอย่างน้อย 2 ทีม'); return; }
    const team = teamsRef.current.find(t => t.id === id);
    setTeams(prev => prev.filter(t => t.id !== id));
    toast(`ลบ ${team?.name} แล้ว`, { icon: '🗑️' });
  }, []); // stable

  const resetAll = useCallback(() => {
    setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
    setHistory([]);
    setPrevLeader(null);
    toast.success('รีเซ็ตคะแนนทั้งหมดแล้ว');
  }, []);

  const ranks = getRanks(teams);
  const maxScore = Math.max(...teams.map(t => t.score), 1);
  const leaderId = getLeader(teams);

  return (
    <div style={{ fontFamily: FONT, color: '#1a1a3e', minHeight: '100%', display: showShare && sessionCode ? 'grid' : 'block', gridTemplateColumns: showShare && sessionCode ? '1fr 320px' : '1fr', gap: 20, alignItems: 'start' }}>

      {/* ── Left column (all main content) ── */}
      <div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            🏆 กระดานคะแนนทีม
            {sessionCode && (
              <span style={{
                fontSize: 13, fontWeight: 700, background: '#10b98120',
                border: '1px solid #10b98150', borderRadius: 20,
                padding: '3px 10px', color: '#10b981',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                LIVE · {sessionCode}
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            คลิกชื่อทีมเพื่อแก้ไข · กด + เพิ่ม / − ลดคะแนน
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Share button */}
          {!sessionCode ? (
            <button onClick={startSession} disabled={sessionLoading} style={{
              padding: '8px 18px', borderRadius: 10,
              background: sessionLoading ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#00b4e6)',
              color: sessionLoading ? '#94a3b8' : '#fff',
              border: 'none', fontSize: 14, fontWeight: 700,
              cursor: sessionLoading ? 'wait' : 'pointer', fontFamily: FONT,
            }}>
              {sessionLoading ? '⏳...' : '🎰 สร้าง QR ให้ผู้เล่น'}
            </button>
          ) : (
            <>
              <button onClick={() => setShowShare(v => !v)} style={{
                padding: '8px 16px', borderRadius: 10,
                background: showShare ? '#e0f6fd' : 'linear-gradient(135deg,#10b981,#00b4e6)',
                color: showShare ? '#00b4e6' : '#fff',
                border: showShare ? '1.5px solid #00b4e6' : 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>📡 {showShare ? 'ซ่อน QR' : 'แสดง QR'}</button>
              <button onClick={stopSession} style={{
                padding: '8px 14px', borderRadius: 10,
                background: '#fff', border: '1.5px solid #fca5a5',
                color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>🔒 ปิด</button>
            </>
          )}
          <button onClick={addTeam} style={{
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#00b4e6,#7c4dff)',
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          }}>+ ทีม</button>
          <button onClick={resetAll} style={{
            padding: '8px 14px', borderRadius: 10,
            background: '#fff', border: '1.5px solid #e2e8f0',
            color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          }}>🔄</button>
        </div>
      </div>

      {/* ── Add amount selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>เพิ่มครั้งละ:</span>
        {ADD_OPTIONS.map(n => (
          <button key={n} onClick={() => setAddAmount(n)} style={{
            padding: '6px 14px', borderRadius: 8,
            background: addAmount === n ? 'linear-gradient(135deg,#00b4e6,#7c4dff)' : '#fff',
            border: addAmount === n ? 'none' : '1.5px solid #e2e8f0',
            color: addAmount === n ? '#fff' : '#475569',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT,
            boxShadow: addAmount === n ? '0 2px 8px #00b4e630' : 'none',
            transition: 'all 0.15s',
          }}>{n}</button>
        ))}
      </div>

      {/* ── Chart overview ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a3e 0%, #0f172a 100%)',
        borderRadius: 18, padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* bg decoration */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: -30, width: 120, height: 120,
          borderRadius: '50%', background: 'rgba(255,255,255,0.02)', pointerEvents: 'none',
        }} />

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>
          📊 ภาพรวมคะแนน
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...teams]
            .map((t, i) => ({ ...t, rank: ranks[i] }))
            .sort((a, b) => b.score - a.score)
            .map((team) => {
              const pct = maxScore > 0 ? (team.score / maxScore) * 100 : 0;
              const isLeader = team.id === leaderId;
              return (
                <div key={team.id}>
                  {/* Row: emoji + name + score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{team.emoji}</span>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: '#fff', flex: 1,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {team.name}
                      {isLeader && team.score > 0 && <span style={{ fontSize: 13 }}>👑</span>}
                    </span>
                    {/* Score badge */}
                    <span style={{
                      background: `${team.color}30`,
                      border: `1px solid ${team.color}60`,
                      borderRadius: 20, padding: '2px 12px',
                      fontSize: 15, fontWeight: 900, color: team.color,
                      letterSpacing: 0.5, minWidth: 48, textAlign: 'center',
                    }}>
                      {team.score}
                    </span>
                  </div>

                  {/* Bar track */}
                  <div style={{
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 99, height: 14, overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {/* Fill */}
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: isLeader && team.score > 0
                        ? `linear-gradient(90deg, ${team.color}, ${team.color}cc)`
                        : team.color,
                      width: `${pct}%`,
                      minWidth: team.score > 0 ? 24 : 0,
                      transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow: isLeader && team.score > 0 ? `0 0 12px ${team.color}80` : 'none',
                      position: 'relative',
                    }}>
                      {/* Shine streak */}
                      {pct > 8 && (
                        <div style={{
                          position: 'absolute', top: 2, left: 6, right: 12, height: 4,
                          borderRadius: 99, background: 'rgba(255,255,255,0.25)',
                        }} />
                      )}
                    </div>
                    {/* Percentage text inside */}
                    {pct > 12 && (
                      <div style={{
                        position: 'absolute', left: 10, top: 0, bottom: 0,
                        display: 'flex', alignItems: 'center',
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                        pointerEvents: 'none',
                      }}>
                        {Math.round(pct)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Score cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 14, marginBottom: 20,
      }}>
        {teams.map((team, i) => {
          const isLeader = team.id === leaderId;
          const rank = ranks[i];
          return (
            <div key={team.id} style={{
              background: '#fff', borderRadius: 18, padding: '20px 16px',
              border: `2.5px solid ${isLeader ? team.color : '#e2e8f0'}`,
              boxShadow: isLeader ? `0 6px 24px ${team.color}35` : '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
            }}>
              {/* Color top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                background: team.color, borderRadius: '18px 18px 0 0',
              }} />

              {/* Remove button */}
              <button
                onClick={() => removeTeam(team.id)}
                title="ลบทีมนี้"
                style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, fontWeight: 700, transition: 'all 0.15s',
                  padding: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#94a3b8'; }}
              >×</button>

              {/* Rank badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: `${team.color}18`, color: team.color,
                borderRadius: 8, padding: '2px 8px',
                fontSize: 12, fontWeight: 700, marginBottom: 10, marginTop: 8,
              }}>
                {isLeader ? '👑' : `#${rank}`}
              </div>

              {/* Emoji + name */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{team.emoji}</div>
                <EditableName
                  value={team.name}
                  onChange={name => updateName(team.id, name)}
                  color={team.color}
                />
              </div>

              {/* Score — ตัวใหญ่กลางการ์ด */}
              <div style={{
                fontSize: 96, fontWeight: 900, color: team.color,
                lineHeight: 1, margin: '12px 0 20px',
                transition: 'transform 0.15s',
                transform: animating[team.id] ? 'scale(1.2)' : 'scale(1)',
                textAlign: 'center',
                textShadow: `0 4px 20px ${team.color}40`,
              }}>
                {team.score}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => subScore(team.id)} style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: '#f8fafc', border: '1.5px solid #e2e8f0',
                  fontSize: 20, cursor: 'pointer', fontWeight: 700, color: '#475569',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>−</button>
                <button onClick={() => addScore(team.id, addAmount)} style={{
                  flex: 1, height: 40, borderRadius: 10,
                  background: team.color, border: 'none',
                  fontSize: 15, cursor: 'pointer', fontWeight: 800,
                  color: '#fff', fontFamily: FONT,
                  boxShadow: `0 3px 12px ${team.color}45`,
                  transition: 'transform 0.1s',
                }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >+{addAmount}</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── History log ── */}
      {history.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 18px',
          border: '1.5px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, marginBottom: 10 }}>
            📋 ประวัติคะแนน
          </div>
          <div ref={historyRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {history.map((h, i) => (
              <span key={`${h.time}-${i}`} style={{
                fontSize: 13, fontWeight: i === 0 ? 700 : 400,
                color: i === 0 ? '#1a1a3e' : '#94a3b8',
                background: i === 0 ? `${h.color}15` : 'transparent',
                border: i === 0 ? `1px solid ${h.color}30` : '1px solid transparent',
                borderRadius: 20, padding: '3px 10px',
                transition: 'all 0.2s',
              }}>
                {h.text}
              </span>
            ))}
          </div>
        </div>
      )}

      </div>{/* end left column */}

      {/* ── Right column: QR panel ── */}
      {showShare && sessionCode && (
        <div style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
          <SharePanel sessionCode={sessionCode} onClose={() => setShowShare(false)} />
        </div>
      )}

    </div>
  );
}

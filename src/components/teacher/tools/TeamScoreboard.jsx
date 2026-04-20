'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

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
  const audioRef = useRef(null);
  const historyRef = useRef(null);

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
    if (audioRef.current?.state === 'suspended') audioRef.current.resume();
    getAudioCtx(audioRef);
    setTeams(prev => {
      const next = prev.map(t => t.id === id ? { ...t, score: t.score + pts } : t);
      const newLeader = getLeader(next);
      if (newLeader && newLeader !== prevLeader) {
        setPrevLeader(newLeader);
        setTimeout(() => playLeaderChange(audioRef), 100);
      } else {
        playPop(audioRef);
      }
      return next;
    });
    const team = teams.find(t => t.id === id);
    triggerAnim(id);
    const entry = { text: `+${pts} ${team?.emoji || ''} ${team?.name || ''}`, color: team?.color, time: Date.now() };
    setHistory(h => [entry, ...h].slice(0, 20));
    if (historyRef.current) historyRef.current.scrollTop = 0;
  }, [teams, prevLeader, getLeader]);

  const subScore = useCallback((id) => {
    playMinus(audioRef);
    setTeams(prev => prev.map(t => t.id === id ? { ...t, score: Math.max(0, t.score - 1) } : t));
    const team = teams.find(t => t.id === id);
    triggerAnim(id);
    const entry = { text: `-1 ${team?.emoji || ''} ${team?.name || ''}`, color: '#94a3b8', time: Date.now() };
    setHistory(h => [entry, ...h].slice(0, 20));
  }, [teams]);

  const updateName = useCallback((id, name) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const addTeam = useCallback(() => {
    const idx = teams.length;
    const newTeam = {
      id: makeId(),
      name: `ทีม ${teams.length + 1}`,
      emoji: TEAM_EMOJIS[idx % TEAM_EMOJIS.length],
      score: 0,
      color: PALETTE[idx % PALETTE.length],
    };
    setTeams(prev => [...prev, newTeam]);
    toast.success(`เพิ่ม ${newTeam.name} แล้ว`);
  }, [teams.length]);

  const removeTeam = useCallback((id) => {
    if (teams.length <= 2) { toast.error('ต้องมีอย่างน้อย 2 ทีม'); return; }
    const team = teams.find(t => t.id === id);
    setTeams(prev => prev.filter(t => t.id !== id));
    toast(`ลบ ${team?.name} แล้ว`, { icon: '🗑️' });
  }, [teams]);

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
    <div style={{ fontFamily: FONT, color: '#1a1a3e', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>🏆 กระดานคะแนนทีม</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            คลิกชื่อทีมเพื่อแก้ไข · กด + เพิ่ม / − ลดคะแนน
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addTeam} style={{
            padding: '8px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg,#00b4e6,#7c4dff)',
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          }}>+ เพิ่มทีม</button>
          <button onClick={resetAll} style={{
            padding: '8px 16px', borderRadius: 10,
            background: '#fff', border: '1.5px solid #fca5a5',
            color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          }}>🔄 รีเซ็ต</button>
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

      {/* ── Progress bar overview ── */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '16px 20px',
        marginBottom: 20, border: '1.5px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {teams.map((team, i) => (
          <div key={team.id} style={{ marginBottom: i < teams.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {team.emoji} {team.name}
                {team.id === leaderId && <span style={{ marginLeft: 6, fontSize: 14 }}>👑</span>}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: team.color }}>{team.score} แต้ม</span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 99, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, background: team.color,
                width: `${(team.score / maxScore) * 100}%`,
                minWidth: team.score > 0 ? 20 : 0,
                transition: 'width 0.45s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Score cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(teams.length, 4)}, minmax(160px, 1fr))`,
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

              {/* Score */}
              <div style={{
                fontSize: 60, fontWeight: 900, color: team.color,
                lineHeight: 1, marginBottom: 16,
                transition: 'transform 0.15s',
                transform: animating[team.id] ? 'scale(1.3)' : 'scale(1)',
                display: 'block',
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
    </div>
  );
}

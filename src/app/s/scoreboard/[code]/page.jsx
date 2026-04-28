'use client';
import { useState, useEffect, useRef, use } from 'react';

const FONT = "'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";
const POLL_MS = 3000;

function getRanks(teams) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return teams.map(t => sorted.findIndex(s => s.id === t.id) + 1);
}

function Medal({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 22 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 22 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 22 }}>🥉</span>;
  return <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>#{rank}</span>;
}

// Inline rename modal
function RenameModal({ team, code, onClose, onSuccess }) {
  const [name, setName] = useState(team.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (!name.trim()) return setError('กรุณาใส่ชื่อ');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/teacher/scoreboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, teamId: team.id, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data.session.teams);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24, fontFamily: FONT,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes popIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{team.emoji}</div>
        <h3 style={{ textAlign: 'center', margin: '0 0 20px', fontSize: 18, color: '#1a1a3e' }}>
          เปลี่ยนชื่อ "{team.name}"
        </h3>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          maxLength={30}
          placeholder="ชื่อทีมใหม่..."
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
            border: `2px solid ${error ? '#ef4444' : team.color}`,
            fontSize: 16, fontFamily: FONT, color: '#1a1a3e', outline: 'none',
            marginBottom: error ? 6 : 14,
          }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', fontSize: 15, cursor: 'pointer', fontFamily: FONT,
          }}>ยกเลิก</button>
          <button onClick={submit} disabled={loading} style={{
            flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
            background: loading ? '#e2e8f0' : team.color,
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: FONT,
          }}>
            {loading ? 'กำลังบันทึก...' : '✅ บันทึก'}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 10, marginBottom: 0 }}>
          นักศึกษาเปลี่ยนชื่อได้ — คะแนนอยู่กับอาจารย์
        </p>
      </div>
    </div>
  );
}

export default function StudentScoreboard({ params }) {
  const { code } = use(params);
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error | closed
  const [errorMsg, setErrorMsg] = useState('');
  const [renaming, setRenaming] = useState(null); // team object
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pulse, setPulse] = useState(false);
  const prevTeamsRef = useRef([]);

  const fetchSession = async (silent = false) => {
    try {
      const res = await fetch(`/api/teacher/scoreboard?code=${code.toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) {
        if (!silent) { setStatus('error'); setErrorMsg(data.error || 'ไม่พบ session'); }
        else setStatus('closed');
        return;
      }
      // Detect score changes for pulse effect
      const prev = prevTeamsRef.current;
      const changed = data.session.teams.some((t, i) => prev[i]?.score !== t.score);
      if (changed && prev.length > 0) setPulse(true);
      setTimeout(() => setPulse(false), 500);

      setTeams(data.session.teams);
      prevTeamsRef.current = data.session.teams;
      setStatus('ok');
      setLastUpdated(new Date());
    } catch {
      if (!silent) setStatus('error');
    }
  };

  useEffect(() => {
    fetchSession(false);
    const interval = setInterval(() => fetchSession(true), POLL_MS);
    return () => clearInterval(interval);
  }, [code]);

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#0f172a' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 18 }}>กำลังโหลดกระดานคะแนน...</p>
      </div>
    </div>
  );

  if (status === 'error' || status === 'closed') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#0f172a' }}>
      <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>ไม่สามารถเข้าถึงได้</h2>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: 0 }}>{errorMsg || 'Session ถูกปิดหรือหมดเวลาแล้ว'}</p>
      </div>
    </div>
  );

  const ranks = getRanks(teams);
  const maxScore = Math.max(...teams.map(t => t.score), 1);
  const leaderId = teams.length > 0 && teams.every(t => t.score === 0) ? null
    : teams.reduce((a, b) => b.score > a.score ? b : a, teams[0])?.id;

  // Sort by score descending for display
  const sorted = [...teams].map((t, i) => ({ ...t, rank: ranks[i] })).sort((a, b) => b.score - a.score);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: FONT, padding: '20px 16px', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes scorePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes crown { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 4px' }}>
          🏆 กระดานคะแนนทีม
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#10b98122', border: '1px solid #10b98155',
            borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#10b981',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'scorePulse 1.5s infinite' }} />
            LIVE
          </span>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: '#475569' }}>
              อัปเดต {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: 13, margin: '8px 0 0' }}>
          แตะชื่อทีมของคุณเพื่อเปลี่ยนชื่อ
        </p>
      </div>

      {/* Scorecards */}
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((team, i) => {
          const isLeader = team.id === leaderId;
          return (
            <div key={team.id} style={{
              background: isLeader ? `linear-gradient(135deg, ${team.color}22, ${team.color}10)` : '#1e293b',
              border: `2px solid ${isLeader ? team.color : '#334155'}`,
              borderRadius: 18, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: isLeader ? `0 0 24px ${team.color}40` : 'none',
              transition: 'all 0.4s',
              animation: `fadeSlide 0.3s ease ${i * 0.05}s both`,
            }}>
              {/* Rank */}
              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                <Medal rank={team.rank} />
              </div>

              {/* Emoji */}
              <div style={{ fontSize: 32, flexShrink: 0 }}>{team.emoji}</div>

              {/* Name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Team name — tap to rename */}
                <button
                  onClick={() => setRenaming(team)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                    textAlign: 'left', maxWidth: '100%',
                  }}
                >
                  <span style={{
                    fontSize: 18, fontWeight: 800, color: '#f1f5f9',
                    fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    borderBottom: '1.5px dashed #475569',
                  }}>
                    {team.name}
                  </span>
                  <span style={{ fontSize: 13, color: '#475569', flexShrink: 0 }}>✏️</span>
                </button>

                {/* Progress bar */}
                <div style={{ background: '#334155', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, background: team.color,
                    width: `${(team.score / maxScore) * 100}%`,
                    minWidth: team.score > 0 ? 16 : 0,
                    transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                </div>
              </div>

              {/* Score */}
              <div style={{
                fontSize: 48, fontWeight: 900, color: team.color,
                fontFamily: FONT, lineHeight: 1, flexShrink: 0,
                animation: pulse ? `scorePulse 0.4s ease` : 'none',
              }}>
                {team.score}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 28, color: '#334155', fontSize: 12 }}>
        <p style={{ margin: 0 }}>รหัส: <strong style={{ color: '#475569', letterSpacing: 2 }}>{code.toUpperCase()}</strong></p>
        <p style={{ margin: '4px 0 0' }}>นักศึกษาดูคะแนนได้ · อาจารย์ปรับคะแนนผ่านระบบหลัก</p>
      </div>

      {/* Rename modal */}
      {renaming && (
        <RenameModal
          team={renaming}
          code={code}
          onClose={() => setRenaming(null)}
          onSuccess={(newTeams) => {
            setTeams(newTeams);
            prevTeamsRef.current = newTeams;
            setRenaming(null);
          }}
        />
      )}
    </div>
  );
}

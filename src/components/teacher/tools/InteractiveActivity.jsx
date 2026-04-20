'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const COLORS = ['#00b4e6', '#e6007e', '#7c4dff', '#ffc107', '#10b981', '#f97316', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];
const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#ccfbf1', '#fce7f3'];

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ========= QR CODE PANEL =========
function QRPanel({ roomCode, mode, onClose }) {
  const canvasRef = useRef(null);
  const [studentUrl, setStudentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const base = window.location.origin;
      const url = `${base}/student/interactive?room=${roomCode}&mode=${mode}`;
      setStudentUrl(url);

      // Generate QR
      import('qrcode').then(QRCode => {
        if (canvasRef.current) {
          QRCode.toCanvas(canvasRef.current, url, {
            width: 280,
            margin: 2,
            color: { dark: CI.dark, light: '#ffffff' },
            errorCorrectionLevel: 'H',
          });
        }
      }).catch(() => {});
    }
  }, [roomCode, mode]);

  const copyLink = () => {
    navigator.clipboard.writeText(studentUrl);
    toast.success('คัดลอกลิงก์แล้ว!');
  };

  const modeLabel = mode === 'wordcloud' ? 'Word Cloud' : mode === 'poll' ? 'Live Poll' : 'Brainstorm';

  return (
    <div style={{
      background: '#fff', borderRadius: '16px', border: `2px solid ${CI.cyan}`,
      padding: '24px', textAlign: 'center', marginBottom: '20px',
      boxShadow: '0 4px 20px rgba(0,180,230,0.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '18px', color: CI.dark }}>
          📱 สแกน QR เข้าร่วม {modeLabel}
        </h4>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8',
          cursor: 'pointer', padding: '4px',
        }}>✕</button>
      </div>

      {/* Room Code */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        background: `linear-gradient(135deg, ${CI.cyan}15, ${CI.purple}15)`,
        borderRadius: '12px', padding: '12px 24px', marginBottom: '16px',
      }}>
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Room Code</span>
        <span style={{
          fontSize: '32px', fontWeight: 800, color: CI.dark,
          letterSpacing: '6px', fontFamily: "'Courier New', monospace",
        }}>{roomCode}</span>
      </div>

      {/* QR Canvas */}
      <div style={{ marginBottom: '16px' }}>
        <canvas ref={canvasRef} style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
      </div>

      {/* URL + copy */}
      <div style={{
        display: 'flex', gap: '8px', alignItems: 'center',
        background: '#f8fafc', borderRadius: '10px', padding: '10px 14px',
        border: '1px solid #e2e8f0', marginBottom: '12px',
      }}>
        <input
          value={studentUrl}
          readOnly
          style={{
            flex: 1, border: 'none', background: 'none', fontSize: '13px',
            color: '#64748b', outline: 'none', fontFamily: 'monospace',
          }}
        />
        <button onClick={copyLink} style={{
          padding: '6px 14px', borderRadius: '8px', border: 'none',
          background: CI.cyan, color: '#fff', cursor: 'pointer',
          fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}>📋 คัดลอก</button>
      </div>

      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
        นักศึกษาสแกน QR หรือเปิดลิงก์เพื่อส่ง{mode === 'wordcloud' ? 'คำ' : mode === 'poll' ? 'โหวต' : 'ไอเดีย'}เข้ามาได้ทันที
      </p>
    </div>
  );
}

// ========= WORD CLOUD MODE =========
function WordCloudMode({ roomCode, showQR }) {
  const [input, setInput] = useState('');
  const [words, setWords] = useState([]);

  // Poll for student submissions
  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/teacher/interactive?room=${roomCode}&action=get`);
        if (res.ok) {
          const data = await res.json();
          if (data.submissions?.length > 0) {
            setWords(prev => {
              const updated = [...prev];
              data.submissions.forEach(sub => {
                const wordTexts = (sub.text || '').split(/[,\n]+/).map(w => w.trim()).filter(Boolean);
                wordTexts.forEach(word => {
                  const existing = updated.find(w => w.text.toLowerCase() === word.toLowerCase());
                  if (existing) existing.count++;
                  else updated.push({ text: word, count: 1, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
                });
              });
              return updated;
            });
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const addWords = () => {
    if (!input.trim()) { toast.error('กรุณาพิมพ์คำ'); return; }
    const newWords = input.split(/[,\n]+/).map(w => w.trim()).filter(Boolean);
    setWords(prev => {
      const updated = [...prev];
      newWords.forEach(word => {
        const existing = updated.find(w => w.text.toLowerCase() === word.toLowerCase());
        if (existing) existing.count++;
        else updated.push({ text: word, count: 1, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
      });
      return updated;
    });
    setInput('');
    toast.success(`เพิ่ม ${newWords.length} คำแล้ว`);
  };

  const addSampleWords = () => {
    const samples = [
      'นวัตกรรม', 'AI', 'การตลาด', 'ดิจิทัล', 'ความคิดสร้างสรรค์', 'เทคโนโลยี',
      'ธุรกิจ', 'สตาร์ทอัพ', 'การเรียนรู้', 'Data', 'ยุทธศาสตร์', 'ผู้นำ',
      'AI', 'นวัตกรรม', 'ดิจิทัล', 'การตลาด', 'AI', 'เทคโนโลยี', 'ธุรกิจ',
      'นวัตกรรม', 'AI', 'Data', 'การเรียนรู้', 'ความคิดสร้างสรรค์',
    ];
    const updated = [];
    samples.forEach(word => {
      const existing = updated.find(w => w.text === word);
      if (existing) existing.count++;
      else updated.push({ text: word, count: 1, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    });
    setWords(updated);
    toast.success('เพิ่มคำตัวอย่างแล้ว');
  };

  const maxCount = Math.max(...words.map(w => w.count), 1);

  return (
    <div>
      {showQR && roomCode && <QRPanel roomCode={roomCode} mode="wordcloud" onClose={() => {}} />}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addWords()}
          placeholder="พิมพ์คำ (คั่นด้วย , หรือ Enter)..."
          style={{ ...inp, flex: 1 }}
        />
        <button onClick={addWords} style={gradBtn}>+ เพิ่มคำ</button>
        <button onClick={addSampleWords} style={{ ...actBtn, whiteSpace: 'nowrap' }}>📌 ตัวอย่าง</button>
      </div>

      <div style={{
        background: '#fff', borderRadius: '16px', padding: '40px', border: '1px solid #e2e8f0',
        minHeight: '300px', display: 'flex', flexWrap: 'wrap', gap: '12px',
        justifyContent: 'center', alignItems: 'center',
      }}>
        {words.length === 0 && (
          <span style={{ color: '#94a3b8', fontSize: '16px' }}>เพิ่มคำเพื่อสร้าง Word Cloud</span>
        )}
        {words.sort((a, b) => b.count - a.count).map((w, i) => {
          const size = 16 + (w.count / maxCount) * 42;
          const opacity = 0.5 + (w.count / maxCount) * 0.5;
          return (
            <span key={i} style={{
              fontSize: `${size}px`, fontWeight: w.count > 1 ? 700 : 500,
              color: w.color, opacity, cursor: 'default',
              padding: '4px 8px', transition: 'all 0.3s',
              transform: `rotate(${(Math.random() - 0.5) * 10}deg)`,
            }}>
              {w.text}
            </span>
          );
        })}
      </div>

      {words.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '15px', color: '#64748b' }}>คำทั้งหมด: {words.length} | คำที่ถูกเพิ่มมากสุด: {words[0]?.text} ({words[0]?.count})</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={async () => {
              const { downloadExcel } = await import('@/lib/teacher/exportUtils');
              const sorted = [...words].sort((a, b) => b.count - a.count);
              downloadExcel(
                ['คำ', 'จำนวนครั้ง'],
                sorted.map(w => [w.text, w.count]),
                `wordcloud_${roomCode || 'export'}`,
                'Word Cloud'
              );
              toast.success('ดาวน์โหลด Excel แล้ว');
            }} style={{ ...gradBtn, padding: '8px 16px', fontSize: '13px' }}>📥 Excel</button>
            <button onClick={() => { setWords([]); toast('ล้างคำทั้งหมดแล้ว'); }} style={{ ...actBtn, color: '#ef4444' }}>🗑️ ล้าง</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========= LIVE POLL MODE =========
function LivePollMode({ roomCode, showQR }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [results, setResults] = useState(null);

  // Poll for student votes
  useEffect(() => {
    if (!roomCode || !results) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/teacher/interactive?room=${roomCode}&action=get`);
        if (res.ok) {
          const data = await res.json();
          if (data.submissions?.length > 0) {
            setResults(prev => {
              if (!prev) return prev;
              const newVotes = [...prev.votes];
              data.submissions.forEach(sub => {
                const idx = parseInt(sub.text);
                if (!isNaN(idx) && idx >= 0 && idx < newVotes.length) {
                  newVotes[idx]++;
                }
              });
              return { ...prev, votes: newVotes };
            });
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [roomCode, results]);

  const updateOption = (idx, val) => {
    setOptions(prev => { const c = [...prev]; c[idx] = val; return c; });
  };

  const addOption = () => setOptions(prev => [...prev, '']);
  const removeOption = (idx) => {
    if (options.length <= 2) { toast.error('ต้องมีอย่างน้อย 2 ตัวเลือก'); return; }
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const startPoll = async () => {
    if (!question.trim()) { toast.error('กรุณาพิมพ์คำถาม'); return; }
    const validOpts = options.filter(o => o.trim());
    if (validOpts.length < 2) { toast.error('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ'); return; }

    // Save poll data for students
    if (roomCode) {
      try {
        await fetch('/api/teacher/interactive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: roomCode, action: 'set_poll',
            question, options: validOpts,
          }),
        });
      } catch {}
    }

    const mockVotes = validOpts.map(() => 0);
    setResults({ question, options: validOpts, votes: mockVotes });
    toast.success('เริ่ม Poll แล้ว! นักศึกษาสแกน QR เพื่อโหวต');
  };

  const totalVotes = results ? results.votes.reduce((a, b) => a + b, 0) : 0;
  const maxVotes = results ? Math.max(...results.votes) : 0;

  return (
    <div>
      {showQR && roomCode && <QRPanel roomCode={roomCode} mode="poll" onClose={() => {}} />}

      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>คำถาม Poll *</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="เช่น คุณคิดว่าวิธีใดเหมาะสมที่สุด?" style={inp} />
        </div>
        <label style={lbl}>ตัวเลือก</label>
        {options.map((opt, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: COLORS[idx % COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
              {String.fromCharCode(65 + idx)}
            </span>
            <input value={opt} onChange={e => updateOption(idx, e.target.value)} placeholder={`ตัวเลือก ${idx + 1}`} style={{ ...inp, flex: 1 }} />
            <button onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={addOption} style={{ ...actBtn, flex: 1 }}>+ เพิ่มตัวเลือก</button>
          <button onClick={startPoll} style={{ ...gradBtn, flex: 1 }}>🗳️ เริ่ม Poll</button>
        </div>
      </div>

      {results && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: CI.dark }}>📊 ผล Poll (Live)</h3>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '15px' }}>
            {results.question} — ผู้ตอบ: {totalVotes} คน
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {results.options.map((opt, idx) => {
              const pct = totalVotes > 0 ? ((results.votes[idx] / totalVotes) * 100).toFixed(1) : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: CI.dark }}>{opt}</span>
                    <span style={{ fontSize: '15px', color: '#64748b' }}>{results.votes[idx]} ({pct}%)</span>
                  </div>
                  <div style={{ height: '32px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${maxVotes > 0 ? (results.votes[idx] / maxVotes) * 100 : 0}%`,
                      height: '100%', borderRadius: '8px', transition: 'width 0.8s ease',
                      background: COLORS[idx % COLORS.length],
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={async () => {
              const { downloadExcel } = await import('@/lib/teacher/exportUtils');
              downloadExcel(
                ['ตัวเลือก', 'จำนวนโหวต', 'เปอร์เซ็นต์'],
                results.options.map((opt, idx) => {
                  const pct = totalVotes > 0 ? ((results.votes[idx] / totalVotes) * 100).toFixed(1) : '0';
                  return [opt, results.votes[idx], `${pct}%`];
                }),
                `poll_${roomCode || 'export'}`,
                'Live Poll'
              );
              toast.success('ดาวน์โหลด Excel แล้ว');
            }} style={{ ...gradBtn, padding: '10px 20px' }}>📥 ดาวน์โหลด Excel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========= BRAINSTORM BOARD MODE =========
function BrainstormMode({ roomCode, showQR }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);

  // Poll for student ideas
  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/teacher/interactive?room=${roomCode}&action=get`);
        if (res.ok) {
          const data = await res.json();
          if (data.submissions?.length > 0) {
            setNotes(prev => {
              const newNotes = [...prev];
              data.submissions.forEach(sub => {
                if (sub.text && !newNotes.find(n => n.text === sub.text && n.from === sub.from)) {
                  newNotes.push({
                    id: Date.now().toString() + Math.random(),
                    text: sub.text,
                    from: sub.from || 'นักศึกษา',
                    color: sub.color || STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
                  });
                }
              });
              return newNotes;
            });
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const addNote = () => {
    if (!newNote.trim()) { toast.error('กรุณาพิมพ์ไอเดีย'); return; }
    setNotes(prev => [...prev, {
      id: Date.now().toString(),
      text: newNote.trim(),
      from: 'อาจารย์',
      color: selectedColor,
    }]);
    setNewNote('');
  };

  const addSamples = () => {
    const samples = [
      'ใช้ AI ช่วยวิเคราะห์ข้อมูล', 'สร้าง Prototype', 'ทำ Survey นักศึกษา',
      'ศึกษา Case Study', 'จัดกลุ่มระดมสมอง', 'เรียนรู้จาก Expert',
      'ลองใช้งานจริง', 'ทบทวนทฤษฎี', 'สร้าง Mind Map',
    ];
    const newNotes = samples.map((text, i) => ({
      id: (Date.now() + i).toString(),
      text,
      from: 'ตัวอย่าง',
      color: STICKY_COLORS[i % STICKY_COLORS.length],
    }));
    setNotes(prev => [...prev, ...newNotes]);
    toast.success('เพิ่มไอเดียตัวอย่างแล้ว');
  };

  const removeNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  return (
    <div>
      {showQR && roomCode && <QRPanel roomCode={roomCode} mode="brainstorm" onClose={() => {}} />}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()}
          placeholder="พิมพ์ไอเดีย..."
          style={{ ...inp, flex: 1 }}
        />
        <button onClick={addNote} style={gradBtn}>+ เพิ่ม</button>
        <button onClick={addSamples} style={{ ...actBtn, whiteSpace: 'nowrap' }}>📌 ตัวอย่าง</button>
      </div>
      {/* Color picker */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8', marginRight: '4px' }}>สีโพสอิท:</span>
        {STICKY_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setSelectedColor(c)}
            style={{
              width: '28px', height: '28px', borderRadius: '8px', border: selectedColor === c ? '3px solid #475569' : '2px solid #e2e8f0',
              background: c, cursor: 'pointer', transition: 'all 0.15s',
              transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
              boxShadow: selectedColor === c ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
          />
        ))}
      </div>

      <div style={{
        background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0',
        minHeight: '450px', position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '14px',
        alignContent: 'flex-start',
      }}>
        {notes.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', paddingTop: '80px', fontSize: '16px' }}>
            เพิ่มไอเดียเพื่อสร้าง Brainstorm Board
          </div>
        )}
        {notes.map(note => (
          <div key={note.id} style={{
            background: note.color,
            borderRadius: '4px',
            padding: '16px',
            width: '180px',
            minHeight: '100px',
            boxShadow: '2px 3px 8px rgba(0,0,0,0.1)',
            position: 'relative',
            transform: `rotate(${(Math.random() - 0.5) * 4}deg)`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'; e.currentTarget.style.boxShadow = '4px 6px 16px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${(Math.random() - 0.5) * 4}deg)`; e.currentTarget.style.boxShadow = '2px 3px 8px rgba(0,0,0,0.1)'; }}
          >
            <button onClick={() => removeNote(note.id)} style={{
              position: 'absolute', top: '4px', right: '6px', background: 'none', border: 'none',
              color: '#00000044', cursor: 'pointer', fontSize: '14px', padding: '2px',
            }}>✕</button>
            <p style={{ margin: 0, fontSize: '15px', color: '#1e293b', lineHeight: 1.5, fontWeight: 500 }}>
              {note.text}
            </p>
            {note.from && (
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>— {note.from}</span>
            )}
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '15px', color: '#64748b' }}>ไอเดียทั้งหมด: {notes.length}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={async () => {
              const { downloadExcel } = await import('@/lib/teacher/exportUtils');
              downloadExcel(
                ['ลำดับ', 'ไอเดีย', 'ผู้ส่ง'],
                notes.map((n, i) => [i + 1, n.text, n.from || 'อาจารย์']),
                `brainstorm_${roomCode || 'export'}`,
                'Brainstorm'
              );
              toast.success('ดาวน์โหลด Excel แล้ว');
            }} style={{ ...gradBtn, padding: '8px 16px', fontSize: '13px' }}>📥 Excel</button>
            <button onClick={() => { setNotes([]); toast('ล้างทั้งหมดแล้ว'); }} style={{ ...actBtn, color: '#ef4444' }}>🗑️ ล้าง</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========= TIMER DISPLAY =========
const TIMER_OPTIONS = [
  { label: '∞ ไม่จำกัด', value: 0 },
  { label: '1 นาที', value: 60 },
  { label: '3 นาที', value: 180 },
  { label: '5 นาที', value: 300 },
  { label: '10 นาที', value: 600 },
  { label: '15 นาที', value: 900 },
  { label: '20 นาที', value: 1200 },
];

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ========= LANDING PAGE =========
const MODE_CARDS = [
  {
    id: 'wordcloud',
    emoji: '☁️',
    label: 'Word Cloud',
    labelTh: 'เมฆคำ',
    desc: 'ให้นักศึกษาส่งคำผ่านสมาร์ทโฟน สร้างภาพ Word Cloud แบบ Real-time คำที่ถูกพูดถึงบ่อยจะแสดงขนาดใหญ่ขึ้น',
    color: '#00b4e6',
    bg: 'linear-gradient(135deg,#f0fdff,#e0f7fa)',
    border: '#00b4e6',
    features: ['นักศึกษาส่งคำผ่านสมาร์ทโฟน', 'คำยิ่งถูกพูดถึงบ่อย ยิ่งใหญ่ขึ้น', 'ดาวน์โหลดผลเป็น Excel'],
  },
  {
    id: 'poll',
    emoji: '📊',
    label: 'Live Poll',
    labelTh: 'โหวตสด',
    desc: 'สร้างคำถาม + ตัวเลือก ให้นักศึกษาโหวตจากโทรศัพท์ เห็นผลกราฟแบบ Real-time ทันที',
    color: '#e6007e',
    bg: 'linear-gradient(135deg,#fff0f7,#fce7f3)',
    border: '#e6007e',
    features: ['เพิ่มตัวเลือกได้ไม่จำกัด', 'เห็นผลกราฟแบบ Real-time', 'ดาวน์โหลดสรุปโหวต Excel'],
  },
  {
    id: 'brainstorm',
    emoji: '💡',
    label: 'Brainstorm Board',
    labelTh: 'กระดานระดมสมอง',
    desc: 'กระดาน Sticky Notes ดิจิทัล นักศึกษาส่งไอเดียพร้อมกัน เห็นผลแบบ Real-time บนกระดาน',
    color: '#7c4dff',
    bg: 'linear-gradient(135deg,#f5f0ff,#ede9fe)',
    border: '#7c4dff',
    features: ['โพสอิทสีสันสวยงาม', 'นักศึกษาส่งไอเดียพร้อมกัน', 'ดาวน์โหลดรายการไอเดีย'],
  },
];

function LandingPage({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎯</div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: CI.dark, margin: '0 0 10px' }}>
          Interactive Activities
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
          เลือกกิจกรรมที่ต้องการสร้าง แล้วคลิกเพื่อเข้าสร้างคำถาม
        </p>
      </div>

      {/* 3 Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
      }}>
        {MODE_CARDS.map(m => (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            onMouseEnter={() => setHovered(m.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: m.bg,
              border: `2px solid ${hovered === m.id ? m.border : `${m.border}30`}`,
              borderRadius: '22px',
              padding: '32px 26px 28px',
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              transform: hovered === m.id ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hovered === m.id ? `0 16px 40px ${m.color}28` : '0 2px 12px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div style={{
              fontSize: '56px', marginBottom: '16px', lineHeight: 1,
              filter: hovered === m.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none',
              transition: 'filter 0.2s',
            }}>{m.emoji}</div>

            {/* Title */}
            <h3 style={{
              fontSize: '22px', fontWeight: 900,
              color: hovered === m.id ? m.color : CI.dark,
              margin: '0 0 4px', transition: 'color 0.2s',
            }}>{m.label}</h3>
            <div style={{ fontSize: '13px', color: m.color, fontWeight: 700, marginBottom: '14px', opacity: 0.8 }}>
              {m.labelTh}
            </div>

            {/* Description */}
            <p style={{
              fontSize: '14px', color: '#64748b', lineHeight: 1.65,
              margin: '0 0 22px',
            }}>{m.desc}</p>

            {/* Feature list */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
              marginBottom: '26px', textAlign: 'left',
            }}>
              {m.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: `${m.color}18`, color: m.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 900,
                  }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div style={{
              display: 'inline-block', width: '100%',
              padding: '12px 0', borderRadius: '14px',
              background: hovered === m.id
                ? `linear-gradient(135deg, ${m.color}, ${m.color}bb)`
                : `${m.color}18`,
              color: hovered === m.id ? '#fff' : m.color,
              fontSize: '15px', fontWeight: 800, fontFamily: FONT,
              transition: 'all 0.2s', letterSpacing: 0.3,
              boxShadow: hovered === m.id ? `0 4px 16px ${m.color}45` : 'none',
            }}>
              {hovered === m.id ? 'เริ่มสร้างกิจกรรม →' : 'คลิกเพื่อเข้าใช้งาน'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========= MAIN COMPONENT =========
export default function InteractiveActivity() {
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [timerDuration, setTimerDuration] = useState(300); // default 5 min
  const [timeLeft, setTimeLeft] = useState(null); // null = not started
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Countdown logic
  useEffect(() => {
    if (!timerRunning || timeLeft === null) return;
    if (timeLeft <= 0) {
      setTimerRunning(false);
      toast('⏰ หมดเวลาแล้ว!', { icon: '🔔', duration: 5000 });
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timeLeft]);

  const startSession = () => {
    const code = genRoomCode();
    setRoomCode(code);
    setShowQR(true);

    // Start timer if set
    if (timerDuration > 0) {
      setTimeLeft(timerDuration);
      setTimerRunning(true);
    } else {
      setTimeLeft(null);
      setTimerRunning(false);
    }

    fetch('/api/teacher/interactive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: code, action: 'create', mode }),
    }).catch(() => {});

    toast.success(`เปิดห้อง ${code} สำเร็จ!`);
  };

  const resetTimer = () => {
    clearTimeout(timerRef.current);
    if (timerDuration > 0) {
      setTimeLeft(timerDuration);
      setTimerRunning(true);
    } else {
      setTimeLeft(null);
      setTimerRunning(false);
    }
  };

  const pauseTimer = () => {
    setTimerRunning(v => !v);
  };

  // Timer color
  const isUrgent = timeLeft !== null && timeLeft <= 30;
  const isWarning = timeLeft !== null && timeLeft <= 60 && timeLeft > 30;
  const timerColor = isUrgent ? '#ef4444' : isWarning ? '#f97316' : CI.cyan;

  // ── Landing page ──
  if (!mode) return <LandingPage onSelect={setMode} />;

  const modes = [
    { id: 'wordcloud', label: '☁️ Word Cloud', desc: 'สร้าง Word Cloud จากคำของนักศึกษา' },
    { id: 'poll', label: '📊 Live Poll', desc: 'สร้าง Poll แบบ Real-time' },
    { id: 'brainstorm', label: '💡 Brainstorm Board', desc: 'กระดานระดมสมอง Sticky Notes' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { setMode(null); setRoomCode(''); setShowQR(false); clearTimeout(timerRef.current); setTimeLeft(null); setTimerRunning(false); }} style={{
            padding: '6px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', cursor: 'pointer',
            fontSize: '14px', fontWeight: 700, fontFamily: FONT,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>← โหมด</button>
          <h3 style={{ margin: 0, fontSize: '22px', color: CI.dark, fontWeight: 700 }}>
            {MODE_CARDS.find(m => m.id === mode)?.emoji} {MODE_CARDS.find(m => m.id === mode)?.label}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Timer display when running */}
          {timeLeft !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: isUrgent ? '#fef2f2' : isWarning ? '#fff7ed' : '#f0fdff',
              border: `2px solid ${timerColor}`,
              borderRadius: '12px', padding: '8px 16px',
              animation: isUrgent ? 'pulse 0.8s infinite' : 'none',
            }}>
              <span style={{ fontSize: '13px', color: timerColor, fontWeight: 600 }}>⏱️ เวลา</span>
              <span style={{
                fontSize: '26px', fontWeight: 900, color: timerColor,
                fontFamily: "'Courier New', monospace", minWidth: '60px', textAlign: 'center',
                letterSpacing: '2px',
              }}>
                {timeLeft <= 0 ? '00:00' : formatTime(timeLeft)}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={pauseTimer} title={timerRunning ? 'หยุด' : 'เดิน'} style={{
                  background: 'none', border: `1px solid ${timerColor}`, borderRadius: '6px',
                  padding: '2px 8px', cursor: 'pointer', color: timerColor, fontSize: '14px',
                }}>{timerRunning ? '⏸' : '▶'}</button>
                <button onClick={resetTimer} title="รีเซ็ต" style={{
                  background: 'none', border: `1px solid ${timerColor}`, borderRadius: '6px',
                  padding: '2px 8px', cursor: 'pointer', color: timerColor, fontSize: '14px',
                }}>↺</button>
              </div>
            </div>
          )}

          {/* Room code */}
          {roomCode && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#e0f7fa', borderRadius: '10px', padding: '8px 16px',
            }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Room:</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: CI.dark, letterSpacing: '3px', fontFamily: "'Courier New', monospace" }}>{roomCode}</span>
              <button onClick={() => setShowQR(v => !v)} style={{
                padding: '4px 10px', borderRadius: '6px',
                background: showQR ? CI.cyan : '#fff', color: showQR ? '#fff' : CI.cyan,
                cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
                border: `1px solid ${CI.cyan}`,
              }}>
                {showQR ? '🔽 ซ่อน QR' : '📱 แสดง QR'}
              </button>
            </div>
          )}

          {/* Timer selector + start button */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={timerDuration}
              onChange={e => setTimerDuration(Number(e.target.value))}
              style={{
                padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0',
                fontSize: '14px', fontFamily: FONT, color: CI.dark, background: '#fff',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {TIMER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button onClick={startSession} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '15px',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              {roomCode ? '🔄 สร้างห้องใหม่' : '📱 เปิดห้อง + QR'}
            </button>
          </div>
        </div>
      </div>

      {/* Timer progress bar */}
      {timeLeft !== null && timerDuration > 0 && (
        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '4px', transition: 'width 1s linear, background 0.5s',
            width: `${Math.max(0, (timeLeft / timerDuration) * 100)}%`,
            background: isUrgent ? '#ef4444' : isWarning ? '#f97316' : `linear-gradient(90deg, ${CI.cyan}, ${CI.purple})`,
          }} />
        </div>
      )}

      {/* Mode selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '16px', borderRadius: '14px', border: `2px solid ${mode === m.id ? CI.cyan : '#e2e8f0'}`,
            background: mode === m.id ? `${CI.cyan}10` : '#fff', cursor: 'pointer',
            textAlign: 'left', transition: 'all 0.2s', fontFamily: FONT,
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: mode === m.id ? CI.cyan : CI.dark, marginBottom: '4px' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      {mode === 'wordcloud' && <WordCloudMode roomCode={roomCode} showQR={showQR} />}
      {mode === 'poll' && <LivePollMode roomCode={roomCode} showQR={showQR} />}
      {mode === 'brainstorm' && <BrainstormMode roomCode={roomCode} showQR={showQR} />}

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }`}</style>
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
const actBtn = { padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600 };
const gradBtn = { padding: '12px 24px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: 'inherit', whiteSpace: 'nowrap' };

'use client';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const COLORS = ['#00b4e6', '#e6007e', '#7c4dff', '#ffc107', '#10b981', '#f97316', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];
const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#ccfbf1', '#fce7f3'];

// ========= WORD CLOUD MODE =========
function WordCloudMode() {
  const [input, setInput] = useState('');
  const [words, setWords] = useState([]);

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

      {/* Word Cloud Visual */}
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
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '15px', color: '#64748b' }}>คำทั้งหมด: {words.length} | คำที่ถูกเพิ่มมากสุด: {words[0]?.text} ({words[0]?.count})</span>
          <button onClick={() => { setWords([]); toast('ล้างคำทั้งหมดแล้ว'); }} style={{ ...actBtn, color: '#ef4444' }}>🗑️ ล้าง</button>
        </div>
      )}
    </div>
  );
}

// ========= LIVE POLL MODE =========
function LivePollMode() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [results, setResults] = useState(null);

  const updateOption = (idx, val) => {
    setOptions(prev => { const c = [...prev]; c[idx] = val; return c; });
  };

  const addOption = () => setOptions(prev => [...prev, '']);
  const removeOption = (idx) => {
    if (options.length <= 2) { toast.error('ต้องมีอย่างน้อย 2 ตัวเลือก'); return; }
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const startPoll = () => {
    if (!question.trim()) { toast.error('กรุณาพิมพ์คำถาม'); return; }
    const validOpts = options.filter(o => o.trim());
    if (validOpts.length < 2) { toast.error('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ'); return; }
    // Generate mock results
    const mockVotes = validOpts.map(() => Math.floor(Math.random() * 30) + 5);
    setResults({ question, options: validOpts, votes: mockVotes });
    toast.success('เริ่ม Poll แล้ว! (แสดงผลจำลอง)');
  };

  const totalVotes = results ? results.votes.reduce((a, b) => a + b, 0) : 0;
  const maxVotes = results ? Math.max(...results.votes) : 0;

  return (
    <div>
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

      {/* Results */}
      {results && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: CI.dark }}>📊 ผล Poll</h3>
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
        </div>
      )}
    </div>
  );
}

// ========= BRAINSTORM BOARD MODE =========
function BrainstormMode() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (!newNote.trim()) { toast.error('กรุณาพิมพ์ไอเดีย'); return; }
    setNotes(prev => [...prev, {
      id: Date.now().toString(),
      text: newNote.trim(),
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      x: Math.random() * 60,
      y: Math.random() * 40,
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
      color: STICKY_COLORS[i % STICKY_COLORS.length],
      x: 5 + (i % 4) * 24,
      y: 5 + Math.floor(i / 4) * 35,
    }));
    setNotes(prev => [...prev, ...newNotes]);
    toast.success('เพิ่มไอเดียตัวอย่างแล้ว');
  };

  const removeNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
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

      {/* Brainstorm Board */}
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
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '15px', color: '#64748b' }}>ไอเดียทั้งหมด: {notes.length}</span>
          <button onClick={() => { setNotes([]); toast('ล้างทั้งหมดแล้ว'); }} style={{ ...actBtn, color: '#ef4444' }}>🗑️ ล้าง</button>
        </div>
      )}
    </div>
  );
}

// ========= MAIN COMPONENT =========
export default function InteractiveActivity() {
  const [mode, setMode] = useState('wordcloud'); // wordcloud | poll | brainstorm

  const modes = [
    { id: 'wordcloud', label: '☁️ Word Cloud', desc: 'สร้าง Word Cloud จากคำของนักศึกษา' },
    { id: 'poll', label: '📊 Live Poll', desc: 'สร้าง Poll แบบ Real-time' },
    { id: 'brainstorm', label: '💡 Brainstorm Board', desc: 'กระดานระดมสมอง Sticky Notes' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '22px', color: CI.dark, fontWeight: 700 }}>🎯 Interactive Activities</h3>

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
      {mode === 'wordcloud' && <WordCloudMode />}
      {mode === 'poll' && <LivePollMode />}
      {mode === 'brainstorm' && <BrainstormMode />}
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
const actBtn = { padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600 };
const gradBtn = { padding: '12px 24px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: 'inherit', whiteSpace: 'nowrap' };

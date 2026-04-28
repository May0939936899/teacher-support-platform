'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const LS_KEY = 'teacher_word_guessing';

const SAMPLE_CATEGORIES = [
  { name: 'สัตว์', color: '#00b4e6', words: ['สิงโต', 'ช้าง', 'ยีราฟ', 'แรด', 'จระเข้', 'นกอินทรี', 'แพนด้า', 'โลมา'] },
  { name: 'อาหารไทย', color: '#e6007e', words: ['ต้มยำกุ้ง', 'ผัดไทย', 'ส้มตำ', 'ข้าวมันไก่', 'แกงเขียวหวาน', 'มะม่วงข้าวเหนียว', 'กระเพราหมูสับ'] },
  { name: 'อาชีพ', color: '#7c4dff', words: ['แพทย์', 'ครู', 'วิศวกร', 'นักบัญชี', 'สถาปนิก', 'พยาบาล', 'ทนายความ', 'นักออกแบบ'] },
  { name: 'ประเทศในอาเซียน', color: '#ffc107', words: ['ไทย', 'เวียดนาม', 'อินโดนีเซีย', 'มาเลเซีย', 'ฟิลิปปินส์', 'สิงคโปร์', 'กัมพูชา', 'เมียนมา'] },
];

function genCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

export default function WordGuessingGame() {
  const [mode, setMode] = useState('setup'); // setup | play | result
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [gameName, setGameName] = useState('ทายคำเป็นหมวดหมู่');
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState({});
  const [teams, setTeams] = useState(['ทีม 1', 'ทีม 2', 'ทีม 3', 'ทีม 4']);
  const [roundWords, setRoundWords] = useState([]);
  const [showCategoryHint, setShowCategoryHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(30);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState(null);
  const timerRef = useRef(null);

  // Load saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.categories?.length) setCategories(p.categories);
        if (p.gameName) setGameName(p.gameName);
        if (p.teams?.length) setTeams(p.teams);
      }
    } catch {}
  }, []);

  // Auto-save
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ categories, gameName, teams })); } catch {}
  }, [categories, gameName, teams]);

  // Timer
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      toast('⏰ หมดเวลา!', { icon: '🔔' });
    }
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timeLeft]);

  const startTimer = () => { setTimeLeft(selectedTime); setTimerRunning(true); };
  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => { setTimerRunning(false); setTimeLeft(selectedTime); };

  // AI generate categories
  const generateWithAI = async () => {
    if (!aiTopic.trim()) { toast.error('ระบุหัวข้อก่อน'); return; }
    setAiLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'custom',
          payload: {
            prompt: `สร้างหมวดคำศัพท์ 4 หมวดเกี่ยวกับหัวข้อ "${aiTopic}" สำหรับเกมทายคำในชั้นเรียน
แต่ละหมวดมีคำ 6-8 คำ ตอบเป็น JSON เท่านั้น รูปแบบ:
[
  {"name": "ชื่อหมวด", "words": ["คำ1", "คำ2", "คำ3", "คำ4", "คำ5", "คำ6"]},
  ...
]
ตอบเฉพาะ JSON ไม่ต้องมีข้อความอื่น`,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const text = data.result || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('รูปแบบไม่ถูกต้อง');
      const parsed = JSON.parse(jsonMatch[0]);
      const colors = [CI.cyan, CI.magenta, CI.purple, CI.gold, '#10b981', '#f97316'];
      const newCats = parsed.map((c, i) => ({ ...c, color: colors[i % colors.length] }));
      setCategories(newCats);
      toast.success(`สร้าง ${newCats.length} หมวดคำสำเร็จ!`);
    } catch (e) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setAiLoading(false);
    }
  };

  // Start game with a category
  const startCategory = (cat) => {
    const shuffled = [...cat.words].sort(() => Math.random() - 0.5);
    setActiveCategory(cat);
    setRoundWords(shuffled);
    setCurrentWordIdx(0);
    setRevealed(false);
    setShowCategoryHint(false);
    resetTimer();
    setMode('play');
  };

  const nextWord = () => {
    if (currentWordIdx < roundWords.length - 1) {
      setCurrentWordIdx(i => i + 1);
      setRevealed(false);
      setShowCategoryHint(false);
      resetTimer();
    } else {
      toast.success('หมดคำในหมวดนี้แล้ว!');
    }
  };

  const prevWord = () => {
    if (currentWordIdx > 0) {
      setCurrentWordIdx(i => i - 1);
      setRevealed(false);
      setShowCategoryHint(false);
    }
  };

  const addScore = (team, pts = 1) => {
    setScores(prev => ({ ...prev, [team]: (prev[team] || 0) + pts }));
    toast.success(`+${pts} คะแนน → ${team}`, { duration: 1500 });
  };

  const addCategory = () => {
    setCategories(prev => [...prev, { name: 'หมวดใหม่', color: CI.cyan, words: ['คำ 1', 'คำ 2', 'คำ 3'] }]);
    setEditingCatIdx(categories.length);
  };

  const updateCategory = (idx, field, val) => {
    setCategories(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  };

  const updateWords = (idx, text) => {
    const words = text.split('\n').map(w => w.trim()).filter(Boolean);
    setCategories(prev => prev.map((c, i) => i === idx ? { ...c, words } : c));
  };

  const deleteCategory = (idx) => {
    setCategories(prev => prev.filter((_, i) => i !== idx));
  };

  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f97316' : CI.cyan;
  const timerPct = (timeLeft / selectedTime) * 100;

  // ===== PLAY MODE =====
  if (mode === 'play' && activeCategory) {
    const word = roundWords[currentWordIdx];
    return (
      <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', padding: '0' }}>
        {/* Header */}
        <div style={{ background: activeCategory.color, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
          <button onClick={() => setMode('setup')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '15px', fontFamily: FONT }}>
            ← กลับ
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.85 }}>หมวด</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{activeCategory.name}</div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{currentWordIdx + 1} / {roundWords.length}</div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
          {/* Word Card */}
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '48px 32px', textAlign: 'center',
            boxShadow: `0 8px 40px ${activeCategory.color}25`, marginBottom: '20px',
            border: `3px solid ${activeCategory.color}40`, position: 'relative', minHeight: '200px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            {revealed ? (
              <>
                <div style={{ fontSize: '56px', fontWeight: 900, color: activeCategory.color, letterSpacing: '-1px', marginBottom: '12px' }}>
                  {word}
                </div>
                <div style={{ fontSize: '16px', color: '#94a3b8' }}>หมวด: {activeCategory.name}</div>
              </>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                style={{
                  background: `linear-gradient(135deg, ${activeCategory.color}, ${activeCategory.color}bb)`,
                  color: '#fff', border: 'none', borderRadius: '16px', padding: '20px 48px',
                  fontSize: '22px', fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
                  boxShadow: `0 6px 20px ${activeCategory.color}40`,
                }}
              >
                👁️ เปิดดูคำ
              </button>
            )}
            {showCategoryHint && (
              <div style={{ position: 'absolute', top: '12px', right: '16px', background: activeCategory.color + '20', color: activeCategory.color, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                💡 hint: {activeCategory.name}
              </div>
            )}
          </div>

          {/* Timer */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: timerColor, fontVariantNumeric: 'tabular-nums', minWidth: '60px' }}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear, background 0.3s' }} />
                </div>
              </div>
              <select value={selectedTime} onChange={e => { setSelectedTime(+e.target.value); setTimeLeft(+e.target.value); setTimerRunning(false); }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: FONT, fontSize: '14px' }}>
                {[15, 20, 30, 45, 60, 90, 120].map(s => <option key={s} value={s}>{s}วิ</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={startTimer} disabled={timerRunning} style={{ flex: 1, padding: '8px', background: timerRunning ? '#f1f5f9' : '#dcfce7', color: timerRunning ? '#94a3b8' : '#16a34a', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: timerRunning ? 'default' : 'pointer', fontFamily: FONT }}>▶ เริ่ม</button>
              <button onClick={pauseTimer} style={{ flex: 1, padding: '8px', background: '#fff7ed', color: '#f97316', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>⏸ หยุด</button>
              <button onClick={resetTimer} style={{ flex: 1, padding: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>↺ รีเซ็ต</button>
              <button onClick={() => setShowCategoryHint(!showCategoryHint)} style={{ flex: 1, padding: '8px', background: '#f3edff', color: CI.purple, border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>💡 Hint</button>
            </div>
          </div>

          {/* Score buttons */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700, marginBottom: '10px' }}>ให้คะแนนทีมที่ตอบถูก:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {teams.map(team => (
                <button key={team} onClick={() => addScore(team)}
                  style={{ padding: '10px 8px', background: `${activeCategory.color}15`, color: activeCategory.color, border: `2px solid ${activeCategory.color}40`, borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontFamily: FONT, fontSize: '15px' }}>
                  +1 {team}
                  <div style={{ fontSize: '20px', fontWeight: 900 }}>{scores[team] || 0} แต้ม</div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={prevWord} disabled={currentWordIdx === 0}
              style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: currentWordIdx === 0 ? 'default' : 'pointer', opacity: currentWordIdx === 0 ? 0.4 : 1, fontFamily: FONT, fontSize: '16px' }}>
              ← ก่อนหน้า
            </button>
            <button onClick={nextWord} disabled={currentWordIdx === roundWords.length - 1}
              style={{ flex: 2, padding: '14px', background: activeCategory.color, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: currentWordIdx === roundWords.length - 1 ? 'default' : 'pointer', opacity: currentWordIdx === roundWords.length - 1 ? 0.5 : 1, fontFamily: FONT, fontSize: '16px' }}>
              คำต่อไป →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== SETUP MODE =====
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: FONT, padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${CI.dark}, #1a1a5e)`, padding: '28px 32px', color: '#fff', marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 900 }}>🎯 ทายคำเป็นหมวดหมู่</h1>
        <p style={{ margin: 0, fontSize: '15px', opacity: 0.75 }}>สร้างหมวดคำ → เล่นในชั้นเรียน → ให้คะแนนทีมที่ตอบถูก</p>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* AI Generate */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: `1px solid ${CI.cyan}40` }}>
          <div style={{ fontWeight: 700, fontSize: '17px', marginBottom: '12px', color: CI.dark }}>✨ AI สร้างหมวดคำให้อัตโนมัติ</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="เช่น: การตลาด, สัตว์โลก, ประวัติศาสตร์ไทย, เศรษฐศาสตร์..."
              onKeyDown={e => e.key === 'Enter' && generateWithAI()}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '15px', fontFamily: FONT }}
            />
            <button onClick={generateWithAI} disabled={aiLoading}
              style={{ padding: '12px 24px', background: `linear-gradient(135deg, ${CI.cyan}, #0099cc)`, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: aiLoading ? 'wait' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              {aiLoading ? '⏳ กำลังสร้าง...' : '🤖 สร้างคำ'}
            </button>
          </div>
        </div>

        {/* Teams */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px', color: CI.dark }}>👥 ชื่อทีม (แก้ไขได้)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
            {teams.map((team, i) => (
              <input key={i} value={team}
                onChange={e => setTeams(prev => prev.map((t, ti) => ti === i ? e.target.value : t))}
                style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: FONT, fontSize: '15px', fontWeight: 600 }}
              />
            ))}
          </div>
        </div>

        {/* Score Board */}
        {Object.keys(scores).length > 0 && (
          <div style={{ background: `linear-gradient(135deg, ${CI.dark}, #1a1a5e)`, borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', color: '#fff' }}>
            <div style={{ fontWeight: 700, marginBottom: '10px' }}>🏆 คะแนนปัจจุบัน</div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {Object.entries(scores).sort(([,a],[,b]) => b-a).map(([team, pts]) => (
                <div key={team} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: CI.gold }}>{pts}</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>{team}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setScores({})} style={{ marginTop: '10px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: FONT }}>
              รีเซ็ตคะแนน
            </button>
          </div>
        )}

        {/* Categories */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: CI.dark }}>📦 หมวดคำทั้งหมด ({categories.length} หมวด)</div>
          <button onClick={addCategory} style={{ background: CI.cyan, color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ เพิ่มหมวด</button>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          {categories.map((cat, idx) => (
            <div key={idx} style={{ background: '#fff', borderRadius: '16px', border: `2px solid ${cat.color}40`, overflow: 'hidden' }}>
              {/* Category Header */}
              <div style={{ background: cat.color, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {editingCatIdx === idx ? (
                  <input autoFocus value={cat.name} onChange={e => updateCategory(idx, 'name', e.target.value)}
                    onBlur={() => setEditingCatIdx(null)}
                    style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: FONT, width: '200px' }}
                  />
                ) : (
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800, cursor: 'pointer' }} onClick={() => setEditingCatIdx(idx)}>
                    {cat.name} <span style={{ fontSize: '13px', opacity: 0.8 }}>✏️ แก้ชื่อ</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '13px' }}>
                    {cat.words.length} คำ
                  </span>
                  <button onClick={() => startCategory(cat)}
                    style={{ background: '#fff', color: cat.color, border: 'none', borderRadius: '10px', padding: '8px 18px', fontWeight: 800, cursor: 'pointer', fontFamily: FONT, fontSize: '15px' }}>
                    ▶ เล่น
                  </button>
                  <button onClick={() => deleteCategory(idx)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff', fontSize: '16px' }}>
                    🗑️
                  </button>
                </div>
              </div>
              {/* Words */}
              <div style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>คำในหมวดนี้ (แต่ละคำขึ้นบรรทัดใหม่):</div>
                <textarea
                  value={cat.words.join('\n')}
                  onChange={e => updateWords(idx, e.target.value)}
                  rows={Math.min(cat.words.length + 1, 8)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: FONT, fontSize: '15px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.8 }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {cat.words.map((w, wi) => (
                    <span key={wi} style={{ background: cat.color + '15', color: cat.color, padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>{w}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

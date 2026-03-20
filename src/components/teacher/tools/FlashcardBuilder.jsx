'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const LS_KEY = 'teacher_flashcard_builder';

const INITIAL_INTERVAL = { easy: 3, good: 1, hard: 0 };

export default function FlashcardBuilder() {
  const [mode, setMode] = useState('build'); // build | study
  const [content, setContent] = useState('');
  const [cards, setCards] = useState([]);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [loading, setLoading] = useState(false);
  const [deckName, setDeckName] = useState('บัตรคำใหม่');
  const [savedDecks, setSavedDecks] = useState([]);

  // Study mode state
  const [studyCards, setStudyCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [totalToReview, setTotalToReview] = useState(0);

  // Load saved decks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.cards && p.cards.length > 0) setCards(p.cards);
        if (p.deckName) setDeckName(p.deckName);
        if (p.content) setContent(p.content);
      }
      const decks = localStorage.getItem(LS_KEY + '_decks');
      if (decks) setSavedDecks(JSON.parse(decks));
    } catch {}
  }, []);

  // Auto-save current state
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ cards, deckName, content }));
    } catch {}
  }, [cards, deckName, content]);

  const saveDecks = (decks) => {
    setSavedDecks(decks);
    try { localStorage.setItem(LS_KEY + '_decks', JSON.stringify(decks)); } catch {}
  };

  // Generate cards from content via AI
  const generateFromContent = async () => {
    if (!content.trim()) { toast.error('กรุณาวางเนื้อหาบทเรียน'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'flashcard_builder', payload: { content } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = parseCards(data.result || '');
      if (parsed.length === 0) { toast.error('ไม่สามารถสร้างบัตรคำได้ ลองใส่เนื้อหาเพิ่มเติม'); return; }
      setCards(prev => [...prev, ...parsed]);
      toast.success(`สร้าง ${parsed.length} บัตรคำแล้ว!`);
    } catch (e) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const parseCards = (text) => {
    const cards = [];
    // Try Q: / A: pattern
    const qaPattern = /(?:Q|คำถาม|ด้านหน้า|Front)[:\s]*(.+?)[\n\r]+(?:A|คำตอบ|ด้านหลัง|Back)[:\s]*(.+?)(?=(?:Q|คำถาม|ด้านหน้า|Front)[:\s]|$)/gis;
    let match;
    while ((match = qaPattern.exec(text)) !== null) {
      const front = match[1].trim();
      const back = match[2].trim();
      if (front && back) {
        cards.push({ id: Date.now().toString() + Math.random().toString(36).slice(2), front, back, interval: 0, ease: 1 });
      }
    }
    // Fallback: try numbered pairs or dash-separated
    if (cards.length === 0) {
      const lines = text.split('\n').filter(l => l.trim());
      for (let i = 0; i < lines.length; i++) {
        const dashSplit = lines[i].match(/^(?:\d+[\.\)]\s*)?(.+?)\s*[-–—:]\s*(.+)$/);
        if (dashSplit) {
          cards.push({ id: Date.now().toString() + Math.random().toString(36).slice(2), front: dashSplit[1].trim(), back: dashSplit[2].trim(), interval: 0, ease: 1 });
        }
      }
    }
    return cards;
  };

  // Manual card add
  const addCard = () => {
    if (!newFront.trim() || !newBack.trim()) { toast.error('กรุณากรอกทั้งด้านหน้าและด้านหลัง'); return; }
    setCards(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      front: newFront.trim(),
      back: newBack.trim(),
      interval: 0,
      ease: 1,
    }]);
    setNewFront('');
    setNewBack('');
    toast.success('เพิ่มบัตรคำแล้ว');
  };

  const removeCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    toast.success('ลบบัตรคำแล้ว');
  };

  // Deck management
  const saveDeck = () => {
    if (cards.length === 0) { toast.error('ไม่มีบัตรคำให้บันทึก'); return; }
    const deck = { id: Date.now().toString(), name: deckName, cards: [...cards], savedAt: new Date().toISOString() };
    const updated = [...savedDecks.filter(d => d.name !== deckName), deck];
    saveDecks(updated);
    toast.success(`บันทึก "${deckName}" (${cards.length} ใบ) แล้ว`);
  };

  const loadDeck = (deck) => {
    setCards(deck.cards);
    setDeckName(deck.name);
    toast.success(`โหลด "${deck.name}" แล้ว`);
  };

  const deleteDeck = (id) => {
    saveDecks(savedDecks.filter(d => d.id !== id));
    toast.success('ลบ Deck แล้ว');
  };

  // Study mode
  const startStudy = useCallback(() => {
    if (cards.length === 0) { toast.error('ไม่มีบัตรคำให้ทบทวน'); return; }
    // Sort by interval (lowest first = needs review most)
    const sorted = [...cards].sort((a, b) => (a.interval || 0) - (b.interval || 0));
    setStudyCards(sorted);
    setCurrentIdx(0);
    setFlipped(false);
    setReviewed(0);
    setTotalToReview(sorted.length);
    setMode('study');
  }, [cards]);

  const handleSpacedRepetition = (difficulty) => {
    const card = studyCards[currentIdx];
    if (!card) return;

    // Update card interval based on difficulty
    const updatedCards = cards.map(c => {
      if (c.id === card.id) {
        const newInterval = (c.interval || 0) + INITIAL_INTERVAL[difficulty];
        const newEase = difficulty === 'easy' ? Math.min((c.ease || 1) + 0.3, 3) :
                        difficulty === 'hard' ? Math.max((c.ease || 1) - 0.3, 0.5) : (c.ease || 1);
        return { ...c, interval: newInterval, ease: newEase };
      }
      return c;
    });
    setCards(updatedCards);

    // If hard, push to end of study queue
    if (difficulty === 'hard') {
      setStudyCards(prev => {
        const copy = [...prev];
        const removed = copy.splice(currentIdx, 1)[0];
        copy.push({ ...removed, interval: 0 });
        return copy;
      });
      setFlipped(false);
    } else {
      // Move to next card
      setReviewed(prev => prev + 1);
      if (currentIdx + 1 < studyCards.length) {
        setCurrentIdx(prev => prev + 1);
        setFlipped(false);
      } else {
        toast.success('ทบทวนครบทุกใบแล้ว!');
        setMode('build');
      }
    }
  };

  const progressPercent = totalToReview > 0 ? Math.round((reviewed / totalToReview) * 100) : 0;

  // Study Mode UI
  if (mode === 'study') {
    const card = studyCards[currentIdx];
    return (
      <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', fontFamily: FONT }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '22px', color: CI.dark, fontWeight: 700 }}>🧠 โหมดทบทวน</h3>
          <button onClick={() => setMode('build')} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '15px', fontFamily: FONT, fontWeight: 600,
          }}>← กลับ</button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>ทบทวนแล้ว {reviewed}/{totalToReview} ใบ</span>
            <span style={{ fontSize: '14px', color: CI.cyan, fontWeight: 700 }}>{progressPercent}%</span>
          </div>
          <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${CI.cyan}, ${CI.purple})`,
              borderRadius: '5px', transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Flashcard */}
        {card && (
          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              perspective: '1000px', cursor: 'pointer', marginBottom: '24px',
              height: '300px', userSelect: 'none',
            }}
          >
            <div style={{
              position: 'relative', width: '100%', height: '100%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              {/* Front */}
              <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                borderRadius: '16px', background: '#fff', border: `2px solid ${CI.cyan}40`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px', boxSizing: 'border-box',
                boxShadow: '0 4px 20px rgba(0,180,230,0.1)',
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', fontWeight: 600 }}>ด้านหน้า — คลิกเพื่อพลิก</div>
                <div style={{ fontSize: '20px', color: CI.dark, fontWeight: 600, textAlign: 'center', lineHeight: 1.6 }}>
                  {card.front}
                </div>
              </div>
              {/* Back */}
              <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRadius: '16px', background: `linear-gradient(135deg, ${CI.cyan}08, ${CI.purple}08)`,
                border: `2px solid ${CI.purple}40`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px', boxSizing: 'border-box',
                boxShadow: '0 4px 20px rgba(124,77,255,0.1)',
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', fontWeight: 600 }}>ด้านหลัง — คำตอบ</div>
                <div style={{ fontSize: '20px', color: CI.dark, fontWeight: 600, textAlign: 'center', lineHeight: 1.6 }}>
                  {card.back}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spaced Repetition Buttons */}
        {flipped && card && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleSpacedRepetition('hard')} style={{
              flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, #ef4444, #f97316)`,
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: FONT,
            }}>
              🔴 ยาก
              <div style={{ fontSize: '12px', fontWeight: 400, opacity: 0.8, marginTop: '2px' }}>ทบทวนอีกครั้ง</div>
            </button>
            <button onClick={() => handleSpacedRepetition('good')} style={{
              flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: FONT,
            }}>
              🟡 พอใช้
              <div style={{ fontSize: '12px', fontWeight: 400, opacity: 0.8, marginTop: '2px' }}>ถัดไป</div>
            </button>
            <button onClick={() => handleSpacedRepetition('easy')} style={{
              flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, #10b981, #22d3ee)`,
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: FONT,
            }}>
              🟢 ง่าย
              <div style={{ fontSize: '12px', fontWeight: 400, opacity: 0.8, marginTop: '2px' }}>จำได้แล้ว</div>
            </button>
          </div>
        )}

        {!flipped && card && (
          <div style={{ textAlign: 'center', fontSize: '15px', color: '#94a3b8' }}>
            คลิกบัตรคำเพื่อดูคำตอบ แล้วเลือกระดับความยาก
          </div>
        )}
      </div>
    );
  }

  // Build Mode UI
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: cards.length > 0 ? '420px 1fr' : '1fr', gap: '24px' }}>
        {/* Left: Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Deck Name & Actions */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: CI.dark, fontWeight: 700 }}>
              🃏 สร้างบัตรคำ (Flashcards)
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
              สร้างบัตรคำจากเนื้อหา หรือเพิ่มด้วยตนเอง พร้อมโหมดทบทวนแบบ Spaced Repetition
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>ชื่อ Deck</label>
              <input value={deckName} onChange={e => setDeckName(e.target.value)} placeholder="ชื่อชุดบัตรคำ" style={inp} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveDeck} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '15px', fontFamily: FONT,
              }}>
                💾 บันทึก Deck
              </button>
              {cards.length > 0 && (
                <button onClick={startStudy} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
                  color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '15px', fontFamily: FONT,
                }}>
                  🧠 เริ่มทบทวน ({cards.length})
                </button>
              )}
            </div>
          </div>

          {/* AI Generate */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <label style={lbl}>สร้างจากเนื้อหาอัตโนมัติ (AI)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="วางเนื้อหาบทเรียน แล้ว AI จะสร้างบัตรคำให้อัตโนมัติ..."
              style={{ ...inp, minHeight: '120px', resize: 'vertical', lineHeight: 1.7 }}
            />
            <button onClick={generateFromContent} disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none', marginTop: '10px',
              background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '15px', fontFamily: FONT,
            }}>
              {loading ? '⏳ AI กำลังสร้างบัตรคำ...' : '✨ สร้างบัตรคำจากเนื้อหา'}
            </button>
          </div>

          {/* Manual Add */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <label style={lbl}>เพิ่มบัตรคำด้วยตนเอง</label>
            <input
              value={newFront}
              onChange={e => setNewFront(e.target.value)}
              placeholder="ด้านหน้า (คำถาม/คำศัพท์)"
              style={{ ...inp, marginBottom: '8px' }}
            />
            <input
              value={newBack}
              onChange={e => setNewBack(e.target.value)}
              placeholder="ด้านหลัง (คำตอบ/ความหมาย)"
              style={{ ...inp, marginBottom: '10px' }}
              onKeyDown={e => { if (e.key === 'Enter') addCard(); }}
            />
            <button onClick={addCard} style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              border: `2px solid ${CI.cyan}`, background: `${CI.cyan}10`,
              color: CI.cyan, cursor: 'pointer', fontWeight: 600, fontSize: '15px', fontFamily: FONT,
            }}>
              + เพิ่มบัตรคำ
            </button>
          </div>

          {/* Saved Decks */}
          {savedDecks.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <label style={lbl}>Deck ที่บันทึกไว้</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedDecks.map(deck => (
                  <div key={deck.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0',
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: CI.dark }}>{deck.name}</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{deck.cards.length} ใบ</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => loadDeck(deck)} style={smallBtn}>📂</button>
                      <button onClick={() => deleteDeck(deck.id)} style={{ ...smallBtn, color: '#ef4444' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Card Grid */}
        {cards.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', color: CI.dark, fontWeight: 700 }}>
                🃏 บัตรคำทั้งหมด ({cards.length} ใบ)
              </h4>
              <button onClick={() => { setCards([]); toast.success('ล้างบัตรคำทั้งหมดแล้ว'); }} style={{
                padding: '6px 14px', borderRadius: '8px', border: '1px solid #ef444440',
                background: '#ef444410', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontFamily: FONT, fontWeight: 600,
              }}>
                🗑️ ล้างทั้งหมด
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {cards.map((card, idx) => (
                <CardPreview key={card.id} card={card} idx={idx} onRemove={() => removeCard(card.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CardPreview({ card, idx, onRemove }) {
  const [showBack, setShowBack] = useState(false);
  return (
    <div
      onClick={() => setShowBack(!showBack)}
      style={{
        background: '#fff', borderRadius: '16px', padding: '16px',
        border: `1px solid ${showBack ? CI.purple + '40' : '#e2e8f0'}`,
        cursor: 'pointer', position: 'relative', minHeight: '100px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        transition: 'border-color 0.2s, background 0.2s',
        ...(showBack ? { background: `${CI.purple}05` } : {}),
      }}
    >
      <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
        #{idx + 1} {showBack ? 'หลัง' : 'หน้า'}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        style={{
          position: 'absolute', top: '6px', right: '8px', width: '24px', height: '24px',
          borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✕
      </button>
      <div style={{
        fontSize: '15px', color: CI.dark, fontWeight: showBack ? 400 : 600,
        textAlign: 'center', lineHeight: 1.6, marginTop: '8px',
        fontFamily: FONT,
      }}>
        {showBack ? card.back : card.front}
      </div>
      {card.interval > 0 && (
        <div style={{ position: 'absolute', bottom: '6px', right: '10px', fontSize: '11px', color: CI.cyan, fontWeight: 600 }}>
          interval: {card.interval}
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
const smallBtn = { width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

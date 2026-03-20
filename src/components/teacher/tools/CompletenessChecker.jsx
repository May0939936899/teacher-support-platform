'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STATUS_MAP = {
  found: { icon: '\u2705', label: '\u0e1e\u0e1a', color: '#4caf50', bg: 'rgba(76,175,80,0.1)' },
  missing: { icon: '\u274c', label: '\u0e44\u0e21\u0e48\u0e1e\u0e1a', color: CI.magenta, bg: 'rgba(230,0,126,0.1)' },
  partial: { icon: '\u26a0\ufe0f', label: '\u0e1e\u0e1a\u0e1a\u0e32\u0e07\u0e2a\u0e48\u0e27\u0e19', color: CI.gold, bg: 'rgba(255,193,7,0.1)' },
};

const LS_KEY = 'completeness_checker_saved_checklists';

function loadSavedChecklists() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSavedChecklists(lists) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(lists)); } catch {}
}

export default function CompletenessChecker() {
  const [checklist, setChecklist] = useState([]);
  const [checklistText, setChecklistText] = useState('');
  const [submission, setSubmission] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [savedChecklists, setSavedChecklists] = useState([]);
  const [saveListName, setSaveListName] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setSavedChecklists(loadSavedChecklists());
  }, []);

  const addItemFromText = () => {
    if (!newItem.trim()) return;
    setChecklist(prev => [...prev, { id: Date.now().toString(), text: newItem.trim() }]);
    setNewItem('');
  };

  const addItemsFromBulk = () => {
    if (!checklistText.trim()) return;
    const items = checklistText.split('\n').filter(l => l.trim()).map((text, i) => ({
      id: Date.now().toString() + i,
      text: text.trim().replace(/^[-\u2022*]\s*/, ''),
    }));
    setChecklist(prev => [...prev, ...items]);
    setChecklistText('');
    toast.success(`\u0e40\u0e1e\u0e34\u0e48\u0e21 ${items.length} \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23`);
  };

  const removeItem = (id) => setChecklist(prev => prev.filter(i => i.id !== id));

  const clearChecklist = () => { setChecklist([]); setResults(null); };

  const saveCurrentChecklist = () => {
    if (!saveListName.trim()) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e15\u0e31\u0e49\u0e07\u0e0a\u0e37\u0e48\u0e2d Checklist');
    if (checklist.length === 0) return toast.error('\u0e44\u0e21\u0e48\u0e21\u0e35\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e43\u0e2b\u0e49\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01');
    const entry = { id: Date.now().toString(), name: saveListName.trim(), items: checklist.map(c => c.text), createdAt: new Date().toISOString() };
    const updated = [...savedChecklists, entry];
    setSavedChecklists(updated);
    saveSavedChecklists(updated);
    setSaveListName('');
    toast.success('\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01 Checklist \u0e41\u0e25\u0e49\u0e27!');
  };

  const loadChecklist = (saved) => {
    setChecklist(saved.items.map((text, i) => ({ id: Date.now().toString() + i, text })));
    setResults(null);
    setShowSaved(false);
    toast.success(`\u0e42\u0e2b\u0e25\u0e14 "${saved.name}" \u0e41\u0e25\u0e49\u0e27`);
  };

  const deleteSavedChecklist = (id) => {
    const updated = savedChecklists.filter(s => s.id !== id);
    setSavedChecklists(updated);
    saveSavedChecklists(updated);
    toast.success('\u0e25\u0e1a\u0e41\u0e25\u0e49\u0e27');
  };

  const check = async () => {
    if (checklist.length === 0) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e01\u0e48\u0e2d\u0e19');
    if (!submission.trim()) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e27\u0e32\u0e07\u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e2a\u0e48\u0e07');
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'completeness_checker',
          payload: { checklist: checklist.map(c => c.text), submission }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      toast.success('\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e41\u0e25\u0e49\u0e27!');
    } catch (err) {
      toast.error('\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const foundCount = results ? results.filter(r => r.status === 'found').length : 0;
  const partialCount = results ? results.filter(r => r.status === 'partial').length : 0;
  const missingCount = results ? results.filter(r => r.status === 'missing').length : 0;
  const total = checklist.length;
  const scorePercent = results ? Math.round(((foundCount + partialCount * 0.5) / total) * 100) : 0;

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  };
  const inputStyle = {
    width: '100%', padding: '12px 16px', background: '#f8f9fa',
    border: '1px solid #e0e0e0', borderRadius: 10, color: CI.dark,
    fontSize: 15, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
  };
  const btnGradient = (from, to) => ({
    padding: '10px 20px', background: `linear-gradient(135deg, ${from}, ${to})`,
    color: '#fff', border: 'none', borderRadius: 10, fontFamily: FONT, fontSize: 15,
    cursor: 'pointer', fontWeight: 600,
  });

  return (
    <div style={{ fontFamily: FONT, color: CI.dark, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>{'\ud83d\udcd1'}</span>
        <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {'\u0e40\u0e0a\u0e47\u0e01\u0e04\u0e27\u0e32\u0e21\u0e04\u0e23\u0e1a\u0e16\u0e49\u0e27\u0e19\u0e02\u0e2d\u0e07\u0e07\u0e32\u0e19'}
        </h2>
      </div>

      {/* Saved Checklists Toggle */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowSaved(!showSaved)} style={{ ...btnGradient(CI.purple, CI.cyan), fontSize: 14, padding: '8px 16px' }}>
          {'\ud83d\udcc2'} Checklist \u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e44\u0e27\u0e49 ({savedChecklists.length})
        </button>
        {showSaved && (
          <div style={{ ...cardStyle, marginTop: 10, maxHeight: 260, overflowY: 'auto' }}>
            {savedChecklists.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: 15 }}>{'\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35 Checklist \u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01'}</p>
            )}
            {savedChecklists.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>{s.items.length} \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23 | {new Date(s.createdAt).toLocaleDateString('th-TH')}</div>
                </div>
                <button onClick={() => loadChecklist(s)} style={{ ...btnGradient(CI.cyan, CI.purple), fontSize: 13, padding: '6px 14px' }}>{'\u0e42\u0e2b\u0e25\u0e14'}</button>
                <button onClick={() => deleteSavedChecklist(s.id)} style={{ background: 'none', border: 'none', color: CI.magenta, cursor: 'pointer', fontSize: 18 }}>{'\u2715'}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Checklist Panel */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.gold }}>{'\ud83d\udccb'} \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItemFromText()}
              placeholder="\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addItemFromText} style={btnGradient(CI.cyan, CI.purple)}>+</button>
          </div>

          <details style={{ marginBottom: 14 }}>
            <summary style={{ fontSize: 14, color: '#999', cursor: 'pointer', marginBottom: 8 }}>
              {'\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2b\u0e25\u0e32\u0e22\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e01\u0e31\u0e19'}
            </summary>
            <textarea
              value={checklistText}
              onChange={e => setChecklistText(e.target.value)}
              placeholder={"\u0e1a\u0e23\u0e23\u0e17\u0e31\u0e14\u0e25\u0e30\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23 \u0e40\u0e0a\u0e48\u0e19:\n- \u0e21\u0e35\u0e1a\u0e17\u0e19\u0e33\n- \u0e21\u0e35\u0e27\u0e31\u0e15\u0e16\u0e38\u0e1b\u0e23\u0e30\u0e2a\u0e07\u0e04\u0e4c\n- \u0e21\u0e35\u0e01\u0e32\u0e23\u0e2d\u0e49\u0e32\u0e07\u0e2d\u0e34\u0e07"}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
            />
            <button onClick={addItemsFromBulk} style={btnGradient(CI.purple, CI.magenta)}>{'\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14'}</button>
          </details>

          {checklist.length === 0 && (
            <p style={{ textAlign: 'center', color: '#bbb', fontSize: 15 }}>{'\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23'}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {checklist.map((item, idx) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                background: '#f8f9fa', borderRadius: 8,
              }}>
                <span style={{ fontSize: 14, color: '#999', minWidth: 24 }}>#{idx + 1}</span>
                <span style={{ flex: 1, fontSize: 15 }}>{item.text}</span>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: CI.magenta, cursor: 'pointer', fontSize: 16 }}>{'\u2715'}</button>
              </div>
            ))}
          </div>

          {checklist.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={clearChecklist} style={{ padding: '6px 14px', background: 'rgba(230,0,126,0.1)', border: `1px solid ${CI.magenta}44`, borderRadius: 8, color: CI.magenta, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                {'\ud83d\uddd1\ufe0f'} \u0e25\u0e49\u0e32\u0e07\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23
              </button>
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                <input
                  value={saveListName}
                  onChange={e => setSaveListName(e.target.value)}
                  placeholder="\u0e0a\u0e37\u0e48\u0e2d Checklist..."
                  style={{ ...inputStyle, flex: 1, fontSize: 13, padding: '6px 10px' }}
                />
                <button onClick={saveCurrentChecklist} style={{ ...btnGradient(CI.cyan, CI.purple), fontSize: 13, padding: '6px 14px' }}>
                  {'\ud83d\udcbe'} \u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submission Panel */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.cyan }}>{'\ud83d\udcc4'} \u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e2a\u0e48\u0e07</h3>
          <textarea
            value={submission}
            onChange={e => setSubmission(e.target.value)}
            placeholder="\u0e27\u0e32\u0e07\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32\u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e19\u0e31\u0e01\u0e28\u0e36\u0e01\u0e29\u0e32\u0e2a\u0e48\u0e07\u0e21\u0e32..."
            rows={16}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
          />
        </div>
      </div>

      {/* Check Button */}
      <button
        onClick={check}
        disabled={loading}
        style={{
          width: '100%', padding: '14px 24px',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          color: '#fff', border: 'none', borderRadius: 12, fontFamily: FONT, fontSize: 17,
          cursor: loading ? 'wait' : 'pointer', fontWeight: 700, opacity: loading ? 0.6 : 1,
          marginBottom: 24,
        }}
      >
        {loading ? '\u23f3 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a...' : '\ud83d\udd0d \u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e04\u0e23\u0e1a\u0e16\u0e49\u0e27\u0e19'}
      </button>

      {/* Results */}
      {results && (
        <div>
          {/* Progress Bar */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{'\u0e04\u0e27\u0e32\u0e21\u0e04\u0e23\u0e1a\u0e16\u0e49\u0e27\u0e19\u0e23\u0e27\u0e21'}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: scorePercent >= 80 ? '#4caf50' : scorePercent >= 50 ? CI.gold : CI.magenta }}>{scorePercent}%</span>
            </div>
            <div style={{ width: '100%', height: 16, background: '#eee', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${scorePercent}%`, height: '100%', borderRadius: 8, transition: 'width 0.6s ease',
                background: scorePercent >= 80 ? `linear-gradient(90deg, #4caf50, ${CI.cyan})` : scorePercent >= 50 ? `linear-gradient(90deg, ${CI.gold}, #ff9800)` : `linear-gradient(90deg, ${CI.magenta}, #ff5722)`,
              }} />
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { count: foundCount, ...STATUS_MAP.found },
              { count: partialCount, ...STATUS_MAP.partial },
              { count: missingCount, ...STATUS_MAP.missing },
            ].map((s, i) => (
              <div key={i} style={{ ...cardStyle, textAlign: 'center', border: `2px solid ${s.color}22` }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 14, color: '#888' }}>{s.icon} {s.label}</div>
              </div>
            ))}
          </div>

          {/* Detail Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((r, idx) => {
              const status = STATUS_MAP[r.status] || STATUS_MAP.missing;
              return (
                <div key={idx} style={{
                  ...cardStyle, padding: 16,
                  borderLeft: `4px solid ${status.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{status.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{checklist[idx]?.text || r.item}</span>
                    <span style={{
                      fontSize: 13, padding: '3px 10px', borderRadius: 6,
                      background: `${status.color}22`, color: status.color, fontWeight: 600,
                    }}>{status.label}</span>
                  </div>
                  {r.evidence && (
                    <div style={{ margin: '8px 0 0 30px', padding: '8px 12px', background: '#f8f9fa', borderRadius: 8, borderLeft: `3px solid ${status.color}44`, fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 1.6 }}>
                      &ldquo;{r.evidence}&rdquo;
                    </div>
                  )}
                  {r.detail && (
                    <p style={{ margin: '6px 0 0 30px', fontSize: 15, lineHeight: 1.6, color: '#666' }}>
                      {r.detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

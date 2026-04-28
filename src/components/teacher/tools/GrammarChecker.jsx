'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const SEVERITY_MAP = {
  error: { color: CI.magenta, bg: 'rgba(230,0,126,0.08)', label: '\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14', icon: '\u274c' },
  warning: { color: CI.gold, bg: 'rgba(255,193,7,0.08)', label: '\u0e04\u0e27\u0e23\u0e41\u0e01\u0e49\u0e44\u0e02', icon: '\u26a0\ufe0f' },
  suggestion: { color: CI.cyan, bg: 'rgba(0,180,230,0.08)', label: '\u0e41\u0e19\u0e30\u0e19\u0e33', icon: '\ud83d\udca1' },
};

const TYPE_LABELS = {
  spelling: '\u0e2a\u0e30\u0e01\u0e14',
  grammar: '\u0e44\u0e27\u0e22\u0e32\u0e01\u0e23\u0e13\u0e4c',
  punctuation: '\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e2b\u0e21\u0e32\u0e22',
  style: '\u0e2a\u0e33\u0e19\u0e27\u0e19',
  word_choice: '\u0e01\u0e32\u0e23\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e43\u0e0a\u0e49\u0e04\u0e33',
  tone: '\u0e42\u0e17\u0e19\u0e40\u0e2a\u0e35\u0e22\u0e07',
};

export default function GrammarChecker() {
  const [text, setText] = useState('');
  const [issues, setIssues] = useState([]);
  const [correctedText, setCorrectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState('');
  const [ignoredIds, setIgnoredIds] = useState(new Set());

  const checkGrammar = async () => {
    if (!text.trim()) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e43\u0e2a\u0e48\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21');
    setLoading(true);
    setIssues([]);
    setCorrectedText('');
    setIgnoredIds(new Set());
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'grammar_checker', payload: { text } })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const enriched = (data.issues || []).map((issue, i) => ({ ...issue, _id: i }));
      setIssues(enriched);
      setCorrectedText(data.correctedText || text);
      setDetectedLang(data.language || 'auto');
      if (enriched.length === 0) {
        toast.success('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14! \u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07\u0e14\u0e35\u0e41\u0e25\u0e49\u0e27');
      } else {
        toast.success(`\u0e1e\u0e1a ${enriched.length} \u0e08\u0e38\u0e14\u0e17\u0e35\u0e48\u0e04\u0e27\u0e23\u0e41\u0e01\u0e49\u0e44\u0e02`);
      }
    } catch (err) {
      toast.error('\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeIssues = issues.filter(i => !ignoredIds.has(i._id));

  const applyFix = (issue) => {
    if (!issue.original || !issue.suggestion) return;
    setCorrectedText(prev => prev.replace(issue.original, issue.suggestion));
    setIssues(prev => prev.filter(i => i._id !== issue._id));
    toast.success('\u0e41\u0e01\u0e49\u0e44\u0e02\u0e41\u0e25\u0e49\u0e27');
  };

  const ignoreIssue = (issue) => {
    setIgnoredIds(prev => new Set([...prev, issue._id]));
  };

  const applyAll = () => {
    let updated = correctedText;
    activeIssues.forEach(issue => {
      if (issue.original && issue.suggestion) {
        updated = updated.replace(issue.original, issue.suggestion);
      }
    });
    setCorrectedText(updated);
    setIssues([]);
    toast.success('\u0e41\u0e01\u0e49\u0e44\u0e02\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14\u0e41\u0e25\u0e49\u0e27');
  };

  const copyCorrected = () => {
    navigator.clipboard.writeText(correctedText);
    toast.success('\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e17\u0e35\u0e48\u0e41\u0e01\u0e49\u0e44\u0e02\u0e41\u0e25\u0e49\u0e27');
  };

  // Error type breakdown
  const typeBreakdown = {};
  activeIssues.forEach(issue => {
    const t = issue.type || 'grammar';
    typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
  });

  const renderHighlightedText = () => {
    if (activeIssues.length === 0) return correctedText;
    let result = [];
    let remaining = correctedText;
    const sorted = [...activeIssues].filter(i => i.original).sort((a, b) => {
      return correctedText.indexOf(a.original) - correctedText.indexOf(b.original);
    });
    sorted.forEach((issue, idx) => {
      const pos = remaining.indexOf(issue.original);
      if (pos === -1) return;
      if (pos > 0) result.push(<span key={`t-${idx}`}>{remaining.substring(0, pos)}</span>);
      const severity = SEVERITY_MAP[issue.severity] || SEVERITY_MAP.warning;
      result.push(
        <span key={`h-${idx}`} style={{
          textDecoration: 'underline wavy', textDecorationColor: severity.color,
          background: severity.bg, padding: '1px 2px', borderRadius: 3, cursor: 'help',
        }} title={`${issue.original} \u2192 ${issue.suggestion}\n${issue.explanation || ''}`}>
          {issue.original}
        </span>
      );
      remaining = remaining.substring(pos + issue.original.length);
    });
    if (remaining) result.push(<span key="rest">{remaining}</span>);
    return result;
  };

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  };
  const inputStyle = {
    width: '100%', padding: '14px 16px', background: '#f8f9fa',
    border: '1px solid #e0e0e0', borderRadius: 12, color: CI.dark,
    fontSize: 16, fontFamily: FONT, outline: 'none', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: FONT, color: CI.dark, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>{'\u270f\ufe0f'}</span>
        <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {'\u0e15\u0e23\u0e27\u0e08\u0e44\u0e27\u0e22\u0e32\u0e01\u0e23\u0e13\u0e4c\u0e44\u0e17\u0e22-\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29'}
        </h2>
        {detectedLang && (
          <span style={{ fontSize: 13, padding: '4px 10px', background: '#f0f0f0', borderRadius: 6, color: '#888' }}>
            {'\u0e20\u0e32\u0e29\u0e32'}: {detectedLang === 'th' ? '\ud83c\uddf9\ud83c\udded \u0e44\u0e17\u0e22' : detectedLang === 'en' ? '\ud83c\uddec\ud83c\udde7 English' : '\ud83c\udf10 Auto'}
          </span>
        )}
      </div>

      {/* Input */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <label style={{ fontSize: 15, color: '#888', display: 'block', marginBottom: 8 }}>{'\u0e43\u0e2a\u0e48\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e15\u0e23\u0e27\u0e08 (\u0e44\u0e17\u0e22/\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29)'}</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e2b\u0e23\u0e37\u0e2d\u0e27\u0e32\u0e07\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e17\u0e35\u0e48\u0e19\u0e35\u0e48..."
          rows={8}
          style={inputStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 13, color: '#aaa' }}>{text.length} \u0e15\u0e31\u0e27\u0e2d\u0e31\u0e01\u0e29\u0e23</span>
          <button
            onClick={checkGrammar}
            disabled={loading}
            style={{
              padding: '12px 28px',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
              color: '#fff', border: 'none', borderRadius: 12, fontFamily: FONT, fontSize: 16,
              cursor: loading ? 'wait' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '\u23f3 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e15\u0e23\u0e27\u0e08...' : '\ud83d\udd0d \u0e15\u0e23\u0e27\u0e08\u0e44\u0e27\u0e22\u0e32\u0e01\u0e23\u0e13\u0e4c'}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {correctedText && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(typeBreakdown).length + 1}, 1fr)`, gap: 12, marginBottom: 20 }}>
          <div style={{ ...cardStyle, textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: activeIssues.length === 0 ? '#4caf50' : CI.magenta }}>{activeIssues.length}</div>
            <div style={{ fontSize: 13, color: '#999' }}>{'\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14'}</div>
          </div>
          {Object.entries(typeBreakdown).map(([type, count]) => (
            <div key={type} style={{ ...cardStyle, textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: CI.purple }}>{count}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{TYPE_LABELS[type] || type}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {correctedText && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Highlighted Text */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, margin: 0, color: CI.cyan }}>{'\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e17\u0e35\u0e48\u0e15\u0e23\u0e27\u0e08\u0e41\u0e25\u0e49\u0e27'}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {activeIssues.length > 0 && (
                  <button onClick={applyAll} style={{
                    padding: '6px 14px', background: `linear-gradient(135deg, ${CI.purple}, ${CI.magenta})`,
                    border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT, fontWeight: 600,
                  }}>{'\ud83d\udd27'} \u0e41\u0e01\u0e49\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14</button>
                )}
                <button onClick={copyCorrected} style={{
                  padding: '6px 14px', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                  border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT,
                }}>{'\ud83d\udccb'} \u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01</button>
              </div>
            </div>
            <div style={{
              fontSize: 16, lineHeight: 2, whiteSpace: 'pre-wrap', color: CI.dark,
              padding: 16, background: '#f8f9fa', borderRadius: 10,
            }}>
              {renderHighlightedText()}
            </div>
          </div>

          {/* Issues Panel */}
          <div style={{ ...cardStyle, maxHeight: 600, overflowY: 'auto' }}>
            <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.gold }}>
              {'\ud83d\udd0d'} \u0e1b\u0e31\u0e0d\u0e2b\u0e32\u0e17\u0e35\u0e48\u0e1e\u0e1a ({activeIssues.length})
            </h3>
            {activeIssues.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#4caf50', fontSize: 16 }}>
                {'\u2705'} \u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeIssues.map((issue) => {
                const severity = SEVERITY_MAP[issue.severity] || SEVERITY_MAP.warning;
                return (
                  <div key={issue._id} style={{
                    background: severity.bg, borderRadius: 12, padding: 14,
                    borderLeft: `3px solid ${severity.color}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: severity.color, fontWeight: 600 }}>
                        {severity.icon} {severity.label} {issue.type ? `\u00b7 ${TYPE_LABELS[issue.type] || issue.type}` : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, marginBottom: 8 }}>
                      <span style={{ textDecoration: 'line-through', color: CI.magenta }}>{issue.original}</span>
                      <span style={{ margin: '0 8px', color: '#ccc' }}>{'\u2192'}</span>
                      <span style={{ color: '#4caf50', fontWeight: 600 }}>{issue.suggestion}</span>
                    </div>
                    {issue.explanation && (
                      <p style={{ margin: '0 0 8px 0', fontSize: 14, lineHeight: 1.5, color: '#888' }}>
                        {issue.explanation}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => applyFix(issue)} style={{
                        padding: '5px 12px', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                        border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT,
                      }}>{'\ud83d\udd27'} \u0e41\u0e01\u0e49\u0e44\u0e02</button>
                      <button onClick={() => ignoreIssue(issue)} style={{
                        padding: '5px 12px', background: '#f0f0f0',
                        border: '1px solid #ddd', borderRadius: 6, color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: FONT,
                      }}>{'\u0e02\u0e49\u0e32\u0e21'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

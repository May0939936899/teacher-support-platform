'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', purple: '#7c4dff', gold: '#ffc107' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', sans-serif";
const LS_KEY = 'random_group_names';

const GROUP_COLORS = [
  { bg: '#e0f2fe', border: '#00b4e6', accent: '#00b4e6', text: '#0369a1' },
  { bg: '#fce7f3', border: '#e6007e', accent: '#e6007e', text: '#9d174d' },
  { bg: '#ede9fe', border: '#7c4dff', accent: '#7c4dff', text: '#5b21b6' },
  { bg: '#fef9c3', border: '#ffc107', accent: '#d97706', text: '#92400e' },
  { bg: '#d1fae5', border: '#10b981', accent: '#10b981', text: '#065f46' },
  { bg: '#ffedd5', border: '#f97316', accent: '#f97316', text: '#9a3412' },
  { bg: '#dbeafe', border: '#3b82f6', accent: '#3b82f6', text: '#1e40af' },
  { bg: '#fce7f3', border: '#ec4899', accent: '#ec4899', text: '#831843' },
];

const DEFAULT_NAMES = `สมชาย ใจดี
สมหญิง รักเรียน
วิชัย เก่งมาก
นภา สดใส
ธนกร มุ่งมั่น
พิมพ์ใจ ขยัน
อนุชา ตั้งใจ
กัลยา สวยงาม
ณัฐพล ฉลาด
มณีรัตน์ อ่อนหวาน
ประสิทธิ์ แข็งแกร่ง
สุนิสา น่ารัก`;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitIntoGroups(names, numGroups) {
  const shuffled = shuffleArray(names);
  const groups = Array.from({ length: numGroups }, () => []);
  shuffled.forEach((name, i) => {
    groups[i % numGroups].push(name);
  });
  return groups;
}

// Loading dots component
function LoadingDots({ color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '14px', height: '14px', borderRadius: '50%',
            background: color || CI.cyan,
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Individual group card with delayed fade+slide animation
function GroupCard({ group, groupIndex, color, visibleAt, totalVisible }) {
  const isVisible = groupIndex < totalVisible;

  return (
    <div
      style={{
        background: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: '16px',
        padding: '20px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        transition: `opacity 0.4s ease ${visibleAt * 0.12}s, transform 0.4s ease ${visibleAt * 0.12}s`,
        boxShadow: isVisible ? `0 4px 16px ${color.border}30` : 'none',
      }}
    >
      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: color.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: '16px', fontFamily: FONT,
          boxShadow: `0 3px 10px ${color.accent}50`,
          flexShrink: 0,
        }}>
          {groupIndex + 1}
        </div>
        <div>
          <div style={{ fontWeight: 800, color: color.text, fontSize: '16px', fontFamily: FONT }}>
            กลุ่มที่ {groupIndex + 1}
          </div>
          <div style={{ fontSize: '12px', color: color.accent, fontFamily: FONT }}>
            {group.length} คน
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {group.map((name, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 12px',
              background: '#fff',
              borderRadius: '8px',
              border: `1px solid ${color.border}40`,
              fontSize: '14px', fontFamily: FONT, color: '#1a1a3e',
            }}
          >
            <span style={{ color: color.accent, fontWeight: 700, fontSize: '12px', minWidth: '20px' }}>
              {i + 1}.
            </span>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RandomGroup() {
  const [rawNames, setRawNames] = useState(DEFAULT_NAMES);
  const [numGroups, setNumGroups] = useState(2);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const visibleTimerRef = useRef(null);
  const loadingTimerRef = useRef(null);

  // Load saved names
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setRawNames(saved);
    } catch {}
  }, []);

  // Save names to localStorage
  const saveNames = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, rawNames);
    } catch {}
  }, [rawNames]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(loadingTimerRef.current);
      clearTimeout(visibleTimerRef.current);
    };
  }, []);

  const parseNames = useCallback(() => {
    return rawNames
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }, [rawNames]);

  const doShuffle = useCallback(() => {
    const names = parseNames();
    if (names.length < 2) {
      toast.error('กรุณาใส่ชื่อนักเรียนอย่างน้อย 2 คน');
      return;
    }
    if (names.length < numGroups) {
      toast.error(`จำนวนนักเรียน (${names.length}) น้อยกว่าจำนวนกลุ่ม (${numGroups})`);
      return;
    }

    saveNames();
    setLoading(true);
    setHasResult(false);
    setGroups([]);
    setVisibleCount(0);

    // 1.5s loading animation, then reveal
    loadingTimerRef.current = setTimeout(() => {
      const result = splitIntoGroups(names, numGroups);
      setGroups(result);
      setLoading(false);
      setHasResult(true);

      // Reveal groups one-by-one with staggered timing
      let count = 0;
      function revealNext() {
        count++;
        setVisibleCount(count);
        if (count < result.length) {
          visibleTimerRef.current = setTimeout(revealNext, 160);
        }
      }
      visibleTimerRef.current = setTimeout(revealNext, 80);
      toast.success(`สุ่มกลุ่มสำเร็จ! ${result.length} กลุ่ม`);
    }, 1500);
  }, [parseNames, numGroups, saveNames]);

  const copyAll = useCallback(() => {
    if (groups.length === 0) { toast.error('ยังไม่มีผลการสุ่ม'); return; }
    const text = groups.map((g, i) => `กลุ่มที่ ${i + 1}:\n${g.map((n, j) => `  ${j + 1}. ${n}`).join('\n')}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.success('คัดลอกผลการสุ่มแล้ว!');
    }).catch(() => toast.error('คัดลอกไม่สำเร็จ'));
  }, [groups]);

  const nameCount = parseNames().length;

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', padding: '24px 16px' }}>
      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1a1a3e', margin: 0, fontFamily: FONT }}>
          🎲 สุ่มกลุ่ม
        </h1>
        <p style={{ color: '#64748b', margin: '6px 0 0', fontFamily: FONT }}>แบ่งนักเรียนเป็นกลุ่มแบบสุ่มอย่างยุติธรรม</p>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Input panel */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
            {/* Names textarea */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, color: '#1a1a3e', marginBottom: '8px', fontSize: '15px', fontFamily: FONT }}>
                รายชื่อนักเรียน
                <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>
                  ({nameCount} คน)
                </span>
              </label>
              <textarea
                value={rawNames}
                onChange={e => setRawNames(e.target.value)}
                placeholder={'พิมพ์ชื่อนักเรียน (หนึ่งบรรทัดต่อหนึ่งคน)\nเช่น:\nสมชาย ใจดี\nสมหญิง รักเรียน\nวิชัย เก่งมาก'}
                style={{
                  width: '100%', height: '180px',
                  border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  padding: '12px', fontSize: '14px', fontFamily: FONT,
                  color: '#1a1a3e', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', lineHeight: 1.7,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = CI.cyan; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            </div>

            {/* Settings panel */}
            <div style={{ minWidth: '180px' }}>
              <label style={{ display: 'block', fontWeight: 700, color: '#1a1a3e', marginBottom: '8px', fontSize: '15px', fontFamily: FONT }}>
                จำนวนกลุ่ม
              </label>
              {/* Number picker */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumGroups(n)}
                    style={{
                      width: '44px', height: '44px',
                      border: `2px solid ${numGroups === n ? CI.purple : '#e2e8f0'}`,
                      borderRadius: '10px',
                      background: numGroups === n ? CI.purple : '#f8fafc',
                      color: numGroups === n ? '#fff' : '#475569',
                      fontWeight: 700, fontSize: '16px',
                      cursor: 'pointer', fontFamily: FONT,
                      transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Group size estimate */}
              {nameCount > 0 && (
                <div style={{
                  padding: '12px', background: '#f0fdf4', borderRadius: '10px',
                  border: '1px solid #bbf7d0', fontSize: '13px', fontFamily: FONT, color: '#166534',
                  lineHeight: 1.6,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>ประมาณขนาดกลุ่ม</div>
                  <div>~{Math.ceil(nameCount / numGroups)} – {Math.floor(nameCount / numGroups)} คน/กลุ่ม</div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={doShuffle}
              disabled={loading}
              style={{
                flex: '1', minWidth: '160px', padding: '14px 24px',
                background: loading
                  ? '#e2e8f0'
                  : `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
                color: loading ? '#94a3b8' : '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '17px', fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                boxShadow: loading ? 'none' : `0 6px 20px rgba(230,0,126,0.3)`,
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⏳ กำลังสุ่ม...' : '🎲 สุ่มกลุ่ม!'}
            </button>

            {hasResult && (
              <>
                <button
                  onClick={doShuffle}
                  disabled={loading}
                  style={{
                    padding: '14px 20px',
                    background: '#f1f5f9', color: '#475569',
                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                    fontSize: '15px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  🔀 สุ่มใหม่
                </button>
                <button
                  onClick={copyAll}
                  style={{
                    padding: '14px 20px',
                    background: '#f0fdf4', color: '#166534',
                    border: '1.5px solid #bbf7d0', borderRadius: '12px',
                    fontSize: '15px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  📋 คัดลอกผล
                </button>
              </>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
            padding: '48px 24px', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <LoadingDots color={CI.magenta} />
            <div style={{ marginTop: '20px', fontSize: '18px', fontWeight: 700, color: '#1a1a3e', fontFamily: FONT }}>
              กำลังสุ่มกลุ่ม...
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#94a3b8', fontFamily: FONT }}>
              กำลังผสมรายชื่อ {nameCount} คน เป็น {numGroups} กลุ่ม
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && hasResult && groups.length > 0 && (
          <>
            {/* Summary bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a3e', fontFamily: FONT }}>
                ผลการสุ่ม: {groups.length} กลุ่ม — {nameCount} คน
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {groups.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: GROUP_COLORS[i % GROUP_COLORS.length].accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '12px', fontWeight: 900, fontFamily: FONT,
                      boxShadow: `0 2px 6px ${GROUP_COLORS[i % GROUP_COLORS.length].accent}50`,
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Group cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}>
              {groups.map((group, i) => (
                <GroupCard
                  key={i}
                  group={group}
                  groupIndex={i}
                  color={GROUP_COLORS[i % GROUP_COLORS.length]}
                  visibleAt={i}
                  totalVisible={visibleCount}
                />
              ))}
            </div>

            {/* Copy button at bottom (mobile convenience) */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={copyAll}
                style={{
                  padding: '12px 32px',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: FONT,
                  boxShadow: `0 4px 16px rgba(0,180,230,0.3)`,
                }}
              >
                📋 คัดลอกผลทั้งหมด
              </button>
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !hasResult && (
          <div style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
            padding: '48px 24px', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎲</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a3e', marginBottom: '8px', fontFamily: FONT }}>
              พร้อมสุ่มกลุ่ม!
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8', fontFamily: FONT }}>
              ใส่รายชื่อนักเรียน เลือกจำนวนกลุ่ม แล้วกด "สุ่มกลุ่ม!"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

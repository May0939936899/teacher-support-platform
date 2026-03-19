'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { t, translations } from '@/lib/teacher/i18n';

// Lazy load tools
const SmartQuiz = dynamic(() => import('@/components/teacher/tools/SmartQuiz'), { ssr: false });
const AILetterWriter = dynamic(() => import('@/components/teacher/tools/AILetterWriter'), { ssr: false });
const PlagiarismChecker = dynamic(() => import('@/components/teacher/tools/PlagiarismChecker'), { ssr: false });
const AIContentDetector = dynamic(() => import('@/components/teacher/tools/AIContentDetector'), { ssr: false });
const QRGenerator = dynamic(() => import('@/components/teacher/tools/QRGenerator'), { ssr: false });
const URLShortener = dynamic(() => import('@/components/teacher/tools/URLShortener'), { ssr: false });
const AttendanceTracker = dynamic(() => import('@/components/teacher/tools/AttendanceTracker'), { ssr: false });
const AILessonPlanner = dynamic(() => import('@/components/teacher/tools/AILessonPlanner'), { ssr: false });
const LiveQuizGame = dynamic(() => import('@/components/teacher/tools/LiveQuizGame'), { ssr: false });
const CertificateGenerator = dynamic(() => import('@/components/teacher/tools/CertificateGenerator'), { ssr: false });
const MeetingNotesAI = dynamic(() => import('@/components/teacher/tools/MeetingNotesAI'), { ssr: false });
const ComingSoon = dynamic(() => import('@/components/teacher/tools/ComingSoon'), { ssr: false });
const TeacherDashboard = dynamic(() => import('@/components/teacher/TeacherDashboard'), { ssr: false });

// Build menu from i18n keys
function buildMenu(lang) {
  return [
    {
      side: 'teaching', labelKey: 'side_teaching', color: 'teal', icon: '🎓',
      groups: [
        { labelKey: 'group_assess', items: [
          { id: 'smart-quiz', labelKey: 'tool_smart_quiz', icon: '📝', phase: 1 },
          { id: 'live-quiz', labelKey: 'tool_live_quiz', icon: '🎮', phase: 2 },
          { id: 'exit-ticket', labelKey: 'tool_exit_ticket', icon: '🎫', phase: 3 },
          { id: 'video-quiz', labelKey: 'tool_video_quiz', icon: '🎬', phase: 3 },
        ]},
        { labelKey: 'group_plan', items: [
          { id: 'lesson-planner', labelKey: 'tool_lesson_planner', icon: '📋', phase: 2 },
          { id: 'interactive-activity', labelKey: 'tool_interactive', icon: '🤝', phase: 3 },
          { id: 'content-differentiator', labelKey: 'tool_differentiator', icon: '📊', phase: 3 },
        ]},
        { labelKey: 'group_grade', items: [
          { id: 'auto-grader', labelKey: 'tool_auto_grader', icon: '✅', phase: 3 },
          { id: 'rubric-generator', labelKey: 'tool_rubric', icon: '📏', phase: 3 },
          { id: 'flashcard-builder', labelKey: 'tool_flashcard', icon: '🃏', phase: 3 },
        ]},
      ],
    },
    {
      side: 'documents', labelKey: 'side_documents', color: 'blue', icon: '📄',
      groups: [
        { labelKey: 'group_create', items: [
          { id: 'letter-writer', labelKey: 'tool_letter', icon: '✉️', phase: 1 },
          { id: 'slide-maker', labelKey: 'tool_slide', icon: '🖥️', phase: 3 },
          { id: 'certificate-generator', labelKey: 'tool_certificate', icon: '🏆', phase: 2 },
          { id: 'form-builder', labelKey: 'tool_form', icon: '📋', phase: 3 },
          { id: 'ai-translator', labelKey: 'tool_translator', icon: '🌐', phase: 3 },
        ]},
        { labelKey: 'group_check', items: [
          { id: 'plagiarism-checker', labelKey: 'tool_plagiarism', icon: '🔍', phase: 1 },
          { id: 'ai-detector', labelKey: 'tool_ai_detector', icon: '🤖', phase: 1 },
          { id: 'writing-quality', labelKey: 'tool_writing', icon: '✍️', phase: 3 },
          { id: 'completeness-checker', labelKey: 'tool_completeness', icon: '☑️', phase: 3 },
          { id: 'grammar-checker', labelKey: 'tool_grammar', icon: '📝', phase: 3 },
        ]},
        { labelKey: 'group_manage', items: [
          { id: 'qr-generator', labelKey: 'tool_qr', icon: '🔲', phase: 1 },
          { id: 'url-shortener', labelKey: 'tool_url', icon: '🔗', phase: 1 },
          { id: 'image-to-content', labelKey: 'tool_image_content', icon: '🖼️', phase: 3 },
          { id: 'pdf-toolkit', labelKey: 'tool_pdf', icon: '📦', phase: 3 },
          { id: 'template-library', labelKey: 'tool_template', icon: '📚', phase: 3 },
        ]},
      ],
    },
    {
      side: 'admin', labelKey: 'side_admin', color: 'coral', icon: '⚙️',
      groups: [
        { labelKey: 'group_track', items: [
          { id: 'attendance-tracker', labelKey: 'tool_attendance', icon: '📅', phase: 1 },
          { id: 'student-progress', labelKey: 'tool_progress', icon: '📈', phase: 3 },
          { id: 'ta-coordinator', labelKey: 'tool_ta', icon: '👥', phase: 3 },
          { id: 'stakeholder-portal', labelKey: 'tool_stakeholder', icon: '🏛️', phase: 3 },
        ]},
        { labelKey: 'group_project', items: [
          { id: 'schedule-manager', labelKey: 'tool_schedule', icon: '🗓️', phase: 3 },
          { id: 'event-coordinator', labelKey: 'tool_event', icon: '🎪', phase: 3 },
          { id: 'budget-tracker', labelKey: 'tool_budget', icon: '💰', phase: 3 },
          { id: 'meeting-notes', labelKey: 'tool_meeting', icon: '🗒️', phase: 2 },
          { id: 'kpi-dashboard', labelKey: 'tool_kpi', icon: '📊', phase: 3 },
          { id: 'line-broadcast', labelKey: 'tool_broadcast', icon: '📢', phase: 3 },
        ]},
      ],
    },
  ];
}

const TOOL_MAP = {
  'smart-quiz': SmartQuiz,
  'letter-writer': AILetterWriter,
  'plagiarism-checker': PlagiarismChecker,
  'ai-detector': AIContentDetector,
  'qr-generator': QRGenerator,
  'url-shortener': URLShortener,
  'attendance-tracker': AttendanceTracker,
  'lesson-planner': AILessonPlanner,
  'live-quiz': LiveQuizGame,
  'certificate-generator': CertificateGenerator,
  'meeting-notes': MeetingNotesAI,
};

const COLOR_MAP = {
  teal: { bg: '#0d9488', light: '#f0fdfa', border: '#99f6e4', text: '#0f766e' },
  blue: { bg: '#2563eb', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  coral: { bg: '#ef4444', light: '#fff5f5', border: '#fecaca', text: '#dc2626' },
};

export default function TeacherPage() {
  const { user, loading, signOut, profile } = useAuth();
  const router = useRouter();
  const [activeTool, setActiveTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSides, setExpandedSides] = useState({ teaching: true, documents: true, admin: true });
  const [lang, setLang] = useState('th');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const MENU_ITEMS = buildMenu(lang);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/teacher/login');
  }, [user, loading, router]);

  // QR/attendance param handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('quiz')) setActiveTool('smart-quiz');
      else if (params.get('att')) setActiveTool('attendance-tracker');
    }
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdfa' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
        <div style={{ color: '#0d9488', fontWeight: 700 }}>กำลังโหลด Teacher Support Platform...</div>
      </div>
    </div>
  );

  if (!user) return null;

  const ActiveComponent = activeTool ? (TOOL_MAP[activeTool] || ComingSoon) : null;

  const toggleSide = (side) => setExpandedSides(prev => ({ ...prev, [side]: !prev[side] }));

  const getActiveItem = () => {
    for (const s of MENU_ITEMS) {
      for (const g of s.groups) {
        const item = g.items.find(i => i.id === activeTool);
        if (item) return { item, side: s };
      }
    }
    return null;
  };
  const active = getActiveItem();

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Noto Sans Thai', 'Inter', sans-serif", background: '#f8fafc', overflow: 'hidden' }}>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#fff', fontSize: '14px', borderRadius: '10px' } }} />

      {/* ===== SIDEBAR ===== */}
      <aside style={{
        width: sidebarOpen ? '256px' : '60px', minWidth: sidebarOpen ? '256px' : '60px',
        background: '#0f172a', height: '100vh', overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        display: 'flex', flexDirection: 'column', zIndex: 10, flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '60px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #0d9488, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
            🎓
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '13px', lineHeight: 1.2 }}>Teacher Support</div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>Platform</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px', borderRadius: '6px', flexShrink: 0, fontSize: '12px' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Home button */}
        <div style={{ padding: '8px' }}>
          <button onClick={() => setActiveTool(null)} style={{
            width: '100%', padding: sidebarOpen ? '9px 12px' : '9px', borderRadius: '8px',
            background: !activeTool ? '#1e293b' : 'none', border: 'none',
            color: !activeTool ? '#f1f5f9' : '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
            textAlign: 'left', transition: 'background 0.15s', fontFamily: 'inherit',
          }}>
            <span style={{ fontSize: '15px', flexShrink: 0, ...(sidebarOpen ? {} : { margin: 'auto' }) }}>🏠</span>
            {sidebarOpen && <span>{t(lang, 'home')}</span>}
          </button>
        </div>

        {/* Sections */}
        {MENU_ITEMS.map(side => {
          const c = COLOR_MAP[side.color];
          return (
            <div key={side.side}>
              <button onClick={() => toggleSide(side.side)} style={{
                width: '100%', padding: sidebarOpen ? '6px 12px' : '6px', border: 'none',
                background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '8px', color: '#475569', fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', fontFamily: 'inherit',
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.bg, flexShrink: 0, ...(sidebarOpen ? {} : { margin: 'auto' }) }} />
                {sidebarOpen && (<><span style={{ flex: 1 }}>{t(lang, side.labelKey)}</span><span style={{ fontSize: '10px' }}>{expandedSides[side.side] ? '▾' : '▸'}</span></>)}
              </button>

              {expandedSides[side.side] && side.groups.map(group => (
                <div key={group.labelKey}>
                  {sidebarOpen && (
                    <div style={{ padding: '3px 14px', color: '#334155', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t(lang, group.labelKey)}
                    </div>
                  )}
                  {group.items.map(item => (
                    <div key={item.id} style={{ padding: '1px 6px' }}>
                      <button
                        onClick={() => setActiveTool(item.id)}
                        title={!sidebarOpen ? t(lang, item.labelKey) : ''}
                        style={{
                          width: '100%', padding: sidebarOpen ? '7px 10px' : '7px', borderRadius: '7px',
                          background: activeTool === item.id ? c.bg : 'none', border: 'none',
                          color: activeTool === item.id ? '#fff' : '#64748b',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                          fontSize: '12px', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: '14px', flexShrink: 0, ...(sidebarOpen ? {} : { margin: 'auto' }) }}>{item.icon}</span>
                        {sidebarOpen && (
                          <>
                            <span style={{ flex: 1, lineHeight: 1.3 }}>{t(lang, item.labelKey)}</span>
                            {item.phase === 1 && <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: activeTool === item.id ? 'rgba(255,255,255,0.25)' : '#1e293b', color: activeTool === item.id ? '#fff' : '#22c55e' }}>✓</span>}
                            {item.phase > 1 && <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: activeTool === item.id ? 'rgba(255,255,255,0.2)' : '#1e293b', color: '#475569' }}>P{item.phase}</span>}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}

        {/* Bottom: lang + user */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', padding: '10px' }}>
          {/* Language toggle */}
          {sidebarOpen && (
            <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '2px', marginBottom: '8px' }}>
              {['th', 'en'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  flex: 1, padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: lang === l ? '#334155' : 'none', color: lang === l ? '#f1f5f9' : '#475569',
                  fontSize: '11px', fontWeight: lang === l ? 700 : 400, fontFamily: 'inherit',
                }}>
                  {l === 'th' ? '🇹🇭 ไทย' : '🇬🇧 EN'}
                </button>
              ))}
            </div>
          )}

          {/* User */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
              borderRadius: '8px', color: '#64748b', fontFamily: 'inherit',
            }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} alt="avatar" />
              ) : (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>👤</div>
              )}
              {sidebarOpen && (
                <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้งาน'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>
              )}
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', padding: '4px', zIndex: 50 }}>
                <button onClick={() => { signOut(); router.push('/teacher/login'); }} style={{
                  width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#f87171',
                  cursor: 'pointer', borderRadius: '8px', fontSize: '13px', textAlign: 'left', fontFamily: 'inherit',
                }}>
                  🚪 {t(lang, 'logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header bar */}
        {activeTool && active && (
          <div style={{
            padding: '10px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: COLOR_MAP[active.side.color].light,
              border: `1px solid ${COLOR_MAP[active.side.color].border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>
              {active.item.icon}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{t(lang, active.item.labelKey)}</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{t(lang, active.side.labelKey)}</p>
            </div>
            {active.item.phase > 1 && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                Phase {active.item.phase}
              </span>
            )}
            {active.item.phase === 1 && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>
                ✓ {t(lang, 'phase_ready')}
              </span>
            )}
            <button
              onClick={() => setActiveTool(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px', padding: '4px' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Tool content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {!activeTool ? (
            <TeacherDashboard onSelectTool={setActiveTool} menuItems={MENU_ITEMS} colorMap={COLOR_MAP} lang={lang} />
          ) : ActiveComponent ? (
            <ActiveComponent onSelectTool={setActiveTool} lang={lang} />
          ) : (
            <ComingSoon toolId={activeTool} />
          )}
        </div>
      </main>
    </div>
  );
}

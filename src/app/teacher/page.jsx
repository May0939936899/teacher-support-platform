'use client';
import React, { useState, useEffect } from 'react';
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
// Phase 3 — Teaching
const ExitTicket = dynamic(() => import('@/components/teacher/tools/ExitTicket'), { ssr: false });
const VideoQuiz = dynamic(() => import('@/components/teacher/tools/VideoQuiz'), { ssr: false });
const InteractiveActivity = dynamic(() => import('@/components/teacher/tools/InteractiveActivity'), { ssr: false });
const ContentDifferentiator = dynamic(() => import('@/components/teacher/tools/ContentDifferentiator'), { ssr: false });
const AutoGrader = dynamic(() => import('@/components/teacher/tools/AutoGrader'), { ssr: false });
const RubricGenerator = dynamic(() => import('@/components/teacher/tools/RubricGenerator'), { ssr: false });
const FlashcardBuilder = dynamic(() => import('@/components/teacher/tools/FlashcardBuilder'), { ssr: false });
// Phase 3 — Documents
const SlideMaker = dynamic(() => import('@/components/teacher/tools/SlideMaker'), { ssr: false });
const FormBuilder = dynamic(() => import('@/components/teacher/tools/FormBuilder'), { ssr: false });
const AITranslator = dynamic(() => import('@/components/teacher/tools/AITranslator'), { ssr: false });
const WritingQuality = dynamic(() => import('@/components/teacher/tools/WritingQuality'), { ssr: false });
const CompletenessChecker = dynamic(() => import('@/components/teacher/tools/CompletenessChecker'), { ssr: false });
const GrammarChecker = dynamic(() => import('@/components/teacher/tools/GrammarChecker'), { ssr: false });
const ImageToContent = dynamic(() => import('@/components/teacher/tools/ImageToContent'), { ssr: false });
const PDFToolkit = dynamic(() => import('@/components/teacher/tools/PDFToolkit'), { ssr: false });
const TemplateLibrary = dynamic(() => import('@/components/teacher/tools/TemplateLibrary'), { ssr: false });
// Phase 3 — Admin
const StudentProgress = dynamic(() => import('@/components/teacher/tools/StudentProgress'), { ssr: false });
const TACoordinator = dynamic(() => import('@/components/teacher/tools/TACoordinator'), { ssr: false });
const StakeholderPortal = dynamic(() => import('@/components/teacher/tools/StakeholderPortal'), { ssr: false });
const ScheduleManager = dynamic(() => import('@/components/teacher/tools/ScheduleManager'), { ssr: false });
const EventCoordinator = dynamic(() => import('@/components/teacher/tools/EventCoordinator'), { ssr: false });
const BudgetTracker = dynamic(() => import('@/components/teacher/tools/BudgetTracker'), { ssr: false });
const KPIDashboard = dynamic(() => import('@/components/teacher/tools/KPIDashboard'), { ssr: false });
const LINEBroadcast = dynamic(() => import('@/components/teacher/tools/LINEBroadcast'), { ssr: false });
const EbookBuilder = dynamic(() => import('@/components/teacher/tools/EbookBuilder'), { ssr: false });
// Marketing
const MarketingContentWriter = dynamic(() => import('@/components/teacher/tools/MarketingContentWriter'), { ssr: false });
const AutoPosterMaker = dynamic(() => import('@/components/teacher/tools/AutoPosterMaker'), { ssr: false });
// Utility
const ComingSoon = dynamic(() => import('@/components/teacher/tools/ComingSoon'), { ssr: false });
const TeacherDashboard = dynamic(() => import('@/components/teacher/TeacherDashboard'), { ssr: false });

// CI Colors
const CI = {
  cyan: '#00b4e6',
  magenta: '#e6007e',
  dark: '#0b0b24',
  gold: '#ffc107',
  purple: '#7c4dff',
};

// Build menu from i18n keys
function buildMenu(lang) {
  return [
    {
      side: 'teaching', labelKey: 'side_teaching', color: 'cyan', icon: '🎓',
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
      side: 'documents', labelKey: 'side_documents', color: 'purple', icon: '📄',
      groups: [
        { labelKey: 'group_create', items: [
          { id: 'letter-writer', labelKey: 'tool_letter', icon: '✉️', phase: 1 },
          { id: 'slide-maker', labelKey: 'tool_slide', icon: '🖥️', phase: 3 },
          { id: 'certificate-generator', labelKey: 'tool_certificate', icon: '🏆', phase: 2 },
          { id: 'form-builder', labelKey: 'tool_form', icon: '📋', phase: 3 },
          { id: 'ai-translator', labelKey: 'tool_translator', icon: '🌐', phase: 3 },
          { id: 'ebook-builder', labelKey: 'tool_ebook', icon: '📖', phase: 3 },
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
      side: 'marketing', labelKey: 'side_marketing', color: 'gold', icon: '📣',
      groups: [
        { labelKey: 'group_content', items: [
          { id: 'marketing-content', labelKey: 'tool_marketing_content', icon: '✍️', phase: 1 },
          { id: 'auto-poster', labelKey: 'tool_auto_poster', icon: '🎨', phase: 1 },
        ]},
      ],
    },
    {
      side: 'admin', labelKey: 'side_admin', color: 'magenta', icon: '⚙️',
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
  // Phase 1
  'smart-quiz': SmartQuiz,
  'letter-writer': AILetterWriter,
  'plagiarism-checker': PlagiarismChecker,
  'ai-detector': AIContentDetector,
  'qr-generator': QRGenerator,
  'url-shortener': URLShortener,
  'attendance-tracker': AttendanceTracker,
  // Phase 2
  'lesson-planner': AILessonPlanner,
  'live-quiz': LiveQuizGame,
  'certificate-generator': CertificateGenerator,
  'meeting-notes': MeetingNotesAI,
  // Phase 3 — Teaching
  'exit-ticket': ExitTicket,
  'video-quiz': VideoQuiz,
  'interactive-activity': InteractiveActivity,
  'content-differentiator': ContentDifferentiator,
  'auto-grader': AutoGrader,
  'rubric-generator': RubricGenerator,
  'flashcard-builder': FlashcardBuilder,
  // Phase 3 — Documents
  'slide-maker': SlideMaker,
  'form-builder': FormBuilder,
  'ai-translator': AITranslator,
  'writing-quality': WritingQuality,
  'completeness-checker': CompletenessChecker,
  'grammar-checker': GrammarChecker,
  'image-to-content': ImageToContent,
  'pdf-toolkit': PDFToolkit,
  'template-library': TemplateLibrary,
  // Phase 3 — Admin
  'student-progress': StudentProgress,
  'ta-coordinator': TACoordinator,
  'stakeholder-portal': StakeholderPortal,
  'schedule-manager': ScheduleManager,
  'event-coordinator': EventCoordinator,
  'budget-tracker': BudgetTracker,
  'kpi-dashboard': KPIDashboard,
  'line-broadcast': LINEBroadcast,
  'ebook-builder': EbookBuilder,
  // Marketing
  'marketing-content': MarketingContentWriter,
  'auto-poster': AutoPosterMaker,
};

const COLOR_MAP = {
  cyan: { bg: CI.cyan, light: '#e6f9ff', border: '#80daff', text: '#0090b8' },
  purple: { bg: CI.purple, light: '#f3edff', border: '#c4a8ff', text: '#5c35cc' },
  magenta: { bg: CI.magenta, light: '#fff0f6', border: '#ff80b8', text: '#b8005e' },
  gold: { bg: '#e6a800', light: '#fff8e1', border: '#ffd54f', text: '#9e7700' },
};

const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

// Error Boundary
function ErrorFallback({ error, onReset }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: FONT }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>เกิดข้อผิดพลาด</h2>
      <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>{error?.message || 'เครื่องมือนี้มีปัญหา กรุณาลองใหม่'}</p>
      <button onClick={onReset} style={{
        padding: '10px 24px', borderRadius: '10px', border: 'none',
        background: CI.cyan, color: '#fff', fontSize: '16px', fontWeight: 600,
        cursor: 'pointer', fontFamily: FONT,
      }}>
        🔄 กลับหน้าหลัก
      </button>
    </div>
  );
}

// ===== BUS SPLASH SCREEN =====
function BusSplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(interval); return 100; } return p + 1; });
    }, 48);
    const timer = setTimeout(() => onFinish(), 5000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [onFinish]);

  // Pixel font data
  const FONTS = {
    S: [[0,1,1,1,1,1,0],[1,1,0,0,0,1,1],[1,1,0,0,0,0,0],[0,1,1,1,1,1,0],[0,0,0,0,0,1,1],[1,1,0,0,0,1,1],[0,1,1,1,1,1,0]],
    P: [[1,1,1,1,1,1,0],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[1,1,1,1,1,1,0],[1,1,0,0,0,0,0],[1,1,0,0,0,0,0],[1,1,0,0,0,0,0]],
    U: [[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[0,1,1,1,1,1,0]],
    B: [[1,1,1,1,1,1,0],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[1,1,1,1,1,1,0],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[1,1,1,1,1,1,0]],
  };
  const LETTERS = [
    { ch: 'S', color: CI.cyan },
    { ch: 'P', color: CI.cyan },
    { ch: 'U', color: CI.cyan },
    { ch: 'B', color: CI.magenta },
    { ch: 'U', color: CI.magenta },
    { ch: 'S', color: CI.magenta },
  ];
  const PX = 7, GAP = 2, CHAR_GAP = 10;
  const charW = 7 * (PX + GAP);
  const totalW = LETTERS.length * charW + (LETTERS.length - 1) * CHAR_GAP;

  // Build all pixel positions
  const allPixels = [];
  let globalIdx = 0;
  LETTERS.forEach((letter, li) => {
    const grid = FONTS[letter.ch];
    const baseX = li * (charW + CHAR_GAP);
    grid.forEach((row, ry) => {
      row.forEach((on, rx) => {
        if (on) {
          allPixels.push({ x: baseX + rx * (PX + GAP), y: ry * (PX + GAP), li, color: letter.color, idx: globalIdx });
          globalIdx++;
        }
      });
    });
  });

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #0b0b24 0%, #0e0e38 50%, #141452 100%)',
      fontFamily: FONT, overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999,
    }}>
      <style>{`
        @keyframes pxPop {
          0% { transform: scale(0) rotate(180deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(-10deg); opacity: 1; }
          80% { transform: scale(0.9) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pxWave {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pxPulse {
          0%, 100% { opacity: 0.85; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.4); }
        }
        @keyframes pxColorCycle {
          0% { fill: #00b4e6; }
          25% { fill: #7c4dff; }
          50% { fill: #e6007e; }
          75% { fill: #ffc107; }
          100% { fill: #00b4e6; }
        }
        @keyframes pxColorCycleM {
          0% { fill: #e6007e; }
          25% { fill: #ffc107; }
          50% { fill: #00b4e6; }
          75% { fill: #7c4dff; }
          100% { fill: #e6007e; }
        }
        @keyframes sparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-40px) scale(0.3); opacity: 0; }
        }
        @keyframes twinkle { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.8; } }
        @keyframes busRunCurve {
          0% { transform: translateX(-30%); }
          100% { transform: translateX(calc(100vw + 30%)); }
        }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes subtitleReveal {
          0% { opacity: 0; transform: translateY(12px); letter-spacing: 14px; }
          100% { opacity: 0.6; transform: translateY(0); letter-spacing: 7px; }
        }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
          75% { transform: scale(1.05); }
        }
      `}</style>

      {/* Floating pixel stars */}
      {[...Array(35)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 5 === 0 ? '4px' : i % 3 === 0 ? '3px' : '2px',
          height: i % 5 === 0 ? '4px' : i % 3 === 0 ? '3px' : '2px',
          borderRadius: i % 4 === 0 ? '50%' : '0',
          background: [CI.cyan, CI.gold, CI.magenta, '#fff', CI.purple][i % 5],
          top: `${(i * 13 + 3) % 85}%`, left: `${(i * 19 + 7) % 94}%`,
          animation: `twinkle ${1.2 + (i % 4) * 0.7}s ease-in-out infinite`,
          animationDelay: `${i * 0.12}s`,
        }} />
      ))}

      {/* ===== PIXEL TITLE: SPUBUS ===== */}
      <div style={{ zIndex: 2, marginBottom: '16px' }}>
        <svg viewBox={`-20 -20 ${totalW + 40} ${7 * (PX + GAP) + 40}`}
          style={{ width: '88vw', maxWidth: '680px', height: 'auto' }}>
          <defs>
            <filter id="pxGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodOpacity="0.5" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Each pixel as animated rect */}
          {allPixels.map((px, i) => {
            const popDelay = px.li * 0.12 + px.idx * 0.008;
            const waveDelay = (px.x + px.y) * 0.005;
            const isCyan = px.li < 3;
            return (
              <g key={i}>
                {/* Glow shadow behind pixel */}
                <rect
                  x={px.x - 1} y={px.y - 1}
                  width={PX + 2} height={PX + 2}
                  rx="2" fill={px.color} opacity="0"
                  filter="url(#pxGlow)"
                >
                  <animate attributeName="opacity" from="0" to="0.3" dur="0.3s" begin={`${popDelay}s`} fill="freeze" />
                </rect>
                {/* Main pixel */}
                <rect
                  x={px.x} y={px.y}
                  width={PX} height={PX}
                  rx="1.5"
                  fill={px.color}
                  opacity="0"
                  style={{
                    animation: `pxPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${popDelay}s both, pxWave 2.5s ease-in-out ${1.5 + waveDelay}s infinite, ${isCyan ? 'pxColorCycle' : 'pxColorCycleM'} 5s linear ${2 + waveDelay}s infinite, pxPulse 3s ease-in-out ${1.8 + waveDelay}s infinite`,
                  }}
                />
                {/* Highlight corner (cute shine) */}
                <rect
                  x={px.x + 1} y={px.y + 1}
                  width={3} height={3}
                  rx="0.5" fill="#fff" opacity="0"
                >
                  <animate attributeName="opacity" from="0" to="0.35" dur="0.2s" begin={`${popDelay + 0.3}s`} fill="freeze" />
                </rect>
              </g>
            );
          })}

          {/* Sparkle effects around text */}
          {[
            { x: -12, y: 10, delay: 1.5, size: 8 },
            { x: totalW + 4, y: 5, delay: 2.2, size: 10 },
            { x: totalW / 2 - 5, y: -14, delay: 1.8, size: 7 },
            { x: charW * 2 + 20, y: 7 * (PX + GAP) + 5, delay: 2.5, size: 9 },
            { x: charW * 4, y: -10, delay: 3.0, size: 6 },
            { x: -8, y: 7 * (PX + GAP) - 5, delay: 3.5, size: 8 },
            { x: totalW + 8, y: 7 * (PX + GAP) - 10, delay: 2.8, size: 7 },
          ].map((sp, i) => (
            <g key={`sp${i}`} style={{ transformOrigin: `${sp.x + sp.size/2}px ${sp.y + sp.size/2}px`, animation: `sparkle 1.8s ease-in-out ${sp.delay}s infinite` }}>
              <line x1={sp.x + sp.size/2} y1={sp.y} x2={sp.x + sp.size/2} y2={sp.y + sp.size} stroke={CI.gold} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={sp.x} y1={sp.y + sp.size/2} x2={sp.x + sp.size} y2={sp.y + sp.size/2} stroke={CI.gold} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={sp.x + 1} y1={sp.y + 1} x2={sp.x + sp.size - 1} y2={sp.y + sp.size - 1} stroke={CI.gold} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              <line x1={sp.x + sp.size - 1} y1={sp.y + 1} x2={sp.x + 1} y2={sp.y + sp.size - 1} stroke={CI.gold} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </g>
          ))}

          {/* Floating hearts / particles from text */}
          {[
            { x: charW * 1, y: -5, emoji: '✦', color: CI.cyan, delay: 2 },
            { x: charW * 3.5, y: -5, emoji: '♥', color: CI.magenta, delay: 2.8 },
            { x: charW * 5, y: -3, emoji: '✦', color: CI.gold, delay: 3.5 },
          ].map((p, i) => (
            <text key={`fl${i}`} x={p.x} y={p.y} fontSize="8" fill={p.color} opacity="0"
              style={{ animation: `floatUp 2.5s ease-out ${p.delay}s infinite` }}>
              {p.emoji}
            </text>
          ))}
        </svg>
      </div>

      {/* TEACHER SUPPORT subtitle */}
      <div style={{
        fontSize: '16px', fontWeight: 600, letterSpacing: '7px', color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase', zIndex: 2, marginBottom: '6px',
        animation: 'subtitleReveal 0.8s ease-out 0.8s both',
      }}>
        TEACHER SUPPORT
      </div>

      {/* Sub-subtitle */}
      <div style={{
        fontSize: '13px', color: 'rgba(255,255,255,0.3)', zIndex: 2, marginBottom: '4px',
        opacity: 0, animation: 'subtitleReveal 0.6s ease-out 1.2s both',
        letterSpacing: '3px',
      }}>
        AI-Powered Teaching Platform
      </div>
      <div style={{
        fontSize: '11px', color: 'rgba(255,255,255,0.15)', zIndex: 2,
        opacity: 0, animation: 'subtitleReveal 0.6s ease-out 1.5s both',
        letterSpacing: '2px',
      }}>
        คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม
      </div>

      {/* ===== Curved Road + Big Bus ===== */}
      <div style={{ position: 'relative', width: '100%', height: '120px', zIndex: 2, marginTop: '16px' }}>
        <svg style={{ position: 'absolute', bottom: '8px', width: '104%', left: '-2%', height: '100px' }} viewBox="-100 0 1400 120" preserveAspectRatio="none">
          <path d="M-100,70 C100,48 350,85 600,65 C850,45 1050,82 1300,60" fill="none" stroke="#2a2a5e" strokeWidth="30" />
          <path d="M-100,70 C100,48 350,85 600,65 C850,45 1050,82 1300,60" fill="none" stroke={CI.gold} strokeWidth="2" strokeDasharray="16 12" opacity="0.5">
            <animate attributeName="stroke-dashoffset" from="0" to="-56" dur="0.8s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* Big Bus */}
        <div style={{ position: 'absolute', bottom: '24px', animation: 'busRunCurve 5.5s ease-in-out infinite' }}>
          <div style={{ animation: 'bounce 0.3s ease-in-out infinite' }}>
            <svg width="160" height="75" viewBox="0 0 180 85">
              <ellipse cx="90" cy="78" rx="70" ry="4" fill="rgba(0,0,0,0.25)" />
              <rect x="5" y="14" width="170" height="50" rx="10" fill={CI.cyan} />
              <rect x="10" y="7" width="160" height="12" rx="6" fill="#0099cc" />
              <rect x="10" y="17" width="160" height="2.5" fill="#33ccff" opacity="0.35" />
              {[18, 46, 74, 102].map((wx, i) => (
                <g key={i}>
                  <rect x={wx} y="25" width="22" height="18" rx="3" fill="#1a3a5e" />
                  <rect x={wx+1} y="26" width="20" height="9" rx="2" fill="#e0f7ff" opacity="0.85" />
                </g>
              ))}
              <rect x="132" y="25" width="30" height="32" rx="4" fill="#0088b3" />
              <rect x="135" y="28" width="12" height="26" rx="3" fill="#e0f7ff" opacity="0.7" />
              <rect x="149" y="28" width="10" height="26" rx="3" fill="#e0f7ff" opacity="0.7" />
              <rect x="168" y="38" width="10" height="10" rx="3" fill={CI.gold} />
              <rect x="2" y="38" width="8" height="10" rx="3" fill={CI.magenta} />
              <text x="72" y="56" fill="#fff" fontSize="11" fontWeight="800" fontFamily="'Kanit', sans-serif" letterSpacing="1">SPU BUS</text>
              <rect x="5" y="62" width="170" height="4" rx="2" fill="#0088b3" />
              <circle cx="45" cy="70" r="9" fill="#1a1a2e" stroke="#475569" strokeWidth="2" />
              <circle cx="45" cy="70" r="4" fill="#64748b" />
              <g style={{ transformOrigin: '45px 70px', animation: 'wheelSpin 0.35s linear infinite' }}>
                <line x1="45" y1="63" x2="45" y2="77" stroke="#888" strokeWidth="1" />
                <line x1="38" y1="70" x2="52" y2="70" stroke="#888" strokeWidth="1" />
              </g>
              <circle cx="140" cy="70" r="9" fill="#1a1a2e" stroke="#475569" strokeWidth="2" />
              <circle cx="140" cy="70" r="4" fill="#64748b" />
              <g style={{ transformOrigin: '140px 70px', animation: 'wheelSpin 0.35s linear infinite' }}>
                <line x1="140" y1="63" x2="140" y2="77" stroke="#888" strokeWidth="1" />
                <line x1="133" y1="70" x2="147" y2="70" stroke="#888" strokeWidth="1" />
              </g>
              <circle cx="-6" cy="58" r="4" fill="rgba(255,255,255,0.08)" />
              <circle cx="-16" cy="54" r="6" fill="rgba(255,255,255,0.04)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: '16px', width: '50%', maxWidth: '280px', zIndex: 3 }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: `${progress}%`, height: '100%', borderRadius: '3px',
            background: `linear-gradient(90deg, ${CI.cyan}, ${CI.purple}, ${CI.magenta})`,
            transition: 'width 0.1s linear',
            boxShadow: `0 0 8px ${CI.cyan}60`,
          }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '3px', fontWeight: 600 }}>
          LOADING...
        </div>
      </div>
    </div>
  );
}

export default function TeacherPage() {
  const { user, loading, signOut, profile } = useAuth();
  const router = useRouter();
  const [activeTool, setActiveTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSides, setExpandedSides] = useState({ teaching: true, documents: true, marketing: true, admin: true });
  const [lang, setLang] = useState('th');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [toolError, setToolError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const MENU_ITEMS = buildMenu(lang);

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // No auth guard — allow anyone to access tools

  // QR/attendance param handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('quiz')) setActiveTool('smart-quiz');
      else if (params.get('att')) setActiveTool('attendance-tracker');
      else if (params.get('livequiz')) setActiveTool('live-quiz');
    }
  }, []);

  // Show splash screen on every page load/refresh
  if (showSplash) return <BusSplashScreen onFinish={() => setShowSplash(false)} />;

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0b24 0%, #1a1a4e 40%, #2d1b69 100%)',
      fontFamily: FONT, overflow: 'hidden', position: 'relative',
    }}>
      {/* Stars background */}
      <style>{`
        @keyframes busRun {
          0% { transform: translateX(-250px); opacity: 0; }
          5% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 250px)); opacity: 0; }
        }
        @keyframes busRun2 {
          0% { transform: translateX(calc(100vw + 150px)) scaleX(-1); opacity: 0; }
          5% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateX(-350px) scaleX(-1); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes roadDash {
          0% { background-position: 0 0; }
          100% { background-position: -60px 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Floating stars */}
      {[...Array(25)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? '3px' : '2px', height: i % 3 === 0 ? '3px' : '2px',
          borderRadius: '50%',
          background: i % 4 === 0 ? '#00b4e6' : i % 4 === 1 ? '#ffc107' : i % 4 === 2 ? '#e6007e' : '#fff',
          top: `${(i * 17 + 5) % 85}%`, left: `${(i * 23 + 10) % 90}%`,
          animation: `twinkle ${1.5 + (i % 3) * 0.8}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}

      {/* Logo */}
      <div style={{ animation: 'fadeInUp 0.8s ease-out', marginBottom: '20px', zIndex: 2 }}>
        <img src="/logo-spubus.png" alt="SPUBUS" style={{ height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,180,230,0.4))' }} />
      </div>

      {/* Title */}
      <div style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both', zIndex: 2, textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{
          fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '0.05em',
          background: 'linear-gradient(90deg, #00b4e6, #7c4dff, #e6007e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          SPUBUS Teacher Support
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>
          ระบบสนับสนุนการสอนสำหรับอาจารย์
        </p>
      </div>

      {/* Road + Bus Scene */}
      <div style={{
        position: 'relative', width: '100%', height: '120px',
        animation: 'fadeInUp 0.8s ease-out 0.4s both', zIndex: 2,
      }}>
        {/* Road */}
        <div style={{
          position: 'absolute', bottom: '20px', left: 0, right: 0, height: '40px',
          background: '#2a2a3e', borderTop: '3px solid #3a3a5e', borderBottom: '3px solid #1a1a2e',
        }}>
          {/* Road dashes */}
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0, height: '3px', transform: 'translateY(-50%)',
            backgroundImage: 'repeating-linear-gradient(90deg, #ffc107 0px, #ffc107 20px, transparent 20px, transparent 40px)',
            backgroundSize: '60px 3px',
            animation: 'roadDash 0.8s linear infinite',
          }} />
        </div>

        {/* === BUS (main - going right) === */}
        <div style={{
          position: 'absolute', bottom: '45px',
          animation: 'busRun 4s linear infinite',
        }}>
          <div style={{ animation: 'bounce 0.3s ease-in-out infinite', position: 'relative' }}>
            {/* Bus body */}
            <svg width="140" height="65" viewBox="0 0 140 65">
              {/* Main body */}
              <rect x="5" y="10" width="130" height="40" rx="8" fill="#00b4e6" />
              {/* Top */}
              <rect x="10" y="5" width="120" height="10" rx="5" fill="#0099cc" />
              {/* Windows */}
              <rect x="15" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              <rect x="38" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              <rect x="61" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              <rect x="84" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              {/* Door */}
              <rect x="107" y="18" width="22" height="28" rx="3" fill="#0099cc" />
              <rect x="110" y="21" width="7" height="22" rx="2" fill="#e0f7ff" opacity="0.8" />
              <rect x="119" y="21" width="7" height="22" rx="2" fill="#e0f7ff" opacity="0.8" />
              {/* Front light */}
              <rect x="130" y="30" width="8" height="8" rx="2" fill="#ffc107" />
              {/* Back light */}
              <rect x="2" y="30" width="6" height="8" rx="2" fill="#e6007e" />
              {/* Label "SPU BUS" */}
              <text x="50" y="44" fill="#fff" fontSize="9" fontWeight="800" fontFamily="sans-serif">SPU BUS</text>
              {/* Bumper */}
              <rect x="5" y="48" width="130" height="4" rx="2" fill="#0088b3" />
              {/* Wheels */}
              <circle cx="35" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
              <circle cx="35" cy="55" r="4" fill="#555" />
              <circle cx="105" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
              <circle cx="105" cy="55" r="4" fill="#555" />
              {/* Wheel spokes animation */}
              <g style={{ transformOrigin: '35px 55px', animation: 'wheelSpin 0.4s linear infinite' }}>
                <line x1="35" y1="49" x2="35" y2="61" stroke="#777" strokeWidth="1" />
                <line x1="29" y1="55" x2="41" y2="55" stroke="#777" strokeWidth="1" />
              </g>
              <g style={{ transformOrigin: '105px 55px', animation: 'wheelSpin 0.4s linear infinite' }}>
                <line x1="105" y1="49" x2="105" y2="61" stroke="#777" strokeWidth="1" />
                <line x1="99" y1="55" x2="111" y2="55" stroke="#777" strokeWidth="1" />
              </g>
              {/* Exhaust */}
              <circle cx="-5" cy="48" r="4" fill="rgba(255,255,255,0.15)" />
              <circle cx="-15" cy="45" r="6" fill="rgba(255,255,255,0.08)" />
              <circle cx="-28" cy="42" r="8" fill="rgba(255,255,255,0.04)" />
            </svg>
          </div>
        </div>

        {/* === Small bus (going left) === */}
        <div style={{
          position: 'absolute', bottom: '30px',
          animation: 'busRun2 6s linear infinite',
          animationDelay: '1s',
        }}>
          <svg width="80" height="40" viewBox="0 0 140 65">
            <rect x="5" y="10" width="130" height="40" rx="8" fill="#e6007e" />
            <rect x="10" y="5" width="120" height="10" rx="5" fill="#cc006e" />
            <rect x="15" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="38" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="61" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="84" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="130" y="30" width="8" height="8" rx="2" fill="#ffc107" />
            <circle cx="35" cy="55" r="9" fill="#1a1a2e" />
            <circle cx="105" cy="55" r="9" fill="#1a1a2e" />
          </svg>
        </div>
      </div>

      {/* Loading text */}
      <div style={{ animation: 'fadeInUp 0.8s ease-out 0.6s both', zIndex: 2, textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <div style={{
            width: '200px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '3px',
              background: 'linear-gradient(90deg, #00b4e6, #7c4dff, #e6007e)',
              animation: 'roadDash 1.5s linear infinite',
              width: '60%',
            }} />
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          กำลังเตรียมเครื่องมือ 35 รายการ...
        </p>
      </div>
    </div>
  );

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

  const handleSelectTool = (toolId) => {
    setToolError(null);
    setActiveTool(toolId);
    if (isMobile) setMobileMenuOpen(false);
  };

  // Sidebar content (shared between desktop & mobile)
  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo — Sticky Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '10px', height: '64px',
        position: 'sticky', top: 0, zIndex: 5,
        background: '#fff', boxSizing: 'border-box',
      }}>
        <div onClick={() => { setActiveTool(null); setShowSplash(true); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <img src="/logo-spubus.png" alt="SPUBUS" style={{ height: '42px', objectFit: 'contain', flexShrink: 0 }} />
        </div>
        {!isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: '#f1f5f9', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px', flexShrink: 0, fontSize: '14px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}
        {isMobile && (
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px', padding: '6px', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        )}
      </div>

      {/* Scrollable menu area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {/* Home button */}
        <div style={{ padding: '0 8px 4px' }}>
          <button onClick={() => handleSelectTool(null)} style={{
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            background: !activeTool ? `${CI.cyan}12` : 'transparent', border: 'none',
            color: !activeTool ? CI.cyan : '#475569', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px',
            textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
            fontWeight: !activeTool ? 700 : 500,
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🏠</span>
            <span>{t(lang, 'home')}</span>
          </button>
        </div>

        {/* Sections */}
        {MENU_ITEMS.map(side => {
          const c = COLOR_MAP[side.color];
          return (
            <div key={side.side} style={{ marginTop: '6px', padding: '0 8px' }}>
              <button onClick={() => toggleSide(side.side)} style={{
                width: '100%', padding: '12px 16px', border: 'none',
                background: `linear-gradient(135deg, ${c.bg}, ${c.bg}dd)`,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '10px', color: '#fff', fontSize: '15px', fontWeight: 800,
                letterSpacing: '0.04em', textAlign: 'left', fontFamily: 'inherit',
                borderRadius: '12px', boxShadow: `0 3px 12px ${c.bg}40`,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0, filter: 'brightness(1.2)' }}>{side.icon}</span>
                <span style={{ flex: 1, textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>{t(lang, side.labelKey)}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', transition: 'transform 0.2s', transform: expandedSides[side.side] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
              </button>

              {expandedSides[side.side] && side.groups.map(group => (
                <div key={group.labelKey} style={{ marginBottom: '4px' }}>
                  <div style={{ padding: '6px 16px 4px', color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {t(lang, group.labelKey)}
                  </div>
                  {group.items.map(item => (
                    <div key={item.id} style={{ padding: '1px 8px' }}>
                      <button
                        onClick={() => handleSelectTool(item.id)}
                        title={t(lang, item.labelKey)}
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '10px',
                          background: activeTool === item.id ? c.bg : 'transparent',
                          border: 'none',
                          color: activeTool === item.id ? '#fff' : '#374151',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                          fontSize: '14px', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                          fontWeight: activeTool === item.id ? 700 : 500,
                        }}
                      >
                        <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ flex: 1, lineHeight: 1.3 }}>{t(lang, item.labelKey)}</span>
                        {item.phase === 1 && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '6px', background: activeTool === item.id ? 'rgba(255,255,255,0.25)' : '#dcfce7', color: activeTool === item.id ? '#fff' : '#16a34a', fontWeight: 700 }}>✓</span>}
                        {item.phase > 1 && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '6px', background: activeTool === item.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: activeTool === item.id ? '#fff' : '#94a3b8', fontWeight: 600 }}>P{item.phase}</span>}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bottom: Sidebar version label */}
      <div style={{
        borderTop: '1px solid #e2e8f0', padding: '12px 16px',
        position: 'sticky', bottom: 0, background: '#fff',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>SPUBUS Teacher Platform v1.0</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: FONT, background: '#f8fafc', overflow: 'hidden' }}>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: CI.dark, color: '#fff', fontSize: '16px', borderRadius: '10px', fontFamily: FONT } }} />

      {/* ===== MOBILE OVERLAY ===== */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ===== SIDEBAR (Desktop) ===== */}
      {!isMobile && (
        <aside style={{
          width: sidebarOpen ? '310px' : '0px', minWidth: sidebarOpen ? '310px' : '0px',
          background: '#ffffff', height: '100vh', overflowX: 'hidden',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          display: 'flex', flexDirection: 'column', zIndex: 10, flexShrink: 0,
          borderRight: '1px solid #e2e8f0',
        }}>
          {sidebarOpen && sidebarContent}
        </aside>
      )}

      {/* ===== SIDEBAR (Mobile drawer) ===== */}
      {isMobile && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '300px', background: '#ffffff',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          overflowX: 'hidden',
          display: 'flex', flexDirection: 'column', zIndex: 50,
          boxShadow: mobileMenuOpen ? '4px 0 32px rgba(0,0,0,0.15)' : 'none',
        }}>
          {sidebarContent}
        </aside>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header bar */}
        <div style={{
          padding: isMobile ? '8px 12px' : '10px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
          minHeight: '64px', boxSizing: 'border-box',
        }}>
          {/* Mobile hamburger / Desktop sidebar toggle */}
          <button
            onClick={() => isMobile ? setMobileMenuOpen(true) : setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '4px 8px', color: '#64748b' }}
          >
            ☰
          </button>

          {activeTool && active ? (
            <>
              {/* Back button */}
              <button
                onClick={() => handleSelectTool(null)}
                style={{
                  background: COLOR_MAP[active.side.color].light,
                  border: `1px solid ${COLOR_MAP[active.side.color].border}`,
                  color: COLOR_MAP[active.side.color].text,
                  cursor: 'pointer', borderRadius: '10px',
                  padding: '6px 12px', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = COLOR_MAP[active.side.color].border + '40'; }}
                onMouseLeave={e => { e.currentTarget.style.background = COLOR_MAP[active.side.color].light; }}
              >
                ← {isMobile ? '' : t(lang, 'home')}
              </button>
              {/* Breadcrumb: Section > Tool */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '13px', color: COLOR_MAP[active.side.color].text, fontWeight: 600,
                  background: COLOR_MAP[active.side.color].light, padding: '2px 8px', borderRadius: '6px',
                  flexShrink: 0, display: isMobile ? 'none' : 'inline',
                }}>
                  {active.side.icon} {t(lang, active.side.labelKey)}
                </span>
                {!isMobile && <span style={{ color: '#cbd5e1', fontSize: '14px', flexShrink: 0 }}>/</span>}
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{active.item.icon}</span>
                <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t(lang, active.item.labelKey)}
                </h1>
              </div>
              {active.item.phase === 1 && (
                <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', fontWeight: 600, flexShrink: 0 }}>
                  ✓ {isMobile ? '' : t(lang, 'phase_ready')}
                </span>
              )}
              {active.item.phase > 1 && (
                <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#92400e', fontWeight: 600, flexShrink: 0 }}>
                  P{active.item.phase}
                </span>
              )}
            </>
          ) : (
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setActiveTool(null); setShowSplash(true); }}>
              {/* No text — banner below handles title on homepage */}
            </div>
          )}

          {/* Right side: Language + User (world-class top-right pattern) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
            {/* Language dropdown */}
            {(() => {
              const LANGS = [
                { id: 'th', label: 'ไทย', flag: '🇹🇭' },
                { id: 'en', label: 'EN', flag: '🇬🇧' },
                { id: 'zh', label: '中文', flag: '🇨🇳' },
                { id: 'ja', label: '日本語', flag: '🇯🇵' },
              ];
              const current = LANGS.find(l => l.id === lang) || LANGS[0];
              return (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowLangMenu(prev => !prev)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '10px',
                      border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 600, color: '#475569', fontFamily: 'inherit',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = CI.cyan; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <span style={{ fontSize: '16px' }}>{current.flag}</span>
                    <span>{current.label}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '2px' }}>▼</span>
                  </button>
                  {showLangMenu && (
                    <>
                      <div onClick={() => setShowLangMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 999,
                        background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '4px', minWidth: '140px',
                        animation: 'fadeInDown 0.15s ease-out',
                      }}>
                        <style>{`@keyframes fadeInDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
                        {LANGS.map(l => (
                          <button key={l.id} onClick={() => { setLang(l.id); setShowLangMenu(false); }} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: lang === l.id ? `${CI.cyan}10` : 'transparent',
                            color: lang === l.id ? CI.cyan : '#475569',
                            fontSize: '14px', fontWeight: lang === l.id ? 700 : 500, fontFamily: 'inherit',
                            transition: 'background 0.1s', textAlign: 'left',
                          }}
                          onMouseEnter={e => { if (lang !== l.id) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { if (lang !== l.id) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span style={{ fontSize: '18px' }}>{l.flag}</span>
                            <span>{l.label}</span>
                            {lang === l.id && <span style={{ marginLeft: 'auto', fontSize: '13px' }}>✓</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* User avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px 4px 4px',
                background: showUserMenu ? '#f1f5f9' : 'transparent', border: '1px solid transparent',
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!showUserMenu) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${CI.cyan}25, ${CI.purple}25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                )}
                {!isMobile && (
                  <div style={{ textAlign: 'left', maxWidth: '140px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile?.full_name || user?.email?.split('@')[0] || 'Guest'}
                    </div>
                  </div>
                )}
                <span style={{ fontSize: '10px', color: '#94a3b8', transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <>
                  <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    width: '240px', background: '#fff', borderRadius: '12px',
                    border: '1px solid #e2e8f0', padding: '6px', zIndex: 50,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  }}>
                    {/* User info */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        {profile?.full_name || 'Guest'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email || 'ใช้งานได้เลย ไม่ต้อง Login'}
                      </div>
                    </div>
                    {user ? (
                      <button onClick={() => { signOut(); router.push('/teacher/login'); setShowUserMenu(false); }} style={{
                        width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: '#ef4444',
                        cursor: 'pointer', borderRadius: '8px', fontSize: '14px', textAlign: 'left', fontFamily: 'inherit', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        🚪 {t(lang, 'logout')}
                      </button>
                    ) : (
                      <button onClick={() => { router.push('/teacher/login'); setShowUserMenu(false); }} style={{
                        width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: CI.cyan,
                        cursor: 'pointer', borderRadius: '8px', fontSize: '14px', textAlign: 'left', fontFamily: 'inherit', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        🔑 เข้าสู่ระบบ
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tool content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {toolError ? (
            <ErrorFallback error={toolError} onReset={() => { setToolError(null); setActiveTool(null); }} />
          ) : !activeTool ? (
            <TeacherDashboard onSelectTool={handleSelectTool} menuItems={MENU_ITEMS} colorMap={COLOR_MAP} lang={lang} />
          ) : ActiveComponent ? (
            <ErrorBoundaryWrapper onError={(err) => setToolError(err)} onReset={() => { setToolError(null); setActiveTool(null); }}>
              <ActiveComponent onSelectTool={handleSelectTool} lang={lang} />
            </ErrorBoundaryWrapper>
          ) : (
            <ComingSoon toolId={activeTool} />
          )}
        </div>
      </main>
    </div>
  );
}

// Simple error boundary wrapper using React class component
class ErrorBoundaryWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Tool error:', error, info);
    if (this.props.onError) this.props.onError(error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => {
            this.setState({ hasError: false, error: null });
            if (this.props.onReset) this.props.onReset();
          }}
        />
      );
    }
    return this.props.children;
  }
}

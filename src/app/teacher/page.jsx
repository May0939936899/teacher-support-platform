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

  const pxShadow = (color, size = 2) => {
    const s = size;
    return `${s}px 0 0 ${color}, -${s}px 0 0 ${color}, 0 ${s}px 0 ${color}, 0 -${s}px 0 ${color}, ${s}px ${s}px 0 ${color}, -${s}px ${s}px 0 ${color}, ${s}px -${s}px 0 ${color}, -${s}px -${s}px 0 ${color}`;
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #0b0b24 0%, #111145 50%, #1a1a4e 100%)',
      fontFamily: FONT, overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes busRunCurve {
          0% { transform: translateX(-30%) translateY(0px); }
          25% { transform: translateX(15vw) translateY(-8px); }
          50% { transform: translateX(45vw) translateY(5px); }
          75% { transform: translateX(72vw) translateY(-4px); }
          100% { transform: translateX(calc(100vw + 30%)) translateY(0px); }
        }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.9; } }
        @keyframes subtitleSlide { 0% { opacity: 0; letter-spacing: 16px; } 100% { opacity: 0.55; letter-spacing: 8px; } }
      `}</style>

      {/* Floating pixel stars */}
      {[...Array(30)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 5 === 0 ? '4px' : i % 3 === 0 ? '3px' : '2px',
          height: i % 5 === 0 ? '4px' : i % 3 === 0 ? '3px' : '2px',
          background: i % 5 === 0 ? CI.cyan : i % 5 === 1 ? CI.gold : i % 5 === 2 ? CI.magenta : i % 5 === 3 ? '#fff' : CI.purple,
          top: `${(i * 13 + 3) % 80}%`, left: `${(i * 19 + 7) % 92}%`,
          animation: `twinkle ${1.2 + (i % 4) * 0.7}s ease-in-out infinite`,
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}

      {/* Logo */}
      <div style={{ animation: 'fadeInUp 0.6s ease-out', marginBottom: '12px', zIndex: 2 }}>
        <img src="/logo-spubus.png" alt="SPUBUS" style={{ height: '60px', objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,180,230,0.4))' }} />
      </div>

      {/* Pixel Title: SPUBUS — CI gradient pixel art */}
      <div style={{ animation: 'fadeInScale 0.8s ease-out 0.15s both', zIndex: 2, marginBottom: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg viewBox="0 0 600 120" style={{ width: '90vw', maxWidth: '760px', height: 'auto' }}>
          <defs>
            <linearGradient id="gradCyan" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#33ccff" />
              <stop offset="50%" stopColor={CI.cyan} />
              <stop offset="100%" stopColor="#0088b3" />
            </linearGradient>
            <linearGradient id="gradMagenta" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff4da6" />
              <stop offset="50%" stopColor={CI.magenta} />
              <stop offset="100%" stopColor="#b3005e" />
            </linearGradient>
            <filter id="glowC" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feFlood floodColor={CI.cyan} floodOpacity="0.35" />
              <feComposite in2="b" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowM" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feFlood floodColor={CI.magenta} floodOpacity="0.35" />
              <feComposite in2="b" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {(() => {
            const C = 5, GAP = 1.2, cw = C - GAP;
            const fonts = {
              S: [[0,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,0],[1,1,0,0,0,0,1,0],[1,1,0,0,0,0,0,0],[0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0],[0,0,0,0,0,1,1,0],[1,0,0,0,0,1,1,0],[1,1,1,1,1,1,0,0],[0,1,1,1,1,0,0,0]],
              P: [[1,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,1,1,1,1,0,0],[1,1,1,1,1,0,0,0],[1,1,0,0,0,0,0,0],[1,1,0,0,0,0,0,0],[1,1,0,0,0,0,0,0],[1,1,0,0,0,0,0,0]],
              U: [[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[0,1,1,1,1,1,0,0],[0,0,1,1,1,0,0,0]],
              B: [[1,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,1,1,0,0],[1,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,0],[1,1,0,0,0,1,1,0],[1,1,0,0,0,1,1,0],[1,1,1,1,1,1,1,0],[1,1,1,1,1,1,0,0]],
            };
            const charW = 8 * C + 6;
            const totalW = 6 * charW;
            const offsetX = (600 - totalW) / 2;
            const layout = [
              { ch: 'S', grad: 'url(#gradCyan)', filter: 'url(#glowC)', idx: 0 },
              { ch: 'P', grad: 'url(#gradCyan)', filter: 'url(#glowC)', idx: 1 },
              { ch: 'U', grad: 'url(#gradCyan)', filter: 'url(#glowC)', idx: 2 },
              { ch: 'B', grad: 'url(#gradMagenta)', filter: 'url(#glowM)', idx: 3 },
              { ch: 'U', grad: 'url(#gradMagenta)', filter: 'url(#glowM)', idx: 4 },
              { ch: 'S', grad: 'url(#gradMagenta)', filter: 'url(#glowM)', idx: 5 },
            ];
            const rects = [];
            layout.forEach(l => {
              const grid = fonts[l.ch];
              const baseX = offsetX + l.idx * charW;
              const baseDelay = l.idx * 0.07;
              let pxIdx = 0;
              // Letter group wrapper for glow filter
              const letterRects = [];
              grid.forEach((row, ry) => {
                row.forEach((on, rx) => {
                  if (on) {
                    letterRects.push(
                      <rect
                        key={`px${l.idx}_${ry}_${rx}`}
                        x={baseX + rx * C}
                        y={ry * C + 4}
                        width={cw} height={cw}
                        rx="0.7"
                        fill={l.grad}
                        opacity="0"
                      >
                        <animate attributeName="opacity" from="0" to="0.92" dur="0.2s" begin={`${baseDelay + pxIdx * 0.005}s`} fill="freeze" />
                      </rect>
                    );
                    pxIdx++;
                  }
                });
              });
              rects.push(<g key={`g${l.idx}`} filter={l.filter}>{letterRects}</g>);
            });
            return rects;
          })()}
          {/* Animated glow pulse behind letters */}
          <rect x="60" y="-2" width="190" height="58" rx="8" fill={CI.cyan} opacity="0">
            <animate attributeName="opacity" values="0;0.08;0" dur="3.5s" begin="1s" repeatCount="indefinite" />
          </rect>
          <rect x="290" y="-2" width="190" height="58" rx="8" fill={CI.magenta} opacity="0">
            <animate attributeName="opacity" values="0;0.08;0" dur="3.5s" begin="2.8s" repeatCount="indefinite" />
          </rect>
          {/* TEACHER SUPPORT — elegant tracking animation */}
          <text x="300" y="78" textAnchor="middle" fontFamily="'Kanit', sans-serif" fontSize="13" fontWeight="600" fill="rgba(255,255,255,0.55)" letterSpacing="8" opacity="0">
            TEACHER SUPPORT
            <animate attributeName="opacity" from="0" to="0.55" dur="0.8s" begin="0.6s" fill="freeze" />
            <animate attributeName="letterSpacing" from="16" to="8" dur="0.8s" begin="0.6s" fill="freeze" />
          </text>
          {/* Subtitle */}
          <text x="300" y="96" textAnchor="middle" fontFamily="'Kanit', sans-serif" fontSize="9.5" fontWeight="300" fill="rgba(255,255,255,0.3)" letterSpacing="2" opacity="0">
            AI-Powered Teaching Platform
            <animate attributeName="opacity" from="0" to="0.3" dur="0.6s" begin="1s" fill="freeze" />
          </text>
          {/* Org */}
          <text x="300" y="112" textAnchor="middle" fontFamily="'Kanit', sans-serif" fontSize="8" fontWeight="300" fill="rgba(255,255,255,0.18)" letterSpacing="1" opacity="0">
            คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม
            <animate attributeName="opacity" from="0" to="0.18" dur="0.6s" begin="1.2s" fill="freeze" />
          </text>
        </svg>
      </div>

      {/* ===== Curved Road + Big Bus ===== */}
      <div style={{ position: 'relative', width: '100%', height: '130px', zIndex: 2, marginTop: '6px' }}>
        <svg style={{ position: 'absolute', bottom: '8px', width: '104%', left: '-2%', height: '110px' }} viewBox="-100 0 1400 130" preserveAspectRatio="none">
          <path d="M-100,80 C100,55 350,95 600,72 C850,48 1050,92 1300,68" fill="none" stroke="#2a2a5e" strokeWidth="34" />
          <path d="M-100,80 C100,55 350,95 600,72 C850,48 1050,92 1300,68" fill="none" stroke="#3a3a6e" strokeWidth="36" opacity="0.25" />
          <path d="M-100,80 C100,55 350,95 600,72 C850,48 1050,92 1300,68" fill="none" stroke={CI.gold} strokeWidth="2.5" strokeDasharray="18 14" opacity="0.6">
            <animate attributeName="stroke-dashoffset" from="0" to="-64" dur="0.8s" repeatCount="indefinite" />
          </path>
          <path d="M-100,65 C100,40 350,80 600,57 C850,33 1050,77 1300,53" fill="none" stroke="#3a3a6e" strokeWidth="1" opacity="0.3" />
          <path d="M-100,95 C100,70 350,110 600,87 C850,63 1050,107 1300,83" fill="none" stroke="#3a3a6e" strokeWidth="1" opacity="0.3" />
        </svg>

        {/* Big Bus */}
        <div style={{ position: 'absolute', bottom: '28px', animation: 'busRunCurve 5s ease-in-out infinite' }}>
          <div style={{ animation: 'bounce 0.3s ease-in-out infinite' }}>
            <svg width="180" height="85" viewBox="0 0 180 85">
              {/* Shadow */}
              <ellipse cx="90" cy="80" rx="75" ry="4" fill="rgba(0,0,0,0.3)" />
              {/* Body */}
              <rect x="5" y="12" width="170" height="52" rx="10" fill={CI.cyan} />
              {/* Roof */}
              <rect x="10" y="5" width="160" height="14" rx="7" fill="#0099cc" />
              {/* Roof stripe */}
              <rect x="10" y="16" width="160" height="3" fill="#33ccff" opacity="0.4" />
              {/* Windows */}
              {[18, 46, 74, 102].map((wx, i) => (
                <g key={i}>
                  <rect x={wx} y="24" width="22" height="20" rx="4" fill="#1a3a5e" />
                  <rect x={wx+1} y="25" width="20" height="10" rx="3" fill="#e0f7ff" opacity="0.85" />
                  <rect x={wx+1} y="36" width="20" height="7" rx="2" fill="#b3e8ff" opacity="0.5" />
                </g>
              ))}
              {/* Door */}
              <rect x="132" y="24" width="30" height="34" rx="4" fill="#0088b3" />
              <rect x="135" y="27" width="12" height="28" rx="3" fill="#e0f7ff" opacity="0.75" />
              <rect x="149" y="27" width="10" height="28" rx="3" fill="#e0f7ff" opacity="0.75" />
              {/* Front light */}
              <rect x="168" y="38" width="10" height="10" rx="3" fill={CI.gold} />
              <rect x="168" y="38" width="10" height="10" rx="3" fill="#fff" opacity="0.3" />
              {/* Back light */}
              <rect x="2" y="38" width="8" height="10" rx="3" fill={CI.magenta} />
              {/* Label */}
              <text x="72" y="58" fill="#fff" fontSize="11" fontWeight="800" fontFamily="'Kanit', sans-serif" letterSpacing="1">SPU BUS</text>
              {/* Bumper */}
              <rect x="5" y="62" width="170" height="5" rx="2.5" fill="#0088b3" />
              {/* Wheels */}
              <circle cx="45" cy="72" r="10" fill="#1a1a2e" stroke="#475569" strokeWidth="2.5" />
              <circle cx="45" cy="72" r="4.5" fill="#64748b" />
              <g style={{ transformOrigin: '45px 72px', animation: 'wheelSpin 0.35s linear infinite' }}>
                <line x1="45" y1="64" x2="45" y2="80" stroke="#888" strokeWidth="1.2" />
                <line x1="37" y1="72" x2="53" y2="72" stroke="#888" strokeWidth="1.2" />
              </g>
              <circle cx="140" cy="72" r="10" fill="#1a1a2e" stroke="#475569" strokeWidth="2.5" />
              <circle cx="140" cy="72" r="4.5" fill="#64748b" />
              <g style={{ transformOrigin: '140px 72px', animation: 'wheelSpin 0.35s linear infinite' }}>
                <line x1="140" y1="64" x2="140" y2="80" stroke="#888" strokeWidth="1.2" />
                <line x1="132" y1="72" x2="148" y2="72" stroke="#888" strokeWidth="1.2" />
              </g>
              {/* Exhaust */}
              <circle cx="-8" cy="60" r="5" fill="rgba(255,255,255,0.1)" />
              <circle cx="-20" cy="56" r="7" fill="rgba(255,255,255,0.06)" />
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
        <div style={{ textAlign: 'center', marginTop: '6px', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
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
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: COLOR_MAP[active.side.color].light,
                border: `1px solid ${COLOR_MAP[active.side.color].border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>
                {active.item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(lang, active.item.labelKey)}</h1>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{t(lang, active.side.labelKey)}</p>
              </div>
              {active.item.phase === 1 && (
                <span style={{ fontSize: '14px', padding: '3px 10px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', fontWeight: 600, flexShrink: 0 }}>
                  ✓ {t(lang, 'phase_ready')}
                </span>
              )}
              {active.item.phase > 1 && (
                <span style={{ fontSize: '14px', padding: '3px 10px', borderRadius: '6px', background: '#fef3c7', color: '#92400e', fontWeight: 600, flexShrink: 0 }}>
                  Phase {active.item.phase}
                </span>
              )}
              <button
                onClick={() => handleSelectTool(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '24px', padding: '4px', flexShrink: 0 }}
              >
                ×
              </button>
            </>
          ) : (
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setActiveTool(null); setShowSplash(true); }}>
              {/* No text — banner below handles title on homepage */}
            </div>
          )}

          {/* Right side: Language + User (world-class top-right pattern) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
            {/* Compact language switcher */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', gap: '1px' }}>
              {[
                { id: 'th', label: 'ไทย', flag: '🇹🇭' },
                { id: 'en', label: 'EN', flag: '🇬🇧' },
                { id: 'zh', label: '中文', flag: '🇨🇳' },
                { id: 'ja', label: '日本語', flag: '🇯🇵' },
              ].map(l => (
                <button key={l.id} onClick={() => setLang(l.id)} style={{
                  padding: isMobile ? '5px 6px' : '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: lang === l.id ? '#fff' : 'transparent',
                  color: lang === l.id ? CI.cyan : '#94a3b8',
                  fontSize: isMobile ? '11px' : '12px', fontWeight: lang === l.id ? 700 : 500, fontFamily: 'inherit',
                  boxShadow: lang === l.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}>
                  {isMobile ? l.flag : `${l.flag} ${l.label}`}
                </button>
              ))}
            </div>

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

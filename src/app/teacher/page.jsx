'use client';
import React, { useState, useEffect, useRef } from 'react';
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
const WordGuessingGame = dynamic(() => import('@/components/teacher/tools/WordGuessingGame'), { ssr: false });
const SpinWheel = dynamic(() => import('@/components/teacher/tools/SpinWheel'), { ssr: false });
const RandomGroup = dynamic(() => import('@/components/teacher/tools/RandomGroup'), { ssr: false });
const TeamScoreboard = dynamic(() => import('@/components/teacher/tools/TeamScoreboard'), { ssr: false });
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
      side: 'classroom_fun', labelKey: 'side_classroom_fun', color: 'cyan', icon: '🎉',
      groups: [
        { labelKey: 'group_fun_activities', items: [
          { id: 'interactive-activity',   labelKey: 'tool_interactive',    icon: '🎯', phase: 0 },
          { id: 'live-quiz',              labelKey: 'tool_live_quiz',      icon: '🎮', phase: 0 },
          { id: 'word-guessing',          labelKey: 'tool_word_guessing',  icon: '🔤', phase: 0 },
          { id: 'spin-wheel',             labelKey: 'tool_spin_wheel',     icon: '🎡', phase: 0 },
          { id: 'random-group',           labelKey: 'tool_random_group',   icon: '🎲', phase: 0 },
          { id: 'team-scoreboard',        labelKey: 'tool_scoreboard',     icon: '🏆', phase: 0 },
        ]},
        { labelKey: 'group_exam', items: [
          { id: 'smart-quiz',             labelKey: 'tool_smart_quiz',     icon: '📝', phase: 0 },
          { id: 'video-quiz',             labelKey: 'tool_video_quiz',     icon: '🎬', phase: 0 },
          { id: 'auto-grader',            labelKey: 'tool_auto_grader',    icon: '✅', phase: 0 },
        ]},
      ],
    },
    {
      side: 'documents', labelKey: 'side_documents', color: 'purple', icon: '📄',
      groups: [
        { labelKey: 'group_doc_create', items: [
          { id: 'lesson-planner',        labelKey: 'tool_lesson_planner',  icon: '📋', phase: 0 },
          { id: 'letter-writer',         labelKey: 'tool_letter',          icon: '✉️', phase: 0 },
          { id: 'slide-maker',           labelKey: 'tool_slide',           icon: '🖥️', phase: 0 },
          { id: 'ebook-builder',         labelKey: 'tool_ebook',           icon: '📖', phase: 0 },
          { id: 'certificate-generator', labelKey: 'tool_certificate',     icon: '🏆', phase: 0 },
          { id: 'form-builder',          labelKey: 'tool_form',            icon: '📄', phase: 0 },
          { id: 'ai-translator',         labelKey: 'tool_translator',      icon: '🌐', phase: 0 },
          { id: 'rubric-generator',      labelKey: 'tool_rubric',          icon: '📏', phase: 0 },
        ]},
      ],
    },
    {
      side: 'manage_share', labelKey: 'side_manage_share', color: 'teal', icon: '🔗',
      groups: [
        { labelKey: 'group_share_tools', items: [
          { id: 'qr-generator',         labelKey: 'tool_qr',             icon: '🔲', phase: 0 },
          { id: 'url-shortener',        labelKey: 'tool_url',            icon: '🔗', phase: 0 },
          { id: 'image-to-content',     labelKey: 'tool_image_content',  icon: '🖼️', phase: 0 },
          { id: 'pdf-toolkit',          labelKey: 'tool_pdf',            icon: '📑', phase: 0 },
          { id: 'template-library',     labelKey: 'tool_template',       icon: '📚', phase: 0 },
        ]},
      ],
    },
    {
      side: 'marketing', labelKey: 'side_marketing', color: 'gold', icon: '📣',
      groups: [
        { labelKey: 'group_content', items: [
          { id: 'marketing-content',    labelKey: 'tool_marketing_content', icon: '✨', phase: 0 },
          { id: 'auto-poster',          labelKey: 'tool_auto_poster',       icon: '🎨', phase: 0 },
        ]},
      ],
    },
    {
      // แยก: เช็กชื่อ = attendance_track | ตรวจสอบตาราง = schedule | ตรวจเอกสาร = doc_check
      side: 'attendance', labelKey: 'side_attendance', color: 'green', icon: '📅',
      groups: [
        { labelKey: 'group_attendance', items: [
          { id: 'attendance-tracker',   labelKey: 'tool_attendance',  icon: '📅', phase: 0 },
          { id: 'student-progress',     labelKey: 'tool_progress',    icon: '📈', phase: 0 },
        ]},
      ],
    },
    {
      side: 'check_verify', labelKey: 'side_check_verify', color: 'teal2', icon: '🗓️',
      groups: [
        { labelKey: 'group_schedule', items: [
          { id: 'lesson-planner',       labelKey: 'tool_lesson_planner', icon: '📋', phase: 0 },
          { id: 'schedule-manager',     labelKey: 'tool_schedule',       icon: '🗓️', phase: 0 },
        ]},
        { labelKey: 'group_doc_check', items: [
          { id: 'plagiarism-checker',   labelKey: 'tool_plagiarism',     icon: '🔍', phase: 0 },
          { id: 'ai-detector',          labelKey: 'tool_ai_detector',    icon: '🤖', phase: 0 },
          { id: 'writing-quality',      labelKey: 'tool_writing',        icon: '✍️', phase: 0 },
          { id: 'completeness-checker', labelKey: 'tool_completeness',   icon: '☑️', phase: 0 },
          { id: 'grammar-checker',      labelKey: 'tool_grammar',        icon: '🔤', phase: 0 },
        ]},
      ],
    },
    {
      side: 'project', labelKey: 'side_project', color: 'magenta', icon: '🗂️',
      groups: [
        { labelKey: 'group_projects', items: [
          { id: 'event-coordinator',    labelKey: 'tool_event',       icon: '🎪', phase: 0 },
          { id: 'budget-tracker',       labelKey: 'tool_budget',      icon: '💰', phase: 0 },
          { id: 'ta-coordinator',       labelKey: 'tool_ta',          icon: '👥', phase: 0 },
          { id: 'stakeholder-portal',   labelKey: 'tool_stakeholder', icon: '🏛️', phase: 0 },
        ]},
        { labelKey: 'group_report', items: [
          { id: 'meeting-notes',        labelKey: 'tool_meeting',     icon: '🗒️', phase: 0 },
          { id: 'kpi-dashboard',        labelKey: 'tool_kpi',         icon: '📉', phase: 0 },
          { id: 'line-broadcast',       labelKey: 'tool_broadcast',   icon: '📢', phase: 0 },
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
  'word-guessing': WordGuessingGame,
  'spin-wheel': SpinWheel,
  'random-group': RandomGroup,
  'team-scoreboard': TeamScoreboard,
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
  cyan:    { bg: CI.cyan,    light: '#e6f9ff', border: '#80daff', text: '#0090b8' },
  purple:  { bg: CI.purple,  light: '#f3edff', border: '#c4a8ff', text: '#5c35cc' },
  magenta: { bg: CI.magenta, light: '#fff0f6', border: '#ff80b8', text: '#b8005e' },
  gold:    { bg: '#e6a800',  light: '#fff8e1', border: '#ffd54f', text: '#9e7700' },
  orange:  { bg: '#f97316',  light: '#fff4ed', border: '#fdc79a', text: '#c2440a' },
  teal:    { bg: '#0d9488',  light: '#e6faf8', border: '#6eddd7', text: '#0a7a72' },
  teal2:   { bg: '#0369a1',  light: '#e0f2fe', border: '#7dd3fc', text: '#0369a1' },
  green:   { bg: '#16a34a',  light: '#dcfce7', border: '#86efac', text: '#15803d' },
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
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; });
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(interval); return 100; } return p + 1; });
    }, 48);
    const timer = setTimeout(() => onFinishRef.current(), 5000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  // Pixel font — clean 6 cols x 8 rows, balanced proportions
  const FONTS = {
    S: [
      [0,1,1,1,1,0],
      [1,1,0,0,1,1],
      [1,1,0,0,0,0],
      [0,1,1,1,0,0],
      [0,0,1,1,1,0],
      [0,0,0,0,1,1],
      [1,1,0,0,1,1],
      [0,1,1,1,1,0],
    ],
    P: [
      [1,1,1,1,1,0],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,1,1,1,0],
      [1,1,0,0,0,0],
      [1,1,0,0,0,0],
      [1,1,0,0,0,0],
      [1,1,0,0,0,0],
    ],
    U: [
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [0,1,1,1,1,0],
    ],
    B: [
      [1,1,1,1,1,0],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,1,1,1,0],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,0,0,1,1],
      [1,1,1,1,1,0],
    ],
  };
  const LETTERS_CH = ['S','P','U','B','U','S'];
  const PX = 5, GAP = 2, CHAR_GAP = 10;
  const charW = 6 * (PX + GAP);
  const totalW = LETTERS_CH.length * charW + (LETTERS_CH.length - 1) * CHAR_GAP;

  // Gradient: cyan #00b4e6 → purple #7c4dff → pink #e6007e based on X position
  const lerpColor = (t) => {
    const colors = [
      { r: 0, g: 180, b: 230 },   // #00b4e6 cyan
      { r: 124, g: 77, b: 255 },   // #7c4dff purple
      { r: 230, g: 0, b: 126 },    // #e6007e pink
    ];
    const seg = t * (colors.length - 1);
    const i = Math.min(Math.floor(seg), colors.length - 2);
    const f = seg - i;
    const r = Math.round(colors[i].r + (colors[i+1].r - colors[i].r) * f);
    const g = Math.round(colors[i].g + (colors[i+1].g - colors[i].g) * f);
    const b = Math.round(colors[i].b + (colors[i+1].b - colors[i].b) * f);
    return `rgb(${r},${g},${b})`;
  };

  // Build all pixel positions with gradient color
  const allPixels = [];
  let globalIdx = 0;
  LETTERS_CH.forEach((ch, li) => {
    const grid = FONTS[ch];
    const baseX = li * (charW + CHAR_GAP);
    grid.forEach((row, ry) => {
      row.forEach((on, rx) => {
        if (on) {
          const absX = baseX + rx * (PX + GAP);
          const t = Math.min(1, Math.max(0, absX / totalW));
          allPixels.push({ x: absX, y: ry * (PX + GAP), li, color: lerpColor(t), idx: globalIdx });
          globalIdx++;
        }
      });
    });
  });

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #0b0b24 0%, #121236 40%, #0b0b24 100%)',
      fontFamily: FONT, overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999,
    }}>
      <style>{`
        @keyframes pxFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pxBright {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes pxGlowPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes twinkle { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.7; } }
        @keyframes busRunCurve {
          0% { transform: translateX(-30%); }
          100% { transform: translateX(calc(100vw + 30%)); }
        }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes subtitleReveal {
          0% { opacity: 0; transform: translateY(12px); letter-spacing: 14px; }
          100% { opacity: 0.7; transform: translateY(0); letter-spacing: 7px; }
        }
      `}</style>

      {/* Floating stars */}
      {[...Array(40)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 5 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1.5px',
          height: i % 5 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1.5px',
          borderRadius: '50%',
          background: [CI.cyan, CI.gold, CI.magenta, '#fff', CI.purple][i % 5],
          top: `${(i * 13 + 3) % 90}%`, left: `${(i * 19 + 7) % 95}%`,
          animation: `twinkle ${2 + (i % 5) * 0.8}s ease-in-out infinite`,
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}

      {/* ===== PIXEL TITLE: SPUBUS ===== */}
      <div style={{ zIndex: 2, marginBottom: '24px' }}>
        <svg viewBox={`-10 -10 ${totalW + 20} ${8 * (PX + GAP) + 20}`}
          style={{ width: '64vw', maxWidth: '460px', height: 'auto' }}>
          <defs>
            <filter id="pxGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodOpacity="0.5" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="pxShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {allPixels.map((px, i) => {
            const fadeDelay = px.li * 0.08 + px.idx * 0.005;
            const glowDelay = (px.x / totalW) * 2.5;
            return (
              <g key={i}>
                {/* Soft glow behind */}
                <rect
                  x={px.x - 1} y={px.y - 1}
                  width={PX + 2} height={PX + 2}
                  rx="2" fill={px.color} opacity="0"
                  filter="url(#pxGlow)"
                  style={{ animation: `pxGlowPulse 5s ease-in-out ${glowDelay}s infinite, pxFadeIn 0.5s ease-out ${fadeDelay}s both` }}
                />
                {/* Main pixel block */}
                <rect
                  x={px.x} y={px.y}
                  width={PX} height={PX}
                  rx="1.8"
                  fill={px.color}
                  style={{
                    animation: `pxFadeIn 0.5s ease-out ${fadeDelay}s both, pxBright 5s ease-in-out ${glowDelay}s infinite`,
                  }}
                />
                {/* Glass-like highlight on top half */}
                <rect
                  x={px.x + 0.8} y={px.y + 0.5}
                  width={PX - 1.6} height={PX * 0.45}
                  rx="1" fill="url(#pxShine)" opacity="0"
                  style={{ animation: `pxFadeIn 0.4s ease-out ${fadeDelay + 0.15}s both` }}
                >
                  <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${fadeDelay + 0.15}s`} fill="freeze" />
                </rect>
              </g>
            );
          })}

        </svg>
      </div>

      {/* University name */}
      <div style={{
        fontSize: '14px', color: 'rgba(255,255,255,0.55)', zIndex: 2,
        fontWeight: 500, letterSpacing: '4px',
        opacity: 0, animation: 'subtitleReveal 0.6s ease-out 1s both',
      }}>
        คณะบริหารธุรกิจ&nbsp;&nbsp;มหาวิทยาลัยศรีปทุม
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
              <ellipse cx="90" cy="78" rx="70" ry="4" fill="rgba(0,180,230,0.15)" />
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
              <circle cx="-6" cy="58" r="4" fill="rgba(0,180,230,0.15)" />
              <circle cx="-16" cy="54" r="6" fill="rgba(0,180,230,0.08)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: '16px', width: '50%', maxWidth: '280px', zIndex: 3 }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%', borderRadius: '3px',
            background: `linear-gradient(90deg, ${CI.cyan}, ${CI.purple}, ${CI.magenta})`,
            transition: 'width 0.1s linear',
            boxShadow: `0 0 10px ${CI.cyan}60`,
          }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.35)', letterSpacing: '3px', fontWeight: 600 }}>
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
  const [activeSide, setActiveSide] = useState(null); // category overview
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSides, setExpandedSides] = useState({ classroom_fun: true, documents: false, manage_share: false, marketing: false, attendance: false, check_verify: false, project: false });
  const [lang, setLang] = useState('th');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [toolError, setToolError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isStudentMode, setIsStudentMode] = useState(false);

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

  // QR/attendance param handling — detect student mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hasStudentParam = params.get('quiz') || params.get('att') || params.get('livequiz') || params.get('video-quiz') || params.get('exit-ticket');
      if (params.get('quiz')) setActiveTool('smart-quiz');
      else if (params.get('att')) setActiveTool('attendance-tracker');
      else if (params.get('livequiz')) setActiveTool('live-quiz');
      else if (params.get('video-quiz')) setActiveTool('video-quiz');
      else if (params.get('exit-ticket')) setActiveTool('exit-ticket');

      if (hasStudentParam) {
        setIsStudentMode(true);
        setShowSplash(false); // skip splash for students
        setSidebarOpen(false);
      }
    }
  }, []);

  // Show splash screen on every page load/refresh (except student mode)
  if (showSplash && !isStudentMode) return <BusSplashScreen onFinish={() => setShowSplash(false)} />;

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#0b0b24', fontFamily: FONT,
    }}>
      <style>{`
        @keyframes loadSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes loadPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes loadBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)', borderTopColor: CI.cyan,
        animation: 'loadSpin 0.8s linear infinite', marginBottom: '16px',
      }} />
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
        <span style={{ color: '#fff' }}>SPUBUS</span> <span style={{ color: CI.magenta }}>SUPPORT</span>
      </div>
      <div style={{
        width: '180px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden', marginBottom: '8px',
      }}>
        <div style={{
          width: '50%', height: '100%', borderRadius: '2px',
          background: `linear-gradient(90deg, ${CI.cyan}, ${CI.purple}, ${CI.magenta})`,
          animation: 'loadBar 1.2s ease-in-out infinite',
        }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', animation: 'loadPulse 1.5s ease-in-out infinite' }}>
        กำลังเตรียมเครื่องมือ...
      </p>
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

  const handleGoHome = () => {
    setToolError(null);
    setActiveTool(null);
    setActiveSide(null);
    if (isMobile) setMobileMenuOpen(false);
  };

  const handleSelectTool = (toolId) => {
    setToolError(null);
    setActiveTool(toolId);
    if (toolId) {
      // Auto-find which category this tool belongs to
      for (const s of MENU_ITEMS) {
        for (const g of s.groups) {
          if (g.items.find(i => i.id === toolId)) {
            setActiveSide(s.side);
            setExpandedSides(prev => ({ ...prev, [s.side]: true }));
            break;
          }
        }
      }
    }
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
          <button onClick={handleGoHome} style={{
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
              <button onClick={() => {
                // Expand submenu
                toggleSide(side.side);
                // Navigate to category overview
                setActiveSide(side.side);
                setActiveTool(null);
                setToolError(null);
                if (isMobile) setMobileMenuOpen(false);
              }} style={{
                width: '100%', padding: '12px 16px', border: 'none',
                background: activeSide === side.side && !activeTool
                  ? `linear-gradient(135deg, ${c.bg}, ${c.bg})`
                  : `linear-gradient(135deg, ${c.bg}cc, ${c.bg}aa)`,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '10px', color: '#fff', fontSize: '15px', fontWeight: 800,
                letterSpacing: '0.04em', textAlign: 'left', fontFamily: 'inherit',
                borderRadius: '12px',
                boxShadow: activeSide === side.side && !activeTool
                  ? `0 4px 16px ${c.bg}60, 0 0 0 2px #fff`
                  : `0 3px 12px ${c.bg}40`,
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0, filter: 'brightness(1.2)' }}>{side.icon}</span>
                <span style={{ flex: 1, textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>{t(lang, side.labelKey)}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', transition: 'transform 0.25s', transform: expandedSides[side.side] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
              </button>

              {expandedSides[side.side] && <style>{`@keyframes submenuFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>}
              {expandedSides[side.side] && side.groups.map(group => (
                <div key={group.labelKey} style={{ marginBottom: '4px', animation: 'submenuFadeIn 0.2s ease' }}>
                  <div style={{ padding: '6px 16px 4px', color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {t(lang, group.labelKey)}
                  </div>
                  {group.items.map(item => {
                    const isActive = activeTool === item.id;
                    return (
                    <div key={item.id} style={{ padding: '1px 8px' }}>
                      <button
                        onClick={() => handleSelectTool(item.id)}
                        title={t(lang, item.labelKey)}
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '10px',
                          background: isActive ? c.light : 'transparent',
                          border: isActive ? `2px solid ${c.bg}` : '2px solid transparent',
                          color: isActive ? c.text : '#374151',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                          fontSize: '14px', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                          fontWeight: isActive ? 700 : 500,
                          boxShadow: isActive ? `0 0 12px ${c.bg}35, inset 0 0 0 1px ${c.bg}20` : 'none',
                        }}
                      >
                        <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ flex: 1, lineHeight: 1.3 }}>{t(lang, item.labelKey)}</span>
                        {item.phase === 1 && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '6px', background: isActive ? `${c.bg}20` : '#dcfce7', color: isActive ? c.bg : '#16a34a', fontWeight: 700 }}>✓</span>}
                        {item.phase > 1 && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '6px', background: isActive ? `${c.bg}15` : '#f1f5f9', color: isActive ? c.bg : '#94a3b8', fontWeight: 600 }}>P{item.phase}</span>}
                      </button>
                    </div>
                    );
                  })}
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
        <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>SPUBUS MAGIC v1.0</div>
      </div>
    </div>
  );

  // ===== STUDENT MODE: Full-screen, no sidebar, no header =====
  if (isStudentMode && ActiveComponent) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: FONT, background: '#f8fafc' }}>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: CI.dark, color: '#fff', fontSize: '16px', borderRadius: '10px', fontFamily: FONT } }} />
        {/* Minimal student header */}
        <div style={{
          padding: '8px 16px', background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '14px', color: '#fff', fontWeight: 700 }}>
            <span style={{ color: '#fff' }}>SPUBUS</span>
          </span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>SUPPORT</span>
        </div>
        {/* Tool content only — no sidebar */}
        <ActiveComponent />
      </div>
    );
  }

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
              {/* Back button → goes to category overview */}
              <button
                onClick={() => { setActiveTool(null); setToolError(null); }}
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
                ← {isMobile ? '' : t(lang, active.side.labelKey)}
              </button>
              {/* Breadcrumb: Section / Tool */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            </>
          ) : activeSide && !activeTool ? (() => {
            // Category overview breadcrumb
            const sideData = MENU_ITEMS.find(s => s.side === activeSide);
            const c = sideData ? COLOR_MAP[sideData.color] : COLOR_MAP.cyan;
            return (
              <>
                <button onClick={handleGoHome} style={{
                  background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b',
                  cursor: 'pointer', borderRadius: '10px', padding: '6px 12px',
                  fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s',
                }}>
                  ← {isMobile ? '' : t(lang, 'home')}
                </button>
                <span style={{ color: '#cbd5e1', fontSize: '14px', flexShrink: 0 }}>/</span>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{sideData?.icon}</span>
                <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sideData ? t(lang, sideData.labelKey) : ''}
                </h1>
                <span style={{ marginLeft: '6px', fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: c.light, color: c.text, fontWeight: 700, flexShrink: 0 }}>
                  {sideData?.groups.reduce((a, g) => a + g.items.length, 0)} เครื่องมือ
                </span>
              </>
            );
          })() : (
            <div style={{ flex: 1 }} />
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
        <style>{`
          @keyframes pageSlideIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {toolError ? (
            <ErrorFallback error={toolError} onReset={() => { setToolError(null); setActiveTool(null); }} />
          ) : !activeTool ? (
            <div key={activeSide || 'home'} style={{ animation: 'pageSlideIn 0.22s ease-out', height: '100%' }}>
              <TeacherDashboard
                onSelectTool={handleSelectTool}
                menuItems={MENU_ITEMS}
                colorMap={COLOR_MAP}
                lang={lang}
                selectedCategory={activeSide}
                onCategoryChange={(side) => {
                  setActiveSide(side);
                  if (side) setExpandedSides(prev => ({ ...prev, [side]: true }));
                }}
              />
            </div>
          ) : ActiveComponent ? (
            <div key={activeTool} style={{ animation: 'pageSlideIn 0.22s ease-out', height: '100%' }}>
              <ErrorBoundaryWrapper onError={(err) => setToolError(err)} onReset={() => { setToolError(null); setActiveTool(null); }}>
                <ActiveComponent onSelectTool={handleSelectTool} lang={lang} />
              </ErrorBoundaryWrapper>
            </div>
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

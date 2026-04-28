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
const BusSanookGame = dynamic(() => import('@/components/teacher/tools/BusSanookGame'), { ssr: false });
const SnakeLadderGame = dynamic(() => import('@/components/teacher/tools/SnakeLadderGame'), { ssr: false });
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
          { id: 'bussanook-game',          labelKey: 'tool_bussanook',      icon: '🎮', phase: 0 },
          { id: 'snake-ladder-game',       labelKey: 'tool_snake_ladder',   icon: '🐍', phase: 0 },
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
  'bussanook-game': BusSanookGame,
  'snake-ladder-game': SnakeLadderGame,
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
    }, 50);
    const timer = setTimeout(() => onFinishRef.current(), 5200);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  // Building heights for city skyline
  const buildings = [
    {x:0,   w:70,  h:180, floors:9, color:'#c8dae8'},
    {x:60,  w:50,  h:140, floors:7, color:'#d4e5f0'},
    {x:100, w:80,  h:220, floors:11,color:'#bdd2e2'},
    {x:170, w:55,  h:160, floors:8, color:'#ccdaea'},
    {x:215, w:45,  h:120, floors:6, color:'#d8e8f2'},
    {x:250, w:90,  h:200, floors:10,color:'#c2d6e6'},
    {x:330, w:60,  h:170, floors:8, color:'#cad8e8'},
    {x:380, w:75,  h:240, floors:12,color:'#baccde'},
    {x:445, w:50,  h:145, floors:7, color:'#d0dfe9'},
    {x:485, w:85,  h:195, floors:10,color:'#c5d5e5'},
    {x:560, w:55,  h:155, floors:8, color:'#cddbeb'},
    {x:605, w:70,  h:230, floors:11,color:'#bccde0'},
    {x:665, w:60,  h:160, floors:8, color:'#c8d8e8'},
    {x:715, w:80,  h:200, floors:10,color:'#c0d2e4'},
    {x:785, w:50,  h:135, floors:7, color:'#d2e0ec'},
    {x:825, w:75,  h:220, floors:11,color:'#bbcfe1'},
    {x:890, w:65,  h:180, floors:9, color:'#c6d6e6'},
    {x:945, w:55,  h:150, floors:7, color:'#cfdde9'},
    {x:990, w:80,  h:210, floors:10,color:'#bfcfdf'},
    {x:1060,w:60,  h:170, floors:8, color:'#c8d8e6'},
    {x:1110,w:90,  h:250, floors:12,color:'#b8cade'},
    {x:1190,w:55,  h:140, floors:7, color:'#d0dfe8'},
    {x:1235,w:75,  h:195, floors:9, color:'#c2d4e4'},
    {x:1300,w:65,  h:220, floors:11,color:'#bccde0'},
    {x:1355,w:80,  h:175, floors:8, color:'#c6d6e6'},
    {x:1425,w:55,  h:145, floors:7, color:'#cdd8ea'},
  ];

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #e8f4fb 0%, #f0f8ff 35%, #ddeef8 70%, #c8dfe8 100%)',
      fontFamily: FONT, overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999,
    }}>
      <style>{`
        @keyframes trainRun {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(120vw); }
        }
        @keyframes titleDrop {
          0%   { opacity:0; transform:translateY(-30px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes subFade {
          0%   { opacity:0; transform:translateY(10px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes cloudDrift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-60px); }
        }
        @keyframes treeSway {
          0%,100% { transform:rotate(-1.5deg); transform-origin:bottom center; }
          50%      { transform:rotate(1.5deg);  transform-origin:bottom center; }
        }
        @keyframes sparkle {
          0%,100% { opacity:0; transform:scale(0.5); }
          50%      { opacity:1; transform:scale(1.2); }
        }
      `}</style>

      {/* ===== Sky gradient + clouds ===== */}
      <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'60%', zIndex:0 }} viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5e3f7"/>
            <stop offset="100%" stopColor="#e8f4fb" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect width="1440" height="400" fill="url(#skyGrad)"/>
        {/* Clouds */}
        {[
          {x:80,  y:50, s:1.1},
          {x:280, y:30, s:0.8},
          {x:560, y:60, s:1.3},
          {x:820, y:25, s:0.9},
          {x:1100,y:55, s:1.0},
          {x:1340,y:40, s:0.7},
        ].map((c,i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.s})`}
             style={{animation:`cloudDrift ${8+i*1.5}s ease-in-out infinite alternate`}}>
            <ellipse cx="60" cy="30" rx="55" ry="22" fill="white" opacity="0.75"/>
            <ellipse cx="35" cy="35" rx="35" ry="16" fill="white" opacity="0.6"/>
            <ellipse cx="85" cy="36" rx="30" ry="14" fill="white" opacity="0.65"/>
          </g>
        ))}
      </svg>

      {/* ===== City buildings ===== */}
      <svg style={{ position:'absolute', bottom:'22%', left:0, width:'100%', height:'55%', zIndex:1 }}
           viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="bldFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0"/>
            <stop offset="100%" stopColor="white" stopOpacity="0.6"/>
          </linearGradient>
        </defs>
        {buildings.map((b,i) => {
          const baseY = 320 - b.h;
          const floorH = Math.floor(b.h / b.floors);
          return (
            <g key={i} opacity="0.85">
              <rect x={b.x} y={baseY} width={b.w} height={b.h} fill={b.color} rx="2"/>
              {/* Window grid */}
              {Array.from({length:b.floors-1},(_,fi)=>
                Array.from({length:Math.floor(b.w/18)},(_,wi)=>(
                  <rect key={`${fi}-${wi}`}
                    x={b.x+6+wi*16} y={baseY+6+fi*floorH}
                    width={8} height={floorH-8}
                    fill={(fi+wi)%3===0?'#a8c8e0':'#b8d4ea'} rx="1" opacity="0.8"/>
                ))
              )}
              {/* Fade overlay at bottom */}
              <rect x={b.x} y={baseY} width={b.w} height={b.h} fill="url(#bldFade)" rx="2"/>
            </g>
          );
        })}
      </svg>

      {/* ===== TITLE: SPUBUS MAGIC ===== */}
      <div style={{ position:'relative', zIndex:10, textAlign:'center', marginBottom:'8px' }}>
        <div style={{
          animation:'titleDrop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
          lineHeight:1,
        }}>
          <span style={{
            fontSize:'clamp(42px,8vw,86px)', fontWeight:900, letterSpacing:'-1px',
            background:'linear-gradient(135deg, #1a6fbe 0%, #2196e0 40%, #0288d1 60%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            fontFamily:"'Kanit','DB XDMAN X',sans-serif",
          }}>SPUBUS&nbsp;</span>
          <span style={{
            fontSize:'clamp(42px,8vw,86px)', fontWeight:900, letterSpacing:'-1px',
            background:'linear-gradient(135deg, #e6007e 0%, #c2185b 40%, #7c4dff 80%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            fontFamily:"'Kanit','DB XDMAN X',sans-serif",
          }}>MAGIC</span>
        </div>
        <div style={{
          fontSize:'clamp(13px,2vw,18px)', color:'#4a7fa8', letterSpacing:'3px', fontWeight:500,
          marginTop:'6px', animation:'subFade 0.6s ease-out 0.9s both',
        }}>
          คณะบริหารธุรกิจ&nbsp;&nbsp;มหาวิทยาลัยศรีปทุม
        </div>
        {/* Sparkles */}
        {[['-30px','-10px','1.2s'],['calc(100%+20px)','-15px','1.5s'],['20%','-25px','1.8s'],['75%','-20px','1.3s']].map(([l,t,d],i)=>(
          <div key={i} style={{
            position:'absolute', left:l, top:t, fontSize:'20px',
            animation:`sparkle 2s ease-in-out ${d} infinite`,
          }}>✨</div>
        ))}
      </div>

      {/* ===== Elevated rail platform ===== */}
      <div style={{ position:'absolute', bottom:'18%', left:0, width:'100%', zIndex:3 }}>
        <svg style={{ width:'100%', height:'90px' }} viewBox="0 0 1440 90" preserveAspectRatio="none">
          {/* Pillars */}
          {Array.from({length:12},(_,i)=>(
            <g key={i}>
              <rect x={i*130+60} y={30} width={16} height={60} fill="#b0c8d8" rx="2"/>
              <rect x={i*130+52} y={28} width={32} height={8} fill="#c8dae8" rx="2"/>
            </g>
          ))}
          {/* Beam / deck underside */}
          <rect x="0" y="22" width="1440" height="14" fill="#c8dae0" rx="2"/>
          {/* Rail surface */}
          <rect x="0" y="8" width="1440" height="18" fill="#d8e8f0"/>
          {/* Two rails */}
          <rect x="0" y="8"  width="1440" height="4" fill="#a0b8c8" rx="1"/>
          <rect x="0" y="20" width="1440" height="4" fill="#a0b8c8" rx="1"/>
          {/* Rail sleepers */}
          {Array.from({length:72},(_,i)=>(
            <rect key={i} x={i*20} y="10" width="6" height="14" fill="#90aabb" rx="1" opacity="0.5"/>
          ))}
          {/* Top rail surface line */}
          <rect x="0" y="8" width="1440" height="2" fill="#e0edf5"/>
        </svg>
      </div>

      {/* ===== BTS TRAIN ===== */}
      <div style={{
        position:'absolute', bottom:'calc(18% + 18px)', left:0, zIndex:5,
        animation:'trainRun 4.5s cubic-bezier(0.4,0,0.6,1) 0.5s infinite',
      }}>
        <svg width="520" height="72" viewBox="0 0 520 72">
          {/* Shadow */}
          <ellipse cx="260" cy="70" rx="240" ry="5" fill="rgba(0,80,120,0.12)"/>

          {/* ── Carriage 1 ── */}
          <rect x="8"   y="4" width="155" height="52" rx="8" fill="#e8f0f8"/>
          <rect x="8"   y="4" width="155" height="10" rx="8" fill="#d0dde8"/>
          <rect x="8"   y="38" width="155" height="4"  fill="#c2485a"/>
          <rect x="8"   y="42" width="155" height="4"  fill="#1565c0"/>
          {[22,52,82,112,135].map((wx,i)=>(
            <g key={i}>
              <rect x={wx} y="14" width="20" height="22" rx="3" fill="#b8d4f0" stroke="#8ab0d0" strokeWidth="0.8"/>
              <rect x={wx+1} y="15" width="18" height="10" rx="2" fill="white" opacity="0.7"/>
            </g>
          ))}
          {/* Coupler gap */}
          <rect x="162" y="22" width="12" height="14" rx="3" fill="#c5d5e2"/>

          {/* ── Carriage 2 (middle) ── */}
          <rect x="174" y="4" width="170" height="52" rx="8" fill="#e8f0f8"/>
          <rect x="174" y="4" width="170" height="10" rx="8" fill="#d0dde8"/>
          <rect x="174" y="38" width="170" height="4"  fill="#c2485a"/>
          <rect x="174" y="42" width="170" height="4"  fill="#1565c0"/>
          {[188,218,248,278,308].map((wx,i)=>(
            <g key={i}>
              <rect x={wx} y="14" width="20" height="22" rx="3" fill="#b8d4f0" stroke="#8ab0d0" strokeWidth="0.8"/>
              <rect x={wx+1} y="15" width="18" height="10" rx="2" fill="white" opacity="0.7"/>
            </g>
          ))}
          <rect x="344" y="22" width="12" height="14" rx="3" fill="#c5d5e2"/>

          {/* ── Carriage 3 (front) ── */}
          <rect x="356" y="4" width="155" height="52" rx="8" fill="#e8f0f8"/>
          <rect x="356" y="4" width="155" height="10" rx="8" fill="#d0dde8"/>
          <rect x="356" y="38" width="155" height="4"  fill="#c2485a"/>
          <rect x="356" y="42" width="155" height="4"  fill="#1565c0"/>
          {/* Front cab nose */}
          <path d="M498,4 Q515,4 515,15 L515,50 Q515,56 498,56 Z" fill="#d8e5ef"/>
          <rect x="468" y="14" width="28" height="22" rx="4" fill="#b8d4f0" stroke="#8ab0d0" strokeWidth="0.8"/>
          <rect x="469" y="15" width="26" height="10" rx="2" fill="white" opacity="0.8"/>
          {[370,400,430].map((wx,i)=>(
            <g key={i}>
              <rect x={wx} y="14" width="20" height="22" rx="3" fill="#b8d4f0" stroke="#8ab0d0" strokeWidth="0.8"/>
              <rect x={wx+1} y="15" width="18" height="10" rx="2" fill="white" opacity="0.7"/>
            </g>
          ))}
          {/* Headlight */}
          <circle cx="510" cy="24" r="5" fill="#fff9c4" opacity="0.9"/>
          <circle cx="510" cy="38" r="4" fill="#ffcc02" opacity="0.8"/>
          {/* Pantograph */}
          <line x1="260" y1="4" x2="240" y2="-8" stroke="#889aaa" strokeWidth="1.5"/>
          <line x1="260" y1="4" x2="280" y2="-8" stroke="#889aaa" strokeWidth="1.5"/>
          <line x1="240" y1="-8" x2="280" y2="-8" stroke="#667788" strokeWidth="2"/>
        </svg>
      </div>

      {/* ===== Trees ===== */}
      <div style={{ position:'absolute', bottom:'16%', left:0, width:'100%', zIndex:4 }}>
        <svg style={{ width:'100%', height:'60px' }} viewBox="0 0 1440 60" preserveAspectRatio="xMidYMax meet">
          {[40,130,260,390,490,580,670,780,890,980,1060,1160,1280,1380].map((tx,i)=>{
            const s = 0.8 + (i%3)*0.2;
            const c = i%2===0?'#4caf50':'#66bb6a';
            return (
              <g key={i} transform={`translate(${tx},0) scale(${s})`}
                 style={{animation:`treeSway ${2.5+i*0.3}s ease-in-out infinite`, animationDelay:`${i*0.2}s`}}>
                <polygon points="15,0 30,30 0,30" fill={c}/>
                <polygon points="15,10 32,38 -2,38" fill={i%2===0?'#43a047':'#57a857'}/>
                <rect x="12" y="38" width="6" height="12" fill="#795548"/>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ===== Ground strip ===== */}
      <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'18%', zIndex:2,
        background:'linear-gradient(180deg,#c8dde8 0%,#b0c8d4 100%)'
      }}/>

      {/* ===== Progress bar ===== */}
      <div style={{ position:'absolute', bottom:'20px', width:'50%', maxWidth:'300px', zIndex:10 }}>
        <div style={{ height:'5px', borderRadius:'3px', background:'rgba(0,80,120,0.12)', overflow:'hidden' }}>
          <div style={{
            width:`${progress}%`, height:'100%', borderRadius:'3px',
            background:'linear-gradient(90deg,#1565c0,#0288d1,#e6007e)',
            transition:'width 0.12s linear',
            boxShadow:'0 0 8px rgba(2,136,209,0.5)',
          }}/>
        </div>
        <div style={{ textAlign:'center', marginTop:'6px', fontSize:'10px', color:'#4a7fa8', letterSpacing:'3px', fontWeight:700 }}>
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
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%' }}>
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
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', maxWidth: '100%' }}>
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

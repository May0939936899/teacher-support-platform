import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ── Storage (prefix SC_) ─────────────────────────────────────────────────────
const memRooms = globalThis.__stampcardRooms || (globalThis.__stampcardRooms = new Map());
let sbOk = null;
let sbCheckedAt = 0;
const SB_RECHECK_MS = 60_000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function json(data, status = 200) { return NextResponse.json(data, { status, headers: cors }); }

async function checkSb() {
  const now = Date.now();
  if (sbOk === false && (now - sbCheckedAt) < SB_RECHECK_MS) return false;
  if (sbOk === true) return true;
  sbCheckedAt = now;
  try {
    const sb = createAdminClient();
    if (!sb) { sbOk = false; return false; }
    const { error } = await sb.from('scoreboard_sessions').select('session_id').limit(1);
    sbOk = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    return sbOk;
  } catch { sbOk = false; return false; }
}

const PREFIX = 'SC_';
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

// ── ALWAYS try Supabase first, no stale gate. Fail loudly on create. ────────
async function getClass(code) {
  try {
    const sb = createAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from('scoreboard_sessions')
        .select('session_data, updated_at')
        .eq('session_id', PREFIX + code)
        .maybeSingle();
      if (!error && data?.session_data) {
        const updatedMs = new Date(data.updated_at).getTime();
        if (Date.now() - updatedMs <= TTL_MS) {
          // Warm memory cache so subsequent reads are faster
          memRooms.set(code, data.session_data);
          return data.session_data;
        }
      }
    }
  } catch (e) {
    console.warn('[stampcard] getClass DB:', e?.message);
  }
  // Memory fallback — only useful within same Lambda's lifetime
  return memRooms.get(code) || null;
}

// strict: throws if DB write fails (caller can decide to surface error)
async function saveClass(code, state, { strict = false } = {}) {
  memRooms.set(code, state);
  try {
    const sb = createAdminClient();
    if (!sb) {
      if (strict) throw new Error('Supabase client unavailable');
      console.warn('[stampcard] no Supabase client — memory only');
      return;
    }
    const { error } = await sb.from('scoreboard_sessions').upsert({
      session_id: PREFIX + code,
      session_data: state,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      if (strict) throw new Error(error.message || 'DB write failed');
      console.warn('[stampcard] saveClass DB error:', error.message);
    }
  } catch (e) {
    if (strict) throw e;
    console.warn('[stampcard] saveClass DB:', e?.message);
  }
}

async function mutateClass(code, mutator) {
  try {
    const sb = createAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from('scoreboard_sessions')
        .select('session_data')
        .eq('session_id', PREFIX + code)
        .maybeSingle();
      if (!error && data?.session_data) {
        const state = data.session_data;
        const result = mutator(state);
        if (result === false) return state; // mutator can abort
        const { error: updErr } = await sb
          .from('scoreboard_sessions')
          .update({ session_data: state, updated_at: new Date().toISOString() })
          .eq('session_id', PREFIX + code);
        if (updErr) console.warn('[stampcard] mutateClass DB update:', updErr.message);
        memRooms.set(code, state);
        return state;
      }
    }
  } catch (e) {
    console.warn('[stampcard] mutateClass DB:', e?.message);
  }
  const r = memRooms.get(code);
  if (!r) return null;
  const result = mutator(r);
  if (result === false) return r;
  return r;
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'S' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function genQrToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ── Stamp themes (50 stamps each) ────────────────────────────────────────────
const THEMES = {
  space: {
    name: 'Space Journey 🚀',
    stamps: ['🚀','🌟','⭐','✨','🌙','🌌','🌠','☄️','🛸','👽','🪐','🌍','🌎','🌏','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','💫','🌃','🌉','🛰️','🔭','📡','🌅','🌄','🌇','🌆','🏙️','🌌','✨','⭐','🌟','💫','🌙','☄️','🚀','👨‍🚀','🧑‍🚀','👩‍🚀','🛸','👾','🤖','🌠','🌌','🪐'],
  },
  anime: {
    name: 'Anime Academy 🎌',
    stamps: ['🌸','🍙','🎎','🌊','🗻','🎌','🍡','🍵','🐉','🎏','🎴','🎭','🎀','⛩️','🍣','🍱','🍜','🥢','🍢','🎋','🎐','🌸','🦊','🌺','🌼','🍃','🎨','✏️','📚','🎓','🏯','🌸','🍡','🍵','🍙','🎏','🎌','🎴','🎀','⛩️','🌊','🗻','🎎','🎐','🎋','🌸','🦊','🐉','🐱','🍱'],
  },
  animals: {
    name: 'Cute Animals 🐾',
    stamps: ['🐶','🐱','🐰','🐻','🐼','🐨','🐸','🦊','🐯','🦁','🐮','🐷','🐔','🐧','🦄','🐹','🐭','🐺','🐗','🐴','🦓','🦒','🐘','🦏','🦛','🐪','🐫','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🐇','🐁','🐀','🐿️','🦔'],
  },
  food: {
    name: 'Food Festival 🍕',
    stamps: ['🍕','🍔','🍟','🌭','🥪','🌮','🌯','🥗','🍿','🥨','🧀','🥚','🍳','🧇','🥞','🧈','🍞','🥐','🥖','🥯','🥞','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🍿','🥗','🌮','🌯','🥙','🍝','🍜','🍲','🍣','🍱','🍤','🥟','🍙','🍚','🍘','🍥','🍡','🍢','🍧','🍨'],
  },
};

export async function OPTIONS() { return new Response(null, { status: 204, headers: cors }); }

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').toUpperCase().trim();
  const studentId = (searchParams.get('studentId') || '').trim();
  if (!code) return json({ error: 'ระบุ code' }, 400);

  const cls = await getClass(code);
  if (!cls) return json({ error: 'ไม่พบห้องเรียน' }, 404);

  const publicInfo = {
    code,
    course: cls.course, courseName: cls.courseName,
    section: cls.section, teacher: cls.teacher,
    totalSessions: cls.totalSessions || 15,
    theme: cls.theme,
    stamps: THEMES[cls.theme]?.stamps || THEMES.space.stamps,
    themeName: THEMES[cls.theme]?.name || THEMES.space.name,
    activeSession: cls.activeSession || null, // {sessionNumber, qrToken, openUntil}
    studentCount: (cls.students || []).length,
  };

  if (studentId) {
    const me = (cls.students || []).find(s => String(s.studentId) === studentId);
    if (me) {
      const stampCount = Object.keys(me.stamps || {}).length;
      const total = cls.totalSessions || 15;
      // Compute badges
      const badges = computeBadges(me, total);
      return json({
        ...publicInfo,
        me: {
          studentId: me.studentId,
          firstName: me.firstName,
          lastName: me.lastName,
          stamps: me.stamps || {},
          points: me.points || 0,
          badges,
          stampCount,
          golden: stampCount >= total,
        },
      });
    }
    return json({ ...publicInfo, me: null });
  }

  // Teacher view
  return json({
    ...publicInfo,
    students: cls.students || [],
    sessions: cls.sessions || [],
  });
}

function computeBadges(me, totalSessions) {
  const stamps = me.stamps || {};
  const stampCount = Object.keys(stamps).length;
  const sessionsAttended = Object.keys(stamps).map(Number).sort((a,b)=>a-b);
  // Streak = consecutive sessions
  let streak = 0, maxStreak = 0;
  for (let i = 1; i <= totalSessions; i++) {
    if (stamps[i]) { streak++; if (streak > maxStreak) maxStreak = streak; }
    else streak = 0;
  }
  const earlyBird = Object.values(stamps).filter(s => {
    if (!s.at) return false;
    const h = new Date(s.at).getHours();
    return h < 9; // checked in before 9am
  }).length;

  return [
    { id: 'first_step',   name: 'First Step 🌱',         desc: 'เช็กชื่อครั้งแรก',
      unlocked: stampCount >= 1, progress: stampCount, target: 1 },
    { id: 'active',       name: 'Active Learner 🎯',     desc: 'เช็กชื่อ 5 ครั้ง',
      unlocked: stampCount >= 5, progress: stampCount, target: 5 },
    { id: 'committed',    name: 'Committed 💪',          desc: 'เช็กชื่อ 10 ครั้ง',
      unlocked: stampCount >= 10, progress: stampCount, target: 10 },
    { id: 'streak3',      name: 'On Fire 🔥',            desc: 'เช็กชื่อต่อเนื่อง 3 ครั้ง',
      unlocked: maxStreak >= 3, progress: maxStreak, target: 3 },
    { id: 'streak5',      name: 'Unstoppable 🚀',        desc: 'เช็กชื่อต่อเนื่อง 5 ครั้ง',
      unlocked: maxStreak >= 5, progress: maxStreak, target: 5 },
    { id: 'early',        name: 'Early Bird ⏰',         desc: 'มาก่อน 9 โมง 3 ครั้ง',
      unlocked: earlyBird >= 3, progress: earlyBird, target: 3 },
    { id: 'perfect',      name: 'Perfect Attendance 🏆', desc: `เช็กชื่อครบ ${totalSessions} ครั้ง`,
      unlocked: stampCount >= totalSessions, progress: stampCount, target: totalSessions },
  ];
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { action } = body;

  // CREATE CLASS
  if (action === 'create') {
    const { course, courseName, section, teacher, totalSessions = 15, theme = 'space' } = body;
    if (!course || !courseName) return json({ error: 'กรอกรหัสและชื่อวิชา' }, 400);
    if (!THEMES[theme]) return json({ error: 'ธีมไม่ถูกต้อง' }, 400);

    const code = genCode();
    const state = {
      course: String(course).trim(),
      courseName: String(courseName).trim(),
      section: String(section || '1').trim(),
      teacher: String(teacher || 'อาจารย์').trim(),
      totalSessions: Math.max(1, Math.min(50, Number(totalSessions) || 15)),
      theme,
      students: [],
      sessions: [],
      activeSession: null,
      createdAt: Date.now(),
    };
    try {
      // STRICT: must persist to Supabase before we report success — otherwise
      // the user gets a code that may vanish when the Lambda recycles.
      await saveClass(code, state, { strict: true });
    } catch (e) {
      console.error('[stampcard] create persist failed:', e?.message);
      return json({
        error: 'ไม่สามารถบันทึกข้อมูลห้องลงเซิร์ฟเวอร์ได้ — กรุณาลองใหม่อีกครั้ง',
        details: e?.message,
      }, 503);
    }
    // Verify by reading back (paranoia check — confirms write succeeded)
    const verified = await getClass(code);
    if (!verified) {
      console.error('[stampcard] create verification failed — class missing after save');
      return json({
        error: 'บันทึกไม่ครบถ้วน กรุณาลองใหม่',
      }, 503);
    }
    return json({ success: true, code, class: state });
  }

  const code = (body.code || '').toUpperCase().trim();
  if (!code) return json({ error: 'ระบุ code' }, 400);

  // OPEN SESSION (teacher generates QR)
  if (action === 'open_session') {
    const { sessionNumber, durationMinutes = 15 } = body;
    let errMsg = null;
    const updated = await mutateClass(code, c => {
      const n = Number(sessionNumber);
      if (n < 1 || n > (c.totalSessions || 15)) {
        errMsg = `Session ต้องอยู่ระหว่าง 1-${c.totalSessions || 15}`;
        return false;
      }
      const qrToken = genQrToken();
      const openedAt = new Date().toISOString();
      const openUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
      c.sessions = c.sessions || [];
      // Replace any existing session with this number
      c.sessions = c.sessions.filter(s => s.number !== n);
      c.sessions.push({ number: n, qrToken, openedAt, openUntil });
      c.activeSession = { number: n, qrToken, openedAt, openUntil };
    });
    if (errMsg) return json({ error: errMsg }, 400);
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);
    return json({ success: true, activeSession: updated.activeSession });
  }

  // CLOSE SESSION
  if (action === 'close_session') {
    const updated = await mutateClass(code, c => { c.activeSession = null; });
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);
    return json({ success: true });
  }

  // STUDENT JOIN (auto-enroll, no password)
  if (action === 'student_join') {
    const { studentId, firstName, lastName } = body;
    if (!studentId || !firstName) return json({ error: 'กรอกรหัสและชื่อ' }, 400);
    const sid = String(studentId).trim();
    const updated = await mutateClass(code, c => {
      c.students = c.students || [];
      const existing = c.students.find(s => String(s.studentId) === sid);
      if (existing) {
        // Update name if changed
        existing.firstName = String(firstName).trim();
        existing.lastName = String(lastName || '').trim();
        return;
      }
      c.students.push({
        studentId: sid,
        firstName: String(firstName).trim(),
        lastName: String(lastName || '').trim(),
        stamps: {},   // { sessionNumber: { stamp: '🌟', at: ISO, points: 10 } }
        points: 0,
        joinedAt: new Date().toISOString(),
      });
    });
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);
    return json({ success: true });
  }

  // CHECK IN (student scans QR)
  if (action === 'check_in') {
    const { qrToken, studentId } = body;
    if (!qrToken || !studentId) return json({ error: 'ข้อมูลไม่ครบ' }, 400);

    let resultMsg = null, resultStamp = null, resultSession = null, alreadyChecked = false;
    let resultPointsEarned = 0, resultGolden = false;

    const updated = await mutateClass(code, c => {
      // Validate session
      const active = c.activeSession;
      if (!active || active.qrToken !== qrToken) {
        resultMsg = 'qr_invalid';
        return false;
      }
      if (new Date(active.openUntil) < new Date()) {
        resultMsg = 'qr_expired';
        return false;
      }
      // Find student
      const stu = (c.students || []).find(s => String(s.studentId) === String(studentId));
      if (!stu) {
        resultMsg = 'not_enrolled';
        return false;
      }
      // Already checked
      stu.stamps = stu.stamps || {};
      if (stu.stamps[active.number]) {
        alreadyChecked = true;
        resultMsg = 'already_checked';
        resultStamp = stu.stamps[active.number].stamp;
        resultSession = active.number;
        return false;
      }
      // Pick a random stamp from theme
      const themeStamps = THEMES[c.theme]?.stamps || THEMES.space.stamps;
      const stampIdx = (active.number - 1) % themeStamps.length;
      const stamp = themeStamps[stampIdx];
      const points = 10;
      // Bonus: early bird (before 9am)
      const now = new Date();
      const earlyBonus = now.getHours() < 9 ? 5 : 0;
      const totalPoints = points + earlyBonus;

      stu.stamps[active.number] = {
        stamp,
        at: now.toISOString(),
        points: totalPoints,
        early: earlyBonus > 0,
      };
      stu.points = (stu.points || 0) + totalPoints;
      resultStamp = stamp;
      resultSession = active.number;
      resultPointsEarned = totalPoints;
      resultMsg = 'success';
      // Check golden
      if (Object.keys(stu.stamps).length >= (c.totalSessions || 15)) resultGolden = true;
    });

    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);

    if (resultMsg === 'qr_invalid')   return json({ error: 'QR ไม่ถูกต้อง' }, 400);
    if (resultMsg === 'qr_expired')   return json({ error: 'หมดเวลาเช็กชื่อแล้ว ⏰\nกรุณาติดต่ออาจารย์' }, 400);
    if (resultMsg === 'not_enrolled') return json({ error: 'คุณยังไม่ได้เข้าร่วมห้องนี้' }, 400);
    if (alreadyChecked) {
      return json({ alreadyChecked: true, stamp: resultStamp, session: resultSession });
    }
    return json({
      success: true,
      stamp: resultStamp,
      session: resultSession,
      points: resultPointsEarned,
      golden: resultGolden,
    });
  }

  return json({ error: 'Unknown action' }, 400);
}

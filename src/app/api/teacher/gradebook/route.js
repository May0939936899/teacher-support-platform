import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ── Stored in scoreboard_sessions with prefix GB_ ────────────────────────────
const memRooms = globalThis.__gradebookRooms || (globalThis.__gradebookRooms = new Map());
let sbOk = null;
let sbCheckedAt = 0;
const SB_RECHECK_MS = 60_000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

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

const PREFIX = 'GB_';
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year — gradebooks should persist a semester

// ── ALWAYS try Supabase first, no stale gate. Same robust pattern as stampcard.
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
          memRooms.set(code, data.session_data);
          return data.session_data;
        }
      }
    }
  } catch (e) {
    console.warn('[gradebook] getClass DB:', e?.message);
  }
  return memRooms.get(code) || null;
}

async function saveClass(code, state, { strict = false } = {}) {
  memRooms.set(code, state);
  try {
    const sb = createAdminClient();
    if (!sb) {
      if (strict) throw new Error('Supabase client unavailable');
      return;
    }
    const { error } = await sb.from('scoreboard_sessions').upsert({
      session_id: PREFIX + code,
      session_data: state,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      if (strict) throw new Error(error.message || 'DB write failed');
      console.warn('[gradebook] saveClass DB error:', error.message);
    }
  } catch (e) {
    if (strict) throw e;
    console.warn('[gradebook] saveClass DB:', e?.message);
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
        if (result === false) return state;
        const { error: updErr } = await sb
          .from('scoreboard_sessions')
          .update({ session_data: state, updated_at: new Date().toISOString() })
          .eq('session_id', PREFIX + code);
        if (updErr) console.warn('[gradebook] mutate update:', updErr.message);
        memRooms.set(code, state);
        return state;
      }
    }
  } catch (e) {
    console.warn('[gradebook] mutateClass DB:', e?.message);
  }
  const r = memRooms.get(code);
  if (!r) return null;
  const result = mutator(r);
  if (result === false) return r;
  return r;
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'C' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function studentKey(s) {
  return String(s.studentId).trim() + '|' + (s.firstName || '').trim().toLowerCase();
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

// ── GET ?code=XXX&studentId=YYY ──────────────────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').toUpperCase().trim();
  const studentId = (searchParams.get('studentId') || '').trim();
  if (!code) return json({ error: 'ระบุรหัสห้องเรียน' }, 400);

  const cls = await getClass(code);
  if (!cls) return json({ error: 'ไม่พบห้องเรียน' }, 404);

  // Public class info (anyone with code)
  const publicInfo = {
    code,
    course: cls.course, courseName: cls.courseName,
    section: cls.section, teacher: cls.teacher,
    components: cls.components || [],
    bonus: cls.bonus || [],
    studentCount: (cls.students || []).length,
    createdAt: cls.createdAt,
  };

  // If studentId provided, also include their personal data
  if (studentId) {
    const me = (cls.students || []).find(s => String(s.studentId) === studentId);
    if (me) {
      // Compute weighted total
      let earned = 0, possible = 0;
      for (const c of (cls.components || [])) {
        const sc = me.scores?.[c.id];
        if (sc != null) {
          earned += (sc / (c.maxScore || 100)) * c.weight;
          possible += c.weight;
        }
      }
      const bonusTotal = Object.values(me.bonus || {}).reduce((a, b) => a + (Number(b) || 0), 0);
      return json({
        ...publicInfo,
        me: {
          studentId: me.studentId,
          firstName: me.firstName,
          lastName: me.lastName,
          scores: me.scores || {},
          bonus: me.bonus || {},
          checklist: me.checklist || {},
          earnedPct: Math.round(earned * 10) / 10,
          possiblePct: Math.round(possible * 10) / 10,
          bonusTotal,
        },
      });
    }
    return json({ ...publicInfo, me: null });
  }

  // Teacher view (no studentId) — include all students
  return json({
    ...publicInfo,
    students: cls.students || [],
    auditLog: (cls.auditLog || []).slice(-100), // last 100 entries
  });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { action } = body;

  // ── CREATE CLASS ──────────────────────────────────────────────────────────
  if (action === 'create') {
    const { course, courseName, section, teacher, components = [], bonus = [] } = body;
    if (!course || !courseName) return json({ error: 'กรุณาระบุรหัสและชื่อวิชา' }, 400);

    // Validate weights sum to ~100
    const totalW = components.reduce((s, c) => s + (Number(c.weight) || 0), 0);
    if (components.length > 0 && Math.abs(totalW - 100) > 0.5) {
      return json({ error: `น้ำหนักคะแนนรวมต้องเป็น 100% (ตอนนี้ ${totalW}%)` }, 400);
    }

    const code = genCode();
    const state = {
      course: String(course).trim(),
      courseName: String(courseName).trim(),
      section: String(section || '').trim() || '1',
      teacher: String(teacher || '').trim() || 'อาจารย์',
      components: components.map((c, i) => ({
        id: c.id || `c${Date.now()}_${i}`,
        name: c.name,
        weight: Number(c.weight) || 0,
        maxScore: Number(c.maxScore) || 100,
        deadline: c.deadline || null,
        description: c.description || '',
      })),
      bonus: bonus.map((b, i) => ({
        id: b.id || `b${Date.now()}_${i}`,
        name: b.name,
        maxScore: Number(b.maxScore) || 5,
      })),
      students: [],
      auditLog: [
        { type: 'create', by: 'teacher', at: new Date().toISOString(), msg: 'สร้างห้องเรียน' },
      ],
      createdAt: Date.now(),
    };
    try {
      // STRICT: must persist to Supabase before reporting success
      await saveClass(code, state, { strict: true });
    } catch (e) {
      console.error('[gradebook] create persist failed:', e?.message);
      return json({
        error: 'ไม่สามารถบันทึกห้องเรียนลงเซิร์ฟเวอร์ได้ — กรุณาลองใหม่',
        details: e?.message,
      }, 503);
    }
    // Verify by reading back
    const verified = await getClass(code);
    if (!verified) {
      return json({ error: 'บันทึกไม่ครบถ้วน กรุณาลองใหม่' }, 503);
    }
    return json({ success: true, code, class: state });
  }

  const code = (body.code || '').toUpperCase().trim();
  if (!code) return json({ error: 'ระบุรหัสห้องเรียน' }, 400);

  // ── UPDATE CLASS META (teacher) ───────────────────────────────────────────
  if (action === 'update_class') {
    const { course, courseName, section, teacher, components, bonus } = body;
    let errorMsg = null;
    const updated = await mutateClass(code, c => {
      if (course !== undefined) c.course = String(course).trim();
      if (courseName !== undefined) c.courseName = String(courseName).trim();
      if (section !== undefined) c.section = String(section).trim();
      if (teacher !== undefined) c.teacher = String(teacher).trim();
      if (components !== undefined) {
        const totalW = components.reduce((s, x) => s + (Number(x.weight) || 0), 0);
        if (components.length > 0 && Math.abs(totalW - 100) > 0.5) {
          errorMsg = `น้ำหนักคะแนนรวมต้องเป็น 100% (ตอนนี้ ${totalW}%)`;
          return false;
        }
        c.components = components.map((x, i) => ({
          id: x.id || `c${Date.now()}_${i}`,
          name: x.name, weight: Number(x.weight) || 0,
          maxScore: Number(x.maxScore) || 100,
          deadline: x.deadline || null,
          description: x.description || '',
        }));
      }
      if (bonus !== undefined) {
        c.bonus = bonus.map((x, i) => ({
          id: x.id || `b${Date.now()}_${i}`,
          name: x.name, maxScore: Number(x.maxScore) || 5,
        }));
      }
      c.auditLog = [...(c.auditLog || []), {
        type: 'update_class', by: 'teacher', at: new Date().toISOString(),
        msg: 'แก้ไขข้อมูลห้องเรียน',
      }].slice(-200);
    });
    if (errorMsg) return json({ error: errorMsg }, 400);
    if (!updated) return json({ error: 'ไม่พบห้องเรียน' }, 404);
    return json({ success: true, class: updated });
  }

  // ── ADD STUDENT (teacher or self-enroll) ─────────────────────────────────
  if (action === 'add_student') {
    const { studentId, firstName, lastName, by = 'teacher' } = body;
    if (!studentId || !firstName) return json({ error: 'กรอกรหัสและชื่อ' }, 400);
    let dupMsg = null;
    const updated = await mutateClass(code, c => {
      const sid = String(studentId).trim();
      if ((c.students || []).find(s => String(s.studentId) === sid)) {
        dupMsg = 'เลขนักศึกษานี้มีอยู่แล้ว';
        return false;
      }
      c.students = c.students || [];
      c.students.push({
        studentId: sid,
        firstName: String(firstName).trim(),
        lastName: String(lastName || '').trim(),
        scores: {},
        bonus: {},
        checklist: {},
        joinedAt: new Date().toISOString(),
      });
      c.auditLog = [...(c.auditLog || []), {
        type: 'add_student', by, at: new Date().toISOString(),
        msg: `เพิ่ม ${sid} ${firstName} ${lastName || ''}`,
      }].slice(-200);
    });
    if (dupMsg) return json({ error: dupMsg }, 400);
    if (!updated) return json({ error: 'ไม่พบห้องเรียน' }, 404);
    return json({ success: true });
  }

  // ── REMOVE STUDENT (teacher) ─────────────────────────────────────────────
  if (action === 'remove_student') {
    const { studentId } = body;
    const updated = await mutateClass(code, c => {
      c.students = (c.students || []).filter(s => String(s.studentId) !== String(studentId));
      c.auditLog = [...(c.auditLog || []), {
        type: 'remove_student', by: 'teacher', at: new Date().toISOString(),
        msg: `ลบ ${studentId}`,
      }].slice(-200);
    });
    if (!updated) return json({ error: 'ไม่พบห้องเรียน' }, 404);
    return json({ success: true });
  }

  // ── UPDATE SCORE (teacher) ────────────────────────────────────────────────
  if (action === 'update_score') {
    const { studentId, componentId, score, isBonus = false } = body;
    const updated = await mutateClass(code, c => {
      const stu = (c.students || []).find(s => String(s.studentId) === String(studentId));
      if (!stu) return false;
      const target = isBonus ? 'bonus' : 'scores';
      stu[target] = stu[target] || {};
      const old = stu[target][componentId];
      if (score === null || score === '' || score === undefined) {
        delete stu[target][componentId];
      } else {
        stu[target][componentId] = Number(score);
      }
      // Find component name for audit
      const comp = isBonus
        ? (c.bonus || []).find(b => b.id === componentId)
        : (c.components || []).find(x => x.id === componentId);
      c.auditLog = [...(c.auditLog || []), {
        type: 'update_score', by: 'teacher', at: new Date().toISOString(),
        msg: `${studentId}: ${comp?.name || componentId} ${old ?? '-'} → ${score ?? '-'}${isBonus ? ' (พิเศษ)' : ''}`,
      }].slice(-200);
    });
    if (!updated) return json({ error: 'ไม่พบห้องเรียน' }, 404);
    return json({ success: true });
  }

  // ── STUDENT JOIN/AUTH (no password — just info match) ────────────────────
  if (action === 'student_join') {
    const { studentId, firstName, lastName } = body;
    if (!studentId || !firstName) return json({ error: 'กรอกรหัสและชื่อ' }, 400);

    const cls = await getClass(code);
    if (!cls) return json({ error: 'ไม่พบห้องเรียน' }, 404);

    const sid = String(studentId).trim();
    let me = (cls.students || []).find(s => String(s.studentId) === sid);

    // If not on roster — auto-enroll (teacher-controlled rosters can disable later)
    if (!me) {
      const updated = await mutateClass(code, c => {
        if ((c.students || []).find(s => String(s.studentId) === sid)) return; // race
        c.students = c.students || [];
        c.students.push({
          studentId: sid,
          firstName: String(firstName).trim(),
          lastName: String(lastName || '').trim(),
          scores: {},
          bonus: {},
          checklist: {},
          joinedAt: new Date().toISOString(),
          selfEnrolled: true,
        });
        c.auditLog = [...(c.auditLog || []), {
          type: 'self_enroll', by: sid, at: new Date().toISOString(),
          msg: `${sid} ${firstName} เข้าร่วมห้องเอง`,
        }].slice(-200);
      });
      if (updated) me = updated.students.find(s => String(s.studentId) === sid);
    }

    return json({ success: true, studentId: sid });
  }

  // ── STUDENT SUBMIT CHECKLIST (mark "ส่งแล้ว") ─────────────────────────────
  if (action === 'student_check') {
    const { studentId, componentId, submitted, note } = body;
    const updated = await mutateClass(code, c => {
      const stu = (c.students || []).find(s => String(s.studentId) === String(studentId));
      if (!stu) return false;
      stu.checklist = stu.checklist || {};
      const old = stu.checklist[componentId]?.submitted || false;
      stu.checklist[componentId] = {
        submitted: !!submitted,
        at: new Date().toISOString(),
        note: note || '',
      };
      const comp = (c.components || []).find(x => x.id === componentId);
      c.auditLog = [...(c.auditLog || []), {
        type: 'student_check', by: studentId, at: new Date().toISOString(),
        msg: `${studentId} ${submitted ? '✅ ส่ง' : '❌ ยกเลิกการส่ง'} "${comp?.name || componentId}"${old !== submitted ? '' : ' (ซ้ำ)'}`,
      }].slice(-200);
    });
    if (!updated) return json({ error: 'ไม่พบห้องเรียน' }, 404);
    return json({ success: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

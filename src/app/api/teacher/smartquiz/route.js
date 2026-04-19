import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ============================================================
// Smart Quiz API — Hybrid: Supabase (if table exists) + In-Memory fallback
// ============================================================

const memoryStore = globalThis.__smartQuizSessions || (globalThis.__smartQuizSessions = new Map());

let supabaseAvailable = null;

async function checkSupabase() {
  if (supabaseAvailable !== null) return supabaseAvailable;
  try {
    const supabase = createAdminClient();
    if (!supabase) { supabaseAvailable = false; return false; }
    const { error } = await supabase.from('smart_quiz_sessions').select('id').limit(1);
    supabaseAvailable = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    return supabaseAvailable;
  } catch {
    supabaseAvailable = false;
    return false;
  }
}

async function getSession(code) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data } = await supabase.from('smart_quiz_sessions').select('*').eq('id', code).single();
    return data || null;
  }
  return memoryStore.get(code) || null;
}

async function saveSession(session) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('smart_quiz_sessions').upsert(session).select().single();
    if (error) throw error;
    return data;
  }
  memoryStore.set(session.id, { ...session });
  return session;
}

async function updateSession(code, updates) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('smart_quiz_sessions').update(updates).eq('id', code).select().single();
    if (error) throw error;
    return data;
  }
  const session = memoryStore.get(code);
  if (!session) return null;
  const updated = { ...session, ...updates };
  memoryStore.set(code, updated);
  return updated;
}

async function deleteSession(code) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    await supabase.from('smart_quiz_sessions').delete().eq('id', code);
  }
  memoryStore.delete(code);
}

async function listSessions() {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data } = await supabase.from('smart_quiz_sessions').select('*').order('created_at', { ascending: false }).limit(50);
    return data || [];
  }
  return Array.from(memoryStore.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}

// GET — fetch session by code OR list all
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const action = searchParams.get('action');

    if (action === 'list') {
      const sessions = await listSessions();
      return NextResponse.json({ sessions });
    }

    if (!code) return NextResponse.json({ error: 'Missing session code' }, { status: 400 });

    const session = await getSession(code.toUpperCase());
    if (!session) {
      return NextResponse.json({ error: 'ไม่พบ Session หรือหมดเวลาแล้ว' }, { status: 404 });
    }

    const now = Date.now();
    // For student view, check schedule
    if (!session.active || now > session.expires_at) {
      return NextResponse.json({ error: 'Session หมดเวลาแล้ว หรือถูกปิดโดยอาจารย์' }, { status: 400 });
    }
    if (session.opens_at && now < session.opens_at) {
      const opensDate = new Date(session.opens_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      return NextResponse.json({ error: `ยังไม่ถึงเวลาเปิดข้อสอบ — เปิดเวลา ${opensDate}` }, { status: 400 });
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error('SmartQuiz GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create new session
export async function POST(request) {
  try {
    const { quiz, timeLimit, openAt, closeAt } = await request.json();
    if (!quiz || !quiz.title || !quiz.questions?.length) {
      return NextResponse.json({ error: 'Missing quiz data' }, { status: 400 });
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = Date.now();
    const session = {
      id: code,
      quiz,
      responses: [],
      active: true,
      created_at: now,
      opens_at: openAt || now,
      expires_at: closeAt || (now + (timeLimit || 30) * 60000),
    };

    const saved = await saveSession(session);
    return NextResponse.json({ session: saved, code });
  } catch (err) {
    console.error('SmartQuiz POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — close session or update
export async function PUT(request) {
  try {
    const { code, action } = await request.json();
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    if (action === 'close') {
      const session = await updateSession(code.toUpperCase(), { active: false });
      if (!session) return NextResponse.json({ error: 'ไม่พบ Session' }, { status: 404 });
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('SmartQuiz PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — student submit answers
export async function PATCH(request) {
  try {
    const { code, fingerprint, answers, studentId, studentName } = await request.json();
    if (!code || !fingerprint) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const upperCode = code.toUpperCase();
    const session = await getSession(upperCode);
    if (!session) return NextResponse.json({ error: 'ไม่พบ Session หรือหมดเวลาแล้ว' }, { status: 404 });
    const nowPatch = Date.now();
    if (!session.active || nowPatch > session.expires_at) {
      return NextResponse.json({ error: 'Session หมดเวลาแล้ว' }, { status: 400 });
    }
    if (session.opens_at && nowPatch < session.opens_at) {
      return NextResponse.json({ error: 'ยังไม่ถึงเวลาเปิดข้อสอบ' }, { status: 400 });
    }

    // Check duplicate
    const responses = session.responses || [];
    if (responses.some(r => r.fingerprint === fingerprint)) {
      return NextResponse.json({ error: 'คุณได้ตอบคำถามนี้ไปแล้ว' }, { status: 400 });
    }

    // Score the answers
    let score = 0;
    const details = (session.quiz.questions || []).map(q => {
      const ans = answers[q.id] || '';
      const correct = (q.type === 'MC' || q.type === 'TF') ? ans.toLowerCase() === (q.answer || '').toLowerCase() : true;
      if (correct && (q.type === 'MC' || q.type === 'TF')) score += (q.points || 1);
      return { questionId: q.id, answer: ans, correct, points: correct ? (q.points || 1) : 0 };
    });

    const response = { fingerprint, submittedAt: Date.now(), score, details, studentId: studentId || '', studentName: studentName || '' };
    const updatedResponses = [...responses, response];
    const updated = await updateSession(upperCode, { responses: updatedResponses });

    const total = (session.quiz.questions || []).reduce((a, q) => a + (q.points || 1), 0);
    return NextResponse.json({ session: updated, score, total });
  } catch (err) {
    console.error('SmartQuiz PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — delete session(s)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const action = searchParams.get('action');

    if (action === 'all') {
      const sessions = await listSessions();
      for (const s of sessions) await deleteSession(s.id);
      return NextResponse.json({ ok: true, deleted: sessions.length });
    }

    if (action === 'closed') {
      const sessions = await listSessions();
      let count = 0;
      for (const s of sessions) {
        if (!s.active || Date.now() >= s.expires_at) {
          await deleteSession(s.id);
          count++;
        }
      }
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (code) {
      await deleteSession(code.toUpperCase());
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  } catch (err) {
    console.error('SmartQuiz DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

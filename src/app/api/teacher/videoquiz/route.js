import { NextResponse } from 'next/server';

// In-memory store — sessions last 24 hours
const sessions = new Map();

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

// Safe timestamp → ms converter (handles ISO string or number)
function toMs(val) {
  if (!val && val !== 0) return null;
  if (typeof val === 'number') return val;
  const n = new Date(val).getTime();
  return isNaN(n) ? null : n;
}

function cleanup() {
  const now = Date.now();
  for (const [key, s] of sessions) {
    if (now - toMs(s.createdAt) > 24 * 60 * 60 * 1000) sessions.delete(key);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

// GET /api/teacher/videoquiz?code=XXXX — student join
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').toUpperCase();
  if (!code) return json({ error: 'Missing code' }, 400);

  const session = sessions.get(code);
  if (!session) return json({ error: 'ไม่พบ Quiz หรือหมดอายุแล้ว' }, 404);

  const now = Date.now();
  const opensAt = toMs(session.opens_at);
  const expiresAt = toMs(session.expires_at);

  if (!session.active) {
    return json({ error: 'อาจารย์ปิดข้อสอบแล้ว' }, 400);
  }
  if (opensAt && now < opensAt) {
    const d = new Date(opensAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
    return json({ error: `ยังไม่ถึงเวลาเปิดข้อสอบ — เปิดเวลา ${d}` }, 400);
  }
  if (expiresAt && now > expiresAt) {
    return json({ error: 'ข้อสอบปิดแล้ว หรือหมดเวลา' }, 400);
  }

  return json({
    code,
    title: session.title,
    videoUrl: session.videoUrl,
    ytId: session.ytId,
    questions: session.questions,
    timeLimit: session.timeLimit || 0,
    opens_at: session.opens_at,
    expires_at: session.expires_at,
    submissionCount: session.submissions.length,
  });
}

export async function POST(req) {
  cleanup();
  try {
    const body = await req.json();
    const { action, code } = body;

    // Teacher publishes quiz with optional schedule
    if (action === 'publish') {
      const { title, videoUrl, ytId, questions, timeLimit, opensAt, closesAt } = body;
      if (!code || !questions) return json({ error: 'Missing data' }, 400);

      const now = Date.now();
      const opensAtMs = opensAt ? toMs(opensAt) : now;
      // closesAt overrides timeLimit; timeLimit is counted from opensAt
      const closesAtMs = closesAt
        ? toMs(closesAt)
        : (timeLimit > 0 ? opensAtMs + timeLimit : null);

      sessions.set(code.toUpperCase(), {
        title: title || 'Video Quiz',
        videoUrl,
        ytId,
        questions,
        timeLimit: timeLimit || 0, // seconds, kept for client display
        submissions: [],
        createdAt: new Date(now).toISOString(),
        opens_at: new Date(opensAtMs).toISOString(),
        expires_at: closesAtMs ? new Date(closesAtMs).toISOString() : null,
        active: true,
      });
      return json({ success: true, code: code.toUpperCase() });
    }

    // Teacher closes quiz
    if (action === 'close') {
      const session = sessions.get((code || '').toUpperCase());
      if (session) session.active = false;
      return json({ success: true });
    }

    // Student submits answers
    if (action === 'submit') {
      const { name, studentId, answers, score, total } = body;
      const session = sessions.get((code || '').toUpperCase());
      if (!session) return json({ error: 'ไม่พบ Quiz' }, 404);

      const now = Date.now();
      const expiresAt = toMs(session.expires_at);
      const opensAt = toMs(session.opens_at);
      if (!session.active) return json({ error: 'Quiz is closed' }, 400);
      if (expiresAt && now > expiresAt) return json({ error: 'Quiz has expired' }, 400);
      if (opensAt && now < opensAt) return json({ error: 'Quiz not open yet' }, 400);

      session.submissions.push({
        name, studentId, answers, score, total,
        submittedAt: new Date().toISOString(),
      });
      return json({ success: true, total: session.submissions.length });
    }

    // Teacher gets live submissions
    if (action === 'get_submissions') {
      const session = sessions.get((code || '').toUpperCase());
      if (!session) return json({ submissions: [] });
      return json({ submissions: session.submissions });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

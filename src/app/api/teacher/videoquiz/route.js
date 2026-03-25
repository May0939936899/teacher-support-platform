import { NextResponse } from 'next/server';

// In-memory store — sessions last 8 hours (ตลอดคาบเรียน)
const sessions = new Map();

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

function cleanup() {
  const now = Date.now();
  for (const [key, s] of sessions) {
    if (now - s.createdAt > 8 * 60 * 60 * 1000) sessions.delete(key);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

// GET /api/teacher/videoquiz?code=XXXX
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').toUpperCase();
  if (!code) return json({ error: 'Missing code' }, 400);

  const session = sessions.get(code);
  if (!session) return json({ error: 'Quiz not found or expired' }, 404);

  return json({
    code,
    title: session.title,
    videoUrl: session.videoUrl,
    ytId: session.ytId,
    questions: session.questions,
    submissionCount: session.submissions.length,
  });
}

export async function POST(req) {
  cleanup();
  try {
    const body = await req.json();
    const { action, code } = body;

    // Teacher publishes quiz
    if (action === 'publish') {
      const { title, videoUrl, ytId, questions } = body;
      if (!code || !questions) return json({ error: 'Missing data' }, 400);
      sessions.set(code.toUpperCase(), {
        title: title || 'Video Quiz',
        videoUrl,
        ytId,
        questions,
        submissions: [],
        createdAt: Date.now(),
      });
      return json({ success: true, code: code.toUpperCase() });
    }

    // Student submits answers
    if (action === 'submit') {
      const { name, studentId, answers, score, total } = body;
      const session = sessions.get((code || '').toUpperCase());
      if (!session) return json({ error: 'Quiz not found' }, 404);
      session.submissions.push({
        name, studentId, answers, score, total,
        submittedAt: Date.now(),
      });
      return json({ success: true, total: session.submissions.length });
    }

    // Teacher gets all submissions
    if (action === 'get_submissions') {
      const session = sessions.get((code || '').toUpperCase());
      if (!session) return json({ error: 'Quiz not found' }, 404);
      return json({ submissions: session.submissions });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

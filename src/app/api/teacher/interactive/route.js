import { NextResponse } from 'next/server';

// In-memory store for interactive sessions (sufficient for real-time classroom use)
// Each session lasts only during the class period
const sessions = new Map();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// Clean up old sessions (older than 4 hours)
function cleanup() {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.createdAt > 4 * 60 * 60 * 1000) {
      sessions.delete(key);
    }
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');
  const action = searchParams.get('action');

  if (!room) return json({ error: 'Missing room code' }, 400);

  const session = sessions.get(room);
  if (!session) return json({ error: 'Room not found', submissions: [] }, 404);

  if (action === 'get') {
    // Return new submissions since last fetch and clear them
    const submissions = [...session.pendingSubmissions];
    session.pendingSubmissions = [];
    return json({
      room,
      mode: session.mode,
      submissions,
      totalSubmissions: session.totalSubmissions,
    });
  }

  if (action === 'info') {
    // Return session info for students
    return json({
      room,
      mode: session.mode,
      poll: session.poll || null,
      active: true,
    });
  }

  return json({ room, mode: session.mode, active: true });
}

export async function POST(request) {
  cleanup();

  try {
    const body = await request.json();
    const { room, action } = body;

    if (!room) return json({ error: 'Missing room code' }, 400);

    // Teacher creates a new session
    if (action === 'create') {
      sessions.set(room, {
        mode: body.mode || 'wordcloud',
        createdAt: Date.now(),
        pendingSubmissions: [],
        totalSubmissions: 0,
        poll: null,
      });
      return json({ success: true, room });
    }

    // Teacher sets poll data
    if (action === 'set_poll') {
      const session = sessions.get(room);
      if (!session) {
        sessions.set(room, {
          mode: 'poll',
          createdAt: Date.now(),
          pendingSubmissions: [],
          totalSubmissions: 0,
          poll: { question: body.question, options: body.options },
        });
      } else {
        session.poll = { question: body.question, options: body.options };
      }
      return json({ success: true });
    }

    // Student submits data
    if (action === 'submit') {
      let session = sessions.get(room);
      if (!session) return json({ error: 'Room not found or expired' }, 404);

      const submission = {
        text: body.text || '',
        from: body.from || 'นักศึกษา',
        color: body.color || null,
        timestamp: Date.now(),
      };

      session.pendingSubmissions.push(submission);
      session.totalSubmissions++;

      return json({ success: true, total: session.totalSubmissions });
    }

    return json({ error: 'Unknown action' }, 400);

  } catch (e) {
    return json({ error: e.message || 'Server error' }, 500);
  }
}

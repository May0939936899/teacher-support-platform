import { NextResponse } from 'next/server';

// In-memory room store — sufficient for a single class period
const rooms = new Map();

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

function cleanup() {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000;
  for (const [key, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(key);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');
  const action = searchParams.get('action');

  if (!room) return json({ error: 'Missing room' }, 400);
  const r = rooms.get(room);
  if (!r) return json({ error: 'Room not found' }, 404);

  // Student: get current question state
  if (action === 'get_question') {
    return json({
      question: r.currentQuestion,   // { question, options: {A,B,C,D} }
      questionIndex: r.questionIndex,
      revealed: r.revealed,
      correctAnswer: r.revealed ? r.correctAnswer : null,
    });
  }

  // Teacher: get live vote counts
  if (action === 'get_votes') {
    const total = Object.values(r.votes).reduce((a, b) => a + b, 0);
    return json({ votes: r.votes, total });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function POST(request) {
  cleanup();
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { action, room } = body;

  // Create room
  if (action === 'create') {
    rooms.set(room, {
      createdAt: Date.now(),
      currentQuestion: null,
      questionIndex: -1,
      votes: { A: 0, B: 0, C: 0, D: 0 },
      voters: new Set(),
      revealed: false,
      correctAnswer: null,
    });
    return json({ success: true });
  }

  const r = rooms.get(room);
  if (!r) return json({ error: 'Room not found' }, 404);

  // Teacher pushes new question → resets votes
  if (action === 'set_question') {
    r.currentQuestion = body.question; // { question: string, options: {A,B,C,D} }
    r.questionIndex = body.questionIndex ?? r.questionIndex;
    r.votes = { A: 0, B: 0, C: 0, D: 0 };
    r.voters = new Set();
    r.revealed = false;
    r.correctAnswer = null;
    return json({ success: true });
  }

  // Student submits vote
  if (action === 'vote') {
    const { answer, voterId } = body;
    if (!['A', 'B', 'C', 'D'].includes(answer)) return json({ error: 'Invalid answer' }, 400);
    if (r.revealed) return json({ error: 'Already revealed' }, 400);
    if (!voterId) return json({ error: 'Missing voterId' }, 400);
    if (r.voters.has(voterId)) return json({ alreadyVoted: true, votes: r.votes });
    r.voters.add(voterId);
    r.votes[answer] = (r.votes[answer] || 0) + 1;
    return json({ success: true, votes: r.votes });
  }

  // Teacher reveals answer → students see result
  if (action === 'reveal') {
    r.revealed = true;
    r.correctAnswer = body.correctAnswer;
    return json({ success: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');
  if (room) rooms.delete(room);
  return json({ success: true });
}

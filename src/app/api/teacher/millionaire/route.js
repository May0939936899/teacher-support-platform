import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ── In-memory fallback (local dev / Supabase unavailable) ──────────────────
// WARNING: In-memory state is NOT shared across Vercel Lambda instances.
// Supabase (scoreboard_sessions table) is used as the primary shared store.
const memRooms = globalThis.__millionaireRooms || (globalThis.__millionaireRooms = new Map());
let sbOk = null;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

// ── Supabase availability check ──────────────────────────────────────────────
// Reuses the existing scoreboard_sessions table (no new table needed).
// Room state is stored as JSON in the 'teams' JSONB column.
// Room IDs use 'MILL_' prefix to avoid collision with scoreboard sessions.
async function checkSb() {
  if (sbOk !== null) return sbOk;
  try {
    const sb = createAdminClient();
    if (!sb) { sbOk = false; return false; }
    const { error } = await sb.from('scoreboard_sessions').select('id').limit(1);
    sbOk = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    return sbOk;
  } catch { sbOk = false; return false; }
}

const PREFIX = 'MILL_';
const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── Serialize / deserialize room ─────────────────────────────────────────────
// Map and Set cannot be stored in JSON/Supabase — convert to plain objects/arrays.
function serRoom(r) {
  return {
    mode:            r.mode,
    teamNames:       r.teamNames,
    currentQuestion: r.currentQuestion,
    questionIndex:   r.questionIndex,
    timerStarted:    r.timerStarted,
    votes:           r.votes,
    teamVotes:       r.teamVotes,
    voters:          Object.fromEntries(r.voters),
    teams:           [Array.from(r.teams[0]), Array.from(r.teams[1])],
    revealed:        r.revealed,
    correctAnswer:   r.correctAnswer,
    createdAt:       r.createdAt,
  };
}

function deserRoom(s) {
  if (!s) return null;
  return {
    mode:            s.mode            || 'teams',
    teamNames:       s.teamNames       || ['ทีม ฟ้า', 'ทีม ชมพู'],
    currentQuestion: s.currentQuestion || null,
    questionIndex:   s.questionIndex   ?? -1,
    timerStarted:    s.timerStarted    || false,
    votes:           s.votes           || { A: 0, B: 0, C: 0, D: 0 },
    teamVotes:       s.teamVotes       || [{ A: 0, B: 0, C: 0, D: 0 }, { A: 0, B: 0, C: 0, D: 0 }],
    voters:          new Map(Object.entries(s.voters  || {})),
    teams:           [new Set(s.teams?.[0] || []), new Set(s.teams?.[1] || [])],
    revealed:        s.revealed        || false,
    correctAnswer:   s.correctAnswer   || null,
    createdAt:       s.createdAt       || Date.now(),
  };
}

// ── CRUD helpers ─────────────────────────────────────────────────────────────
async function getRoom(roomCode) {
  if (await checkSb()) {
    const sb = createAdminClient();
    const { data } = await sb
      .from('scoreboard_sessions')
      .select('teams, active, expires_at')
      .eq('id', PREFIX + roomCode)
      .single();
    if (!data || !data.active) return null;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
    return deserRoom(data.teams);
  }
  // In-memory fallback
  const r = memRooms.get(roomCode);
  if (!r) return null;
  if (Date.now() - r.createdAt > TTL_MS) { memRooms.delete(roomCode); return null; }
  return r;
}

async function createRoom(roomCode, room) {
  if (await checkSb()) {
    const sb = createAdminClient();
    await sb.from('scoreboard_sessions').upsert({
      id:         PREFIX + roomCode,
      teams:      serRoom(room),   // store ALL room state in 'teams' JSONB column
      active:     true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + TTL_MS).toISOString(),
    });
    return;
  }
  memRooms.set(roomCode, room);
}

// Apply a mutation callback, then persist the updated room
async function mutateRoom(roomCode, mutator) {
  if (await checkSb()) {
    const sb = createAdminClient();
    // Read
    const { data } = await sb
      .from('scoreboard_sessions')
      .select('teams, active, expires_at')
      .eq('id', PREFIX + roomCode)
      .single();
    if (!data || !data.active) return null;
    const room = deserRoom(data.teams);
    if (!room) return null;
    // Mutate
    mutator(room);
    // Write back
    await sb
      .from('scoreboard_sessions')
      .update({ teams: serRoom(room) })
      .eq('id', PREFIX + roomCode);
    return room;
  }
  // In-memory fallback
  const r = memRooms.get(roomCode);
  if (!r) return null;
  mutator(r);
  return r;
}

async function deleteRoom(roomCode) {
  if (await checkSb()) {
    const sb = createAdminClient();
    await sb.from('scoreboard_sessions').delete().eq('id', PREFIX + roomCode);
  }
  memRooms.delete(roomCode);
}

// ── Route handlers ───────────────────────────────────────────────────────────
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const roomCode = (searchParams.get('room') || '').toUpperCase();
  const action   = searchParams.get('action');
  if (!roomCode) return json({ error: 'Missing room' }, 400);

  const r = await getRoom(roomCode);
  if (!r) return json({ error: 'Room not found' }, 404);

  if (action === 'get_question') {
    // Strip answerKey from student-facing response (server-side only)
    const q = r.timerStarted && r.currentQuestion
      ? { question: r.currentQuestion.question, options: r.currentQuestion.options }
      : null;
    return json({
      mode:          r.mode,
      question:      q,
      questionIndex: r.questionIndex,
      timerStarted:  r.timerStarted,
      revealed:      r.revealed,
      correctAnswer: r.revealed ? r.correctAnswer : null,
      teamNames:     r.teamNames,
    });
  }

  if (action === 'get_votes') {
    const total = Object.values(r.votes).reduce((a, b) => a + b, 0);
    return json({ votes: r.votes, total, teamVotes: r.teamVotes });
  }

  if (action === 'get_players') {
    return json({
      teamCounts: [r.teams[0].size, r.teams[1].size],
      total:      r.teams[0].size + r.teams[1].size,
    });
  }

  // ── 50:50 lifeline — server knows answerKey, returns 2 wrong options to hide ──
  if (action === 'get_fifty_fifty') {
    if (!r.currentQuestion?.answerKey) return json({ error: 'No active question' }, 400);
    const correct = r.currentQuestion.answerKey;
    const wrongs = ['A','B','C','D'].filter(k => k !== correct && r.currentQuestion.options?.[k]);
    const hide = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
    return json({ hide });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { action, room: roomRaw } = body;
  const room = (roomRaw || '').toUpperCase();

  // ── CREATE ──
  if (action === 'create') {
    const newRoom = {
      createdAt:       Date.now(),
      mode:            body.mode || 'teams',
      teamNames:       body.teamNames || ['ทีม ฟ้า', 'ทีม ชมพู'],
      currentQuestion: null,
      questionIndex:   -1,
      timerStarted:    false,
      votes:           { A: 0, B: 0, C: 0, D: 0 },
      teamVotes:       [{ A: 0, B: 0, C: 0, D: 0 }, { A: 0, B: 0, C: 0, D: 0 }],
      voters:          new Map(),
      teams:           [new Set(), new Set()],
      revealed:        false,
      correctAnswer:   null,
    };
    await createRoom(room, newRoom);
    return json({ success: true });
  }

  // ── RENAME TEAM (student renames their team before joining) ──
  if (action === 'rename_team') {
    const { teamIdx, name } = body;
    if (teamIdx !== 0 && teamIdx !== 1) return json({ error: 'Invalid teamIdx' }, 400);
    if (!name?.trim()) return json({ error: 'Missing name' }, 400);
    const updated = await mutateRoom(room, r => {
      r.teamNames[teamIdx] = name.trim().slice(0, 20);
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    return json({ success: true, teamNames: updated.teamNames });
  }

  // ── JOIN TEAM ──
  if (action === 'join_team') {
    const { voterId, teamIdx } = body;
    if (!voterId || (teamIdx !== 0 && teamIdx !== 1)) return json({ error: 'Invalid' }, 400);
    const updated = await mutateRoom(room, r => {
      r.teams[0].delete(voterId);
      r.teams[1].delete(voterId);
      r.teams[teamIdx].add(voterId);
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    return json({
      success:    true,
      teamName:   updated.teamNames[teamIdx],
      teamCounts: [updated.teams[0].size, updated.teams[1].size],
    });
  }

  // ── SET QUESTION ──
  if (action === 'set_question') {
    const updated = await mutateRoom(room, r => {
      // Store answer key server-side for solo-mode auto-reveal
      // (never exposed back to students via get_question)
      const q = body.question || {};
      r.currentQuestion = { question: q.question, options: q.options, answerKey: q.answerKey || null };
      r.questionIndex   = body.questionIndex ?? r.questionIndex;
      r.timerStarted    = false;
      r.votes           = { A: 0, B: 0, C: 0, D: 0 };
      r.teamVotes       = [{ A: 0, B: 0, C: 0, D: 0 }, { A: 0, B: 0, C: 0, D: 0 }];
      r.voters          = new Map();
      r.revealed        = false;
      r.correctAnswer   = null;
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    return json({ success: true });
  }

  // ── START TIMER ──
  if (action === 'start_timer') {
    const updated = await mutateRoom(room, r => { r.timerStarted = true; });
    if (!updated) return json({ error: 'Room not found' }, 404);
    return json({ success: true });
  }

  // ── VOTE ──
  if (action === 'vote') {
    const { answer, voterId } = body;
    if (!['A', 'B', 'C', 'D'].includes(answer)) return json({ error: 'Invalid answer' }, 400);
    if (!voterId) return json({ error: 'Missing voterId' }, 400);

    let alreadyVoted = false;
    let soloReveal = false;
    let soloCorrectAnswer = null;

    const updated = await mutateRoom(room, r => {
      if (r.revealed) return;
      if (r.voters.has(voterId)) { alreadyVoted = true; return; }
      const teamIdx = r.teams[0].has(voterId) ? 0 : r.teams[1].has(voterId) ? 1 : null;
      r.voters.set(voterId, answer);
      r.votes[answer] = (r.votes[answer] || 0) + 1;
      if (teamIdx !== null) r.teamVotes[teamIdx][answer]++;

      // Solo mode: auto-reveal immediately when student votes
      if (r.mode === 'solo' && r.currentQuestion?.answerKey) {
        r.revealed = true;
        r.correctAnswer = r.currentQuestion.answerKey;
        soloReveal = true;
        soloCorrectAnswer = r.currentQuestion.answerKey;
      }
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    if (alreadyVoted) return json({ alreadyVoted: true });
    // Solo: return correct answer immediately so student doesn't have to wait for next poll
    if (soloReveal) return json({ success: true, soloReveal: true, correctAnswer: soloCorrectAnswer });
    return json({ success: true });
  }

  // ── REVEAL ──
  if (action === 'reveal') {
    const updated = await mutateRoom(room, r => {
      r.revealed      = true;
      r.correctAnswer = body.correctAnswer;
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    return json({ success: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const room = (searchParams.get('room') || '').toUpperCase();
  if (room) await deleteRoom(room);
  return json({ success: true });
}

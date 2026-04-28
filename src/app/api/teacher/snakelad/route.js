import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ── In-memory fallback ──────────────────────────────────────────────────────
const memRooms = globalThis.__snakladRooms || (globalThis.__snakladRooms = new Map());
let sbOk = null;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

// ── Supabase availability check ─────────────────────────────────────────────
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

const PREFIX = 'SL_';
const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── Board constants ──────────────────────────────────────────────────────────
const SNAKES  = { 99:78, 95:56, 87:24, 64:60, 62:19, 54:34, 17:7 };
const LADDERS = { 4:14, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81 };

const PLAYER_COLORS = [
  '#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6',
  '#ec4899','#06b6d4','#84cc16','#f97316','#6366f1',
];

// ── Serialize / deserialize ──────────────────────────────────────────────────
// Room state is plain JSON — no Map/Set needed.
function serRoom(r) {
  return JSON.stringify(r);
}

function deserRoom(s) {
  if (!s) return null;
  try {
    const parsed = typeof s === 'string' ? JSON.parse(s) : s;
    return parsed;
  } catch { return null; }
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
      teams:      serRoom(room),
      active:     true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + TTL_MS).toISOString(),
    });
    return;
  }
  memRooms.set(roomCode, room);
}

async function mutateRoom(roomCode, mutator) {
  if (await checkSb()) {
    const sb = createAdminClient();
    const { data } = await sb
      .from('scoreboard_sessions')
      .select('teams, active, expires_at')
      .eq('id', PREFIX + roomCode)
      .single();
    if (!data || !data.active) return null;
    const room = deserRoom(data.teams);
    if (!room) return null;
    mutator(room);
    await sb
      .from('scoreboard_sessions')
      .update({ teams: serRoom(room) })
      .eq('id', PREFIX + roomCode);
    return room;
  }
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

  if (action === 'get_state') {
    return json(r);
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
      status:      'waiting',
      players:     [],
      currentTurn: 0,
      diceResult:  null,
      lastEvent:   null,
      lastFrom:    null,
      lastTo:      null,
      winner:      null,
      createdAt:   Date.now(),
    };
    await createRoom(room, newRoom);
    return json({ success: true });
  }

  // ── JOIN ──
  if (action === 'join') {
    const { voterId, name } = body;
    if (!voterId || !name?.trim()) return json({ error: 'Missing voterId or name' }, 400);

    let errorMsg = null;
    const updated = await mutateRoom(room, r => {
      if (r.status !== 'waiting') { errorMsg = 'Game already started'; return; }
      const already = r.players.find(p => p.id === voterId);
      if (already) return; // already in, skip
      if (r.players.length >= 10) { errorMsg = 'Room full'; return; }
      const color = PLAYER_COLORS[r.players.length % PLAYER_COLORS.length];
      r.players.push({ id: voterId, name: name.trim().slice(0, 20), position: 0, color });
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    if (errorMsg) return json({ error: errorMsg }, 400);
    return json({ success: true, players: updated.players });
  }

  // ── START ──
  if (action === 'start') {
    let errorMsg = null;
    const updated = await mutateRoom(room, r => {
      if (r.players.length < 2) { errorMsg = 'Need at least 2 players'; return; }
      r.status      = 'playing';
      r.currentTurn = 0;
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    if (errorMsg) return json({ error: errorMsg }, 400);
    return json({ success: true });
  }

  // ── ROLL ──
  if (action === 'roll') {
    const { voterId } = body;
    if (!voterId) return json({ error: 'Missing voterId' }, 400);

    let errorMsg = null;
    const updated = await mutateRoom(room, r => {
      if (r.status !== 'playing') { errorMsg = 'Game not playing'; return; }
      const player = r.players[r.currentTurn];
      if (!player || player.id !== voterId) { errorMsg = 'Not your turn'; return; }

      const roll = Math.floor(Math.random() * 6) + 1;
      r.diceResult = roll;
      let newPos = player.position + roll;
      if (newPos > 100) newPos = player.position; // bounce
      r.lastFrom = newPos;
      if (LADDERS[newPos]) {
        newPos = LADDERS[newPos];
        r.lastEvent = 'ladder';
      } else if (SNAKES[newPos]) {
        newPos = SNAKES[newPos];
        r.lastEvent = 'snake';
      } else {
        r.lastEvent = 'normal';
      }
      player.position = newPos;
      r.lastTo = newPos;
      if (newPos === 100) {
        r.status    = 'finished';
        r.winner    = player.id;
        r.lastEvent = 'win';
      } else {
        r.currentTurn = (r.currentTurn + 1) % r.players.length;
      }
    });
    if (!updated) return json({ error: 'Room not found' }, 404);
    if (errorMsg) return json({ error: errorMsg }, 400);
    return json(updated);
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const room = (searchParams.get('room') || '').toUpperCase();
  if (room) await deleteRoom(room);
  return json({ success: true });
}

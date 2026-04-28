import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ── In-memory fallback (shared across invocations in same Lambda, NOT across instances) ──
const memRooms = globalThis.__snakladRooms2 || (globalThis.__snakladRooms2 = new Map());
let sbOk = null;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

// ── Supabase check ─────────────────────────────────────────────────────────────
async function checkSb() {
  if (sbOk !== null) return sbOk;
  try {
    const sb = createAdminClient();
    if (!sb) { sbOk = false; return false; }
    const { error } = await sb.from('scoreboard_sessions').select('session_id').limit(1);
    sbOk = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    return sbOk;
  } catch { sbOk = false; return false; }
}

const PREFIX = 'SL_';
const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── Board constants (per spec) ────────────────────────────────────────────────
const SNAKES  = { 17:7, 54:34, 62:19, 64:60, 87:36, 93:73, 95:56, 99:78 };
const LADDERS = { 4:23, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91 };
const EVENTS  = {
  10: { type: 'extra_roll', msg: '🎲 ทอยอีกครั้ง!' },
  25: { type: 'backward',   amount: 3,  msg: '😱 ถอยหลัง 3 ช่อง' },
  45: { type: 'forward',    amount: 3,  msg: '⭐ เดินหน้า 3 ช่อง' },
  60: { type: 'skip',                   msg: '😴 หยุดพัก 1 ตา' },
  75: { type: 'forward',    amount: 5,  msg: '🎁 รางวัลพิเศษ! เดินหน้า 5' },
  88: { type: 'backward',   amount: 5,  msg: '💀 ถอยหลัง 5 ช่อง' },
};

const PLAYER_COLORS  = ['#FF6B9D','#4ECDC4','#FFE66D','#A8E6CF','#DDA0DD','#87CEEB','#FFA07A','#98FB98','#F0E68C','#E6A8D7'];
const PLAYER_AVATARS = ['🐶','🐱','🐻','🦊','🐸','🦁','🐯','🐺','🦝','🐨'];

// ── CRUD helpers — same schema as bussanook: session_id / session_data / updated_at ──
async function getRoom(code) {
  const key = PREFIX + code;
  if (await checkSb()) {
    const sb = createAdminClient();
    const { data } = await sb
      .from('scoreboard_sessions')
      .select('session_data, updated_at')
      .eq('session_id', key)
      .single();
    if (!data?.session_data) return null;
    const updatedMs = new Date(data.updated_at).getTime();
    if (Date.now() - updatedMs > TTL_MS) return null;
    return data.session_data;
  }
  const r = memRooms.get(code);
  if (!r) return null;
  if (Date.now() - (r.createdAt || 0) > TTL_MS) { memRooms.delete(code); return null; }
  return r;
}

async function saveRoom(code, room) {
  const key = PREFIX + code;
  if (await checkSb()) {
    const sb = createAdminClient();
    await sb.from('scoreboard_sessions').upsert({
      session_id:   key,
      session_data: room,
      updated_at:   new Date().toISOString(),
    });
    return;
  }
  memRooms.set(code, room);
}

async function mutateRoom(code, mutator) {
  const key = PREFIX + code;
  if (await checkSb()) {
    const sb = createAdminClient();
    const { data } = await sb
      .from('scoreboard_sessions')
      .select('session_data')
      .eq('session_id', key)
      .single();
    if (!data?.session_data) return null;
    const room = data.session_data;
    const result = mutator(room);
    if (result === false) return room;
    await sb
      .from('scoreboard_sessions')
      .update({ session_data: room, updated_at: new Date().toISOString() })
      .eq('session_id', key);
    return room;
  }
  const r = memRooms.get(code);
  if (!r) return null;
  const result = mutator(r);
  if (result === false) return r;
  return r;
}

// ── Code generator ─────────────────────────────────────────────────────────────
function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ── Move logic ────────────────────────────────────────────────────────────────
function applyMove(room, player, roll) {
  let pos = player.position + roll;
  if (pos > 100) pos = player.position; // bounce back from > 100

  let event = null;

  // Check snake
  if (SNAKES[pos] !== undefined) {
    const to = SNAKES[pos];
    event = { type: 'snake', from: pos, to, msg: `🐍 งูกัด! ${pos} → ${to}` };
    pos = to;
  }
  // Check ladder
  else if (LADDERS[pos] !== undefined) {
    const to = LADDERS[pos];
    event = { type: 'ladder', from: pos, to, msg: `🪜 ขึ้นบันได! ${pos} → ${to}` };
    pos = to;
  }
  // Check special events
  else if (EVENTS[pos] !== undefined) {
    const ev = EVENTS[pos];
    event = { type: ev.type, msg: ev.msg };
    if (ev.type === 'forward') {
      const to = Math.min(100, pos + ev.amount);
      event.from = pos; event.to = to;
      pos = to;
    } else if (ev.type === 'backward') {
      const to = Math.max(1, pos - ev.amount);
      event.from = pos; event.to = to;
      pos = to;
    } else if (ev.type === 'skip') {
      player.skipTurns = (player.skipTurns || 0) + 1;
    }
    // extra_roll handled in roll logic
  }

  player.position = pos;
  return { pos, event };
}

function advanceTurn(room) {
  const total = room.players.length;
  let next = (room.currentPlayerIdx + 1) % total;
  // skip players who have skipTurns > 0
  let attempts = 0;
  while (room.players[next].skipTurns > 0 && attempts < total) {
    room.players[next].skipTurns = Math.max(0, room.players[next].skipTurns - 1);
    next = (next + 1) % total;
    attempts++;
  }
  room.currentPlayerIdx = next;
}

// ── OPTIONS ───────────────────────────────────────────────────────────────────
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

// ── GET ?code=XXX ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') || '').toUpperCase();
  if (!code) return json({ error: 'Missing code' }, 400);

  const room = await getRoom(code);
  if (!room) return json({ error: 'Game not found' }, 404);
  return json({ session: room, code });
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { action } = body;

  // ── CREATE ──
  if (action === 'create') {
    const { theme = 'funpark' } = body;
    const code = genCode();
    const room = {
      phase:            'waiting',
      theme,
      code,
      players:          [],
      currentPlayerIdx: 0,
      lastRoll:         null,
      lastEvent:        null,
      winner:           null,
      log:              [],
      createdAt:        Date.now(),
    };
    await saveRoom(code, room);
    return json({ code, session: room });
  }

  // ── JOIN ──
  if (action === 'join') {
    const { code: codeRaw, name } = body;
    const code = (codeRaw || '').toUpperCase();
    if (!code || !name?.trim()) return json({ error: 'Missing code or name' }, 400);

    let playerId = null;
    let errorMsg = null;

    const updated = await mutateRoom(code, r => {
      if (r.phase !== 'waiting') { errorMsg = 'Game already started'; return false; }
      // check if name already used (idempotent rejoin by name)
      const existing = r.players.find(p => p.name === name.trim().slice(0, 20));
      if (existing) { playerId = existing.id; return false; }
      if (r.players.length >= 10) { errorMsg = 'Room full (max 10)'; return false; }

      playerId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const idx = r.players.length;
      r.players.push({
        id:       playerId,
        name:     name.trim().slice(0, 20),
        position: 0,
        color:    PLAYER_COLORS[idx % PLAYER_COLORS.length],
        avatar:   PLAYER_AVATARS[idx % PLAYER_AVATARS.length],
        skipTurns: 0,
        isOnline: true,
      });
    });

    if (!updated) {
      if (errorMsg) return json({ error: errorMsg }, 400);
      // could be rejoin case
      const room = await getRoom(code);
      if (!room) return json({ error: 'Game not found' }, 404);
      const p = room.players.find(pl => pl.name === name.trim().slice(0, 20));
      if (p) return json({ playerId: p.id, session: room });
      return json({ error: 'Game not found' }, 404);
    }
    if (errorMsg) return json({ error: errorMsg }, 400);
    return json({ playerId, session: updated });
  }

  // ── START ──
  if (action === 'start') {
    const { code: codeRaw } = body;
    const code = (codeRaw || '').toUpperCase();
    if (!code) return json({ error: 'Missing code' }, 400);

    let errorMsg = null;
    const updated = await mutateRoom(code, r => {
      if (r.players.length < 2) { errorMsg = 'Need at least 2 players'; return false; }
      if (r.phase === 'playing') return false; // already started, ok
      r.phase = 'playing';
      r.currentPlayerIdx = 0;
      r.log = [];
    });
    if (!updated) return json({ error: errorMsg || 'Game not found' }, 404);
    if (errorMsg) return json({ error: errorMsg }, 400);
    return json({ session: updated });
  }

  // ── ROLL ──
  if (action === 'roll') {
    const { code: codeRaw, playerId } = body;
    const code = (codeRaw || '').toUpperCase();
    if (!code || !playerId) return json({ error: 'Missing code or playerId' }, 400);

    let rolled = null;
    let eventResult = null;
    let errorMsg = null;

    const updated = await mutateRoom(code, r => {
      if (r.phase !== 'playing') { errorMsg = 'Game not in playing phase'; return false; }
      const currentPlayer = r.players[r.currentPlayerIdx];
      if (!currentPlayer || currentPlayer.id !== playerId) {
        errorMsg = 'Not your turn';
        return false;
      }

      rolled = Math.floor(Math.random() * 6) + 1;
      r.lastRoll = rolled;

      const { pos, event } = applyMove(r, currentPlayer, rolled);
      eventResult = event;
      r.lastEvent = event;

      // Log entry
      const logEntry = {
        player:    currentPlayer.name,
        roll:      rolled,
        fromPos:   currentPlayer.position === pos ? pos - rolled : pos, // approximation
        toPos:     pos,
        event:     event ? event.msg : null,
        timestamp: Date.now(),
      };
      r.log = [logEntry, ...r.log].slice(0, 50); // keep last 50

      // Check win
      if (pos === 100) {
        r.phase  = 'finished';
        r.winner = currentPlayer.name;
        r.lastEvent = { type: 'win', msg: `🏆 ${currentPlayer.name} ชนะ!` };
        return;
      }

      // Extra roll: same player goes again
      if (event?.type === 'extra_roll') {
        // currentPlayerIdx stays the same
        return;
      }

      // Advance turn
      advanceTurn(r);
    });

    if (!updated) return json({ error: errorMsg || 'Game not found' }, errorMsg ? 400 : 404);
    if (errorMsg) return json({ error: errorMsg }, 400);
    return json({ session: updated, rolled, event: eventResult });
  }

  // ── RESET ──
  if (action === 'reset') {
    const { code: codeRaw } = body;
    const code = (codeRaw || '').toUpperCase();
    if (!code) return json({ error: 'Missing code' }, 400);

    const updated = await mutateRoom(code, r => {
      r.phase = 'waiting';
      r.players.forEach(p => { p.position = 0; p.skipTurns = 0; });
      r.currentPlayerIdx = 0;
      r.lastRoll  = null;
      r.lastEvent = null;
      r.winner    = null;
      r.log       = [];
    });
    if (!updated) return json({ error: 'Game not found' }, 404);
    return json({ session: updated });
  }

  return json({ error: 'Unknown action' }, 400);
}

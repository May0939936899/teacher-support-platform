import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ── In-memory fallback ────────────────────────────────────────────────────────
const memRooms = globalThis.__bussanookRooms || (globalThis.__bussanookRooms = new Map());
let sbOk = null;
let sbCheckedAt = 0;
const SB_RECHECK_MS = 60_000; // re-check Supabase every 60s if it was down

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function checkSb() {
  // Re-check periodically if previous check failed (handles transient outages)
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

const PREFIX = 'BUSS_';
const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

async function getRoom(code) {
  // Try Supabase first
  if (await checkSb()) {
    try {
      const sb = createAdminClient();
      const { data, error } = await sb
        .from('scoreboard_sessions')
        .select('session_data, updated_at')
        .eq('session_id', PREFIX + code)
        .maybeSingle();
      if (!error && data?.session_data) {
        const updatedMs = new Date(data.updated_at).getTime();
        if (Date.now() - updatedMs <= TTL_MS) return data.session_data;
      }
    } catch (e) {
      // Transient DB error — fall through to in-memory
      console.warn('[bussanook] getRoom DB error → fallback to memory:', e?.message || e);
    }
  }
  // In-memory fallback (also serves as cache when DB is down)
  const r = memRooms.get(code);
  if (!r) return null;
  if (Date.now() - (r.createdAt || 0) > TTL_MS) { memRooms.delete(code); return null; }
  return r;
}

async function saveRoom(code, state) {
  // Always also keep a memory copy as fallback during DB outages
  memRooms.set(code, state);
  if (await checkSb()) {
    try {
      const sb = createAdminClient();
      await sb.from('scoreboard_sessions').upsert({
        session_id:   PREFIX + code,
        session_data: state,
        updated_at:   new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[bussanook] saveRoom DB error (kept memory copy):', e?.message || e);
    }
  }
}

async function mutateRoom(code, mutator) {
  // Try Supabase first
  if (await checkSb()) {
    try {
      const sb = createAdminClient();
      const { data, error: selErr } = await sb
        .from('scoreboard_sessions')
        .select('session_data')
        .eq('session_id', PREFIX + code)
        .maybeSingle();
      if (!selErr && data?.session_data) {
        const state = data.session_data;
        mutator(state);
        await sb
          .from('scoreboard_sessions')
          .update({ session_data: state, updated_at: new Date().toISOString() })
          .eq('session_id', PREFIX + code);
        // Sync memory cache
        memRooms.set(code, state);
        return state;
      }
    } catch (e) {
      console.warn('[bussanook] mutateRoom DB error → fallback to memory:', e?.message || e);
    }
  }
  // In-memory fallback
  const r = memRooms.get(code);
  if (!r) return null;
  mutator(r);
  return r;
}

// ── Score calculation ─────────────────────────────────────────────────────────
function calcPoints(elapsedMs, timeLimitSec) {
  const timeLimitMs = timeLimitSec * 1000;
  return Math.round(500 + 500 * Math.max(0, 1 - elapsedMs / timeLimitMs));
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('room') || '').toUpperCase().trim();
  const pid  = searchParams.get('pid') || '';

  if (!code) return json({ error: 'ต้องระบุรหัสห้อง' }, 400);

  const state = await getRoom(code);
  if (!state) return json({ error: 'ไม่พบห้องหรือห้องหมดอายุแล้ว' }, 404);

  // Teacher full state (no pid)
  if (!pid) {
    return json({ ...state });
  }

  // Student-safe state
  const { phase, players, questions, currentQ, questionStartTime, timeLimit, answers, maxPlayers } = state;

  const totalQ = questions ? questions.length : 0;
  const currentQIndex = currentQ ?? 0;
  const q = questions?.[currentQIndex];

  // Build question object — hide answer during 'question' phase
  let questionObj = null;
  if (q) {
    questionObj = {
      q:       q.q,
      choices: q.choices,
      time:    q.time,
      // Only expose answer during reveal or finished
      ...(phase === 'reveal' || phase === 'finished' ? { answer: q.answer } : {}),
    };
  }

  // My answer details
  const myAnswer = answers?.[pid] || null;
  const answerCount = answers ? Object.keys(answers).length : 0;
  const playerCount = players ? players.length : 0;

  // Sanitized player list (only id, name, score — no answer details)
  const sanitizedPlayers = (players || [])
    .map(p => ({ id: p.id, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);

  return json({
    phase,
    currentQ:          currentQIndex,
    totalQ,
    question:          questionObj,
    questionStartTime: questionStartTime || null,
    timeLimit:         timeLimit || (q?.time ?? 20),
    myAnswer,
    answerCount,
    playerCount,
    players:           sanitizedPlayers,
    maxPlayers:        maxPlayers || 50,
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { action } = body;
  const code = (body.room || '').toUpperCase().trim();

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (action === 'create') {
    const questions = body.questions || [];
    if (questions.length === 0) return json({ error: 'ต้องมีอย่างน้อย 1 คำถาม' }, 400);
    if (!code || code.length !== 4) return json({ error: 'รหัสห้องต้องมี 4 ตัวอักษร' }, 400);

    const state = {
      phase:             'lobby',
      players:           [],
      questions,
      currentQ:          0,
      questionStartTime: null,
      timeLimit:         body.timeLimit || 20,
      answers:           {},
      maxPlayers:        body.maxPlayers || 50,
      createdAt:         Date.now(),
    };

    await saveRoom(code, state);
    return json({ success: true, room: code });
  }

  // ── JOIN ──────────────────────────────────────────────────────────────────
  if (action === 'join') {
    const { pid, name } = body;
    if (!pid || !name?.trim()) return json({ error: 'ต้องระบุชื่อและ ID ผู้เล่น' }, 400);

    let errorMsg = null;
    const updated = await mutateRoom(code, state => {
      if (!state) { errorMsg = 'ไม่พบห้อง'; return; }
      if (state.phase !== 'lobby') { errorMsg = 'เกมเริ่มไปแล้ว ไม่สามารถเข้าร่วมได้'; return; }
      if (state.players.length >= state.maxPlayers) { errorMsg = 'ห้องเต็มแล้ว'; return; }

      const trimmed = name.trim().slice(0, 20);
      const exists = state.players.find(p => p.id === pid);
      if (exists) {
        // Re-join: update name
        exists.name = trimmed;
        return;
      }
      const nameTaken = state.players.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
      if (nameTaken) { errorMsg = 'ชื่อนี้ถูกใช้แล้ว ลองชื่ออื่น'; return; }

      state.players.push({ id: pid, name: trimmed, score: 0, streak: 0 });
    });

    if (errorMsg) {
      const status = errorMsg === 'ไม่พบห้อง' ? 404 : 400;
      return json({ error: errorMsg }, status);
    }
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);

    return json({ success: true, playerCount: updated.players.length });
  }

  // ── START ─────────────────────────────────────────────────────────────────
  if (action === 'start') {
    const updated = await mutateRoom(code, state => {
      if (state.players.length === 0) return;
      state.phase             = 'question';
      state.currentQ          = 0;
      state.answers           = {};
      state.questionStartTime = Date.now();
      state.timeLimit         = state.questions[0]?.time || 20;
    });
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);
    return json({ success: true });
  }

  // ── ANSWER ────────────────────────────────────────────────────────────────
  if (action === 'answer') {
    const { pid, choice } = body;
    if (!pid) return json({ error: 'ต้องระบุ player ID' }, 400);
    if (typeof choice !== 'number' || choice < 0 || choice > 3) return json({ error: 'คำตอบไม่ถูกต้อง' }, 400);

    let resultAnswer = null;
    let alreadyAnswered = false;

    const updated = await mutateRoom(code, state => {
      if (state.phase !== 'question') return;
      if (state.answers[pid]) { alreadyAnswered = true; return; }

      const q = state.questions[state.currentQ];
      if (!q) return;

      const now = Date.now();
      const elapsedMs = state.questionStartTime ? now - state.questionStartTime : (q.time * 1000);
      const timeLimitMs = q.time * 1000;

      // Expired
      if (elapsedMs > timeLimitMs + 1000) return;

      const correct = choice === q.answer;
      const basePoints = correct ? calcPoints(elapsedMs, q.time) : 0;

      // Streak bonus
      const player = state.players.find(p => p.id === pid);
      let streakBonus = 0;
      if (correct && player) {
        player.streak = (player.streak || 0) + 1;
        streakBonus = (player.streak - 1) * 50; // +50 per consecutive (first correct = 0 bonus)
      } else if (player) {
        player.streak = 0;
      }

      const points = basePoints + streakBonus;

      if (player) player.score = (player.score || 0) + points;

      state.answers[pid] = {
        choice,
        timeMs:  Math.min(elapsedMs, timeLimitMs),
        points,
        correct,
      };

      resultAnswer = state.answers[pid];
    });

    if (alreadyAnswered) return json({ alreadyAnswered: true });
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);

    return json({ success: true, answer: resultAnswer });
  }

  // ── REVEAL ────────────────────────────────────────────────────────────────
  if (action === 'reveal') {
    const updated = await mutateRoom(code, state => {
      if (state.phase !== 'question') return;
      state.phase = 'reveal';
    });
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);
    return json({ success: true });
  }

  // ── NEXT ──────────────────────────────────────────────────────────────────
  if (action === 'next') {
    const updated = await mutateRoom(code, state => {
      if (state.phase !== 'reveal') return;
      const nextQ = (state.currentQ ?? 0) + 1;
      if (nextQ >= state.questions.length) {
        state.phase = 'finished';
      } else {
        state.phase             = 'question';
        state.currentQ          = nextQ;
        state.answers           = {};
        state.questionStartTime = Date.now();
        state.timeLimit         = state.questions[nextQ]?.time || 20;
      }
    });
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);
    return json({ success: true, phase: updated.phase, currentQ: updated.currentQ });
  }

  // ── RESET ─────────────────────────────────────────────────────────────────
  if (action === 'reset') {
    const updated = await mutateRoom(code, state => {
      state.phase             = 'lobby';
      state.currentQ          = 0;
      state.questionStartTime = null;
      state.answers           = {};
      state.players           = state.players.map(p => ({ ...p, score: 0, streak: 0 }));
    });
    if (!updated) return json({ error: 'ไม่พบห้อง' }, 404);
    return json({ success: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PracticeAttemptInput = {
  targetType: 'kana' | 'vocabulary';
  targetId: string;
  kana?: string;
  romaji?: string;
  expectedAnswer?: string;
  userAnswer?: string;
  isCorrect: boolean;
  score?: number;
  durationMs?: number;
  order?: number;
  metadata?: Record<string, unknown>;
  attemptedAt?: string;
};

type PracticeSessionInput = {
  userId: string;
  practiceMode: string;
  syllabary?: string;
  seriesId?: string;
  seriesTitle?: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  totalAttempts?: number;
  correctAttempts?: number;
  wrongAttempts?: number;
  averageScore?: number;
  metadata?: Record<string, unknown>;
  attempts: PracticeAttemptInput[];
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const input = await parseAndValidateRequest(request);
    const supabase = createServiceClient();
    const completedAt = input.completedAt ?? new Date().toISOString();
    const totalAttempts = input.totalAttempts ?? input.attempts.length;
    const correctAttempts = input.correctAttempts ?? input.attempts.filter((attempt) => attempt.isCorrect).length;
    const wrongAttempts = input.wrongAttempts ?? Math.max(0, totalAttempts - correctAttempts);
    const averageScore = input.averageScore ?? getAverageScore(input.attempts);

    const { data: user, error: userError } = await supabase
      .from('app_user')
      .select('id,last_practiced_at,total_practice_days,total_practice_sessions,total_practice_time_seconds,streak_days')
      .eq('id', input.userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new HttpError('User not found', 404);
    }

    const { data: session, error: sessionError } = await supabase
      .from('practice_session')
      .insert({
        user_id: input.userId,
        practice_mode: input.practiceMode,
        syllabary: input.syllabary ?? 'hiragana',
        series_id: input.seriesId,
        series_title: input.seriesTitle,
        started_at: input.startedAt,
        completed_at: completedAt,
        duration_seconds: input.durationSeconds ?? 0,
        total_attempts: totalAttempts,
        correct_attempts: correctAttempts,
        wrong_attempts: wrongAttempts,
        average_score: averageScore,
        metadata: input.metadata ?? {},
      })
      .select('id')
      .single();

    if (sessionError) {
      throw sessionError;
    }

    const attemptRows = input.attempts.map((attempt, index) => ({
      session_id: session.id,
      user_id: input.userId,
      practice_mode: input.practiceMode,
      target_type: attempt.targetType,
      target_id: attempt.targetId,
      kana: attempt.kana,
      romaji: attempt.romaji,
      expected_answer: attempt.expectedAnswer,
      user_answer: attempt.userAnswer,
      is_correct: attempt.isCorrect,
      score: typeof attempt.score === 'number' ? attempt.score : undefined,
      duration_ms: attempt.durationMs,
      attempt_order: attempt.order ?? index,
      metadata: attempt.metadata ?? {},
      attempted_at: attempt.attemptedAt ?? completedAt,
    }));

    if (attemptRows.length > 0) {
      const { error: attemptsError } = await supabase
        .from('practice_attempt')
        .insert(attemptRows);

      if (attemptsError) {
        throw attemptsError;
      }
    }

    await updateKanaProgress(supabase, input, completedAt);
    await updateVocabularyProgress(supabase, input, completedAt);
    await updateUserCounters(supabase, user, input.durationSeconds ?? 0, completedAt);

    return jsonResponse({ success: true, sessionId: session.id }, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ success: false, error: error.message }, error.status);
    }

    console.error('[record-practice-session] Failed', {
      message: error instanceof Error ? error.message : String(error),
    });

    return jsonResponse({ success: false, error: 'No se pudo guardar la práctica' }, 200);
  }
});

async function parseAndValidateRequest(request: Request): Promise<PracticeSessionInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HttpError('Invalid JSON body', 400);
  }

  if (!isRecord(body)) {
    throw new HttpError('Invalid request body', 400);
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const practiceMode = typeof body.practiceMode === 'string' ? body.practiceMode.trim() : '';
  const startedAt = typeof body.startedAt === 'string' ? body.startedAt : '';
  const attempts = Array.isArray(body.attempts) ? body.attempts.map(normalizeAttempt) : [];

  if (!isUuid(userId)) {
    throw new HttpError('Invalid userId', 400);
  }

  if (!practiceMode || practiceMode.length > 60) {
    throw new HttpError('Invalid practiceMode', 400);
  }

  if (!startedAt || Number.isNaN(Date.parse(startedAt))) {
    throw new HttpError('Invalid startedAt', 400);
  }

  if (attempts.length > 200) {
    throw new HttpError('Too many attempts', 400);
  }

  return {
    userId,
    practiceMode,
    syllabary: getOptionalString(body.syllabary),
    seriesId: getOptionalString(body.seriesId),
    seriesTitle: getOptionalString(body.seriesTitle),
    startedAt,
    completedAt: getOptionalDate(body.completedAt),
    durationSeconds: getOptionalNonNegativeInteger(body.durationSeconds),
    totalAttempts: getOptionalNonNegativeInteger(body.totalAttempts),
    correctAttempts: getOptionalNonNegativeInteger(body.correctAttempts),
    wrongAttempts: getOptionalNonNegativeInteger(body.wrongAttempts),
    averageScore: getOptionalScore(body.averageScore),
    metadata: isRecord(body.metadata) ? body.metadata : undefined,
    attempts,
  };
}

function normalizeAttempt(value: unknown): PracticeAttemptInput {
  if (!isRecord(value)) {
    throw new HttpError('Invalid attempt item', 400);
  }

  const targetType = value.targetType;
  const targetId = typeof value.targetId === 'string' ? value.targetId.trim() : '';

  if (targetType !== 'kana' && targetType !== 'vocabulary') {
    throw new HttpError('Invalid attempt targetType', 400);
  }

  if (!targetId || targetId.length > 160) {
    throw new HttpError('Invalid attempt targetId', 400);
  }

  return {
    targetType,
    targetId,
    kana: getOptionalString(value.kana),
    romaji: getOptionalString(value.romaji),
    expectedAnswer: getOptionalString(value.expectedAnswer),
    userAnswer: getOptionalString(value.userAnswer),
    isCorrect: value.isCorrect === true,
    score: getOptionalScore(value.score),
    durationMs: getOptionalNonNegativeInteger(value.durationMs),
    order: getOptionalNonNegativeInteger(value.order),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
    attemptedAt: getOptionalDate(value.attemptedAt),
  };
}

async function updateKanaProgress(supabase, input: PracticeSessionInput, completedAt: string) {
  const attemptsByKana = new Map<string, PracticeAttemptInput[]>();

  for (const attempt of input.attempts) {
    if (attempt.targetType !== 'kana' || !attempt.kana) {
      continue;
    }

    attemptsByKana.set(attempt.kana, [...(attemptsByKana.get(attempt.kana) ?? []), attempt]);
  }

  for (const [kana, attempts] of attemptsByKana.entries()) {
    const { data: current, error: readError } = await supabase
      .from('kana_progress')
      .select('attempts_count,correct_count,wrong_count,best_score,average_score,first_practiced_at')
      .eq('user_id', input.userId)
      .eq('kana', kana)
      .eq('syllabary', input.syllabary ?? 'hiragana')
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const previousAttempts = current?.attempts_count ?? 0;
    const nextAttempts = previousAttempts + attempts.length;
    const nextCorrect = (current?.correct_count ?? 0) + attempts.filter((attempt) => attempt.isCorrect).length;
    const nextWrong = (current?.wrong_count ?? 0) + attempts.filter((attempt) => !attempt.isCorrect).length;
    const scores = attempts.map((attempt) => attempt.score).filter((score) => typeof score === 'number');
    const bestScore = scores.length > 0
      ? Math.max(current?.best_score ?? 0, ...scores)
      : current?.best_score;
    const averageScore = getWeightedAverage(
      current?.average_score,
      previousAttempts,
      getAverageScore(attempts),
      attempts.length,
    );
    const mastered = nextAttempts >= 5 && nextCorrect / nextAttempts >= 0.8 && (bestScore ?? 0) >= 80;

    const { error: upsertError } = await supabase
      .from('kana_progress')
      .upsert({
        user_id: input.userId,
        kana,
        syllabary: input.syllabary ?? 'hiragana',
        attempts_count: nextAttempts,
        correct_count: nextCorrect,
        wrong_count: nextWrong,
        best_score: bestScore,
        average_score: averageScore,
        mastered,
        first_practiced_at: current?.first_practiced_at ?? completedAt,
        last_practiced_at: completedAt,
        updated_at: completedAt,
      }, { onConflict: 'user_id,kana,syllabary' });

    if (upsertError) {
      throw upsertError;
    }
  }
}

async function updateVocabularyProgress(supabase, input: PracticeSessionInput, completedAt: string) {
  const vocabularyAttempts = input.attempts.filter((attempt) => attempt.targetType === 'vocabulary');

  for (const attempt of vocabularyAttempts) {
    const { data: current, error: readError } = await supabase
      .from('vocabulary_progress')
      .select('attempts_count,correct_count,wrong_count,first_practiced_at')
      .eq('user_id', input.userId)
      .eq('vocabulary_id', attempt.targetId)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const { error: upsertError } = await supabase
      .from('vocabulary_progress')
      .upsert({
        user_id: input.userId,
        vocabulary_id: attempt.targetId,
        attempts_count: (current?.attempts_count ?? 0) + 1,
        correct_count: (current?.correct_count ?? 0) + (attempt.isCorrect ? 1 : 0),
        wrong_count: (current?.wrong_count ?? 0) + (attempt.isCorrect ? 0 : 1),
        last_answer: attempt.userAnswer,
        first_practiced_at: current?.first_practiced_at ?? completedAt,
        last_practiced_at: completedAt,
        updated_at: completedAt,
      }, { onConflict: 'user_id,vocabulary_id' });

    if (upsertError) {
      throw upsertError;
    }
  }
}

async function updateUserCounters(supabase, user, durationSeconds: number, completedAt: string) {
  const lastPracticedAt = user.last_practiced_at;
  const completedDate = toUtcDateKey(completedAt);
  const lastDate = lastPracticedAt ? toUtcDateKey(lastPracticedAt) : undefined;
  const practicedTodayAlready = lastDate === completedDate;
  const wasYesterday = lastDate ? daysBetween(lastDate, completedDate) === 1 : false;
  const nextStreak = practicedTodayAlready
    ? user.streak_days
    : wasYesterday
      ? user.streak_days + 1
      : 1;

  const { error } = await supabase
    .from('app_user')
    .update({
      streak_days: nextStreak,
      total_practice_days: user.total_practice_days + (practicedTodayAlready ? 0 : 1),
      total_practice_sessions: user.total_practice_sessions + 1,
      total_practice_time_seconds: user.total_practice_time_seconds + Math.max(0, durationSeconds),
      last_practiced_at: completedAt,
      last_seen_at: completedAt,
      updated_at: completedAt,
    })
    .eq('id', user.id);

  if (error) {
    throw error;
  }
}

function getAverageScore(attempts: PracticeAttemptInput[]) {
  const scores = attempts.map((attempt) => attempt.score).filter((score) => typeof score === 'number');

  if (scores.length === 0) {
    return undefined;
  }

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getWeightedAverage(
  previousAverage: number | undefined,
  previousCount: number,
  nextAverage: number | undefined,
  nextCount: number,
) {
  if (typeof nextAverage !== 'number') {
    return previousAverage;
  }

  if (!previousAverage || previousCount <= 0) {
    return nextAverage;
  }

  return Math.round(((previousAverage * previousCount) + (nextAverage * nextCount)) / (previousCount + nextCount));
}

function getOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 300) : undefined;
}

function getOptionalDate(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

function getOptionalNonNegativeInteger(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;
}

function getOptionalScore(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : undefined;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function toUtcDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function daysBetween(fromDateKey: string, toDateKey: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${toDateKey}T00:00:00.000Z`) - Date.parse(`${fromDateKey}T00:00:00.000Z`)) / dayMs);
}

function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

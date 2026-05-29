// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AppUsageInput = {
  userId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  source?: string;
  metadata?: Record<string, unknown>;
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
    const endedAt = input.endedAt ?? new Date().toISOString();

    const { data: user, error: userError } = await supabase
      .from('app_user')
      .select('id,total_app_time_seconds')
      .eq('id', input.userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new HttpError('User not found', 404);
    }

    const durationSeconds = Math.max(0, Math.min(input.durationSeconds, 6 * 60 * 60));

    const { error: insertError } = await supabase
      .from('app_usage_session')
      .insert({
        user_id: input.userId,
        started_at: input.startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        source: input.source ?? 'app',
        metadata: input.metadata ?? {},
      });

    if (insertError) {
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from('app_user')
      .update({
        total_app_time_seconds: (user.total_app_time_seconds ?? 0) + durationSeconds,
        last_seen_at: endedAt,
        updated_at: endedAt,
      })
      .eq('id', input.userId);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ success: false, error: error.message }, error.status);
    }

    console.error('[record-app-usage] Failed', {
      message: error instanceof Error ? error.message : String(error),
    });

    return jsonResponse({ success: false, error: 'No se pudo guardar el tiempo de uso' }, 200);
  }
});

async function parseAndValidateRequest(request: Request): Promise<AppUsageInput> {
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
  const startedAt = typeof body.startedAt === 'string' ? body.startedAt : '';
  const durationSeconds = typeof body.durationSeconds === 'number' ? Math.floor(body.durationSeconds) : 0;

  if (!isUuid(userId)) {
    throw new HttpError('Invalid userId', 400);
  }

  if (!startedAt || Number.isNaN(Date.parse(startedAt))) {
    throw new HttpError('Invalid startedAt', 400);
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds < 5) {
    throw new HttpError('Invalid durationSeconds', 400);
  }

  return {
    userId,
    startedAt,
    endedAt: getOptionalDate(body.endedAt),
    durationSeconds,
    source: getOptionalString(body.source),
    metadata: isRecord(body.metadata) ? body.metadata : undefined,
  };
}

function getOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 80) : undefined;
}

function getOptionalDate(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
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

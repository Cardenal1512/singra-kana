// @ts-nocheck
import bcrypt from 'npm:bcryptjs@2.4.3';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const userColumns = [
  'id',
  'username',
  'display_name',
  'preferred_language',
  'current_syllabary',
  'current_level',
].join(',');

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

    const { data: user, error: userError } = await supabase
      .from('app_user')
      .select(userColumns)
      .eq('username', input.username)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return jsonResponse({ success: false, error: 'PIN incorrecto' }, 200);
    }

    const { data: credentials, error: credentialsError } = await supabase
      .from('app_user_credentials')
      .select('pin_hash,pin_algorithm')
      .eq('user_id', user.id)
      .maybeSingle();

    if (credentialsError) {
      throw credentialsError;
    }

    if (!credentials || credentials.pin_algorithm !== 'bcrypt') {
      return jsonResponse({ success: false, error: 'No se pudo validar el PIN' }, 200);
    }

    const isValidPin = await bcrypt.compare(input.pin, credentials.pin_hash);

    if (!isValidPin) {
      return jsonResponse({ success: false, error: 'PIN incorrecto' }, 200);
    }

    const seenAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('app_user')
      .update({
        last_seen_at: seenAt,
        updated_at: seenAt,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        preferredLanguage: user.preferred_language,
        currentSyllabary: user.current_syllabary,
        currentLevel: user.current_level,
      },
    }, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ success: false, error: error.message }, error.status);
    }

    console.error('[login-with-pin] Failed', {
      message: error instanceof Error ? error.message : String(error),
    });

    return jsonResponse({ success: false, error: 'No se pudo validar el PIN' }, 200);
  }
});

async function parseAndValidateRequest(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HttpError('Invalid JSON body', 400);
  }

  if (!isRecord(body)) {
    throw new HttpError('Invalid request body', 400);
  }

  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

  if (!username || username.length > 40) {
    throw new HttpError('Invalid username', 400);
  }

  if (!/^\d{4,12}$/u.test(pin)) {
    throw new HttpError('Invalid PIN', 400);
  }

  return { username, pin };
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

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseClient = createSupabaseClient();
export const supabaseConfig = {
  publishableKey: supabasePublishableKey,
  url: supabaseUrl,
};

function createSupabaseClient(): SupabaseClient | undefined {
  if (!supabaseUrl || !supabasePublishableKey) {
    return undefined;
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

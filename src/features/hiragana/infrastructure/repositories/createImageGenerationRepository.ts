import { SupabaseImageGenerationRepository } from '@/src/features/hiragana/infrastructure/repositories/SupabaseImageGenerationRepository';
import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';

export function createImageGenerationRepository() {
  return new SupabaseImageGenerationRepository(supabaseClient);
}

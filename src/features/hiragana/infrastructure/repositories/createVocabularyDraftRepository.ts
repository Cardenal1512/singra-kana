import { SupabaseVocabularyDraftRepository } from '@/src/features/hiragana/infrastructure/repositories/SupabaseVocabularyDraftRepository';
import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';

export function createVocabularyDraftRepository() {
  return new SupabaseVocabularyDraftRepository(supabaseClient);
}

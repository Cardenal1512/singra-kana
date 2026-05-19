import { CompositeDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/CompositeDictionaryRepository';
import { SupabaseJishoDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/SupabaseJishoDictionaryRepository';
import { SupabaseDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/SupabaseDictionaryRepository';
import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';

export function createDictionaryRepository() {
  return new CompositeDictionaryRepository(
    new SupabaseDictionaryRepository(supabaseClient),
    new SupabaseJishoDictionaryRepository(supabaseClient),
  );
}

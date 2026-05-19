import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';
import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';
import { FallbackVocabularyRepository } from '@/src/features/hiragana/infrastructure/repositories/FallbackVocabularyRepository';
import { LocalVocabularyRepository } from '@/src/features/hiragana/infrastructure/repositories/LocalVocabularyRepository';
import { SupabaseVocabularyRepository } from '@/src/features/hiragana/infrastructure/repositories/SupabaseVocabularyRepository';

export function createVocabularyRepository(): VocabularyRepository {
  const localRepository = new LocalVocabularyRepository();

  if (!supabaseClient) {
    return localRepository;
  }

  return new FallbackVocabularyRepository(
    new SupabaseVocabularyRepository(supabaseClient),
    localRepository,
  );
}

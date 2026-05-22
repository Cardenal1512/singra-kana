import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';

const generatedVocabularyBucket = 'vocabulary-generated';

export function getGeneratedVocabularyImageUrl(imagePath: string | undefined): string | undefined {
  if (!imagePath || !supabaseClient) {
    return undefined;
  }

  return supabaseClient.storage.from(generatedVocabularyBucket).getPublicUrl(imagePath).data.publicUrl;
}

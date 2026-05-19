import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';

const vocabularyBucketName = 'vocabulary';

export function getVocabularyImageUrl(fileName: string): string | undefined {
  if (!supabaseClient) {
    return undefined;
  }

  const { data } = supabaseClient.storage.from(vocabularyBucketName).getPublicUrl(fileName);

  return data.publicUrl;
}

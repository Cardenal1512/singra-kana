import type { VocabularyProgress } from '@/src/features/hiragana/domain/models/VocabularyProgress';

export interface VocabularyProgressRepository {
  findByVocabularyItemId(itemId: string): Promise<VocabularyProgress | undefined>;
  save(progress: VocabularyProgress): Promise<void>;
}

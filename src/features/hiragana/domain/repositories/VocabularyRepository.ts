import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';

export interface VocabularyRepository {
  getAll(): Promise<VocabularyItem[]>;
}

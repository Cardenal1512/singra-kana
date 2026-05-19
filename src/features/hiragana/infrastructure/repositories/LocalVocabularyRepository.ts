import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';

export class LocalVocabularyRepository implements VocabularyRepository {
  async getAll(): Promise<VocabularyItem[]> {
    return [];
  }

  async getBySeries(_seriesId: string): Promise<VocabularyItem[]> {
    return [];
  }

  async getByKana(_kana: string): Promise<VocabularyItem[]> {
    return [];
  }
}

import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';
import { kanaExamples } from '@/src/features/hiragana/infrastructure/data/kanaExamples';
import { kanaExampleToVocabularyItem } from '@/src/features/hiragana/infrastructure/mappers/vocabularyMapper';

export class StaticVocabularyRepository implements VocabularyRepository {
  async getAll(): Promise<VocabularyItem[]> {
    return kanaExamples
      .map((example) => kanaExampleToVocabularyItem({ ...example, source: 'official' }))
      .filter((item) => item.source === 'official');
  }
}

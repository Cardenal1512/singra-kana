import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';

export class GetVocabularyBySeriesUseCase {
  constructor(private readonly vocabularyRepository: VocabularyRepository) {}

  async execute(seriesId: string): Promise<VocabularyItem[]> {
    return this.vocabularyRepository.getBySeries(seriesId);
  }
}

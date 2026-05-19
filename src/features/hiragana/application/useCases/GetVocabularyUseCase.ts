import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';

export class GetVocabularyUseCase {
  constructor(private readonly vocabularyRepository: VocabularyRepository) {}

  async execute(): Promise<VocabularyItem[]> {
    return this.vocabularyRepository.getAll();
  }
}

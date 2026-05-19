import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';

export class GetVocabularyByKanaUseCase {
  constructor(private readonly vocabularyRepository: VocabularyRepository) {}

  async execute(kana: string): Promise<VocabularyItem[]> {
    return this.vocabularyRepository.getByKana(kana);
  }
}

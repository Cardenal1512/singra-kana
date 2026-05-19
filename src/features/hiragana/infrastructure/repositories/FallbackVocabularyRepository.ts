import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';

export class FallbackVocabularyRepository implements VocabularyRepository {
  constructor(
    private readonly primaryRepository: VocabularyRepository,
    private readonly fallbackRepository: VocabularyRepository,
  ) {}

  async getAll(): Promise<VocabularyItem[]> {
    try {
      return await this.primaryRepository.getAll();
    } catch {
      return this.fallbackRepository.getAll();
    }
  }
}

import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';

export class FallbackVocabularyRepository implements VocabularyRepository {
  constructor(
    private readonly primaryRepository: VocabularyRepository,
    private readonly fallbackRepository: VocabularyRepository,
  ) {}

  async getAll(): Promise<VocabularyItem[]> {
    try {
      return withFallbackIfEmpty(await this.primaryRepository.getAll(), () =>
        this.fallbackRepository.getAll(),
      );
    } catch {
      return this.fallbackRepository.getAll();
    }
  }

  async getBySeries(seriesId: string): Promise<VocabularyItem[]> {
    try {
      return withFallbackIfEmpty(await this.primaryRepository.getBySeries(seriesId), () =>
        this.fallbackRepository.getBySeries(seriesId),
      );
    } catch {
      return this.fallbackRepository.getBySeries(seriesId);
    }
  }

  async getByKana(kana: string): Promise<VocabularyItem[]> {
    try {
      return withFallbackIfEmpty(await this.primaryRepository.getByKana(kana), () =>
        this.fallbackRepository.getByKana(kana),
      );
    } catch {
      return this.fallbackRepository.getByKana(kana);
    }
  }
}

async function withFallbackIfEmpty<T>(items: T[], getFallback: () => Promise<T[]>) {
  return items.length > 0 ? items : getFallback();
}

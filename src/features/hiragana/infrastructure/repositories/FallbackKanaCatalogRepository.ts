import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';

export class FallbackKanaCatalogRepository implements KanaCatalogRepository {
  constructor(
    private readonly primaryRepository: KanaCatalogRepository,
    private readonly fallbackRepository: KanaCatalogRepository,
  ) {}

  async getSeries(): Promise<KanaSeries[]> {
    try {
      return withFallbackIfInvalidSeries(await this.primaryRepository.getSeries(), () =>
        this.fallbackRepository.getSeries(),
      );
    } catch {
      return this.fallbackRepository.getSeries();
    }
  }

  async getSeriesById(id: string): Promise<KanaSeries | undefined> {
    try {
      const series = await this.primaryRepository.getSeriesById(id);

      if (series && series.characters.length > 0) {
        return series;
      }

      return this.fallbackRepository.getSeriesById(id);
    } catch {
      return this.fallbackRepository.getSeriesById(id);
    }
  }

  async getCharactersBySeries(seriesId: string): Promise<KanaCharacter[]> {
    try {
      return withFallbackIfEmpty(await this.primaryRepository.getCharactersBySeries(seriesId), () =>
        this.fallbackRepository.getCharactersBySeries(seriesId),
      );
    } catch {
      return this.fallbackRepository.getCharactersBySeries(seriesId);
    }
  }

  async getAllCharacters(): Promise<KanaCharacter[]> {
    try {
      return withFallbackIfEmpty(await this.primaryRepository.getAllCharacters(), () =>
        this.fallbackRepository.getAllCharacters(),
      );
    } catch {
      return this.fallbackRepository.getAllCharacters();
    }
  }
}

async function withFallbackIfEmpty<T>(items: T[], getFallback: () => Promise<T[]>) {
  return items.length > 0 ? items : getFallback();
}

async function withFallbackIfInvalidSeries(
  series: KanaSeries[],
  getFallback: () => Promise<KanaSeries[]>,
) {
  return series.length > 0 && series.some((item) => item.characters.length > 0)
    ? series
    : getFallback();
}

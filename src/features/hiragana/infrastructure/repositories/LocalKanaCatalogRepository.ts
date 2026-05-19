import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';

export class LocalKanaCatalogRepository implements KanaCatalogRepository {
  async getSeries(): Promise<KanaSeries[]> {
    return [];
  }

  async getSeriesById(_id: string): Promise<KanaSeries | undefined> {
    return undefined;
  }

  async getCharactersBySeries(_seriesId: string): Promise<KanaCharacter[]> {
    return [];
  }

  async getAllCharacters(): Promise<KanaCharacter[]> {
    return [];
  }
}

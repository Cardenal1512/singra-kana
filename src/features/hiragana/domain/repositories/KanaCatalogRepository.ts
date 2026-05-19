import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';

export interface KanaCatalogRepository {
  getSeries(): Promise<KanaSeries[]>;
  getSeriesById(id: string): Promise<KanaSeries | undefined>;
  getCharactersBySeries(seriesId: string): Promise<KanaCharacter[]>;
  getAllCharacters(): Promise<KanaCharacter[]>;
}

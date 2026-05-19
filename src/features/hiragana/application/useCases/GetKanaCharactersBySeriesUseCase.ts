import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';

export class GetKanaCharactersBySeriesUseCase {
  constructor(private readonly kanaCatalogRepository: KanaCatalogRepository) {}

  async execute(seriesId: string): Promise<KanaCharacter[]> {
    return this.kanaCatalogRepository.getCharactersBySeries(seriesId);
  }
}

import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';

export class ResolveKanaSeriesUseCase {
  constructor(private readonly kanaCatalogRepository: KanaCatalogRepository) {}

  async execute(kana: string): Promise<string | undefined> {
    const characters = await this.kanaCatalogRepository.getAllCharacters();
    return characters.find((character) => character.kana === kana)?.group;
  }
}

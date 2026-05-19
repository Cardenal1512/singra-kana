import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';

export class GetAllKanaCharactersUseCase {
  constructor(private readonly kanaCatalogRepository: KanaCatalogRepository) {}

  async execute(): Promise<KanaCharacter[]> {
    return this.kanaCatalogRepository.getAllCharacters();
  }
}

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';

export class GetKanaSeriesByIdUseCase {
  constructor(private readonly kanaCatalogRepository: KanaCatalogRepository) {}

  async execute(id: string): Promise<KanaSeries | undefined> {
    return this.kanaCatalogRepository.getSeriesById(id);
  }
}

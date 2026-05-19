import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';

export class GetKanaSeriesUseCase {
  constructor(private readonly kanaCatalogRepository: KanaCatalogRepository) {}

  async execute(): Promise<KanaSeries[]> {
    return this.kanaCatalogRepository.getSeries();
  }
}

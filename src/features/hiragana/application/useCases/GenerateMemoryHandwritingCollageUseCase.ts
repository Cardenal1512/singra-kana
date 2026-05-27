import type { MemoryHandwritingCollage } from '@/src/features/hiragana/domain/models/MemoryHandwritingCollage';
import type { MemoryHandwritingDrawing } from '@/src/features/hiragana/domain/models/MemoryHandwritingDrawing';
import type { MemoryHandwritingCollageService } from '@/src/features/hiragana/domain/services/MemoryHandwritingCollageService';

export class GenerateMemoryHandwritingCollageUseCase {
  constructor(private readonly collageService: MemoryHandwritingCollageService) {}

  async execute(drawings: MemoryHandwritingDrawing[]): Promise<MemoryHandwritingCollage | undefined> {
    return this.collageService.generate(drawings);
  }
}

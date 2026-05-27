import type { MemoryHandwritingCollage } from '@/src/features/hiragana/domain/models/MemoryHandwritingCollage';
import type { MemoryHandwritingDrawing } from '@/src/features/hiragana/domain/models/MemoryHandwritingDrawing';

export interface MemoryHandwritingCollageService {
  generate(drawings: MemoryHandwritingDrawing[]): Promise<MemoryHandwritingCollage | undefined>;
}

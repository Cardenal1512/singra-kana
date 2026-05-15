import type { HiraganaRepository } from '@/src/features/hiragana/domain/repositories/HiraganaRepository';
import { hiraganaSeries } from '@/src/features/hiragana/infrastructure/data/hiraganaSeries';

export function createLocalHiraganaRepository(): HiraganaRepository {
  return {
    getSeries: () => hiraganaSeries,
  };
}

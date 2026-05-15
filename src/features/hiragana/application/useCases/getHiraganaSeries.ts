import type { HiraganaRepository } from '@/src/features/hiragana/domain/repositories/HiraganaRepository';

export function getHiraganaSeries(repository: HiraganaRepository) {
  return repository.getSeries();
}

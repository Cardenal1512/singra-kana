import type { KanaExample } from '@/src/features/hiragana/domain/models/KanaExample';
import type { KanaExampleRepository } from '@/src/features/hiragana/domain/repositories/KanaExampleRepository';

export async function getKanaExamples(
  kana: string,
  kanaExampleRepository: KanaExampleRepository,
): Promise<KanaExample[]> {
  // TODO future: combine official + user examples.
  return kanaExampleRepository.findByKana(kana);
}

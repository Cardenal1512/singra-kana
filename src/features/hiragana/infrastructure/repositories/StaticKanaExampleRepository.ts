import type { KanaExample } from '@/src/features/hiragana/domain/models/KanaExample';
import type { KanaExampleRepository } from '@/src/features/hiragana/domain/repositories/KanaExampleRepository';
import { kanaExamples } from '@/src/features/hiragana/infrastructure/data/kanaExamples';

export class StaticKanaExampleRepository implements KanaExampleRepository {
  // TODO future: user examples from local storage.
  async findByKana(kana: string): Promise<KanaExample[]> {
    return kanaExamples
      .filter((example) => example.kana === kana)
      .map((example) => ({ ...example, source: 'official' }));
  }

  async findAll(): Promise<KanaExample[]> {
    return kanaExamples.map((example) => ({ ...example, source: 'official' }));
  }
}

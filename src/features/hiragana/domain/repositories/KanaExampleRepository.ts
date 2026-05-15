import type { KanaExample } from '@/src/features/hiragana/domain/models/KanaExample';

export interface KanaExampleRepository {
  findByKana(kana: string): Promise<KanaExample[]>;
  findAll(): Promise<KanaExample[]>;
}

import type { KanaProgress } from '@/src/features/hiragana/domain/models/KanaProgress';

export interface KanaProgressRepository {
  findByKanaId(kanaId: string): Promise<KanaProgress | undefined>;
  save(progress: KanaProgress): Promise<void>;
}

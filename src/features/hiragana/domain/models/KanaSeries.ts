import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';

export type KanaSeries = {
  id: string;
  title: string;
  subtitle?: string;
  representativeKana: string;
  characters: KanaCharacter[];
};

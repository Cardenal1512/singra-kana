import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaSyllabary } from '@/src/features/hiragana/domain/models/WritingSystem';

export type KanaSeries = {
  id: string;
  syllabary: KanaSyllabary;
  title: string;
  subtitle?: string;
  representativeKana: string;
  characters: KanaCharacter[];
};

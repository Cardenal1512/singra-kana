import type { KanaSyllabary } from '@/src/features/hiragana/domain/models/WritingSystem';

export type KanaCharacter = {
  id: string;
  syllabary: KanaSyllabary;
  kana: string;
  romaji: string;
  alternativeRomaji?: string[];
  group: string;
};

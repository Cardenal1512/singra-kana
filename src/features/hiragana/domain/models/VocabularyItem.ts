import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularySource } from '@/src/features/hiragana/domain/models/VocabularySource';
import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';

export type VocabularyItem = {
  id: string;
  kana: string;
  kanaSystem: 'hiragana' | 'katakana' | 'kanji';
  writingSystem: VocabularyWritingSystem;
  japanese: string;
  readingKana?: string;
  romaji: string;
  meaningEs?: string;
  meaningEn?: string;
  category?: string;
  kanaSeries?: string;
  tags: string[];
  level?: string;
  source: VocabularySource;
  isActive: boolean;
  isOfficial: boolean;
  approved: boolean;
  images: VocabularyImage[];
  createdAt: string;
  updatedAt: string;
};

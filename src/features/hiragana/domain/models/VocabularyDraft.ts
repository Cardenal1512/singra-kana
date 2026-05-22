import type { DraftStatus } from '@/src/features/hiragana/domain/models/DraftStatus';
import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';

export type VocabularyDraft = {
  id: string;
  japanese: string;
  readingKana: string;
  romaji: string[];
  meaningEs?: string;
  meaningEn?: string;
  mainKana: string;
  kanaSeries?: string;
  writingSystem: VocabularyWritingSystem;
  category?: string;
  approvedImagePath: string;
  status: DraftStatus;
  source: 'manual';
  createdAt?: string;
  updatedAt?: string;
};

export type CreateVocabularyDraftInput = {
  japanese: string;
  readingKana: string;
  romaji: string[];
  meaningEs?: string;
  meaningEn?: string;
  mainKana: string;
  kanaSeries?: string;
  writingSystem: VocabularyWritingSystem;
  category?: string;
  manualImage: ManualVocabularyImage;
};

export type ManualVocabularyImage = {
  fileName: string;
  height: number;
  mimeType: string;
  uri: string;
  width: number;
};

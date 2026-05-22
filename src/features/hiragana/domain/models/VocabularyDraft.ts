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
  imagePrompt?: string;
  imagePromptStyleVersion?: string;
  imagePromptReferenceBucket?: string;
  imagePromptReferencePath?: string;
  generatedImagePath?: string;
  imageGenerationStatus?: ImageGenerationStatus;
  imageGenerationError?: string;
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
  imagePrompt?: string;
  imagePromptStyleVersion?: string;
  imagePromptReferenceBucket?: string;
  imagePromptReferencePath?: string;
};

export type ImageGenerationStatus = 'idle' | 'generating' | 'generated' | 'failed';

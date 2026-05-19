import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';

export type DictionaryCandidateOrigin = 'local' | 'external';

export type DictionaryCandidate = {
  id: string;
  origin: DictionaryCandidateOrigin;
  japanese: string;
  readingKana: string;
  romaji: string[];
  meaningEs?: string;
  meaningEn?: string;
  suggestedWritingSystem: VocabularyWritingSystem;
};

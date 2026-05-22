import type { VocabularyDraft } from '@/src/features/hiragana/domain/models/VocabularyDraft';

export type GenerateVocabularyImageInput = {
  draftId: string;
  imagePrompt: string;
  referenceImageBucket: string;
  referenceImagePath: string;
};

export interface ImageGenerationRepository {
  generateVocabularyImage(input: GenerateVocabularyImageInput): Promise<VocabularyDraft>;
}

import type { VocabularyDraft } from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type { ImageGenerationRepository } from '@/src/features/hiragana/domain/repositories/ImageGenerationRepository';

export type GenerateVocabularyImageUseCaseInput = {
  draft: VocabularyDraft;
};

export class GenerateVocabularyImageUseCase {
  constructor(private readonly imageGenerationRepository: ImageGenerationRepository) {}

  async execute(input: GenerateVocabularyImageUseCaseInput): Promise<VocabularyDraft> {
    const { draft } = input;

    if (!draft.imagePrompt) {
      throw new Error('Vocabulary draft does not have an image prompt');
    }

    if (!draft.imagePromptReferenceBucket || !draft.imagePromptReferencePath) {
      throw new Error('Vocabulary draft does not have a reference image');
    }

    return this.imageGenerationRepository.generateVocabularyImage({
      draftId: draft.id,
      imagePrompt: draft.imagePrompt,
      referenceImageBucket: draft.imagePromptReferenceBucket,
      referenceImagePath: draft.imagePromptReferencePath,
    });
  }
}

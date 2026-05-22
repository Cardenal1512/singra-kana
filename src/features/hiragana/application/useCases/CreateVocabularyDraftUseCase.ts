import type {
  CreateVocabularyDraftInput,
  VocabularyDraft,
} from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type { VocabularyDraftRepository } from '@/src/features/hiragana/domain/repositories/VocabularyDraftRepository';
import { GenerateVocabularyImagePromptUseCase } from '@/src/features/hiragana/application/useCases/GenerateVocabularyImagePromptUseCase';
import {
  vocabularyImagePromptReferenceBucket,
  vocabularyImagePromptReferencePath,
  vocabularyImagePromptStyleVersion,
} from '@/src/features/hiragana/application/services/VocabularyImagePromptBuilder';

export class CreateVocabularyDraftUseCase {
  constructor(
    private readonly vocabularyDraftRepository: VocabularyDraftRepository,
    private readonly generateVocabularyImagePromptUseCase = new GenerateVocabularyImagePromptUseCase(),
  ) {}

  async execute(input: CreateVocabularyDraftInput): Promise<VocabularyDraft> {
    const romaji = input.romaji.map((item) => item.trim()).filter(Boolean);
    const imagePrompt = input.imagePrompt
      ? {
          prompt: input.imagePrompt,
          styleVersion: input.imagePromptStyleVersion ?? vocabularyImagePromptStyleVersion,
          referenceImageBucket:
            input.imagePromptReferenceBucket ?? vocabularyImagePromptReferenceBucket,
          referenceImagePath: input.imagePromptReferencePath ?? vocabularyImagePromptReferencePath,
        }
      : this.generateVocabularyImagePromptUseCase.execute({
          japanese: input.japanese.trim(),
          reading: input.readingKana.trim(),
          romaji,
          meaningEn: input.meaningEn?.trim() || undefined,
          meaningEs: input.meaningEs?.trim() || undefined,
          selectedKana: input.mainKana.trim(),
          selectedKanaSeries: input.kanaSeries,
          writingSystem: input.writingSystem,
        });

    return this.vocabularyDraftRepository.create({
      ...input,
      japanese: input.japanese.trim(),
      readingKana: input.readingKana.trim(),
      mainKana: input.mainKana.trim(),
      romaji,
      meaningEs: input.meaningEs?.trim() || undefined,
      meaningEn: input.meaningEn?.trim() || undefined,
      imagePrompt: imagePrompt.prompt,
      imagePromptStyleVersion: imagePrompt.styleVersion,
      imagePromptReferenceBucket: imagePrompt.referenceImageBucket,
      imagePromptReferencePath: imagePrompt.referenceImagePath,
    });
  }
}

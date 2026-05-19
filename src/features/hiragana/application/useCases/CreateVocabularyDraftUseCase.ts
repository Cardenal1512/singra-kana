import type {
  CreateVocabularyDraftInput,
  VocabularyDraft,
} from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type { VocabularyDraftRepository } from '@/src/features/hiragana/domain/repositories/VocabularyDraftRepository';

export class CreateVocabularyDraftUseCase {
  constructor(private readonly vocabularyDraftRepository: VocabularyDraftRepository) {}

  async execute(input: CreateVocabularyDraftInput): Promise<VocabularyDraft> {
    return this.vocabularyDraftRepository.create({
      ...input,
      japanese: input.japanese.trim(),
      readingKana: input.readingKana.trim(),
      mainKana: input.mainKana.trim(),
      romaji: input.romaji.map((item) => item.trim()).filter(Boolean),
      meaningEs: input.meaningEs?.trim() || undefined,
      meaningEn: input.meaningEn?.trim() || undefined,
    });
  }
}

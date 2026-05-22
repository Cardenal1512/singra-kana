import {
  VocabularyImagePromptBuilder,
  type VocabularyImagePromptInput,
  type VocabularyImagePromptResult,
} from '@/src/features/hiragana/application/services/VocabularyImagePromptBuilder';

export class GenerateVocabularyImagePromptUseCase {
  constructor(private readonly promptBuilder = new VocabularyImagePromptBuilder()) {}

  execute(input: VocabularyImagePromptInput): VocabularyImagePromptResult {
    return this.promptBuilder.build(input);
  }
}

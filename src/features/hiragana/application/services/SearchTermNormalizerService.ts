import { InputLanguageDetectionService } from '@/src/features/hiragana/application/services/InputLanguageDetectionService';
import type { DictionaryInputLanguage } from '@/src/features/hiragana/application/services/InputLanguageDetectionService';
import type { SpanishToEnglishDictionaryRepository } from '@/src/features/hiragana/domain/repositories/SpanishToEnglishDictionaryRepository';

export type NormalizedDictionarySearchTerm = {
  input: string;
  externalSearchTerm: string;
  language: DictionaryInputLanguage;
};

export class SearchTermNormalizerService {
  private readonly inputLanguageDetectionService = new InputLanguageDetectionService();

  constructor(
    private readonly spanishToEnglishDictionaryRepository: SpanishToEnglishDictionaryRepository,
  ) {}

  async normalize(input: string): Promise<NormalizedDictionarySearchTerm> {
    const normalizedInput = input.trim();
    const englishTranslation = await this.spanishToEnglishDictionaryRepository.translate(normalizedInput);
    const language = this.inputLanguageDetectionService.detect(normalizedInput, Boolean(englishTranslation));

    return {
      input: normalizedInput,
      externalSearchTerm: englishTranslation ?? normalizedInput,
      language,
    };
  }
}

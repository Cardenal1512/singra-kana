export type DictionaryInputLanguage = 'spanish' | 'english' | 'japanese';

const japanesePattern = /[\u3041-\u3096\u30A1-\u30FA\u4E00-\u9FFF]/u;

export class InputLanguageDetectionService {
  detect(input: string, hasSpanishTranslation: boolean): DictionaryInputLanguage {
    if (japanesePattern.test(input)) {
      return 'japanese';
    }

    if (hasSpanishTranslation) {
      return 'spanish';
    }

    return 'english';
  }
}

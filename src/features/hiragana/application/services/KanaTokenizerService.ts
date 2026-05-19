import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';

const hiraganaPattern = /[\u3041-\u3096]/u;
const katakanaPattern = /[\u30A1-\u30FA]/u;
const kanjiPattern = /[\u4E00-\u9FFF]/u;

export class KanaTokenizerService {
  tokenize(value: string): string[] {
    const tokens: string[] = [];

    for (const character of value.trim()) {
      if (this.isJapaneseWritingCharacter(character) && !tokens.includes(character)) {
        tokens.push(character);
      }
    }

    return tokens;
  }

  resolveWritingSystem(value: string): VocabularyWritingSystem {
    const hasHiragana = hiraganaPattern.test(value);
    const hasKatakana = katakanaPattern.test(value);
    const hasKanji = kanjiPattern.test(value);
    const writingSystems = [hasHiragana, hasKatakana, hasKanji].filter(Boolean).length;

    if (writingSystems > 1) {
      return 'mixed';
    }

    if (hasKatakana) {
      return 'katakana';
    }

    if (hasKanji) {
      return 'kanji';
    }

    return 'hiragana';
  }

  private isJapaneseWritingCharacter(character: string) {
    return (
      hiraganaPattern.test(character) ||
      katakanaPattern.test(character) ||
      kanjiPattern.test(character)
    );
  }
}

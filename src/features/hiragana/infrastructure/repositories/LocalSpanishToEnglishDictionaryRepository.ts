import type { SpanishToEnglishDictionaryRepository } from '@/src/features/hiragana/domain/repositories/SpanishToEnglishDictionaryRepository';

const spanishToEnglishTerms: Record<string, string> = {
  casa: 'house',
  gato: 'cat',
  melon: 'melon',
  melón: 'melon',
  perro: 'dog',
  rana: 'frog',
};

export class LocalSpanishToEnglishDictionaryRepository
  implements SpanishToEnglishDictionaryRepository
{
  async translate(term: string): Promise<string | undefined> {
    return spanishToEnglishTerms[normalizeSpanishTerm(term)];
  }
}

function normalizeSpanishTerm(term: string) {
  return term.trim().toLowerCase();
}

export interface SpanishToEnglishDictionaryRepository {
  translate(term: string): Promise<string | undefined>;
}

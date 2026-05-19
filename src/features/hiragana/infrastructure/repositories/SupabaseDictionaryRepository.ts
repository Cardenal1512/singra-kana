import type { SupabaseClient } from '@supabase/supabase-js';

import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { DictionaryRepository } from '@/src/features/hiragana/domain/repositories/DictionaryRepository';
import {
  mapSupabaseVocabularyRowToDomain,
  type SupabaseVocabularyRow,
} from '@/src/features/hiragana/infrastructure/mappers/SupabaseVocabularyMapper';
import { mapVocabularyItemToLocalDictionaryCandidate } from '@/src/features/hiragana/infrastructure/mappers/LocalDictionaryCandidateMapper';

const dictionaryVocabularyColumns = [
  'id',
  'kana',
  'writing_system',
  'japanese',
  'romaji',
  'meaning_es',
  'meaning_en',
  'image_path',
  'category',
  'kana_series',
  'source',
  'approved',
  'created_at',
].join(',');

type SupabaseDictionaryQuery = ReturnType<SupabaseClient['from']> & {
  eq(column: string, value: unknown): SupabaseDictionaryQuery;
  contains(column: string, value: unknown[]): SupabaseDictionaryQuery;
  ilike(column: string, pattern: string): SupabaseDictionaryQuery;
  limit(count: number): SupabaseDictionaryQuery;
  returns<T>(): Promise<{ data: T | null; error: Error | null }>;
};

export class SupabaseDictionaryRepository implements Pick<DictionaryRepository, 'searchLocal'> {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async searchLocal(query: string): Promise<DictionaryCandidate[]> {
    if (!this.client) {
      return [];
    }

    const normalizedQuery = query.trim();
    const [japaneseResults, romajiResults, meaningEsResults, meaningEnResults] = await Promise.all([
      this.searchByJapanese(normalizedQuery),
      this.searchByRomaji(normalizedQuery.toLowerCase()),
      this.searchByMeaning('meaning_es', normalizedQuery),
      this.searchByMeaning('meaning_en', normalizedQuery),
    ]);

    return [...japaneseResults, ...romajiResults, ...meaningEsResults, ...meaningEnResults]
      .map(mapSupabaseVocabularyRowToDomain)
      .map(mapVocabularyItemToLocalDictionaryCandidate);
  }

  private async searchByJapanese(query: string): Promise<SupabaseVocabularyRow[]> {
    if (!this.client) {
      return [];
    }

    const { data, error } = await (this.client
      .from('vocabulary')
      .select(dictionaryVocabularyColumns)
      .eq('approved', true)
      .ilike('japanese', `%${query}%`)
      .limit(12) as unknown as SupabaseDictionaryQuery).returns<SupabaseVocabularyRow[]>();

    if (error) {
      throw new Error(`Supabase local japanese search failed: ${error.message}`);
    }

    return data ?? [];
  }

  private async searchByRomaji(query: string): Promise<SupabaseVocabularyRow[]> {
    if (!this.client) {
      return [];
    }

    const { data, error } = await (this.client
      .from('vocabulary')
      .select(dictionaryVocabularyColumns)
      .eq('approved', true)
      .contains('romaji', [query])
      .limit(12) as unknown as SupabaseDictionaryQuery).returns<SupabaseVocabularyRow[]>();

    if (error) {
      throw new Error(`Supabase local romaji search failed: ${error.message}`);
    }

    return data ?? [];
  }

  private async searchByMeaning(
    column: 'meaning_es' | 'meaning_en',
    query: string,
  ): Promise<SupabaseVocabularyRow[]> {
    if (!this.client) {
      return [];
    }

    const { data, error } = await (this.client
      .from('vocabulary')
      .select(dictionaryVocabularyColumns)
      .eq('approved', true)
      .ilike(column, `%${query}%`)
      .limit(12) as unknown as SupabaseDictionaryQuery).returns<SupabaseVocabularyRow[]>();

    if (error) {
      throw new Error(`Supabase local ${column} search failed: ${error.message}`);
    }

    return data ?? [];
  }
}

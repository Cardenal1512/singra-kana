import type { SupabaseClient } from '@supabase/supabase-js';

import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';
import {
  mapSupabaseKanaCharacterToDomain,
  mapSupabaseKanaSeriesToDomain,
  type SupabaseKanaCharacterRow,
  type SupabaseKanaSeriesRow,
} from '@/src/features/hiragana/infrastructure/mappers/SupabaseKanaCatalogMapper';

const seriesColumns = 'id,title,subtitle,representative_kana,display_order,enabled';
const characterColumns = 'id,series_id,kana,romaji,romaji_aliases,display_order,enabled';

export class SupabaseKanaCatalogRepository implements KanaCatalogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getSeries(): Promise<KanaSeries[]> {
    const [seriesRows, characterRows] = await Promise.all([
      this.getSeriesRows(),
      this.getCharacterRows(),
    ]);

    return seriesRows.map((series) =>
      mapSupabaseKanaSeriesToDomain(
        series,
        characterRows
          .filter((character) => character.series_id === series.id)
          .map(mapSupabaseKanaCharacterToDomain),
      ),
    );
  }

  async getSeriesById(id: string): Promise<KanaSeries | undefined> {
    return (await this.getSeries()).find((series) => series.id === id);
  }

  async getCharactersBySeries(seriesId: string): Promise<KanaCharacter[]> {
    const { data, error } = await this.client
      .from('kana_character')
      .select(characterColumns)
      .eq('enabled', true)
      .eq('series_id', seriesId)
      .order('display_order', { ascending: true })
      .returns<SupabaseKanaCharacterRow[]>();

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapSupabaseKanaCharacterToDomain);
  }

  async getAllCharacters(): Promise<KanaCharacter[]> {
    return (await this.getCharacterRows()).map(mapSupabaseKanaCharacterToDomain);
  }

  private async getSeriesRows(): Promise<SupabaseKanaSeriesRow[]> {
    const { data, error } = await this.client
      .from('kana_series')
      .select(seriesColumns)
      .eq('enabled', true)
      .order('display_order', { ascending: true })
      .returns<SupabaseKanaSeriesRow[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  private async getCharacterRows(): Promise<SupabaseKanaCharacterRow[]> {
    const { data, error } = await this.client
      .from('kana_character')
      .select(characterColumns)
      .eq('enabled', true)
      .order('display_order', { ascending: true })
      .returns<SupabaseKanaCharacterRow[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}

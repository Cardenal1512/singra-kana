import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  UpdateUserSettingsInput,
  UserSettings,
} from '@/src/features/user/domain/models/UserSettings';
import type { UserSettingsRepository } from '@/src/features/user/domain/repositories/UserSettingsRepository';
import {
  mapSupabaseUserSettingsRowToDomain,
  mapUpdateUserSettingsInputToSupabaseRow,
  type SupabaseUserSettingsRow,
  type SupabaseUserSettingsUpdateRow,
} from '@/src/features/user/infrastructure/mappers/SupabaseUserSettingsMapper';

const userSettingsColumns = [
  'user_id',
  'sound_enabled',
  'music_enabled',
  'haptics_enabled',
  'romaji_enabled',
  'show_hints',
  'left_handed_mode',
  'ai_feedback_enabled',
  'theme',
  'created_at',
  'updated_at',
].join(',');

type SupabaseUserSettingsQuery = ReturnType<SupabaseClient['from']> & {
  eq(column: string, value: unknown): SupabaseUserSettingsQuery;
  maybeSingle(): Promise<{ data: SupabaseUserSettingsRow | null; error: Error | null }>;
  select(columns: string): SupabaseUserSettingsQuery;
  update(value: SupabaseUserSettingsUpdateRow): SupabaseUserSettingsQuery;
};

export class SupabaseUserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async getByUserId(userId: string): Promise<UserSettings | undefined> {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (this.client
      .from('user_settings')
      .select(userSettingsColumns)
      .eq('user_id', userId) as unknown as SupabaseUserSettingsQuery).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapSupabaseUserSettingsRowToDomain(data) : undefined;
  }

  async update(userId: string, input: UpdateUserSettingsInput): Promise<UserSettings> {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (this.client
      .from('user_settings')
      .update(mapUpdateUserSettingsInputToSupabaseRow(input))
      .eq('user_id', userId)
      .select(userSettingsColumns) as unknown as SupabaseUserSettingsQuery).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('User settings were not updated');
    }

    return mapSupabaseUserSettingsRowToDomain(data);
  }
}

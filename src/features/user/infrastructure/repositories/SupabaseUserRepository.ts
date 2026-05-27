import type { SupabaseClient } from '@supabase/supabase-js';

import type { AppUser, UpdateUserProfileInput } from '@/src/features/user/domain/models/AppUser';
import type { UserRepository } from '@/src/features/user/domain/repositories/UserRepository';
import {
  mapSupabaseAppUserRowToDomain,
  mapUpdateUserProfileInputToSupabaseRow,
  type SupabaseAppUserRow,
  type SupabaseAppUserUpdateRow,
} from '@/src/features/user/infrastructure/mappers/SupabaseUserMapper';

const appUserColumns = [
  'id',
  'username',
  'display_name',
  'avatar_key',
  'preferred_language',
  'current_syllabary',
  'current_level',
  'daily_goal_minutes',
  'daily_goal_lessons',
  'streak_days',
  'total_practice_days',
  'total_practice_sessions',
  'total_practice_time_seconds',
  'last_practiced_at',
  'last_seen_at',
  'created_at',
  'updated_at',
].join(',');

type SupabaseMaybeSingleQuery = ReturnType<SupabaseClient['from']> & {
  eq(column: string, value: unknown): SupabaseMaybeSingleQuery;
  maybeSingle(): Promise<{ data: SupabaseAppUserRow | null; error: Error | null }>;
  select(columns: string): SupabaseMaybeSingleQuery;
  update(value: SupabaseAppUserUpdateRow | { last_seen_at: string; updated_at: string }): SupabaseMaybeSingleQuery;
};

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async findById(id: string): Promise<AppUser | undefined> {
    return this.findBy('id', id);
  }

  async findByUsername(username: string): Promise<AppUser | undefined> {
    return this.findBy('username', username);
  }

  async touchLastSeen(id: string, seenAt = new Date().toISOString()): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await (this.client
      .from('app_user')
      .update({
        last_seen_at: seenAt,
        updated_at: seenAt,
      })
      .eq('id', id)
      .select(appUserColumns) as unknown as SupabaseMaybeSingleQuery).maybeSingle();

    if (error) {
      throw error;
    }
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<AppUser> {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (this.client
      .from('app_user')
      .update(mapUpdateUserProfileInputToSupabaseRow(input))
      .eq('id', id)
      .select(appUserColumns) as unknown as SupabaseMaybeSingleQuery).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('User profile was not updated');
    }

    return mapSupabaseAppUserRowToDomain(data);
  }

  private async findBy(column: 'id' | 'username', value: string) {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (this.client
      .from('app_user')
      .select(appUserColumns)
      .eq(column, value) as unknown as SupabaseMaybeSingleQuery).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapSupabaseAppUserRowToDomain(data) : undefined;
  }
}

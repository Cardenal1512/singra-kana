import type { LocalUserSession } from '@/src/features/user/domain/models/LocalUserSession';

export interface LocalUserSessionStorage {
  getCurrentSession(): Promise<LocalUserSession | undefined>;
  setCurrentSession(session: LocalUserSession): Promise<void>;
  getCurrentUserId(): Promise<string | undefined>;
  setCurrentUserId(userId: string): Promise<void>;
  clearCurrentSession(): Promise<void>;
  clearCurrentUserId(): Promise<void>;
}

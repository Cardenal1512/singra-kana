import type { AppUser, UpdateUserProfileInput } from '@/src/features/user/domain/models/AppUser';

export interface UserRepository {
  findById(id: string): Promise<AppUser | undefined>;
  findByUsername(username: string): Promise<AppUser | undefined>;
  touchLastSeen(id: string, seenAt?: string): Promise<void>;
  updateProfile(id: string, input: UpdateUserProfileInput): Promise<AppUser>;
}

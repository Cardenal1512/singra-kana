import { defaultUser } from '@/src/features/user/application/services/defaultUser';
import type { AppUser, UpdateUserProfileInput } from '@/src/features/user/domain/models/AppUser';
import type { UserRepository } from '@/src/features/user/domain/repositories/UserRepository';

export class MockUserRepository implements UserRepository {
  private user: AppUser;

  constructor(user: AppUser = defaultUser) {
    this.user = user;
  }

  async findById(id: string) {
    return this.user.id === id ? this.user : undefined;
  }

  async findByUsername(username: string) {
    return this.user.username === username ? this.user : undefined;
  }

  async touchLastSeen(id: string, seenAt = new Date().toISOString()) {
    if (this.user.id === id) {
      this.user = {
        ...this.user,
        lastSeenAt: seenAt,
        updatedAt: seenAt,
      };
    }
  }

  async updateProfile(id: string, input: UpdateUserProfileInput) {
    if (this.user.id !== id) {
      throw new Error('User not found');
    }

    this.user = {
      ...this.user,
      avatarKey: input.avatarKey === null ? undefined : input.avatarKey ?? this.user.avatarKey,
      currentLevel: input.currentLevel ?? this.user.currentLevel,
      currentSyllabary: input.currentSyllabary ?? this.user.currentSyllabary,
      dailyGoalLessons: input.dailyGoalLessons ?? this.user.dailyGoalLessons,
      dailyGoalMinutes: input.dailyGoalMinutes ?? this.user.dailyGoalMinutes,
      displayName: input.displayName ?? this.user.displayName,
      preferredLanguage: input.preferredLanguage ?? this.user.preferredLanguage,
      updatedAt: new Date().toISOString(),
    };

    return this.user;
  }
}

import type { AppUser, UpdateUserProfileInput } from '@/src/features/user/domain/models/AppUser';
import type { UserRepository } from '@/src/features/user/domain/repositories/UserRepository';

export class FallbackUserRepository implements UserRepository {
  constructor(
    private readonly primaryRepository: UserRepository,
    private readonly fallbackRepository: UserRepository,
  ) {}

  async findById(id: string): Promise<AppUser | undefined> {
    try {
      return await this.primaryRepository.findById(id);
    } catch {
      return this.fallbackRepository.findById(id);
    }
  }

  async findByUsername(username: string): Promise<AppUser | undefined> {
    try {
      return await this.primaryRepository.findByUsername(username);
    } catch {
      return this.fallbackRepository.findByUsername(username);
    }
  }

  async touchLastSeen(id: string, seenAt?: string): Promise<void> {
    try {
      await this.primaryRepository.touchLastSeen(id, seenAt);
    } catch {
      await this.fallbackRepository.touchLastSeen(id, seenAt);
    }
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<AppUser> {
    try {
      return await this.primaryRepository.updateProfile(id, input);
    } catch {
      return this.fallbackRepository.updateProfile(id, input);
    }
  }
}

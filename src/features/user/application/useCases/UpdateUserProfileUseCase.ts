import type { UpdateUserProfileInput } from '@/src/features/user/domain/models/AppUser';
import type { UserRepository } from '@/src/features/user/domain/repositories/UserRepository';

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(userId: string, input: UpdateUserProfileInput) {
    return this.userRepository.updateProfile(userId, input);
  }
}

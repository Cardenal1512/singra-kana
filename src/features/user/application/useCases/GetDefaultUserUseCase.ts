import { createDefaultUserSession } from '@/src/features/user/application/services/defaultUser';

export class GetDefaultUserUseCase {
  execute() {
    return createDefaultUserSession();
  }
}

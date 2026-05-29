import type { AppUsageInput } from '@/src/features/user/domain/models/AppUsage';
import type { AppUsageRepository } from '@/src/features/user/domain/repositories/AppUsageRepository';

export class RecordAppUsageUseCase {
  constructor(private readonly repository: AppUsageRepository) {}

  execute(input: AppUsageInput) {
    return this.repository.recordUsage(input);
  }
}

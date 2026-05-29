import type {
  AppUsageInput,
  AppUsageRecordResult,
} from '@/src/features/user/domain/models/AppUsage';
import type { AppUsageRepository } from '@/src/features/user/domain/repositories/AppUsageRepository';

export class MockAppUsageRepository implements AppUsageRepository {
  async recordUsage(_input: AppUsageInput): Promise<AppUsageRecordResult> {
    return { success: true };
  }
}

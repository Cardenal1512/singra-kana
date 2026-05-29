import type {
  AppUsageInput,
  AppUsageRecordResult,
} from '@/src/features/user/domain/models/AppUsage';

export interface AppUsageRepository {
  recordUsage(input: AppUsageInput): Promise<AppUsageRecordResult>;
}

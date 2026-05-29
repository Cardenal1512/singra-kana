import type {
  PracticeSessionInput,
  PracticeSessionRecordResult,
} from '@/src/features/hiragana/domain/models/PracticeSession';

export interface PracticeSessionRepository {
  recordSession(input: PracticeSessionInput): Promise<PracticeSessionRecordResult>;
}

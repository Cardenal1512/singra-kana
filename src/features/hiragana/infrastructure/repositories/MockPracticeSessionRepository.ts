import type {
  PracticeSessionInput,
  PracticeSessionRecordResult,
} from '@/src/features/hiragana/domain/models/PracticeSession';
import type { PracticeSessionRepository } from '@/src/features/hiragana/domain/repositories/PracticeSessionRepository';

export class MockPracticeSessionRepository implements PracticeSessionRepository {
  async recordSession(input: PracticeSessionInput): Promise<PracticeSessionRecordResult> {
    console.info('[mock-practice-session] Recorded session', {
      attempts: input.attempts.length,
      mode: input.practiceMode,
      userId: input.userId,
    });

    return {
      success: true,
      sessionId: `mock-${Date.now()}`,
    };
  }
}

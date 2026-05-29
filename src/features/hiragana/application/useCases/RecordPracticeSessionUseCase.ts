import type {
  PracticeSessionInput,
  PracticeSessionRecordResult,
} from '@/src/features/hiragana/domain/models/PracticeSession';
import type { PracticeSessionRepository } from '@/src/features/hiragana/domain/repositories/PracticeSessionRepository';

export class RecordPracticeSessionUseCase {
  constructor(private readonly practiceSessionRepository: PracticeSessionRepository) {}

  async execute(input: PracticeSessionInput): Promise<PracticeSessionRecordResult> {
    if (!input.userId || input.attempts.length === 0) {
      return { success: false, error: 'No hay práctica para guardar' };
    }

    return this.practiceSessionRepository.recordSession(input);
  }
}

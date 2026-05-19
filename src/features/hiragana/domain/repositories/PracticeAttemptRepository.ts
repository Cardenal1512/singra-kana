import type {
  PracticeAttempt,
  PracticeTargetType,
} from '@/src/features/hiragana/domain/models/PracticeAttempt';

export interface PracticeAttemptRepository {
  save(attempt: PracticeAttempt): Promise<void>;
  findRecentByTarget(targetType: PracticeTargetType, targetId: string): Promise<PracticeAttempt[]>;
}

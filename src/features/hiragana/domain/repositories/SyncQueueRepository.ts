import type { SyncQueueItem } from '@/src/features/hiragana/domain/models/SyncQueueItem';

export interface SyncQueueRepository {
  enqueue(item: SyncQueueItem): Promise<void>;
  findPending(limit: number): Promise<SyncQueueItem[]>;
  markSynced(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

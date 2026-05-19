export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export type SyncQueueItem = {
  id: string;
  entityType: 'vocabulary_progress' | 'kana_progress' | 'practice_attempt';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  status: SyncStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

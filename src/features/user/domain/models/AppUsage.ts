export type AppUsageInput = {
  userId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type AppUsageRecordResult = {
  success: boolean;
  error?: string;
};

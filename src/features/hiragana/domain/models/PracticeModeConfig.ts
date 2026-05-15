import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';

export type PracticeModeId =
  | 'trace'
  | 'memory'
  | 'romaji'
  | 'words'
  | 'speed'
  | 'listening';

export type PracticeModeConfig = {
  id: PracticeModeId;
  mode?: PracticeMode;
  titleKey: PracticeModeId;
  descriptionKey: PracticeModeId;
  japaneseLabel: string;
  imageKey?: string;
  enabled: boolean;
};

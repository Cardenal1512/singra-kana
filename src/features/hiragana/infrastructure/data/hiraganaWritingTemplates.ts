import type { WritingTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';

export const hiraganaWritingTemplates: WritingTemplate[] = [
  {
    kana: 'あ',
    romaji: 'a',
    strokes: [
      {
        order: 1,
        startPoint: { x: 28, y: 30 },
        endPoint: { x: 72, y: 28 },
        checkpoints: [
          { x: 42, y: 29 },
          { x: 58, y: 29 },
        ],
      },
      {
        order: 2,
        startPoint: { x: 52, y: 18 },
        endPoint: { x: 43, y: 70 },
        checkpoints: [
          { x: 50, y: 34 },
          { x: 47, y: 52 },
        ],
      },
      {
        order: 3,
        startPoint: { x: 70, y: 48 },
        endPoint: { x: 32, y: 78 },
        checkpoints: [
          { x: 58, y: 46 },
          { x: 44, y: 56 },
          { x: 55, y: 76 },
        ],
      },
    ],
  },
];

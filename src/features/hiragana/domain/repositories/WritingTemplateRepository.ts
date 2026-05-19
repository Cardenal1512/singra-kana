import type { WritingTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';

export interface WritingTemplateRepository {
  findByKana(kana: string): Promise<WritingTemplate | undefined>;
}

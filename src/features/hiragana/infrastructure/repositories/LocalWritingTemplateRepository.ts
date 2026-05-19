import type { WritingTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';
import type { WritingTemplateRepository } from '@/src/features/hiragana/domain/repositories/WritingTemplateRepository';
import { hiraganaWritingTemplates } from '@/src/features/hiragana/infrastructure/data/hiraganaWritingTemplates';

export class LocalWritingTemplateRepository implements WritingTemplateRepository {
  async findByKana(kana: string): Promise<WritingTemplate | undefined> {
    return hiraganaWritingTemplates.find((template) => template.kana === kana);
  }
}

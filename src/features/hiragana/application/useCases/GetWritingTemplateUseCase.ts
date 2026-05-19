import type { WritingTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';
import type { WritingTemplateRepository } from '@/src/features/hiragana/domain/repositories/WritingTemplateRepository';

export class GetWritingTemplateUseCase {
  constructor(private readonly writingTemplateRepository: WritingTemplateRepository) {}

  async execute(kana: string): Promise<WritingTemplate | undefined> {
    return this.writingTemplateRepository.findByKana(kana);
  }
}

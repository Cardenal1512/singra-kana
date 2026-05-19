import { KanaTokenizerService } from '@/src/features/hiragana/application/services/KanaTokenizerService';

export class TokenizeKanaUseCase {
  constructor(private readonly kanaTokenizerService: KanaTokenizerService) {}

  execute(value: string): string[] {
    return this.kanaTokenizerService.tokenize(value);
  }
}

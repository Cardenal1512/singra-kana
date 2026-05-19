import { KanaTokenizerService } from '@/src/features/hiragana/application/services/KanaTokenizerService';
import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { DictionaryRepository } from '@/src/features/hiragana/domain/repositories/DictionaryRepository';

const knownReadings: Record<string, { meaningEs: string; meaningEn: string; romaji: string[] }> = {
  あかちゃん: { meaningEs: 'bebé', meaningEn: 'baby', romaji: ['akachan'] },
  いちご: { meaningEs: 'fresa', meaningEn: 'strawberry', romaji: ['ichigo'] },
  うどん: { meaningEs: 'udon', meaningEn: 'udon noodles', romaji: ['udon'] },
  かえる: { meaningEs: 'rana', meaningEn: 'frog', romaji: ['kaeru'] },
  きつね: { meaningEs: 'zorro', meaningEn: 'fox', romaji: ['kitsune'] },
  りんご: { meaningEs: 'manzana', meaningEn: 'apple', romaji: ['ringo'] },
};

export class MockDictionaryRepository implements DictionaryRepository {
  private readonly tokenizer = new KanaTokenizerService();

  async searchLocal(): Promise<DictionaryCandidate[]> {
    return [];
  }

  async searchExternal(query: string): Promise<DictionaryCandidate[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const knownReading = knownReadings[normalizedQuery];

    return [
      {
        id: `mock-${encodeURIComponent(normalizedQuery)}`,
        origin: 'external',
        japanese: normalizedQuery,
        readingKana: normalizedQuery,
        romaji: knownReading?.romaji ?? [],
        meaningEs: knownReading?.meaningEs,
        meaningEn: knownReading?.meaningEn,
        suggestedWritingSystem: this.tokenizer.resolveWritingSystem(normalizedQuery),
      },
    ];
  }
}

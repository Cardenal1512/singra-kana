import { DictionaryCandidateDeduplicationService } from '@/src/features/hiragana/application/services/DictionaryCandidateDeduplicationService';
import { SearchTermNormalizerService } from '@/src/features/hiragana/application/services/SearchTermNormalizerService';
import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { DictionaryRepository } from '@/src/features/hiragana/domain/repositories/DictionaryRepository';
import type { SpanishToEnglishDictionaryRepository } from '@/src/features/hiragana/domain/repositories/SpanishToEnglishDictionaryRepository';

export class SearchDictionaryCandidatesUseCase {
  private readonly deduplicationService = new DictionaryCandidateDeduplicationService();
  private readonly searchTermNormalizerService: SearchTermNormalizerService;

  constructor(
    private readonly dictionaryRepository: DictionaryRepository,
    spanishToEnglishDictionaryRepository: SpanishToEnglishDictionaryRepository,
  ) {
    this.searchTermNormalizerService = new SearchTermNormalizerService(
      spanishToEnglishDictionaryRepository,
    );
  }

  async searchLocal(query: string): Promise<DictionaryCandidate[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    return this.dictionaryRepository.searchLocal(normalizedQuery);
  }

  async searchExternal(query: string): Promise<DictionaryCandidate[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const searchTerm = await this.searchTermNormalizerService.normalize(normalizedQuery);

    return this.dictionaryRepository.searchExternal(searchTerm.externalSearchTerm);
  }

  async searchCombined(query: string): Promise<DictionaryCandidate[]> {
    const localCandidates = await this.searchLocalSafely(query);

    if (localCandidates.length > 0) {
      return this.deduplicationService.deduplicate(localCandidates);
    }

    const searchTerm = await this.searchTermNormalizerService.normalize(query);
    const externalCandidates = await this.dictionaryRepository.searchExternal(
      searchTerm.externalSearchTerm,
    );
    return this.deduplicationService.deduplicate(externalCandidates);
  }

  combine(
    existingCandidates: DictionaryCandidate[],
    newCandidates: DictionaryCandidate[],
  ): DictionaryCandidate[] {
    return this.deduplicationService.deduplicate([...existingCandidates, ...newCandidates]);
  }

  private async searchLocalSafely(query: string): Promise<DictionaryCandidate[]> {
    try {
      return await this.searchLocal(query);
    } catch {
      return [];
    }
  }
}

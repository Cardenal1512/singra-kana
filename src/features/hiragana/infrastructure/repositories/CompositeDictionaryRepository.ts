import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { DictionaryRepository } from '@/src/features/hiragana/domain/repositories/DictionaryRepository';

export class CompositeDictionaryRepository implements DictionaryRepository {
  constructor(
    private readonly localRepository: Pick<DictionaryRepository, 'searchLocal'>,
    private readonly externalRepository: Pick<DictionaryRepository, 'searchExternal'>,
  ) {}

  searchLocal(query: string): Promise<DictionaryCandidate[]> {
    return this.localRepository.searchLocal(query);
  }

  searchExternal(query: string): Promise<DictionaryCandidate[]> {
    return this.externalRepository.searchExternal(query);
  }
}

import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';

export interface DictionaryRepository {
  searchLocal(query: string): Promise<DictionaryCandidate[]>;
  searchExternal(query: string): Promise<DictionaryCandidate[]>;
}

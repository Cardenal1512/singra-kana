import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';

export class DictionaryCandidateDeduplicationService {
  deduplicate(candidates: DictionaryCandidate[]): DictionaryCandidate[] {
    const seenKeys = new Set<string>();
    const uniqueCandidates: DictionaryCandidate[] = [];

    for (const candidate of candidates) {
      const key = this.createKey(candidate);

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueCandidates.push(candidate);
      }
    }

    return uniqueCandidates;
  }

  private createKey(candidate: DictionaryCandidate) {
    const meaning = candidate.meaningEn ?? candidate.meaningEs ?? '';
    return [
      normalize(candidate.japanese),
      normalize(candidate.readingKana),
      normalize(meaning),
    ].join('|');
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase().replaceAll(/\s+/g, ' ');
}

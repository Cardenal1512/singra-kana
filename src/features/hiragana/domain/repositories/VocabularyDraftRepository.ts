import type {
  CreateVocabularyDraftInput,
  VocabularyDraft,
} from '@/src/features/hiragana/domain/models/VocabularyDraft';

export interface VocabularyDraftRepository {
  create(input: CreateVocabularyDraftInput): Promise<VocabularyDraft>;
}

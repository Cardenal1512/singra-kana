import type { VocabularyItemWithImages } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';

export async function getVocabularyItems(
  vocabularyRepository: VocabularyRepository,
): Promise<VocabularyItemWithImages[]> {
  const activeItems = (await vocabularyRepository.getAll()).filter((item) => item.isActive);

  return activeItems.map((item) => ({
    item,
    images: item.images
      .sort((first, second) => first.sortOrder - second.sortOrder),
  }));
}

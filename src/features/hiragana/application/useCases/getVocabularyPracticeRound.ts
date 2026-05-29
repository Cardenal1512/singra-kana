import type {
  VocabularyImage,
  VocabularyItemWithImages,
} from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';
import { getVocabularyItems } from '@/src/features/hiragana/application/useCases/getVocabularyItems';

export async function getVocabularyPracticeRound(
  vocabularyRepository: VocabularyRepository,
  count: number,
  seriesId?: string,
  vocabularyItemId?: string,
): Promise<VocabularyItemWithImages[]> {
  const vocabulary = seriesId
    ? (await vocabularyRepository.getBySeries(seriesId))
      .filter((item) => item.isActive)
      .map((item) => ({
        item,
        images: getUsableImages(item.images),
      }))
    : await getVocabularyItems(vocabularyRepository);
  const filteredVocabulary = vocabularyItemId
    ? vocabulary.filter((entry) => entry.item.id === vocabularyItemId)
    : vocabulary;
  const itemsWithImages = filteredVocabulary
    .map((entry) => ({
      ...entry,
      images: getUsableImages(entry.images),
    }))
    .filter((entry) => entry.images.length > 0);

  if (itemsWithImages.length === 0) {
    return [];
  }

  if (count <= itemsWithImages.length) {
    return shuffle(itemsWithImages).slice(0, count);
  }

  const roundItems: VocabularyItemWithImages[] = [];

  while (roundItems.length < count) {
    roundItems.push(...shuffle(itemsWithImages).slice(0, count - roundItems.length));
  }

  return roundItems;
}

function getUsableImages(images: VocabularyImage[]) {
  return images
    .filter((image) => Boolean(image.imageUrl || image.imagePath || image.localAssetKey))
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

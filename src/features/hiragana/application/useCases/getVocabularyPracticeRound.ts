import type { VocabularyItemWithImages } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';
import { getVocabularyItems } from '@/src/features/hiragana/application/useCases/getVocabularyItems';

export async function getVocabularyPracticeRound(
  vocabularyRepository: VocabularyRepository,
  count: number,
): Promise<VocabularyItemWithImages[]> {
  const vocabulary = await getVocabularyItems(vocabularyRepository);
  const itemsWithImages = vocabulary.filter((entry) => entry.images.length > 0);

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

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

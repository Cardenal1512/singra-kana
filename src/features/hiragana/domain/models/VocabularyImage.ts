import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';

export type VocabularyImage = {
  id: string;
  vocabularyItemId: string;
  imageUrl?: string;
  imagePath?: string;
  localAssetKey?: string;
  altTextEs?: string;
  altTextEn?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VocabularyItemWithImages = {
  item: VocabularyItem;
  images: VocabularyImage[];
};

import type { ImageSourcePropType } from 'react-native';

export type VocabularyItem = {
  id: string;
  japanese: string;
  romaji: string;
  meaningEs?: string;
  meaningEn?: string;
  imageKey?: string;
  imageSource?: ImageSourcePropType;
};

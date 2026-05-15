import type { ImageSourcePropType } from 'react-native';

export const mascotImages = {
  singraHome: require('@/assets/mascots/singra/singra-home.webp'),
  singraSearch: require('@/assets/mascots/singra/singra-search.webp'),
} satisfies Record<string, ImageSourcePropType>;

export const modeImages = {
  trace: require('@/assets/modes/trace.webp'),
  memory: require('@/assets/modes/memory.webp'),
  romaji: require('@/assets/modes/romaji.webp'),
  words: require('@/assets/modes/words.webp'),
  speed: require('@/assets/modes/speed.webp'),
  listening: require('@/assets/modes/listening.webp'),
} satisfies Record<string, ImageSourcePropType>;

export const vocabularyImages = {
  akachan: require('@/assets/vocabulary/akachan.webp'),
  ichigo: require('@/assets/vocabulary/ichigo.webp'),
  udon: require('@/assets/vocabulary/udon.webp'),
  eiga: require('@/assets/vocabulary/eiga.webp'),
  onpu: require('@/assets/vocabulary/onpu.webp'),
  kaeru: require('@/assets/vocabulary/kaeru.webp'),
  kitsune: require('@/assets/vocabulary/kitsune.webp'),
  kuruma: require('@/assets/vocabulary/kuruma.webp'),
  keisanki: require('@/assets/vocabulary/keisanki.webp'),
  kodomo: require('@/assets/vocabulary/kodomo.webp'),
} satisfies Record<string, ImageSourcePropType>;

export const katakanaVocabularyImages = {} satisfies Record<string, ImageSourcePropType>;
export const kanjiVocabularyImages = {} satisfies Record<string, ImageSourcePropType>;

export type MascotImageKey = keyof typeof mascotImages;
export type ModeImageKey = keyof typeof modeImages;
export type VocabularyImageKey = keyof typeof vocabularyImages;
export type KatakanaVocabularyImageKey = keyof typeof katakanaVocabularyImages;
export type KanjiVocabularyImageKey = keyof typeof kanjiVocabularyImages;

// Local assets must be registered with static require calls so Expo can bundle them.
// If a file is removed, remove its registry entry too; unknown keys resolve safely.
export function getMascotImage(imageKey?: string): ImageSourcePropType | undefined {
  return getRegisteredImage(mascotImages, imageKey);
}

export function getModeImage(imageKey?: string): ImageSourcePropType | undefined {
  return getRegisteredImage(modeImages, imageKey);
}

export function getVocabularyImage(imageKey?: string): ImageSourcePropType | undefined {
  return getRegisteredImage(vocabularyImages, imageKey);
}

function getRegisteredImage(
  images: Record<string, ImageSourcePropType>,
  imageKey?: string,
): ImageSourcePropType | undefined {
  if (!imageKey) {
    return undefined;
  }

  return images[imageKey];
}

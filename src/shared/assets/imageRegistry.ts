import type { ImageSourcePropType } from 'react-native';

export const mascotImages = {
  singraGambate: require('@/assets/mascots/singra/gambate.webp'),
  singraHome: require('@/assets/mascots/singra/singra-home.webp'),
  singraPanel: require('@/assets/mascots/singra/panel.webp'),
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
  sakana: require('@/assets/vocabulary/sakana.webp'),
  shishiodoshi: require('@/assets/vocabulary/shishiodoshi.webp'),
  suika: require('@/assets/vocabulary/suika.webp'),
  senpuuki: require('@/assets/vocabulary/senpuuki.webp'),
  souji: require('@/assets/vocabulary/souji.webp'),
  tanuki: require('@/assets/vocabulary/tanuki.webp'),
  chikyuu: require('@/assets/vocabulary/chikyuu.webp'),
  tsukue: require('@/assets/vocabulary/tsukue.webp'),
  tegami: require('@/assets/vocabulary/tegami.webp'),
  toufu: require('@/assets/vocabulary/toufu.webp'),
  namida: require('@/assets/vocabulary/namida.webp'),
  ninjin: require('@/assets/vocabulary/ninjin.webp'),
  nurie: require('@/assets/vocabulary/nurie.webp'),
  nendo: require('@/assets/vocabulary/nendo.webp'),
  norimaki: require('@/assets/vocabulary/norimaki.webp'),
  hanabi: require('@/assets/vocabulary/hanabi.webp'),
  hitsuji: require('@/assets/vocabulary/hitsuji.webp'),
  fuuton: require('@/assets/vocabulary/fuuton.webp'),
  hebi: require('@/assets/vocabulary/hebi.webp'),
  hotaru: require('@/assets/vocabulary/hotaru.webp'),
  makura: require('@/assets/vocabulary/makura.webp'),
  mikan: require('@/assets/vocabulary/mikan.webp'),
  mushiba: require('@/assets/vocabulary/mushiba.webp'),
  megane: require('@/assets/vocabulary/megane.webp'),
  momiji: require('@/assets/vocabulary/momiji.webp'),
  yasai: require('@/assets/vocabulary/yasai.webp'),
  yuuhi: require('@/assets/vocabulary/yuuhi.webp'),
  youchien: require('@/assets/vocabulary/youchien.webp'),
  rakuda: require('@/assets/vocabulary/rakuda.webp'),
  ringo: require('@/assets/vocabulary/ringo.webp'),
  iruka: require('@/assets/vocabulary/iruka.webp'),
  reizouko: require('@/assets/vocabulary/reizouko.webp'),
  rousoku: require('@/assets/vocabulary/rousoku.webp'),
  yuki: require('@/assets/vocabulary/yuki.webp'),
  wataame: require('@/assets/vocabulary/wataame.webp'),
  otsukaresan: require('@/assets/vocabulary/otsukaresan.webp'),
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

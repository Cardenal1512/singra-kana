import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';

const randomKanaCount = 10;

export function createRandomKanaSeries(series: KanaSeries[]): KanaSeries {
  const characters = series.flatMap((item) => item.characters);
  const shuffledCharacters = shuffleCharacters(characters);

  return {
    id: 'random',
    title: 'MODO RANDOM',
    subtitle: '10 random kana',
    representativeKana: '乱',
    characters: shuffledCharacters.slice(0, randomKanaCount),
  };
}

function shuffleCharacters(characters: KanaCharacter[]) {
  const shuffledCharacters = [...characters];

  for (let index = shuffledCharacters.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentCharacter = shuffledCharacters[index];
    shuffledCharacters[index] = shuffledCharacters[randomIndex];
    shuffledCharacters[randomIndex] = currentCharacter;
  }

  return shuffledCharacters;
}

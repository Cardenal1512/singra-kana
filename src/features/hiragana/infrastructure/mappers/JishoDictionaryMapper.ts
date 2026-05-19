import { KanaTokenizerService } from '@/src/features/hiragana/application/services/KanaTokenizerService';
import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';

export type JishoResponse = {
  meta: {
    status: number;
  };
  data: JishoEntry[];
};

export type JishoEntry = {
  slug: string;
  is_common?: boolean;
  tags: string[];
  jlpt: string[];
  japanese: JishoJapanese[];
  senses: JishoSense[];
  attribution: JishoAttribution;
};

type JishoJapanese = {
  word?: string;
  reading?: string;
};

type JishoSense = {
  english_definitions: string[];
  parts_of_speech: string[];
  links: JishoLink[];
  tags: string[];
  restrictions: string[];
  see_also: string[];
  antonyms: string[];
  source: JishoSource[];
  info: string[];
  sentences?: unknown[];
};

type JishoLink = {
  text: string;
  url: string;
};

type JishoSource = {
  language: string;
  word: string;
};

type JishoAttribution = {
  jmdict: boolean;
  jmnedict: boolean;
  dbpedia: boolean | string;
};

const tokenizer = new KanaTokenizerService();
const maxExternalCandidates = 8;

export function mapJishoEntriesToDictionaryCandidates(
  entries: JishoEntry[],
  query: string,
): DictionaryCandidate[] {
  return entries
    .filter((entry) => isUsefulJishoEntry(entry, query))
    .map((entry, index) => ({
      entry,
      index,
      score: scoreJishoEntry(entry, query),
    }))
    .sort((firstEntry, secondEntry) => {
      if (firstEntry.score !== secondEntry.score) {
        return firstEntry.score - secondEntry.score;
      }

      return firstEntry.index - secondEntry.index;
    })
    .map(({ entry }) => entry)
    .map(mapJishoEntryToDictionaryCandidate)
    .filter((candidate): candidate is DictionaryCandidate => Boolean(candidate))
    .slice(0, maxExternalCandidates);
}

export function mapJishoEntryToDictionaryCandidate(
  entry: JishoEntry,
  index: number,
): DictionaryCandidate | undefined {
  const japaneseEntry = entry.japanese[0];
  const japanese = japaneseEntry?.word ?? japaneseEntry?.reading ?? entry.slug;
  const readingKana = japaneseEntry?.reading ?? japaneseEntry?.word ?? entry.slug;
  const englishDefinitions = entry.senses.flatMap((sense) => sense.english_definitions);
  const romaji = kanaToRomaji(readingKana);

  if (!japanese || !readingKana) {
    return undefined;
  }

  return {
    id: `external-jisho-${entry.slug || index}`,
    origin: 'external',
    japanese,
    readingKana,
    romaji: romaji ? [romaji] : [],
    meaningEn: englishDefinitions.join(', ') || undefined,
    suggestedWritingSystem: tokenizer.resolveWritingSystem(japanese),
  };
}

function isUsefulJishoEntry(entry: JishoEntry, query: string) {
  if (!entry.attribution.jmdict) {
    return false;
  }

  if (entry.attribution.dbpedia && !entry.attribution.jmdict) {
    return false;
  }

  if (entry.senses.some(hasWikipediaPartOfSpeech)) {
    return false;
  }

  if (!entry.senses.some(hasUsefulEnglishDefinition)) {
    return false;
  }

  if (entry.japanese.some(hasExplanatoryParentheses)) {
    return false;
  }

  return isDirectlyRelatedToQuery(entry, query);
}

function scoreJishoEntry(entry: JishoEntry, query: string) {
  const queryMatchValues = getQueryMatchValues(query);
  const japaneseValues = getJapaneseValues(entry);
  const definitions = getEnglishDefinitions(entry).map(normalize);

  if (japaneseValues.words.some((word) => queryMatchValues.direct.includes(word))) {
    return 0;
  }

  if (japaneseValues.readings.some((reading) => queryMatchValues.direct.includes(reading))) {
    return 10;
  }

  if (
    japaneseValues.words.some((word) => queryMatchValues.kana.includes(word)) ||
    japaneseValues.readings.some((reading) => queryMatchValues.kana.includes(reading))
  ) {
    return 20;
  }

  if (definitions.some((definition) => queryMatchValues.direct.includes(definition))) {
    return 30;
  }

  if (entry.is_common) {
    return 40;
  }

  if (japaneseValues.all.some((value) => startsWithAny(value, queryMatchValues.all))) {
    return 50;
  }

  if (
    japaneseValues.all.some((value) => containsAny(value, queryMatchValues.all)) ||
    definitions.some((definition) => containsAny(definition, queryMatchValues.direct))
  ) {
    return 60;
  }

  return 70;
}

function hasWikipediaPartOfSpeech(sense: JishoSense) {
  return sense.parts_of_speech.some((part) => normalize(part).includes('wikipedia definition'));
}

function hasUsefulEnglishDefinition(sense: JishoSense) {
  return sense.english_definitions.some((definition) => normalize(definition).length > 0);
}

function hasExplanatoryParentheses(japanese: JishoJapanese) {
  const value = japanese.word ?? '';
  return /[（(].+[）)]/u.test(value);
}

function isDirectlyRelatedToQuery(entry: JishoEntry, query: string) {
  const normalizedQuery = normalize(query);
  const queryMatchValues = getQueryMatchValues(query);

  if (!normalizedQuery) {
    return false;
  }

  if (!containsJapanese(query)) {
    return true;
  }

  return entry.japanese.some((japanese) => {
    const values = [
      normalize(japanese.word ?? ''),
      normalize(japanese.reading ?? ''),
      normalize(entry.slug),
    ].filter(Boolean);

    return values.some((value) => {
      return (
        queryMatchValues.all.includes(value) ||
        startsWithAny(value, queryMatchValues.all) ||
        containsAny(value, queryMatchValues.all)
      );
    });
  });
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function containsJapanese(value: string) {
  return /[\u3041-\u3096\u30A1-\u30FA\u4E00-\u9FFF]/u.test(value);
}

function getQueryMatchValues(query: string) {
  const normalizedQuery = normalize(query);
  const kana = containsJapanese(query) ? [] : [romajiToHiragana(normalizedQuery), romajiToKatakana(normalizedQuery)];

  return {
    direct: [normalizedQuery].filter(Boolean),
    kana: kana.filter(Boolean),
    all: [normalizedQuery, ...kana].filter(Boolean),
  };
}

function getJapaneseValues(entry: JishoEntry) {
  const words = entry.japanese.map((japanese) => normalize(japanese.word ?? '')).filter(Boolean);
  const readings = entry.japanese.map((japanese) => normalize(japanese.reading ?? '')).filter(Boolean);
  const slug = normalize(entry.slug);

  return {
    words,
    readings,
    all: [...words, ...readings, slug].filter(Boolean),
  };
}

function getEnglishDefinitions(entry: JishoEntry) {
  return entry.senses.flatMap((sense) => sense.english_definitions);
}

function startsWithAny(value: string, prefixes: string[]) {
  return prefixes.some((prefix) => prefix && value.startsWith(prefix));
}

function containsAny(value: string, fragments: string[]) {
  return fragments.some((fragment) => fragment && value.includes(fragment));
}

const romajiToKanaMap: Record<string, string> = {
  kya: 'きゃ',
  kyu: 'きゅ',
  kyo: 'きょ',
  sha: 'しゃ',
  shu: 'しゅ',
  sho: 'しょ',
  cha: 'ちゃ',
  chu: 'ちゅ',
  cho: 'ちょ',
  nya: 'にゃ',
  nyu: 'にゅ',
  nyo: 'にょ',
  hya: 'ひゃ',
  hyu: 'ひゅ',
  hyo: 'ひょ',
  mya: 'みゃ',
  myu: 'みゅ',
  myo: 'みょ',
  rya: 'りゃ',
  ryu: 'りゅ',
  ryo: 'りょ',
  gya: 'ぎゃ',
  gyu: 'ぎゅ',
  gyo: 'ぎょ',
  ja: 'じゃ',
  ju: 'じゅ',
  jo: 'じょ',
  bya: 'びゃ',
  byu: 'びゅ',
  byo: 'びょ',
  pya: 'ぴゃ',
  pyu: 'ぴゅ',
  pyo: 'ぴょ',
  shi: 'し',
  chi: 'ち',
  tsu: 'つ',
  fu: 'ふ',
  ka: 'か',
  ki: 'き',
  ku: 'く',
  ke: 'け',
  ko: 'こ',
  sa: 'さ',
  su: 'す',
  se: 'せ',
  so: 'そ',
  ta: 'た',
  te: 'て',
  to: 'と',
  na: 'な',
  ni: 'に',
  nu: 'ぬ',
  ne: 'ね',
  no: 'の',
  ha: 'は',
  hi: 'ひ',
  he: 'へ',
  ho: 'ほ',
  ma: 'ま',
  mi: 'み',
  mu: 'む',
  me: 'め',
  mo: 'も',
  ya: 'や',
  yu: 'ゆ',
  yo: 'よ',
  ra: 'ら',
  ri: 'り',
  ru: 'る',
  re: 'れ',
  ro: 'ろ',
  wa: 'わ',
  wo: 'を',
  ga: 'が',
  gi: 'ぎ',
  gu: 'ぐ',
  ge: 'げ',
  go: 'ご',
  za: 'ざ',
  ji: 'じ',
  zu: 'ず',
  ze: 'ぜ',
  zo: 'ぞ',
  da: 'だ',
  de: 'で',
  do: 'ど',
  ba: 'ば',
  bi: 'び',
  bu: 'ぶ',
  be: 'べ',
  bo: 'ぼ',
  pa: 'ぱ',
  pi: 'ぴ',
  pu: 'ぷ',
  pe: 'ぺ',
  po: 'ぽ',
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'お',
  n: 'ん',
};

function romajiToHiragana(value: string) {
  let remaining = value.replaceAll(/[\s-]/g, '');
  let result = '';

  while (remaining.length > 0) {
    if (remaining.length >= 2 && remaining[0] === remaining[1] && isConsonant(remaining[0])) {
      result += 'っ';
      remaining = remaining.slice(1);
      continue;
    }

    const token = findRomajiToken(remaining);

    if (!token) {
      return '';
    }

    result += romajiToKanaMap[token];
    remaining = remaining.slice(token.length);
  }

  return result;
}

function romajiToKatakana(value: string) {
  return hiraganaToKatakana(romajiToHiragana(value));
}

function findRomajiToken(value: string) {
  return [3, 2, 1].map((length) => value.slice(0, length)).find((token) => romajiToKanaMap[token]);
}

function isConsonant(value: string) {
  return /^[bcdfghjklmnpqrstvwxyz]$/u.test(value) && value !== 'n';
}

function hiraganaToKatakana(value: string) {
  return [...value]
    .map((character) => {
      const codePoint = character.codePointAt(0);

      if (!codePoint || codePoint < 0x3041 || codePoint > 0x3096) {
        return character;
      }

      return String.fromCodePoint(codePoint + 0x60);
    })
    .join('');
}

const kanaToRomajiMap = Object.fromEntries(
  Object.entries(romajiToKanaMap).map(([romaji, kana]) => [kana, romaji]),
);

function kanaToRomaji(value: string) {
  const hiragana = katakanaToHiragana(value);
  let result = '';
  let doubleNextConsonant = false;

  for (let index = 0; index < hiragana.length; index += 1) {
    const twoCharacterKana = hiragana.slice(index, index + 2);
    const twoCharacterRomaji = kanaToRomajiMap[twoCharacterKana];

    if (twoCharacterRomaji) {
      result += applyDoubleConsonant(twoCharacterRomaji, doubleNextConsonant);
      doubleNextConsonant = false;
      index += 1;
      continue;
    }

    const character = hiragana[index];

    if (character === 'っ') {
      doubleNextConsonant = true;
      continue;
    }

    const romaji = kanaToRomajiMap[character];

    if (!romaji) {
      return '';
    }

    result += applyDoubleConsonant(romaji, doubleNextConsonant);
    doubleNextConsonant = false;
  }

  return result;
}

function applyDoubleConsonant(romaji: string, shouldDouble: boolean) {
  if (!shouldDouble) {
    return romaji;
  }

  return `${romaji[0]}${romaji}`;
}

function katakanaToHiragana(value: string) {
  return [...value]
    .map((character) => {
      const codePoint = character.codePointAt(0);

      if (!codePoint || codePoint < 0x30a1 || codePoint > 0x30f6) {
        return character;
      }

      return String.fromCodePoint(codePoint - 0x60);
    })
    .join('');
}

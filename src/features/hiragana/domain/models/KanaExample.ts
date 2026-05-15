export type KanaExample = {
  id: string;
  kana: string;
  word: string;
  romaji: string;
  meaningEs: string;
  meaningEn: string;
  imageKey?: string;
  mascotKey?: string;
  source: 'official' | 'user';
};

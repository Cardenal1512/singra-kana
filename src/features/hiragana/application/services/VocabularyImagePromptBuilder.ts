import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';

export const vocabularyImagePromptStyleVersion = 'singra-vocabulary-v1';
export const vocabularyImagePromptReferenceBucket = 'references';
export const vocabularyImagePromptReferencePath = 'singra.png';

export type VocabularyImagePromptInput = {
  japanese: string;
  reading: string;
  romaji: string[];
  meaningEn?: string;
  meaningEs?: string;
  selectedKana: string;
  selectedKanaSeries?: string;
  writingSystem: VocabularyWritingSystem;
};

export type VocabularyImagePromptResult = {
  prompt: string;
  styleVersion: string;
  referenceImageBucket: string;
  referenceImagePath: string;
};

export class VocabularyImagePromptBuilder {
  build(input: VocabularyImagePromptInput): VocabularyImagePromptResult {
    const prompt = `Use the provided Singra reference image for character identity.

Create a new image of Singra related to:
"${input.japanese}" (${formatMeaning(input)})

Singra must remain the same mascot:
- same rounded yellow body
- same orange hoodie
- same black beanie with red symbol
- same spiral glasses
- same cute face and proportions

Do not transform Singra into the word.
Do not change Singra's body shape.
Do not create a standalone animal or object.

Represent the word only through:
- one simple prop
- one small costume detail
- or one clear pose/action

Style:
- kawaii
- simple
- child-friendly
- pastel colors
- minimal detail
- non realistic

Constraints:
- transparent background
- no text
- centered composition
- 512x512`;

    return {
      prompt,
      styleVersion: vocabularyImagePromptStyleVersion,
      referenceImageBucket: vocabularyImagePromptReferenceBucket,
      referenceImagePath: vocabularyImagePromptReferencePath,
    };
  }
}

function formatMeaning(input: VocabularyImagePromptInput) {
  return input.meaningEn ?? input.meaningEs ?? formatRomaji(input.romaji) ?? input.reading;
}

function formatRomaji(romaji: string[]) {
  return romaji.length > 0 ? romaji.join(', ') : undefined;
}

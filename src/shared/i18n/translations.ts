export type Language = 'en' | 'es';

export const currentLanguage: Language = 'es';

export const translations = {
  en: {
    common: {
      back: 'Back',
      check: 'Check',
      clear: 'Clear',
      next: 'Next',
      restart: 'Restart',
      chooseAnotherSeries: 'Choose another series',
    },
    writing: {
      title: 'Writing practice',
      kanaIntro: 'This is the kana {{kana}}',
      pronunciation: 'Pronounced: {{romaji}}',
      exampleIntro: 'An example word is:',
      traceInstruction: 'Trace with your finger',
      memoryInstruction: 'Write from memory',
      usedIn: 'Used in:',
      finalReviewTitle: 'Final review',
      yourWriting: 'Your writing',
      correct: 'Correct',
    },
    hiragana: {
      title: 'Hiragana',
      subtitle: 'Choose a mode or series',
    },
    quiz: {
      title: 'Romaji quiz',
      correct: 'Correct!',
      correctAnswer: 'Correct answer',
    },
  },
  es: {
    common: {
      back: 'Volver',
      check: 'Comprobar',
      clear: 'Limpiar',
      next: 'Siguiente',
      restart: 'Reiniciar',
      chooseAnotherSeries: 'Elegir otra serie',
    },
    writing: {
      title: 'Práctica de escritura',
      kanaIntro: 'Este es el kana {{kana}}',
      pronunciation: 'Se pronuncia: {{romaji}}',
      exampleIntro: 'Una palabra de ejemplo es:',
      traceInstruction: 'Traza con el dedo',
      memoryInstruction: 'Escribe de memoria',
      usedIn: 'Se usa en:',
      finalReviewTitle: 'Revisión final',
      yourWriting: 'Tu escritura',
      correct: 'Correcto',
    },
    hiragana: {
      title: 'Hiragana',
      subtitle: 'Elige un modo o serie',
    },
    quiz: {
      title: 'Quiz de romaji',
      correct: 'Correcto!',
      correctAnswer: 'Respuesta correcta',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

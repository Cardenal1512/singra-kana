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
      comingSoon: 'Coming soon',
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
    practiceModes: {
      screenTitleSeries: '{{series}} Series',
      subtitle: 'Choose how you want to practice this series',
      trace: {
        title: 'Trace with guide',
        description: 'Copy each kana over a guide',
      },
      memory: {
        title: 'Memory writing',
        description: 'Write each kana without the guide',
      },
      romaji: {
        title: 'Romaji quiz',
        description: 'Type the correct romaji',
      },
      words: {
        title: 'Words',
        description: 'Learn words using these kana',
      },
      speed: {
        title: 'Speed',
        description: 'Answer quickly before time runs out',
      },
      listening: {
        title: 'Listening',
        description: 'Listen and choose the right kana',
      },
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
      comingSoon: 'Próximamente',
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
    practiceModes: {
      screenTitleSeries: 'Serie {{series}}',
      subtitle: 'Elige cómo quieres practicar esta serie',
      trace: {
        title: 'Trazar con guía',
        description: 'Copia cada kana siguiendo la guía',
      },
      memory: {
        title: 'Escritura de memoria',
        description: 'Escribe cada kana sin la guía',
      },
      romaji: {
        title: 'Quiz de romaji',
        description: 'Escribe el romaji correcto',
      },
      words: {
        title: 'Palabras',
        description: 'Aprende palabras que usan estos kana',
      },
      speed: {
        title: 'Velocidad',
        description: 'Responde rápido antes de que acabe el tiempo',
      },
      listening: {
        title: 'Escucha',
        description: 'Escucha y elige el kana correcto',
      },
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

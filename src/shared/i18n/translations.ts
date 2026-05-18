export type Language = 'en' | 'es';

export const translations = {
  en: {
    language: {
      english: 'English',
      label: 'Language',
      spanish: 'Spanish',
    },
    home: {
      title: 'Singra Kana',
      subtitle: 'Learn Japanese step by step',
      hiraganaSubtitle: 'Start with the basic kana syllabary',
      katakanaSubtitle: 'Coming later',
      kanjiSubtitle: 'Coming later',
      mascotLabel: 'Singra, the app mascot',
    },
    common: {
      back: 'Back',
      check: 'Check',
      clear: 'Clear',
      help: 'Help',
      next: 'Next',
      restart: 'Restart',
      repeat: 'Repeat',
      changeMode: 'Change mode',
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
      subtitle: 'Choose how you want to practice',
      randomTitle: 'Random mode',
      randomSubtitle: 'Practice random hiragana kana from all {{count}} available kana',
      seriesPracticeTitle: 'Practice by series',
      seriesPracticeSubtitle: 'Choose a series and train its kana',
      vocabularyTitle: 'Vocabulary practice',
      vocabularySubtitle: 'Look at a picture and write the word in Japanese or romaji',
    },
    quiz: {
      title: 'Romaji quiz',
      correct: 'Correct!',
      correctAnswer: 'Correct answer',
    },
    completion: {
      title: 'Practice complete',
      subtitle: 'Nice work. What would you like to do next?',
    },
  },
  es: {
    language: {
      english: 'Ingl\u00e9s',
      label: 'Idioma',
      spanish: 'Espa\u00f1ol',
    },
    home: {
      title: 'Singra Kana',
      subtitle: 'Aprende japon\u00e9s paso a paso',
      hiraganaSubtitle: 'Empieza con el silabario kana b\u00e1sico',
      katakanaSubtitle: 'M\u00e1s adelante',
      kanjiSubtitle: 'M\u00e1s adelante',
      mascotLabel: 'Singra, mascota de la app',
    },
    common: {
      back: 'Volver',
      check: 'Comprobar',
      clear: 'Limpiar',
      help: 'Ayuda',
      next: 'Siguiente',
      restart: 'Reiniciar',
      repeat: 'Repetir',
      changeMode: 'Cambiar modo',
      chooseAnotherSeries: 'Elegir otra serie',
      comingSoon: 'Pr\u00f3ximamente',
    },
    writing: {
      title: 'Pr\u00e1ctica de escritura',
      kanaIntro: 'Este es el kana {{kana}}',
      pronunciation: 'Se pronuncia: {{romaji}}',
      exampleIntro: 'Una palabra de ejemplo es:',
      traceInstruction: 'Traza con el dedo',
      memoryInstruction: 'Escribe de memoria',
      usedIn: 'Se usa en:',
      finalReviewTitle: 'Revisi\u00f3n final',
      yourWriting: 'Tu escritura',
      correct: 'Correcto',
    },
    practiceModes: {
      screenTitleSeries: 'Serie {{series}}',
      subtitle: 'Elige c\u00f3mo quieres practicar esta serie',
      trace: {
        title: 'Trazar con gu\u00eda',
        description: 'Copia cada kana siguiendo la gu\u00eda',
      },
      memory: {
        title: 'Escritura de memoria',
        description: 'Escribe cada kana sin la gu\u00eda',
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
        description: 'Responde r\u00e1pido antes de que acabe el tiempo',
      },
      listening: {
        title: 'Escucha',
        description: 'Escucha y elige el kana correcto',
      },
    },
    hiragana: {
      title: 'Hiragana',
      subtitle: 'Elige c\u00f3mo quieres practicar',
      randomTitle: 'Modo random',
      randomSubtitle: 'Practica kanas aleatorios de hiragana entre los {{count}} disponibles',
      seriesPracticeTitle: 'Pr\u00e1ctica por series',
      seriesPracticeSubtitle: 'Elige una serie y entrena sus kanas',
      vocabularyTitle: 'Pr\u00e1ctica de vocabulario',
      vocabularySubtitle: 'Mira una imagen y escribe la palabra en japon\u00e9s o romaji',
    },
    quiz: {
      title: 'Quiz de romaji',
      correct: 'Correcto!',
      correctAnswer: 'Respuesta correcta',
    },
    completion: {
      title: 'Pr\u00e1ctica completada',
      subtitle: 'Buen trabajo. \u00bfQu\u00e9 quieres hacer ahora?',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

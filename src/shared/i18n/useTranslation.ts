import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { translations, type Language } from '@/src/shared/i18n/translations';

const defaultLanguage: Language = 'es';
const storageKey = 'singra-kana-language';
const languages = ['en', 'es'] as const;

type TranslationTree = (typeof translations)[Language];
type TranslationContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationTree;
  translate: (key: string) => string;
};

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage() ?? defaultLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    writeStoredLanguage(nextLanguage);
  }, []);

  useEffect(() => {
    const storedLanguage = readStoredLanguage();

    if (storedLanguage) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const value = useMemo<TranslationContextValue>(() => {
    const activeTranslations = translations[language];

    return {
      language,
      setLanguage,
      t: activeTranslations,
      translate: (key: string) => getNestedTranslation(activeTranslations, key) ?? key,
    };
  }, [language, setLanguage]);

  return createElement(TranslationContext.Provider, { value }, children);
}

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    return {
      language: defaultLanguage,
      setLanguage: () => undefined,
      t: translations[defaultLanguage],
      translate: (key: string) => getNestedTranslation(translations[defaultLanguage], key) ?? key,
    };
  }

  return context;
}

function readStoredLanguage(): Language | undefined {
  try {
    const storedLanguage = globalThis.localStorage?.getItem(storageKey);

    return isLanguage(storedLanguage) ? storedLanguage : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredLanguage(language: Language) {
  try {
    globalThis.localStorage?.setItem(storageKey, language);
  } catch {
    // Native builds can run without localStorage; keeping state in memory is enough there.
  }
}

function isLanguage(value: string | null | undefined): value is Language {
  return languages.includes(value as Language);
}

function getNestedTranslation(source: TranslationTree, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((currentValue, keyPart) => {
    if (!currentValue || typeof currentValue !== 'object') {
      return undefined;
    }

    return (currentValue as Record<string, unknown>)[keyPart];
  }, source);

  return typeof value === 'string' ? value : undefined;
}

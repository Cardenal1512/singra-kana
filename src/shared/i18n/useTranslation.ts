import { currentLanguage, translations } from '@/src/shared/i18n/translations';

export function useTranslation() {
  const language = currentLanguage;

  return {
    language,
    t: translations[language],
  };
}

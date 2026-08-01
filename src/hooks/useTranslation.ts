import { useStore } from '@/lib/store';
import { translations, TranslationKey } from '@/lib/translations';

export const useTranslation = () => {
  const language = useStore(state => state.language) || 'en';

  const t = (key: string): string => {
    // If the key exists in our translation dictionary, return it. Otherwise return the key itself.
    const dict = translations[language];
    if (dict && key in dict) {
      return (dict as any)[key];
    }
    return key;
  };

  return { t, language };
};

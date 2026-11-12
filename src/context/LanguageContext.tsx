import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LanguageInfo,
  getLanguageInfo,
} from '../i18n/languages';
import { TranslationKeys } from '../i18n/translations/types';
import { getTranslation } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string;
  currentLanguageInfo: LanguageInfo;
  isRTL: boolean;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'netpal_language_preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch (e) {
      // Ignore localStorage access issues
    }
    return DEFAULT_LANGUAGE;
  });

  const currentLanguageInfo = getLanguageInfo(language);
  const isRTL = !!currentLanguageInfo.isRTL;

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language to localStorage', e);
    }
  };

  useEffect(() => {
    // Update HTML lang and dir attributes for global browser accessibility
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const t = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    return getTranslation(language, key, params);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguageInfo,
        isRTL,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

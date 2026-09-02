import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultLanguages, baseTranslations } from './translations';
import { LanguageInfo } from '../types';

interface I18nContextType {
  language: string;
  isRtl: boolean;
  isRTL: boolean;
  currency: string;
  setCurrency: (curr: string) => void;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageInfo[];
  setLanguagesList: (list: LanguageInfo[]) => void;
  updateCustomTranslations: (lang: string, key: string, val: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('hk_language') || 'en';
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('hk_currency') || 'BDT';
  });

  const [languages, setLanguagesList] = useState<LanguageInfo[]>(() => {
    const saved = localStorage.getItem('hk_languages_list');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return defaultLanguages;
  });

  const [customTranslations, setCustomTranslations] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem('hk_custom_translations');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });

  const currentLangObj = languages.find(l => l.code === language) || defaultLanguages[0];
  const isRtl = currentLangObj.isRtl;

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    localStorage.setItem('hk_currency', curr);
  };

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('hk_language', language);
  }, [language, isRtl]);

  const setLanguage = (newLang: string) => {
    const exists = languages.find(l => l.code === newLang && l.isEnabled);
    if (exists) {
      setLanguageState(newLang);
    } else {
      setLanguageState('en');
    }
  };

  const updateCustomTranslations = (lang: string, key: string, val: string) => {
    setCustomTranslations(prev => {
      const updated = {
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [key]: val,
        },
      };
      localStorage.setItem('hk_custom_translations', JSON.stringify(updated));
      return updated;
    });
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // 1. Check custom admin translations
    let text = customTranslations[language]?.[key];

    // 2. Check base dictionary for current language
    if (!text && baseTranslations[language]) {
      text = baseTranslations[language][key];
    }

    // 3. Fallback to English
    if (!text && baseTranslations['en']) {
      text = baseTranslations['en'][key];
    }

    // 4. Fallback to key if not found
    if (!text) {
      return key;
    }

    // Replace params like {name} or {amount}
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{
      language,
      isRtl,
      isRTL: isRtl,
      currency,
      setCurrency,
      setLanguage,
      t,
      languages,
      setLanguagesList,
      updateCustomTranslations,
    }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultLanguages, baseTranslations } from './translations';
import { LanguageInfo } from '../types';
import { safeStorage } from './storage';

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

const KEY_ALIASES: Record<string, string> = {
  total_income: 'dash_monthly_income',
  total_expenses: 'dash_monthly_expense',
  total_balance: 'dash_total_balance',
  net_savings: 'dash_net_savings',
  recent_transactions: 'dash_recent_transactions',
  add_transaction: 'tx_add_title',
  edit_transaction: 'tx_edit_title',
  add_wallet: 'wallets_add',
  edit_wallet: 'wallets_edit_title',
  set_budget: 'budget_add',
  add_loan: 'loan_add',
  add_goal: 'goal_add',
  person_name: 'loan_person',
  note: 'notes',
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return safeStorage.getItem('hk_language') || 'en';
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    return safeStorage.getItem('hk_currency') || 'BDT';
  });

  const [languages, setLanguagesList] = useState<LanguageInfo[]>(() => {
    const saved = safeStorage.getItem('hk_languages_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, LanguageInfo>();
          defaultLanguages.forEach(dl => map.set(dl.code, dl));
          parsed.forEach((p: any) => {
            const existing = map.get(p.code);
            map.set(p.code, { ...existing, ...p, isEnabled: p.isEnabled ?? true });
          });
          return Array.from(map.values());
        }
      } catch { /* ignore */ }
    }
    return defaultLanguages;
  });

  const [customTranslations, setCustomTranslations] = useState<Record<string, Record<string, string>>>(() => {
    const saved = safeStorage.getItem('hk_custom_translations');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });

  const currentLangObj = languages.find(l => l.code === language)
    || defaultLanguages.find(l => l.code === language)
    || defaultLanguages[0];
  const isRtl = Boolean(currentLangObj?.isRtl);

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    safeStorage.setItem('hk_currency', curr);
  };

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    safeStorage.setItem('hk_language', language);
  }, [language, isRtl]);

  const setLanguage = (newLang: string) => {
    const targetLang = languages.find(l => l.code === newLang)
      || defaultLanguages.find(l => l.code === newLang);
    
    const validCode = targetLang ? targetLang.code : 'en';
    setLanguageState(validCode);
    safeStorage.setItem('hk_language', validCode);

    const isLangRtl = Boolean(targetLang?.isRtl);
    document.documentElement.dir = isLangRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = validCode;

    // Background sync with user profile if logged in
    try {
      const token = safeStorage.getItem('hk_auth_token');
      if (token) {
        fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ preferredLanguage: validCode })
        }).catch(() => {});
      }
    } catch { /* ignore */ }
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
      safeStorage.setItem('hk_custom_translations', JSON.stringify(updated));
      return updated;
    });
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const alias = KEY_ALIASES[key];

    // 1. Check custom admin translations
    let text = customTranslations[language]?.[key] || (alias ? customTranslations[language]?.[alias] : undefined);

    // 2. Check base dictionary for current language
    if (!text && baseTranslations[language]) {
      text = baseTranslations[language][key] || (alias ? baseTranslations[language][alias] : undefined);
    }

    // 3. Fallback to English
    if (!text && baseTranslations['en']) {
      text = baseTranslations['en'][key] || (alias ? baseTranslations['en'][alias] : undefined);
    }

    // 4. Fallback to key or alias title if not found
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

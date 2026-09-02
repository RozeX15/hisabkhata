import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC<{ variant?: 'minimal' | 'full' | 'dropdown' }> = ({ variant = 'dropdown' }) => {
  const { language, setLanguage, languages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition shadow-xs cursor-pointer"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="font-semibold">{currentLang?.nativeName || currentLang?.name}</span>
        {currentLang?.isRtl && (
          <span className="px-1 py-0.2 text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded font-bold">RTL</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 max-h-80 overflow-y-auto focus:outline-none">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Select Global Language</p>
          </div>
          {languages.filter(l => l.isEnabled).map((lang) => (
            <button
              key={lang.code}
              id={`lang-option-${lang.code}`}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-left ${
                language === lang.code
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              } transition`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{lang.nativeName}</span>
                <span className="text-[11px] text-slate-400 font-normal">({lang.name})</span>
              </div>
              {language === lang.code && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

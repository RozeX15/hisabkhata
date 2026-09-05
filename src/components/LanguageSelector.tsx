import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC<{ variant?: 'minimal' | 'full' | 'dropdown'; isDarkBg?: boolean }> = ({ variant = 'dropdown', isDarkBg = false }) => {
  const { language, setLanguage, languages, isRtl } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const availableLangs = languages.filter(l => l.isEnabled !== false);
  const filteredLangs = availableLangs.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  if (variant === 'full') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {availableLangs.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              id={`lang-card-${lang.code}`}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20 shadow-sm'
                  : isDarkBg
                    ? 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-slate-700'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">{lang.nativeName}</span>
                  {lang.isRtl && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-300 rounded font-black">
                      RTL
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{lang.name}</p>
              </div>
              {isSelected ? (
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border transition shadow-xs cursor-pointer ${
          isDarkBg
            ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70'
        }`}
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
        <span className="font-bold">{currentLang?.nativeName || currentLang?.name}</span>
        {currentLang?.isRtl && (
          <span className="px-1 py-0.2 text-[9px] bg-teal-900/60 text-teal-300 rounded font-bold">RTL</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1.5 w-64 origin-top rounded-2xl shadow-2xl border py-2 max-h-96 overflow-hidden flex flex-col focus:outline-none ${
          isDarkBg
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
        } ${isRtl ? 'left-0' : 'right-0'}`}>
          <div className={`px-3 pb-2 border-b ${isDarkBg ? 'border-slate-800' : 'border-slate-100 dark:border-slate-700/60'}`}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Language / ভাষা নির্বাচন</p>
            <input
              type="text"
              placeholder="Search language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full px-2.5 py-1 text-xs rounded-lg border placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isDarkBg
                  ? 'bg-slate-950 border-slate-700 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto max-h-64 py-1">
            {filteredLangs.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-option-${lang.code}`}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-left ${
                    isSelected
                      ? 'bg-teal-950/60 text-teal-300 font-bold'
                      : isDarkBg
                        ? 'text-slate-200 hover:bg-slate-800'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  } transition cursor-pointer`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate">{lang.nativeName}</span>
                    <span className="text-[11px] text-slate-400 font-normal truncate">({lang.name})</span>
                    {lang.isRtl && (
                      <span className="px-1 py-0.2 text-[8px] bg-teal-900/60 text-teal-300 rounded font-bold">RTL</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

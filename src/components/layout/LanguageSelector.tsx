import React, { useState, useRef, useEffect } from 'react';
import { Languages, Search, Check, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageInfo } from '../../i18n/languages';
import { Language } from '../../types';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLanguageInfo, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer focus:outline-blue-500"
      >
        <Globe className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-medium text-slate-800 tracking-tight">
          {currentLanguageInfo.nativeName}
        </span>
        <span className="hidden xl:inline text-[10px] text-slate-400 font-normal">
          ({currentLanguageInfo.name})
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header & Search */}
          <div className="px-3 pb-2 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('selectLanguage')} ({supportedLanguages.length})
              </span>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                20 Indian Languages + English
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchLanguage')}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-50">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching language found
              </div>
            ) : (
              filteredLanguages.map((lang: LanguageInfo) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-blue-50/60 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-900 font-semibold border-l-2 border-blue-600'
                        : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">
                          {lang.nativeName}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">
                          — {lang.name}
                        </span>
                        {lang.isRTL && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                            RTL
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {lang.region}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

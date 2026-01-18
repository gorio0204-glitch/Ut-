import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getFundSuggestions } from '../services/geminiService';

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (isins: string[]) => void;
}

const AddFundModal: React.FC<AddFundModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<{name: string, isin: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const { t } = useLanguage();
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setSuggestions([]);
      setIsSearching(false);
      setIsBulkMode(false);
    }
  }, [isOpen]);

  const handleTextChange = (val: string) => {
    setText(val);
    
    if (isBulkMode) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (val.trim().length > 2) {
      setIsSearching(true);
      debounceRef.current = window.setTimeout(async () => {
        try {
          const results = await getFundSuggestions(val.trim());
          setSuggestions(results);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      }, 600);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (isin: string) => {
    onAdd([isin]);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      const entries = text.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
      if (entries.length > 0) {
        onAdd(entries);
        setText('');
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn relative z-10 border border-slate-100">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{t('addFundModalTitle')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('addFundModalDesc')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200/50">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <label htmlFor="isin" className="block text-sm font-bold text-slate-700">
              {t('isinLabel')}
            </label>
            <button 
              type="button" 
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSuggestions([]);
              }}
              className="text-xs text-blue-600 font-bold hover:underline px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
            >
              {isBulkMode ? "Back to Search" : "Bulk Add Mode"}
            </button>
          </div>

          <div className="relative">
            {isBulkMode ? (
              <textarea
                id="isin"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={t('isinPlaceholder')}
                rows={5}
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm placeholder:text-slate-400 shadow-inner resize-none"
                autoFocus
              />
            ) : (
              <div className="relative">
                <input
                  id="isin"
                  type="text"
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={t('isinPlaceholder')}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm placeholder:text-slate-400 shadow-inner"
                  autoFocus
                  autoComplete="off"
                />
                
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}

                {suggestions.length > 0 && !isBulkMode && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-slideUp">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matches Found</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSuggestionClick(s.isin)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group"
                        >
                          <span className="block text-sm font-bold text-slate-800 group-hover:text-blue-700 line-clamp-1">{s.name}</span>
                          <span className="block text-[11px] text-slate-400 font-mono uppercase mt-0.5">{s.isin}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 ml-1">
            {isBulkMode ? t('isinHelp') : "Start typing to see AI-powered suggestions"}
          </p>

          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-xs text-blue-700 flex gap-3 items-start leading-relaxed">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>{t('searchInfo')}</p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors font-bold text-sm"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-all font-bold text-sm active:scale-95 disabled:opacity-50"
              disabled={!text.trim()}
            >
              {isBulkMode ? t('add') : "Quick Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFundModal;
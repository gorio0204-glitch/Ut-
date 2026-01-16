import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (isins: string[]) => void;
}

const AddFundModal: React.FC<AddFundModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [text, setText] = useState('');
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      // Split by newline, comma, semicolon - spaces are preserved inside names but trim edges
      // We still split by newlines, but handle "Name" entries better.
      const entries = text.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
      if (entries.length > 0) {
        onAdd(entries);
        setText('');
        // Immediately close modal to allow background processing
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Fade In */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Modal with Scale In */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn relative z-10">
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{t('addFundModalTitle')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('addFundModalDesc')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200/50">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="isin" className="block text-sm font-bold text-slate-700 mb-2">
              {t('isinLabel')}
            </label>
            <div className="relative">
              <textarea
                id="isin"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('isinPlaceholder')}
                rows={5}
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm placeholder:text-slate-400 shadow-inner"
                autoFocus
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 bg-white/50 px-2 py-1 rounded backdrop-blur">
                 Press Enter for new line
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 ml-1">{t('isinHelp')}</p>
          </div>

          <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-xl text-sm text-blue-700 flex gap-3 items-start">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="leading-relaxed">{t('searchInfo')}</p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-all font-bold text-sm flex items-center gap-2 active:scale-95"
            >
              {t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFundModal;
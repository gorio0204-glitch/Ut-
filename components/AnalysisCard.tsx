import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalysisCardProps {
  analysis: string | null;
  loading: boolean;
  onAnalyze: () => void;
  hasFunds: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, loading, onAnalyze, hasFunds }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mt-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-20"></div>
      
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
             </svg>
          </div>
          {t('analysisTitle')}
        </h2>
        <button
          onClick={onAnalyze}
          disabled={loading || !hasFunds}
          className="text-sm px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20 active:scale-95 hover:shadow-lg"
        >
          {loading ? t('analyzingBtn') : analysis ? t('reanalyzeBtn') : t('analyzeBtn')}
        </button>
      </div>
      
      <div className="bg-slate-50/50 rounded-xl p-5 min-h-[120px] border border-slate-100 transition-all duration-300">
        {loading ? (
           <div className="space-y-3 animate-pulse">
             <div className="flex items-center gap-3 mb-4">
                <div className="h-4 w-4 rounded-full bg-purple-200"></div>
                <div className="h-3 w-1/3 bg-purple-200 rounded"></div>
             </div>
             <div className="h-2 bg-slate-200 rounded w-full"></div>
             <div className="h-2 bg-slate-200 rounded w-5/6"></div>
             <div className="h-2 bg-slate-200 rounded w-full"></div>
             <div className="h-2 bg-slate-200 rounded w-4/6"></div>
           </div>
        ) : analysis ? (
          <div className="animate-fadeIn">
             <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{analysis}</p>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-6 text-center">
             <p className="text-slate-400 text-sm mb-1">
               {hasFunds ? t('analysisPlaceholder') : t('analysisPlaceholderNoFunds')}
             </p>
             {hasFunds && <p className="text-xs text-slate-300">Powered by Gemini AI</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisCard;
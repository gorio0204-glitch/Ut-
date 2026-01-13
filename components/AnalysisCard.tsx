import React from 'react';

interface AnalysisCardProps {
  analysis: string | null;
  loading: boolean;
  onAnalyze: () => void;
  hasFunds: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, loading, onAnalyze, hasFunds }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          AI 投資組合分析
        </h2>
        <button
          onClick={onAnalyze}
          disabled={loading || !hasFunds}
          className="text-sm px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '分析中...' : analysis ? '重新分析' : '開始分析'}
        </button>
      </div>
      
      <div className="bg-slate-50 rounded-xl p-4 min-h-[100px] flex items-center justify-center">
        {loading ? (
           <div className="flex flex-col items-center gap-2">
             <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
             <p className="text-sm text-slate-500 animate-pulse">Gemini 正在分析您的持倉...</p>
           </div>
        ) : analysis ? (
          <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{analysis}</p>
        ) : (
          <p className="text-slate-400 text-sm text-center">
            {hasFunds ? "點擊「開始分析」以獲取 AI 對您投資組合的專業見解。" : "請先新增基金以啟用分析功能。"}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalysisCard;
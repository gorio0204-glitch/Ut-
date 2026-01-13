import React, { useState } from 'react';
import { LoadingState } from '../types';

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (isin: string) => Promise<void>;
  loadingState: LoadingState;
}

const AddFundModal: React.FC<AddFundModalProps> = ({ isOpen, onClose, onAdd, loadingState }) => {
  const [isin, setIsin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isin.trim()) {
      await onAdd(isin.trim());
      setIsin('');
    }
  };

  const isProcessing = loadingState === LoadingState.LOADING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">新增追蹤基金</h3>
          <p className="text-sm text-slate-500 mt-1">輸入 ISIN 代碼以自動獲取基金資訊</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="isin" className="block text-sm font-medium text-slate-700 mb-1">
              ISIN 代碼
            </label>
            <input
              id="isin"
              type="text"
              value={isin}
              onChange={(e) => setIsin(e.target.value)}
              placeholder="例如: LU1234567890"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all uppercase"
              autoFocus
              disabled={isProcessing}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex gap-2 items-start">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>系統將使用 Google Search 即時搜尋最新淨值與資訊。這可能需要幾秒鐘。</p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              disabled={isProcessing}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isProcessing || !isin}
              className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all ${
                isProcessing || !isin ? 'bg-slate-400 cursor-not-allowed' : 'bg-accent hover:bg-blue-600 shadow-lg shadow-blue-500/30'
              }`}
            >
              {isProcessing && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isProcessing ? '搜尋中...' : '新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFundModal;
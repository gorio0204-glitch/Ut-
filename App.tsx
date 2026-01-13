import React, { useState, useEffect, useCallback } from 'react';
import { Fund, LoadingState } from './types';
import { fetchFundDetails, analyzePortfolio } from './services/geminiService';
import FundChart from './components/FundChart';
import AddFundModal from './components/AddFundModal';
import AnalysisCard from './components/AnalysisCard';
import TradeModal from './components/TradeModal';

const App: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>(() => {
    const saved = localStorage.getItem('funds');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeModalConfig, setTradeModalConfig] = useState<{ isOpen: boolean; type: 'BUY' | 'SELL'; fundIsin: string | null }>({
    isOpen: false,
    type: 'BUY',
    fundIsin: null
  });

  // Loading & Data States
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [refreshingFunds, setRefreshingFunds] = useState<Set<string>>(new Set());
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    localStorage.setItem('funds', JSON.stringify(funds));
  }, [funds]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
  };

  const handleAddFund = async (isin: string) => {
    if (funds.some(f => f.isin.toLowerCase() === isin.toLowerCase())) {
      showNotification("此基金已在您的追蹤清單中。", 'error');
      return;
    }

    setLoadingState(LoadingState.LOADING);
    try {
      const newFund = await fetchFundDetails(isin);
      setFunds(prev => [...prev, { ...newFund, unitsHeld: 0 }]);
      setIsModalOpen(false);
      setLoadingState(LoadingState.SUCCESS);
      showNotification(`成功新增: ${newFund.name}`, 'success');
    } catch (err) {
      console.error(err);
      showNotification("無法找到該基金資訊，請確認 ISIN 正確。", 'error');
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleRemoveFund = (isin: string) => {
    if (window.confirm("確定要移除此基金嗎？")) {
      setFunds(prev => prev.filter(f => f.isin !== isin));
      setAnalysis(null);
      showNotification("已移除基金", 'success');
    }
  };

  const handleRefreshFund = async (isin: string) => {
    if (refreshingFunds.has(isin)) return;

    setRefreshingFunds(prev => new Set(prev).add(isin));
    
    try {
       const updatedFund = await fetchFundDetails(isin);
       setFunds(prev => prev.map(f => {
         if (f.isin === isin) {
           return { ...updatedFund, unitsHeld: f.unitsHeld }; // Preserve holdings
         }
         return f;
       }));
       showNotification("價格更新完成", 'success');
    } catch (e) {
      console.error(e);
      showNotification("更新失敗，請稍後再試。", 'error');
    } finally {
      setRefreshingFunds(prev => {
        const next = new Set(prev);
        next.delete(isin);
        return next;
      });
    }
  };

  const openTradeModal = (isin: string, type: 'BUY' | 'SELL') => {
    setTradeModalConfig({ isOpen: true, type, fundIsin: isin });
  };

  const handleTradeConfirm = (fundIsin: string, type: 'BUY' | 'SELL', quantity: number, price: number, fee: number) => {
    setFunds(prev => prev.map(f => {
      if (f.isin === fundIsin) {
        const currentUnits = f.unitsHeld || 0;
        const newUnits = type === 'BUY' ? currentUnits + quantity : currentUnits - quantity;
        
        // Simple check for negative units (though some simulations allow shorting, we'll warn or just allow it for now)
        return { ...f, unitsHeld: newUnits };
      }
      return f;
    }));
    
    const fundName = funds.find(f => f.isin === fundIsin)?.name || 'Fund';
    const action = type === 'BUY' ? '買入' : '賣出';
    const totalCost = (price * quantity) + (type === 'BUY' ? fee : 0);
    
    const feeText = fee > 0 ? ` (含手續費 ${fee})` : '';
    showNotification(`成功${action} ${quantity} 單位 ${fundName} - 總額: ${totalCost.toLocaleString()}${feeText}`, 'success');
  };

  const runAnalysis = useCallback(async () => {
    if (funds.length === 0) return;
    setAnalyzing(true);
    try {
      const result = await analyzePortfolio(funds);
      setAnalysis(result);
    } catch (e) {
      setAnalysis("分析失敗");
    } finally {
      setAnalyzing(false);
    }
  }, [funds]);

  // Calculations for dashboard
  // Total Value = sum of (units * current price) for simulation, or just sum of prices if units not used
  // We'll calculate "Simulated Market Value" if units exist, otherwise just sum prices as a fallback metric
  const totalMarketValue = funds.reduce((acc, curr) => acc + (curr.price * (curr.unitsHeld || 0)), 0);
  const averageRisk = funds.length > 0 ? (funds.reduce((acc, curr) => acc + curr.riskRating, 0) / funds.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                FT
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">FundTracker AI</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              新增基金
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">模擬投資組合市值</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
                {funds.length > 0 && funds[0].currency ? funds[0].currency : '$'} {totalMarketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">平均風險等級 (1-7)</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-3xl font-bold text-slate-900">{averageRisk}</p>
              <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${Number(averageRisk) > 5 ? 'bg-red-500' : Number(averageRisk) > 3 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${(Number(averageRisk) / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">追蹤基金總數</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {funds.length}
            </p>
          </div>
        </div>

        {/* AI Analysis */}
        <AnalysisCard 
          analysis={analysis} 
          loading={analyzing} 
          onAnalyze={runAnalysis}
          hasFunds={funds.length > 0}
        />

        {/* Fund List */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            我的追蹤清單
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {funds.length} items
            </span>
          </h2>

          {funds.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">尚無追蹤基金</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                點擊右上角的「新增基金」按鈕，輸入 ISIN 代碼開始追蹤。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {funds.map((fund) => {
                const isRefreshing = refreshingFunds.has(fund.isin);
                const holdingValue = (fund.unitsHeld || 0) * fund.price;
                
                return (
                  <div key={fund.isin} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded tracking-wider">
                              {fund.isin}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              fund.riskRating >= 6 ? 'bg-red-50 text-red-600' :
                              fund.riskRating >= 4 ? 'bg-orange-50 text-orange-600' :
                              'bg-green-50 text-green-600'
                            }`}>
                              RR {fund.riskRating}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">{fund.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">{fund.manager}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <div className="flex items-baseline md:justify-end gap-1">
                            <span className="text-sm font-medium text-slate-400">{fund.currency}</span>
                            <span className="text-3xl font-bold text-slate-900">{fund.price.toLocaleString()}</span>
                          </div>
                           <div className={`text-sm font-bold flex items-center md:justify-end mt-1 ${
                             (fund.changePercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                           }`}>
                             {(fund.changePercent || 0) > 0 ? '+' : ''}{fund.changePercent ?? 0}%
                             <span className="text-xs font-normal text-slate-400 ml-2">Today</span>
                           </div>
                           
                           {/* Price Details */}
                           <div className="flex md:justify-end gap-4 mt-2 text-sm border-t border-slate-100 pt-2 md:border-none md:pt-0">
                              <div className="flex items-center gap-1">
                                  <span className="text-slate-400 text-xs">買入價</span>
                                  <span className="font-semibold text-slate-700">{fund.buyPrice?.toLocaleString() ?? '-'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  <span className="text-slate-400 text-xs">賣出價</span>
                                  <span className="font-semibold text-slate-700">{fund.sellPrice?.toLocaleString() ?? '-'}</span>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Chart Section */}
                        <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 flex flex-col">
                           <div className="flex justify-between items-center mb-2">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">30 Day Trend (Simulated)</p>
                           </div>
                           <FundChart currentPrice={fund.price} color={(fund.changePercent || 0) >= 0 ? "#10b981" : "#ef4444"} />
                           
                           {/* Holdings Display */}
                           {(fund.unitsHeld || 0) > 0 && (
                             <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                               <div>
                                 <p className="text-xs text-slate-500 font-medium">持有部位</p>
                                 <p className="text-sm font-bold text-slate-700">{fund.unitsHeld} 單位</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-xs text-slate-500 font-medium">預估市值</p>
                                 <p className="text-sm font-bold text-slate-700">{fund.currency} {holdingValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                               </div>
                             </div>
                           )}
                        </div>

                        {/* Actions Section */}
                        <div className="flex flex-col justify-between space-y-4">
                          {/* Buy / Sell Buttons */}
                          <div className="grid grid-cols-2 gap-3">
                             <button
                                onClick={() => openTradeModal(fund.isin, 'BUY')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                               </svg>
                               申購
                             </button>
                             <button
                                onClick={() => openTradeModal(fund.isin, 'SELL')}
                                className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-bold shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                               </svg>
                               贖回
                             </button>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">投資策略</p>
                             <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                               {fund.description}
                             </p>
                          </div>

                          {/* News Section */}
                          {fund.news && fund.news.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-4">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">相關新聞</p>
                               <div className="space-y-3">
                                 {fund.news.map((item, idx) => (
                                   <a 
                                      key={idx} 
                                      href={item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + fund.name)}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="block group"
                                   >
                                     <h4 className="text-xs font-semibold text-slate-700 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                                       {item.title}
                                     </h4>
                                     <div className="flex justify-between items-center mt-1">
                                       <span className="text-[10px] text-slate-400">{item.source}</span>
                                       <span className="text-[10px] text-slate-400">{item.date}</span>
                                     </div>
                                   </a>
                                 ))}
                               </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2 mt-auto">
                            <button 
                              onClick={() => handleRefreshFund(fund.isin)}
                              disabled={isRefreshing}
                              className={`flex-1 border py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                                isRefreshing 
                                  ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-wait' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {isRefreshing && (
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {isRefreshing ? '更新中' : '更新價格'}
                            </button>
                            <button 
                              onClick={() => handleRemoveFund(fund.isin)}
                              disabled={isRefreshing}
                              className={`flex-1 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-700 py-2 rounded-lg text-xs font-medium transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AddFundModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setLoadingState(LoadingState.IDLE);
        }}
        onAdd={handleAddFund}
        loadingState={loadingState}
      />
      
      <TradeModal
        isOpen={tradeModalConfig.isOpen}
        onClose={() => setTradeModalConfig(prev => ({ ...prev, isOpen: false }))}
        type={tradeModalConfig.type}
        fund={tradeModalConfig.fundIsin ? funds.find(f => f.isin === tradeModalConfig.fundIsin) || null : null}
        onConfirm={handleTradeConfirm}
      />
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-xl border flex items-center gap-3 animate-bounce z-50 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {notification.type === 'success' ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}
    </div>
  );
};

export default App;
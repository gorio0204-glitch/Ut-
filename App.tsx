import React, { useState, useEffect, useCallback } from 'react';
import { Fund, AppPreferences, FundPerformance } from './types';
import { fetchFundDetails, analyzePortfolio } from './services/geminiService';
import FundChart from './components/FundChart';
import AddFundModal from './components/AddFundModal';
import AnalysisCard from './components/AnalysisCard';
import TradeModal from './components/TradeModal';
import ComparisonModal from './components/ComparisonModal';
import SettingsModal from './components/SettingsModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// Helper component for Performance Metrics
const PerformanceMetric = ({ label, value }: { label: string; value?: number | null }) => {
  const hasValue = value !== undefined && value !== null;
  const numValue = hasValue ? Number(value) : 0;
  const isVolatility = label.includes("波幅") || label.includes("Vol");
  let colorClass = "text-slate-700";
  
  if (!isVolatility && hasValue) {
    if (numValue > 0) colorClass = "text-emerald-600";
    else if (numValue < 0) colorClass = "text-red-500";
  } else if (isVolatility) {
    colorClass = "text-slate-600";
  }

  return (
    <div className="flex flex-col items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-105 duration-300">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 text-center leading-tight truncate w-full">{label}</span>
      <span className={`font-bold text-sm ${colorClass}`}>
        {!hasValue ? "-" : `${numValue > 0 && !isVolatility ? '+' : ''}${numValue}%`}
      </span>
    </div>
  );
};

// Component for the expanded tabbed content
const FundExpandedContent: React.FC<{ 
  fund: Fund, 
  t: (key: string, params?: any) => string, 
  onRefresh: (isin: string) => void, 
  onRemove: (isin: string) => void,
  isRefreshing: boolean
}> = ({ fund, t, onRefresh, onRemove, isRefreshing }) => {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: t('tabSummary') },
    { id: 'performance', label: t('tabPerformance') },
    { id: 'data', label: t('tabData') },
    { id: 'dividends', label: t('tabDividends') },
    { id: 'portfolio', label: t('tabPortfolio') },
    { id: 'manager', label: t('tabManager') },
    { id: 'documents', label: t('tabDocuments') },
  ];

  return (
    <div className="mt-6 pt-2 border-t border-slate-100 animate-fadeIn origin-top">
       {/* Tab Navigation */}
       <div className="flex overflow-x-auto pb-2 mb-4 gap-2 no-scrollbar border-b border-slate-100">
         {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
               activeTab === tab.id 
                 ? 'bg-slate-900 text-white shadow-md' 
                 : 'bg-white text-slate-600 hover:bg-slate-100 border border-transparent'
             }`}
           >
             {tab.label}
           </button>
         ))}
       </div>

       <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 min-h-[300px]">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">{t('strategy')}</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  {fund.description || t('noDescription')}
                </p>
              </div>
              
              {fund.news && fund.news.length > 0 && (
                <div>
                   <h4 className="text-sm font-bold text-slate-800 mb-3">{t('news')}</h4>
                   <div className="space-y-3">
                    {fund.news.map((item, idx) => (
                      <a 
                          key={idx} 
                          href={item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + fund.name)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block group bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
                      >
                        <h5 className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 line-clamp-2">{item.title}</h5>
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-[10px] text-slate-400">{item.source}</span>
                           <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                        </div>
                      </a>
                    ))}
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6 animate-fadeIn">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {['ytd', 'month1', 'month3', 'month6', 'year1', 'year3', 'year5', 'volatility3y'].map(key => (
                   <PerformanceMetric 
                      key={key} 
                      label={t(key as any)} 
                      value={fund.performance?.[key as keyof FundPerformance]} 
                   />
                 ))}
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 text-center">
                    * {t('performance')} based on NAV return
                  </p>
               </div>
            </div>
          )}

          {/* Fund Data Tab */}
          {activeTab === 'data' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
               {[
                 { label: 'ISIN', value: fund.isin },
                 { label: t('currency'), value: fund.currency },
                 { label: t('price'), value: `${fund.currency} ${fund.price}` },
                 { label: t('fundSize'), value: fund.fundSize || '-' },
                 { label: t('domicile'), value: fund.domicile || '-' },
                 { label: t('launchDate'), value: fund.launchDate || '-' },
                 { label: t('dividendPolicy'), value: fund.dividendInfo?.frequency || '-' },
                 { label: 'Risk Rating', value: `RR ${fund.riskRating}` },
               ].map((item, idx) => (
                 <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                 </div>
               ))}
            </div>
          )}
          
          {/* Dividends Tab (History) */}
          {activeTab === 'dividends' && (
            <div className="animate-fadeIn">
              {fund.dividendInfo ? (
                <>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <span className="block text-xs text-emerald-600 font-bold mb-1">{t('annualYield')}</span>
                        <span className="text-lg font-bold text-emerald-700">{fund.dividendInfo.yield ? `${fund.dividendInfo.yield}%` : '-'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="block text-xs text-slate-500 font-bold mb-1">{t('paymentFrequency')}</span>
                        <span className="text-lg font-bold text-slate-700">{fund.dividendInfo.frequency || '-'}</span>
                      </div>
                   </div>
                   
                   <h4 className="text-sm font-bold text-slate-800 mb-3">{t('dividendHistory')}</h4>
                   {fund.dividendInfo.history && fund.dividendInfo.history.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-500">
                            <tr>
                              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('dhPaymentDate')}</th>
                              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('dhExDate')}</th>
                              <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-right">{t('dhAmount')}</th>
                              <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-right">{t('dhReinvest')}</th>
                              <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-right">{t('dhYield')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {fund.dividendInfo.history.map((h, i) => (
                              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-700">{h.paymentDate || '-'}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-500">{h.exDate || '-'}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap font-medium text-emerald-600 text-right">{h.amount}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 text-right">{h.reinvestmentNav || '-'}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 text-right">{h.yield ? `${h.yield}%` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   ) : (
                     <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                       No dividend history available
                     </div>
                   )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                   Accumulating fund or no dividend data
                </div>
              )}
            </div>
          )}

          {/* Portfolio Tab (Targets) */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6 animate-fadeIn">
               <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    {t('topHoldings')}
                  </h4>
                  {fund.topHoldings && fund.topHoldings.length > 0 ? (
                    <ul className="space-y-2">
                      {fund.topHoldings.map((h, i) => (
                        <li key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                           <span className="text-sm text-slate-700 font-medium truncate pr-4">{h.name}</span>
                           <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{h.percent}%</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">{t('noHoldings')}</p>
                  )}
               </div>

               <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    {t('sectorAllocation')}
                  </h4>
                  {fund.sectorAllocation && fund.sectorAllocation.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {fund.sectorAllocation.map((s, i) => (
                         <div key={i} className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center min-w-[80px] flex-1">
                            <span className="text-xs text-slate-500 mb-1 text-center line-clamp-1">{s.name}</span>
                            <span className="text-sm font-bold text-blue-600">{s.percent}%</span>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">{t('noSectors')}</p>
                  )}
               </div>
            </div>
          )}

          {/* Manager Tab */}
          {activeTab === 'manager' && (
             <div className="animate-fadeIn">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                   </div>
                   <h4 className="text-lg font-bold text-slate-800">{fund.manager}</h4>
                   <p className="text-sm text-slate-500 mt-2">Fund Manager / Provider</p>
                </div>
             </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
             <div className="animate-fadeIn space-y-3">
                {fund.documents && fund.documents.length > 0 ? (
                  fund.documents.map((doc, i) => (
                    <a 
                      key={i} 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                       <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                       </div>
                       <div className="flex-1">
                          <h5 className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{doc.title}</h5>
                          <p className="text-xs text-slate-400 mt-0.5">{t('download')}</p>
                       </div>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300 group-hover:text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                       </svg>
                    </a>
                  ))
                ) : (
                  <div className="text-center py-10">
                     <p className="text-slate-400 text-sm">{t('noDocs')}</p>
                     <a 
                       href={`https://www.google.com/search?q=${encodeURIComponent(fund.name + ' Factsheet')}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-500 text-xs font-bold mt-2 inline-block hover:underline"
                    >
                       Search on Google
                    </a>
                  </div>
                )}
             </div>
          )}
       </div>

       {/* Actions Footer */}
       <div className="flex gap-3 mt-6">
          <button 
              onClick={() => onRefresh(fund.isin)}
              disabled={isRefreshing}
              className="flex-1 border py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              {isRefreshing ? (
                 <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : t('refresh')}
          </button>
           <button 
              onClick={() => onRemove(fund.isin)}
              disabled={isRefreshing}
              className="flex-1 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              {t('remove')}
            </button>
        </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [funds, setFunds] = useState<Fund[]>(() => {
    const saved = localStorage.getItem('funds');
    return saved ? JSON.parse(saved) : [];
  });

  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const saved = localStorage.getItem('preferences');
    return saved ? JSON.parse(saved) : { showPerformance: true, showChart: true, showDividends: true, compactMode: false };
  });

  const [selectedFunds, setSelectedFunds] = useState<Set<string>>(new Set());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [tradeModalConfig, setTradeModalConfig] = useState<{ isOpen: boolean; type: 'BUY' | 'SELL'; fundIsin: string | null }>({
    isOpen: false,
    type: 'BUY',
    fundIsin: null
  });

  const [refreshingFunds, setRefreshingFunds] = useState<Set<string>>(new Set());
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [backgroundTask, setBackgroundTask] = useState<{
    active: boolean;
    total: number;
    completed: number;
    success: number;
    fail: number;
  }>({ active: false, total: 0, completed: 0, success: 0, fail: 0 });

  const [expandedFunds, setExpandedFunds] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('funds', JSON.stringify(funds));
  }, [funds]);

  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (msgKey: string, type: 'success' | 'error', params?: any) => {
    const msg = t(msgKey, params);
    setNotification({ msg, type });
  };

  // Selection Logic
  const toggleSelection = (isin: string) => {
    setSelectedFunds(prev => {
      const next = new Set(prev);
      if (next.has(isin)) next.delete(isin);
      else next.add(isin);
      return next;
    });
  };

  const handleBatchRemove = () => {
    if (window.confirm(t('removeConfirm'))) {
      setFunds(prev => prev.filter(f => !selectedFunds.has(f.isin)));
      setSelectedFunds(new Set());
      showNotification('removed', 'success');
    }
  };

  const handleBatchFavorite = (favorite: boolean) => {
    setFunds(prev => prev.map(f => {
      if (selectedFunds.has(f.isin)) {
        return { ...f, isFavorite: favorite };
      }
      return f;
    }));
    setSelectedFunds(new Set());
  };

  const handleBatchCompare = () => {
    if (selectedFunds.size < 2) return;
    setIsCompareOpen(true);
  };

  const handleAddFund = async (queries: string[]) => {
    const uniqueInput = [...new Set(queries.map(i => i.trim()))];
    const newQueries = uniqueInput.filter(q => 
      !funds.some(f => f.isin.toLowerCase() === q.toLowerCase() || f.name.toLowerCase() === q.toLowerCase())
    );

    if (newQueries.length === 0) {
      showNotification('duplicateFund', 'error');
      return;
    }

    setBackgroundTask({
      active: true,
      total: newQueries.length,
      completed: 0,
      success: 0,
      fail: 0
    });

    let successCount = 0;
    let failCount = 0;

    (async () => {
      for (const query of newQueries) {
        try {
          const newFund = await fetchFundDetails(query, language);
          setFunds(prev => {
              if (prev.some(f => f.isin === newFund.isin)) return prev;
              return [...prev, { ...newFund, unitsHeld: 0 }];
          });
          successCount++;
        } catch (err: any) {
          console.error(`Failed to add ${query}:`, err);
          failCount++;
        } finally {
          setBackgroundTask(prev => ({
            ...prev,
            completed: prev.completed + 1,
            success: successCount,
            fail: failCount
          }));
        }
      }

      setTimeout(() => {
        setBackgroundTask(prev => ({ ...prev, active: false }));
        if (successCount > 0) {
          if (failCount > 0) {
            showNotification('partialAdd', 'success', { success: successCount, fail: failCount });
          } else {
            showNotification('successAdd', 'success', { count: successCount });
          }
        } else {
          showNotification('failAdd', 'error');
        }
      }, 1000);
    })();
  };

  const handleRemoveFund = (isin: string) => {
    if (window.confirm(t('removeConfirm'))) {
      setFunds(prev => prev.filter(f => f.isin !== isin));
      setAnalysis(null);
      showNotification('removed', 'success');
    }
  };

  const toggleFavorite = (isin: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFunds(prev => prev.map(f => {
      if (f.isin === isin) {
        return { ...f, isFavorite: !f.isFavorite };
      }
      return f;
    }));
  };

  const handleRefreshFund = async (isin: string) => {
    if (refreshingFunds.has(isin)) return;

    setRefreshingFunds(prev => new Set(prev).add(isin));
    
    try {
       const updatedFund = await fetchFundDetails(isin, language);
       setFunds(prev => prev.map(f => {
         if (f.isin === isin) {
           return { ...updatedFund, unitsHeld: f.unitsHeld, isFavorite: f.isFavorite };
         }
         return f;
       }));
       showNotification('refreshSuccess', 'success');
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.message.startsWith('ERROR_') ? t(e.message) : t('refreshFail');
      setNotification({ msg: errorMsg, type: 'error' });
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
        return { ...f, unitsHeld: newUnits };
      }
      return f;
    }));
    
    const fundName = funds.find(f => f.isin === fundIsin)?.name || 'Fund';
    const action = type === 'BUY' ? t('buyAction') : t('sellAction');
    const totalCost = (price * quantity) + (type === 'BUY' ? fee : 0);
    
    showNotification('tradeSuccess', 'success', { 
      action, 
      quantity, 
      name: fundName, 
      total: totalCost.toLocaleString() 
    });
  };

  const runAnalysis = useCallback(async () => {
    if (funds.length === 0) return;
    setAnalyzing(true);
    try {
      const result = await analyzePortfolio(funds, language);
      setAnalysis(result);
    } catch (e) {
      setAnalysis(t('analysisFail'));
    } finally {
      setAnalyzing(false);
    }
  }, [funds, language, t]);

  const toggleExpand = (isin: string) => {
    setExpandedFunds(prev => {
      const next = new Set(prev);
      if (next.has(isin)) next.delete(isin);
      else next.add(isin);
      return next;
    });
  };

  const totalMarketValue = funds.reduce((acc, curr) => acc + (curr.price * (curr.unitsHeld || 0)), 0);
  const averageRisk = funds.length > 0 ? (funds.reduce((acc, curr) => acc + curr.riskRating, 0) / funds.length).toFixed(1) : 0;

  const displayedFunds = showFavoritesOnly 
    ? funds.filter(f => f.isFavorite) 
    : funds;

  const selectedFundsList = funds.filter(f => selectedFunds.has(f.isin));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans relative">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-300">
                FT
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t('appTitle')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                title={t('settings')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                onClick={() => setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                {language === 'zh-TW' ? 'EN' : '中文'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {t('addFund')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalMarketValue')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                {funds.length > 0 && funds[0].currency ? funds[0].currency : '$'} {totalMarketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('avgRisk')}</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{averageRisk}</p>
              <div className="h-2.5 w-24 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${Number(averageRisk) > 5 ? 'bg-red-500' : Number(averageRisk) > 3 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${(Number(averageRisk) / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('trackedFunds')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              {funds.length}
            </p>
          </div>
        </div>

        <AnalysisCard 
          analysis={analysis} 
          loading={analyzing} 
          onAnalyze={runAnalysis}
          hasFunds={funds.length > 0}
        />

        <div className="mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {t('myWatchlist')}
                <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2.5 py-0.5 rounded-full">
                  {funds.length} items
                </span>
             </h2>

             {funds.length > 0 && (
               <div className="flex items-center gap-3">
                 {selectedFunds.size > 0 && (
                   <>
                     <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg animate-fadeIn">
                       {t('selected', { count: selectedFunds.size })}
                     </span>
                     <button
                        onClick={handleBatchCompare}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title={t('compare')}
                      >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                       </svg>
                      </button>
                      <button
                        onClick={handleBatchRemove}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title={t('batchRemove')}
                      >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                       </svg>
                      </button>
                   </>
                 )}
                 <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      showFavoritesOnly 
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : 'text-slate-400'}`} fill={showFavoritesOnly ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {showFavoritesOnly ? t('showAll') : t('favoritesOnly')}
                 </button>
               </div>
             )}
          </div>

          {displayedFunds.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                 </svg>
               </div>
               <h3 className="text-lg font-bold text-slate-700">{showFavoritesOnly ? t('noFavorites') : t('noFunds')}</h3>
               <p className="text-slate-500 mt-2 max-w-xs mx-auto">{showFavoritesOnly ? t('noFavoritesDesc') : t('noFundsDesc')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedFunds.map(fund => {
                const isExpanded = expandedFunds.has(fund.isin);
                const isSelected = selectedFunds.has(fund.isin);
                const estValue = (fund.price * (fund.unitsHeld || 0));
                
                return (
                  <div key={fund.isin} className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-slate-900 border-transparent shadow-xl scale-[1.01]' : 'border-slate-100 hover:shadow-md hover:border-slate-300'}`}>
                    <div 
                      className="p-5 cursor-pointer relative"
                      onClick={() => toggleExpand(fund.isin)}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="pt-1">
                             <input 
                               type="checkbox" 
                               checked={isSelected}
                               onClick={(e) => e.stopPropagation()}
                               onChange={() => toggleSelection(fund.isin)}
                               className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                             />
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                               <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{fund.name}</h3>
                               <button 
                                 onClick={(e) => toggleFavorite(fund.isin, e)}
                                 className={`transition-colors ${fund.isFavorite ? 'text-yellow-400' : 'text-slate-200 hover:text-slate-300'}`}
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.038 3.192a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.038-3.192z" />
                                 </svg>
                               </button>
                             </div>
                             <div className="flex items-center gap-3 text-sm text-slate-500 font-mono">
                                <span className="bg-slate-100 px-1.5 rounded border border-slate-200 text-xs">{fund.isin}</span>
                                <span>{fund.currency} {fund.price}</span>
                                <span className={`font-bold ${fund.changePercent && fund.changePercent > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                   {fund.changePercent && fund.changePercent > 0 ? '+' : ''}{fund.changePercent}%
                                </span>
                             </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                           <div className="text-right hidden sm:block">
                              <p className="text-xs text-slate-400 font-bold uppercase">{t('currentHoldings')}</p>
                              <p className="font-bold text-slate-800">{fund.unitsHeld || 0} {t('units')}</p>
                           </div>
                           <div className="text-right hidden sm:block">
                              <p className="text-xs text-slate-400 font-bold uppercase">{t('estMarketValue')}</p>
                              <p className="font-bold text-slate-800 font-mono">{fund.currency} {estValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                           </div>
                           
                           <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => openTradeModal(fund.isin, 'BUY')}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                              >
                                {t('buy')}
                              </button>
                              {(fund.unitsHeld || 0) > 0 && (
                                <button 
                                  onClick={() => openTradeModal(fund.isin, 'SELL')}
                                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold active:scale-95 transition-all"
                                >
                                  {t('sell')}
                                </button>
                              )}
                           </div>
                        </div>
                      </div>

                      {preferences.showChart && !preferences.compactMode && (
                         <div className="mt-6 mb-2">
                           <FundChart currentPrice={fund.price} color={fund.changePercent && fund.changePercent >= 0 ? '#10b981' : '#ef4444'} />
                         </div>
                      )}
                      
                      {/* Collapsed Stats Grid */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 border-t border-slate-100 pt-4">
                         <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center">
                            <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Risk</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                               fund.riskRating >= 6 ? 'bg-red-100 text-red-700' :
                               fund.riskRating >= 4 ? 'bg-orange-100 text-orange-700' :
                               'bg-emerald-100 text-emerald-700'
                            }`}>RR {fund.riskRating}</span>
                         </div>
                         {preferences.showPerformance && (
                            <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center">
                              <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">{t('month3')}</span>
                              <span className={`text-sm font-bold ${fund.performance?.month3 && fund.performance.month3 > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {fund.performance?.month3 ? `${fund.performance.month3 > 0 ? '+' : ''}${fund.performance.month3}%` : '-'}
                              </span>
                            </div>
                         )}
                         {preferences.showDividends && (
                            <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center">
                              <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">{t('annualYield')}</span>
                              <span className="text-sm font-bold text-slate-700">{fund.dividendInfo?.yield ? `${fund.dividendInfo.yield}%` : '-'}</span>
                            </div>
                         )}
                         <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center">
                            <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Manager</span>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-full">{fund.manager}</span>
                         </div>
                      </div>

                      <div className="absolute bottom-2 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded-full shadow-lg">
                           {isExpanded ? t('collapse') : t('expand')}
                         </div>
                      </div>
                    </div>

                    {isExpanded && (
                       <div className="px-5 pb-5">
                          <FundExpandedContent 
                             fund={fund} 
                             t={t} 
                             onRefresh={handleRefreshFund}
                             onRemove={handleRemoveFund}
                             isRefreshing={refreshingFunds.has(fund.isin)}
                          />
                       </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals and Notifications */}
      <AddFundModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddFund}
      />
      
      <TradeModal 
         isOpen={tradeModalConfig.isOpen}
         onClose={() => setTradeModalConfig(prev => ({ ...prev, isOpen: false }))}
         type={tradeModalConfig.type}
         fund={funds.find(f => f.isin === tradeModalConfig.fundIsin) || null}
         onConfirm={handleTradeConfirm}
      />

      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        funds={selectedFundsList}
      />

      <SettingsModal
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
         preferences={preferences}
         onUpdate={setPreferences}
      />

      {/* Background Task Indicator */}
      {backgroundTask.active && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slideUp">
           <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <div>
              <p className="text-sm font-bold">{t('backgroundProcessing')}</p>
              <p className="text-xs text-slate-400">{backgroundTask.completed} / {backgroundTask.total}</p>
           </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl animate-slideUp border ${
          notification.type === 'success' 
            ? 'bg-white border-emerald-100 text-slate-800' 
            : 'bg-white border-red-100 text-slate-800'
        }`}>
          <div className="flex items-center gap-3">
             {notification.type === 'success' ? (
                <div className="bg-emerald-100 p-1 rounded-full text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
             ) : (
                <div className="bg-red-100 p-1 rounded-full text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
             )}
             <p className="font-bold text-sm">{notification.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
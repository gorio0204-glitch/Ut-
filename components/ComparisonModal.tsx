import React from 'react';
import { Fund } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  funds: Fund[];
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, funds }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  // Helper to render section headers
  const renderSectionHeader = (title: string) => (
    <tr className="bg-slate-50 border-y border-slate-200">
      <td className="sticky left-0 bg-slate-50 z-20 p-3 pl-4 font-bold text-slate-800 text-xs uppercase tracking-wider shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
        {title}
      </td>
      <td colSpan={funds.length} className="bg-slate-50"></td>
    </tr>
  );

  // Helper to get max value for progress bars (absolute max)
  const getMaxAbsValue = (extractor: (f: Fund) => number | undefined) => {
    let max = 0;
    funds.forEach(f => {
      const val = Math.abs(extractor(f) || 0);
      if (val > max) max = val;
    });
    return max || 1; // Avoid division by zero
  };

  // Helper to render performance rows with visual bars
  const renderPerfRow = (label: string, key: string, isRisk = false) => {
    const maxVal = getMaxAbsValue(f => f.performance?.[key as keyof typeof f.performance]);
    
    return (
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 text-sm shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap min-w-[140px]">
          {label}
        </td>
        {funds.map(fund => {
          const val = fund.performance?.[key as keyof typeof fund.performance];
          const numVal = Number(val || 0);
          const percent = Math.min((Math.abs(numVal) / maxVal) * 100, 100);
          const isPositive = numVal > 0;
          
          return (
            <td key={fund.isin} className="p-3 text-center min-w-[160px] border-b border-slate-50 relative">
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                 <span className={`font-bold text-sm ${
                   !val ? 'text-slate-300' :
                   isRisk ? 'text-slate-700' : 
                   isPositive ? 'text-emerald-600' : 'text-red-500'
                 }`}>
                   {val !== undefined ? `${isPositive && !isRisk ? '+' : ''}${val}%` : '-'}
                 </span>
                 {/* Visual Bar */}
                 {val !== undefined && (
                   <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isRisk ? 'bg-slate-400' : 
                          isPositive ? 'bg-emerald-400' : 'bg-red-400'
                        }`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                   </div>
                 )}
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col relative z-10 animate-scaleIn overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-30 relative">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            {t('compareTitle')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full">
          <table className="border-collapse table-fixed min-w-full">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-40 bg-white p-4 text-left font-bold text-slate-900 border-b border-r border-slate-200 w-[140px] min-w-[140px] shadow-[4px_4px_10px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                  Metric
                </th>
                {funds.map(fund => (
                  <th key={fund.isin} className="sticky top-0 z-30 bg-white p-4 text-center border-b border-slate-200 w-[200px] min-w-[200px] align-top shadow-[0_4px_6px_-4px_rgba(0,0,0,0.05)]">
                    <div className="font-bold text-slate-800 text-sm line-clamp-2 h-10 flex items-center justify-center leading-tight mb-2">
                       {fund.name}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{fund.isin}</span>
                      {fund.isFavorite && (
                         <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.038 3.192a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.038-3.192z"/></svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              
              {/* Overview Section */}
              {renderSectionHeader(t('tabSummary'))}
              
              <tr>
                <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                   {t('price')}
                </td>
                {funds.map(f => (
                   <td key={f.isin} className="p-3 text-center border-b border-slate-50">
                      <span className="font-mono font-bold text-slate-700">{f.currency} {f.price}</span>
                   </td>
                ))}
              </tr>
              
              <tr>
                <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                   {t('fundSize')}
                </td>
                {funds.map(f => (
                   <td key={f.isin} className="p-3 text-center border-b border-slate-50">
                      <span className="text-slate-600 font-medium">{f.fundSize || '-'}</span>
                   </td>
                ))}
              </tr>

              <tr>
                <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                   {t('categoryRank')}
                </td>
                {funds.map(f => (
                   <td key={f.isin} className="p-3 text-center border-b border-slate-50">
                      <span className="text-slate-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg inline-block border border-indigo-100">
                        {f.ranking || '-'}
                      </span>
                   </td>
                ))}
              </tr>

               <tr>
                <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                   Risk Rating
                </td>
                {funds.map(f => (
                   <td key={f.isin} className="p-3 text-center border-b border-slate-50">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                         f.riskRating >= 6 ? 'bg-red-100 text-red-700' :
                         f.riskRating >= 4 ? 'bg-orange-100 text-orange-700' :
                         'bg-emerald-100 text-emerald-700'
                      }`}>
                        RR {f.riskRating}
                      </span>
                   </td>
                ))}
              </tr>

              <tr>
                <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                   {t('domicile')}
                </td>
                {funds.map(f => (
                   <td key={f.isin} className="p-3 text-center border-b border-slate-50 text-slate-500">
                      {f.domicile || '-'}
                   </td>
                ))}
              </tr>

              {/* Performance Section */}
              {renderSectionHeader(t('performance'))}
              {renderPerfRow(t('ytd'), 'ytd')}
              {renderPerfRow(t('month1'), 'month1')}
              {renderPerfRow(t('month3'), 'month3')}
              {renderPerfRow(t('month6'), 'month6')}
              {renderPerfRow(t('year1'), 'year1')}
              {renderPerfRow(t('year3'), 'year3')}
              {renderPerfRow(t('year5'), 'year5')}

              {/* Risk Section */}
              {renderSectionHeader(t('riskMetrics'))}
              {renderPerfRow(t('volatility'), 'volatility3y', true)}

              {/* Dividend Section */}
              {renderSectionHeader(t('dividendInfo'))}
              
              <tr>
                <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                   {t('annualYield')}
                </td>
                {funds.map(f => (
                   <td key={f.isin} className="p-3 text-center border-b border-slate-50">
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg inline-block shadow-sm border border-emerald-100">
                        {f.dividendInfo?.yield ? `${f.dividendInfo.yield}%` : '-'}
                      </span>
                   </td>
                ))}
              </tr>

              <tr>
                <td className="sticky left-0 bg-white z-10 p-3 pl-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                   {t('paymentFrequency')}
                </td>
                {funds.map(f => (
                   <td key={f.isin} className="p-3 text-center border-b border-slate-50 text-slate-600">
                      {f.dividendInfo?.frequency || '-'}
                   </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
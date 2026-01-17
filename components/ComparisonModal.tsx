import React, { useMemo, useState } from 'react';
import { Fund } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { generateMockHistory } from '../constants';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  funds: Fund[];
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, funds }) => {
  const { t } = useLanguage();
  const [days, setDays] = useState(365);

  const chartData = useMemo(() => {
    if (!funds.length) return [];
    
    // Generate mock histories for all funds with the same base timeline
    const fundHistories = funds.map(fund => ({
      isin: fund.isin,
      name: fund.name,
      history: generateMockHistory(fund.price, days)
    }));

    // Merge them into a single Recharts-friendly array
    const result = [];
    for (let i = 0; i < fundHistories[0].history.length; i++) {
      const entry: any = { date: fundHistories[0].history[i].date };
      fundHistories.forEach(fh => {
        entry[fh.name] = fh.history[i].value;
      });
      result.push(entry);
    }
    return result;
  }, [funds, days]);

  if (!isOpen) return null;

  const renderSectionHeader = (title: string) => (
    <tr className="bg-slate-100 border-y border-slate-200">
      <td className="sticky left-0 bg-slate-100 z-20 p-3 pl-4 font-bold text-slate-800 text-[10px] uppercase tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap">
        {title}
      </td>
      <td colSpan={funds.length} className="bg-slate-100"></td>
    </tr>
  );

  const getMaxAbsValue = (extractor: (f: Fund) => number | undefined) => {
    let max = 0.0001;
    funds.forEach(f => {
      const val = Math.abs(extractor(f) || 0);
      if (val > max) max = val;
    });
    return max;
  };

  const renderVisualRow = (label: string, key: string, isRisk = false) => {
    const maxVal = getMaxAbsValue(f => f.performance?.[key as keyof typeof f.performance]);
    
    return (
      <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td className="sticky left-0 bg-white z-10 p-4 font-semibold text-slate-600 border-r border-slate-100 text-sm shadow-[2px_0_5px_rgba(0,0,0,0.03)] whitespace-nowrap min-w-[140px]">
          {label}
        </td>
        {funds.map(fund => {
          const val = fund.performance?.[key as keyof typeof fund.performance];
          const numVal = Number(val || 0);
          const percent = Math.min((Math.abs(numVal) / maxVal) * 100, 100);
          const isPositive = numVal > 0;
          
          return (
            <td key={fund.isin} className="p-4 text-center min-w-[200px]">
              <div className="flex flex-col items-center gap-1.5">
                 <span className={`font-bold text-sm ${
                   !val ? 'text-slate-300' :
                   isRisk ? 'text-slate-700' : 
                   isPositive ? 'text-emerald-600' : 'text-red-500'
                 }`}>
                   {val !== undefined ? `${isPositive && !isRisk ? '+' : ''}${val}%` : '-'}
                 </span>
                 {val !== undefined && (
                   <div className="w-full max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isRisk ? 'bg-slate-400' : 
                          isPositive ? 'bg-emerald-500' : 'bg-red-500'
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

  const ranges = [
    { labelKey: 'range3M', value: 90 },
    { labelKey: 'range6M', value: 180 },
    { labelKey: 'range1Y', value: 365 },
    { labelKey: 'range3Y', value: 1095 },
    { labelKey: 'rangeAll', value: 3650 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col relative z-10 animate-scaleIn overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white z-30">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
               </svg>
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-900">{t('compareTitle')}</h2>
               <p className="text-sm text-slate-500">{funds.length} Funds selected</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-800 border border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full">
          {/* Comparative Chart Section */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('comparisonChart')}</h3>
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                   {ranges.map(range => (
                     <button
                       key={range.labelKey}
                       onClick={() => setDays(range.value)}
                       className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                         days === range.value 
                           ? 'bg-white text-blue-600 shadow-sm' 
                           : 'text-slate-500 hover:text-slate-900'
                       }`}
                     >
                       {t(range.labelKey)}
                     </button>
                   ))}
                </div>
             </div>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" hide={true} />
                      <YAxis hide={true} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '11px' }}
                      />
                      <Legend iconType="circle" />
                      {funds.map((fund, idx) => (
                        <Line
                          key={fund.isin}
                          type="monotone"
                          dataKey={fund.name}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2.5}
                          dot={false}
                          animationDuration={800}
                        />
                      ))}
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          <table className="border-collapse w-full table-fixed">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky top-0 left-0 z-40 bg-slate-50 p-6 text-left font-bold text-slate-400 border-b border-r border-slate-200 w-[160px] min-w-[160px] shadow-[4px_4px_10px_-4px_rgba(0,0,0,0.1)] text-[10px] uppercase tracking-widest">
                  Metrics
                </th>
                {funds.map(fund => (
                  <th key={fund.isin} className="sticky top-0 z-30 bg-slate-50 p-6 text-center border-b border-slate-200 min-w-[240px] max-w-[280px] align-top shadow-[0_4px_6px_-4px_rgba(0,0,0,0.05)]">
                    <div className="font-bold text-slate-900 text-sm line-clamp-2 h-10 flex items-center justify-center leading-tight mb-3">
                       {fund.name}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{fund.isin}</span>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                        {fund.ranking || '-'}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {renderSectionHeader(t('tabSummary'))}
              <tr>
                <td className="sticky left-0 bg-white z-10 p-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)] whitespace-nowrap">{t('price')}</td>
                {funds.map(f => (
                   <td key={f.isin} className="p-4 text-center font-mono font-bold text-slate-800">{f.currency} {f.price.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 bg-white z-10 p-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)] whitespace-nowrap">{t('fundSize')}</td>
                {funds.map(f => (
                   <td key={f.isin} className="p-4 text-center text-slate-600 font-medium">{f.fundSize || '-'}</td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 bg-white z-10 p-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)] whitespace-nowrap">{t('categoryRank')}</td>
                {funds.map(f => (
                   <td key={f.isin} className="p-4 text-center">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs border border-indigo-100 shadow-sm">
                        {f.ranking || '-'}
                      </span>
                   </td>
                ))}
              </tr>

              {renderSectionHeader(t('tabPerformance'))}
              {renderVisualRow(t('ytd'), 'ytd')}
              {renderVisualRow(t('month3'), 'month3')}
              {renderVisualRow(t('year1'), 'year1')}
              {renderVisualRow(t('year5'), 'year5')}

              {renderSectionHeader(t('riskMetrics'))}
              {renderVisualRow(t('volatility'), 'volatility3y', true)}
              <tr>
                <td className="sticky left-0 bg-white z-10 p-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)] whitespace-nowrap">Risk Rating</td>
                {funds.map(f => (
                   <td key={f.isin} className="p-4 text-center">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${
                         f.riskRating >= 6 ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                         f.riskRating >= 4 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                         'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      }`}>
                        RR{f.riskRating}
                      </span>
                   </td>
                ))}
              </tr>

              {renderSectionHeader(t('dividendInfo'))}
              <tr>
                <td className="sticky left-0 bg-white z-10 p-4 font-semibold text-slate-600 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)] whitespace-nowrap">{t('annualYield')}</td>
                {funds.map(f => (
                   <td key={f.isin} className="p-4 text-center">
                      <span className="text-emerald-600 font-black text-sm">
                        {f.dividendInfo?.yield ? `${f.dividendInfo.yield}%` : '0%'}
                      </span>
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
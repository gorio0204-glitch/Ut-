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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col relative z-10 animate-scaleIn">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">{t('compareTitle')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="min-w-max">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-20 p-3 text-left font-bold text-slate-900 border-b border-r min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Feature</th>
                  {funds.map(fund => (
                    <th key={fund.isin} className="p-3 text-left font-bold text-slate-900 border-b min-w-[200px] max-w-[250px] bg-slate-50/50">
                      <div className="line-clamp-2">{fund.name}</div>
                      <div className="text-xs font-normal text-slate-500 mt-1">{fund.isin}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Basic Info */}
                <tr>
                  <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{t('price')}</td>
                  {funds.map(fund => (
                    <td key={fund.isin} className="p-3 text-slate-800 font-mono">
                      {fund.currency} {fund.price}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Risk</td>
                  {funds.map(fund => (
                    <td key={fund.isin} className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                         fund.riskRating >= 6 ? 'bg-red-100 text-red-700' :
                         fund.riskRating >= 4 ? 'bg-orange-100 text-orange-700' :
                         'bg-emerald-100 text-emerald-700'
                      }`}>
                        RR {fund.riskRating}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{t('domicile')}</td>
                  {funds.map(fund => (
                    <td key={fund.isin} className="p-3 text-slate-600">{fund.domicile || '-'}</td>
                  ))}
                </tr>

                {/* Performance */}
                <tr className="bg-slate-50/30">
                  <td colSpan={funds.length + 1} className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('performance')}</td>
                </tr>
                {['ytd', 'month3', 'year1', 'year3'].map(metric => (
                  <tr key={metric}>
                    <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r capitalize shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {t(metric as any)}
                    </td>
                    {funds.map(fund => {
                      const val = fund.performance?.[metric as keyof typeof fund.performance];
                      return (
                        <td key={fund.isin} className={`p-3 font-bold ${val && val > 0 ? 'text-emerald-600' : val && val < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {val ? `${val > 0 ? '+' : ''}${val}%` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                 {/* Dividends */}
                <tr className="bg-slate-50/30">
                  <td colSpan={funds.length + 1} className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dividendPolicy')}</td>
                </tr>
                <tr>
                   <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{t('paymentFrequency')}</td>
                   {funds.map(fund => (
                     <td key={fund.isin} className="p-3 text-slate-600">{fund.dividendInfo?.frequency || '-'}</td>
                   ))}
                </tr>
                <tr>
                   <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{t('lastDividendDate')}</td>
                   {funds.map(fund => (
                     <td key={fund.isin} className="p-3 text-slate-600 font-mono">{fund.dividendInfo?.lastDate || '-'}</td>
                   ))}
                </tr>
                <tr>
                   <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{t('dividendPerUnit')}</td>
                   {funds.map(fund => (
                     <td key={fund.isin} className="p-3 text-slate-600">
                       {fund.dividendInfo?.amount ? `${fund.dividendInfo.amount} ${fund.dividendInfo.currency || ''}` : '-'}
                     </td>
                   ))}
                </tr>
                <tr>
                   <td className="sticky left-0 bg-slate-50 z-10 p-3 font-semibold text-slate-700 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{t('annualYield')}</td>
                   {funds.map(fund => (
                     <td key={fund.isin} className="p-3 text-emerald-600 font-bold">{fund.dividendInfo?.yield ? `${fund.dividendInfo.yield}%` : '-'}</td>
                   ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
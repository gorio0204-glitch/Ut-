import React, { useMemo, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { generateMockHistory } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface FundChartProps {
  currentPrice: number;
  color?: string;
}

const FundChart: React.FC<FundChartProps> = ({ currentPrice, color = "#3b82f6" }) => {
  const { t } = useLanguage();
  const [days, setDays] = useState(30);

  // Memoize the data based on currentPrice and selected timeframe
  const data = useMemo(() => generateMockHistory(currentPrice, days), [currentPrice, days]);

  const ranges = [
    { labelKey: 'range1M', value: 30 },
    { labelKey: 'range3M', value: 90 },
    { labelKey: 'range6M', value: 180 },
    { labelKey: 'range1Y', value: 365 },
    { labelKey: 'range3Y', value: 1095 },
    { labelKey: 'range5Y', value: 1825 },
    { labelKey: 'rangeAll', value: 3650 },
  ];

  return (
    <div className="flex flex-col w-full h-[320px] md:h-72 bg-white rounded-3xl p-5 border border-slate-100 shadow-inner">
       <div className="flex justify-between items-center mb-6">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('price')} History</span>
            <span className="text-sm font-bold text-slate-700">{t(ranges.find(r => r.value === days)?.labelKey || 'range1M')} Range</span>
         </div>
         <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
           {ranges.map(range => (
             <button
               key={range.labelKey}
               onClick={(e) => {
                 e.stopPropagation();
                 setDays(range.value);
               }}
               className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
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
       
       <div className="flex-1 w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`colorGradient-${currentPrice}-${days}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" hide={true} />
            <YAxis domain={['auto', 'auto']} hide={true} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: '1px solid #f1f5f9', 
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', 
                fontSize: '11px',
                fontWeight: '700',
                padding: '10px'
              }}
              formatter={(value: number) => [`${value.toFixed(4)}`, t('price')]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#colorGradient-${currentPrice}-${days})`} 
              strokeWidth={3}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FundChart;
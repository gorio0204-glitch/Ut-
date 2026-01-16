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

  // Memoize the data so it doesn't regenerate on every render
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
    <div className="flex flex-col w-full h-[300px] md:h-64 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
       <div className="flex justify-end gap-1 mb-2 overflow-x-auto no-scrollbar pb-1">
         {ranges.map(range => (
           <button
             key={range.labelKey}
             onClick={(e) => {
               e.stopPropagation(); // Prevent card expansion toggle if inside clickable area
               setDays(range.value);
             }}
             className={`px-3 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
               days === range.value 
                 ? 'bg-slate-800 text-white shadow-md' 
                 : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-200'
             }`}
           >
             {t(range.labelKey)}
           </button>
         ))}
       </div>
       
       <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id={`colorGradient-${currentPrice}-${days}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              hide={true} 
            />
            <YAxis 
              domain={['auto', 'auto']} 
              hide={true} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              formatter={(value: number) => [value.toFixed(4), t('price')]}
              labelFormatter={(label) => `${t('today').replace('Today','Date')}: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#colorGradient-${currentPrice}-${days})`} 
              strokeWidth={2}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FundChart;
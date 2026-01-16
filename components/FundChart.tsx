import React, { useMemo } from 'react';
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
  // Memoize the data so it doesn't regenerate on every render
  const data = useMemo(() => generateMockHistory(currentPrice), [currentPrice]);

  return (
    // Simplified container structure to fix "width(-1)" warnings from Recharts
    // Explicitly using block display with width 99% to avoid resize observer loops
    <div className="w-full h-48 block" style={{ minHeight: '12rem' }}>
      <ResponsiveContainer width="99%" height="100%">
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
            <linearGradient id={`colorGradient-${currentPrice}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            hide 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [value.toFixed(2), t('price')]}
            labelFormatter={(label) => `${t('date')}: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#colorGradient-${currentPrice})`} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FundChart;
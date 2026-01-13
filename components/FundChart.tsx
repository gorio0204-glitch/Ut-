import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { generateMockHistory } from '../constants';

interface FundChartProps {
  currentPrice: number;
  color?: string;
}

const FundChart: React.FC<FundChartProps> = ({ currentPrice, color = "#3b82f6" }) => {
  // Memoize the data so it doesn't regenerate on every render, causing the chart to jump
  const data = useMemo(() => generateMockHistory(currentPrice), [currentPrice]);

  return (
    <div className="h-48 w-full">
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
            formatter={(value: number) => [value.toFixed(2), '價格']}
            labelFormatter={(label) => `日期: ${label}`}
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
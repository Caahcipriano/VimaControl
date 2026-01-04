
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProductionRecord } from '../types';

interface StatsChartProps {
  data: ProductionRecord[];
}

const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-white rounded-xl p-4 shadow-sm border border-stone-200">
      <h4 className="text-sm font-bold text-stone-600 mb-4 uppercase tracking-wider">Evolução da Produção (L)</h4>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10}} 
            axisLine={false} 
            tickLine={false}
          />
          <YAxis 
            tick={{fontSize: 10}} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="liters" 
            stroke="#16a34a" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#16a34a' }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;

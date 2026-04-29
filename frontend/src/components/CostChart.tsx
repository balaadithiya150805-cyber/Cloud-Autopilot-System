import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchCosts } from '../services/api';
import type { DailyCost } from '../services/api';
import { AlertCircle } from 'lucide-react';

export const CostChart: React.FC = () => {
  const [data, setData] = useState<DailyCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const costs = await fetchCosts();
        if (!cancelled) setData(costs);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load cost data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Past 7 Days AWS Costs</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">Actual spend over the last week</p>
        </div>
      </div>

      {loading && (
        <div className="h-64 flex flex-col items-center justify-end space-y-2 pb-4">
          <div className="flex w-full items-end justify-between px-4 h-full gap-2 opacity-50">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="w-full bg-slate-200 dark:bg-gray-700 rounded-t-sm animate-pulse" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="h-64 flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`$${(Number(value) ?? 0).toFixed(2)}`, 'Cost']}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="cost" name="Actual Cost" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCost)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

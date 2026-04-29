import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Activity, Database } from 'lucide-react';
import { fetchCosts } from '../services/api';

interface Props {
  ready?: boolean;
  dataLength?: number;
}

export const KPICards: React.FC<Props> = ({ ready = true, dataLength = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    average: 0,
    maxSpike: 0,
  });

  useEffect(() => {
    if (!ready) return;
    
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchCosts();
        if (!cancelled && data.length > 0) {
          const totalCost = data.reduce((sum, item) => sum + (item.cost || 0), 0);
          const avgCost = totalCost / data.length;
          const maxCost = Math.max(...data.map((item) => item.cost || 0));

          setMetrics({
            total: totalCost,
            average: avgCost,
            maxSpike: maxCost,
          });
        }
      } catch (err) {
        console.error('Failed to load KPIs', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [ready]);

    const cards = [
      {
        title: "Total Cost (7d)",
        value: `$${metrics.total.toFixed(2)}`,
        icon: <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        color: "bg-blue-100 dark:bg-blue-900/40"
      },
      {
        title: "Daily Average",
        value: `$${metrics.average.toFixed(2)}`,
        icon: <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        color: "bg-emerald-100 dark:bg-emerald-900/40"
      },
      {
        title: "Highest Spike",
        value: `$${metrics.maxSpike.toFixed(2)}`,
        icon: <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
        color: "bg-orange-100 dark:bg-orange-900/40"
      },
      {
        title: "Total Records",
        value: dataLength.toString(),
        icon: <Database className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
        color: "bg-violet-100 dark:bg-violet-900/40"
      }
    ];

  if (loading || !ready) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 flex items-center justify-between transition hover:scale-[1.02] hover:shadow-lg cursor-default">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">{card.value}</p>
          </div>
          <div className={`p-3 rounded-lg ${card.color}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

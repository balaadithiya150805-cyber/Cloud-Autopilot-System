import React, { useEffect, useState } from 'react';
import { fetchAnomalies } from '../services/api';
import type { AnomalyCost } from '../services/api';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  ready?: boolean;
}

export const AnomalyList: React.FC<Props> = ({ ready = true }) => {
  const [data, setData] = useState<AnomalyCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const anomalies = await fetchAnomalies();
        if (!cancelled) setData(anomalies);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load anomalies');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [ready]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 h-full flex flex-col transition hover:shadow-lg">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Anomaly Detection Log</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400">Recent spending deviations</p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3 space-y-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-100 dark:bg-gray-700/50 rounded-lg animate-pulse border border-slate-100 dark:border-gray-700"></div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center gap-2 py-12 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-y-auto pr-2 max-h-[300px]">
          {data.length === 0 ? (
            <p className="text-sm text-slate-500">No data available.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl flex items-center justify-between border transition hover:shadow-md hover:scale-[1.01] ${
                    item.status === 'anomaly' 
                      ? 'bg-red-50/50 dark:bg-red-900/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-300' 
                      : 'bg-emerald-50/50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.status === 'anomaly' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{item.date}</p>
                      <p className="text-xs uppercase font-bold tracking-wider opacity-70">
                        {item.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.cost ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

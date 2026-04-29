import React, { useEffect, useState } from 'react';
import { fetchExplanations } from '../services/api';
import type { ExplanationCost } from '../services/api';
import { Lightbulb, Info, AlertCircle } from 'lucide-react';

interface Props {
  ready?: boolean;
}

export const ExplanationCards: React.FC<Props> = ({ ready = true }) => {
  const [data, setData] = useState<ExplanationCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const explanations = await fetchExplanations();
        if (!cancelled) setData(explanations);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load explanations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [ready]);

  const anomalies = data.filter(d => d.status === 'anomaly' && d.reason);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:shadow-lg">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">AI Cost Insights</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400">Root cause analysis and optimizations</p>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 min-h-[120px] flex flex-col space-y-3">
              <div className="flex justify-between">
                <div className="w-20 h-6 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="w-full h-4 bg-slate-200 dark:bg-gray-700 rounded animate-pulse mt-2"></div>
              <div className="w-3/4 h-4 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
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
        <>
          {anomalies.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/80">
              <p className="text-slate-500 dark:text-gray-400">No recent anomalies detected. Your cloud costs are stable.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {anomalies.map((anomaly, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-orange-300 dark:border-orange-900/50 bg-white dark:bg-gray-800 shadow-sm transition hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-md">
                      {anomaly.date}
                    </span>
                    <span className="text-slate-800 dark:text-gray-100 font-bold">${(anomaly.cost ?? 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-start text-sm text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/50 p-3 rounded-lg border border-slate-100 dark:border-gray-700">
                      <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-md mt-0.5 shrink-0">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-gray-100 mb-1">Root Cause</p>
                        <p className="leading-relaxed">{anomaly.reason}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start text-sm text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-md mt-0.5 shrink-0">
                        <Lightbulb className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1">Recommended Action</p>
                        <p className="leading-relaxed">{anomaly.suggestion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

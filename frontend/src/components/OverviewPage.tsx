import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { fetchCosts, fetchAnomalies, fetchPredictions, fetchExplanations } from '../services/api';
import type { DailyCost, AnomalyCost, PredictionCost, ExplanationCost } from '../services/api';
import { DollarSign, Activity, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

interface Props {
  ready?: boolean;
}

export const OverviewPage: React.FC<Props> = ({ ready = true }) => {
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<DailyCost[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyCost[]>([]);
  const [predictions, setPredictions] = useState<PredictionCost[]>([]);
  const [explanations, setExplanations] = useState<ExplanationCost[]>([]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [c, a, p, e] = await Promise.all([
          fetchCosts(),
          fetchAnomalies(),
          fetchPredictions(),
          fetchExplanations(),
        ]);
        if (!cancelled) {
          setCosts(c);
          setAnomalies(a);
          setPredictions(p);
          setExplanations(e);
        }
      } catch (err) {
        console.error('Overview load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [ready]);

  const totalCost = costs.reduce((s, c) => s + (c.cost || 0), 0);
  const avgCost = costs.length > 0 ? totalCost / costs.length : 0;
  const maxCost = costs.length > 0 ? Math.max(...costs.map(c => c.cost || 0)) : 0;
  const anomalyCount = anomalies.filter(a => a.status === 'anomaly').length;

  const topAnomalies = anomalies
    .filter(a => a.status === 'anomaly')
    .sort((a, b) => (b.cost || 0) - (a.cost || 0))
    .slice(0, 3);

  const topInsight = explanations.find(e => e.status === 'anomaly' && e.reason);

  const kpis = [
    { title: 'Total Cost', value: `$${totalCost.toFixed(2)}`, icon: <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { title: 'Avg Cost', value: `$${avgCost.toFixed(2)}`, icon: <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    { title: 'Highest Cost', value: `$${maxCost.toFixed(2)}`, icon: <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />, bg: 'bg-orange-100 dark:bg-orange-900/40' },
    { title: 'Anomalies', value: anomalyCount.toString(), icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />, bg: 'bg-red-100 dark:bg-red-900/40' },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-28 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 h-48 animate-pulse" />
          ))}
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 flex items-center justify-between transition hover:scale-[1.02] hover:shadow-lg cursor-default">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">{kpi.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
          </div>
        ))}
      </div>

      {/* Mini Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend Mini */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:shadow-lg">
          <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-4">Cost Trend (7d)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costs}>
                <defs>
                  <linearGradient id="ovCostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Cost']} />
                <Area type="monotone" dataKey="cost" stroke="#3B82F6" fill="url(#ovCostGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Mini */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:shadow-lg">
          <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-4">Prediction (Next 7d)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions}>
                <defs>
                  <linearGradient id="ovPredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Predicted']} />
                <Area type="monotone" dataKey="predicted_cost" stroke="#8B5CF6" fill="url(#ovPredGrad)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Anomalies + Key Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Anomalies */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:shadow-lg">
          <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-4">Top Anomalies</h3>
          {topAnomalies.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">No anomalies detected.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topAnomalies.map((a, idx) => (
                <div key={idx} className="p-3 rounded-xl flex items-center justify-between border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/30 text-red-900 dark:text-red-300 transition hover:shadow-md hover:scale-[1.01]">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">{a.date}</p>
                      <p className="text-xs uppercase font-bold tracking-wider opacity-70">anomaly</p>
                    </div>
                  </div>
                  <p className="font-bold">${(a.cost ?? 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Key AI Insight */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:shadow-lg">
          <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-4">Key AI Insight</h3>
          {topInsight ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-md">{topInsight.date}</span>
                <span className="text-slate-800 dark:text-gray-100 font-bold">${(topInsight.cost ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex gap-3 items-start text-sm text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/50 p-3 rounded-lg border border-slate-100 dark:border-gray-700">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-md mt-0.5 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-gray-100 mb-1">Root Cause</p>
                  <p className="leading-relaxed">{topInsight.reason}</p>
                </div>
              </div>
              {topInsight.suggestion && (
                <div className="flex gap-3 items-start text-sm text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-md mt-0.5 shrink-0">
                    <Lightbulb className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1">Suggestion</p>
                    <p className="leading-relaxed">{topInsight.suggestion}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-gray-400">No anomaly insights available. Cloud costs are stable.</p>
          )}
        </div>
      </div>
    </div>
  );
};

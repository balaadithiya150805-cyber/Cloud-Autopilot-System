import React, { useEffect, useState } from 'react';
import { fetchAnomalies } from '../services/api';
import type { AnomalyCost } from '../services/api';
import { Bell, AlertTriangle, CheckCircle2, Loader2, BellOff } from 'lucide-react';

interface Props {
  ready?: boolean;
}

export const AlertsPage: React.FC<Props> = ({ ready = true }) => {
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<AnomalyCost[]>([]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAnomalies();
        if (!cancelled) setAnomalies(data);
      } catch (err) {
        console.error('Alerts load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [ready]);

  const alertsEnabled = (() => {
    try {
      const s = localStorage.getItem('app-settings');
      if (s) return JSON.parse(s).alertsEnabled !== false;
    } catch { /* ignore */ }
    return true;
  })();

  const flagged = anomalies.filter(a => a.status === 'anomaly');

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto w-full">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 dark:bg-amber-900/40 p-2.5 rounded-xl">
            <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Alerts</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400">Cost anomaly notifications</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
          alertsEnabled
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            : 'bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
        }`}>
          {alertsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
          {alertsEnabled ? 'Alerts On' : 'Alerts Off'}
        </span>
      </div>

      {!alertsEnabled && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
          Alerts are currently disabled. Enable them in Settings to receive anomaly notifications.
        </div>
      )}

      {/* Alert Cards */}
      {flagged.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 dark:text-gray-300">All Clear</p>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">No cost anomalies detected in the current data window.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flagged.map((alert, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-900/50 p-5 flex items-center justify-between transition hover:shadow-lg hover:scale-[1.005]">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 dark:bg-red-900/40 p-2.5 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-gray-100">Cost Anomaly Detected</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{alert.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">${(alert.cost ?? 0).toFixed(2)}</p>
                <span className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 opacity-70">anomaly</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

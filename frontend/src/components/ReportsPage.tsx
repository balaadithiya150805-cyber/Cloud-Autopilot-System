import React, { useEffect, useState } from 'react';
import { fetchCosts, fetchAnomalies } from '../services/api';
import type { DailyCost, AnomalyCost } from '../services/api';
import { Download, FileText, Loader2, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface Props {
  ready?: boolean;
}

export const ReportsPage: React.FC<Props> = ({ ready = true }) => {
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<DailyCost[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyCost[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [c, a] = await Promise.all([fetchCosts(), fetchAnomalies()]);
        if (!cancelled) {
          setCosts(c);
          setAnomalies(a);
          // Set default date range from data
          if (c.length > 0) {
            const dates = c.map(d => d.date).sort();
            setStartDate(dates[0]);
            setEndDate(dates[dates.length - 1]);
          }
        }
      } catch (err) {
        console.error('Reports load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [ready]);

  // Filter by date range
  const filteredCosts = costs.filter(c => {
    if (startDate && c.date < startDate) return false;
    if (endDate && c.date > endDate) return false;
    return true;
  });
  const filteredAnomalies = anomalies.filter(a => {
    if (startDate && a.date < startDate) return false;
    if (endDate && a.date > endDate) return false;
    return true;
  });

  const totalCost = filteredCosts.reduce((s, c) => s + (c.cost || 0), 0);
  const anomalyCount = filteredAnomalies.filter(a => a.status === 'anomaly').length;

  const downloadCSV = () => {
    const header = 'Date,Cost,Status\n';
    const anomalyMap = new Map(filteredAnomalies.map(a => [a.date, a.status]));
    const rows = filteredCosts.map(c => `${c.date},${c.cost.toFixed(2)},${anomalyMap.get(c.date) || 'normal'}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloud-costs-report-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto w-full">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Cost Report</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">Generate and download cost reports</p>
            </div>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm font-medium transition hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-gray-900/50 border border-slate-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:scale-[1.02] hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">${totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:scale-[1.02] hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">Records</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">{filteredCosts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 transition hover:scale-[1.02] hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">Anomalies Found</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{anomalyCount}</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 overflow-hidden">
        <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-4">Daily Breakdown</h3>
        {filteredCosts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-gray-400 py-8 text-center">No data for selected date range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-gray-400">Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCosts.map((cost, idx) => {
                  const anomaly = filteredAnomalies.find(a => a.date === cost.date);
                  const isAnomaly = anomaly?.status === 'anomaly';
                  return (
                    <tr key={idx} className="border-b border-slate-100 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition">
                      <td className="py-3 px-4 text-slate-800 dark:text-gray-200">{cost.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-gray-200">${cost.cost.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isAnomaly
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {isAnomaly ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {isAnomaly ? 'Anomaly' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

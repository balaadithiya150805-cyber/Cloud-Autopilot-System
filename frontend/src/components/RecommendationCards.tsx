import React, { useEffect, useState } from 'react';
import { fetchRecommendations } from '../services/api';
import type { Recommendation } from '../services/api';
import { Lightbulb, AlertTriangle, TrendingDown, DollarSign, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

interface Props {
  ready: boolean;
}

export const RecommendationCards: React.FC<Props> = ({ ready }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) {
      loadRecommendations();
    }
  }, [ready]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string, severity: string) => {
    if (type === 'cost_spike') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (type === 'idle_resource') return <TrendingDown className="w-5 h-5 text-orange-500" />;
    if (type === 'savings_plan') return <DollarSign className="w-5 h-5 text-emerald-500" />;
    if (severity === 'high') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <Lightbulb className="w-5 h-5 text-blue-500" />;
  };

  if (!ready || loading) {
    return (
      <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-800/50 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm text-slate-500 mt-4">Analyzing cloud infrastructure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-200/50 dark:border-red-800/50 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-emerald-50/50 dark:bg-emerald-900/20 backdrop-blur-sm rounded-xl p-8 border border-emerald-200/50 dark:border-emerald-800/50 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800/50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Infrastructure Optimized!</h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 max-w-md mt-2">
          We didn't find any immediate cost-saving recommendations. Keep up the good work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100">AI Recommendations</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <div 
            key={index} 
            className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-gray-700/50 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${rec.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' : rec.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  {getIcon(rec.type, rec.severity)}
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-gray-100">{rec.title}</h4>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                {rec.impact}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
              {rec.description}
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Review Action <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

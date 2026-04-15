import { useEffect, useState } from 'react';
import { CostChart } from './components/CostChart';
import { PredictionChart } from './components/PredictionChart';
import { AnomalyList } from './components/AnomalyList';
import { ExplanationCards } from './components/ExplanationCards';
import { KPICards } from './components/KPICards';
import { fetchCosts } from './services/api';
import { ShieldCheck, Loader2, Sun, Moon } from 'lucide-react';

function App() {
  const [costsReady, setCostsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const initializeData = async () => {
    setIsInitializing(true);
    setCostsReady(false);
    try {
      await fetchCosts();
    } finally {
      setCostsReady(true);
      setIsInitializing(false);
    }
  };

  // Seed costs into backend DB first, then allow dependent components to fetch
  useEffect(() => {
    initializeData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md transition hover:scale-[1.02]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cloud Cost Guardian AI</h1>
              <p className="text-sm text-slate-500">AI-powered cloud cost monitoring &amp; anomaly detection</p>
            </div>
          </div>
          <button 
            onClick={initializeData}
            disabled={isInitializing}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium transition"
          >
            {isInitializing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isInitializing ? "Initializing..." : "Initialize Data"}
          </button>
        </header>

        {isInitializing ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 border-dashed">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-gray-300">No data yet, fetching...</p>
            <p className="text-sm text-slate-400 dark:text-gray-500 mt-2 hover:animate-pulse">Building cloud cost models</p>
          </div>
        ) : (
          <>
            <KPICards ready={costsReady} />

            {/* Top Grid: Charts & Anomaly Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <CostChart />
                <PredictionChart ready={costsReady} />
              </div>
              <div className="lg:col-span-1">
                <AnomalyList ready={costsReady} />
              </div>
            </div>

            {/* Bottom Panel: Explanations */}
            <div className="w-full">
              <ExplanationCards ready={costsReady} />
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}

export default App;

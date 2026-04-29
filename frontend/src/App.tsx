import { useEffect, useState } from 'react';
import { CostChart } from './components/CostChart';
import { PredictionChart } from './components/PredictionChart';
import { AnomalyList } from './components/AnomalyList';
import { ExplanationCards } from './components/ExplanationCards';
import { KPICards } from './components/KPICards';
import { Sidebar } from './components/Sidebar';
import type { TabId } from './components/Sidebar';
import { OverviewPage } from './components/OverviewPage';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { AlertsPage } from './components/AlertsPage';
import { RecommendationCards } from './components/RecommendationCards';
import { LoginPage } from './components/LoginPage';
import { fetchCosts } from './services/api';
import type { DailyCost, AuthUser } from './services/api';
import { ShieldCheck, Loader2, Sun, Moon, Menu } from 'lucide-react';

function App() {
  /* ── auth state ─────────────────────────────────────────── */
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('authUser', JSON.stringify(u));
    if (u.access_token) {
      localStorage.setItem('token', u.access_token);
    }
    if (u.refresh_token) {
      localStorage.setItem('refreshToken', u.refresh_token);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await import('./services/api').then(m => m.logoutAuth(refreshToken));
      } catch (e) {
        console.error('Logout failed:', e);
      }
    }
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  /* ── dashboard state ────────────────────────────────────── */
  const [costsReady, setCostsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [costsData, setCostsData] = useState<DailyCost[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
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
      const data = await fetchCosts();
      setCostsData(data);
      setLastUpdated(new Date());
    } finally {
      setCostsReady(true);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user]);

  // Close mobile menu when switching tabs
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  /* ── if not authenticated, show login page ──────────────── */
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (isInitializing) {
      return (
        <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 border-dashed m-6">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-gray-300">Initializing Dashboard...</p>
          <p className="text-sm text-slate-400 dark:text-gray-500 mt-2 animate-pulse">Building cloud cost models</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        if (costsReady && costsData.length === 0) {
          return (
            <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 border-dashed">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-2">No Cost Data Yet</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md text-center mb-6">
                  Connect your AWS account in Settings to start monitoring real cloud costs, or click Refresh to load demo data.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setActiveTab('settings')} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm font-medium transition">
                    Connect AWS
                  </button>
                  <button onClick={initializeData} className="px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg shadow hover:bg-slate-200 dark:hover:bg-gray-600 text-sm font-medium transition">
                    Load Demo Data
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
            <KPICards ready={costsReady} dataLength={costsData.length} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <CostChart />
                <PredictionChart ready={costsReady} />
              </div>
              <div className="lg:col-span-1">
                <AnomalyList ready={costsReady} />
              </div>
            </div>
            <div className="w-full">
              <ExplanationCards ready={costsReady} />
            </div>
          </div>
        );
      case 'overview':
        return <OverviewPage ready={costsReady} />;
      case 'costs':
        return (
          <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
            <CostChart />
          </div>
        );
      case 'predictions':
        return (
          <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
            <PredictionChart ready={costsReady} />
          </div>
        );
      case 'anomalies':
        return (
          <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
            <AnomalyList ready={costsReady} />
          </div>
        );
      case 'explanations':
        return (
          <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
            <ExplanationCards ready={costsReady} />
          </div>
        );
      case 'recommendations':
        return (
          <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
            <RecommendationCards ready={costsReady} />
          </div>
        );
      case 'reports':
        return <ReportsPage ready={costsReady} />;
      case 'alerts':
        return <AlertsPage ready={costsReady} />;
      case 'settings':
        return <SettingsPage theme={theme} onThemeChange={setTheme} />;
    }
  };

  return (
    <div className="flex h-screen bg-theme-mesh text-slate-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="relative w-64 h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-white/20 dark:border-gray-800/50 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4">
              <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} user={user} />
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} user={user} />
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/20 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="bg-blue-600 p-2 rounded-xl shadow-md hidden sm:block">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">Cloud Autopilot System</h1>
              <p className="text-xs text-slate-500 dark:text-gray-400 hidden sm:block">AI-powered cloud cost monitoring & anomaly detection</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex flex-col items-end mr-2 hidden sm:flex">
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium tracking-wide uppercase">Last Updated</span>
              <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">
                {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
              </span>
            </div>
            <button 
              onClick={initializeData}
              disabled={isInitializing}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium transition"
            >
              {isInitializing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <span className="hidden sm:inline">{isInitializing ? "Refreshing..." : "Refresh Data"}</span>
              <span className="sm:hidden">{isInitializing ? "..." : "Refresh"}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-white/40 dark:bg-gray-950/40 backdrop-blur-sm transition-colors duration-300">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;

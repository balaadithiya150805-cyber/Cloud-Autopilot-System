import React from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  FileText, 
  Bell, 
  Settings,
  LogOut,
  User,
  Zap,
} from 'lucide-react';

export type TabId = 'dashboard' | 'overview' | 'costs' | 'anomalies' | 'predictions' | 'explanations' | 'recommendations' | 'reports' | 'alerts' | 'settings';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onLogout?: () => void;
  user?: { username: string; email: string } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, user }) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'overview', label: 'Overview', icon: <PieChart className="w-5 h-5" /> },
    { id: 'costs', label: 'Costs', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'anomalies', label: 'Anomalies', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'predictions', label: 'Predictions', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'explanations', label: 'Explanations', icon: <Lightbulb className="w-5 h-5" /> },
    { id: 'recommendations', label: 'Recommendations', icon: <Zap className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-r border-white/20 dark:border-gray-800/50 hidden md:flex md:flex-col overflow-y-auto">
      <div className="p-4 flex-1">
        <div className="space-y-1 mt-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* User profile & sign out */}
      {user && onLogout && (
        <div className="p-4 border-t border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate">{user.username}</p>
              <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};


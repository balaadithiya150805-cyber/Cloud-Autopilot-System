import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Bell, BellOff, Sliders, Save, CheckCircle2 } from 'lucide-react';

interface AppSettings {
  anomalyThreshold: number;
  theme: 'light' | 'dark';
  alertsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  anomalyThreshold: 2.0,
  theme: 'light',
  alertsEnabled: true,
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem('app-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  // Derive theme from existing localStorage key for consistency
  const savedTheme = localStorage.getItem('theme');
  return {
    ...DEFAULT_SETTINGS,
    theme: (savedTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
  };
}

interface Props {
  theme: string;
  onThemeChange: (theme: string) => void;
}

export const SettingsPage: React.FC<Props> = ({ theme, onThemeChange }) => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  // Keep theme in sync with parent
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme: theme as 'light' | 'dark' }));
  }, [theme]);

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    // Apply theme globally
    onThemeChange(settings.theme);
    localStorage.setItem('theme', settings.theme);
    // Show saved indicator
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const handleAlertToggle = () => {
    setSettings(prev => ({ ...prev, alertsEnabled: !prev.alertsEnabled }));
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Settings</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">Configure your dashboard preferences</p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 divide-y divide-slate-100 dark:divide-gray-700">

        {/* Anomaly Threshold */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg mt-0.5">
                <Sliders className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Anomaly Threshold</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Standard deviations above mean to flag as anomaly (default: 2.0)</p>
              </div>
            </div>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.anomalyThreshold}
              onChange={e => setSettings(prev => ({ ...prev, anomalyThreshold: parseFloat(e.target.value) || 2.0 }))}
              className="w-24 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-center font-medium"
            />
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-violet-100 dark:bg-violet-900/40 p-2 rounded-lg mt-0.5">
                {settings.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                ) : (
                  <Sun className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Theme</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Toggle between light and dark mode</p>
              </div>
            </div>
            <button
              onClick={handleThemeToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Alerts Toggle */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-lg mt-0.5">
                {settings.alertsEnabled ? (
                  <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Alerts</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Enable anomaly alert notifications</p>
              </div>
            </div>
            <button
              onClick={handleAlertToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                settings.alertsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.alertsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow text-sm font-medium transition hover:scale-[1.02] ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

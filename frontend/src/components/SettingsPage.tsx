import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Bell, BellOff, Sliders, Save, CheckCircle2, Cloud, ShieldCheck, Mail, Lock, Loader2, AlertCircle, User } from 'lucide-react';
import { connectAWS, fetchProfile, updateEmail, changePassword } from '../services/api';
import type { UserProfile } from '../services/api';
import { useToast } from './ToastProvider';

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

type FeedbackMsg = { type: 'success' | 'error'; text: string } | null;

export const SettingsPage: React.FC<Props> = ({ theme, onThemeChange }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // AWS
  const [awsKey, setAwsKey] = useState('');
  const [awsSecret, setAwsSecret] = useState('');
  const [connectingAws, setConnectingAws] = useState(false);
  const [awsMessage, setAwsMessage] = useState<FeedbackMsg>(null);

  // Update Email
  const [emailPassword, setEmailPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<FeedbackMsg>(null);

  // Change Password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<FeedbackMsg>(null);

  // Keep theme in sync with parent
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme: theme as 'light' | 'dark' }));
  }, [theme]);

  // Load profile on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setProfileLoading(true);
      try {
        const data = await fetchProfile();
        if (!cancelled) setProfile(data);
      } catch {
        // Profile fetch failed — non-critical
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    onThemeChange(settings.theme);
    localStorage.setItem('theme', settings.theme);
    setSaved(true);
    toast('success', 'Preferences saved successfully!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const handleAlertToggle = () => {
    setSettings(prev => ({ ...prev, alertsEnabled: !prev.alertsEnabled }));
  };

  const handleConnectAws = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awsKey || !awsSecret) return;
    setConnectingAws(true);
    setAwsMessage(null);
    try {
      await connectAWS(awsKey, awsSecret);
      setAwsMessage({ type: 'success', text: 'AWS credentials securely connected!' });
      toast('success', 'AWS credentials connected successfully!');
      setAwsKey('');
      setAwsSecret('');
      // Refresh profile to update AWS status
      try { const p = await fetchProfile(); setProfile(p); } catch {}
    } catch {
      setAwsMessage({ type: 'error', text: 'Failed to connect AWS credentials.' });
    } finally {
      setConnectingAws(false);
    }
  };

  const getErrorMsg = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const resp = (err as any).response;
      return resp?.data?.detail || resp?.data?.message || 'Something went wrong.';
    }
    return 'Network error. Please try again.';
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPassword || !newEmail) return;
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const result = await updateEmail(emailPassword, newEmail);
      // Update stored auth with new tokens
      localStorage.setItem('token', result.access_token || '');
      if (result.refresh_token) localStorage.setItem('refreshToken', result.refresh_token);
      const authUser = localStorage.getItem('authUser');
      if (authUser) {
        const parsed = JSON.parse(authUser);
        parsed.email = result.email;
        parsed.access_token = result.access_token;
        parsed.refresh_token = result.refresh_token;
        localStorage.setItem('authUser', JSON.stringify(parsed));
      }
      setEmailMsg({ type: 'success', text: 'Email updated successfully! Tokens refreshed.' });
      toast('success', 'Email address updated successfully!');
      setEmailPassword('');
      setNewEmail('');
      try { const p = await fetchProfile(); setProfile(p); } catch {}
    } catch (err) {
      setEmailMsg({ type: 'error', text: getErrorMsg(err) });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd) return;
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPwd.length < 8 || newPwd.length > 16) {
      setPwdMsg({ type: 'error', text: 'Password must be between 8 and 16 characters.' });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      await changePassword(currentPwd, newPwd);
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' });
      toast('success', 'Password changed successfully!');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: getErrorMsg(err) });
    } finally {
      setPwdLoading(false);
    }
  };

  const FeedbackBanner: React.FC<{ msg: FeedbackMsg }> = ({ msg }) => {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border ${
        msg.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400'
      }`}>
        {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
        {msg.text}
      </div>
    );
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

      {/* Preferences Card */}
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
            <input type="number" min="0.1" max="10" step="0.1" value={settings.anomalyThreshold}
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
                {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-violet-600 dark:text-violet-400" /> : <Sun className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Theme</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Toggle between light and dark mode</p>
              </div>
            </div>
            <button onClick={handleThemeToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${settings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
        {/* Alerts Toggle */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-lg mt-0.5">
                {settings.alertsEnabled ? <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <BellOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Alerts</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Enable anomaly alert notifications</p>
              </div>
            </div>
            <button onClick={handleAlertToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${settings.alertsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${settings.alertsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Account Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-slate-800 dark:text-gray-100">Account Status</h3>
        </div>
        <div className="p-6 space-y-4">
          {profileLoading ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : profile ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-gray-900/50 border border-slate-100 dark:border-gray-700">
                  <User className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">Username</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">{profile.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-gray-900/50 border border-slate-100 dark:border-gray-700">
                  <Mail className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">Email</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">{profile.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border flex-1 ${
                  profile.is_verified
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400'
                }`}>
                  {profile.is_verified ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span className="font-medium">{profile.is_verified ? 'Email Verified' : 'Email Not Verified'}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border flex-1 ${
                  profile.has_aws_credentials
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400'
                    : 'bg-slate-50 dark:bg-gray-900/50 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'
                }`}>
                  <Cloud className="w-4 h-4" />
                  <span className="font-medium">{profile.has_aws_credentials ? 'AWS Connected' : 'AWS Not Connected'}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-4">Could not load profile info.</p>
          )}
        </div>
      </div>

      {/* Update Email Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-gray-100">Update Email</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Change your account email address</p>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">New Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="newemail@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Current Password</label>
              <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="Confirm your password" maxLength={16}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <FeedbackBanner msg={emailMsg} />
            <div className="flex justify-end">
              <button type="submit" disabled={emailLoading || !newEmail || !emailPassword}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition flex items-center gap-2">
                {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {emailLoading ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 flex items-center gap-3">
          <Lock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-gray-100">Change Password</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Update your account password</p>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Current Password</label>
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Enter current password" maxLength={16}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">New Password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="8–16 characters" minLength={8} maxLength={16}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="8–16 characters" minLength={8} maxLength={16}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none" />
            </div>
            <FeedbackBanner msg={pwdMsg} />
            <div className="flex justify-end">
              <button type="submit" disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
                className="px-5 py-2 bg-violet-600 text-white rounded-lg shadow hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition flex items-center gap-2">
                {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {pwdLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AWS Connect Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 flex items-center gap-3">
          <Cloud className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-gray-100">Connect AWS Account</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Securely store your read-only IAM credentials to fetch live data.</p>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleConnectAws} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Access Key ID</label>
              <input type="text" value={awsKey} onChange={e => setAwsKey(e.target.value)} placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Secret Access Key</label>
              <input type="password" value={awsSecret} onChange={e => setAwsSecret(e.target.value)} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            <FeedbackBanner msg={awsMessage} />
            <div className="flex justify-end">
              <button type="submit" disabled={connectingAws || !awsKey || !awsSecret}
                className="px-5 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition flex items-center gap-2">
                {connectingAws && <Loader2 className="w-4 h-4 animate-spin" />}
                {connectingAws ? 'Connecting...' : 'Connect AWS'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Save Preferences Button */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow text-sm font-medium transition hover:scale-[1.02] ${
            saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
          {saved ? (<><CheckCircle2 className="w-4 h-4" /> Saved!</>) : (<><Save className="w-4 h-4" /> Save Preferences</>)}
        </button>
      </div>
    </div>
  );
};

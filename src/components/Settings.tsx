import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function Settings() {
  const { 
    setCurrentView, 
    notificationSettings, 
    setNotificationSettings,
    appSettings,
    setAppSettings,
    isDarkMode,
    toggleDarkMode,
    showToast,
    setMantras,
    mantras,
  } = useApp();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const defaultMantra = mantras.find(m => m.isDefault);

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => {
      const newValue = !prev[key];
      if (key === 'enabled' && !newValue) {
        return { ...prev, enabled: false, dailyReminders: false, malaAlerts: false, pushNotifications: false };
      }
      if (key === 'enabled' && newValue) {
        return { ...prev, enabled: true, dailyReminders: true, malaAlerts: true };
      }
      return { ...prev, [key]: newValue };
    });
    showToast('Setting updated', 'success');
  };

  const handleSoundChange = () => {
    showToast('🚀 Sound Selection - Coming Soon!', 'info');
  };

  const handleResetTimeChange = () => {
    showToast('🚀 Auto Reset Time - Coming Soon!', 'info');
  };

  const handleDefaultLandingChange = (value: 'dashboard' | 'defaultMantra') => {
    if (value === 'defaultMantra' && !defaultMantra) {
      showToast('Please set a default mantra first from Edit Mantra page', 'warning');
      return;
    }
    setAppSettings(prev => ({ 
      ...prev, 
      defaultLandingPage: value,
      defaultMantraId: value === 'defaultMantra' ? defaultMantra?.id || null : null
    }));
    showToast(`Default landing page set to ${value === 'dashboard' ? 'Dashboard' : 'Default Mantra'}`, 'success');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setMantras([]);
      localStorage.removeItem('mantra_data');
      showToast('All data cleared', 'success');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          showToast('Notifications enabled!', 'success');
          setNotificationSettings(prev => ({ ...prev, pushNotifications: true }));
        } else if (permission === 'denied') {
          showToast('Notification permission denied.', 'warning');
        }
      } catch (error) {
        showToast('Error requesting permission', 'error');
      }
    } else {
      showToast('Notifications not supported', 'warning');
    }
  };

  const testNotification = () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported', 'warning');
      return;
    }
    if (Notification.permission === 'granted') {
      try {
        new Notification('Mantra Meter', { body: 'Test notification! 🙏' });
        showToast('Test notification sent!', 'success');
      } catch {
        showToast('Test notification - working!', 'success');
      }
    } else {
      showToast('Please enable notifications first', 'warning');
    }
  };

  const ToggleRow = ({ label, description, checked, onChange, disabled = false }: {
    label: string; description: string; checked: boolean; onChange: () => void; disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-3">
        <span className="block font-semibold text-gray-800 dark:text-white text-sm">{label}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
        <div className={`w-12 h-6 bg-gray-200 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${disabled ? 'opacity-50' : ''}`}></div>
      </label>
    </div>
  );

  const status = (() => {
    if (!('Notification' in window)) return { text: 'Not Supported', color: 'text-gray-500' };
    switch (notificationPermission) {
      case 'granted': return { text: '✅ Enabled', color: 'text-green-500' };
      case 'denied': return { text: '❌ Blocked', color: 'text-red-500' };
      default: return { text: '⚠️ Not Set', color: 'text-yellow-500' };
    }
  })();

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Back Button */}
      <button
        onClick={() => setCurrentView('dashboard')}
        className="w-full bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Settings</span>
      </button>

      <div className="flex-1 overflow-auto">
        {/* Default Landing Page Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-home text-amber-500"></i>
              Default Landing Page
            </h3>
          </div>
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={() => handleDefaultLandingChange('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                appSettings.defaultLandingPage === 'dashboard'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-slate-600'
              }`}
            >
              <i className={`fas fa-check-circle ${appSettings.defaultLandingPage === 'dashboard' ? 'text-indigo-500' : 'text-gray-300'}`}></i>
              <div className="text-left">
                <span className="block font-semibold text-gray-800 dark:text-white text-sm">Dashboard</span>
                <span className="block text-xs text-gray-500">Open dashboard after login</span>
              </div>
            </button>
            <button
              onClick={() => handleDefaultLandingChange('defaultMantra')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                appSettings.defaultLandingPage === 'defaultMantra'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-slate-600'
              }`}
            >
              <i className={`fas fa-check-circle ${appSettings.defaultLandingPage === 'defaultMantra' ? 'text-amber-500' : 'text-gray-300'}`}></i>
              <div className="text-left">
                <span className="block font-semibold text-gray-800 dark:text-white text-sm">Default Mantra Counter</span>
                <span className="block text-xs text-gray-500">
                  {defaultMantra ? `Current: ${defaultMantra.name}` : 'No default mantra set - Set from Edit Mantra'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 mt-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-bell text-indigo-500"></i>
              Notifications
            </h3>
            <span className={`text-sm ${status.color}`}>{status.text}</span>
          </div>
          <div className="px-4 py-2">
            <ToggleRow label="Enable All Notifications" description="Master switch" checked={notificationSettings.enabled} onChange={() => handleNotificationToggle('enabled')} />
            <ToggleRow label="Daily Reminders" description="Daily practice reminders" checked={notificationSettings.dailyReminders} onChange={() => handleNotificationToggle('dailyReminders')} disabled={!notificationSettings.enabled} />
            <ToggleRow label="Mala Completion Alerts" description="Notify on mala complete" checked={notificationSettings.malaAlerts} onChange={() => handleNotificationToggle('malaAlerts')} disabled={!notificationSettings.enabled} />
            <ToggleRow label="Vibrate on Each Mantra" description="Vibrate on every count" checked={notificationSettings.countVibration} onChange={() => handleNotificationToggle('countVibration')} />
            <ToggleRow label="Vibrate on Mala Complete" description="Vibrate when mala completes" checked={notificationSettings.malaVibration} onChange={() => handleNotificationToggle('malaVibration')} />
            <ToggleRow label="Push Notifications" description="When app is closed" checked={notificationSettings.pushNotifications} onChange={() => handleNotificationToggle('pushNotifications')} disabled={!notificationSettings.enabled || notificationPermission !== 'granted'} />
            
            {/* Sound Selection - Upcoming Feature */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-3">
                <span className="block font-semibold text-gray-800 dark:text-white text-sm">Sound</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Notification sound</span>
              </div>
              <button 
                onClick={handleSoundChange}
                className="px-3 py-1.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white text-sm flex items-center gap-2"
              >
                <span>Bell</span>
                <i className="fas fa-chevron-down text-xs text-gray-400"></i>
              </button>
            </div>
          </div>
          <div className="px-4 pb-3 space-y-2">
            <button onClick={requestNotificationPermission} className="w-full bg-indigo-600 text-white py-2.5 font-semibold flex items-center justify-center gap-2 rounded-lg">
              <i className="fas fa-bell"></i> Request Permission
            </button>
            <button onClick={testNotification} className="w-full bg-emerald-600 text-white py-2.5 font-semibold flex items-center justify-center gap-2 rounded-lg">
              <i className="fas fa-paper-plane"></i> Test Notification
            </button>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 mt-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-mobile-alt text-indigo-500"></i>
              App Settings
            </h3>
          </div>
          <div className="px-4 py-2">
            <ToggleRow label="Dark Mode" description="Light and dark themes" checked={isDarkMode} onChange={toggleDarkMode} />
            
            {/* Auto Reset Time - Upcoming Feature */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-3">
                <span className="block font-semibold text-gray-800 dark:text-white text-sm">Auto Reset Time</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Daily count reset time</span>
              </div>
              <button 
                onClick={handleResetTimeChange}
                className="px-3 py-1.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white text-sm"
              >
                00:00
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 mt-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-database text-indigo-500"></i>
              Data Management
            </h3>
          </div>
          <div className="px-4 py-3">
            <button onClick={handleClearData} className="w-full bg-red-500 text-white py-2.5 font-semibold flex items-center justify-center gap-2 rounded-lg">
              <i className="fas fa-trash"></i> Clear All Data
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-slate-800 mt-2 mb-4">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-info-circle text-indigo-500"></i>
              About
            </h3>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="font-bold text-gray-800 dark:text-white">Mantra Meter v3.0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track your spiritual journey</p>
            <p className="text-xs text-gray-500 mt-2">Made with 🙏 for spiritual practitioners</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Mantra, NotificationSettings, AppSettings, ViewType, SortOption } from '../types';
import { onAuthChange, saveMantrasToCloud, loadMantrasFromCloud, firebaseSignOut } from '../firebase';

// Default mantras for guest users
const DEFAULT_MANTRAS: Mantra[] = [
  {
    id: 'default_1',
    name: 'ॐ नमः शिवाय',
    malaSize: 108,
    practiceDays: [0, 1, 2, 3, 4, 5, 6],
    reminderEnabled: false,
    reminderTime: '07:00',
    sound: 'bell',
    totalCount: 0,
    todayCount: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: Date.now(),
    dailyHistory: [],
  },
  {
    id: 'default_2',
    name: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे, हरे राम हरे राम राम राम हरे हरे',
    malaSize: 108,
    practiceDays: [0, 1, 2, 3, 4, 5, 6],
    reminderEnabled: false,
    reminderTime: '07:00',
    sound: 'bell',
    totalCount: 0,
    todayCount: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: Date.now(),
    dailyHistory: [],
  },
  {
    id: 'default_3',
    name: 'ॐ गं गणपतये नमः',
    malaSize: 108,
    practiceDays: [0, 1, 2, 3, 4, 5, 6],
    reminderEnabled: false,
    reminderTime: '07:00',
    sound: 'bell',
    totalCount: 0,
    todayCount: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: Date.now(),
    dailyHistory: [],
  },
];

interface AppContextType {
  // User state
  isLoggedIn: boolean;
  isGuest: boolean;
  userName: string;
  userPhoto: string;
  userEmail: string;
  firebaseUserId: string | null;
  setUserName: (name: string) => void;
  login: (asGuest?: boolean) => void;
  logout: () => void;
  
  // View state
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Mantras
  mantras: Mantra[];
  setMantras: React.Dispatch<React.SetStateAction<Mantra[]>>;
  selectedMantra: Mantra | null;
  setSelectedMantra: (mantra: Mantra | null) => void;
  
  // Sorting
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  
  // Settings
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Toast
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  
  // Helper functions
  addMantra: (mantra: Omit<Mantra, 'id' | 'createdAt' | 'lastUpdated' | 'dailyHistory'>) => void;
  updateMantra: (id: string, updates: Partial<Mantra>) => void;
  deleteMantra: (id: string) => void;
  incrementCount: (id: string) => void;
  decrementCount: (id: string) => void;
  resetTodayCount: (id: string) => void;
}

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  dailyReminders: true,
  malaAlerts: true,
  pushNotifications: false,
  soundEnabled: true,
  countVibration: true,
  malaVibration: true,
  notificationVibration: true,
};

const defaultAppSettings: AppSettings = {
  autoResetTime: '04:00',
  vibrationEnabled: true,
  darkMode: false,
  sound: 'bell',
  defaultLandingPage: 'dashboard',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [userPhoto, setUserPhoto] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Track if cloud data is loaded to prevent overwriting
  const cloudDataLoaded = useRef(false);
  const isFirstSave = useRef(true);

  // ✅ Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        // User is signed in with Google
        setIsLoggedIn(true);
        setIsGuest(false);
        setUserName(user.displayName || 'User');
        setUserPhoto(user.photoURL || '');
        setUserEmail(user.email || '');
        setFirebaseUserId(user.uid);

        // Save to localStorage
        localStorage.setItem('mantra_logged_in', 'true');
        localStorage.setItem('mantra_guest_mode', 'false');
        localStorage.setItem('mantra_user_name', user.displayName || 'User');

        // ✅ Load mantras from cloud FIRST
        try {
          console.log('☁️ Loading data from cloud...');
          const cloudMantras = await loadMantrasFromCloud(user.uid);
          
          if (cloudMantras && cloudMantras.length > 0) {
            console.log('✅ Cloud data found:', cloudMantras.length, 'mantras');
            setMantras(cloudMantras);
            // Also save to localStorage as backup
            localStorage.setItem('mantra_data', JSON.stringify(cloudMantras));
          } else {
            console.log('📱 No cloud data, checking localStorage...');
            // No cloud data, check localStorage
            const savedMantras = localStorage.getItem('mantra_data');
            if (savedMantras) {
              try {
                const parsed = JSON.parse(savedMantras);
                if (parsed.length > 0) {
                  console.log('✅ Local data found:', parsed.length, 'mantras');
                  setMantras(parsed);
                  // Upload local data to cloud
                  await saveMantrasToCloud(user.uid, parsed);
                  console.log('☁️ Local data uploaded to cloud');
                }
              } catch (e) {
                console.error('Error parsing local mantras:', e);
              }
            }
          }
          cloudDataLoaded.current = true;
          isFirstSave.current = true;
        } catch (error) {
          console.error('Error loading cloud data:', error);
          // Fallback to localStorage
          const savedMantras = localStorage.getItem('mantra_data');
          if (savedMantras) {
            try {
              setMantras(JSON.parse(savedMantras));
            } catch (e) {
              console.error('Error parsing local mantras:', e);
            }
          }
          cloudDataLoaded.current = true;
        }
      } else {
        // No Firebase user
        const guestMode = localStorage.getItem('mantra_guest_mode');
        if (guestMode === 'true') {
          setIsLoggedIn(true);
          setIsGuest(true);
          setFirebaseUserId(null);
          
          // Load guest mantras from localStorage
          const savedMantras = localStorage.getItem('mantra_data');
          if (savedMantras) {
            try {
              const parsed = JSON.parse(savedMantras);
              setMantras(parsed.length > 0 ? parsed : DEFAULT_MANTRAS);
            } catch (e) {
              setMantras(DEFAULT_MANTRAS);
            }
          } else {
            setMantras(DEFAULT_MANTRAS);
          }
        } else {
          setIsLoggedIn(false);
          setIsGuest(false);
          setFirebaseUserId(null);
        }
        cloudDataLoaded.current = false;
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load settings and theme
  useEffect(() => {
    if (!isLoggedIn) return;

    const savedSettings = localStorage.getItem('mantra_settings');
    if (savedSettings) {
      try {
        setAppSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    const savedNotifSettings = localStorage.getItem('notification_settings');
    if (savedNotifSettings) {
      try {
        setNotificationSettings(prev => ({ ...prev, ...JSON.parse(savedNotifSettings) }));
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    }

    const savedTheme = localStorage.getItem('mantra_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isLoggedIn]);

  // ✅ Save mantras to localStorage AND cloud (with protection)
  useEffect(() => {
    if (!isLoggedIn || mantras.length === 0) return;
    
    // Skip first save after cloud load to prevent overwriting
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }

    // Save to localStorage
    localStorage.setItem('mantra_data', JSON.stringify(mantras));
    
    // Save to Firebase cloud if logged in with Google
    if (firebaseUserId && !isGuest && cloudDataLoaded.current) {
      console.log('☁️ Saving to cloud...', mantras.length, 'mantras');
      saveMantrasToCloud(firebaseUserId, mantras);
    }
  }, [mantras, isLoggedIn, firebaseUserId, isGuest]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('mantra_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const login = (asGuest: boolean = false) => {
    setIsLoggedIn(true);
    setIsGuest(asGuest);
    setUserName(asGuest ? 'Guest' : 'User');
    localStorage.setItem('mantra_logged_in', 'true');
    localStorage.setItem('mantra_guest_mode', asGuest ? 'true' : 'false');
    localStorage.setItem('mantra_user_name', asGuest ? 'Guest' : 'User');
    
    if (asGuest) {
      const savedMantras = localStorage.getItem('mantra_data');
      if (!savedMantras || JSON.parse(savedMantras).length === 0) {
        setMantras(DEFAULT_MANTRAS);
      } else {
        try {
          setMantras(JSON.parse(savedMantras));
        } catch (e) {
          setMantras(DEFAULT_MANTRAS);
        }
      }
    }
    
    setCurrentView('dashboard');
  };

  const logout = async () => {
    // Sign out from Firebase
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }

    setIsLoggedIn(false);
    setIsGuest(false);
    setUserName('Guest');
    setUserPhoto('');
    setUserEmail('');
    setFirebaseUserId(null);
    setMantras([]);
    setCurrentView('dashboard');
    cloudDataLoaded.current = false;
    isFirstSave.current = true;
    
    localStorage.removeItem('mantra_logged_in');
    localStorage.removeItem('mantra_guest_mode');
    localStorage.removeItem('mantra_user_name');
    localStorage.removeItem('mantra_data');
    localStorage.removeItem('mantra_settings');
    localStorage.removeItem('notification_settings');
    localStorage.removeItem('mantra_theme');
    
    setIsDarkMode(false);
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('mantra_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('mantra_theme', 'light');
      }
      return newValue;
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addMantra = (mantraData: Omit<Mantra, 'id' | 'createdAt' | 'lastUpdated' | 'dailyHistory'>) => {
    const newMantra: Mantra = {
      ...mantraData,
      id: 'mantra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      lastUpdated: Date.now(),
      dailyHistory: [],
    };
    setMantras(prev => [...prev, newMantra]);
    showToast(`"${mantraData.name}" added successfully!`, 'success');
  };

  const updateMantra = (id: string, updates: Partial<Mantra>) => {
    setMantras(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates, lastUpdated: Date.now() } : m
    ));
    if (selectedMantra?.id === id) {
      setSelectedMantra(prev => prev ? { ...prev, ...updates, lastUpdated: Date.now() } : null);
    }
  };

  const deleteMantra = (id: string) => {
    const mantra = mantras.find(m => m.id === id);
    setMantras(prev => prev.filter(m => m.id !== id));
    if (selectedMantra?.id === id) {
      setSelectedMantra(null);
    }
    if (mantra) {
      showToast(`"${mantra.name}" deleted`, 'success');
    }
  };

  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  const saveDailyHistory = (mantra: Mantra) => {
    const today = getCurrentDate();
    const dailyHistory = [...(mantra.dailyHistory || [])];
    
    const todayIndex = dailyHistory.findIndex(h => h.date === today);
    const historyEntry = {
      date: today,
      mantraCount: mantra.todayCount,
      malaCount: Math.floor(mantra.todayCount / mantra.malaSize),
      beadsPerMala: mantra.malaSize,
      remark: '',
      status: {
        practiced: mantra.todayCount > 0,
        beadsUpdated: false,
        settingsUpdated: false,
        missed: mantra.todayCount === 0,
      },
      lastUpdated: Date.now(),
    };

    if (todayIndex >= 0) {
      dailyHistory[todayIndex] = { ...dailyHistory[todayIndex], ...historyEntry };
    } else {
      dailyHistory.push(historyEntry);
    }

    return dailyHistory;
  };

  const incrementCount = (id: string) => {
    setMantras(prev => prev.map(m => {
      if (m.id === id) {
        const newTodayCount = m.todayCount + 1;
        const newTotalCount = m.totalCount + 1;
        const updated = {
          ...m,
          todayCount: newTodayCount,
          totalCount: newTotalCount,
          lastUpdated: Date.now(),
        };
        updated.dailyHistory = saveDailyHistory(updated);
        return updated;
      }
      return m;
    }));

    if (selectedMantra?.id === id) {
      setSelectedMantra(prev => {
        if (!prev) return null;
        const newTodayCount = prev.todayCount + 1;
        const updated = {
          ...prev,
          todayCount: newTodayCount,
          totalCount: prev.totalCount + 1,
          lastUpdated: Date.now(),
        };
        updated.dailyHistory = saveDailyHistory(updated);
        return updated;
      });
    }
  };

  const decrementCount = (id: string) => {
    setMantras(prev => prev.map(m => {
      if (m.id === id && m.todayCount > 0) {
        const updated = {
          ...m,
          todayCount: m.todayCount - 1,
          totalCount: m.totalCount - 1,
          lastUpdated: Date.now(),
        };
        updated.dailyHistory = saveDailyHistory(updated);
        return updated;
      }
      return m;
    }));

    if (selectedMantra?.id === id && selectedMantra.todayCount > 0) {
      setSelectedMantra(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          todayCount: prev.todayCount - 1,
          totalCount: prev.totalCount - 1,
          lastUpdated: Date.now(),
        };
        updated.dailyHistory = saveDailyHistory(updated);
        return updated;
      });
    }
  };

  const resetTodayCount = (id: string) => {
    setMantras(prev => prev.map(m => {
      if (m.id === id) {
        const updated = {
          ...m,
          totalCount: m.totalCount - m.todayCount,
          todayCount: 0,
          lastUpdated: Date.now(),
        };
        updated.dailyHistory = saveDailyHistory(updated);
        return updated;
      }
      return m;
    }));

    if (selectedMantra?.id === id) {
      setSelectedMantra(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          totalCount: prev.totalCount - prev.todayCount,
          todayCount: 0,
          lastUpdated: Date.now(),
        };
        updated.dailyHistory = saveDailyHistory(updated);
        return updated;
      });
    }
    showToast('Today\'s count reset', 'success');
  };

  // Show loading while checking auth
   // Handle default landing page
  useEffect(() => {
    if (isLoggedIn && !authLoading && currentView === 'dashboard') {
      if (appSettings.defaultLandingPage === 'defaultMantra') {
        const defaultMantra = mantras.find(m => m.isDefault);
        if (defaultMantra) {
          setSelectedMantra(defaultMantra);
          setCurrentView('counting');
        }
      }
    }
  }, [isLoggedIn, authLoading, appSettings.defaultLandingPage, mantras]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-7xl animate-spin" style={{ animationDuration: '3s' }}>
            🕉️
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      isLoggedIn,
      isGuest,
      userName,
      userPhoto,
      userEmail,
      firebaseUserId,
      setUserName,
      login,
      logout,
      currentView,
      setCurrentView,
      mantras,
      setMantras,
      selectedMantra,
      setSelectedMantra,
      sortOption,
      setSortOption,
      notificationSettings,
      setNotificationSettings,
      appSettings,
      setAppSettings,
      isDarkMode,
      toggleDarkMode,
      showToast,
      addMantra,
      updateMantra,
      deleteMantra,
      incrementCount,
      decrementCount,
      resetTodayCount,
    }}>
      {children}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 animate-slide-in
          ${toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}
          ${toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' : ''}
          ${toast.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : ''}
          ${toast.type === 'info' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : ''}
        `}>
          <i className={`fas ${
            toast.type === 'success' ? 'fa-check-circle' : 
            toast.type === 'error' ? 'fa-times-circle' : 
            toast.type === 'warning' ? 'fa-exclamation-triangle' : 
            'fa-info-circle'
          }`}></i>
          <span>{toast.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
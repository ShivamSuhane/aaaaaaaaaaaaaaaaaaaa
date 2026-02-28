import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Mantra, NotificationSettings, AppSettings, ViewType } from '../types';
import { db, onAuthChange, saveMantrasToCloud, loadMantrasFromCloud, firebaseSignOut } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Default mantras for new guest users
const DEFAULT_MANTRAS: Mantra[] = [
  {
    id: 'default_1',
    userId: 'guest',
    name: 'ॐ नमः शिवाय',
    malaSize: 108,
    practiceDays: [0, 1, 2, 3, 4, 5, 6],
    totalCount: 0,
    todayCount: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    dailyHistory: [],
    reminderEnabled: false,
    reminderTime: '07:00',
    sound: 'bell',
    isDefault: false,
  },
  {
    id: 'default_2',
    userId: 'guest',
    name: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे',
    malaSize: 108,
    practiceDays: [0, 1, 2, 3, 4, 5, 6],
    totalCount: 0,
    todayCount: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    dailyHistory: [],
    reminderEnabled: false,
    reminderTime: '07:00',
    sound: 'bell',
    isDefault: false,
  },
  {
    id: 'default_3',
    userId: 'guest',
    name: 'ॐ गं गणपतये नमः',
    malaSize: 108,
    practiceDays: [0, 1, 2, 3, 4, 5, 6],
    totalCount: 0,
    todayCount: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    dailyHistory: [],
    reminderEnabled: false,
    reminderTime: '07:00',
    sound: 'bell',
    isDefault: false,
  },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminders: true,
  malaAlerts: true,
  pushNotifications: false,
  countVibration: true,
  malaVibration: true,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  vibrationEnabled: true,
  soundEnabled: true,
  darkMode: false,
  autoResetTime: '00:00',
  language: 'en',
  defaultLandingPage: 'dashboard',
  sound: 'bell',
  defaultMantraId: null,
};

interface AppContextType {
  isLoggedIn: boolean;
  isGuest: boolean;
  userName: string;
  userPhoto: string;
  userEmail: string;
  firebaseUserId: string | null;
  currentView: ViewType;
  mantras: Mantra[];
  selectedMantra: Mantra | null;
  appSettings: AppSettings;
  notificationSettings: NotificationSettings;
  isInitialLoading: boolean;
  showNewDayModal: boolean;
  isDarkMode: boolean;
  sortOption: string;
  login: (asGuest?: boolean) => void;
  logout: () => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedMantra: (mantra: Mantra | null) => void;
  setMantras: React.Dispatch<React.SetStateAction<Mantra[]>>;
  addMantra: (mantraData: Partial<Mantra>) => void;
  updateMantra: (id: string, updates: Partial<Mantra>) => void;
  deleteMantra: (id: string) => void;
  incrementCount: (id: string) => void;
  decrementCount: (id: string) => void;
  resetTodayCount: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  toggleDarkMode: () => void;
  setSortOption: (option: string) => void;
  checkAndResetDaily: () => void;
  setShowNewDayModal: (show: boolean) => void;
  confirmDailyReset: () => void;
}

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showNewDayModal, setShowNewDayModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const cloudDataLoaded = useRef(false);
  const isFirstSave = useRef(true);
  const lastResetDate = useRef<string>('');

  // Get current date in local timezone
  const getCurrentDate = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const showToast = (message: string, type: string = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', newValue.toString());
      return newValue;
    });
  };

  // Check and reset daily counts
  const checkAndResetDaily = () => {
    const today = getCurrentDate();
    const storedLastReset = localStorage.getItem('lastResetDate');
    
    if (storedLastReset && storedLastReset !== today) {
      // New day detected - show modal
      setShowNewDayModal(true);
    } else if (!storedLastReset) {
      // First time - set today as last reset
      localStorage.setItem('lastResetDate', today);
    }
    
    lastResetDate.current = storedLastReset || today;
  };

  // Confirm daily reset
  const confirmDailyReset = () => {
    const today = getCurrentDate();
    
    setMantras(prev => prev.map(mantra => {
      // Save yesterday's count to history if there was any count
      if (mantra.todayCount > 0) {
        const yesterday = lastResetDate.current;
        const existingHistory = mantra.dailyHistory || [];
        const existingDayIndex = existingHistory.findIndex(h => h.date === yesterday);
        
        const dayEntry = {
          date: yesterday,
          mantraCount: mantra.todayCount,
          malaCount: Math.floor(mantra.todayCount / mantra.malaSize),
          beadsPerMala: mantra.malaSize,
          remark: '',
          status: {
            practiced: mantra.todayCount > 0,
            beadsUpdated: false,
            settingsUpdated: false,
            missed: false,
            isPracticeDay: mantra.practiceDays.includes(new Date(yesterday).getDay())
          }
        };

        const newHistory = existingDayIndex >= 0
          ? existingHistory.map((h, i) => i === existingDayIndex ? { ...h, ...dayEntry } : h)
          : [...existingHistory, dayEntry];

        return {
          ...mantra,
          todayCount: 0,
          dailyHistory: newHistory,
          lastUpdated: new Date().toISOString()
        };
      }
      
      return { ...mantra, todayCount: 0 };
    }));

    localStorage.setItem('lastResetDate', today);
    lastResetDate.current = today;
    setShowNewDayModal(false);
    showToast('Daily count reset! Happy practicing! 🙏', 'success');
  };

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Auth & Cloud Data Loading
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setIsGuest(false);
        setUserName(user.displayName || 'User');
        setUserPhoto(user.photoURL || '');
        setUserEmail(user.email || '');
        setFirebaseUserId(user.uid);

        try {
          // Load mantras from cloud
          const cloudMantras = await loadMantrasFromCloud(user.uid);
          
          // Load settings from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.settings) {
              setAppSettings(prev => ({ ...prev, ...userData.settings }));
            }
            if (userData.notificationSettings) {
              setNotificationSettings(prev => ({ ...prev, ...userData.notificationSettings }));
            }
          }

          if (cloudMantras && cloudMantras.length > 0) {
            setMantras(cloudMantras);
            
            // Check default landing page setting
            const savedSettings = userDoc.exists() ? userDoc.data().settings : null;
            if (savedSettings?.defaultLandingPage === 'defaultMantra' && savedSettings?.defaultMantraId) {
              const defaultMantra = cloudMantras.find((m: Mantra) => m.id === savedSettings.defaultMantraId);
              if (defaultMantra) {
                setSelectedMantra(defaultMantra);
                setCurrentView('counting');
              }
            }
          }
          
          cloudDataLoaded.current = true;
        } catch (e) {
          console.error("Cloud load error", e);
        }
      } else {
        // Check guest mode
        const guestMode = localStorage.getItem('mantra_guest_mode');
        if (guestMode === 'true') {
          setIsLoggedIn(true);
          setIsGuest(true);
          setUserName('Guest');
          
          // Load from localStorage
          const savedMantras = localStorage.getItem('mantra_data');
          const savedSettings = localStorage.getItem('mantra_settings');
          
          let parsedMantras: Mantra[] = [];
          
          if (savedMantras) {
            parsedMantras = JSON.parse(savedMantras);
            if (parsedMantras.length > 0) {
              setMantras(parsedMantras);
            } else {
              // Empty array - load defaults
              parsedMantras = DEFAULT_MANTRAS;
              setMantras(DEFAULT_MANTRAS);
              localStorage.setItem('mantra_data', JSON.stringify(DEFAULT_MANTRAS));
            }
          } else {
            // No saved mantras - load defaults
            parsedMantras = DEFAULT_MANTRAS;
            setMantras(DEFAULT_MANTRAS);
            localStorage.setItem('mantra_data', JSON.stringify(DEFAULT_MANTRAS));
          }
          
          // Check default landing page
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            setAppSettings(prev => ({ ...prev, ...settings }));
            
            if (settings.defaultLandingPage === 'defaultMantra' && settings.defaultMantraId) {
              const defaultMantra = parsedMantras.find((m: Mantra) => m.id === settings.defaultMantraId);
              if (defaultMantra) {
                setSelectedMantra(defaultMantra);
                setCurrentView('counting');
              }
            }
          }
        } else {
          setIsLoggedIn(false);
        }
      }
      
      setTimeout(() => setIsInitialLoading(false), 500);
    });
    
    return () => unsubscribe();
  }, []);

  // Save to localStorage and Cloud
  useEffect(() => {
    if (!isLoggedIn) return;
    if (isFirstSave.current && !isGuest) {
      isFirstSave.current = false;
      return;
    }

    // Save to localStorage
    localStorage.setItem('mantra_data', JSON.stringify(mantras));
    localStorage.setItem('mantra_settings', JSON.stringify(appSettings));

    // Save to cloud if logged in with Google
    if (firebaseUserId && !isGuest && cloudDataLoaded.current) {
      saveMantrasToCloud(firebaseUserId, mantras);
      setDoc(doc(db, 'users', firebaseUserId), {
        settings: appSettings,
        notificationSettings: notificationSettings,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    }
  }, [mantras, appSettings, notificationSettings, isLoggedIn, isGuest, firebaseUserId]);

  // Update selected mantra when mantras change
  useEffect(() => {
    if (selectedMantra) {
      const updated = mantras.find(m => m.id === selectedMantra.id);
      if (updated) {
        setSelectedMantra(updated);
      }
    }
  }, [mantras]);

  // Add mantra
  const addMantra = (mantraData: Partial<Mantra>) => {
    const newMantra: Mantra = {
      id: 'm_' + Date.now(),
      userId: firebaseUserId || 'guest',
      name: mantraData.name || '',
      malaSize: mantraData.malaSize || 108,
      practiceDays: mantraData.practiceDays || [0, 1, 2, 3, 4, 5, 6],
      totalCount: 0,
      todayCount: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      dailyHistory: [],
      reminderEnabled: mantraData.reminderEnabled || false,
      reminderTime: mantraData.reminderTime || '07:00',
      sound: mantraData.sound || 'bell',
      isDefault: mantraData.isDefault || false,
    };

    // If this is set as default, update settings
    if (newMantra.isDefault) {
      setAppSettings(prev => ({ ...prev, defaultMantraId: newMantra.id }));
    }

    setMantras(prev => [newMantra, ...prev]);
    showToast('Mantra added successfully! 🙏', 'success');
  };

  // Update mantra
  const updateMantra = (id: string, updates: Partial<Mantra>) => {
    const today = getCurrentDate();
    
    setMantras(prev => prev.map(m => {
      if (m.id !== id) return m;
      
      const newMantra = { ...m, ...updates, lastUpdated: new Date().toISOString() };

      // Track settings changes in history
      if (updates.malaSize !== undefined && updates.malaSize !== m.malaSize) {
        const history = [...(newMantra.dailyHistory || [])];
        const todayIndex = history.findIndex(h => h.date === today);
        
        if (todayIndex >= 0) {
          history[todayIndex] = {
            ...history[todayIndex],
            status: { ...history[todayIndex].status, beadsUpdated: true, settingsUpdated: true }
          };
        } else {
          history.push({
            date: today,
            mantraCount: newMantra.todayCount,
            malaCount: Math.floor(newMantra.todayCount / newMantra.malaSize),
            beadsPerMala: newMantra.malaSize,
            remark: '',
            status: {
              practiced: newMantra.todayCount > 0,
              beadsUpdated: true,
              settingsUpdated: true,
              missed: false,
              isPracticeDay: newMantra.practiceDays.includes(new Date().getDay())
            }
          });
        }
        newMantra.dailyHistory = history;
      }

      return newMantra;
    }));

    // Update default mantra ID if needed
    if (updates.isDefault) {
      setAppSettings(prev => ({ ...prev, defaultMantraId: id }));
    }
  };

  // Increment count
  const incrementCount = (id: string) => {
    const today = getCurrentDate();
    
    setMantras(prev => prev.map(m => {
      if (m.id !== id) return m;
      
      const newTodayCount = m.todayCount + 1;
      const newTotalCount = m.totalCount + 1;
      
      // Update daily history
      const history = [...(m.dailyHistory || [])];
      const todayIndex = history.findIndex(h => h.date === today);
      
      if (todayIndex >= 0) {
        history[todayIndex] = {
          ...history[todayIndex],
          mantraCount: newTodayCount,
          malaCount: Math.floor(newTodayCount / m.malaSize),
          status: { ...history[todayIndex].status, practiced: true }
        };
      } else {
        history.push({
          date: today,
          mantraCount: newTodayCount,
          malaCount: Math.floor(newTodayCount / m.malaSize),
          beadsPerMala: m.malaSize,
          remark: '',
          status: {
            practiced: true,
            beadsUpdated: false,
            settingsUpdated: false,
            missed: false,
            isPracticeDay: m.practiceDays.includes(new Date().getDay())
          }
        });
      }

      return {
        ...m,
        todayCount: newTodayCount,
        totalCount: newTotalCount,
        dailyHistory: history,
        lastUpdated: new Date().toISOString()
      };
    }));
  };

  // Decrement count
  const decrementCount = (id: string) => {
    const today = getCurrentDate();
    
    setMantras(prev => prev.map(m => {
      if (m.id !== id || m.todayCount <= 0) return m;
      
      const newTodayCount = m.todayCount - 1;
      const newTotalCount = m.totalCount - 1;
      
      // Update daily history
      const history = [...(m.dailyHistory || [])];
      const todayIndex = history.findIndex(h => h.date === today);
      
      if (todayIndex >= 0) {
        history[todayIndex] = {
          ...history[todayIndex],
          mantraCount: newTodayCount,
          malaCount: Math.floor(newTodayCount / m.malaSize)
        };
      }

      return {
        ...m,
        todayCount: newTodayCount,
        totalCount: newTotalCount,
        dailyHistory: history,
        lastUpdated: new Date().toISOString()
      };
    }));
  };

  // Reset today count
  const resetTodayCount = (id: string) => {
    setMantras(prev => prev.map(m => {
      if (m.id !== id) return m;
      
      return {
        ...m,
        totalCount: m.totalCount - m.todayCount,
        todayCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }));
    
    showToast("Today's count reset", 'info');
  };

  // Delete mantra
  const deleteMantra = (id: string) => {
    setMantras(prev => prev.filter(m => m.id !== id));
    
    // Clear default if deleted mantra was default
    if (appSettings.defaultMantraId === id) {
      setAppSettings(prev => ({ ...prev, defaultMantraId: null }));
    }
    
    showToast('Mantra deleted', 'success');
  };

  // Login
  const login = (asGuest: boolean = false) => {
    setIsLoggedIn(true);
    setIsGuest(asGuest);
    localStorage.setItem('mantra_guest_mode', asGuest ? 'true' : 'false');
    
    if (asGuest) {
      setUserName('Guest');
      // Load any existing guest data or use default mantras
      const savedMantras = localStorage.getItem('mantra_data');
      if (savedMantras) {
        const parsedMantras = JSON.parse(savedMantras);
        if (parsedMantras.length > 0) {
          setMantras(parsedMantras);
        } else {
          // No mantras saved, load defaults
          setMantras(DEFAULT_MANTRAS);
          localStorage.setItem('mantra_data', JSON.stringify(DEFAULT_MANTRAS));
        }
      } else {
        // First time guest - load default mantras
        setMantras(DEFAULT_MANTRAS);
        localStorage.setItem('mantra_data', JSON.stringify(DEFAULT_MANTRAS));
      }
    }
    
    setCurrentView('dashboard');
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {
      console.error('Logout error', e);
    }
    
    localStorage.removeItem('mantra_guest_mode');
    // Don't clear mantra_data for guest - they might want to login later
    
    setIsLoggedIn(false);
    setIsGuest(false);
    setMantras([]);
    setSelectedMantra(null);
    setCurrentView('dashboard');
    
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn,
      isGuest,
      userName,
      userPhoto,
      userEmail,
      firebaseUserId,
      currentView,
      mantras,
      selectedMantra,
      appSettings,
      notificationSettings,
      isInitialLoading,
      showNewDayModal,
      isDarkMode,
      sortOption,
      login,
      logout,
      setCurrentView,
      setSelectedMantra,
      setMantras,
      addMantra,
      updateMantra,
      deleteMantra,
      incrementCount,
      decrementCount,
      resetTodayCount,
      showToast,
      setAppSettings,
      setNotificationSettings,
      toggleDarkMode,
      setSortOption,
      checkAndResetDaily,
      setShowNewDayModal,
      confirmDailyReset,
    }}>
      {children}
      
      {/* Toast Notification - Right Side, Auto Width */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] max-w-[90vw]">
          <div className={`px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 animate-slide-up w-auto
            ${toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
              toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
              toast.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
          >
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check-circle' :
              toast.type === 'error' ? 'fa-exclamation-circle' :
              toast.type === 'warning' ? 'fa-exclamation-triangle' :
              'fa-info-circle'
            }`}></i>
            <span className="flex-1 text-sm font-medium whitespace-normal break-words">{toast.message}</span>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
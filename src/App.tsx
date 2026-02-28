import { useEffect, useState, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AddMantra } from './components/AddMantra';
import { SavedMantras } from './components/SavedMantras';
import { CountingView } from './components/CountingView';
import { MantraDetails } from './components/MantraDetails';
import { EditMantra } from './components/EditMantra';
import { HistoryView } from './components/HistoryView';
import { Settings } from './components/Settings';
import { InstallPWA } from './components/InstallPWA';

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center z-[200]">
      <div className="text-center">
        {/* Rotating ॐ Symbol */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Multiple glow layers */}
          <div className="absolute w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute w-24 h-24 bg-white/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Main ॐ Symbol */}
          <i 
            className="fas fa-om text-9xl text-white animate-spin-slow relative z-10"
            style={{ 
              textShadow: '0 0 40px rgba(255,255,255,0.9), 0 0 80px rgba(255,255,255,0.6), 0 0 120px rgba(255,255,255,0.3)',
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.8))'
            }}
          ></i>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg tracking-wide">
          Mantra Meter
        </h1>
        <p className="text-white/80 text-sm">Your Spiritual Companion</p>
        
        {/* Loading indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className="w-2 h-2 bg-white/80 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewDayModal({ onConfirm, onManualReset }: { onConfirm: () => void; onManualReset: () => void }) {
  const [showWarning, setShowWarning] = useState(false);

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-fade-in text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-sun text-4xl text-amber-500"></i>
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            🌅 New Day Started!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Yesterday's practice data will be saved to history.
            Today's count will reset to 0.
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-6">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <i className="fas fa-info-circle mr-1"></i>
              Your total count will remain unchanged. Only today's count resets.
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Reset & Sync Button (New) */}
            <button
              onClick={() => setShowWarning(true)}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Reset & Sync
            </button>
            
            {/* Sync & Reset Button (Existing) */}
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <i className="fas fa-cloud-upload-alt mr-2"></i>
              Sync & Reset
            </button>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-fade-in text-center">
            {/* Warning Icon */}
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500"></i>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              ⚠️ Warning!
            </h2>
            
            <div className="space-y-3 text-left mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Reset & Sync</strong> will:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                <li>Save today's current count to history</li>
                <li>Reset today's count to <strong>0</strong></li>
                <li>Mark today as manually synced</li>
                <li>This action <strong>cannot be undone</strong></li>
              </ul>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <i className="fas fa-info-circle mr-1"></i>
                Your total count will remain unchanged.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onManualReset();
                  setShowWarning(false);
                }}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600"
              >
                <i className="fas fa-check mr-2"></i>
                Yes, Reset Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AppContent() {
  const { 
    currentView, 
    isLoggedIn, 
    isInitialLoading, 
    userName,
    checkAndResetDaily,
    showNewDayModal,
    setShowNewDayModal,
    confirmDailyReset,
    resetAndSyncToday,  // 👈 New function from context
    showToast
  } = useApp();
  
  const [showSplash, setShowSplash] = useState(true);
  const hasShownWelcome = useRef(false);

  useEffect(() => {
    if (!isInitialLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        
        if (isLoggedIn && !hasShownWelcome.current) {
          hasShownWelcome.current = true;
          
          showToast(`Welcome, ${userName}! 🙏`, 'success');
          
          setTimeout(() => {
            showToast('Logged in successfully ✅', 'success');
          }, 1500);
          
          setTimeout(() => {
            checkAndResetDaily();
          }, 4000);
        } else if (isLoggedIn) {
          checkAndResetDaily();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoading, isLoggedIn, userName, checkAndResetDaily, showToast]);

  // Show splash screen
  if (showSplash || isInitialLoading) {
    return <SplashScreen />;
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen />
        <InstallPWA />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'addMantra':
        return <AddMantra />;
      case 'savedMantras':
        return <SavedMantras />;
      case 'counting':
        return <CountingView />;
      case 'mantraDetails':
        return <MantraDetails />;
      case 'editMantra':
        return <EditMantra />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const fullScreenViews = ['counting', 'mantraDetails', 'editMantra', 'history', 'settings', 'addMantra', 'savedMantras'];
  const isFullScreen = fullScreenViews.includes(currentView);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {/* New Day Reset Modal */}
      {showNewDayModal && (
        <NewDayModal 
          onConfirm={confirmDailyReset}
          onManualReset={resetAndSyncToday}  // 👈 New prop for manual reset
        />
      )}
      
      {!isFullScreen && <Header />}
      <main>
        {renderView()}
      </main>
      <InstallPWA />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
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
          <div className="absolute w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute w-24 h-24 bg-white/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>

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

// ── New Day Modal ─────────────────────────────────────────────────────────────
function NewDayModal({
  onSaveAndReset,
  onDiscardAndReset,
  totalTodayCount,
}: {
  onSaveAndReset: () => void;
  onDiscardAndReset: () => void;
  totalTodayCount: number;
}) {
  const [showWarning, setShowWarning] = useState(false);

  return (
    <>
      {/* ── Main Dialog ── */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-fade-in text-center">

          {/* Icon */}
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-sun text-4xl text-amber-500"></i>
          </div>

          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            🌅 New Day Started!
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            You have <strong>{totalTodayCount}</strong> mantra counts recorded from yesterday.
            You can save them to history and start fresh, or discard them and reset directly.
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-6">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <i className="fas fa-info-circle mr-1"></i>
              Choose the option that suits you. Read both options below before deciding.
            </p>
          </div>

          {/* Save & Reset button */}
          <button
            onClick={onSaveAndReset}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 mb-3 flex items-center justify-center gap-2"
          >
            <i className="fas fa-save"></i>
            💾 Save &amp; Reset
            <span className="text-xs font-normal opacity-80">— counts will be saved to history</span>
          </button>

          {/* Discard & Reset button */}
          <button
            onClick={() => setShowWarning(true)}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center gap-2"
          >
            <i className="fas fa-trash-alt"></i>
            🗑️ Discard &amp; Reset
            <span className="text-xs font-normal opacity-80">— counts will be deleted</span>
          </button>
        </div>
      </div>

      {/* ── Warning Dialog (shown when Discard & Reset is tapped) ── */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-fade-in text-center">

            {/* Warning Icon */}
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500"></i>
            </div>

            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              ⚠️ Please Note!
            </h2>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                This action will:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-2">
                <li className="flex items-start gap-2">
                  <i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i>
                  <span>Permanently delete your <strong>{totalTodayCount} mantra counts</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i>
                  <span>These counts will <strong>not be saved</strong> to history</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i>
                  <span>Today's practice will <strong>not be recorded</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i>
                  <span>This action <strong>cannot be undone</strong></span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <i className="fas fa-lightbulb mr-1"></i>
                Use this option only if you counted mantras by mistake.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700"
              >
                <i className="fas fa-arrow-left mr-1"></i>
                Go Back
              </button>
              <button
                onClick={onDiscardAndReset}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600"
              >
                <i className="fas fa-trash-alt mr-1"></i>
                Yes, Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── App Content ───────────────────────────────────────────────────────────────
function AppContent() {
  const {
    currentView,
    isLoggedIn,
    isInitialLoading,
    userName,
    mantras,
    checkAndResetDaily,
    showNewDayModal,
    setShowNewDayModal,
    confirmDailyReset,
    resetAndSyncToday,
    showToast,
  } = useApp();

  const [showSplash, setShowSplash] = useState(true);
  const hasShownWelcome = useRef(false);

  // Total today count across all mantras — shown in dialog
  const totalTodayCount = mantras.reduce((sum, m) => sum + (m.todayCount || 0), 0);

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

  if (showSplash || isInitialLoading) {
    return <SplashScreen />;
  }

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
      case 'dashboard': return <Dashboard />;
      case 'addMantra': return <AddMantra />;
      case 'savedMantras': return <SavedMantras />;
      case 'counting': return <CountingView />;
      case 'mantraDetails': return <MantraDetails />;
      case 'editMantra': return <EditMantra />;
      case 'history': return <HistoryView />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const fullScreenViews = ['counting', 'mantraDetails', 'editMantra', 'history', 'settings', 'addMantra', 'savedMantras'];
  const isFullScreen = fullScreenViews.includes(currentView);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">

      {/* New Day Reset Modal */}
      {showNewDayModal && (
        <NewDayModal
          onSaveAndReset={confirmDailyReset}
          onDiscardAndReset={resetAndSyncToday}
          totalTodayCount={totalTodayCount}
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

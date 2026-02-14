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

function AppContent() {
  const { currentView, isLoggedIn } = useApp();

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
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

  // Full screen views without header
  const fullScreenViews = ['counting', 'mantraDetails', 'editMantra', 'history', 'settings', 'addMantra', 'savedMantras'];
  const isFullScreen = fullScreenViews.includes(currentView);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {!isFullScreen && <Header />}
      <main>
        {renderView()}
      </main>
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

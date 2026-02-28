import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function CountingView() {
  const { 
    selectedMantra, 
    setCurrentView, 
    incrementCount, 
    decrementCount, 
    resetTodayCount,
    notificationSettings,
    showToast 
  } = useApp();

  const [showCelebration, setShowCelebration] = useState(false);

  const mantra = selectedMantra;
  
  if (!mantra) {
    setCurrentView('savedMantras');
    return null;
  }

  const todayCount = mantra.todayCount || 0;
  const malaSize = mantra.malaSize || 108;
  const todayMalas = Math.floor(todayCount / malaSize);
  const currentMalaProgress = todayCount % malaSize;

  const handleIncrement = useCallback(() => {
    const newCount = todayCount + 1;
    incrementCount(mantra.id);

    // Vibration on count
    if (notificationSettings.countVibration && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Check mala completion
    if (newCount > 0 && newCount % malaSize === 0) {
      setShowCelebration(true);
      if (notificationSettings.malaVibration && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
      showToast('🎉 Mala Complete!', 'success');
      setTimeout(() => setShowCelebration(false), 2500);
    }
  }, [todayCount, malaSize, mantra.id, incrementCount, notificationSettings, showToast]);

  const handleDecrement = () => {
    if (todayCount > 0) {
      decrementCount(mantra.id);
    }
  };

  const handleReset = () => {
    if (confirm('Reset today\'s count?')) {
      resetTodayCount(mantra.id);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleIncrement();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleIncrement]);

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Mala Complete Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="text-center">
            {/* Row 1: Mala Complete */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-4xl">🎉</span>
              <span className="text-3xl sm:text-4xl font-bold text-white">Mala Complete</span>
              <span className="text-4xl">🎉</span>
            </div>
            {/* Row 2: Sadhu Sadhu */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">🙏</span>
              <span className="text-2xl sm:text-3xl font-bold text-yellow-400">Sadhu Sadhu</span>
              <span className="text-3xl">🙏</span>
            </div>
            {/* Sparkles */}
            <div className="flex justify-center gap-3 mt-6">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"
                  style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1s' }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mantra Info */}
      <div className="text-center py-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{mantra.name}</h1>
        <div className="flex justify-center items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
          <span>{malaSize} beads</span>
          <span>•</span>
          <span>{todayDate}</span>
        </div>
      </div>

      {/* Stats Circles */}
      <div className="flex justify-center gap-6 py-4">
        {[
          { value: todayCount, label: 'Today', borderColor: 'border-indigo-500' },
          { value: todayMalas, label: 'Malas', borderColor: 'border-emerald-500' },
          { value: `${currentMalaProgress}/${malaSize}`, label: 'Progress', borderColor: 'border-amber-500' },
        ].map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className={`w-20 h-20 rounded-full bg-white dark:bg-slate-800 border-4 ${stat.borderColor} flex items-center justify-center shadow-lg`}>
              <span className="text-xl font-bold text-gray-800 dark:text-white">{stat.value}</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Big Counting Circle */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <button
          onClick={handleIncrement}
          className="w-56 h-56 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
        >
          <div className="text-center text-white">
            <div className="text-5xl font-bold">{todayCount}</div>
            <div className="text-lg opacity-80 mt-1">Tap to Count</div>
          </div>
        </button>

        {/* Control Buttons */}
        <div className="flex justify-center gap-8 mt-8">
          <button
            onClick={handleDecrement}
            className="w-14 h-14 rounded-full bg-red-500 text-white text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <i className="fas fa-minus"></i>
          </button>
          <button
            onClick={handleReset}
            className="w-14 h-14 rounded-full bg-amber-500 text-white text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <i className="fas fa-redo"></i>
          </button>
          <button
            onClick={handleIncrement}
            className="w-14 h-14 rounded-full bg-emerald-500 text-white text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => setCurrentView('savedMantras')}
        className="w-full bg-slate-700 text-white py-4 font-semibold flex items-center justify-center gap-2 active:bg-slate-800 transition-colors"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Back to Mantras</span>
      </button>
    </div>
  );
}

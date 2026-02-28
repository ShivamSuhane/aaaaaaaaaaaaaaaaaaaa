import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export function MantraDetails() {
  const { selectedMantra, setCurrentView } = useApp();

  const mantra = selectedMantra;
  
  if (!mantra) {
    setCurrentView('savedMantras');
    return null;
  }

  const malaSize = mantra.malaSize || 108;
  const todayCount = mantra.todayCount || 0;
  const totalCount = mantra.totalCount || 0;
  const todayMalas = Math.floor(todayCount / malaSize);
  const totalMalas = Math.floor(totalCount / malaSize);
  const currentMalaProgress = todayCount % malaSize;
  const progressPercent = (currentMalaProgress / malaSize) * 100;

  // Calculate detailed stats
  const detailedStats = useMemo(() => {
    const history = mantra.dailyHistory || [];
    const practicedDays = history.filter(h => h.mantraCount > 0);
    const totalDays = practicedDays.length;
    
    const avgMantraPerDay = totalDays > 0 ? Math.round(totalCount / totalDays) : 0;
    const avgMalaPerDay = totalDays > 0 ? (totalMalas / totalDays).toFixed(1) : '0';
    
    let bestDate = '-';
    let bestDay = '-';
    let bestCount = 0;
    practicedDays.forEach(h => {
      if (h.mantraCount > bestCount) {
        bestCount = h.mantraCount;
        bestDate = h.date;
        const d = new Date(h.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        bestDay = days[d.getDay()];
      }
    });

    const formattedBestDate = bestDate !== '-' 
      ? new Date(bestDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '-';

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedHistory = [...practicedDays].sort((a, b) => a.date.localeCompare(b.date));
    
    for (let i = 0; i < sortedHistory.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedHistory[i - 1].date);
        const currDate = new Date(sortedHistory[i].date);
        const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        tempStreak = diff === 1 ? tempStreak + 1 : 1;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    if (sortedHistory.length > 0) {
      const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastDate.setHours(0, 0, 0, 0);
      const diff = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      currentStreak = diff <= 1 ? tempStreak : 0;
    }

    const highestDay = bestCount;

    const weekCount = Math.max(1, Math.ceil(totalDays / 7));
    const weeklyAvg = totalDays > 0 ? Math.round(totalCount / weekCount) : 0;

    const addedDate = new Date(mantra.createdAt).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const lastModified = new Date(mantra.lastUpdated).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return {
      totalDays,
      avgMantraPerDay,
      avgMalaPerDay,
      bestDate: formattedBestDate,
      bestDay,
      bestCount,
      currentStreak,
      bestStreak,
      highestDay,
      weeklyAvg,
      addedDate,
      lastModified,
    };
  }, [mantra, totalCount, totalMalas]);

  // ✅ UPDATED SEQUENCE: Row-wise as requested
  const circularStats = [
    // Row 1
    { value: todayCount, label: "Today's Count", bg: 'bg-indigo-500' },
    { value: totalCount, label: 'Total Counts', bg: 'bg-purple-500' },
    { value: detailedStats.avgMantraPerDay, label: 'Avg Mantra/Day', bg: 'bg-pink-500' },
    // Row 2
    { value: todayMalas, label: "Today's Malas", bg: 'bg-emerald-500' },
    { value: totalMalas, label: 'Total Malas', bg: 'bg-teal-500' },
    { value: detailedStats.avgMalaPerDay, label: 'Avg Mala/Day', bg: 'bg-cyan-500' },
    // Row 3
    { value: detailedStats.totalDays, label: 'Days Practiced', bg: 'bg-blue-500' },
    { value: detailedStats.currentStreak, label: 'Current Streak', bg: 'bg-red-500' },
    { value: detailedStats.highestDay, label: 'Highest Day', bg: 'bg-orange-500' },
  ];

  // Rectangle info items
  const infoCards = [
    { 
      icon: 'fa-calendar-plus', 
      label: 'Mantra Added', 
      value: detailedStats.addedDate, 
      bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
      border: 'border-emerald-500',
      iconColor: 'text-emerald-500'
    },
    { 
      icon: 'fa-clock', 
      label: 'Last Modified', 
      value: detailedStats.lastModified, 
      bg: 'bg-blue-50 dark:bg-blue-900/20', 
      border: 'border-blue-500',
      iconColor: 'text-blue-500'
    },
    { 
      icon: 'fa-trophy', 
      label: 'Best Practice', 
      value: `${detailedStats.bestDay}, ${detailedStats.bestDate}`, 
      extra: `${detailedStats.bestCount} mantras (${Math.floor(detailedStats.bestCount / malaSize)} malas)`,
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      border: 'border-amber-500',
      iconColor: 'text-amber-500'
    },
    { 
      icon: 'fa-fire', 
      label: 'Streak Info', 
      value: `Current: ${detailedStats.currentStreak} days`, 
      extra: `Best Ever: ${detailedStats.bestStreak} days`,
      bg: 'bg-red-50 dark:bg-red-900/20', 
      border: 'border-red-500',
      iconColor: 'text-red-500'
    },
    { 
      icon: 'fa-chart-bar', 
      label: 'Weekly Average', 
      value: `${detailedStats.weeklyAvg} mantras/week`, 
      extra: `${Math.floor(detailedStats.weeklyAvg / malaSize)} malas/week`,
      bg: 'bg-purple-50 dark:bg-purple-900/20', 
      border: 'border-purple-500',
      iconColor: 'text-purple-500'
    },
  ];

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Back Button */}
      <button
        onClick={() => setCurrentView('savedMantras')}
        className="w-full bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Back to Mantras</span>
      </button>

      {/* Mantra Info */}
      <div className="text-center py-4 px-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{mantra.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {malaSize} beads • {mantra.practiceDays.length === 7 ? 'All Days' : 'Specific Days'}
        </p>
      </div>

      <div className="flex-1 overflow-auto pb-20">
        {/* Circular Stats - 3 per row */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {circularStats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full ${stat.bg} flex items-center justify-center shadow-lg`}>
                <span className="text-lg font-bold text-white">{stat.value}</span>
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 text-center leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mx-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-4 border border-gray-100 dark:border-slate-700">
          <h4 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Mala Progress</h4>
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentMalaProgress}/{malaSize} beads
          </p>
        </div>

        {/* Rectangle Info Cards */}
        <div className="px-4 space-y-3 mb-4">
          {infoCards.map((card, idx) => (
            <div 
              key={idx} 
              className={`${card.bg} border-l-4 ${card.border} rounded-xl p-4 shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center ${card.iconColor} shadow-sm`}>
                  <i className={`fas ${card.icon}`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.label}</p>
                  <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">{card.value}</p>
                  {card.extra && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{card.extra}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex">
        <button
          onClick={() => setCurrentView('editMantra')}
          className="flex-1 bg-indigo-600 text-white py-4 font-semibold flex items-center justify-center gap-2 active:bg-indigo-700 transition-colors"
        >
          <i className="fas fa-edit"></i>
          Edit
        </button>
        <button
          onClick={() => setCurrentView('history')}
          className="flex-1 bg-emerald-600 text-white py-4 font-semibold flex items-center justify-center gap-2 active:bg-emerald-700 transition-colors"
        >
          <i className="fas fa-history"></i>
          History
        </button>
      </div>
    </div>
  );
}
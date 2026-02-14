import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Mantra, SortOption } from '../types';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'total-malas', label: 'Total Malas' },
  { value: 'today-malas', label: "Today's Malas" },
];

export function SavedMantras() {
  const { 
    mantras, 
    setCurrentView, 
    setSelectedMantra, 
    sortOption, 
    setSortOption 
  } = useApp();

  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedMantras = useMemo(() => {
    const sorted = [...mantras];
    switch (sortOption) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'total-malas':
        return sorted.sort((a, b) => Math.floor(b.totalCount / b.malaSize) - Math.floor(a.totalCount / a.malaSize));
      case 'today-malas':
        return sorted.sort((a, b) => Math.floor(b.todayCount / b.malaSize) - Math.floor(a.todayCount / a.malaSize));
      default:
        return sorted;
    }
  }, [mantras, sortOption]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort';

  const handleCountClick = (mantra: Mantra) => {
    setSelectedMantra(mantra);
    setCurrentView('counting');
  };

  const handleDetailsClick = (mantra: Mantra) => {
    setSelectedMantra(mantra);
    setCurrentView('mantraDetails');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header - Back + Sort Button */}
      <div className="flex">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex-1 bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back</span>
        </button>
        <div className="relative flex-1">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="w-full bg-amber-500 text-white py-3 font-semibold flex items-center justify-center gap-2"
          >
            <i className="fas fa-sort"></i>
            <span>Sorted By</span>
            <i className={`fas fa-chevron-${showSortMenu ? 'up' : 'down'} text-xs`}></i>
          </button>

          {/* Sort Dropdown Menu */}
          {showSortMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSortMenu(false)}
              ></div>
              
              {/* Menu */}
              <div className="absolute top-full right-0 w-56 bg-white dark:bg-slate-800 rounded-b-xl shadow-xl z-50 border border-gray-200 dark:border-slate-700 overflow-hidden">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortOption(option.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                      ${sortOption === option.value 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    <i className={`fas ${sortOption === option.value ? 'fa-check-circle text-indigo-500' : 'fa-circle text-gray-300 dark:text-gray-600'}`}></i>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Current Sort Indicator */}
      <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-filter mr-1"></i>
          Sorted by: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentSortLabel}</span>
        </span>
      </div>

      {/* Mantras List */}
      {sortedMantras.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="text-6xl text-gray-300 mb-4">
            <i className="fas fa-pray"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Mantras Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start by adding your first mantra!</p>
          <button
            onClick={() => setCurrentView('addMantra')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            <i className="fas fa-plus mr-2"></i>
            Add First Mantra
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {sortedMantras.map((mantra) => (
            <div 
              key={mantra.id} 
              className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 p-4"
            >
              {/* Mantra Name */}
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-justify">
                {mantra.name}
              </h3>
              
              {/* Date and Days Row */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                  {formatDate(mantra.createdAt)}
                </span>
                <div className="flex gap-1">
                  {mantra.practiceDays.length === 7 ? (
                    <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded">All</span>
                  ) : (
                    mantra.practiceDays.map(day => (
                      <span key={day} className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded">
                        {DAYS_SHORT[day]}
                      </span>
                    ))
                  )}
                  {mantra.reminderEnabled && (
                    <span className="text-xs text-amber-500 ml-1">
                      <i className="fas fa-bell"></i>
                    </span>
                  )}
                </div>
              </div>

              {/* Count and Details Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCountClick(mantra)}
                  className="flex-1 bg-emerald-500 text-white py-3 font-semibold flex items-center justify-center gap-2 active:bg-emerald-600 transition-colors rounded-lg"
                >
                  <i className="fas fa-hand-point-up"></i>
                  Count
                </button>
                <button
                  onClick={() => handleDetailsClick(mantra)}
                  className="flex-1 bg-indigo-500 text-white py-3 font-semibold flex items-center justify-center gap-2 active:bg-indigo-600 transition-colors rounded-lg"
                >
                  <i className="fas fa-chart-pie"></i>
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
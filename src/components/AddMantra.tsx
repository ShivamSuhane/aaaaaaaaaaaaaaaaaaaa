import { useState } from 'react';
import { useApp } from '../context/AppContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AddMantra() {
  const { setCurrentView, addMantra, mantras, setMantras, appSettings, showToast } = useApp();
  
  const [name, setName] = useState('');
  const [malaSize, setMalaSize] = useState(108);
  const [isAllDays, setIsAllDays] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('07:00');
  const [reminderSound, setReminderSound] = useState(appSettings.sound);
  const [isDefault, setIsDefault] = useState(false);

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleDefaultToggle = () => {
    if (!isDefault) {
      // Remove default from all other mantras
      setMantras(prev => prev.map(m => ({ ...m, isDefault: false })));
      showToast('This mantra will be set as default', 'info');
    }
    setIsDefault(!isDefault);
  };

  const handleMalaSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setMalaSize(0);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 1000) {
        setMalaSize(num);
      }
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast('Please enter mantra name', 'warning');
      return;
    }

    if (malaSize < 1) {
      showToast('Beads per mala must be at least 1', 'warning');
      return;
    }

    const practiceDays = isAllDays ? [0, 1, 2, 3, 4, 5, 6] : selectedDays;

    // If setting as default, remove default from others
    if (isDefault) {
      setMantras(prev => prev.map(m => ({ ...m, isDefault: false })));
    }
    
    addMantra({
      name: name.trim(),
      malaSize,
      practiceDays,
      reminderEnabled,
      reminderTime,
      sound: reminderSound,
      totalCount: 0,
      todayCount: 0,
      isDefault,
    });

    setCurrentView('dashboard');
  };

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => setCurrentView('dashboard')}
        className="w-full bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Back</span>
      </button>

      {/* Form */}
      <div className="bg-gray-50 dark:bg-slate-900">
        <div className="p-4 space-y-5">
          {/* Mantra Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i className="fas fa-pen text-indigo-500"></i>
              Mantra Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ॐ नमः शिवाय"
              maxLength={100}
              className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Mala Settings */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i className="fas fa-pray text-indigo-500"></i>
              Beads per Mala
            </label>
            <input
              type="number"
              value={malaSize || ''}
              onChange={handleMalaSizeChange}
              min={1}
              max={1000}
              placeholder="108"
              className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Default Mantra Toggle */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-3">
                <span className="block font-semibold text-gray-800 dark:text-white text-sm">
                  <i className="fas fa-star text-amber-500 mr-2"></i>
                  Set as Default Mantra
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default mantra opens directly on login
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={handleDefaultToggle}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            {mantras.some(m => m.isDefault) && !isDefault && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Another mantra is currently set as default. Enabling this will replace it.
              </p>
            )}
          </div>

          {/* Practice Days */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i className="fas fa-calendar-alt text-indigo-500"></i>
              Practice Days
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIsAllDays(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  isAllDays ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                All Days
              </button>
              <button
                type="button"
                onClick={() => setIsAllDays(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  !isAllDays ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                Specific Days
              </button>
            </div>
            
            {!isAllDays && (
              <div className="grid grid-cols-4 gap-2">
                {DAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                      selectedDays.includes(index)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Settings */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i className="fas fa-bell text-indigo-500"></i>
              Daily Reminder
            </label>
            <div className="flex items-center gap-3 mb-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
              <span className="text-gray-700 dark:text-gray-300">Enable reminder</span>
            </div>

            {reminderEnabled && (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full p-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sound</label>
                  <select
                    value={reminderSound}
                    onChange={(e) => setReminderSound(e.target.value)}
                    className="w-full p-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white"
                  >
                    <option value="bell">Bell</option>
                    <option value="gong">Gong</option>
                    <option value="om">Om</option>
                    <option value="silent">Silent</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="w-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-4 font-semibold flex items-center justify-center gap-2"
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full bg-indigo-600 text-white py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-check"></i>
            Add Mantra
          </button>
        </div>
      </div>
    </div>
  );
}

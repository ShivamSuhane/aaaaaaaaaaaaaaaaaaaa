import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EditMantra() {
  const { selectedMantra, setCurrentView, updateMantra, deleteMantra, mantras, setMantras, showToast } = useApp();
  
  const [name, setName] = useState('');
  const [malaSize, setMalaSize] = useState(108);
  const [isAllDays, setIsAllDays] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('07:00');
  const [reminderSound, setReminderSound] = useState('bell');
  const [isDefault, setIsDefault] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mantra = selectedMantra;

  useEffect(() => {
    if (mantra) {
      setName(mantra.name);
      setMalaSize(mantra.malaSize);
      setIsAllDays(mantra.practiceDays.length === 7);
      setSelectedDays(mantra.practiceDays);
      setReminderEnabled(mantra.reminderEnabled || false);
      setReminderTime(mantra.reminderTime || '07:00');
      setReminderSound(mantra.sound || 'bell');
      setIsDefault(mantra.isDefault || false);
    }
  }, [mantra]);

  if (!mantra) {
    setCurrentView('savedMantras');
    return null;
  }

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleDefaultToggle = () => {
    if (!isDefault) {
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

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Please enter a mantra name', 'warning');
      return;
    }

    if (malaSize < 1) {
      showToast('Beads per mala must be at least 1', 'warning');
      return;
    }

    const practiceDays = isAllDays ? [0, 1, 2, 3, 4, 5, 6] : selectedDays;

    // If setting as default, remove default from all others first
    if (isDefault) {
      setMantras(prev => prev.map(m => 
        m.id === mantra.id ? m : { ...m, isDefault: false }
      ));
    }
    
    updateMantra(mantra.id, {
      name: name.trim(),
      malaSize,
      practiceDays,
      reminderEnabled,
      reminderTime,
      sound: reminderSound,
      isDefault,
    });

    showToast('Mantra updated successfully!', 'success');
    setCurrentView('mantraDetails');
  };

  const handleDelete = () => {
    deleteMantra(mantra.id);
    setCurrentView('savedMantras');
  };

  // Check if another mantra is default
  const otherDefaultMantra = mantras.find(m => m.isDefault && m.id !== mantra.id);

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl text-red-500 mb-3">
                <i className="fas fa-trash-alt"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Delete Mantra</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete "{mantra.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                className="w-full bg-red-500 text-white py-3 font-semibold flex items-center justify-center gap-2 rounded-lg"
              >
                <i className="fas fa-trash"></i>
                Delete Permanently
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 font-semibold flex items-center justify-center gap-2 rounded-lg"
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => setCurrentView('mantraDetails')}
        className="w-full bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Back</span>
      </button>

      {/* Title */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <i className="fas fa-edit text-indigo-500"></i>
          Edit Mantra
        </h2>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto">
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
            {isDefault && mantra.isDefault && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                <i className="fas fa-check-circle mr-1"></i>
                This is currently the default mantra
              </p>
            )}
            {otherDefaultMantra && !isDefault && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                Current default: "{otherDefaultMantra.name}"
              </p>
            )}
            {isDefault && !mantra.isDefault && otherDefaultMantra && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                This will replace "{otherDefaultMantra.name}" as default
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col">
        <div className="flex">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 bg-red-500 text-white py-3 font-semibold flex items-center justify-center gap-2"
          >
            <i className="fas fa-trash"></i>
            Delete
          </button>
          <button
            onClick={() => setCurrentView('mantraDetails')}
            className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 font-semibold flex items-center justify-center gap-2"
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-4 font-semibold flex items-center justify-center gap-2"
        >
          <i className="fas fa-save"></i>
          Save Changes
        </button>
      </div>
    </div>
  );
}

import { useApp } from '../context/AppContext';

export function Dashboard() {
  const { userName, setCurrentView } = useApp();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const cards = [
    {
      id: 'add',
      title: 'Add New Mantra',
      subtitle: 'Create a new mantra to track',
      icon: 'fa-plus-circle',
      color: 'bg-indigo-500',
      iconBg: 'bg-indigo-600',
      onClick: () => setCurrentView('addMantra'),
    },
    {
      id: 'saved',
      title: 'My Mantras',
      subtitle: 'View and manage your mantras',
      icon: 'fa-bookmark',
      color: 'bg-emerald-500',
      iconBg: 'bg-emerald-600',
      onClick: () => setCurrentView('savedMantras'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Customize your experience',
      icon: 'fa-cog',
      color: 'bg-amber-500',
      iconBg: 'bg-amber-600',
      onClick: () => setCurrentView('settings'),
    },
  ];

  return (
    <div className="animate-fade-in min-h-[calc(100vh-56px)] flex flex-col">
      {/* Welcome Card - DIFFERENT color from cards */}
      <div className="bg-slate-700 text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-semibold flex items-center justify-center sm:justify-start gap-2">
            Welcome, {userName}! 🙏
          </h2>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2 border border-white/30">
          <i className="fas fa-calendar-day"></i>
          <span className="text-sm font-medium">{currentDate}</span>
        </div>
      </div>

      {/* Action Cards - Equal Height, Fill Screen */}
      <div className="flex-1 flex flex-col gap-0">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className={`flex-1 ${card.color} flex items-center gap-4 px-5 text-white active:opacity-90 transition-all border-b border-white/10`}
          >
            <div className={`w-16 h-16 ${card.iconBg} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/20`}>
              <i className={`fas ${card.icon}`}></i>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold">{card.title}</h3>
              <p className="text-sm text-white/70">{card.subtitle}</p>
            </div>
            <div className="text-white/60">
              <i className="fas fa-chevron-right text-xl"></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
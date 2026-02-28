import { useApp } from '../context/AppContext';

export function Header() {
  const { userName, userPhoto, logout, showToast } = useApp();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      showToast('Logged out successfully', 'success');
    }
  };

  return (
    <header className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Left - User Profile Photo (Circular) */}
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 shadow-md flex-shrink-0">
        {userPhoto ? (
          <img 
            src={userPhoto} 
            alt={userName} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg ${userPhoto ? 'hidden' : ''}`}>
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Center - App Name */}
      <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
        <i className="fas fa-om text-amber-400"></i>
        <h1 className="text-lg font-bold">Mantra Meter</h1>
      </div>

      {/* Right - Logout Button (Same circular size as profile) */}
      <button 
        onClick={handleLogout}
        className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-md flex-shrink-0"
      >
        <i className="fas fa-sign-out-alt text-sm"></i>
      </button>
    </header>
  );
}
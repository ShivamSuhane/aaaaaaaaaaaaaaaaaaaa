import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { signInWithGoogle } from '../firebase';

export function LoginScreen() {
  const { login } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      // Firebase auth listener in AppContext will handle login automatically
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Try again!');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up blocked! Please allow pop-ups.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Do nothing
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 text-center">
          <div className="text-6xl mb-4">
            <i className="fas fa-om"></i>
          </div>
          <h1 className="text-3xl font-bold mb-2">Mantra Meter</h1>
          <p className="text-white/80">Track your spiritual journey</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome! 🙏
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your spiritual practice with peace and simplicity
            </p>
          </div>

          {/* Login Buttons */}
          <div className="space-y-4">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-lg
                ${isLoading 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-indigo-300 hover:-translate-y-0.5'
                }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-5 h-5"
                  />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="text-center text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
              <span className="text-gray-400 dark:text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
            </div>

            {/* Guest Button */}
            <button
              onClick={() => login(true)}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <i className="fas fa-user-clock text-xl"></i>
              Try as Guest
            </button>

            {/* Guest Info */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              Guest data is stored locally only. Sign in with Google to sync across devices.
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-gray-600 dark:text-gray-400">
                <div className="text-2xl text-indigo-500 mb-1">
                  <i className="fas fa-pray"></i>
                </div>
                <span className="text-xs">Track Mantras</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <div className="text-2xl text-purple-500 mb-1">
                  <i className="fas fa-chart-line"></i>
                </div>
                <span className="text-xs">View Progress</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <div className="text-2xl text-pink-500 mb-1">
                  <i className="fas fa-cloud"></i>
                </div>
                <span className="text-xs">Cloud Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const { showToast } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Better iOS detection
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome|crios/.test(userAgent);
      return isIOS && isSafari;
    };
    
    const isIOSDevice = checkIOS();
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if permanently dismissed
    const permanentDismiss = localStorage.getItem('pwa_prompt_permanent');
    if (permanentDismiss) return;

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) return; // Don't show for 24 hours
    }

    // Handle beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 3 seconds
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show custom instructions after delay
    if (isIOSDevice && !isStandalone) {
      setTimeout(() => setShow(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShow(false);
      setDeferredPrompt(null);
      showToast('App installed successfully! 🎉', 'success');
    }
  };

  const handleDismiss = (permanent: boolean = false) => {
    setShow(false);
    if (permanent) {
      localStorage.setItem('pwa_prompt_permanent', 'true');
      showToast('You can re-enable install from settings', 'info');
    } else {
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-slide-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border border-gray-100 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* App Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <i className="fas fa-om text-2xl text-white"></i>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Install Mantra Meter
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Get the full app experience
            </p>
          </div>
          
          {/* Close button */}
          <button 
            onClick={() => handleDismiss(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <i className="fas fa-check-circle text-emerald-500"></i>
            <span>Works offline - practice anywhere</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <i className="fas fa-check-circle text-emerald-500"></i>
            <span>Quick access from home screen</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <i className="fas fa-check-circle text-emerald-500"></i>
            <span>No app store required</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isIOS ? (
          // iOS Instructions
          <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>To install on iOS:</strong>
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>1. Tap</span>
              <i className="fas fa-share-square text-blue-500"></i>
              <span>Share button</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span>2. Scroll and tap</span>
              <strong>"Add to Home Screen"</strong>
            </div>
            
            {/* Dismiss options for iOS */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleDismiss(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-slate-600"
              >
                Later
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-500"
              >
                Don't Show Again
              </button>
            </div>
          </div>
        ) : (
          // Android / Desktop Install Buttons
          <>
            <div className="flex gap-3 mb-2">
              <button
                onClick={() => handleDismiss(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700"
              >
                Maybe Later
              </button>
              <button
                onClick={handleInstall}
                className="flex-[2] py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg"
              >
                <i className="fas fa-download mr-2"></i>
                Install App
              </button>
            </div>
            
            {/* Permanent dismiss option */}
            <button
              onClick={() => handleDismiss(true)}
              className="w-full text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 py-1"
            >
              Don't show again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
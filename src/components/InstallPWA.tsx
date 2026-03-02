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
  const [showCount, setShowCount] = useState(0);

  useEffect(() => {
    // ── iOS detection ───────────────────────────────────────────────────────
    const checkIOS = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/chrome|crios/.test(ua);
    };
    const isIOSDevice = checkIOS();
    setIsIOS(isIOSDevice);

    // ── Already installed as standalone ────────────────────────────────────
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // ── Permanently dismissed ───────────────────────────────────────────────
    const permanentDismiss = localStorage.getItem('pwa_prompt_permanent');
    if (permanentDismiss) return;

    // ── 3-show logic ────────────────────────────────────────────────────────
    // showCount  = how many times "Maybe Later" was chosen (max 3)
    // dismissedAt = timestamp of last "Maybe Later" (24hr cooldown)
    const storedCount = parseInt(localStorage.getItem('pwa_show_count') || '0', 10);
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');

    setShowCount(storedCount);

    // If already shown 3 times, check 24hr cooldown
    if (storedCount >= 3) {
      if (!dismissedAt) return;
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
      // After 24hr reset the counter so it can show again
      localStorage.setItem('pwa_show_count', '0');
      localStorage.removeItem('pwa_prompt_dismissed');
    }

    // ── Android / Desktop: capture beforeinstallprompt ──────────────────────
    const alreadyCaptured = (window as any).__pwaInstallPrompt;
    if (alreadyCaptured) {
      setDeferredPrompt(alreadyCaptured);
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const onPromptReady = () => {
      const prompt = (window as any).__pwaInstallPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
        setTimeout(() => setShow(true), 3000);
      }
    };
    window.addEventListener('pwaInstallPromptReady', onPromptReady);

    // ── iOS: show manual instructions ───────────────────────────────────────
    if (isIOSDevice) {
      setTimeout(() => setShow(true), 5000);
    }

    return () => window.removeEventListener('pwaInstallPromptReady', onPromptReady);
  }, []);

  // ── Install handler ───────────────────────────────────────────────────────
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      setDeferredPrompt(null);
      (window as any).__pwaInstallPrompt = null;
      localStorage.setItem('pwa_prompt_permanent', 'true');
      showToast('Mantra Meter installed! 🎉 Open it from your home screen 🙏', 'success');
    }
  };

  // ── Maybe Later handler ───────────────────────────────────────────────────
  // Increments show count. After 3 times sets 24hr cooldown.
  const handleMaybeLater = () => {
    setShow(false);
    const newCount = showCount + 1;
    setShowCount(newCount);
    localStorage.setItem('pwa_show_count', newCount.toString());
    if (newCount >= 3) {
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    }
  };

  // ── Don't show again ──────────────────────────────────────────────────────
  const handleNeverShow = () => {
    setShow(false);
    localStorage.setItem('pwa_prompt_permanent', 'true');
    showToast('Install prompt has been disabled 🙏', 'info');
  };

  if (!show) return null;

  // Remaining shows indicator (1 of 3, 2 of 3, 3 of 3)
  const remainingShows = Math.max(0, 3 - showCount);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:p-4 sm:items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleMaybeLater}
      />

      {/* Card */}
      <div className="relative w-full sm:max-w-md animate-slide-up overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl">

        {/* ── Gradient Header ── */}
        <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 px-6 pt-8 pb-12 overflow-hidden">

          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full" />

          {/* App icon + app name */}
          <div className="relative z-10 flex items-center gap-4">
            <img
              src="/icons/icon-192.png"
              alt="Mantra Meter"
              className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white/30 flex-shrink-0"
            />
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow">
                Mantra Meter
              </h2>
              <p className="text-white/80 text-sm mt-0.5">
                Your Spiritual Companion
              </p>
            </div>
          </div>

          {/* Tagline */}
          <p className="relative z-10 mt-4 text-white/90 text-sm leading-relaxed">
            🕉️ Track your spiritual journey — works offline, anytime, anywhere.
            Add to home screen for instant access!
          </p>

          {/* Show count dots */}
          {remainingShows > 0 && (
            <div className="relative z-10 flex items-center gap-1.5 mt-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i <= (3 - remainingShows)
                      ? 'w-6 bg-white/40'
                      : 'w-3 bg-white'
                  }`}
                />
              ))}
              <span className="text-white/70 text-xs ml-1">
                {remainingShows === 1
                  ? 'This is the last time it will appear'
                  : `Will appear ${remainingShows} more times`}
              </span>
            </div>
          )}
        </div>

        {/* ── White Body ── */}
        <div className="bg-white dark:bg-slate-800 px-6 pt-6 pb-8 -mt-4 rounded-t-3xl relative">

          {/* Features grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="flex flex-col items-center gap-2 bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-3 text-center">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-800/40 rounded-xl flex items-center justify-center">
                <i className="fas fa-wifi-slash text-violet-600 dark:text-violet-400 text-lg"></i>
              </div>
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 leading-tight">
                Works Offline
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-3 text-center">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-800/40 rounded-xl flex items-center justify-center">
                <i className="fas fa-mobile-alt text-cyan-600 dark:text-cyan-400 text-lg"></i>
              </div>
              <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 leading-tight">
                Home Screen Access
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 text-center">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800/40 rounded-xl flex items-center justify-center">
                <i className="fas fa-bolt text-emerald-600 dark:text-emerald-400 text-lg"></i>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 leading-tight">
                Super Fast Load
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-slate-700 mb-5" />

          {isIOS ? (
            // ── iOS Instructions ──
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                📱 To install on iOS:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>In Safari, tap the</span>
                    <i className="fas fa-share-square text-blue-500 text-base"></i>
                    <span><strong>Share</strong> button</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleMaybeLater}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 text-sm"
                >
                  Later
                </button>
                <button
                  onClick={handleNeverShow}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                >
                  Got It
                </button>
              </div>
            </div>
          ) : (
            // ── Android / Desktop ──
            <div className="space-y-3">
              {/* Equal size buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleMaybeLater}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 text-sm active:scale-95 transition-transform"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm active:scale-95 transition-transform shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5, #0ea5e9)' }}
                >
                  <i className="fas fa-download text-sm"></i>
                  Install App
                </button>
              </div>

              {/* Never show again — subtle link */}
              <button
                onClick={handleNeverShow}
                className="w-full text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 py-1 transition-colors"
              >
                Don't show again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

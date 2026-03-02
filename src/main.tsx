import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

// ── PWA: Capture install prompt BEFORE React mounts ──────────────────────────
// This ensures the event is never missed even if component mounts late
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Store it globally so InstallPWA component can access it anytime
    (window as any).__pwaInstallPrompt = e;
    // Dispatch custom event so InstallPWA component can react
    window.dispatchEvent(new CustomEvent('pwaInstallPromptReady'));
  });
}

// ── Service Worker Registration ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

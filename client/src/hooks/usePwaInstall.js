/**
 * Custom React hook for PWA installation prompt.
 * Enables one-tap app installation on Android, Windows, macOS, and iOS Safari.
 */

import { useState, useEffect } from 'react';

let deferredPrompt = null;

export function usePwaInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    }

    function handleAppInstalled() {
      deferredPrompt = null;
      setIsInstallable(false);
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setIsInstallable(false);
    return outcome === 'accepted';
  }

  return { isInstallable, isInstalled, promptInstall };
}

export default usePwaInstall;

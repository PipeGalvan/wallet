import { useEffect, useState, useCallback } from 'react';

/**
 * Detecta si la PWA puede instalarse en el dispositivo actual y expone una
 * API unificada para guiar al usuario. Comportamiento por plataforma:
 *
 * - Android Chrome/Edge + Desktop Chrome/Edge: el browser dispara
 *   `beforeinstallprompt`, lo interceptamos y dejamos que el frontend
 *   dispare el prompt nativo cuando quiera (botón "Instalar app").
 * - iOS Safari: NO soporta `beforeinstallprompt`. La única vía es manual
 *   (Share → Agregar a inicio). Expone `platform === 'ios-safari'` para
 *   que la UI muestre instrucciones paso a paso en vez del botón nativo.
 * - Desktop Safari/Firefox: no soportan instalación PWA estándar.
 *
 * El dismiss persiste 30 días en localStorage (no spamear al usuario).
 */

type Platform = 'android-chrome' | 'ios-safari' | 'desktop' | 'other';

const DISMISS_KEY = 'wallet-install-dismissed';
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  // iOS Chrome still uses WebKit under the hood and lacks beforeinstallprompt
  // — treat it like iOS Safari.
  const isChromeOrEdge = /Chrome|CriOS|Edg/i.test(ua);

  if (isIOS) return 'ios-safari';
  if (isAndroid && isChromeOrEdge) return 'android-chrome';
  if (!isIOS && !isAndroid && isChromeOrEdge) return 'desktop';
  return 'other';
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari fallback (no standard display-mode support).
    (window.navigator as any).standalone === true
  );
}

function isDismissedRecently(): boolean {
  try {
    const ts = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (!ts) return false;
    return Date.now() - ts < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [platform] = useState<Platform>(detectPlatform);
  const [isInstalled] = useState<boolean>(isStandaloneMode);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(isDismissedRecently);

  useEffect(() => {
    if (isInstalled) return;

    const handler = (e: Event) => {
      // Prevent Chrome's default mini-infobar — we want our own banner.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isInstalled]);

  const promptInstall = useCallback<
    () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  >(async () => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage may be unavailable (private mode) — silently ignore.
    }
    setDismissed(true);
  }, []);

  // canInstall: visible if not installed, not dismissed, and either we have a
  // native prompt to fire OR we're on iOS Safari (where we show instructions).
  const canInstall =
    !isInstalled &&
    !dismissed &&
    (!!deferredPrompt || platform === 'ios-safari');

  return {
    platform,
    isInstalled,
    dismissed,
    canInstall,
    hasNativePrompt: !!deferredPrompt,
    promptInstall,
    dismiss,
  };
}

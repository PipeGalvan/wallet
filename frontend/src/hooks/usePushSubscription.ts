import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { pushApi } from '../api/push';

type Permission = 'default' | 'granted' | 'denied';

/**
 * Converts a base64url VAPID public key into the Uint8Array the PushManager
 * expects as `applicationServerKey`.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function supportsPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Orchestrates the push opt-in/out lifecycle.
 *
 * - Never re-prompts when the user has explicitly denied permission.
 * - Derives `subscribed` from the browser's existing PushSubscription.
 * - Posts the subscription to the backend, keyed by the JWT tenant.
 */
export function usePushSubscription() {
  const [permission, setPermission] = useState<Permission>(
    supportsPush() ? Notification.permission : 'default',
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync local state with the browser's current permission + subscription.
  const refreshState = useCallback(async () => {
    if (!supportsPush()) return;
    setPermission(Notification.permission);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setSubscribed(!!existing);
    } catch {
      setSubscribed(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const subscribe = useCallback(async () => {
    if (!supportsPush()) {
      toast.error('Tu navegador no soporta notificaciones push');
      return;
    }

    // Hard rule: never re-prompt an explicit denial.
    if (Notification.permission === 'denied') {
      toast.error('Las notificaciones están bloqueadas. Habilitá los permisos en el navegador.');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch the VAPID public key (public endpoint, no auth).
      const { data } = await pushApi.getVapidPublicKey();
      const publicKey: string = data?.data?.publicKey ?? data?.publicKey;
      if (!publicKey) {
        toast.error('No se pudo obtener la clave de notificaciones');
        return;
      }

      // 2. Ensure permission (only prompts when 'default').
      if (Notification.permission !== 'granted') {
        const granted = await Notification.requestPermission();
        setPermission(granted);
        if (granted !== 'granted') {
          toast.error('Permiso de notificaciones denegado');
          return;
        }
      }

      // 3. Subscribe via the PushManager.
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast: Uint8Array is a valid BufferSource at runtime; the cast
        // bridges TS 5.7+'s generic typed-array buffer typing vs the DOM API.
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // 4. Persist server-side.
      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
        expirationTime: number | null;
      };
      await pushApi.subscribe({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        expirationTime: subJson.expirationTime ?? undefined,
      });

      setSubscribed(true);
      setPermission('granted');
      toast.success('Notificaciones activadas');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al activar notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const endpoint = existing?.endpoint;

      if (endpoint) {
        await pushApi.unsubscribe(endpoint);
      }
      if (existing) {
        await existing.unsubscribe();
      }

      setSubscribed(false);
      toast.success('Notificaciones desactivadas');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al desactivar notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    refreshState,
  };
}

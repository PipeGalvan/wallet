/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

/*
 * Custom service worker (injectManifest strategy).
 *
 * generateSW was rejected because it cannot register a `notificationclick`
 * handler — required by the spec so a tap deep-links into /recurrentes.
 */

declare const self: ServiceWorkerGlobalScope;

// Injected by vite-plugin-pwa at build time (the precache manifest).
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Default deep-link target; overridable via the push payload's `url`.
  const targetUrl: string = (event.notification.data as { url?: string } | undefined)?.url
    ?? '/recurrentes';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an already-open window on the target route if one exists.
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a fresh window at the target route.
        const opener = self.clients.openWindow;
        return opener ? opener(targetUrl) : undefined;
      }),
  );
});

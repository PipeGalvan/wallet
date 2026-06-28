import api from './client';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number;
}

export const pushApi = {
  subscribe: (payload: PushSubscriptionPayload) =>
    api.post('/push/subscribe', payload),
  // DELETE carries the endpoint in the body so the backend can resolve the
  // row scoped to the calling tenant.
  unsubscribe: (endpoint: string) =>
    api.delete('/push/subscribe', { data: { endpoint } }),
  getVapidPublicKey: () => api.get('/push/vapid-public'),
  // Admin-only: manually fire the daily reminders cron. Returns
  // { sent, pruned, totalSubscriptions }.
  triggerReminders: () => api.post('/push/admin/trigger-reminders'),
};

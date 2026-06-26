/**
 * Shape of the JSON payload delivered to each push notification.
 * The service worker reads this from `event.notification.data` and uses
 * `url` as the deep-link target on notificationclick.
 */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Builds the daily reminder payload for a given pending-count.
 *
 * Pure function: deterministic, no side effects — trivially testable.
 */
export const buildReminderPayload = (count: number): PushPayload => ({
  title: 'Wallet',
  body: `Tenés ${count} recurrentes pendientes`,
  url: '/recurrentes',
});

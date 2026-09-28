import { subDays, subHours, subMinutes } from 'date-fns'

/**
 * Reference "now" for the demo dataset: the moment the app loads. Every mock
 * date is expressed relative to it, so the data always looks current — today's
 * sales, this month's revenue and recent activity never go stale.
 *
 * Seeded data is persisted, so an existing browser keeps its snapshot until the
 * data version is bumped or the demo is reset (Settings → Data).
 */
export const NOW = new Date()

export function ago({ days = 0, hours = 0, minutes = 0 }: { days?: number; hours?: number; minutes?: number }): string {
  return subMinutes(subHours(subDays(NOW, days), hours), minutes).toISOString()
}

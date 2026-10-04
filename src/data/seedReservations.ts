import { Reservation, TableGroup, WaitlistItem } from '../types';

/**
 * Clean production seed: Starts with 0 fake reservations.
 * All real bookings are loaded dynamically from Supabase PostgreSQL.
 */
export function getInitialSeedData(): {
  reservations: Reservation[];
  tableGroups: TableGroup[];
  waitlist: WaitlistItem[];
} {
  return {
    reservations: [],
    tableGroups: [],
    waitlist: [],
  };
}

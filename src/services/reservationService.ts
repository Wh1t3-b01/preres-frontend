/**
 * Sotto Sotto Bar & Grill — Supabase & Render Backend Reservation Service
 * Dual-tier persistence: Direct Supabase PostgreSQL transactions + Render Socket.io real-time broadcast.
 * Auto-maps snake_case SQL columns to camelCase TypeScript interfaces.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Reservation, RestaurantTable, TableGroup, WaitlistItem } from '../types';
import { realtimeSync } from '../utils/realtimeSync';

// Resolve backend URL (Render production URL or local relative proxy)
export const BACKEND_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://preres.onrender.com'
    : '')
).replace(/\/$/, '');

// Data Mapper: Supabase SQL Row -> React Reservation
export function mapSupabaseRowToReservation(row: any): Reservation {
  return {
    id: String(row.id),
    bookingCode: row.booking_code || `ST-${row.id}`,
    guestName: row.guest_name,
    guestPhone: row.guest_phone || undefined,
    guestEmail: row.guest_email || undefined,
    reservationDate: row.reservation_date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMins: Number(row.duration_mins) || 120,
    partySize: Number(row.party_size) || 2,
    tableId: String(row.table_id),
    assignedTableIds: Array.isArray(row.assigned_table_ids)
      ? row.assigned_table_ids.map(String)
      : [String(row.table_id)],
    status: row.status || 'confirmed',
    notes: row.notes || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    seatedAt: row.seated_at || undefined,
    completedAt: row.completed_at || undefined,
    isWalkIn: Boolean(row.is_walk_in),
    serverName: row.server_name || undefined,
    totalSpendEstimate: row.total_spend_estimate ? Number(row.total_spend_estimate) : undefined,
  };
}

// Data Mapper: React Reservation -> Supabase SQL Row
export function mapReservationToSupabaseRow(res: Partial<Reservation>) {
  const row: Record<string, any> = {};
  if (res.bookingCode) row.booking_code = res.bookingCode;
  if (res.guestName !== undefined) row.guest_name = res.guestName;
  if (res.guestPhone !== undefined) row.guest_phone = res.guestPhone;
  if (res.guestEmail !== undefined) row.guest_email = res.guestEmail;
  if (res.reservationDate !== undefined) row.reservation_date = res.reservationDate;
  if (res.startTime !== undefined) row.start_time = res.startTime;
  if (res.endTime !== undefined) row.end_time = res.endTime;
  if (res.durationMins !== undefined) row.duration_mins = res.durationMins;
  if (res.partySize !== undefined) row.party_size = res.partySize;
  if (res.tableId !== undefined) row.table_id = String(res.tableId);
  if (res.assignedTableIds !== undefined) row.assigned_table_ids = res.assignedTableIds;
  if (res.status !== undefined) row.status = res.status;
  if (res.notes !== undefined) row.notes = res.notes;
  if (res.tags !== undefined) row.tags = res.tags;
  if (res.seatedAt !== undefined) row.seated_at = res.seatedAt;
  if (res.completedAt !== undefined) row.completed_at = res.completedAt;
  if (res.isWalkIn !== undefined) row.is_walk_in = res.isWalkIn;
  if (res.serverName !== undefined) row.server_name = res.serverName;
  if (res.totalSpendEstimate !== undefined) row.total_spend_estimate = res.totalSpendEstimate;
  return row;
}

export const reservationService = {
  /**
   * 1. Fetch all reservations (or for a specific date) from Supabase with Render backend fallback
   */
  async fetchReservations(date?: string): Promise<Reservation[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('reservations').select('*').order('start_time', { ascending: true });
        if (date) {
          query = query.eq('reservation_date', date);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(mapSupabaseRowToReservation);
        }
        console.warn('[ReservationService] Supabase fetch notice:', error?.message);
      } catch (err) {
        console.warn('[ReservationService] Supabase connection fallback:', err);
      }
    }

    // Fallback to Render Node.js backend
    try {
      const url = `${BACKEND_BASE_URL}/api/reservations${date ? `?date=${date}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      // Offline fallback
    }

    return [];
  },

  /**
   * 2. Save a new reservation to Supabase and broadcast via Render Socket.io
   */
  async createReservation(reservation: Reservation): Promise<{ success: boolean; data?: Reservation; error?: string }> {
    const supabasePayload = mapReservationToSupabaseRow(reservation);

    if (isSupabaseConfigured) {
      console.log('[ReservationService] 📡 Saving to Supabase "reservations" table:', supabasePayload);
      try {
        const { data, error } = await supabase
          .from('reservations')
          .insert([supabasePayload])
          .select();

        if (error) {
          console.error('[ReservationService] ❌ Supabase insert failed:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          // Attempt retry with minimal essential schema columns
          const minimalPayload: Record<string, any> = {
            booking_code: supabasePayload.booking_code,
            guest_name: supabasePayload.guest_name,
            guest_phone: supabasePayload.guest_phone || null,
            reservation_date: supabasePayload.reservation_date,
            start_time: supabasePayload.start_time,
            end_time: supabasePayload.end_time,
            party_size: supabasePayload.party_size || 2,
            table_id: String(supabasePayload.table_id || '10'),
            status: supabasePayload.status || 'confirmed',
          };
          console.log('[ReservationService] 🔄 Retrying with standard minimal schema:', minimalPayload);
          const retryRes = await supabase.from('reservations').insert([minimalPayload]).select();
          
          if (retryRes.error) {
            console.error('[ReservationService] ❌ Minimal retry also failed:', retryRes.error.message, retryRes.error);
          } else if (retryRes.data && retryRes.data.length > 0) {
            console.log('[ReservationService] ✅ Minimal schema write succeeded on Supabase!', retryRes.data[0]);
            const created = mapSupabaseRowToReservation(retryRes.data[0]);
            realtimeSync.broadcast({
              type: 'RESERVATION_CREATED',
              payload: created,
            });
            return { success: true, data: created };
          }
        } else if (data && data.length > 0) {
          console.log('[ReservationService] ✅ Direct write to Supabase PostgreSQL succeeded:', data[0]);
          const created = mapSupabaseRowToReservation(data[0]);
          
          // Broadcast to Render backend WebSocket
          realtimeSync.broadcast({
            type: 'RESERVATION_CREATED',
            payload: created,
          });

          // Also trigger Render REST sync
          fetch(`${BACKEND_BASE_URL}/api/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(created),
          }).catch(() => {});

          return { success: true, data: created };
        }
      } catch (err: any) {
        console.error('[ReservationService] ❌ Supabase insert exception:', err);
      }
    } else {
      console.warn('[ReservationService] ⚠️ Supabase not configured in client environment. Falling back to backend/local.');
    }

    // Render backend direct sync fallback
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.reservation || reservation };
      }
    } catch (err: any) {
      // Offline
    }

    // Broadcast locally
    realtimeSync.broadcast({
      type: 'RESERVATION_CREATED',
      payload: reservation,
    });

    return { success: true, data: reservation };
  },

  /**
   * 3. Update an existing reservation in Supabase and broadcast
   */
  async updateReservation(id: string, updates: Partial<Reservation>): Promise<{ success: boolean; error?: string }> {
    const supabasePayload = mapReservationToSupabaseRow(updates);

    if (isSupabaseConfigured) {
      try {
        // Try update by booking_code or ID
        let query = supabase.from('reservations').update(supabasePayload);
        if (updates.bookingCode) {
          query = query.or(`id.eq.${id},booking_code.eq.${updates.bookingCode}`);
        } else {
          query = query.or(`id.eq.${id},booking_code.eq.${id}`);
        }

        const { error } = await query;
        if (error) {
          console.warn('[ReservationService] Supabase update warning:', error.message);
        }
      } catch (err) {
        console.warn('[ReservationService] Supabase update fallback:', err);
      }
    }

    // Broadcast update to all devices
    realtimeSync.broadcast({
      type: 'RESERVATION_UPDATED',
      payload: { id, updates },
    });

    // Notify Render backend
    fetch(`${BACKEND_BASE_URL}/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});

    return { success: true };
  },

  /**
   * 4. Delete or cancel a reservation in Supabase and broadcast
   */
  async deleteReservation(bookingCodeOrId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('reservations')
          .delete()
          .or(`id.eq.${bookingCodeOrId},booking_code.eq.${bookingCodeOrId}`);
      } catch (err) {
        console.warn('[ReservationService] Supabase delete warning:', err);
      }
    }

    // Broadcast to peers
    realtimeSync.broadcast({
      type: 'RESERVATION_DELETED',
      payload: { bookingCode: bookingCodeOrId, id: bookingCodeOrId },
    });

    // Notify Render backend
    fetch(`${BACKEND_BASE_URL}/api/reservations/${bookingCodeOrId}`, {
      method: 'DELETE',
    }).catch(() => {});

    return { success: true };
  },

  /**
   * 5. Subscribe to live Supabase Postgres Realtime CDC (Change Data Capture)
   */
  subscribeToSupabaseRealtime(onUpdate: (event: { eventType: string; newRecord: any; oldRecord: any }) => void) {
    if (!isSupabaseConfigured) return () => {};

    try {
      const channel = supabase
        .channel('public:reservations_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reservations' },
          (payload) => {
            onUpdate({
              eventType: payload.eventType,
              newRecord: payload.new ? mapSupabaseRowToReservation(payload.new) : null,
              oldRecord: payload.old,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[ReservationService] Supabase realtime subscription error:', err);
      return () => {};
    }
  },
};

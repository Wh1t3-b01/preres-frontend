/**
 * Sotto Sotto Bar & Grill — Enterprise Multi-Device Real-Time Sync Engine
 * Combines Socket.io (WebSocket bi-directional network sync) + HTML5 BroadcastChannel (Zero-latency tab sync).
 * 
 * Guarantees zero-refresh real-time parity across Host Stands, Floor Tablets, and Admin Screens.
 */

import { io, Socket } from 'socket.io-client';

const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://preres.onrender.com'
    : '')
).replace(/\/$/, '');

export type RealtimeEvent =
  | { type: 'RESERVATION_CREATED'; payload: any }
  | { type: 'RESERVATION_UPDATED'; payload: any }
  | { type: 'RESERVATION_DELETED'; payload: { bookingCode: string; id?: string } }
  | { type: 'TABLES_UPDATED'; payload: any }
  | { type: 'TABLE_COORDINATES_MOVED'; payload: { tableId: string; x: number; y: number } }
  | { type: 'TABLE_MERGED'; payload: any }
  | { type: 'TABLE_UNMERGED'; payload: { groupId: string } }
  | { type: 'WAITLIST_UPDATED'; payload: any }
  | { type: 'DATABASE_RESET' }
  | { type: 'PRESENCE_COUNT'; payload: { count: number } };

class RealtimeSyncManager {
  private socket: Socket | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: RealtimeEvent) => void)[] = [];
  public isConnected: boolean = false;
  public peerCount: number = 1;

  constructor() {
    this.initSocket();
    this.initBroadcastChannel();
    this.initStorageFallback();
  }

  private initSocket() {
    if (typeof window === 'undefined') return;

    try {
      this.socket = io(BACKEND_URL || undefined, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[RealTime Engine] Connected to live WebSocket server. Socket ID:', this.socket?.id);
        this.notifyListeners({ type: 'PRESENCE_COUNT', payload: { count: this.peerCount } });

        // Silent State Reconciliation upon reconnect
        fetch(`${BACKEND_URL}/api/state`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              if (Array.isArray(data.data.reservations) && data.data.reservations.length > 0) {
                this.notifyListeners({ type: 'RESERVATION_UPDATED', payload: data.data.reservations });
              }
              if (Array.isArray(data.data.tables) && data.data.tables.length > 0) {
                this.notifyListeners({ type: 'TABLES_UPDATED', payload: data.data.tables });
              }
            }
          })
          .catch((err) => console.warn('[RealTime Engine] Silent state sync notice:', err));
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.warn('[RealTime Engine] Disconnected from live server:', reason);
      });

      this.socket.on('presenceUpdate', (data: { connectedCount: number }) => {
        this.peerCount = Math.max(1, data.connectedCount);
        this.notifyListeners({ type: 'PRESENCE_COUNT', payload: { count: this.peerCount } });
      });

      // 1. Channel: reservationUpdate
      this.socket.on('reservationUpdate', (data: any) => {
        if (data.action === 'create') {
          this.notifyListeners({ type: 'RESERVATION_CREATED', payload: data.reservation });
        } else if (data.action === 'update' || data.action === 'reschedule') {
          this.notifyListeners({ type: 'RESERVATION_UPDATED', payload: data });
        } else if (data.action === 'delete') {
          this.notifyListeners({ type: 'RESERVATION_DELETED', payload: { bookingCode: data.bookingCode || data.id, id: data.id } });
        }
      });

      this.socket.on('reservationRescheduled', (data: any) => {
        if (data.reservation) {
          this.notifyListeners({
            type: 'RESERVATION_UPDATED',
            payload: { action: 'update', id: data.reservation.id, updates: data.reservation },
          });
        }
      });

      // 2. Channel: roomLayoutUpdate
      this.socket.on('roomLayoutUpdate', (data: any) => {
        if (data.action === 'merge') {
          this.notifyListeners({ type: 'TABLE_MERGED', payload: data.group });
        } else if (data.action === 'unmerge') {
          this.notifyListeners({ type: 'TABLE_UNMERGED', payload: { groupId: data.groupId } });
        } else if (data.action === 'tables') {
          this.notifyListeners({ type: 'TABLES_UPDATED', payload: data.tables });
        }
      });

      // 3. Channel: tableCoordinateUpdate (Live spatial drag-and-drop)
      this.socket.on('tableCoordinateUpdate', (data: { tableId: string; x: number; y: number }) => {
        this.notifyListeners({ type: 'TABLE_COORDINATES_MOVED', payload: data });
      });
    } catch (err) {
      console.warn('[RealTime Engine] Socket.io init warning:', err);
    }
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('sotto_sotto_realtime_sync');
      this.channel.onmessage = (messageEvent) => {
        const event = messageEvent.data as RealtimeEvent;
        this.notifyListeners(event);
      };
    }
  }

  private initStorageFallback() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('sotto_')) {
          this.notifyListeners({ type: 'TABLES_UPDATED', payload: null });
        }
      });
    }
  }

  /**
   * Broadcast an event to both the Socket.io WebSocket server (cross-device)
   * and the local HTML5 BroadcastChannel (cross-tab).
   */
  public broadcast(event: RealtimeEvent) {
    // 1. Send via local BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('Local broadcast error:', err);
      }
    }

    // 2. Send via Socket.io WebSocket server
    if (this.socket && this.socket.connected) {
      try {
        if (event.type === 'RESERVATION_CREATED' || event.type === 'RESERVATION_UPDATED' || event.type === 'RESERVATION_DELETED') {
          this.socket.emit('client:reservationUpdate', {
            action: event.type === 'RESERVATION_CREATED' ? 'create' : event.type === 'RESERVATION_DELETED' ? 'delete' : 'update',
            payload: (event as any).payload,
          });
        } else if (event.type === 'TABLE_COORDINATES_MOVED') {
          this.socket.emit('client:tableCoordinateUpdate', event.payload);
        } else if (event.type === 'TABLE_MERGED' || event.type === 'TABLE_UNMERGED' || event.type === 'TABLES_UPDATED') {
          this.socket.emit('client:roomLayoutUpdate', {
            action: event.type === 'TABLE_MERGED' ? 'merge' : event.type === 'TABLE_UNMERGED' ? 'unmerge' : 'tables',
            payload: (event as any).payload,
          });
        }
      } catch (err) {
        console.warn('Socket.io emission error:', err);
      }
    }
  }

  /**
   * Sync complete snapshot state with server
   */
  public syncFullState(state: { reservations: any[]; tables: any[]; tableGroups: any[]; waitlist: any[] }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('client:syncState', state);
    }
  }

  public subscribe(listener: (event: RealtimeEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(event: RealtimeEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error notifying realtime listener:', err);
      }
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();

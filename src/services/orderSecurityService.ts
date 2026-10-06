import { WaiterAuditLog } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { realtimeSync } from '../utils/realtimeSync';
import { staffService } from './staffService';

const AUDIT_LOGS_STORAGE_KEY = 'sotto_waiter_audit_logs_db';

export const INITIAL_AUDIT_LOGS: WaiterAuditLog[] = [
  {
    id: 'void_1',
    waiterId: 'staff_marco',
    waiterName: 'Marco Gentili',
    tableId: '20',
    itemId: 'item_wine_1',
    itemName: 'Barolo DOCG Pio Cesare 2018',
    itemPrice: 95,
    quantity: 1,
    reason: 'Bottiglia stappata con difetto di tappo (autorizzato dal Maître)',
    totalBefore: 310,
    totalAfter: 215,
    waiterVoidCount: 1,
    createdAt: '2026-10-04T20:45:00Z',
    managerApprovedBy: 'Direzione / Maître',
  },
  {
    id: 'void_2',
    waiterId: 'staff_simone',
    waiterName: 'Simone Rinaldi',
    tableId: 'G',
    itemId: 'item_steak_2',
    itemName: 'Filetto di Manzo al Barolo',
    itemPrice: 42,
    quantity: 1,
    reason: 'Cliente ha cambiato idea su richiesta di cottura prima dell\'avvio linea',
    totalBefore: 185,
    totalAfter: 143,
    waiterVoidCount: 1,
    createdAt: '2026-10-05T09:15:00Z',
    managerApprovedBy: 'Manager Turno',
  },
];

export const orderSecurityService = {
  getAuditLogs(): WaiterAuditLog[] {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse waiter audit logs', e);
      }
    }
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  },

  saveAuditLogs(logs: WaiterAuditLog[]): void {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs));
  },

  getWaiterVoidCount(waiterId: string): number {
    const logs = this.getAuditLogs();
    return logs.filter((l) => l.waiterId === waiterId).length;
  },

  async logAuthorizedVoid(data: {
    waiterId: string;
    waiterName: string;
    tableId: string;
    orderId?: string;
    itemId: string;
    itemName: string;
    itemPrice: number;
    quantity: number;
    reason: string;
    totalBefore: number;
    managerApprovedBy?: string;
  }): Promise<{ success: boolean; auditLog: WaiterAuditLog }> {
    const logs = this.getAuditLogs();
    const currentWaiterCount = this.getWaiterVoidCount(data.waiterId) + 1;
    const totalAfter = Math.max(0, data.totalBefore - data.itemPrice * data.quantity);

    const newLog: WaiterAuditLog = {
      id: `void_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      waiterId: data.waiterId,
      waiterName: data.waiterName,
      tableId: data.tableId,
      orderId: data.orderId,
      itemId: data.itemId,
      itemName: data.itemName,
      itemPrice: data.itemPrice,
      quantity: data.quantity,
      reason: data.reason.trim(),
      totalBefore: data.totalBefore,
      totalAfter,
      waiterVoidCount: currentWaiterCount,
      createdAt: new Date().toISOString(),
      managerApprovedBy: data.managerApprovedBy || 'Manager di Servizio',
    };

    logs.unshift(newLog);
    this.saveAuditLogs(logs);

    // Update waiter stats in staffService
    const staffMembers = staffService.getStaffMembers();
    const targetStaff = staffMembers.find((s) => s.id === data.waiterId);
    if (targetStaff) {
      if (!targetStaff.stats) {
        targetStaff.stats = { tablesServedCount: 0, totalRevenueGenerated: 0, voidCount: 0 };
      }
      targetStaff.stats.voidCount = currentWaiterCount;
      staffService.saveStaffMembers(staffMembers);
    }

    // Persist to Supabase if available
    if (isSupabaseConfigured) {
      try {
        await supabase.from('waiter_audit_logs').insert({
          id: newLog.id,
          waiter_id: newLog.waiterId,
          waiter_name: newLog.waiterName,
          table_id: newLog.tableId,
          order_id: newLog.orderId,
          item_id: newLog.itemId,
          item_name: newLog.itemName,
          item_price: newLog.itemPrice,
          quantity: newLog.quantity,
          reason: newLog.reason,
          total_before: newLog.totalBefore,
          total_after: newLog.totalAfter,
          waiter_void_count: newLog.waiterVoidCount,
          manager_approved_by: newLog.managerApprovedBy,
        });
      } catch (err) {
        console.warn('[Supabase Audit] Failed to persist void remotely:', err);
      }
    }

    // Broadcast Real-Time Alert to Manager Dashboard
    realtimeSync.broadcast({
      type: 'WAITER_VOID_ALERT',
      payload: newLog,
    });

    return { success: true, auditLog: newLog };
  },
};

import React, { useState, useEffect } from 'react';
import { WaiterAuditLog } from '../../types';
import { realtimeSync } from '../../utils/realtimeSync';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ShieldAlert, X, ArrowRight, BellRing } from 'lucide-react';

interface ManagerVoidAlertBannerProps {
  onOpenAuditLogs?: () => void;
}

export const ManagerVoidAlertBanner: React.FC<ManagerVoidAlertBannerProps> = ({
  onOpenAuditLogs,
}) => {
  const [activeAlert, setActiveAlert] = useState<WaiterAuditLog | null>(null);

  useEffect(() => {
    // 1. Cross-tab and WebSocket real-time subscription
    const unsubscribe = realtimeSync.subscribe((event) => {
      if (event.type === 'WAITER_VOID_ALERT' && event.payload) {
        setActiveAlert(event.payload);
      }
    });

    // 2. Direct Supabase Postgres Realtime replication listener
    let supabaseChannel: any = null;
    if (isSupabaseConfigured) {
      try {
        supabaseChannel = supabase
          .channel('manager-void-audit-channel')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'waiter_audit_logs' },
            (payload: any) => {
              const row = payload.new;
              if (row) {
                setActiveAlert({
                  id: row.id,
                  waiterId: row.waiter_id,
                  waiterName: row.waiter_name,
                  tableId: row.table_id,
                  orderId: row.order_id,
                  itemId: row.item_id,
                  itemName: row.item_name,
                  itemPrice: Number(row.item_price),
                  quantity: Number(row.quantity),
                  reason: row.reason,
                  totalBefore: Number(row.total_before),
                  totalAfter: Number(row.total_after),
                  waiterVoidCount: Number(row.waiter_void_count),
                  createdAt: row.created_at,
                  managerApprovedBy: row.manager_approved_by,
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('[Supabase Realtime] Could not subscribe to waiter_audit_logs:', err);
      }
    }

    return () => {
      unsubscribe();
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-200">
      <div className="bg-[#121622] border-2 border-rose-600 rounded-3xl p-4 shadow-[0_0_25px_rgba(225,29,72,0.35)] text-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center animate-pulse">
              <BellRing className="w-4 h-4 stroke-[2]" />
            </span>
            <div>
              <h4 className="font-bold text-xs text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Storno Comanda Post-Send</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-rose-900/60 text-white font-mono">
                  #{activeAlert.waiterVoidCount}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Operatore: <strong className="text-white">{activeAlert.waiterName}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2.5 bg-[#171D2B] rounded-xl border border-[#273248] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white">{activeAlert.itemName}</span>
            <span className="font-mono text-rose-400 font-bold">
              -€{activeAlert.itemPrice * activeAlert.quantity}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tavolo {activeAlert.tableId}</span>
            <span>Conto: €{activeAlert.totalBefore} ➔ €{activeAlert.totalAfter}</span>
          </div>
          <p className="text-[11px] text-slate-300 italic pt-1 border-t border-[#222A3C]">
            "{activeAlert.reason}"
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(activeAlert.createdAt).toLocaleTimeString('it-IT')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveAlert(null)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1"
            >
              Ignora
            </button>
            {onOpenAuditLogs && (
              <button
                onClick={() => {
                  onOpenAuditLogs();
                  setActiveAlert(null);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Registro Storni</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

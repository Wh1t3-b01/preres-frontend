import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCourseStage } from '../../types';
import {
  Utensils,
  Wine,
  Salad,
  Pizza,
  Cake,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Smartphone,
  Check,
} from 'lucide-react';

const COURSE_STAGES: {
  id: TableCourseStage;
  label: string;
  shortLabel: string;
  icon: string;
}[] = [
  { id: 'seated', label: '1. Seduti', shortLabel: 'Seduti', icon: '🪑' },
  { id: 'drinks', label: '2. Drink & Aperitivo', shortLabel: 'Drink', icon: '🍸' },
  { id: 'appetizers', label: '3. Antipasti', shortLabel: 'Antipasti', icon: '🥗' },
  { id: 'mains', label: '4. Portate Principali', shortLabel: 'Portate', icon: '🥩' },
  { id: 'dessert', label: '5. Dolci & Caffè', shortLabel: 'Dolci', icon: '🍰' },
  { id: 'bill_requested', label: '6. Conto Richiesto', shortLabel: 'Conto 💳', icon: '💳' },
  { id: 'clearing', label: '7. Riassetto Tavolo', shortLabel: 'Libera', icon: '🧹' },
];

export const WaiterTouchView: React.FC = () => {
  const {
    tables,
    reservations,
    selectedDate,
    setTableCourseStage,
    setTableAssistance,
    freeTable,
  } = useRestaurant();

  // Find all tables with active reservations
  const activeReservations = reservations.filter(
    (r) => r.reservationDate === selectedDate && r.status === 'seated'
  );

  return (
    <div className="space-y-6 max-w-[1780px] mx-auto pb-16 text-slate-100">
      
      {/* Header */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-white">
              PRERES Waiter Touch™ & Avanzamento Portate
            </h2>
            <span className="text-xs bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 font-bold px-2.5 py-0.5 rounded-full font-mono">
              {activeReservations.length} Tavoli Occupati
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interfaccia touch-first ad alta reattività per aggiornare lo stato di sala e cucina in 1 tap.
          </p>
        </div>
      </div>

      {/* Grid of Active Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {tables.map((table) => {
          const res = activeReservations.find(
            (r) =>
              r.tableId === table.id ||
              (r.assignedTableIds && r.assignedTableIds.includes(table.id))
          );

          const currentStage = table.courseStage || 'seated';

          return (
            <div
              key={table.id}
              className={`rounded-3xl p-5 border transition-all shadow-sm flex flex-col justify-between gap-4 ${
                res
                  ? table.needsAssistance
                    ? 'bg-rose-950/30 border-rose-500/80 shadow-[0_0_20px_rgba(225,29,72,0.25)] ring-1 ring-rose-500/50'
                    : 'bg-[#121622] border-[#273248] hover:border-[#8B31E0]/60'
                  : 'bg-[#0E121B]/80 border-[#222A3C] opacity-50'
              }`}
            >
              {/* Top Bar */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[#171D2B] text-[#C084FC] border border-[#2E3B54] font-bold text-sm flex items-center justify-center font-brand">
                      {table.tableNumber}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-white">
                        {res ? res.guestName : `Tavolo ${table.tableNumber}`}
                      </h4>
                      <span className="text-[11px] text-slate-400 uppercase font-mono">
                        {table.zone} · {table.capacityOverride || table.capacity} pax
                      </span>
                    </div>
                  </div>

                  {res ? (
                    <span className="text-xs font-bold font-mono bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 px-2.5 py-0.5 rounded-full">
                      {res.partySize} px · Seduti
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">Libero</span>
                  )}
                </div>

                {res?.notes && (
                  <div className="mt-2.5 p-2 bg-[#171D2B] rounded-xl border border-[#273248] text-[11px] text-slate-300">
                    <strong className="text-amber-300">Note:</strong> {res.notes}
                  </div>
                )}
              </div>

              {/* Course Stage Step Buttons */}
              {res ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Avanzamento Portata / Stato:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {COURSE_STAGES.map((stage) => {
                      const isCurrent = currentStage === stage.id;
                      const isBill = stage.id === 'bill_requested';
                      const isClearing = stage.id === 'clearing';

                      return (
                        <button
                          key={stage.id}
                          onClick={() => setTableCourseStage(table.id, stage.id)}
                          className={`p-2 rounded-xl text-left text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            isCurrent
                              ? isBill
                                ? 'bg-amber-500 text-slate-950 font-bold border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                : isClearing
                                ? 'bg-[#059669] text-white font-bold border border-[#059669]'
                                : 'bg-[#8B31E0] text-white shadow-md border border-[#A855F7]/40 ring-1 ring-[#A855F7]/30'
                              : 'bg-[#171D2B] text-slate-300 border border-[#273248] hover:bg-[#20273A] hover:text-white'
                          }`}
                        >
                          <span className="text-sm">{stage.icon}</span>
                          <span className="truncate">{stage.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Assistance Alert & Quick Free Table */}
                  <div className="pt-2 border-t border-[#222A3C] flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        setTableAssistance(
                          table.id,
                          !table.needsAssistance,
                          table.needsAssistance ? undefined : 'Richiesta posate/vino extra'
                        )
                      }
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        table.needsAssistance
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-[#171D2B] hover:bg-[#20273A] text-slate-300 border border-[#273248]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>{table.needsAssistance ? 'Aiuto ATTIVO' : 'Chiama Aiuto'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Confermi di liberare e completare il tavolo ${table.tableNumber}?`)) {
                          freeTable(table.id);
                        }
                      }}
                      className="py-1.5 px-3.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Libera</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 italic">
                  Tavolo attualmente disponibile.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

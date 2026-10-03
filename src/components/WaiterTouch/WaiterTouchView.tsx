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
} from 'lucide-react';

const COURSE_STAGES: {
  id: TableCourseStage;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
}[] = [
  { id: 'seated', label: '1. Seduti', shortLabel: 'Seduti', icon: '🪑', color: 'bg-stone-100 text-stone-800' },
  { id: 'drinks', label: '2. Drink & Aperitivo', shortLabel: 'Drink', icon: '🍸', color: 'bg-indigo-100 text-indigo-900' },
  { id: 'appetizers', label: '3. Antipasti', shortLabel: 'Antipasti', icon: '🥗', color: 'bg-emerald-100 text-emerald-900' },
  { id: 'mains', label: '4. Portate Principali', shortLabel: 'Primi/Secondi', icon: '🍝', color: 'bg-amber-100 text-amber-900' },
  { id: 'dessert', label: '5. Dolci & Caffè', shortLabel: 'Dolci', icon: '🍰', color: 'bg-purple-100 text-purple-900' },
  { id: 'bill_requested', label: '6. Conto Richiesto', shortLabel: 'Conto 💳', icon: '💳', color: 'bg-rose-100 text-rose-900 font-bold animate-pulse' },
  { id: 'clearing', label: '7. Sparecchiamento', shortLabel: 'Sparecchia', icon: '🧹', color: 'bg-teal-100 text-teal-900' },
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
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-[#1E3A2F]">
              Terminale Touch Cameriere & Avanzamento Portate
            </h2>
            <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded-full font-mono-num">
              {activeReservations.length} Tavoli Occupati
            </span>
          </div>
          <p className="text-xs text-[#1E3A2F]/70 mt-1">
            Interfaccia touch-first rapida per aggiornare lo stato dei piatti in tempo reale per sala e cucina
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
              className={`rounded-3xl p-5 border-2 transition-all shadow-xs flex flex-col justify-between gap-4 ${
                res
                  ? table.needsAssistance
                    ? 'bg-rose-50/90 border-rose-500 shadow-md ring-2 ring-rose-400'
                    : 'bg-white border-[#1E3A2F]/20 hover:border-[#6B3FA0]'
                  : 'bg-stone-50/60 border-stone-200 opacity-60'
              }`}
            >
              {/* Top Bar */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-amber-100 font-bold text-sm flex items-center justify-center font-brand">
                      {table.tableNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#1E3A2F]">
                        {res ? res.guestName : `Tavolo ${table.tableNumber}`}
                      </h4>
                      <span className="text-[11px] text-stone-500">
                        {table.zone.toUpperCase()} · {table.capacityOverride || table.capacity} persone
                      </span>
                    </div>
                  </div>

                  {res ? (
                    <span className="text-xs font-bold font-mono-num bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                      {res.partySize} px · Seduti
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-stone-400">Libero</span>
                  )}
                </div>

                {res?.notes && (
                  <div className="mt-2.5 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                    <strong>Note:</strong> {res.notes}
                  </div>
                )}
              </div>

              {/* Course Stage Step Buttons */}
              {res ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Seleziona Portata / Stato Tavolo:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {COURSE_STAGES.map((stage) => {
                      const isCurrent = currentStage === stage.id;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => setTableCourseStage(table.id, stage.id)}
                          className={`p-2 rounded-xl text-left text-xs font-semibold transition flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-[#1E3A2F] text-amber-100 shadow-xs ring-2 ring-[#1E3A2F]'
                              : 'bg-[#FBF8F2] text-[#1E3A2F] border border-[#1E3A2F]/10 hover:bg-[#1E3A2F]/5'
                          }`}
                        >
                          <span className="text-sm">{stage.icon}</span>
                          <span className="truncate">{stage.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Assistance Alert & Quick Free Table */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        setTableAssistance(
                          table.id,
                          !table.needsAssistance,
                          table.needsAssistance ? undefined : 'Richiesta posate/vino extra'
                        )
                      }
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        table.needsAssistance
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{table.needsAssistance ? 'Chiama Aiuto ATTIVA' : 'Chiama Aiuto'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Confermi di liberare e completare il tavolo ${table.tableNumber}?`)) {
                          freeTable(table.id);
                        }
                      }}
                      className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Libera</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-stone-400 italic">
                  Tavolo attualmente non occupato.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

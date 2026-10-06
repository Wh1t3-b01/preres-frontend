import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCourseStage, RestaurantTable, Reservation } from '../../types';
import { guestCrmService } from '../../services/guestCrmService';
import { SeatOrderModal } from './SeatOrderModal';
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
  FileText,
  UserCheck,
  ShieldAlert,
  Flame,
  User,
  Coffee,
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
    updateReservation,
  } = useRestaurant();

  // Simulated active waiter profile and punch-in time
  const [currentWaiter, setCurrentWaiter] = useState({
    name: 'Simone',
    role: 'Cameriere di Sala (Main A & VIP)',
    punchInTime: '11:45',
  });

  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'all' | 'main_a' | 'main_b' | 'bar' | 'private'>('all');

  // Selected table for Seat-by-Seat Comanda POS
  const [activeComandaTable, setActiveComandaTable] = useState<{
    table: RestaurantTable;
    reservation?: Reservation;
  } | null>(null);

  // Find all tables with active reservations
  const activeReservations = reservations.filter(
    (r) => r.reservationDate === selectedDate && r.status === 'seated'
  );

  const filteredTables = tables.filter((t) => {
    if (selectedZoneFilter === 'all') return true;
    return t.zone === selectedZoneFilter;
  });

  return (
    <div className="space-y-6 max-w-[1780px] mx-auto pb-16 text-slate-100">
      {/* HEADER & SERVER PUNCH-IN INDICATOR */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-brand font-bold text-white">
              PRERES Waiter Touch™ · Presa Comande Commensali
            </h2>
            <span className="text-xs bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 font-bold px-2.5 py-0.5 rounded-full font-mono">
              {activeReservations.length} Tavoli Seduti
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestione comande per commensale (Posizione 1, Posizione 2), cotture obbligatorie, contorni e avanzamento portate.
          </p>
        </div>

        {/* Waiter Punch-in Badge */}
        <div className="flex items-center gap-3 bg-[#121622] border border-[#273248] px-3.5 py-2 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-[#8B31E0]/20 text-[#C084FC] flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-white block">Cameriere: {currentWaiter.name}</span>
            <span className="text-[10px] text-[#34D399] font-mono">
              ⚡ Punch-in attivo ore {currentWaiter.punchInTime}
            </span>
          </div>
        </div>
      </div>

      {/* ZONE SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: 'all', label: 'Tutti i Tavoli' },
            { id: 'main_a', label: 'Main A (Ovest & VIP G)' },
            { id: 'main_b', label: 'Main B (Est)' },
            { id: 'bar', label: 'Sala Bar' },
            { id: 'private', label: 'Privé Dining' },
          ] as const
        ).map((z) => (
          <button
            key={z.id}
            onClick={() => setSelectedZoneFilter(z.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
              selectedZoneFilter === z.id
                ? 'bg-[#8B31E0] text-white shadow-xs'
                : 'bg-[#121622] text-slate-300 border border-[#242C3E] hover:text-white'
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>

      {/* GRID OF TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTables.map((table) => {
          const res = activeReservations.find(
            (r) =>
              r.tableId === table.id ||
              (r.assignedTableIds && r.assignedTableIds.includes(table.id))
          );

          const currentStage = table.courseStage || 'seated';
          const guestProfile = res ? guestCrmService.getProfileByNameOrPhone(res.guestName, res.guestPhone) : undefined;
          const comandaTotal = res?.totalSpendEstimate || (table.id === 'G' ? 185 : table.id === '21' ? 230 : table.id === '20' ? 110 : 0);

          return (
            <div
              key={table.id}
              className={`rounded-3xl p-5 border transition-all shadow-sm flex flex-col justify-between gap-4 ${
                res
                  ? table.needsAssistance
                    ? 'bg-rose-950/30 border-rose-500/80 shadow-[0_0_20px_rgba(225,29,72,0.25)] ring-1 ring-rose-500/50'
                    : 'bg-[#121622] border-[#273248] hover:border-[#8B31E0]/60'
                  : 'bg-[#0E121B]/80 border-[#222A3C] opacity-60'
              }`}
            >
              {/* Top Bar */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-[#171D2B] text-[#C084FC] border border-[#2E3B54] font-bold text-base flex items-center justify-center font-brand">
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
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 px-2.5 py-0.5 rounded-full block">
                        {res.partySize} px · Seduti
                      </span>
                      <span className="text-[10px] font-mono text-[#C084FC] font-bold mt-1 block">
                        Comanda: € {comandaTotal.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">Libero</span>
                  )}
                </div>

                {/* VIP / ATTENTION ALERTS */}
                {guestProfile?.attentionAlert?.isAttentionRequired && (
                  <div
                    className={`mt-2.5 p-2 rounded-xl text-xs flex items-center gap-1.5 font-semibold ${
                      guestProfile.attentionAlert.alertColor === 'red'
                        ? 'bg-rose-950/40 border border-rose-500/50 text-rose-300 animate-pulse'
                        : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    <span>{guestProfile.attentionAlert.alertColor === 'red' ? '🔴 ATTENZIONE OSPITE:' : '🟢 VIP OSPITE:'}</span>
                    <span className="font-normal">{guestProfile.attentionAlert.reason || 'Trattare con massima accoglienza.'}</span>
                  </div>
                )}

                {/* ALLERGIES */}
                {guestProfile?.dietaryRestrictions && guestProfile.dietaryRestrictions.length > 0 && (
                  <div className="mt-2 p-2 bg-rose-950/20 border border-rose-800/40 rounded-xl text-xs text-rose-300 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">Allergie Segnalate:</span>
                    <div className="flex flex-wrap gap-1">
                      {guestProfile.dietaryRestrictions.map((d, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-rose-900/60 rounded text-[10px] font-bold">
                          ⚠️ {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {res?.notes && (
                  <div className="mt-2 p-2 bg-[#171D2B] rounded-xl border border-[#273248] text-[11px] text-slate-300">
                    <strong className="text-amber-300">Note:</strong> {res.notes}
                  </div>
                )}
              </div>

              {/* Course Stage Step Buttons */}
              {res ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Avanzamento Cucina:
                    </span>
                    {/* BUTTON TO OPEN SEAT-BY-SEAT POS */}
                    <button
                      onClick={() => setActiveComandaTable({ table, reservation: res })}
                      className="px-3 py-1 bg-[#8B31E0] hover:bg-[#7928CA] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Prendi Comanda / Piatti ➔</span>
                    </button>
                  </div>

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
                      onClick={() => setTableAssistance(table.id, !table.needsAssistance, 'Richiesta assistenza')}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                        table.needsAssistance
                          ? 'bg-rose-600 text-white font-bold border-rose-400 animate-pulse'
                          : 'bg-[#10141F] text-slate-400 border-[#242C3E] hover:text-white'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{table.needsAssistance ? 'Assistenza Chiamata' : 'Chiama Assistenza'}</span>
                    </button>

                    <button
                      onClick={() => freeTable(table.id)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-[#171D2B] hover:bg-[#20273A] text-slate-300 border border-[#273248] transition cursor-pointer"
                    >
                      Libera Tavolo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-t border-[#222A3C]">
                  <p className="text-xs text-slate-500 italic">Tavolo attualmente libero.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SEAT-BY-SEAT ORDER TAKING MODAL */}
      {activeComandaTable && (
        <SeatOrderModal
          table={activeComandaTable.table}
          reservation={activeComandaTable.reservation}
          serverName={currentWaiter.name}
          onClose={() => setActiveComandaTable(null)}
          onUpdateReservation={updateReservation}
          onUpdateTableStage={setTableCourseStage}
        />
      )}
    </div>
  );
};

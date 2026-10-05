import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { computeTableInstantStatus } from '../../utils/bookingEngine';
import {
  X,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Layers,
  Edit2,
  UserCheck,
  Phone,
  Mail,
  User,
  Tag,
  MessageSquare,
  Utensils,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Lock,
  Unlock,
} from 'lucide-react';

interface TableDetailModalProps {
  tableId: string | null;
  onClose: () => void;
  onOpenBookingForTable?: (tableId: string) => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  tableId,
  onClose,
  onOpenBookingForTable,
}) => {
  const {
    tables,
    reservations,
    tableGroups,
    settings,
    selectedDate,
    selectedTime,
    seatReservation,
    freeTable,
    extendTableTime,
    updateTableCapacity,
    updateReservation,
    updateTableDetails,
    removeCustomTable,
    unmergeTables,
    cancelReservation,
    deleteReservation,
    toggleTableBlock,
    transferTable,
    setTableCourseStage,
  } = useRestaurant();

  const [isTransferring, setIsTransferring] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');

  if (!tableId) return null;

  const table = tables.find((t) => t.id === tableId);
  if (!table) return null;

  // Active group if merged
  const activeGroup = tableGroups.find(
    (g) => g.groupDate === selectedDate && g.memberTableIds.includes(tableId)
  );

  const effectiveCapacity = activeGroup
    ? activeGroup.totalCapacity
    : table.capacityOverride || table.capacity;

  const liveStatus = computeTableInstantStatus(
    tableId,
    selectedDate,
    selectedTime,
    reservations,
    settings
  );

  const currentRes = liveStatus.currentReservation;

  // All reservations on this table for the selected date
  const tableDayReservations = reservations
    .filter(
      (r) =>
        r.reservationDate === selectedDate &&
        (r.tableId === tableId || (r.assignedTableIds && r.assignedTableIds.includes(tableId))) &&
        r.status !== 'cancelled'
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalTurns = tableDayReservations.length;
  const totalDailyCovers = tableDayReservations.reduce((sum, r) => sum + r.partySize, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222A3C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#171D2B] border border-[#273248] text-[#C084FC] flex items-center justify-center font-brand font-bold text-lg shadow-xs">
              {table.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {activeGroup ? activeGroup.combinedName : table.name || `Tavolo ${table.tableNumber}`}
                </h3>
                {activeGroup && (
                  <span className="text-[10px] font-semibold bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 px-2 py-0.5 rounded-full">
                    {activeGroup.combinedName}
                  </span>
                )}
                {table.isBlocked && (
                  <span className="text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Hold Maître</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-0.5">
                <span>Zona {table.zone.toUpperCase()}</span>
                <span>·</span>
                <span>Capienza: <strong className="text-white font-mono">{effectiveCapacity} pax</strong></span>
                <span>·</span>
                <span className="text-[#34D399] font-medium">
                  {selectedDate}: {totalTurns} {totalTurns === 1 ? 'prenotazione' : 'prenotazioni'} ({totalDailyCovers} pax)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Quick Action Bar: Add Booking for this Table & Hold */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-[#171D2B] border border-[#273248] rounded-2xl shrink-0">
          <div className="flex items-center gap-2">
            {onOpenBookingForTable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBookingForTable(table.id);
                }}
                className="px-3.5 py-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Aggiungi Prenotazione per questo Tavolo</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleTableBlock(table.id, 'Bloccato / Riserva Maître')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
              table.isBlocked
                ? 'bg-rose-950/30 text-rose-300 border-rose-800/50 hover:bg-rose-900/40'
                : 'bg-[#10141F] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'
            }`}
          >
            {table.isBlocked ? (
              <>
                <Unlock className="w-3 h-3 text-rose-400" />
                <span>Sblocca Tavolo</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Hold / Riserva</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* SEATED COURSE PROGRESSION (If currently occupied in real-time) */}
          {currentRes && currentRes.status === 'seated' && (
            <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#34D399] stroke-[1.5]" />
                  <span>Ospite Attualmente Seduto: <strong>{currentRes.guestName}</strong></span>
                </span>
                <span className="font-mono text-[#34D399] font-bold">
                  {liveStatus.elapsedMinutes || 0} min al tavolo
                </span>
              </div>

              {/* Course Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px] font-medium pt-1">
                {(
                  [
                    { id: 'drinks', label: '🍸 Drink' },
                    { id: 'appetizers', label: '🥗 Antipasti' },
                    { id: 'mains', label: '🥩 Portate' },
                    { id: 'dessert', label: '🍰 Dolce' },
                    { id: 'bill_requested', label: '💳 Conto' },
                    { id: 'clearing', label: '🧹 Libero' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTableCourseStage(table.id, c.id)}
                    className={`py-1.5 rounded-lg border transition cursor-pointer text-center ${
                      table.courseStage === c.id
                        ? 'bg-[#8B31E0] text-white border-[#8B31E0] font-bold shadow-xs'
                        : 'bg-[#10141F] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ALL RESERVATIONS ON THIS TABLE FOR THE DAY (TURNI DI SERVIZIO) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C084FC] stroke-[1.5]" />
                <span>Prenotazioni Assegnate Oggi ({selectedDate})</span>
              </h4>
              <span className="text-[11px] font-mono text-[#C084FC]">
                {tableDayReservations.length} {tableDayReservations.length === 1 ? 'Turno' : 'Turni'}
              </span>
            </div>

            {tableDayReservations.length === 0 ? (
              <div className="bg-[#10141F] border border-[#242C3E] rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#34D399] mx-auto opacity-70" />
                <p className="text-xs font-semibold text-white">
                  Nessuna prenotazione per il Tavolo {table.tableNumber} in questa data
                </p>
                <p className="text-[11px] text-slate-400">
                  Il tavolo è completamente libero sia a pranzo che a cena.
                </p>
                {onOpenBookingForTable && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBookingForTable(table.id);
                      }}
                      className="px-4 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                    >
                      + Inserisci la Prima Prenotazione
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {tableDayReservations.map((res) => {
                  const isSeated = res.status === 'seated';
                  const isCompleted = res.status === 'completed';

                  return (
                    <div
                      key={res.id}
                      className={`border rounded-2xl p-3.5 transition-all space-y-2.5 ${
                        isSeated
                          ? 'bg-[#059669]/10 border-[#059669]/40 shadow-xs'
                          : isCompleted
                          ? 'bg-[#10141F]/60 border-[#242C3E] opacity-75'
                          : 'bg-[#171D2B] border-[#273248] hover:border-[#8B31E0]/50'
                      }`}
                    >
                      {/* Top Info Line: Time & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#C084FC]">
                            Ore {res.startTime} – {res.endTime}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#10141F] text-slate-300 border border-[#242C3E]">
                            {res.durationMins} min
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            isSeated
                              ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/40'
                              : res.status === 'confirmed'
                              ? 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {isSeated ? 'Seduto in Sala' : res.status === 'confirmed' ? 'Confermato' : res.status}
                        </span>
                      </div>

                      {/* Guest Details */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#222A3C]/70 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white font-semibold text-sm">
                              {res.guestName}
                            </strong>
                            <span className="font-mono text-slate-400 font-bold">
                              ({res.partySize} persone)
                            </span>
                          </div>
                          {(res.guestPhone || res.guestEmail) && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              {res.guestPhone && <span>📞 {res.guestPhone}</span>}
                              {res.guestEmail && <span>✉️ {res.guestEmail}</span>}
                            </div>
                          )}
                          {res.notes && (
                            <p className="text-[11px] text-amber-200/90 italic mt-0.5">
                              Note: {res.notes}
                            </p>
                          )}
                        </div>

                        {/* Action buttons per reservation */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {res.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => {
                                seatReservation(res.id);
                              }}
                              className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Accomoda subito al tavolo"
                            >
                              <UserCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                              <span>Fai Sedere</span>
                            </button>
                          )}

                          {isSeated && (
                            <button
                              type="button"
                              onClick={() => {
                                freeTable(table.id);
                              }}
                              className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Termina e libera tavolo"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                              <span>Completa</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              deleteReservation(res.bookingCode || res.id);
                            }}
                            className="p-1.5 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 rounded-xl text-xs transition cursor-pointer"
                            title="Elimina prenotazione"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#222A3C] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Chiudi Scheda Tavolo
          </button>
        </div>
      </div>
    </div>
  );
};

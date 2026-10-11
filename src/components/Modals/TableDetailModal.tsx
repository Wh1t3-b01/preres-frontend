import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { guestCrmService } from '../../services/guestCrmService';
import { computeTableInstantStatus } from '../../utils/bookingEngine';
import { getTableSeatConfiguration } from '../../utils/tableSeatLayout';
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
  Compass,
  Footprints,
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
    rescheduleReservation,
    quickSeatWalkIn,
    addToast,
    theme,
  } = useRestaurant();

  const isLight = theme === 'light';

  const [isTransferring, setIsTransferring] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');
  const [walkInPax, setWalkInPax] = useState<number>(2);

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col border ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#121622] border-[#273248] text-slate-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${
          isLight ? 'border-slate-200' : 'border-[#222A3C]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-brand font-bold text-lg shadow-xs border ${
              isLight
                ? 'bg-sky-50 border-sky-200 text-sky-700'
                : 'bg-[#171D2B] border-[#273248] text-[#C084FC]'
            }`}>
              {table.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {activeGroup ? activeGroup.combinedName : table.name || `Tavolo ${table.tableNumber}`}
                </h3>
                {activeGroup && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/30'
                  }`}>
                    {activeGroup.combinedName}
                  </span>
                )}
                {table.isBlocked && (
                  <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Hold Maître</span>
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-2 text-xs flex-wrap mt-0.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <span>Zona {table.zone.toUpperCase()}</span>
                <span>·</span>
                <span>Capienza: <strong className={`font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>{effectiveCapacity} pax</strong></span>
                <span>·</span>
                <span className="text-emerald-600 font-medium">
                  {selectedDate}: {totalTurns} {totalTurns === 1 ? 'prenotazione' : 'prenotazioni'} ({totalDailyCovers} pax)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Quick Action Bar: Add Booking for this Table & Hold */}
        <div className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl shrink-0 border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenBookingForTable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBookingForTable(table.id);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
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
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : isLight
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-[#10141F] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'
            }`}
          >
            {table.isBlocked ? (
              <>
                <Unlock className="w-3 h-3 text-rose-600" />
                <span>Sblocca Tavolo</span>
              </>
            ) : (
              <>
                <Lock className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                <span>Hold / Riserva</span>
              </>
            )}
          </button>
        </div>

        {/* 1. SEATING A WALK-IN (Essential #1: Tap empty table -> Seat Walk-In & add party size) */}
        {liveStatus.status === 'free' && (
          <div className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 ${
            isLight
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950 shadow-2xs'
              : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs leading-tight">Seating a Walk-In</h4>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    isLight ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-black/30 text-emerald-300 border-emerald-700/50'
                  }`}>
                    Tavolo Libero
                  </span>
                </div>
                <p className={`text-[10px] mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                  Seleziona il numero di coperti e tocca <strong>Seat Walk-In</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                isLight ? 'bg-white border-emerald-200' : 'bg-[#0E121B] border-emerald-800/40'
              }`}>
                <span className={`text-[10px] font-medium px-1 ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>Pax:</span>
                {[1, 2, 3, 4, Math.max(6, effectiveCapacity)].map((pax) => (
                  <button
                    key={pax}
                    type="button"
                    onClick={() => setWalkInPax(pax)}
                    className={`w-6 h-6 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      walkInPax === pax
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : isLight
                        ? 'text-slate-600 hover:bg-emerald-50'
                        : 'text-slate-300 hover:bg-emerald-900/30'
                    }`}
                  >
                    {pax}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const res = quickSeatWalkIn({
                    tableId: table.id,
                    partySize: walkInPax,
                    guestName: `Walk-in (Tavolo ${table.tableNumber})`,
                  });
                  if (res.success) {
                    addToast({
                      type: 'success',
                      title: 'Walk-In Accomodato',
                      message: `Walk-in (${walkInPax} persone) accomodato al Tavolo ${table.tableNumber}. Ora appare nella lista prenotazioni!`,
                    });
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Seat Walk-In</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* SEATING & WAITER PERSPECTIVE CARD */}
          {(() => {
            const seatConfig = getTableSeatConfiguration(table.id, effectiveCapacity);
            return (
              <div className={`rounded-2xl p-3.5 space-y-2.5 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151B27] border-[#252F43]'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Compass className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-[#C084FC]'}`} />
                    <span>Disposizione Sedute & Cameriere</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ↻ Senso Orario da Sinistra
                  </span>
                </div>

                <div className={`text-[11px] p-2.5 rounded-xl border leading-relaxed ${
                  isLight ? 'bg-white text-slate-700 border-slate-200' : 'text-slate-300 bg-[#0E121B] border-[#1E2536]'
                }`}>
                  <div className={`font-medium mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    📍 <span className={isLight ? 'text-sky-700 font-semibold' : 'text-[#C084FC]'}>Accesso:</span> {seatConfig.waiterApproach}
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {seatConfig.clockwiseDescription}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                  {seatConfig.seats.map((s) => (
                    <div
                      key={s.seatNumber}
                      className={`rounded-xl p-2 text-left border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#10141F] border-[#242C3E]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-sky-700' : 'text-[#C084FC]'}`}>
                          Posto {s.seatNumber}
                        </span>
                        {s.isOnBench && (
                          <span className={`text-[8px] px-1 py-0.2 rounded font-semibold border ${
                            isLight
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-sky-950 text-sky-300 border-sky-800/60'
                          }`}>
                            Panca
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] font-semibold mt-0.5 truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {s.shortLabel}
                      </div>
                      <div className={`text-[9px] mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {s.locationDescription}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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
                {tableDayReservations.map((res, idx) => {
                  const isSeated = res.status === 'seated';
                  const isCompleted = res.status === 'completed';
                  const guestProfile =
                    (res.guestProfileId ? guestCrmService.getProfileById(res.guestProfileId) : undefined) ||
                    guestCrmService.getProfileByNameOrPhone(res.guestName, res.guestPhone);

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
                      {/* Top Info Line: Slot, Time, +/- 15m Duration & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase font-mono font-bold bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 px-2 py-0.5 rounded-md">
                            Slot {idx + 1}: {res.guestName} alle {res.startTime}
                          </span>
                          <span className="font-mono font-bold text-xs text-white">
                            {res.startTime} – {res.endTime}
                          </span>

                          {/* Quick Duration Stepper (-15m / +15m) */}
                          <div className="flex items-center gap-1 bg-[#10141F] px-1.5 py-0.5 rounded-lg border border-[#242C3E]">
                            <button
                              type="button"
                              onClick={() => {
                                const newDur = Math.max(30, (res.durationMins || 120) - 15);
                                rescheduleReservation(
                                  res.id,
                                  res.startTime,
                                  res.reservationDate,
                                  res.tableId,
                                  newDur
                                );
                              }}
                              className="text-[10px] text-slate-400 hover:text-white px-1 py-0.5 rounded hover:bg-[#20273A] transition cursor-pointer font-mono font-bold"
                              title="Riduci durata (-15 min)"
                            >
                              -15m
                            </button>
                            <span className="text-[10px] font-mono text-[#34D399] font-bold px-1">
                              {res.durationMins || 120}m
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newDur = Math.min(300, (res.durationMins || 120) + 15);
                                rescheduleReservation(
                                  res.id,
                                  res.startTime,
                                  res.reservationDate,
                                  res.tableId,
                                  newDur
                                );
                              }}
                              className="text-[10px] text-[#C084FC] hover:text-[#E9D5FF] px-1 py-0.5 rounded hover:bg-[#20273A] transition cursor-pointer font-mono font-bold"
                              title="Allunga durata (+15 min)"
                            >
                              +15m
                            </button>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
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

                          {/* Guest Attention Alert (Green/Red) */}
                          {guestProfile?.attentionAlert?.isAttentionRequired && (
                            <div
                              className={`mt-2 p-2 rounded-xl border text-[11px] font-medium flex items-start gap-1.5 ${
                                guestProfile.attentionAlert.alertColor === 'red'
                                  ? 'bg-rose-950/40 border-rose-600/70 text-rose-200'
                                  : 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                              }`}
                            >
                              <span className="shrink-0 text-xs">
                                {guestProfile.attentionAlert.alertColor === 'red' ? '🚨' : '🌟'}
                              </span>
                              <div>
                                <strong className="block text-[10px] uppercase font-bold tracking-wider">
                                  {guestProfile.attentionAlert.alertColor === 'red'
                                    ? 'Alert Manager (Ospite Critico):'
                                    : 'Alert Manager (VIP Speciale):'}
                                </strong>
                                <span>"{guestProfile.attentionAlert.reason}"</span>
                              </div>
                            </div>
                          )}

                          {/* Top Spender Alert (if enabled) */}
                          {guestProfile?.enableTopSpenderAlert && (
                            <div className="mt-1.5 p-1.5 rounded-xl border border-amber-500/50 bg-amber-950/30 text-amber-200 text-[10px] flex items-center gap-1.5 font-medium">
                              <span>💎</span>
                              <span>
                                <strong>VIP Top Spender</strong> (Spesa media: €{guestProfile.avgSpend}/pax ≥ 130€)
                              </span>
                            </div>
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

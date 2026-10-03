import React, { useState, useMemo, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { timeToMins, minsToTime, validateAdvanceBookingSlotLimits, ALL_BOOKING_SLOTS } from '../../utils/bookingEngine';
import {
  Clock,
  Calendar,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Reservation, RestaurantTable } from '../../types';

interface TimelineViewProps {
  onSelectTableForDetails: (tableId: string) => void;
}

type StatusFilterType = 'all' | 'upcoming' | 'seated' | 'completed';

export const TimelineView: React.FC<TimelineViewProps> = ({ onSelectTableForDetails }) => {
  const {
    tables,
    reservations,
    selectedDate,
    setSelectedDate,
    selectedTime,
    rescheduleReservation,
    seatReservation,
  } = useRestaurant();

  // Selected reservation for Time-Shift / Reschedule Modal
  const [activeShiftReservation, setActiveShiftReservation] = useState<Reservation | null>(null);
  const [proposedStartTime, setProposedStartTime] = useState<string>('');
  const [proposedTableId, setProposedTableId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Timeline hours from 12:00 to 23:30 (interval 30 mins)
  const timeHours = useMemo(() => {
    const hours: string[] = [];
    for (let m = 12 * 60; m <= 23.5 * 60; m += 30) {
      hours.push(minsToTime(m));
    }
    return hours;
  }, []);

  const timelineStartMins = 12 * 60; // 720 mins (12:00)
  const timelineTotalMins = 12 * 60; // 720 mins total window (12:00 - 24:00)

  // Active reservations for today filtered by status
  const dayReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.reservationDate !== selectedDate || r.status === 'cancelled') return false;
      if (statusFilter === 'upcoming') return r.status === 'confirmed';
      if (statusFilter === 'seated') return r.status === 'seated';
      if (statusFilter === 'completed') return r.status === 'completed';
      return true;
    });
  }, [reservations, selectedDate, statusFilter]);

  // Current time position on timeline
  const currentTimeMins = timeToMins(selectedTime);
  const currentTimePercent = Math.max(
    0,
    Math.min(100, ((currentTimeMins - timelineStartMins) / timelineTotalMins) * 100)
  );

  // Open Time-Shift Modal for a reservation
  const handleOpenTimeShift = (res: Reservation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveShiftReservation(res);
    setProposedStartTime(res.startTime);
    setProposedTableId(res.tableId);
  };

  // Calculate projected end time for proposed shift
  const proposedDuration = useMemo(() => {
    if (!activeShiftReservation) return 120;
    return activeShiftReservation.durationMins || (activeShiftReservation.partySize <= 2 ? 120 : 165);
  }, [activeShiftReservation]);

  const proposedEndTime = useMemo(() => {
    if (!proposedStartTime) return '';
    const startM = timeToMins(proposedStartTime);
    return minsToTime(startM + proposedDuration);
  }, [proposedStartTime, proposedDuration]);

  // Real-time slot capacity check for the proposed shift
  const shiftValidation = useMemo(() => {
    if (!activeShiftReservation || !proposedStartTime || !proposedEndTime) {
      return { isValid: true };
    }
    return validateAdvanceBookingSlotLimits(
      selectedDate,
      proposedStartTime,
      proposedEndTime,
      activeShiftReservation.partySize,
      reservations,
      activeShiftReservation.id
    );
  }, [activeShiftReservation, proposedStartTime, proposedEndTime, selectedDate, reservations]);

  // Shift start time by +/- 15 minutes
  const handleShiftMinutes = (deltaMins: number) => {
    if (!proposedStartTime) return;
    const currentM = timeToMins(proposedStartTime);
    const targetM = Math.max(12 * 60, Math.min(22 * 60, currentM + deltaMins));
    setProposedStartTime(minsToTime(targetM));
  };

  // Submit Reschedule to Backend & Realtime Sync
  const handleConfirmReschedule = async () => {
    if (!activeShiftReservation || !proposedStartTime) return;
    setIsSaving(true);
    try {
      const res = await rescheduleReservation(
        activeShiftReservation.id,
        proposedStartTime,
        selectedDate,
        proposedTableId !== activeShiftReservation.tableId ? proposedTableId : undefined
      );

      if (res.success) {
        setActiveShiftReservation(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-3xl p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-[#1E3A2F]">
              Timeline Oraria & Time-Shift Engine
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#6B3FA0]/10 text-[#6B3FA0] border border-[#6B3FA0]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#6B3FA0]" />
              <span>Spostamento Interattivo ±15 min</span>
            </span>
          </div>
          <p className="text-xs text-[#1E3A2F]/70 mt-0.5">
            Trascina o clicca sui blocchi prenotazione per riprogrammare gli orari con validazione capienza istantanea.
          </p>
        </div>

        {/* Filters and Date Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Segmented Filter */}
          <div className="flex bg-[#1E3A2F]/5 p-1 rounded-xl text-xs font-semibold text-[#1E3A2F]/80">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-white text-[#1E3A2F] shadow-xs font-bold'
                  : 'hover:text-[#1E3A2F]'
              }`}
            >
              Tutti ({reservations.filter((r) => r.reservationDate === selectedDate && r.status !== 'cancelled').length})
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'upcoming'
                  ? 'bg-[#6B3FA0] text-white shadow-xs font-bold'
                  : 'hover:text-[#1E3A2F]'
              }`}
            >
              In Arrivo
            </button>
            <button
              onClick={() => setStatusFilter('seated')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'seated'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'hover:text-[#1E3A2F]'
              }`}
            >
              Seduti
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'completed'
                  ? 'bg-stone-600 text-white shadow-xs font-bold'
                  : 'hover:text-[#1E3A2F]'
              }`}
            >
              Completati
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#FBF8F2] border border-[#1E3A2F]/20 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-stone-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 font-semibold text-[#1E3A2F] focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Gantt Grid Container */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-3xl shadow-xs p-5 overflow-x-auto">
        <div className="min-w-[1200px] relative">
          {/* Time Header Scale */}
          <div className="grid grid-cols-[160px_1fr] border-b border-[#1E3A2F]/20 pb-3">
            <div className="text-xs font-bold text-[#1E3A2F] uppercase tracking-wider pl-2 flex items-center gap-1.5">
              <span>Tavolo</span>
              <span className="text-[10px] text-stone-400 font-normal">/ Capienza</span>
            </div>
            <div className="grid grid-cols-24 relative text-[10px] font-mono-num text-stone-500 font-semibold">
              {timeHours.map((hour, idx) => (
                <div key={hour} className="text-left border-l border-stone-200/80 pl-1.5">
                  {idx % 2 === 0 ? (
                    <span className="font-bold text-stone-700">{hour}</span>
                  ) : (
                    <span className="text-stone-400 text-[9px]">{hour}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-stone-100 relative">
            {/* Live Time Red Line Indicator */}
            {currentTimeMins >= timelineStartMins && currentTimeMins <= timelineStartMins + timelineTotalMins && (
              <div
                className="absolute top-0 bottom-0 z-20 w-0.5 bg-rose-500 shadow-sm pointer-events-none"
                style={{ left: `calc(160px + (100% - 160px) * ${currentTimePercent / 100})` }}
              >
                <div className="sticky top-0 -ml-6 bg-rose-500 text-white font-mono-num font-bold text-[9px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span>{selectedTime}</span>
                </div>
              </div>
            )}

            {tables.map((table) => {
              const tableRes = dayReservations.filter(
                (r) =>
                  r.tableId === table.id ||
                  (r.assignedTableIds && r.assignedTableIds.includes(table.id))
              );

              return (
                <div
                  key={table.id}
                  className="grid grid-cols-[160px_1fr] items-center py-3 hover:bg-[#FBF8F2]/80 transition group"
                >
                  {/* Table Label */}
                  <div
                    onClick={() => onSelectTableForDetails(table.id)}
                    className="flex items-center justify-between pr-3 pl-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F]/30 group-hover:bg-[#6B3FA0] transition"></span>
                      <span className="font-bold text-xs text-[#1E3A2F] group-hover:text-[#6B3FA0]">
                        Tavolo {table.tableNumber}
                      </span>
                    </div>
                    <span className="text-[10px] bg-stone-100 border border-stone-200 text-stone-600 font-mono-num px-1.5 py-0.5 rounded-md font-semibold">
                      {table.capacityOverride || table.capacity} px
                    </span>
                  </div>

                  {/* Horizontal Timeline Track */}
                  <div className="relative h-11 bg-stone-50/90 rounded-xl border border-stone-200/80 overflow-hidden">
                    {/* Hour grid lines */}
                    <div className="absolute inset-0 grid grid-cols-24 pointer-events-none">
                      {timeHours.map((_, i) => (
                        <div
                          key={i}
                          className={`border-l h-full ${
                            i % 2 === 0 ? 'border-stone-200/80' : 'border-stone-100'
                          }`}
                        ></div>
                      ))}
                    </div>

                    {/* Booking Blocks (Interactive Shift Buttons) */}
                    {tableRes.map((r) => {
                      const startM = timeToMins(r.startTime);
                      const endM = timeToMins(r.endTime);

                      const leftPercent = Math.max(
                        0,
                        ((startM - timelineStartMins) / timelineTotalMins) * 100
                      );
                      const widthPercent = Math.min(
                        100 - leftPercent,
                        ((endM - startM) / timelineTotalMins) * 100
                      );

                      const isSeated = r.status === 'seated';
                      const isCompleted = r.status === 'completed';

                      return (
                        <div
                          key={r.id}
                          onClick={(e) => handleOpenTimeShift(r, e)}
                          title={`${r.guestName} (${r.partySize} px) · ${r.startTime} - ${r.endTime} — Clicca per riprogrammare orario`}
                          className={`absolute top-1 bottom-1 rounded-lg px-2.5 flex items-center justify-between text-[11px] font-semibold text-white shadow-xs cursor-pointer truncate transition-all duration-150 hover:scale-[1.01] hover:brightness-110 active:scale-95 z-10 select-none ${
                            isSeated
                              ? 'bg-emerald-600 border border-emerald-700 ring-1 ring-emerald-400/40'
                              : isCompleted
                              ? 'bg-stone-500 border border-stone-600 opacity-80'
                              : 'bg-[#6B3FA0] border border-[#5A338A] ring-1 ring-[#6B3FA0]/40'
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(6, widthPercent)}%`,
                          }}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <MoveHorizontal className="w-3 h-3 opacity-70 shrink-0" />
                            <span className="font-bold font-mono-num">{r.startTime}</span>
                            <span className="truncate">{r.guestName}</span>
                          </div>

                          <div className="flex items-center gap-1 ml-1 shrink-0 opacity-90">
                            <span className="font-mono-num text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                              {r.partySize}p
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE TIME-SHIFT / RESCHEDULE MODAL */}
      {/* ========================================================= */}
      {activeShiftReservation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-[#1E3A2F]/20 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1E3A2F]/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#6B3FA0]/10 text-[#6B3FA0] flex items-center justify-center font-bold">
                  <MoveHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-brand font-bold text-[#1E3A2F]">
                    Riprogramma Orario Prenotazione
                  </h3>
                  <p className="text-xs text-[#1E3A2F]/70">
                    Ospite: <strong>{activeShiftReservation.guestName}</strong> ({activeShiftReservation.partySize} persone) · Codice: <span className="font-mono">{activeShiftReservation.bookingCode}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveShiftReservation(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper ±15 min */}
            <div className="bg-[#FBF8F2] border border-[#1E3A2F]/15 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-[#1E3A2F] uppercase tracking-wider block">
                Spostamento Rapido a Fasi di 15 Minuti
              </span>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleShiftMinutes(-15)}
                  className="flex items-center gap-1 px-3.5 py-2.5 bg-white hover:bg-stone-100 text-[#1E3A2F] border border-[#1E3A2F]/20 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>-15 min</span>
                </button>

                <div className="text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Nuovo Orario Inizio</span>
                  <span className="text-2xl font-mono-num font-bold text-[#6B3FA0]">
                    {proposedStartTime}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleShiftMinutes(15)}
                  className="flex items-center gap-1 px-3.5 py-2.5 bg-white hover:bg-stone-100 text-[#1E3A2F] border border-[#1E3A2F]/20 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                >
                  <span>+15 min</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Summary of shift */}
              <div className="flex items-center justify-between text-xs text-stone-600 bg-white border border-[#1E3A2F]/10 rounded-xl p-2.5 font-mono-num">
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400 line-through">{activeShiftReservation.startTime}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B3FA0]" />
                  <strong className="text-[#1E3A2F]">{proposedStartTime} - {proposedEndTime}</strong>
                </div>
                <span className="text-[10px] text-stone-500">Durata: {proposedDuration}m ({activeShiftReservation.partySize <= 2 ? '2h' : '2h 45m'})</span>
              </div>
            </div>

            {/* Destination Table Switcher */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1E3A2F]">
                Tavolo Assegnato
              </label>
              <select
                value={proposedTableId}
                onChange={(e) => setProposedTableId(e.target.value)}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs font-semibold text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0]"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Tavolo {t.tableNumber} (Capienza: {t.capacityOverride || t.capacity} ospiti - Zona: {t.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* Real-time Capacity Check Feedback */}
            {shiftValidation.isValid ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Fascia oraria disponibile! Nessun conflitto di capienza con gli altri tavoli.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-900 font-bold mb-0.5">Spostamento Non Consentito</strong>
                  <span>{shiftValidation.reason}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#1E3A2F]/10">
              <button
                type="button"
                onClick={() => setActiveShiftReservation(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#1E3A2F] rounded-xl text-xs font-semibold transition"
              >
                Annulla
              </button>

              <button
                type="button"
                disabled={!shiftValidation.isValid || isSaving}
                onClick={handleConfirmReschedule}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 ${
                  shiftValidation.isValid && !isSaving
                    ? 'bg-[#6B3FA0] hover:bg-[#5A338A] text-white cursor-pointer active:scale-95'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                {isSaving ? (
                  <span>Sincronizzazione in corso...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conferma e Sincronizza su Tutti i Dispositivi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

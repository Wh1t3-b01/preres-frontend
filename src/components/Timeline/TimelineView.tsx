import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { timeToMins, minsToTime, validateAdvanceBookingSlotLimits } from '../../utils/bookingEngine';
import {
  Clock,
  Calendar,
  Sun,
  Moon,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Reservation } from '../../types';

interface TimelineViewProps {
  onSelectTableForDetails: (tableId: string) => void;
}

type ServiceShift = 'lunch' | 'dinner';
type StatusFilterType = 'all' | 'upcoming' | 'seated' | 'completed';

export const TimelineView: React.FC<TimelineViewProps> = ({ onSelectTableForDetails }) => {
  const {
    tables,
    reservations,
    selectedDate,
    setSelectedDate,
    selectedTime,
    rescheduleReservation,
    staffRole,
  } = useRestaurant();

  // Shift: Lunch (12:00 - 16:00) vs Dinner (19:00 - 00:30)
  const initialShift: ServiceShift = useMemo(() => {
    const currentM = timeToMins(selectedTime);
    return currentM >= 17 * 60 ? 'dinner' : 'lunch';
  }, [selectedTime]);

  const [activeShift, setActiveShift] = useState<ServiceShift>(initialShift);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  
  // Selected reservation for Time-Shift / Reschedule Modal
  const [activeShiftReservation, setActiveShiftReservation] = useState<Reservation | null>(null);
  const [proposedStartTime, setProposedStartTime] = useState<string>('');
  const [proposedTableId, setProposedTableId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [forceOverride, setForceOverride] = useState(false);

  // Drag & Drop State
  const [draggedRes, setDraggedRes] = useState<Reservation | null>(null);

  // Timeline configuration based on active shift
  const shiftConfig = useMemo(() => {
    if (activeShift === 'lunch') {
      return {
        startHour: 12,
        endHour: 16,
        startMins: 12 * 60,
        totalMins: 4 * 60, // 240 mins (12:00 - 16:00)
        label: 'Pranzo',
        timeRange: '12:00 – 16:00',
        slots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
      };
    } else {
      return {
        startHour: 19,
        endHour: 24.5,
        startMins: 19 * 60,
        totalMins: 5.5 * 60, // 330 mins (19:00 - 00:30)
        label: 'Cena',
        timeRange: '19:00 – 00:30',
        slots: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30'],
      };
    }
  }, [activeShift]);

  // Active reservations for today filtered by status & shift
  const dayReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.reservationDate !== selectedDate || r.status === 'cancelled') return false;
      if (statusFilter === 'upcoming') return r.status === 'confirmed';
      if (statusFilter === 'seated') return r.status === 'seated';
      if (statusFilter === 'completed') return r.status === 'completed';

      // Check if overlaps with the active shift window
      const resStartM = timeToMins(r.startTime);
      const resEndM = timeToMins(r.endTime);
      const shiftEndM = shiftConfig.startMins + shiftConfig.totalMins;

      return resStartM < shiftEndM && resEndM > shiftConfig.startMins;
    });
  }, [reservations, selectedDate, statusFilter, shiftConfig]);

  // Current time position on active timeline
  const currentTimeMins = timeToMins(selectedTime);
  const isTimeInShift =
    currentTimeMins >= shiftConfig.startMins &&
    currentTimeMins <= shiftConfig.startMins + shiftConfig.totalMins;

  const currentTimePercent = Math.max(
    0,
    Math.min(100, ((currentTimeMins - shiftConfig.startMins) / shiftConfig.totalMins) * 100)
  );

  // Open Time-Shift Modal
  const handleOpenTimeShift = (res: Reservation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveShiftReservation(res);
    setProposedStartTime(res.startTime);
    setProposedTableId(res.tableId);
    setForceOverride(false);
  };

  // Calculate projected end time
  const proposedDuration = useMemo(() => {
    if (!activeShiftReservation) return 120;
    return activeShiftReservation.durationMins || (activeShiftReservation.partySize <= 2 ? 120 : 165);
  }, [activeShiftReservation]);

  const proposedEndTime = useMemo(() => {
    if (!proposedStartTime) return '';
    const startM = timeToMins(proposedStartTime);
    return minsToTime(startM + proposedDuration);
  }, [proposedStartTime, proposedDuration]);

  // Real-time slot capacity check
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
    const targetM = Math.max(12 * 60, Math.min(23.5 * 60, currentM + deltaMins));
    setProposedStartTime(minsToTime(targetM));
  };

  // Submit Reschedule to Backend & Realtime Sync
  const handleConfirmReschedule = async (force: boolean = false) => {
    if (!activeShiftReservation || !proposedStartTime) return;
    setIsSaving(true);
    try {
      const res = await rescheduleReservation(
        activeShiftReservation.id,
        proposedStartTime,
        selectedDate,
        proposedTableId !== activeShiftReservation.tableId ? proposedTableId : undefined
      );

      if (res.success || force) {
        setActiveShiftReservation(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Drag & Drop Handler on Timeline Track
  const handleTrackDrop = async (e: React.DragEvent<HTMLDivElement>, tableId: string) => {
    e.preventDefault();
    if (!draggedRes) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickXRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetMins = shiftConfig.startMins + clickXRatio * shiftConfig.totalMins;

    // Round to nearest 15-minute mark
    const roundedMins = Math.round(targetMins / 15) * 15;
    const newStartTime = minsToTime(roundedMins);

    await rescheduleReservation(
      draggedRes.id,
      newStartTime,
      selectedDate,
      tableId !== draggedRes.tableId ? tableId : undefined
    );

    setDraggedRes(null);
  };

  return (
    <div className="space-y-6 max-w-[1780px] mx-auto pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Title & Service Shift Segmented Switcher */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl font-brand font-bold text-[#1E3A2F]">
              Timeline Servizio
            </h2>
            <p className="text-xs text-[#1E3A2F]/70">
              Trascina o clicca sui blocchi per riprogrammare gli orari e cambiare tavolo
            </p>
          </div>

          {/* Service Shift Toggle: Pranzo vs Cena */}
          <div className="flex items-center bg-[#1E3A2F]/5 p-1 rounded-2xl border border-[#1E3A2F]/10 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setActiveShift('lunch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeShift === 'lunch'
                  ? 'bg-amber-400 text-amber-950 shadow-xs font-bold border border-amber-500/40'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Pranzo (12:00 – 16:00)</span>
            </button>
            <button
              onClick={() => setActiveShift('dinner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeShift === 'dinner'
                  ? 'bg-[#1E3A2F] text-amber-100 shadow-xs font-bold border border-[#1E3A2F]'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Cena (19:00 – 00:30)</span>
            </button>
          </div>
        </div>

        {/* Filters and Status Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex bg-[#1E3A2F]/5 p-1 rounded-xl text-xs font-semibold text-[#1E3A2F]/80">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-[#1E3A2F] text-amber-100 shadow-xs font-bold'
                  : 'hover:text-[#1E3A2F]'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'upcoming'
                  ? 'bg-[#6B3FA0] text-white shadow-xs font-bold'
                  : 'hover:text-[#1E3A2F]'
              }`}
            >
              Confermati
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
        </div>
      </div>

      {/* Gantt Grid Container */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-3xl shadow-xs p-4 sm:p-5 overflow-x-auto">
        <div className="min-w-[950px] relative">
          
          {/* Time Header Scale */}
          <div className="grid grid-cols-[140px_1fr] border-b border-[#1E3A2F]/20 pb-2.5">
            <div className="text-xs font-bold text-[#1E3A2F] uppercase tracking-wider pl-2 flex items-center gap-1.5">
              <span>Tavolo</span>
              <span className="text-[10px] text-stone-400 font-normal">/ Max Px</span>
            </div>
            <div
              className="grid relative text-[10px] font-mono-num text-stone-500 font-semibold"
              style={{ gridTemplateColumns: `repeat(${shiftConfig.slots.length}, 1fr)` }}
            >
              {shiftConfig.slots.map((hour, idx) => (
                <div key={hour} className="text-left border-l border-stone-200/80 pl-1.5">
                  <span className={idx % 2 === 0 ? 'font-bold text-stone-800' : 'text-stone-400'}>
                    {hour}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-stone-100 relative">
            
            {/* Live Time Red Line Indicator */}
            {isTimeInShift && (
              <div
                className="absolute top-0 bottom-0 z-20 w-0.5 bg-rose-500 shadow-sm pointer-events-none"
                style={{ left: `calc(140px + (100% - 140px) * ${currentTimePercent / 100})` }}
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
                  className="grid grid-cols-[140px_1fr] items-center py-2.5 hover:bg-[#FBF8F2]/80 transition group"
                >
                  {/* Table Label */}
                  <div
                    onClick={() => onSelectTableForDetails(table.id)}
                    className="flex items-center justify-between pr-3 pl-2 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F]/30 group-hover:bg-[#6B3FA0] transition"></span>
                      <span className="font-bold text-xs text-[#1E3A2F] group-hover:text-[#6B3FA0]">
                        {table.tableNumber}
                      </span>
                    </div>
                    <span className="text-[10px] bg-stone-100 border border-stone-200 text-stone-600 font-mono-num px-1.5 py-0.5 rounded-md font-semibold">
                      {table.capacityOverride || table.capacity} px
                    </span>
                  </div>

                  {/* Horizontal Timeline Track (Drop Target) */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleTrackDrop(e, table.id)}
                    className="relative h-11 bg-stone-50/90 rounded-xl border border-stone-200/80 overflow-hidden"
                  >
                    {/* Hour grid lines */}
                    <div
                      className="absolute inset-0 grid pointer-events-none"
                      style={{ gridTemplateColumns: `repeat(${shiftConfig.slots.length}, 1fr)` }}
                    >
                      {shiftConfig.slots.map((_, i) => (
                        <div
                          key={i}
                          className={`border-l h-full ${
                            i % 2 === 0 ? 'border-stone-200/80' : 'border-stone-100'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Booking Blocks (Interactive Drag & Click Blocks) */}
                    {tableRes.map((r) => {
                      const startM = timeToMins(r.startTime);
                      const endM = timeToMins(r.endTime);

                      const leftPercent = Math.max(
                        0,
                        ((startM - shiftConfig.startMins) / shiftConfig.totalMins) * 100
                      );
                      const widthPercent = Math.min(
                        100 - leftPercent,
                        ((endM - startM) / shiftConfig.totalMins) * 100
                      );

                      if (widthPercent <= 0 || leftPercent >= 100) return null;

                      const isSeated = r.status === 'seated';
                      const isCompleted = r.status === 'completed';

                      return (
                        <div
                          key={r.id}
                          draggable
                          onDragStart={() => setDraggedRes(r)}
                          onClick={(e) => handleOpenTimeShift(r, e)}
                          title={`${r.guestName} (${r.partySize} px) · ${r.startTime} - ${r.endTime} — Trascina per spostare o clicca per modificare`}
                          className={`absolute top-1 bottom-1 rounded-lg px-2.5 flex items-center justify-between text-[11px] font-semibold text-white shadow-xs cursor-grab active:cursor-grabbing truncate transition-all duration-150 hover:scale-[1.01] hover:brightness-110 z-10 select-none ${
                            isSeated
                              ? 'bg-emerald-600 border border-emerald-700 ring-1 ring-emerald-400/40'
                              : isCompleted
                              ? 'bg-stone-500 border border-stone-600 opacity-70'
                              : 'bg-[#6B3FA0] border border-[#5A338A]'
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(4, widthPercent)}%`,
                          }}
                        >
                          <span className="truncate font-bold">
                            {r.guestName} ({r.partySize}p)
                          </span>
                          <span className="hidden sm:inline font-mono-num text-[10px] opacity-90 pl-1">
                            {r.startTime}
                          </span>
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

      {/* QUICK RESCHEDULE MODAL (With Manager Override) */}
      {activeShiftReservation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-brand font-bold text-[#1E3A2F]">
                  Riprogramma Orario & Tavolo
                </h3>
                <p className="text-xs text-stone-500">
                  {activeShiftReservation.guestName} · {activeShiftReservation.partySize} Ospiti (Codice: {activeShiftReservation.bookingCode})
                </p>
              </div>
              <button
                onClick={() => setActiveShiftReservation(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shift & Time Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E3A2F] uppercase tracking-wider mb-2">
                  Orario di Inizio:
                </label>
                <div className="flex items-center justify-between gap-2 bg-[#FDFBF7] border border-[#1E3A2F]/20 p-2 rounded-2xl">
                  <button
                    onClick={() => handleShiftMinutes(-15)}
                    className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-bold text-xs text-[#1E3A2F] shadow-2xs cursor-pointer active:scale-95"
                  >
                    - 15 min
                  </button>

                  <div className="text-center font-mono-num font-bold text-xl text-[#1E3A2F]">
                    {proposedStartTime}
                    <span className="text-xs font-normal text-stone-500 block">
                      Fine: {proposedEndTime} ({proposedDuration} min)
                    </span>
                  </div>

                  <button
                    onClick={() => handleShiftMinutes(15)}
                    className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-bold text-xs text-[#1E3A2F] shadow-2xs cursor-pointer active:scale-95"
                  >
                    + 15 min
                  </button>
                </div>
              </div>

              {/* Table Assignment Selector */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A2F] uppercase tracking-wider mb-2">
                  Tavolo Assegnato:
                </label>
                <select
                  value={proposedTableId}
                  onChange={(e) => setProposedTableId(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs font-semibold text-[#1E3A2F] focus:outline-none cursor-pointer"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tavolo {t.tableNumber} ({t.zone.toUpperCase()} · max {t.capacityOverride || t.capacity} px)
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity Limit Validation Banner */}
              {!shiftValidation.isValid && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-2">
                  <div className="flex items-start gap-2 text-amber-900 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{shiftValidation.reason}</span>
                  </div>
                  {staffRole === 'manager' && (
                    <p className="text-[11px] text-amber-800 italic">
                      In qualità di <strong>Manager</strong> puoi forzare l'assegnazione scavalcando il limite standard.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                onClick={() => setActiveShiftReservation(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                Annulla
              </button>

              {!shiftValidation.isValid && staffRole === 'manager' ? (
                <button
                  onClick={() => handleConfirmReschedule(true)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isSaving ? 'Salvataggio...' : '⚡ Forza Spostamento (Manager)'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleConfirmReschedule(false)}
                  disabled={isSaving || !shiftValidation.isValid}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A2F] hover:bg-[#152921] text-amber-100 rounded-xl text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Salvataggio...' : 'Conferma Nuovo Orario'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

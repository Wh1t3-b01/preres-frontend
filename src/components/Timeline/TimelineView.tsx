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
  Plus,
  Phone,
  Mail,
  User,
  Tag,
  Sparkles,
  Info,
} from 'lucide-react';
import { Reservation } from '../../types';

interface TimelineViewProps {
  onSelectTableForDetails: (tableId: string) => void;
  onOpenBookingForSlot?: (tableId: string, timeSlot: string) => void;
}

type ServiceShift = 'lunch' | 'dinner';
type StatusFilterType = 'all' | 'upcoming' | 'seated' | 'completed';

export const TimelineView: React.FC<TimelineViewProps> = ({
  onSelectTableForDetails,
  onOpenBookingForSlot,
}) => {
  const {
    tables,
    reservations,
    selectedDate,
    setSelectedDate,
    selectedTime,
    rescheduleReservation,
    seatReservation,
    freeTable,
  } = useRestaurant();

  // Shift: Lunch (12:00 - 15:00) vs Dinner (17:00 - 23:00)
  const initialShift: ServiceShift = useMemo(() => {
    const currentM = timeToMins(selectedTime);
    return currentM >= 17 * 60 ? 'dinner' : 'lunch';
  }, [selectedTime]);

  const [activeShift, setActiveShift] = useState<ServiceShift>(initialShift);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  // Selected reservation for Client Info & Time-Extension Modal
  const [activeShiftReservation, setActiveShiftReservation] = useState<Reservation | null>(null);
  const [proposedStartTime, setProposedStartTime] = useState<string>('');
  const [proposedTableId, setProposedTableId] = useState<string>('');
  const [proposedDurationMins, setProposedDurationMins] = useState<number>(120);
  const [isSaving, setIsSaving] = useState(false);

  // Drag & Drop State
  const [draggedRes, setDraggedRes] = useState<Reservation | null>(null);

  // Timeline configuration based on active shift
  const shiftConfig = useMemo(() => {
    if (activeShift === 'lunch') {
      return {
        startHour: 12,
        endHour: 15,
        startMins: 12 * 60,
        totalMins: 3 * 60,
        label: 'Pranzo',
        timeRange: '12:00 – 15:00',
        slots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
      };
    } else {
      return {
        startHour: 17,
        endHour: 23,
        startMins: 17 * 60,
        totalMins: 6 * 60,
        label: 'Cena',
        timeRange: '17:00 – 23:00',
        slots: [
          '17:00',
          '17:30',
          '18:00',
          '18:30',
          '19:00',
          '19:30',
          '20:00',
          '20:30',
          '21:00',
          '21:30',
          '22:00',
          '22:30',
          '23:00',
        ],
      };
    }
  }, [activeShift]);

  // Filter reservations for current day and shift
  const dayShiftReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.reservationDate !== selectedDate) return false;
      if (r.status === 'cancelled') return false;

      // Status filter
      if (statusFilter === 'upcoming' && r.status !== 'confirmed') return false;
      if (statusFilter === 'seated' && r.status !== 'seated') return false;
      if (statusFilter === 'completed' && r.status !== 'completed') return false;

      // Shift filter
      const resStartM = timeToMins(r.startTime);
      if (activeShift === 'lunch') {
        return resStartM >= 11 * 60 && resStartM < 16 * 60;
      } else {
        return resStartM >= 16 * 60;
      }
    });
  }, [reservations, selectedDate, activeShift, statusFilter]);

  // Compute calculated end time
  const proposedEndTime = useMemo(() => {
    if (!activeShiftReservation || !proposedStartTime) return '';
    const sMins = timeToMins(proposedStartTime);
    return minsToTime(sMins + proposedDurationMins);
  }, [activeShiftReservation, proposedStartTime, proposedDurationMins]);

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

  // Extend or shorten reservation duration (+15m / -15m) without moving the start time
  const handleModifyDuration = (deltaMins: number) => {
    setProposedDurationMins((prev) => Math.max(30, Math.min(300, prev + deltaMins)));
  };

  // Shift start time if needed
  const handleShiftStartTime = (deltaMins: number) => {
    if (!proposedStartTime) return;
    const currentM = timeToMins(proposedStartTime);
    const targetM = Math.max(12 * 60, Math.min(23.5 * 60, currentM + deltaMins));
    setProposedStartTime(minsToTime(targetM));
  };

  // Submit Reschedule & Duration Update
  const handleConfirmReschedule = async () => {
    if (!activeShiftReservation || !proposedStartTime) return;
    setIsSaving(true);
    try {
      const res = await rescheduleReservation(
        activeShiftReservation.id,
        proposedStartTime,
        selectedDate,
        proposedTableId !== activeShiftReservation.tableId ? proposedTableId : undefined,
        proposedDurationMins
      );

      if (res.success) {
        setActiveShiftReservation(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Click on empty slot on table track: automatically pre-fill slot & table
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>, tableId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetMins = shiftConfig.startMins + clickXRatio * shiftConfig.totalMins;
    const roundedMins = Math.floor(targetMins / 15) * 15;
    const clickedSlot = minsToTime(roundedMins);

    if (onOpenBookingForSlot) {
      onOpenBookingForSlot(tableId, clickedSlot);
    }
  };

  // Drag & Drop Handler on Timeline Track
  const handleTrackDrop = async (e: React.DragEvent<HTMLDivElement>, tableId: string) => {
    e.preventDefault();
    if (!draggedRes) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickXRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetMins = shiftConfig.startMins + clickXRatio * shiftConfig.totalMins;

    const roundedMins = Math.round(targetMins / 15) * 15;
    const newStartTime = minsToTime(roundedMins);

    await rescheduleReservation(
      draggedRes.id,
      newStartTime,
      selectedDate,
      tableId !== draggedRes.tableId ? tableId : undefined,
      draggedRes.durationMins
    );

    setDraggedRes(null);
  };

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-12 text-slate-100">
      {/* Header & Controls */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Title & Service Shift Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>Timeline Servizio</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 font-mono">
                {selectedDate}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Clicca su uno slot libero per prenotare · Clicca su un tavolo a sinistra per il riepilogo · Clicca sulla barra per info & durata
            </p>
          </div>

          {/* Service Shift Toggle: Pranzo vs Cena */}
          <div className="flex items-center bg-[#10141F] p-0.5 rounded-xl border border-[#242C3E] text-xs font-medium">
            <button
              onClick={() => setActiveShift('lunch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeShift === 'lunch'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Pranzo (12:00 – 15:00)</span>
            </button>
            <button
              onClick={() => setActiveShift('dinner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeShift === 'dinner'
                  ? 'bg-[#8B31E0] text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Cena (17:00 – 23:00)</span>
            </button>
          </div>
        </div>

        {/* Right Status Filter Bar */}
        <div className="flex items-center gap-1.5 bg-[#10141F] p-0.5 rounded-xl border border-[#242C3E] text-xs font-mono">
          {(['all', 'upcoming', 'seated', 'completed'] as StatusFilterType[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer capitalize ${
                statusFilter === st
                  ? 'bg-[#171D2B] text-white border border-[#273248] shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all'
                ? 'Tutti'
                : st === 'upcoming'
                ? 'In Arrivo'
                : st === 'seated'
                ? 'Seduti'
                : 'Completati'}
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE GRID CONTAINER */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Timeline Header Hour Track */}
        <div className="flex border-b border-[#222A3C] bg-[#161C2A] text-[10px] text-slate-400 font-mono select-none">
          <div className="w-40 sm:w-48 p-2.5 font-bold uppercase tracking-wider text-slate-300 border-r border-[#222A3C] shrink-0 flex items-center justify-between">
            <span>Tavolo & Capienza</span>
            <span className="text-[9px] text-[#C084FC] lowercase font-normal">(clicca)</span>
          </div>
          <div className="flex-1 relative flex">
            {shiftConfig.slots.map((slotTime) => (
              <div
                key={slotTime}
                className="flex-1 text-center py-2 border-r border-[#222A3C]/40 last:border-r-0 truncate"
              >
                {slotTime}
              </div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#202738] overflow-y-auto max-h-[620px]">
          {tables.map((table) => {
            const tableReservations = dayShiftReservations.filter(
              (r) =>
                r.tableId === table.id || (r.assignedTableIds && r.assignedTableIds.includes(table.id))
            );

            return (
              <div key={table.id} className="flex hover:bg-[#151A26] transition-colors group">
                {/* Table Info Left Cell - Clicking opens full table details & booking */}
                <div
                  onClick={() => onSelectTableForDetails(table.id)}
                  className="w-40 sm:w-48 p-2.5 border-r border-[#222A3C] flex items-center justify-between shrink-0 cursor-pointer bg-[#10141F]/60 hover:bg-[#171D2B] transition-colors group/cell"
                  title="Clicca per aprire la scheda tavolo con tutti i turni e prenotare"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white block truncate group-hover/cell:text-[#C084FC] transition-colors">
                        {table.name || `Tavolo ${table.tableNumber}`}
                      </span>
                      {tableReservations.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 font-bold shrink-0">
                          {tableReservations.length} {tableReservations.length === 1 ? 'pren' : 'pren'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Zona {table.zone.toUpperCase()} · {table.capacityOverride || table.capacity} pax
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 group-hover/cell:text-[#C084FC] shrink-0">
                    <Users className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                </div>

                {/* Time Track Visual Area */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleTrackDrop(e, table.id)}
                  onClick={(e) => handleTrackClick(e, table.id)}
                  className="flex-1 relative h-13 bg-[#0B0E17]/60 cursor-crosshair hover:bg-[#0E121B] transition-colors"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(36, 44, 62, 0.4) 1px, transparent 1px)',
                    backgroundSize: `${100 / (shiftConfig.slots.length - 1)}% 100%`,
                  }}
                  title="Clicca su uno slot libero per prenotare a quest'orario"
                >
                  {/* Reservation Blocks on Track */}
                  {tableReservations.map((res) => {
                    const resStartM = timeToMins(res.startTime);
                    const resEndM = timeToMins(res.endTime);

                    const startOffset = Math.max(0, resStartM - shiftConfig.startMins);
                    const durationMins = Math.max(30, resEndM - resStartM);

                    const leftPercent = Math.max(
                      0,
                      Math.min(100, (startOffset / shiftConfig.totalMins) * 100)
                    );
                    const widthPercent = Math.max(
                      6,
                      Math.min(100 - leftPercent, (durationMins / shiftConfig.totalMins) * 100)
                    );

                    const isSeated = res.status === 'seated';
                    const isCompleted = res.status === 'completed';

                    return (
                      <div
                        key={res.id}
                        draggable
                        onDragStart={() => setDraggedRes(res)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveShiftReservation(res);
                          setProposedStartTime(res.startTime);
                          setProposedTableId(res.tableId);
                          setProposedDurationMins(res.durationMins || 120);
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded-xl px-2.5 py-1 text-xs flex items-center justify-between overflow-hidden shadow-sm cursor-pointer transition-all hover:scale-[1.01] hover:z-20 border select-none ${
                          isSeated
                            ? 'bg-[#059669]/25 border-[#059669]/70 text-white shadow-[0_0_12px_rgba(5,150,105,0.25)]'
                            : isCompleted
                            ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                            : 'bg-[#8B31E0]/25 border-[#8B31E0]/70 text-white shadow-[0_0_12px_rgba(139,49,224,0.25)]'
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        title={`${res.guestName} (${res.partySize}p) · ${res.startTime} - ${res.endTime} (${res.durationMins}m). Clicca per info e allungare/accorciare durata.`}
                      >
                        <div className="truncate flex items-center gap-1.5 leading-none">
                          <span className="font-semibold text-xs truncate">
                            {res.guestName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-300 shrink-0 font-bold">
                            ({res.partySize}p)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1 font-mono text-[10px]">
                          <span className="font-bold text-white/90">
                            {res.startTime}–{res.endTime}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300">
                            {res.durationMins}m
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

      {/* DEDICATED RESERVATION DETAILS & DURATION EXTENSION MODAL */}
      {activeShiftReservation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3C]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {activeShiftReservation.guestName}
                  </h3>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      activeShiftReservation.status === 'seated'
                        ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/40'
                        : activeShiftReservation.status === 'confirmed'
                        ? 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {activeShiftReservation.status === 'seated'
                      ? 'Seduto'
                      : activeShiftReservation.status === 'confirmed'
                      ? 'Confermato'
                      : activeShiftReservation.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {activeShiftReservation.partySize} ospiti · Tavolo {activeShiftReservation.tableId} · Codice: {activeShiftReservation.bookingCode}
                </p>
              </div>
              <button
                onClick={() => setActiveShiftReservation(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Quick Guest Contact & Notes summary */}
            {(activeShiftReservation.guestPhone || activeShiftReservation.guestEmail || activeShiftReservation.notes) && (
              <div className="bg-[#10141F] border border-[#242C3E] rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                  {activeShiftReservation.guestPhone && (
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-[#C084FC]" />
                      <span>{activeShiftReservation.guestPhone}</span>
                    </span>
                  )}
                  {activeShiftReservation.guestEmail && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Mail className="w-3 h-3 text-[#C084FC]" />
                      <span>{activeShiftReservation.guestEmail}</span>
                    </span>
                  )}
                </div>
                {activeShiftReservation.notes && (
                  <p className="text-slate-300 text-[11px] pt-1 border-t border-[#222A3C] italic">
                    Note: "{activeShiftReservation.notes}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* DURATION MODIFIER: +15m / -15m (EXTENDS/SHORTENS ONLY END TIME!) */}
              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#C084FC] stroke-[1.5]" />
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Durata Servizio al Tavolo
                    </label>
                  </div>
                  <span className="font-mono font-bold text-sm text-[#34D399] bg-[#10141F] px-2.5 py-0.5 rounded-lg border border-[#242C3E]">
                    {proposedDurationMins} minuti
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                  Se il tavolo prolunga il soggiorno o ordina altre portate, allunga la fine senza spostare l'orario d'inizio.
                </p>

                {/* Duration Stepper Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleModifyDuration(-15)}
                    className="py-2 px-3 bg-[#10141F] hover:bg-[#20273A] border border-[#242C3E] hover:border-amber-400 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <span>-15 min</span>
                    <span className="text-[10px] text-slate-400">(Tavolo Rapido)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyDuration(15)}
                    className="py-2 px-3 bg-[#8B31E0]/20 hover:bg-[#8B31E0]/30 border border-[#8B31E0]/50 hover:border-[#8B31E0] text-[#E9D5FF] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span>+15 min</span>
                    <span className="text-[10px] text-[#C084FC] font-normal">(Tavolo Prolungato)</span>
                  </button>
                </div>

                {/* Quick Presets for Duration */}
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  {[45, 60, 90, 120, 150, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setProposedDurationMins(mins)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-semibold transition cursor-pointer ${
                        proposedDurationMins === mins
                          ? 'bg-[#8B31E0] text-white shadow-xs'
                          : 'bg-[#10141F] text-slate-400 hover:text-white border border-[#242C3E]'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Time Adjustment */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Orario di Inizio Prenotazione
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShiftStartTime(-15)}
                    className="px-3 py-2 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-200 rounded-xl font-mono text-xs cursor-pointer active:scale-95"
                  >
                    -15m
                  </button>
                  <input
                    type="time"
                    value={proposedStartTime}
                    onChange={(e) => setProposedStartTime(e.target.value)}
                    className="flex-1 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                  <button
                    type="button"
                    onClick={() => handleShiftStartTime(15)}
                    className="px-3 py-2 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-200 rounded-xl font-mono text-xs cursor-pointer active:scale-95"
                  >
                    +15m
                  </button>
                </div>
              </div>

              {/* Table Switcher */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tavolo Assegnato
                </label>
                <select
                  value={proposedTableId}
                  onChange={(e) => setProposedTableId(e.target.value)}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0] cursor-pointer"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tavolo {t.tableNumber} ({t.capacityOverride || t.capacity} pax) · Zona {t.zone.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Window Summary */}
              <div className="p-3 bg-[#10141F] border border-[#242C3E] rounded-xl text-xs text-slate-300 font-mono flex items-center justify-between">
                <span>
                  Finestra: <strong className="text-white">{proposedStartTime} – {proposedEndTime}</strong>
                </span>
                <span className="text-[#34D399] font-bold">
                  Totale: {proposedDurationMins}m
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#222A3C]">
              {activeShiftReservation.status === 'confirmed' ? (
                <button
                  type="button"
                  onClick={() => {
                    seatReservation(activeShiftReservation.id);
                    setActiveShiftReservation(null);
                  }}
                  className="px-3 py-2 bg-[#059669]/20 hover:bg-[#059669]/30 text-[#34D399] border border-[#059669]/40 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Accomoda al Tavolo
                </button>
              ) : activeShiftReservation.status === 'seated' ? (
                <button
                  type="button"
                  onClick={() => {
                    freeTable(activeShiftReservation.tableId);
                    setActiveShiftReservation(null);
                  }}
                  className="px-3 py-2 bg-[#059669]/20 hover:bg-[#059669]/30 text-[#34D399] border border-[#059669]/40 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Libera Tavolo
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveShiftReservation(null)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmReschedule}
                  className="px-5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs shadow-md shadow-[#8B31E0]/25 transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

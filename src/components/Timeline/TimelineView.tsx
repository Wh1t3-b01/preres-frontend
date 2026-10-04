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
  } = useRestaurant();

  // Shift: Lunch (12:00 - 15:00) vs Dinner (17:00 - 23:00)
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
        slots: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
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
    return minsToTime(sMins + activeShiftReservation.durationMins);
  }, [activeShiftReservation, proposedStartTime]);

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

  // Submit Reschedule
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
    <div className="space-y-5 max-w-[1780px] mx-auto pb-12 text-slate-100">
      {/* Header & Controls */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        
        {/* Title & Service Shift Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Timeline Servizio
            </h2>
            <p className="text-[11px] text-slate-400">
              Trascina o clicca sui blocchi per riprogrammare gli orari e cambiare tavolo
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
              {st === 'all' ? 'Tutti' : st === 'upcoming' ? 'In Arrivo' : st === 'seated' ? 'Seduti' : 'Completati'}
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE GRID CONTAINER */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Timeline Header Hour Track */}
        <div className="flex border-b border-[#222A3C] bg-[#161C2A] text-[10px] text-slate-400 font-mono select-none">
          <div className="w-36 sm:w-44 p-2.5 font-bold uppercase tracking-wider text-slate-300 border-r border-[#222A3C] shrink-0">
            Tavolo & Capienza
          </div>
          <div className="flex-1 relative flex">
            {shiftConfig.slots.map((slotTime, idx) => (
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
        <div className="divide-y divide-[#202738] overflow-y-auto max-h-[600px]">
          {tables.map((table) => {
            const tableReservations = dayShiftReservations.filter(
              (r) =>
                r.tableId === table.id || (r.assignedTableIds && r.assignedTableIds.includes(table.id))
            );

            return (
              <div key={table.id} className="flex hover:bg-[#151A26] transition-colors group">
                {/* Table Info Left Cell */}
                <div
                  onClick={() => onSelectTableForDetails(table.id)}
                  className="w-36 sm:w-44 p-2.5 border-r border-[#222A3C] flex items-center justify-between shrink-0 cursor-pointer bg-[#10141F]/40 group-hover:bg-[#171D2B]"
                >
                  <div className="truncate">
                    <span className="font-bold text-xs text-white block truncate">
                      {table.name || `Tavolo ${table.tableNumber}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Zona {table.zone.toUpperCase()} · {table.capacityOverride || table.capacity} pax
                    </span>
                  </div>
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0 stroke-[1.5]" />
                </div>

                {/* Time Track Visual Area */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleTrackDrop(e, table.id)}
                  className="flex-1 relative h-12 bg-[#0B0E17]/60"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(36, 44, 62, 0.4) 1px, transparent 1px)',
                    backgroundSize: `${100 / (shiftConfig.slots.length - 1)}% 100%`,
                  }}
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
                      5,
                      Math.min(100 - leftPercent, (durationMins / shiftConfig.totalMins) * 100)
                    );

                    const isSeated = res.status === 'seated';
                    const isCompleted = res.status === 'completed';

                    return (
                      <div
                        key={res.id}
                        draggable
                        onDragStart={() => setDraggedRes(res)}
                        onClick={() => {
                          setActiveShiftReservation(res);
                          setProposedStartTime(res.startTime);
                          setProposedTableId(res.tableId);
                        }}
                        className={`absolute top-1 bottom-1 rounded-xl p-1.5 text-xs flex items-center justify-between overflow-hidden shadow-xs cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] hover:z-20 border ${
                          isSeated
                            ? 'bg-[#059669]/25 border-[#059669]/60 text-white shadow-[0_0_12px_rgba(5,150,105,0.2)]'
                            : isCompleted
                            ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                            : 'bg-[#8B31E0]/25 border-[#8B31E0]/60 text-white shadow-[0_0_12px_rgba(139,49,224,0.2)]'
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        <div className="truncate flex items-center gap-1 leading-none">
                          <span className="font-semibold text-[11px] truncate">
                            {res.guestName}
                          </span>
                          <span className="text-[9px] font-mono text-slate-300 shrink-0">
                            ({res.partySize}p)
                          </span>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 ml-1 font-semibold">
                          {res.startTime}
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

      {/* RESCHEDULE / TIME-SHIFT MODAL */}
      {activeShiftReservation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#121622] border border-[#273248] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3C]">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Riprogramma Orario / Tavolo
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {activeShiftReservation.guestName} ({activeShiftReservation.partySize} pax)
                </p>
              </div>
              <button
                onClick={() => setActiveShiftReservation(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Time Stepper */}
              <div>
                <label className="block text-[10px] font-medium text-slate-300 mb-1">
                  Orario Inizio Servizio
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShiftMinutes(-15)}
                    className="px-3 py-1.5 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-200 rounded-xl font-mono text-xs cursor-pointer"
                  >
                    -15m
                  </button>
                  <input
                    type="time"
                    value={proposedStartTime}
                    onChange={(e) => setProposedStartTime(e.target.value)}
                    className="flex-1 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                  <button
                    onClick={() => handleShiftMinutes(15)}
                    className="px-3 py-1.5 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-200 rounded-xl font-mono text-xs cursor-pointer"
                  >
                    +15m
                  </button>
                </div>
              </div>

              {/* Table Switcher */}
              <div>
                <label className="block text-[10px] font-medium text-slate-300 mb-1">
                  Tavolo Assegnato
                </label>
                <select
                  value={proposedTableId}
                  onChange={(e) => setProposedTableId(e.target.value)}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0] cursor-pointer"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tavolo {t.tableNumber} ({t.capacityOverride || t.capacity} pax) · Zona {t.zone.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="p-2.5 bg-[#10141F] border border-[#242C3E] rounded-xl text-[11px] text-slate-300 font-mono flex items-center justify-between">
                <span>Orario: {proposedStartTime} – {proposedEndTime}</span>
                <span className="text-[#34D399] font-bold">Durata: {activeShiftReservation.durationMins}m</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222A3C]">
              <button
                onClick={() => setActiveShiftReservation(null)}
                className="px-3.5 py-1.5 text-slate-400 hover:text-white"
              >
                Annulla
              </button>
              <button
                disabled={isSaving}
                onClick={() => handleConfirmReschedule(false)}
                className="px-4 py-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Salvataggio...' : 'Conferma Modifica'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

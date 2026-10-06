import React, { useState, useMemo, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { guestCrmService } from '../../services/guestCrmService';
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
  Crown,
  Heart,
  Search,
  ListFilter,
  LayoutGrid,
  Columns,
  Printer,
  Trash2,
  Check,
  UserCheck,
  XCircle,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Reservation, ReservationStatus } from '../../types';

interface TimelineViewProps {
  onSelectTableForDetails: (tableId: string) => void;
  onOpenBookingForSlot?: (tableId: string, timeSlot: string) => void;
  onOpenBookingModal?: () => void;
  defaultMode?: 'timeline' | 'list' | 'split';
}

type ServiceShift = 'lunch' | 'dinner' | 'all';
type StatusFilterType = 'all' | 'upcoming' | 'seated' | 'completed' | 'vip';
type ViewLayoutMode = 'timeline' | 'list' | 'split';

export const TimelineView: React.FC<TimelineViewProps> = ({
  onSelectTableForDetails,
  onOpenBookingForSlot,
  onOpenBookingModal,
  defaultMode = 'timeline',
}) => {
  const {
    tables,
    reservations,
    selectedDate,
    setSelectedDate,
    selectedTime,
    rescheduleReservation,
    seatReservation,
    completeReservation,
    cancelReservation,
    deleteReservation,
    clearCompletedReservations,
    freeTable,
  } = useRestaurant();

  // Layout mode: timeline (default/priority), list, or split
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>(defaultMode);

  // Synchronize layout mode if defaultMode prop changes
  useEffect(() => {
    if (defaultMode) {
      setLayoutMode(defaultMode);
    }
  }, [defaultMode]);

  // Shift: Lunch (12:00 - 15:00) vs Dinner (17:00 - 23:00) vs All Day
  const initialShift: ServiceShift = useMemo(() => {
    const currentM = timeToMins(selectedTime);
    return currentM >= 17 * 60 ? 'dinner' : 'lunch';
  }, [selectedTime]);

  const [activeShift, setActiveShift] = useState<ServiceShift>(initialShift);

  useEffect(() => {
    if (activeShift !== 'all') {
      setActiveShift(initialShift);
    }
  }, [initialShift]);

  // Universal Search and Status Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  // Selected reservation for Client Info & Time-Extension Modal
  const [activeShiftReservation, setActiveShiftReservation] = useState<Reservation | null>(null);
  const [proposedStartTime, setProposedStartTime] = useState<string>('');
  const [proposedTableId, setProposedTableId] = useState<string>('');
  const [proposedDurationMins, setProposedDurationMins] = useState<number>(120);
  const [isSaving, setIsSaving] = useState(false);

  // Drag & Drop State
  const [draggedRes, setDraggedRes] = useState<Reservation | null>(null);

  // Shift configuration for the visual Gantt timeline
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
    } else if (activeShift === 'dinner') {
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
    } else {
      // Full day span 11:00 - 23:30
      return {
        startHour: 11,
        endHour: 23.5,
        startMins: 11 * 60,
        totalMins: 12.5 * 60,
        label: 'Tutto il Giorno',
        timeRange: '11:00 – 23:30',
        slots: [
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '15:00',
          '16:00',
          '17:00',
          '18:00',
          '19:00',
          '20:00',
          '21:00',
          '22:00',
          '23:00',
        ],
      };
    }
  }, [activeShift]);

  // Master filtered list of reservations for current date, search, shift & status
  const filteredReservations = useMemo(() => {
    return reservations
      .filter((r) => {
        if (r.reservationDate !== selectedDate) return false;

        // Search query
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = r.guestName.toLowerCase().includes(q);
          const matchCode = r.bookingCode.toLowerCase().includes(q);
          const matchPhone = r.guestPhone?.toLowerCase().includes(q) || false;
          const matchTable = r.tableId.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchPhone && !matchTable) return false;
        }

        // Shift filter
        const resStartM = timeToMins(r.startTime);
        if (activeShift === 'lunch') {
          if (resStartM < 11 * 60 || resStartM >= 16 * 60) return false;
        } else if (activeShift === 'dinner') {
          if (resStartM < 16 * 60) return false;
        }

        // Status filter
        if (statusFilter === 'upcoming' && r.status !== 'confirmed') return false;
        if (statusFilter === 'seated' && r.status !== 'seated') return false;
        if (statusFilter === 'completed' && r.status !== 'completed') return false;
        if (statusFilter === 'vip') {
          const guest = guestCrmService.getProfileByNameOrPhone(r.guestName, r.guestPhone);
          const isVip = guest?.vipTier && guest.vipTier !== 'regular';
          const isAlert = guest?.attentionAlert?.isAttentionRequired;
          if (!isVip && !isAlert && !r.tags?.includes('VIP')) return false;
        }

        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [reservations, selectedDate, searchTerm, activeShift, statusFilter]);

  // Day shift reservations for Timeline Gantt (excludes cancelled)
  const timelineDayReservations = useMemo(() => {
    return filteredReservations.filter((r) => r.status !== 'cancelled');
  }, [filteredReservations]);

  // Aggregate Key Performance Indicators for the shift
  const totalCovers = filteredReservations.reduce((sum, r) => sum + r.partySize, 0);
  const seatedCovers = filteredReservations
    .filter((r) => r.status === 'seated')
    .reduce((sum, r) => sum + r.partySize, 0);
  const upcomingCount = filteredReservations.filter((r) => r.status === 'confirmed').length;
  const completedCount = reservations.filter(
    (r) => r.reservationDate === selectedDate && (r.status === 'completed' || r.status === 'cancelled')
  ).length;

  // Calculated end time for active modal
  const proposedEndTime = useMemo(() => {
    if (!activeShiftReservation || !proposedStartTime) return '';
    const sMins = timeToMins(proposedStartTime);
    return minsToTime(sMins + proposedDurationMins);
  }, [activeShiftReservation, proposedStartTime, proposedDurationMins]);

  // Slot capacity check
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

  const handleModifyDuration = (deltaMins: number) => {
    setProposedDurationMins((prev) => Math.max(30, Math.min(300, prev + deltaMins)));
  };

  const handleShiftStartTime = (deltaMins: number) => {
    if (!proposedStartTime) return;
    const currentM = timeToMins(proposedStartTime);
    const targetM = Math.max(11 * 60, Math.min(23.5 * 60, currentM + deltaMins));
    setProposedStartTime(minsToTime(targetM));
  };

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

  const handlePrint = () => {
    window.print();
  };

  const handleClearCompleted = () => {
    if (
      confirm(
        `Vuoi eliminare definitivamente tutte le ${completedCount} prenotazioni completate/annullate del ${selectedDate}?`
      )
    ) {
      clearCompletedReservations(selectedDate);
    }
  };

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-12 text-slate-100 animate-in fade-in duration-200">
      
      {/* 1. TOP CONTROL & UNIFIED PLANNING BAR */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Left: Title & Shift Selector */}
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B31E0]/20 border border-[#8B31E0]/40 text-[#C084FC] flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-brand font-bold text-white tracking-tight">
                  Planning & Timeline Tavoli
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 px-2.5 py-0.5 rounded-full font-mono">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gantt occupazione sale, gestione rapida orari e registro prenotazioni unificato.
              </p>
            </div>
          </div>

          {/* Shift Switcher: Pranzo vs Cena vs Tutto il Giorno */}
          <div className="flex items-center bg-[#10141F] p-0.5 rounded-2xl border border-[#242C3E] text-xs font-semibold">
            <button
              onClick={() => setActiveShift('lunch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeShift === 'lunch'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Pranzo (12–15)</span>
            </button>
            <button
              onClick={() => setActiveShift('dinner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeShift === 'dinner'
                  ? 'bg-[#8B31E0] text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Cena (17–23)</span>
            </button>
            <button
              onClick={() => setActiveShift('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeShift === 'all'
                  ? 'bg-slate-700 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Tutto il Giorno</span>
            </button>
          </div>
        </div>

        {/* Right: Layout Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          
          {/* View Layout Mode (Timeline Gantt priority vs List vs Split) */}
          <div className="flex items-center bg-[#10141F] p-1 rounded-2xl border border-[#242C3E]">
            <button
              onClick={() => setLayoutMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                layoutMode === 'timeline'
                  ? 'bg-[#8B31E0] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualizzazione Gantt Timeline (Consigliata)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Timeline Gantt</span>
            </button>
            <button
              onClick={() => setLayoutMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                layoutMode === 'split'
                  ? 'bg-[#8B31E0] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Divisa: Timeline in alto + Elenco Arrivi in basso"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Vista Divisa</span>
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                layoutMode === 'list'
                  ? 'bg-[#8B31E0] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualizzazione Tabellare Dettagliata"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Vista Lista</span>
            </button>
          </div>

          {/* New Booking Button */}
          {onOpenBookingModal && (
            <button
              onClick={onOpenBookingModal}
              className="px-4 py-2 bg-gradient-to-r from-[#8B31E0] to-[#6E20C0] hover:from-[#9D44F7] hover:to-[#8B31E0] text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#8B31E0]/25 transition cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Prenotazione</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="p-2.5 bg-[#171D2B] hover:bg-[#222A3C] border border-[#273248] text-slate-300 hover:text-white rounded-2xl text-xs font-semibold transition cursor-pointer"
            title="Stampa Run Sheet / Foglio di Sala"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SEARCH, STATUS FILTERS & SHIFT KPI STATS BAR */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca per nome, telefono, tavolo o codice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#10141F] border border-[#242C3E] rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto bg-[#10141F] p-1 rounded-2xl border border-[#242C3E] text-xs font-mono">
          {[
            { id: 'all' as const, label: 'Tutte' },
            { id: 'upcoming' as const, label: 'In Arrivo' },
            { id: 'seated' as const, label: 'Seduti' },
            { id: 'completed' as const, label: 'Completati' },
            { id: 'vip' as const, label: 'VIP / Alert' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap font-bold ${
                statusFilter === st.id
                  ? 'bg-[#171D2B] text-white border border-[#273248] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <span className="bg-[#171D2B] border border-[#242C3E] px-3 py-1.5 rounded-xl text-slate-300">
            Coperti: <strong className="text-white">{totalCovers}</strong>
          </span>
          <span className="bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-emerald-300">
            Seduti: <strong className="text-emerald-400">{seatedCovers}</strong>
          </span>
          <span className="bg-[#8B31E0]/20 border border-[#8B31E0]/40 px-3 py-1.5 rounded-xl text-[#C084FC]">
            In Arrivo: <strong>{upcomingCount}</strong>
          </span>
        </div>
      </div>

      {/* 3. TIMELINE GANTT VIEW (PRIORITY RENDER) */}
      {(layoutMode === 'timeline' || layoutMode === 'split') && (
        <div className="bg-[#121622] border border-[#222A3C] rounded-3xl shadow-xl overflow-hidden flex flex-col animate-in fade-in">
          
          {/* Header Hour Track */}
          <div className="flex border-b border-[#222A3C] bg-[#161C2A] text-[10px] text-slate-400 font-mono select-none">
            <div className="w-40 sm:w-48 p-3 font-bold uppercase tracking-wider text-slate-300 border-r border-[#222A3C] shrink-0 flex items-center justify-between">
              <span>Tavolo & Capienza</span>
              <span className="text-[9px] text-[#C084FC] lowercase font-normal">(scheda)</span>
            </div>
            <div className="flex-1 relative flex">
              {shiftConfig.slots.map((slotTime) => (
                <div
                  key={slotTime}
                  className="flex-1 text-center py-2.5 border-r border-[#222A3C]/40 last:border-r-0 truncate font-semibold text-slate-300"
                >
                  {slotTime}
                </div>
              ))}
            </div>
          </div>

          {/* Table Rows Gantt Container */}
          <div className="divide-y divide-[#202738] overflow-y-auto max-h-[580px]">
            {tables.map((table) => {
              const tableReservations = timelineDayReservations.filter(
                (r) =>
                  r.tableId === table.id || (r.assignedTableIds && r.assignedTableIds.includes(table.id))
              );

              return (
                <div key={table.id} className="flex hover:bg-[#151A26] transition-colors group">
                  
                  {/* Table Info Left Cell */}
                  <div
                    onClick={() => onSelectTableForDetails(table.id)}
                    className="w-40 sm:w-48 p-2.5 border-r border-[#222A3C] flex items-center justify-between shrink-0 cursor-pointer bg-[#10141F]/60 hover:bg-[#171D2B] transition-colors group/cell"
                    title="Clicca per aprire la scheda tavolo con tutti i turni"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white block truncate group-hover/cell:text-[#C084FC] transition-colors">
                          {table.name || `Tavolo ${table.tableNumber}`}
                        </span>
                        {tableReservations.length > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 font-bold shrink-0">
                            {tableReservations.length} pren
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

                      const guestProfile = guestCrmService.getProfileByNameOrPhone(
                        res.guestName,
                        res.guestPhone
                      );
                      const isVip = guestProfile?.vipTier && guestProfile.vipTier !== 'regular';
                      const isAlert = guestProfile?.attentionAlert?.isAttentionRequired;

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
                            {isAlert ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : isVip ? (
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : null}
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
      )}

      {/* 4. TABULAR LIST VIEW (INTEGRATED LIST MODE & SPLIT MODE) */}
      {(layoutMode === 'list' || layoutMode === 'split') && (
        <div className="bg-[#121622] border border-[#222A3C] rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#222A3C] pb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-[#C084FC]" />
                <span>Registro Tabellare Prenotazioni ({filteredReservations.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Lista ordinata cronologicamente con azioni rapide di sala, contatti e gestione coperti.
              </p>
            </div>

            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina Completate ({completedCount})</span>
              </button>
            )}
          </div>

          {filteredReservations.length === 0 ? (
            <div className="p-8 text-center bg-[#10141F] rounded-2xl border border-[#242C3E] text-slate-400 text-xs">
              Nessuna prenotazione trovata per la data e i filtri selezionati.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171D2B] text-slate-400 uppercase text-[10px] border-b border-[#242C3E]">
                  <tr>
                    <th className="py-2.5 px-3">Orario & Durata</th>
                    <th className="py-2.5 px-3">Tavolo</th>
                    <th className="py-2.5 px-3">Ospite / VIP</th>
                    <th className="py-2.5 px-3">Coperti</th>
                    <th className="py-2.5 px-3">Contatto & Note</th>
                    <th className="py-2.5 px-3">Stato</th>
                    <th className="py-2.5 px-3 text-right">Azioni Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222A3C]">
                  {filteredReservations.map((res) => {
                    const guest = guestCrmService.getProfileByNameOrPhone(
                      res.guestName,
                      res.guestPhone
                    );
                    const isVip = guest?.vipTier && guest.vipTier !== 'regular';
                    const isAlert = guest?.attentionAlert?.isAttentionRequired;

                    return (
                      <tr key={res.id} className="hover:bg-[#171D2B]/50 transition">
                        {/* Orario */}
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-white block">
                            {res.startTime} – {res.endTime}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Durata: {res.durationMins || 120} min
                          </span>
                        </td>

                        {/* Tavolo */}
                        <td className="py-3 px-3">
                          <button
                            onClick={() => onSelectTableForDetails(res.tableId)}
                            className="px-2.5 py-1 bg-[#10141F] hover:bg-[#8B31E0]/20 text-[#C084FC] border border-[#242C3E] hover:border-[#8B31E0] rounded-xl font-mono font-bold text-xs transition cursor-pointer"
                          >
                            Tav. {res.tableId}
                          </button>
                        </td>

                        {/* Ospite */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {isAlert && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
                            {isVip && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                            <span className="font-bold text-white">{res.guestName}</span>
                          </div>
                          {res.bookingCode && (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Cod: {res.bookingCode}
                            </span>
                          )}
                        </td>

                        {/* Coperti */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          {res.partySize} pax
                        </td>

                        {/* Contatto & Note */}
                        <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate">
                          {res.guestPhone && (
                            <span className="block font-mono text-[11px] text-slate-300">
                              {res.guestPhone}
                            </span>
                          )}
                          {res.notes && (
                            <span className="text-[10px] italic text-slate-400 block truncate">
                              "{res.notes}"
                            </span>
                          )}
                        </td>

                        {/* Stato */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              res.status === 'seated'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : res.status === 'confirmed'
                                ? 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                                : res.status === 'completed'
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-rose-950/60 text-rose-400 border-rose-800'
                            }`}
                          >
                            {res.status === 'seated'
                              ? 'Seduto'
                              : res.status === 'confirmed'
                              ? 'In Arrivo'
                              : res.status === 'completed'
                              ? 'Completato'
                              : 'Annullato'}
                          </span>
                        </td>

                        {/* Azioni */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {res.status === 'confirmed' && (
                              <button
                                onClick={() => seatReservation(res.id)}
                                className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-xl text-[11px] font-semibold transition cursor-pointer"
                                title="Accomoda al tavolo"
                              >
                                Accomoda
                              </button>
                            )}

                            {res.status === 'seated' && (
                              <button
                                onClick={() => completeReservation(res.id)}
                                className="px-2.5 py-1 bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded-xl text-[11px] font-semibold transition cursor-pointer"
                                title="Libera tavolo / Completa"
                              >
                                Completa
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setActiveShiftReservation(res);
                                setProposedStartTime(res.startTime);
                                setProposedTableId(res.tableId);
                                setProposedDurationMins(res.durationMins || 120);
                              }}
                              className="px-2.5 py-1 bg-[#171D2B] hover:bg-[#222A3C] text-slate-300 hover:text-white border border-[#273248] rounded-xl text-[11px] font-semibold transition cursor-pointer"
                              title="Modifica orario e durata (+15m / -15m)"
                            >
                              Durata / Info
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. DEDICATED RESERVATION DETAILS & DURATION EXTENSION MODAL */}
      {activeShiftReservation && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
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

            {/* VIP & Attention Alert for Active Reservation */}
            {(() => {
              const matchedGuest =
                (activeShiftReservation.guestProfileId
                  ? guestCrmService.getProfileById(activeShiftReservation.guestProfileId)
                  : undefined) ||
                guestCrmService.getProfileByNameOrPhone(
                  activeShiftReservation.guestName,
                  activeShiftReservation.guestPhone
                );

              if (!matchedGuest) return null;

              return (
                <div className="space-y-2">
                  {matchedGuest.attentionAlert?.isAttentionRequired && (
                    <div
                      className={`p-3 rounded-2xl border-2 text-xs space-y-1 ${
                        matchedGuest.attentionAlert.alertColor === 'red'
                          ? 'bg-rose-950/40 border-rose-600/70 text-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.2)]'
                          : 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200 shadow-[0_0_12px_rgba(5,150,105,0.2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          {matchedGuest.attentionAlert.alertColor === 'red' ? (
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                          )}
                          <span>
                            {matchedGuest.attentionAlert.alertColor === 'red'
                              ? '🚨 ALERT MANAGER (OSPITE CRITICO / DA ATTENZIONARE)'
                              : '🌟 NOTA SPECIALE (VIP / ACCOGLIENZA DEDICATA)'}
                          </span>
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-black/40 text-[9px]">
                          {matchedGuest.attentionAlert.alertColor === 'red' ? 'ROSSO' : 'VERDE'}
                        </span>
                      </div>
                      <p className="text-white font-medium text-xs">
                        "{matchedGuest.attentionAlert.reason}"
                      </p>
                    </div>
                  )}

                  {matchedGuest.enableTopSpenderAlert && (
                    <div className="p-2.5 rounded-2xl border-2 border-amber-500/60 bg-amber-950/30 text-amber-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <div>
                          <strong className="text-amber-300 font-bold block text-xs">
                            VIP Top Spender (Spesa media: €{matchedGuest.avgSpend}/coperto ≥ 130€)
                          </strong>
                          <span className="text-[10px] text-slate-300">
                            Supera il doppio della soglia base (65€ x 2 = 130€).
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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

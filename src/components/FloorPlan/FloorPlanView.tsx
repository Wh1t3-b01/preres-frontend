import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { SpatialZoneCanvas } from './SpatialZoneCanvas';
import { AddTableModal } from '../Modals/AddTableModal';
import { TableZone, Reservation } from '../../types';
import {
  Layers,
  X,
  Wine,
  UtensilsCrossed,
  Shield,
  Plus,
  Sliders,
  Users,
  Bell,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Move,
  Send,
  Footprints,
  Calendar,
  Clock,
  Sparkles,
  Filter,
  CheckCircle2,
  Coffee,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

interface FloorPlanViewProps {
  onSelectTableForDetails: (tableId: string) => void;
  onOpenBookingModalWithTables?: (tableIds: string[]) => void;
  onOpenBohEditor?: () => void;
  onOpenServerSections?: () => void;
  onOpenWaitlist?: () => void;
}

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  onSelectTableForDetails,
  onOpenBookingModalWithTables,
  onOpenBohEditor,
  onOpenServerSections,
  onOpenWaitlist,
}) => {
  const {
    tables,
    reservations,
    waitlist,
    tableGroups,
    selectedDate,
    selectedTime,
    selectedTableIds,
    clearTableSelection,
    mergeTables,
    unmergeTables,
    seatReservation,
    freeTable,
    quickSeatWalkIn,
    updateReservation,
    transferTable,
    theme,
    activeFloorPlanName,
    addToast,
  } = useRestaurant();

  const isLight = theme === 'light';

  // Zone filter
  const [activeZoneFilter, setActiveZoneFilter] = useState<'all' | TableZone>('all');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [addTableZone, setAddTableZone] = useState<TableZone>('main_a');

  // Single Scrollable Column Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [columnTabFilter, setColumnTabFilter] = useState<'all' | 'upcoming' | 'seated' | 'waitlist'>('all');

  // Quick Buttons Popovers / Drawers State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProblemsOpen, setIsProblemsOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInPartySize, setWalkInPartySize] = useState(2);
  const [walkInGuestName, setWalkInGuestName] = useState('');
  const [walkInTableId, setWalkInTableId] = useState('');

  // Tables separated by modern zoning
  const barTables = tables.filter((t) => t.zone === 'bar');
  const privateTables = tables.filter((t) => t.zone === 'private');

  // MAIN A & B
  const mainATables = tables.filter(
    (t) => t.zone === 'main_a' || (t.zone === 'main' && ['G', '10', '11', '12', '20', '21'].includes(t.id))
  );

  const mainBTables = tables.filter(
    (t) =>
      t.zone === 'main_b' ||
      (t.zone === 'main' && ['13', '14', '15', '16', '22', '23'].includes(t.id))
  );

  // Active groups for currently selected date
  const activeDateGroups = tableGroups.filter((g) => g.groupDate === selectedDate);

  // Selected tables capacity sum
  const selectedTablesList = tables.filter((t) => selectedTableIds.includes(t.id));
  const selectedTotalCapacity = selectedTablesList.reduce(
    (sum, t) => sum + (t.capacityOverride || t.capacity),
    0
  );

  // Day reservations for the active shift
  const dayReservations = useMemo(() => {
    return reservations
      .filter((r) => r.reservationDate === selectedDate && r.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [reservations, selectedDate]);

  // Seated & available tables
  const seatedTableIds = useMemo(() => {
    const ids = new Set<string>();
    dayReservations.filter((r) => r.status === 'seated').forEach((r) => {
      if (r.tableId) ids.add(r.tableId);
      if (r.assignedTableIds) r.assignedTableIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [dayReservations]);

  const availableTables = useMemo(() => {
    return tables.filter((t) => !seatedTableIds.has(t.id));
  }, [tables, seatedTableIds]);

  // Waiting count
  const waitingGuests = useMemo(() => {
    return waitlist.filter((w) => w.status === 'waiting' || w.status === 'notified');
  }, [waitlist]);

  // Problem Reservations (unassigned table, late arrivals > 15m, turn duration warnings)
  const problemReservations = useMemo(() => {
    return dayReservations.filter((r) => {
      // Unassigned table
      if (r.status === 'confirmed' && (!r.tableId || r.tableId === 'unassigned')) return true;
      // High party size on small table
      const assignedTable = tables.find((t) => t.id === r.tableId);
      if (assignedTable && r.partySize > (assignedTable.capacityOverride || assignedTable.capacity)) {
        return true;
      }
      return false;
    });
  }, [dayReservations, tables]);

  // Single Scrollable Column items
  const scrollableListItems = useMemo(() => {
    if (columnTabFilter === 'waitlist') {
      return waitingGuests.map((w) => ({
        type: 'waitlist' as const,
        id: w.id,
        name: w.guestName,
        partySize: w.partySize,
        time: `${w.estimatedWaitMins}m attesa`,
        tableId: undefined,
        raw: w,
      }));
    }

    let filtered = dayReservations;
    if (columnTabFilter === 'upcoming') {
      filtered = filtered.filter((r) => r.status === 'confirmed');
    } else if (columnTabFilter === 'seated') {
      filtered = filtered.filter((r) => r.status === 'seated');
    }

    return filtered.map((r) => ({
      type: 'reservation' as const,
      id: r.id,
      name: r.guestName,
      partySize: r.partySize,
      time: r.startTime,
      tableId: r.tableId,
      status: r.status,
      tags: r.tags,
      notes: r.notes,
      raw: r,
    }));
  }, [columnTabFilter, dayReservations, waitingGuests]);

  const handleMergeSelected = () => {
    if (selectedTableIds.length < 2) return;
    const result = mergeTables({
      date: selectedDate,
      tableIds: selectedTableIds,
      groupName: groupNameInput.trim() || undefined,
    });
    if (result.success) {
      setGroupNameInput('');
    }
  };

  const handleOpenAddTable = (zone: TableZone = 'main_a') => {
    setAddTableZone(zone);
    setIsAddTableOpen(true);
  };

  const handleOpenWalkIn = (targetTableId?: string) => {
    setWalkInGuestName('');
    setWalkInPartySize(2);
    setWalkInTableId(targetTableId || availableTables[0]?.id || '10');
    setIsWalkInModalOpen(true);
  };

  const handleConfirmWalkIn = () => {
    if (!walkInTableId) return;
    const res = quickSeatWalkIn({
      guestName: walkInGuestName.trim() || `Walk-in (Tavolo ${walkInTableId})`,
      partySize: walkInPartySize,
      tableId: walkInTableId,
    });
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Walk-In Accomodato',
        message: `${walkInGuestName || 'Walk-In'} è seduto al Tavolo ${walkInTableId}.`,
      });
      setIsWalkInModalOpen(false);
    }
  };

  return (
    <div className={`space-y-4 max-w-[1780px] mx-auto pb-16 transition-colors select-none ${
      isLight ? 'text-slate-900' : 'text-slate-100'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. PULSANTI RAPIDI FOH: WAITLIST, NOTIFICHE, PROBLEMI, SEZIONI CAMERIERI */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 border transition-all ${
        isLight ? 'bg-white/90 border-slate-200/70' : 'bg-[#121622]/90 border-[#222A3C]'
      }`}>
        {/* Quick Buttons Left Group */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className={`text-[10px] uppercase font-medium tracking-wider px-2 py-1 rounded-lg border hidden sm:inline-block ${
            isLight ? 'bg-slate-50 text-slate-500 border-slate-200/70' : 'bg-white/5 text-slate-400 border-white/10'
          }`}>
            Pulsanti Rapidi FOH:
          </span>

          {/* Quick Button 1: Reservation Waitlist */}
          <button
            onClick={() => {
              if (onOpenWaitlist) onOpenWaitlist();
              else {
                setColumnTabFilter('waitlist');
                setIsSidebarOpen(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              isLight
                ? 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-800 border-amber-200/80 shadow-2xs'
                : 'bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border-amber-800/40'
            }`}
            title="Pulsante Rapido: Lista d'Attesa (Waitlist)"
          >
            <Users className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Waitlist</span>
            <span className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full border ${
              isLight ? 'bg-white text-amber-800 border-amber-300/80' : 'bg-[#121622] text-amber-300 border-amber-700/50'
            }`}>
              {waitingGuests.length}
            </span>
          </button>

          {/* Quick Button 2: Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                isNotificationsOpen
                  ? isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-sky-950/40 text-sky-300 border-sky-700/50'
                  : isLight ? 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs' : 'bg-[#151926] hover:bg-[#1E2538] text-slate-200 border-[#222A3C]'
              }`}
              title="Pulsante Rapido: Notifiche Servizio di Sala"
            >
              <Bell className="w-3.5 h-3.5 text-sky-600 stroke-[1.5]" />
              <span>Notifiche</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className={`absolute left-0 top-full mt-2 w-72 rounded-2xl border shadow-xl p-3 z-40 space-y-2 animate-in fade-in duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151926] border-[#2C364D] text-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/5">
                  <span className="font-semibold text-xs">Notifiche del Turno</span>
                  <span className="text-[10px] text-slate-400">Tempo Reale</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className={`p-2 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#121622] border-white/5'}`}>
                    <span className="text-sky-600 dark:text-sky-400 font-medium block">Tavolo 20</span>
                    <span className="text-slate-500 dark:text-slate-400">Conto saldato con successo. Tavolo pronto da sparecchiare.</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#121622] border-white/5'}`}>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium block">Nuovo Walk-In</span>
                    <span className="text-slate-500 dark:text-slate-400">Aggiunto in lista d'attesa (2 pax, stima 15 min).</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#121622] border-white/5'}`}>
                    <span className="text-amber-600 dark:text-amber-400 font-medium block">Pacing Cucina</span>
                    <span className="text-slate-500 dark:text-slate-400">Flusso comande regolare per la fascia oraria corrente.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Button 3: Problem Reservations */}
          <div className="relative">
            <button
              onClick={() => setIsProblemsOpen(!isProblemsOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                problemReservations.length > 0
                  ? isLight ? 'bg-rose-50/80 hover:bg-rose-100 text-rose-800 border-rose-200/80 shadow-2xs' : 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border-rose-800/40'
                  : isLight ? 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs' : 'bg-[#151926] hover:bg-[#1E2538] text-slate-200 border-[#222A3C]'
              }`}
              title="Pulsante Rapido: Anomalie & Problem Reservations"
            >
              <AlertTriangle className={`w-3.5 h-3.5 stroke-[1.5] ${problemReservations.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Problem Reservations</span>
              {problemReservations.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isLight ? 'bg-white text-rose-700 border-rose-300' : 'bg-[#121622] text-rose-300 border-rose-700'
                }`}>
                  {problemReservations.length}
                </span>
              )}
            </button>

            {/* Problem Reservations Dropdown */}
            {isProblemsOpen && (
              <div className={`absolute left-0 top-full mt-2 w-80 rounded-2xl border shadow-xl p-3.5 z-40 space-y-2 animate-in fade-in duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151926] border-[#2C364D] text-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/5">
                  <span className="font-semibold text-xs text-rose-700 dark:text-rose-300">
                    Prenotazioni con Problemi ({problemReservations.length})
                  </span>
                  <button onClick={() => setIsProblemsOpen(false)} className="text-slate-400 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {problemReservations.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 italic">
                    Nessuna anomalia o conflitto rilevato ✓
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {problemReservations.map((pr) => (
                      <div
                        key={pr.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isLight ? 'bg-rose-50/50 border-rose-200/60' : 'bg-rose-950/20 border-rose-900/40'
                        }`}
                      >
                        <div>
                          <strong className="block text-xs font-semibold">{pr.guestName}</strong>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {pr.partySize} pax alle {pr.startTime} · Senza tavolo assegnato
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (availableTables[0]) {
                              updateReservation(pr.id, { tableId: availableTables[0].id });
                              addToast({
                                type: 'success',
                                title: 'Tavolo Risolto',
                                message: `${pr.guestName} assegnato al Tavolo ${availableTables[0].id}.`,
                              });
                              setIsProblemsOpen(false);
                            }
                          }}
                          className="px-2 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-medium transition cursor-pointer shrink-0"
                        >
                          Assegna Libero
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Button 4: Server Sections */}
          <button
            onClick={onOpenServerSections}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              isLight
                ? 'bg-sky-50/80 hover:bg-sky-100 text-sky-800 border-sky-200/80 shadow-2xs'
                : 'bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 border-sky-800/40'
            }`}
            title="Pulsante Rapido: Sezioni Camerieri (Server Sections)"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Sezioni Camerieri</span>
          </button>
        </div>

        {/* Right Toggle for Single Scrollable Column */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenWalkIn()}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs'
                : 'bg-[#151926] hover:bg-[#1E2538] text-slate-200 border-[#222A3C]'
            }`}
            title="Essential #1: Accomoda Walk-In"
          >
            <Footprints className="w-3.5 h-3.5 text-sky-600 stroke-[1.5]" />
            <span className="hidden xs:inline">Seat Walk-In</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              isSidebarOpen
                ? isLight ? 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs font-semibold' : 'bg-[#1C2538] text-sky-300 border-sky-700/50 font-semibold'
                : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs' : 'bg-[#151926] hover:bg-[#1E2538] text-slate-300 border-[#222A3C]'
            }`}
            title="Mostra / Nascondi la colonna scorrevole delle prenotazioni"
          >
            {isSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span>{isSidebarOpen ? 'Nascondi Colonna' : 'Colonna Prenotazioni'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ZONE FILTER BAR & ACTIVE GROUPS BANNER */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#10141F] border-[#222A3C]'
      }`}>
        {/* Minimal Zone Filter Tabs */}
        <div className={`flex items-center gap-1 p-0.5 rounded-xl overflow-x-auto max-w-full border ${
          isLight ? 'bg-slate-100/60 border-slate-200/70' : 'bg-[#0E121B] border-[#1C2333]'
        }`}>
          <button
            onClick={() => setActiveZoneFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
              activeZoneFilter === 'all'
                ? isLight
                  ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                  : 'bg-[#1C2436] text-slate-100 border-white/10 shadow-2xs font-medium'
                : isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
            }`}
          >
            Vista Completa (1:1)
          </button>

          <button
            onClick={() => setActiveZoneFilter('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
              activeZoneFilter === 'bar'
                ? isLight
                  ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                  : 'bg-[#1C2436] text-slate-100 border-white/10 shadow-2xs font-medium'
                : isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
            }`}
          >
            Sala Bar ({barTables.length})
          </button>

          <button
            onClick={() => setActiveZoneFilter('main_a')}
            className={`px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
              activeZoneFilter === 'main_a'
                ? isLight
                  ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                  : 'bg-[#1C2436] text-slate-100 border-white/10 shadow-2xs font-medium'
                : isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
            }`}
          >
            MAIN A - Ovest ({mainATables.length})
          </button>

          <button
            onClick={() => setActiveZoneFilter('main_b')}
            className={`px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
              activeZoneFilter === 'main_b'
                ? isLight
                  ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                  : 'bg-[#1C2436] text-slate-100 border-white/10 shadow-2xs font-medium'
                : isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
            }`}
          >
            MAIN B - Est ({mainBTables.length})
          </button>

          <button
            onClick={() => setActiveZoneFilter('private')}
            className={`px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
              activeZoneFilter === 'private'
                ? isLight
                  ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                  : 'bg-[#1C2436] text-slate-100 border-white/10 shadow-2xs font-medium'
                : isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
            }`}
          >
            Privé ({privateTables.length})
          </button>
        </div>

        {/* Layout Pill */}
        <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] ${
            isLight ? 'bg-slate-50/70 border-slate-200/60 text-slate-600' : 'bg-[#151A27] border-[#222A3C] text-slate-300'
          }`}>
            <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="text-[10px] uppercase font-medium text-slate-400">Layout:</span>
            <span className="font-medium truncate max-w-[170px]">{activeFloorPlanName}</span>
          </div>

          {onOpenBohEditor && (
            <button
              onClick={onOpenBohEditor}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? 'bg-sky-50/80 hover:bg-sky-100/70 text-sky-700 border-sky-200/70 shadow-2xs'
                  : 'bg-[#182030] hover:bg-[#202A3C] text-sky-300 border-[#26334A] shadow-2xs'
              }`}
              title="Modifica pianta in BOH"
            >
              <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Modifica in BOH</span>
            </button>
          )}
        </div>
      </div>

      {/* MULTI-TABLE MERGE ACTION BAR */}
      {selectedTableIds.length > 0 && (
        <div className={`sticky top-16 z-30 rounded-2xl p-3 shadow-xl border flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in duration-150 ${
          isLight
            ? 'bg-white text-slate-900 border-slate-300 shadow-slate-200/50'
            : 'bg-[#161B28] text-white border-slate-600 shadow-2xl'
        }`}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
              isLight ? 'bg-sky-500 text-white' : 'bg-white text-slate-950'
            }`}>
              {selectedTableIds.length}
            </div>
            <div className="font-medium text-xs flex items-center gap-2">
              <span>Tavoli Selezionati: {selectedTableIds.join(' + ')}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                isLight ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-white/15 text-white border border-white/20'
              }`}>
                Capienza: {selectedTotalCapacity} pax
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Nome maxi-tavolo..."
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none w-full md:w-48 border transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white'
                  : 'bg-[#0E121C] border-slate-600 text-white placeholder-slate-400 focus:border-sky-400'
              }`}
            />
            <button
              onClick={handleMergeSelected}
              disabled={selectedTableIds.length < 2}
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs transition shadow-2xs whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Unisci Tavoli</span>
            </button>
            {onOpenBookingModalWithTables && (
              <button
                onClick={() => onOpenBookingModalWithTables(selectedTableIds)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs transition shadow-2xs whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Prenota Gruppo ({selectedTotalCapacity} pax)</span>
              </button>
            )}
            <button
              onClick={clearTableSelection}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="Deseleziona"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN SPLIT: FLOOR PLAN SPATIAL CANVAS + SINGLE SCROLLABLE COLUMN LIST */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row items-start gap-4 w-full">
        
        {/* LEFT / CENTER: SPATIAL ZONE CANVASES */}
        <div className="flex-1 w-full space-y-4">
          {(activeZoneFilter === 'all' || activeZoneFilter === 'bar') && (
            <SpatialZoneCanvas
              zoneKey="bar"
              zoneTitle="1. Sala Bar & Lounge"
              zoneSubtitle="Tavoli B1 - B4 & Bancone Ovest"
              icon={<Wine className="w-3.5 h-3.5 stroke-[1.5]" />}
              tables={barTables}
              activeGroups={activeDateGroups}
              onSelectTableForDetails={onSelectTableForDetails}
              onAddNewTable={() => handleOpenAddTable('bar')}
            />
          )}

          {(activeZoneFilter === 'all' || activeZoneFilter === 'main_a') && (
            <SpatialZoneCanvas
              zoneKey="main_a"
              zoneTitle="2. MAIN A — Ala Ovest"
              zoneSubtitle="Booth VIP G, Tavoli Nord 10-12 e Sud 20-21"
              icon={<UtensilsCrossed className="w-3.5 h-3.5 stroke-[1.5]" />}
              tables={mainATables}
              activeGroups={activeDateGroups}
              onSelectTableForDetails={onSelectTableForDetails}
              onAddNewTable={() => handleOpenAddTable('main_a')}
            />
          )}

          {(activeZoneFilter === 'all' || activeZoneFilter === 'main_b') && (
            <SpatialZoneCanvas
              zoneKey="main_b"
              zoneTitle="3. MAIN B — Ala Est"
              zoneSubtitle="Tavoli Nord 13-16 e Sud 21-23"
              icon={<UtensilsCrossed className="w-3.5 h-3.5 stroke-[1.5]" />}
              tables={mainBTables}
              activeGroups={activeDateGroups}
              onSelectTableForDetails={onSelectTableForDetails}
              onAddNewTable={() => handleOpenAddTable('main_b')}
            />
          )}

          {(activeZoneFilter === 'all' || activeZoneFilter === 'private') && (
            <SpatialZoneCanvas
              zoneKey="private"
              zoneTitle="4. Private Dining Room (Privé)"
              zoneSubtitle="Tavoli 30-34 per cene riservate ed eventi speciali"
              icon={<Shield className="w-3.5 h-3.5 stroke-[1.5]" />}
              tables={privateTables}
              activeGroups={activeDateGroups}
              onSelectTableForDetails={onSelectTableForDetails}
              onAddNewTable={() => handleOpenAddTable('private')}
            />
          )}
        </div>

        {/* RIGHT: SINGLE SCROLLABLE COLUMN RESERVATION LIST */}
        {isSidebarOpen && (
          <aside className={`w-full xl:w-80 shrink-0 rounded-2xl border shadow-xs flex flex-col max-h-[85vh] sticky top-20 overflow-hidden transition-all ${
            isLight ? 'bg-white/95 border-slate-200/80 backdrop-blur-md' : 'bg-[#121622]/95 border-[#222A3C] backdrop-blur-md'
          }`}>
            {/* Column Header */}
            <div className={`p-3.5 border-b space-y-2.5 ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#222A3C] bg-[#141824]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xs leading-tight">
                    Lista Prenotazioni (Turno)
                  </h3>
                  <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Colonna Singola Scorrevole
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-1 rounded-lg border transition cursor-pointer text-slate-400 ${
                    isLight ? 'hover:bg-slate-100 border-slate-200' : 'hover:bg-white/5 border-white/10'
                  }`}
                  title="Chiudi colonna"
                >
                  <PanelRightClose className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
              </div>

              {/* Sub-Tabs: Tutti, In Arrivo, Seduti, Waitlist */}
              <div className={`flex items-center p-0.5 rounded-xl border text-[11px] font-medium ${
                isLight ? 'bg-slate-100/70 border-slate-200/70' : 'bg-[#0E121B] border-[#1C2333]'
              }`}>
                <button
                  onClick={() => setColumnTabFilter('all')}
                  className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                    columnTabFilter === 'all'
                      ? isLight ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'bg-[#1C2538] text-white font-semibold'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tutti ({dayReservations.length})
                </button>
                <button
                  onClick={() => setColumnTabFilter('upcoming')}
                  className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                    columnTabFilter === 'upcoming'
                      ? isLight ? 'bg-white text-sky-700 shadow-2xs font-semibold' : 'bg-[#1C2538] text-sky-300 font-semibold'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Arrivi
                </button>
                <button
                  onClick={() => setColumnTabFilter('seated')}
                  className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                    columnTabFilter === 'seated'
                      ? isLight ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'bg-[#1C2538] text-emerald-300 font-semibold'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Seduti
                </button>
                <button
                  onClick={() => setColumnTabFilter('waitlist')}
                  className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                    columnTabFilter === 'waitlist'
                      ? isLight ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'bg-[#1C2538] text-amber-300 font-semibold'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Wait ({waitingGuests.length})
                </button>
              </div>
            </div>

            {/* Scrollable Items Container */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 [scrollbar-width:thin]">
              {scrollableListItems.length === 0 ? (
                <div className={`py-12 text-center text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nessuna voce trovata per il filtro.
                </div>
              ) : (
                scrollableListItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border transition space-y-1.5 ${
                      isLight
                        ? 'bg-white hover:bg-slate-50/80 border-slate-200/70 shadow-2xs'
                        : 'bg-[#151926] hover:bg-[#1A2030] border-[#222A3C]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-mono font-medium ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                            {item.time}
                          </span>
                          <strong className="text-xs font-medium leading-tight">{item.name}</strong>
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-2 ${
                          isLight ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <span>{item.partySize} persone</span>
                          {item.tableId && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Tavolo {item.tableId}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {item.type === 'reservation' ? (
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                          item.status === 'seated'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                            : isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                        }`}>
                          {item.status === 'seated' ? 'Seduto' : 'Confermato'}
                        </span>
                      ) : (
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                          isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                        }`}>
                          Walk-In
                        </span>
                      )}
                    </div>

                    {/* Quick Action strip */}
                    <div className={`pt-1 border-t flex items-center justify-between text-[10px] ${
                      isLight ? 'border-slate-100' : 'border-[#222A3C]'
                    }`}>
                      {item.type === 'reservation' && item.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            seatReservation(item.id);
                            addToast({
                              type: 'success',
                              title: 'Ospite Seduto',
                              message: `${item.name} accomodato al Tavolo ${item.tableId}.`,
                            });
                          }}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
                          title="Essential #2: Siedi prenotazione"
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>Siedi</span>
                        </button>
                      )}

                      {item.type === 'reservation' && item.status === 'seated' && (
                        <button
                          onClick={() => {
                            if (item.tableId) freeTable(item.tableId);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer border ${
                            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/5 text-slate-300 border-white/10'
                          }`}
                        >
                          Completa Pasto
                        </button>
                      )}

                      {item.type === 'waitlist' && (
                        <button
                          onClick={() => handleOpenWalkIn(availableTables[0]?.id)}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>Assegna Tavolo</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (item.tableId) onSelectTableForDetails(item.tableId);
                        }}
                        className={`text-[10px] font-medium transition ${
                          isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Dettagli &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Add Custom Table Modal */}
      <AddTableModal
        isOpen={isAddTableOpen}
        defaultZone={addTableZone}
        onClose={() => setIsAddTableOpen(false)}
      />

      {/* Quick Walk-In Modal for Essential #1 */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-sky-600 stroke-[1.5]" />
                <h3 className="font-semibold text-sm">Seating a Walk-In (Essential #1)</h3>
              </div>
              <button onClick={() => setIsWalkInModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Nome Ospite Walk-In:</label>
                <input
                  type="text"
                  placeholder="Es. Mario Rossi o Walk-in"
                  value={walkInGuestName}
                  onChange={(e) => setWalkInGuestName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-1.5 border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#222A3C]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Coperti (Pax):</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setWalkInPartySize(num)}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-medium border transition ${
                          walkInPartySize === num
                            ? 'bg-sky-500 text-white border-sky-400'
                            : isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#222A3C]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Tavolo Libero:</label>
                  <select
                    value={walkInTableId}
                    onChange={(e) => setWalkInTableId(e.target.value)}
                    className={`w-full rounded-xl px-2 py-1.5 border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0E121B] border-[#222A3C] text-slate-200'
                    }`}
                  >
                    {availableTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Tavolo {t.tableNumber} ({t.capacity}p)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10">
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmWalkIn}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Seat Walk-In</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

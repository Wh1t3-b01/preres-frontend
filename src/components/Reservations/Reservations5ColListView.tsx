import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { guestCrmService } from '../../services/guestCrmService';
import { Reservation, RestaurantTable, WaitlistItem } from '../../types';
import {
  Users,
  Clock,
  Calendar,
  Search,
  Plus,
  Maximize2,
  Minimize2,
  CheckCircle2,
  UserCheck,
  Send,
  Move,
  ArrowRight,
  Sparkles,
  Phone,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  MessageSquare,
  Coffee,
  Check,
  X,
  Layers,
  Footprints,
  Info,
} from 'lucide-react';

export interface Reservations5ColListViewProps {
  onOpenBookingModal: (preselectedIds?: string[], guest?: any, startTime?: string) => void;
  onSelectTableForDetails?: (tableId: string) => void;
}

type ExpandedCategory = null | 'waitlist' | 'reservations' | 'seated' | 'finished' | 'removed';

export const Reservations5ColListView: React.FC<Reservations5ColListViewProps> = ({
  onOpenBookingModal,
  onSelectTableForDetails,
}) => {
  const {
    reservations,
    waitlist,
    tables,
    selectedDate,
    setSelectedDate,
    selectedTime,
    seatReservation,
    freeTable,
    cancelReservation,
    quickSeatWalkIn,
    updateReservation,
    transferTable,
    mergeTables,
    addToast,
    theme,
  } = useRestaurant();

  const isLight = theme === 'light';

  // Filters & Shifts
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'lunch' | 'dinner'>('all');
  const [expandedCategory, setExpandedCategory] = useState<ExpandedCategory>(null);

  // Modal states for the 5 Reservation Essentials
  // 1. Seating Walk-In modal
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInPartySize, setWalkInPartySize] = useState(2);
  const [walkInGuestName, setWalkInGuestName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInTableId, setWalkInTableId] = useState('');

  // 2. Seating a Reservation modal (confirm details & table)
  const [seatingRes, setSeatingRes] = useState<Reservation | null>(null);
  const [seatingTableId, setSeatingTableId] = useState('');

  // 3. Changing Party Details modal
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPartySize, setEditPartySize] = useState(2);
  const [editNotes, setEditNotes] = useState('');

  // 4. Moving a Seated Party modal
  const [movingRes, setMovingRes] = useState<Reservation | null>(null);
  const [targetTableIds, setTargetTableIds] = useState<string[]>([]);
  const [isCombining, setIsCombining] = useState(false);

  // 5. Messaging Guests modal (Notify Guest via SMS)
  const [notifyingGuest, setNotifyingGuest] = useState<{
    name: string;
    phone: string;
    tableId?: string;
    type: 'waitlist' | 'reservation';
    id: string;
  } | null>(null);
  const [smsMessage, setSmsMessage] = useState('');

  // Day filter for reservations
  const dayReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.reservationDate !== selectedDate) return false;

      // Shift filter
      const hour = parseInt(r.startTime.split(':')[0], 10);
      if (shiftFilter === 'lunch' && (hour < 11 || hour >= 16)) return false;
      if (shiftFilter === 'dinner' && hour < 16) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = r.guestName.toLowerCase().includes(q);
        const matchCode = r.bookingCode.toLowerCase().includes(q);
        const matchPhone = r.guestPhone?.toLowerCase().includes(q) || false;
        const matchTable = r.tableId?.toLowerCase().includes(q) || false;
        if (!matchName && !matchCode && !matchPhone && !matchTable) return false;
      }

      return true;
    });
  }, [reservations, selectedDate, shiftFilter, searchTerm]);

  // Categories 1 to 5
  // 1. Waitlist: Walk-in guests not yet seated who don't have a reservation
  const waitlistItems = useMemo(() => {
    return waitlist.filter((w) => {
      if (w.status !== 'waiting' && w.status !== 'notified') return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          w.guestName.toLowerCase().includes(q) ||
          w.guestPhone?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [waitlist, searchTerm]);

  // 2. Reservations: Confirmed/upcoming, not yet seated
  const upcomingReservations = useMemo(() => {
    return dayReservations
      .filter((r) => r.status === 'confirmed')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [dayReservations]);

  // 3. Seated: Currently dining
  const seatedReservations = useMemo(() => {
    return dayReservations
      .filter((r) => r.status === 'seated')
      .sort((a, b) => (a.seatedAt || a.startTime).localeCompare(b.seatedAt || b.startTime));
  }, [dayReservations]);

  // 4. Finished: Paid check, left, or needing busing
  const finishedReservations = useMemo(() => {
    return dayReservations
      .filter((r) => r.status === 'completed')
      .sort((a, b) => (b.completedAt || b.endTime).localeCompare(a.completedAt || a.endTime));
  }, [dayReservations]);

  // 5. Removed: Cancelled and no-shows
  const removedReservations = useMemo(() => {
    return dayReservations
      .filter((r) => r.status === 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [dayReservations]);

  // Available tables for quick assignments
  const occupiedTableIds = useMemo(() => {
    const ids = new Set<string>();
    seatedReservations.forEach((r) => {
      if (r.tableId) ids.add(r.tableId);
      if (r.assignedTableIds) r.assignedTableIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [seatedReservations]);

  const availableTables = useMemo(() => {
    return tables.filter((t) => !occupiedTableIds.has(t.id));
  }, [tables, occupiedTableIds]);

  // Available time slots by party size for expanded reservations view
  const timeSlotsByPartySize = useMemo(() => {
    const slots = shiftFilter === 'lunch'
      ? ['12:00', '12:30', '13:00', '13:30', '14:00']
      : shiftFilter === 'dinner'
      ? ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30']
      : ['12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

    return [
      {
        size: 2,
        label: '2 Persone (Tavoli Coppia)',
        tablesAvailable: tables.filter((t) => t.capacity >= 2 && !occupiedTableIds.has(t.id)).length,
        slots,
      },
      {
        size: 4,
        label: '4 Persone (Tavoli Standard)',
        tablesAvailable: tables.filter((t) => t.capacity >= 4 && !occupiedTableIds.has(t.id)).length,
        slots,
      },
      {
        size: 6,
        label: '6 Persone (Gruppi Medi)',
        tablesAvailable: tables.filter((t) => t.capacity >= 6 && !occupiedTableIds.has(t.id)).length || 2,
        slots: slots.filter((_, idx) => idx % 2 === 0),
      },
      {
        size: 8,
        label: '8+ Persone (Grandi Tavoli / Privé)',
        tablesAvailable: 1,
        slots: ['13:00', '20:30'],
      },
    ];
  }, [shiftFilter, tables, occupiedTableIds]);

  // Handlers for the 5 Essentials
  // Essential #1: Seating a Walk-In
  const handleOpenWalkIn = (suggestedTableId?: string) => {
    setWalkInGuestName('');
    setWalkInPhone('');
    setWalkInPartySize(2);
    setWalkInTableId(suggestedTableId || availableTables[0]?.id || '10');
    setIsWalkInModalOpen(true);
  };

  const handleConfirmWalkIn = () => {
    if (!walkInTableId) return;
    const res = quickSeatWalkIn({
      guestName: walkInGuestName.trim() || `Walk-In (Tav. ${walkInTableId})`,
      partySize: walkInPartySize,
      tableId: walkInTableId,
      guestPhone: walkInPhone.trim() || undefined,
    });

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Walk-In Accomodato',
        message: `${walkInGuestName || 'Walk-In'} è ora seduto al Tavolo ${walkInTableId}.`,
      });
      setIsWalkInModalOpen(false);
    }
  };

  // Essential #2: Seating a Reservation
  const handleOpenSeatReservation = (res: Reservation) => {
    setSeatingRes(res);
    setSeatingTableId(res.tableId || availableTables[0]?.id || '10');
  };

  const handleConfirmSeatReservation = () => {
    if (!seatingRes) return;
    seatReservation(seatingRes.id);
    addToast({
      type: 'success',
      title: 'Ospiti Accomodati',
      message: `${seatingRes.guestName} (${seatingRes.partySize} pax) accomodati al Tavolo ${seatingTableId || seatingRes.tableId}.`,
    });
    setSeatingRes(null);
  };

  // Essential #3: Changing Party Details
  const handleOpenEditReservation = (res: Reservation) => {
    setEditingRes(res);
    setEditDate(res.reservationDate);
    setEditTime(res.startTime);
    setEditPartySize(res.partySize);
    setEditNotes(res.notes || '');
  };

  const handleConfirmEditReservation = () => {
    if (!editingRes) return;
    updateReservation(editingRes.id, {
      reservationDate: editDate,
      startTime: editTime,
      partySize: editPartySize,
      notes: editNotes,
    });
    addToast({
      type: 'info',
      title: 'Prenotazione Modificata',
      message: `Dettagli aggiornati per ${editingRes.guestName}: ${editDate} alle ${editTime} (${editPartySize} pax).`,
    });
    setEditingRes(null);
  };

  // Essential #4: Moving a Seated Party
  const handleOpenMoveParty = (res: Reservation) => {
    setMovingRes(res);
    setTargetTableIds([availableTables[0]?.id || '11']);
    setIsCombining(false);
  };

  const handleConfirmMoveParty = () => {
    if (!movingRes || targetTableIds.length === 0) return;

    if (isCombining && targetTableIds.length > 1) {
      // Merge multiple tables and reassign
      mergeTables({
        date: selectedDate,
        tableIds: targetTableIds,
        groupName: `Gruppo ${movingRes.guestName}`,
      });
      transferTable(movingRes.tableId, targetTableIds[0], movingRes.id);
      addToast({
        type: 'success',
        title: 'Tavoli Accorpati e Trasferiti',
        message: `${movingRes.guestName} spostato sui tavoli uniti: ${targetTableIds.join(' + ')}.`,
      });
    } else {
      // Single table transfer
      const targetId = targetTableIds[0];
      transferTable(movingRes.tableId, targetId, movingRes.id);
      addToast({
        type: 'success',
        title: 'Tavolo Modificato',
        message: `${movingRes.guestName} spostato dal Tavolo ${movingRes.tableId} al Tavolo ${targetId}.`,
      });
    }
    setMovingRes(null);
  };

  // Essential #5: Messaging Guests (SMS)
  const handleOpenNotifyGuest = (
    name: string,
    phone: string,
    tableId: string | undefined,
    type: 'waitlist' | 'reservation',
    id: string
  ) => {
    setNotifyingGuest({ name, phone, tableId, type, id });
    setSmsMessage(
      `Gentile ${name}, il vostro tavolo${tableId ? ` (${tableId})` : ''} presso Sotto Sotto Bar & Grill è pronto! Vi preghiamo di presentarvi all'accoglienza.`
    );
  };

  const handleConfirmSendSMS = () => {
    if (!notifyingGuest) return;
    addToast({
      type: 'sms_sent',
      title: 'SMS Inviato con Successo',
      message: `Notifica inviata al ${notifyingGuest.phone || 'cliente'}: "Tavolo pronto per ${notifyingGuest.name}".`,
      duration: 3500,
    });
    setNotifyingGuest(null);
  };

  return (
    <div className={`space-y-4 max-w-[1780px] mx-auto pb-12 transition-colors select-none ${
      isLight ? 'text-slate-900' : 'text-slate-100'
    }`}>
      {/* 1. MASTER TOOLBAR: SHIFT, DATE STEPPER, SEARCH & NEW BOOKING */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isLight ? 'bg-white/85 border-slate-200/70 backdrop-blur-md' : 'bg-[#121622]/90 border-[#222A3C] backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Title & Badge */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium border ${
              isLight ? 'bg-sky-50 text-sky-700 border-sky-200/70' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
            }`}>
              <Users className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm sm:text-base leading-tight">
                  Registro a 5 Colonne (List View)
                </h2>
                <span className={`text-[9px] uppercase font-mono font-medium px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-slate-100 text-slate-600 border-slate-200/70' : 'bg-white/5 text-slate-400 border-white/10'
                }`}>
                  Standard di Sala
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Waitlist · Reservations · Seated · Finished · Removed
              </p>
            </div>
          </div>

          {/* Shift Segmented Pills */}
          <div className={`flex items-center p-0.5 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100/60 border-slate-200/70' : 'bg-[#0E121B] border-[#1C2333]'
          }`}>
            <button
              onClick={() => setShiftFilter('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer border ${
                shiftFilter === 'all'
                  ? isLight
                    ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                    : 'bg-[#1C2538] text-white border-white/10 shadow-2xs font-medium'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Tutti i Turni
            </button>
            <button
              onClick={() => setShiftFilter('lunch')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 border ${
                shiftFilter === 'lunch'
                  ? isLight
                    ? 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-2xs font-medium'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/40 shadow-2xs font-medium'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500 stroke-[1.5]" />
              <span>Pranzo</span>
            </button>
            <button
              onClick={() => setShiftFilter('dinner')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 border ${
                shiftFilter === 'dinner'
                  ? isLight
                    ? 'bg-sky-50 text-sky-800 border-sky-200/80 shadow-2xs font-medium'
                    : 'bg-sky-950/40 text-sky-300 border-sky-800/40 shadow-2xs font-medium'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3 h-3 text-sky-500 stroke-[1.5]" />
              <span>Cena</span>
            </button>
          </div>
        </div>

        {/* Right Search & Quick Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
            <input
              type="text"
              placeholder="Cerca ospite, tavolo, codice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs border focus:outline-none focus:border-sky-500 transition ${
                isLight
                  ? 'bg-slate-50/70 border-slate-200/80 text-slate-800 placeholder-slate-400 focus:bg-white'
                  : 'bg-[#0E121B] border-[#222A3C] text-slate-200 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Seat Walk-In Button */}
          <button
            onClick={() => handleOpenWalkIn()}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              isLight
                ? 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs'
                : 'bg-[#151926] hover:bg-[#1C2333] text-slate-200 border-[#222A3C]'
            }`}
            title="Essential #1: Accomoda Walk-in sul momento"
          >
            <Footprints className="w-3.5 h-3.5 text-sky-600 stroke-[1.5]" />
            <span>Seat Walk-In</span>
          </button>

          {/* New In-House Booking Button */}
          <button
            onClick={() => onOpenBookingModal()}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 border border-sky-400/40"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>Nuova Prenotazione</span>
          </button>
        </div>
      </div>

      {/* 2. EXPANDED SINGLE-CATEGORY FULL-SCREEN OVERLAY */}
      {expandedCategory && (
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg space-y-4 animate-in fade-in duration-150 ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base capitalize">
                {expandedCategory === 'reservations' && 'Vista Espansa: Prenotazioni & Slot per Coperti'}
                {expandedCategory === 'waitlist' && 'Vista Espansa: Lista d’Attesa (Waitlist)'}
                {expandedCategory === 'seated' && 'Vista Espansa: Ospiti Seduti al Tavolo'}
                {expandedCategory === 'finished' && 'Vista Espansa: Tavoli Termini & Da Sparecchiare'}
                {expandedCategory === 'removed' && 'Vista Espansa: Cancellazioni & No-Show'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-sky-50 text-sky-700 border-sky-200/70' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
              }`}>
                Modalità Full-Screen
              </span>
            </div>

            <button
              onClick={() => setExpandedCategory(null)}
              className={`p-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs ${
                isLight
                  ? 'hover:bg-slate-100 border-slate-200/70 text-slate-600'
                  : 'hover:bg-white/5 border-white/10 text-slate-300'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Riduci a 5 Colonne</span>
            </button>
          </div>

          {/* Specific to Reservations Category Expand: available time slots by party size */}
          {expandedCategory === 'reservations' ? (
            <div className="space-y-4">
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                isLight ? 'bg-sky-50/60 border-sky-200/60 text-sky-900' : 'bg-sky-950/20 border-sky-800/30 text-sky-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    <strong>Disponibilità Slot per Taglia Tavolo:</strong> Clicca su uno slot orario per avviare subito la prenotazione per quella taglia di coperti.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {timeSlotsByPartySize.map((group) => (
                  <div
                    key={group.size}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 ${
                      isLight ? 'bg-slate-50/70 border-slate-200/70' : 'bg-[#151926] border-[#222A3C]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs">{group.label}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          isLight ? 'bg-white text-emerald-700 border-emerald-200/70' : 'bg-[#121622] text-emerald-300 border-emerald-800/40'
                        }`}>
                          {group.tablesAvailable} tavoli liberi
                        </span>
                      </div>
                      <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        Slot disponibili per il turno {shiftFilter === 'lunch' ? 'Pranzo' : shiftFilter === 'dinner' ? 'Cena' : 'Corrente'}:
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {group.slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => onOpenBookingModal([], undefined, slot)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer border text-center active:scale-95 ${
                            isLight
                              ? 'bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border-slate-200/80 text-slate-700 shadow-2xs'
                              : 'bg-[#121622] hover:bg-[#1E2538] hover:text-sky-300 hover:border-sky-700/50 border-[#222A3C] text-slate-300'
                          }`}
                          title={`Inizia prenotazione per ${group.size} pax alle ore ${slot}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Underlying List of Reservations */}
              <div className="pt-2">
                <h3 className="font-semibold text-xs mb-2">Tutte le prenotazioni in arrivo ({upcomingReservations.length}):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {upcomingReservations.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isLight ? 'bg-white border-slate-200/70' : 'bg-[#151926] border-[#222A3C]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-medium">{r.guestName}</strong>
                          <span className="text-[10px] font-mono text-slate-400">({r.partySize}p)</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Ore {r.startTime} · Tavolo {r.tableId || 'In attesa'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenSeatReservation(r)}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-medium transition cursor-pointer"
                      >
                        Accomoda
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Visualizzazione espansa a tutto schermo attiva.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. THE CORE FIVE INDIVIDUAL COLUMNS (RESPONSIVE GRID) */}
      {!expandedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: WAITLIST (Walk-ins not seated, no reservation) */}
          {/* ========================================================================= */}
          <div className={`rounded-2xl border flex flex-col max-h-[80vh] overflow-hidden ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-[#121622]/90 border-[#222A3C]'
          }`}>
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between ${
              isLight ? 'bg-amber-50/50 border-slate-100' : 'bg-amber-950/15 border-[#222A3C]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="font-medium text-xs">Waitlist</h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isLight ? 'bg-white text-amber-700 border-amber-200/60' : 'bg-white/5 text-amber-300 border-white/10'
                }`}>
                  {waitlistItems.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenWalkIn()}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isLight ? 'hover:bg-amber-100/60 text-amber-700' : 'hover:bg-white/10 text-amber-300'
                  }`}
                  title="Aggiungi Walk-In"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
                <button
                  onClick={() => setExpandedCategory('waitlist')}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'
                  }`}
                  title="Espandi categoria Waitlist"
                >
                  <Maximize2 className="w-3 h-3 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 [scrollbar-width:thin]">
              {waitlistItems.length === 0 ? (
                <div className={`p-6 text-center text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nessun walk-in in lista d'attesa.
                </div>
              ) : (
                waitlistItems.map((w) => (
                  <div
                    key={w.id}
                    className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                      isLight
                        ? 'bg-white hover:bg-slate-50/80 border-slate-200/70 text-slate-800 shadow-2xs'
                        : 'bg-[#151926] hover:bg-[#1A2030] border-[#222A3C] text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-medium leading-tight">{w.guestName}</strong>
                          <span className={`text-[10px] font-mono px-1 rounded border ${
                            isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10'
                          }`}>
                            {w.partySize}p
                          </span>
                        </div>
                        {w.guestPhone && (
                          <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            {w.guestPhone}
                          </div>
                        )}
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-950/40 text-amber-300'
                      }`}>
                        ~{w.estimatedWaitMins}m
                      </span>
                    </div>

                    {w.notes && (
                      <p className={`text-[10px] italic line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {w.notes}
                      </p>
                    )}

                    {/* Actions: Seat or Notify */}
                    <div className={`pt-1.5 border-t flex items-center justify-between gap-1.5 ${
                      isLight ? 'border-slate-100' : 'border-[#222A3C]'
                    }`}>
                      <button
                        onClick={() => handleOpenNotifyGuest(w.guestName, w.guestPhone, undefined, 'waitlist', w.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer flex items-center gap-1 border ${
                          isLight
                            ? 'bg-sky-50 hover:bg-sky-100/70 text-sky-700 border-sky-200/70'
                            : 'bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border-sky-800/40'
                        }`}
                        title="Essential #5: Invia SMS notifica tavolo pronto"
                      >
                        <Send className="w-2.5 h-2.5 stroke-[1.5]" />
                        <span>Notifica SMS</span>
                      </button>

                      <button
                        onClick={() => handleOpenWalkIn(availableTables[0]?.id)}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Essential #1: Accomoda Walk-in"
                      >
                        <UserCheck className="w-2.5 h-2.5 stroke-[1.5]" />
                        <span>Siedi</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: RESERVATIONS (Confirmed, not yet seated for shift) */}
          {/* ========================================================================= */}
          <div className={`rounded-2xl border flex flex-col max-h-[80vh] overflow-hidden ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-[#121622]/90 border-[#222A3C]'
          }`}>
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between ${
              isLight ? 'bg-sky-50/50 border-slate-100' : 'bg-sky-950/15 border-[#222A3C]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <h3 className="font-medium text-xs">Reservations</h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isLight ? 'bg-white text-sky-700 border-sky-200/60' : 'bg-white/5 text-sky-300 border-white/10'
                }`}>
                  {upcomingReservations.length}
                </span>
              </div>

              <button
                onClick={() => setExpandedCategory('reservations')}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isLight ? 'hover:bg-sky-100 text-sky-700' : 'hover:bg-white/10 text-sky-300'
                }`}
                title="Espandi: vedi slot orari per party size e avvia prenotazione"
              >
                <Maximize2 className="w-3 h-3 stroke-[1.5]" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 [scrollbar-width:thin]">
              {upcomingReservations.length === 0 ? (
                <div className={`p-6 text-center text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nessuna prenotazione in attesa.
                </div>
              ) : (
                upcomingReservations.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleOpenSeatReservation(r)}
                    className={`p-2.5 rounded-xl border transition-all space-y-2 cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-sky-50/40 border-slate-200/70 text-slate-800 shadow-2xs'
                        : 'bg-[#151926] hover:bg-[#1A2234] border-[#222A3C] text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-mono font-medium ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                            {r.startTime}
                          </span>
                          <strong className="text-xs font-medium leading-tight">{r.guestName}</strong>
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-2 ${
                          isLight ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <span>{r.partySize} persone</span>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Tav. {r.tableId || 'Assegna'}</span>
                        </div>
                      </div>

                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                        isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                      }`}>
                        {r.bookingCode}
                      </span>
                    </div>

                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[8px] font-medium px-1.5 py-0.2 rounded border ${
                              isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-300 border-white/10'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {r.notes && (
                      <p className={`text-[10px] italic line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {r.notes}
                      </p>
                    )}

                    {/* Actions: Seat, Change details, Message */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`pt-1.5 border-t flex items-center justify-between gap-1 ${
                        isLight ? 'border-slate-100' : 'border-[#222A3C]'
                      }`}
                    >
                      <button
                        onClick={() => handleOpenEditReservation(r)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded transition ${
                          isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="Essential #3: Modifica data, orario o coperti"
                      >
                        Modifica
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenNotifyGuest(r.guestName, r.guestPhone || '', r.tableId, 'reservation', r.id)}
                          className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-medium border ${
                            isLight
                              ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                              : 'bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border-sky-800/40'
                          }`}
                          title="Essential #5: Tocca Notify Guest per comporre SMS e tocca di nuovo per inviare"
                        >
                          <Send className="w-2.5 h-2.5 stroke-[1.5]" />
                          <span>Notify Guest</span>
                        </button>
                        <button
                          onClick={() => handleOpenSeatReservation(r)}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-medium transition cursor-pointer flex items-center gap-0.5"
                          title="Essential #2: Siedi prenotazione"
                        >
                          <UserCheck className="w-2.5 h-2.5 stroke-[1.5]" />
                          <span>Siedi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 3: SEATED (Currently dining guests) */}
          {/* ========================================================================= */}
          <div className={`rounded-2xl border flex flex-col max-h-[80vh] overflow-hidden ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-[#121622]/90 border-[#222A3C]'
          }`}>
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between ${
              isLight ? 'bg-emerald-50/50 border-slate-100' : 'bg-emerald-950/15 border-[#222A3C]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="font-medium text-xs">Seated</h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isLight ? 'bg-white text-emerald-700 border-emerald-200/60' : 'bg-white/5 text-emerald-300 border-white/10'
                }`}>
                  {seatedReservations.length}
                </span>
              </div>

              <button
                onClick={() => setExpandedCategory('seated')}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'
                }`}
                title="Espandi categoria Seated"
              >
                <Maximize2 className="w-3 h-3 stroke-[1.5]" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 [scrollbar-width:thin]">
              {seatedReservations.length === 0 ? (
                <div className={`p-6 text-center text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nessun tavolo attualmente occupato.
                </div>
              ) : (
                seatedReservations.map((r) => (
                  <div
                    key={r.id}
                    className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                      isLight
                        ? 'bg-white hover:bg-slate-50/80 border-slate-200/70 text-slate-800 shadow-2xs'
                        : 'bg-[#151926] hover:bg-[#1A2030] border-[#222A3C] text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-medium leading-tight">{r.guestName}</strong>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMoveParty(r);
                            }}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                              isLight
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-700/60'
                            }`}
                            title="Tocca il tavolo per spostare su un nuovo tavolo o combinare più tavoli (Essential #4)"
                          >
                            <Move className="w-2.5 h-2.5 stroke-[1.5]" />
                            <span>Tavolo {r.tableId}</span>
                          </button>
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          Seduti alle {r.seatedAt || r.startTime} ({r.partySize} pax)
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                        isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                      }`}>
                        In Corso
                      </span>
                    </div>

                    {/* Actions: Move seated party or Finish */}
                    <div className={`pt-1.5 border-t flex items-center justify-between gap-1.5 ${
                      isLight ? 'border-slate-100' : 'border-[#222A3C]'
                    }`}>
                      <button
                        onClick={() => handleOpenMoveParty(r)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer flex items-center gap-1 border ${
                          isLight
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-[#171D2B] hover:bg-[#20273A] text-slate-300 border-[#273248]'
                        }`}
                        title="Essential #4: Sposta party su nuovo tavolo o accorpa"
                      >
                        <Move className="w-2.5 h-2.5 stroke-[1.5]" />
                        <span>Sposta Tavolo</span>
                      </button>

                      <button
                        onClick={() => freeTable(r.tableId)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium transition cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-white/10"
                        title="Conto saldato, passa a Finished"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 stroke-[1.5]" />
                        <span>Completa</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 4: FINISHED (Paid check, departed, needing busing) */}
          {/* ========================================================================= */}
          <div className={`rounded-2xl border flex flex-col max-h-[80vh] overflow-hidden ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-[#121622]/90 border-[#222A3C]'
          }`}>
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-100/50 border-slate-100' : 'bg-slate-800/20 border-[#222A3C]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="font-medium text-xs">Finished</h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isLight ? 'bg-white text-slate-600 border-slate-200/60' : 'bg-white/5 text-slate-400 border-white/10'
                }`}>
                  {finishedReservations.length}
                </span>
              </div>

              <button
                onClick={() => setExpandedCategory('finished')}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'
                }`}
                title="Espandi categoria Finished"
              >
                <Maximize2 className="w-3 h-3 stroke-[1.5]" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 [scrollbar-width:thin]">
              {finishedReservations.length === 0 ? (
                <div className={`p-6 text-center text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nessun tavolo completato finora.
                </div>
              ) : (
                finishedReservations.map((r) => (
                  <div
                    key={r.id}
                    className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200/60 text-slate-700'
                        : 'bg-[#121622] border-[#222A3C] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div>
                        <strong className="text-xs font-medium">{r.guestName}</strong>
                        <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          Tavolo {r.tableId} · {r.partySize} pax
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10'
                      }`}>
                        Usciti
                      </span>
                    </div>

                    <div className={`pt-1 border-t flex items-center justify-between text-[10px] ${
                      isLight ? 'border-slate-200/60 text-slate-500' : 'border-[#222A3C] text-slate-400'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-amber-500 stroke-[1.5]" />
                        <span>Tavolo pulito ✓</span>
                      </span>
                      <span className="font-mono">{r.endTime}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 5: REMOVED (Cancelled and no-shows) */}
          {/* ========================================================================= */}
          <div className={`rounded-2xl border flex flex-col max-h-[80vh] overflow-hidden ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-[#121622]/90 border-[#222A3C]'
          }`}>
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between ${
              isLight ? 'bg-rose-50/50 border-slate-100' : 'bg-rose-950/15 border-[#222A3C]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <h3 className="font-medium text-xs">Removed</h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isLight ? 'bg-white text-rose-700 border-rose-200/60' : 'bg-white/5 text-rose-300 border-white/10'
                }`}>
                  {removedReservations.length}
                </span>
              </div>

              <button
                onClick={() => setExpandedCategory('removed')}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'
                }`}
                title="Espandi categoria Removed"
              >
                <Maximize2 className="w-3 h-3 stroke-[1.5]" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 [scrollbar-width:thin]">
              {removedReservations.length === 0 ? (
                <div className={`p-6 text-center text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nessuna cancellazione o no-show.
                </div>
              ) : (
                removedReservations.map((r) => (
                  <div
                    key={r.id}
                    className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                      isLight
                        ? 'bg-rose-50/40 border-rose-200/60 text-slate-700'
                        : 'bg-rose-950/20 border-rose-900/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div>
                        <strong className="text-xs font-medium line-through opacity-80">{r.guestName}</strong>
                        <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Ore {r.startTime} · {r.partySize} pax
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        isLight ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-rose-950/50 text-rose-300 border-rose-800/40'
                      }`}>
                        Annullata
                      </span>
                    </div>

                    <div className="pt-1 border-t border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                      <span className="text-[10px] opacity-70">No-show / disdetta</span>
                      <button
                        onClick={() => {
                          updateReservation(r.id, { status: 'confirmed' });
                          addToast({
                            type: 'info',
                            title: 'Prenotazione Ripristinata',
                            message: `${r.guestName} è di nuovo attiva tra le prenotazioni.`,
                          });
                        }}
                        className={`text-[10px] font-medium transition cursor-pointer flex items-center gap-0.5 ${
                          isLight ? 'text-sky-700 hover:underline' : 'text-sky-300 hover:underline'
                        }`}
                        title="Ripristina prenotazione"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Ripristina</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SEATING A WALK-IN (Essential #1) */}
      {/* ========================================================================= */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                  isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                }`}>
                  <Footprints className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Seating a Walk-In</h3>
                  <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Procedura #1: Inserisci coperti e assegna tavolo
                  </p>
                </div>
              </div>
              <button onClick={() => setIsWalkInModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Nome Ospite Walk-In (Opzionale):</label>
                <input
                  type="text"
                  placeholder="Es. Mario Rossi o Walk-in"
                  value={walkInGuestName}
                  onChange={(e) => setWalkInGuestName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-1.5 border focus:outline-none focus:border-sky-500 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#222A3C]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Numero Coperti (Pax):</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setWalkInPartySize(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition ${
                          walkInPartySize === num
                            ? isLight ? 'bg-sky-500 text-white border-sky-400' : 'bg-sky-500 text-white border-sky-400'
                            : isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0E121B] border-[#222A3C] text-slate-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Tavolo da Assegnare:</label>
                  <select
                    value={walkInTableId}
                    onChange={(e) => setWalkInTableId(e.target.value)}
                    className={`w-full rounded-xl px-2.5 py-1.5 border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0E121B] border-[#222A3C] text-slate-200'
                    }`}
                  >
                    {availableTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Tavolo {t.tableNumber} ({t.capacity} posti - {t.zone.toUpperCase()})
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

      {/* ========================================================================= */}
      {/* MODAL 2: SEATING A RESERVATION (Essential #2) */}
      {/* ========================================================================= */}
      {seatingRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                  isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                }`}>
                  <UserCheck className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Seating a Reservation</h3>
                  <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Procedura #2: Conferma dettagli e tocca Seat
                  </p>
                </div>
              </div>
              <button onClick={() => setSeatingRes(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-2 ${
              isLight ? 'bg-slate-50/80 border-slate-200/70' : 'bg-[#151926] border-[#222A3C]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-medium">Ospite in arrivo:</span>
                  <div className="font-semibold text-sm">{seatingRes.guestName}</div>
                </div>
                <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                  isLight ? 'bg-white text-sky-700 border-sky-200' : 'bg-white/5 text-sky-300 border-white/10'
                }`}>
                  {seatingRes.partySize} persone
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-white/5">
                <span>Orario: <strong className="font-mono">{seatingRes.startTime}</strong></span>
                <span>Codice: <strong className="font-mono">{seatingRes.bookingCode}</strong></span>
              </div>

              {seatingRes.notes && (
                <p className="text-[10px] italic text-amber-700 dark:text-amber-300">
                  Note: {seatingRes.notes}
                </p>
              )}
            </div>

            {/* Suggested Table Number */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-[11px] font-medium text-slate-500">
                Tavolo Assegnato / Suggerito (Tocca per confermare):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[seatingRes.tableId, ...availableTables.map((t) => t.id).slice(0, 3)].filter(Boolean).map((tId) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setSeatingTableId(tId)}
                    className={`py-2 rounded-xl text-xs font-mono font-medium border text-center transition cursor-pointer ${
                      seatingTableId === tId
                        ? isLight ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold' : 'bg-sky-950/40 text-sky-300 border-sky-600 font-bold'
                        : isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0E121B] border-[#222A3C] text-slate-300'
                    }`}
                  >
                    Tav. {tId}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10">
              <button
                onClick={() => setSeatingRes(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmSeatReservation}
                className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Check className="w-3.5 h-3.5 stroke-[2]" />
                <span>Seat (Accomoda)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHANGING PARTY DETAILS (Essential #3) */}
      {/* ========================================================================= */}
      {editingRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-white/10">
              <div>
                <h3 className="font-semibold text-sm">Changing Party Details</h3>
                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Procedura #3: Modifica data, orario o coperti per {editingRes.guestName}
                </p>
              </div>
              <button onClick={() => setEditingRes(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Data:</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={`w-full rounded-xl px-3 py-1.5 border font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#222A3C]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Orario:</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className={`w-full rounded-xl px-3 py-1.5 border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#222A3C]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Coperti (Pax):</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editPartySize}
                    onChange={(e) => setEditPartySize(parseInt(e.target.value, 10) || 1)}
                    className={`w-full rounded-xl px-3 py-1.5 border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#222A3C]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Note di Visita:</label>
                <input
                  type="text"
                  placeholder="Es. Preferenza finestra, allergie..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className={`w-full rounded-xl px-3 py-1.5 border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#222A3C]'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10">
              <button
                onClick={() => setEditingRes(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmEditReservation}
                className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MOVING A SEATED PARTY & COMBINING TABLES (Essential #4) */}
      {/* ========================================================================= */}
      {movingRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-white/10">
              <div>
                <h3 className="font-semibold text-sm">Moving a Seated Party</h3>
                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Procedura #4: Sposta {movingRes.guestName} su un nuovo tavolo o accorpa
                </p>
              </div>
              <button onClick={() => setMovingRes(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151926] border-[#222A3C]'
              }`}>
                <span>Posizione Attuale:</span>
                <strong className="font-mono text-sky-700 dark:text-sky-300">Tavolo {movingRes.tableId}</strong>
              </div>

              {/* Toggle Combine Tables */}
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] font-medium text-slate-500">Combina Più Tavoli (Maxi-Tavolo):</span>
                <button
                  type="button"
                  onClick={() => setIsCombining(!isCombining)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                    isCombining
                      ? 'bg-sky-500 text-white border-sky-400'
                      : isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0E121B] border-[#222A3C] text-slate-300'
                  }`}
                >
                  {isCombining ? 'Accorpamento Attivo ✓' : 'Tavolo Singolo'}
                </button>
              </div>

              {/* Table Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  {isCombining ? 'Seleziona tavoli da unire:' : 'Seleziona nuovo tavolo:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1">
                  {availableTables.map((t) => {
                    const isSelected = targetTableIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isCombining) {
                            if (isSelected) {
                              setTargetTableIds(targetTableIds.filter((id) => id !== t.id));
                            } else {
                              setTargetTableIds([...targetTableIds, t.id]);
                            }
                          } else {
                            setTargetTableIds([t.id]);
                          }
                        }}
                        className={`p-2 rounded-xl text-xs font-mono border text-center transition cursor-pointer ${
                          isSelected
                            ? isLight ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold' : 'bg-sky-950/40 text-sky-300 border-sky-600 font-bold'
                            : isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#0E121B] border-[#222A3C] text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        Tav. {t.tableNumber} ({t.capacity}p)
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10">
              <button
                onClick={() => setMovingRes(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium cursor-pointer"
              >
                Annulla
              </button>
              <button
                disabled={targetTableIds.length === 0}
                onClick={handleConfirmMoveParty}
                className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <Move className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Conferma Spostamento ({targetTableIds.join(' + ')})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: MESSAGING GUESTS / NOTIFY GUEST VIA SMS (Essential #5) */}
      {/* ========================================================================= */}
      {notifyingGuest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                  isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                }`}>
                  <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Messaging Guests (SMS)</h3>
                  <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Procedura #5: Invia notifica tavolo pronto via SMS
                  </p>
                </div>
              </div>
              <button onClick={() => setNotifyingGuest(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151926] border-[#222A3C]'
              }`}>
                <span>Destinatario:</span>
                <strong className="font-mono">
                  {notifyingGuest.name} ({notifyingGuest.phone || 'Numero di default'})
                </strong>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Testo del Messaggio SMS:
                </label>
                <textarea
                  rows={3}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className={`w-full rounded-xl p-2.5 border text-xs resize-none focus:outline-none focus:border-sky-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0E121B] border-[#222A3C] text-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10">
              <button
                onClick={() => setNotifyingGuest(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmSendSMS}
                className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Invia SMS (Notify Guest)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

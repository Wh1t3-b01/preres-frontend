import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  calcReservationDuration,
  minsToTime,
  timeToMins,
  getAvailableSingleAndGroupTables,
  findSmartMergeCombinations,
  validateAdvanceBookingSlotLimits,
  LUNCH_SLOTS,
  DINNER_SLOTS,
} from '../../utils/bookingEngine';
import {
  X,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertCircle,
  Phone,
  Mail,
  User,
  Utensils,
  Check,
} from 'lucide-react';
import { RecommendedMerge, TimeSlotOption } from '../../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTableIds?: string[];
}

const COMMON_TAGS = [
  'VIP',
  'Compleanno 🎂',
  'Anniversario 🥂',
  'Cena Aziendale 💼',
  'Senza Glutine 🌾',
  'Allergie ⚠️',
  'Seggiolone 👶',
  'Romantico 🕯️',
];

const POPULAR_TIME_SLOTS = [
  '12:30',
  '13:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedTableIds,
}) => {
  const {
    tables,
    reservations,
    tableGroups,
    settings,
    selectedDate: globalDate,
    selectedTime: globalTime,
    createReservation,
  } = useRestaurant();

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [date, setDate] = useState(globalDate);
  const [startTime, setStartTime] = useState(globalTime);
  const [partySize, setPartySize] = useState<number>(2);
  const [customDuration, setCustomDuration] = useState<number>(120);
  const [selectedOptionType, setSelectedOptionType] = useState<'single_or_existing' | 'auto_merge'>('single_or_existing');
  const [selectedTableOption, setSelectedTableOption] = useState<string>('');
  const [selectedMergeCandidate, setSelectedMergeCandidate] = useState<RecommendedMerge | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [successBookingCode, setSuccessBookingCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [tableTab, setTableTab] = useState<'single' | 'merge'>('single');

  // Sync date when opening modal
  useEffect(() => {
    if (isOpen) {
      setDate(globalDate);
      setStartTime(globalTime);
      setSuccessBookingCode(null);
      setErrorMessage(null);
      setNameError(false);
      const defaultDur = calcReservationDuration(partySize, settings);
      setCustomDuration(defaultDur);
    }
  }, [isOpen, globalDate, globalTime]);

  // Adjust duration when party size changes
  useEffect(() => {
    const dur = calcReservationDuration(partySize, settings);
    setCustomDuration(dur);
  }, [partySize, settings]);

  // Calculate End Time
  const calculatedEndTime = useMemo(() => {
    const startM = timeToMins(startTime);
    const endM = startM + (customDuration || 120);
    return minsToTime(endM);
  }, [startTime, customDuration]);

  // Query Available Tables & Smart Combinations
  const { directMatches, oversizedMatches } = useMemo(() => {
    if (!isOpen || !date || !startTime) return { directMatches: [], oversizedMatches: [] };
    return getAvailableSingleAndGroupTables(
      date,
      startTime,
      calculatedEndTime,
      partySize,
      tables,
      reservations,
      tableGroups
    );
  }, [isOpen, date, startTime, calculatedEndTime, partySize, tables, reservations, tableGroups]);

  // Query Recommended Merges (Adjacent Pairs/Trios)
  const recommendedMerges = useMemo(() => {
    if (!isOpen || !date || !startTime) return [];
    return findSmartMergeCombinations(
      date,
      startTime,
      calculatedEndTime,
      partySize,
      tables,
      reservations,
      tableGroups
    );
  }, [isOpen, date, startTime, calculatedEndTime, partySize, tables, reservations, tableGroups]);

  // Strict 15-Minute Slot Capacity Validation
  const slotCapacityValidation = useMemo(() => {
    if (!isOpen || !date || !startTime) return { isValid: true };
    return validateAdvanceBookingSlotLimits(
      date,
      startTime,
      calculatedEndTime,
      partySize,
      reservations
    );
  }, [isOpen, date, startTime, calculatedEndTime, partySize, reservations]);

  // Always ensure a valid table option is preselected
  useEffect(() => {
    if (preselectedTableIds && preselectedTableIds.length > 0) {
      setSelectedOptionType('single_or_existing');
      setSelectedTableOption(preselectedTableIds[0]);
      setSelectedMergeCandidate(null);
      setTableTab('single');
      return;
    }

    if (partySize > 4 && recommendedMerges.length > 0) {
      setSelectedOptionType('auto_merge');
      setSelectedMergeCandidate(recommendedMerges[0]);
      setSelectedTableOption('');
      setTableTab('merge');
    } else if (directMatches.length > 0) {
      setSelectedOptionType('single_or_existing');
      setSelectedTableOption(directMatches[0].tableId);
      setSelectedMergeCandidate(null);
      setTableTab('single');
    } else if (oversizedMatches.length > 0) {
      setSelectedOptionType('single_or_existing');
      setSelectedTableOption(oversizedMatches[0].tableId);
      setSelectedMergeCandidate(null);
      setTableTab('single');
    } else if (recommendedMerges.length > 0) {
      setSelectedOptionType('auto_merge');
      setSelectedMergeCandidate(recommendedMerges[0]);
      setSelectedTableOption('');
      setTableTab('merge');
    } else {
      if (tables.length > 0) {
        setSelectedOptionType('single_or_existing');
        setSelectedTableOption(tables[0].id);
        setTableTab('single');
      }
    }
  }, [directMatches, oversizedMatches, recommendedMerges, preselectedTableIds, partySize, tables]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setNameError(false);

    if (!guestName.trim()) {
      setNameError(true);
      setErrorMessage('Inserisci il nome dell’ospite per completare la prenotazione.');
      return;
    }

    if (selectedOptionType === 'auto_merge') {
      if (!selectedMergeCandidate) {
        setErrorMessage('Seleziona una combinazione di tavoli da unire.');
        return;
      }

      const res = createReservation({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
        reservationDate: date,
        startTime,
        durationMins: customDuration,
        partySize,
        tableId: selectedMergeCandidate.tableIds[0],
        assignedTableIds: selectedMergeCandidate.tableIds,
        notes: notes.trim() || undefined,
        tags: selectedTags,
        autoMerge: true,
        autoMergeTableIds: selectedMergeCandidate.tableIds,
        autoMergeGroupName: selectedMergeCandidate.combinedName,
      });

      if (res.success && res.bookingCode) {
        setSuccessBookingCode(res.bookingCode);
      } else {
        setErrorMessage(res.error || 'Errore durante la creazione della prenotazione.');
      }
    } else {
      const targetTable = selectedTableOption || (directMatches[0]?.tableId ?? tables[0]?.id);

      if (!targetTable) {
        setErrorMessage('Seleziona un tavolo di destinazione.');
        return;
      }

      const matchingOption = [...directMatches, ...oversizedMatches].find(
        (o) => o.tableId === targetTable
      );

      const res = createReservation({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
        reservationDate: date,
        startTime,
        durationMins: customDuration,
        partySize,
        tableId: targetTable,
        assignedTableIds: matchingOption ? matchingOption.memberTableIds : [targetTable],
        notes: notes.trim() || undefined,
        tags: selectedTags,
      });

      if (res.success && res.bookingCode) {
        setSuccessBookingCode(res.bookingCode);
      } else {
        setErrorMessage(res.error || 'Errore durante la creazione della prenotazione.');
      }
    }
  };

  if (!isOpen) return null;

  const selectedDisplayLabel =
    selectedOptionType === 'auto_merge' && selectedMergeCandidate
      ? `${selectedMergeCandidate.combinedName} (${selectedMergeCandidate.totalCapacity} px)`
      : `Tavolo ${selectedTableOption}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="bg-[#FDFBF7] border-2 border-[#1E3A2F]/30 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* 1. FIXED HEADER (Always visible) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A2F]/15 bg-[#F6F2E9]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#6B3FA0] text-white flex items-center justify-center font-bold shadow-xs">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-brand font-bold text-[#1E3A2F] leading-tight">
                Nuova Prenotazione
              </h3>
              <p className="text-[11px] text-[#1E3A2F]/70">
                Verifica disponibilità oraria e accorpamento tavoli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-[#1E3A2F] p-1.5 rounded-xl hover:bg-[#1E3A2F]/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Success Screen */}
          {successBookingCode ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-lg font-brand font-bold text-[#1E3A2F]">
                  Prenotazione Confermata!
                </h4>
                <p className="text-xs text-stone-600">
                  Il tavolo è stato riservato e bloccato in sala.
                </p>
              </div>

              <div className="bg-white border-2 border-[#1E3A2F]/20 rounded-2xl p-4 max-w-sm mx-auto space-y-1.5 shadow-xs">
                <div className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold">
                  Codice Prenotazione
                </div>
                <div className="font-mono text-2xl font-extrabold text-[#6B3FA0] tracking-wider">
                  {successBookingCode}
                </div>
                <div className="text-xs text-[#1E3A2F] font-medium pt-1.5 border-t border-[#1E3A2F]/10">
                  Ospite: <strong>{guestName}</strong> ({partySize} pax) · {date} ore {startTime} - {calculatedEndTime}
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessBookingCode(null);
                    setGuestName('');
                    setNotes('');
                  }}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-[#1E3A2F] rounded-xl text-xs font-semibold transition"
                >
                  Nuova Prenotazione
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#1E3A2F] hover:bg-[#152a22] text-amber-100 font-bold rounded-xl text-xs transition shadow-sm"
                >
                  Torna alla Sala
                </button>
              </div>
            </div>
          ) : (
            <form id="booking-form" onSubmit={handleSubmit} noValidate className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Dati Ospite */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#1E3A2F] uppercase tracking-wider block">
                  1. Dati Ospite
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#1E3A2F]/80 mb-1">
                      Nome Ospite *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Es. Mario Rossi"
                        value={guestName}
                        onChange={(e) => {
                          setGuestName(e.target.value);
                          if (e.target.value.trim()) setNameError(false);
                        }}
                        className={`w-full bg-white border rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#1E3A2F] focus:outline-none transition ${
                          nameError
                            ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50'
                            : 'border-[#1E3A2F]/20 focus:border-[#6B3FA0]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#1E3A2F]/80 mb-1">
                      Telefono
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                      <input
                        type="tel"
                        placeholder="+39 340 1234567"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#1E3A2F]/80 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                      <input
                        type="email"
                        placeholder="mario@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Orario e Coperti */}
              <div className="space-y-2 pt-2 border-t border-[#1E3A2F]/10">
                <span className="text-[11px] font-bold text-[#1E3A2F] uppercase tracking-wider block">
                  2. Orario & Coperti
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#1E3A2F]/80 mb-1">
                      Data
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl pl-8 pr-2 py-1.5 text-xs text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0] font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#1E3A2F]/80 mb-1">
                      Ora Inizio
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl pl-8 pr-2 py-1.5 text-xs text-[#1E3A2F] font-mono-num font-bold focus:outline-none focus:border-[#6B3FA0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#1E3A2F]/80 mb-1">
                      Numero Ospiti
                    </label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                      <select
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl pl-8 pr-2 py-1.5 text-xs text-[#1E3A2F] font-bold focus:outline-none focus:border-[#6B3FA0]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20].map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'Persona' : 'Persone'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Service Shifts with Structured Slot Grids (No Horizontal Scroll) */}
                <div className="space-y-3 pt-2">
                  {/* Sezione Pranzo */}
                  <div className="bg-[#F6F2E9]/60 border border-[#1E3A2F]/15 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1E3A2F] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Pranzo (12:00 – 14:30)</span>
                      </span>
                      <span className="text-[10px] text-[#1E3A2F]/60 font-medium">Slot ogni 15 min</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {LUNCH_SLOTS.map((slot) => {
                        const isSelected = startTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setStartTime(slot)}
                            className={`py-1.5 px-1 rounded-xl text-xs font-mono-num font-semibold text-center transition cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#6B3FA0] text-white shadow-sm font-bold ring-2 ring-[#6B3FA0]/30 scale-[1.02]'
                                : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#1E3A2F]/5 hover:border-[#1E3A2F]/30'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sezione Cena */}
                  <div className="bg-[#F6F2E9]/60 border border-[#1E3A2F]/15 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1E3A2F] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span>Cena (17:00 – 22:00)</span>
                      </span>
                      <span className="text-[10px] text-[#1E3A2F]/60 font-medium">Slot ogni 15 min</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
                      {DINNER_SLOTS.map((slot) => {
                        const isSelected = startTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setStartTime(slot)}
                            className={`py-1.5 px-1 rounded-xl text-xs font-mono-num font-semibold text-center transition cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#6B3FA0] text-white shadow-sm font-bold ring-2 ring-[#6B3FA0]/30 scale-[1.02]'
                                : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#1E3A2F]/5 hover:border-[#1E3A2F]/30'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary bar */}
                  <div className="flex items-center justify-between text-[11px] text-stone-600 bg-white border border-[#1E3A2F]/10 rounded-xl px-3 py-1.5 font-mono-num">
                    <span>Durata servizio: <strong>{customDuration} min</strong> ({partySize <= 2 ? '2 ore' : '2h 45m'})</span>
                    <span>Orario fine turno stimato: <strong className="text-[#1E3A2F]">{calculatedEndTime}</strong></span>
                  </div>
                </div>

                {/* Real-time Over-Capacity Alert if slot limit exceeded */}
                {!slotCapacityValidation.isValid && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs font-semibold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-rose-900 font-bold mb-0.5">Capienza Massima Raggiunta</strong>
                      <span>{slotCapacityValidation.reason}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Assegnazione Tavolo (COMPACT & STREAMLINED) */}
              <div className="space-y-2 pt-2 border-t border-[#1E3A2F]/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1E3A2F] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>3. Assegnazione Tavolo</span>
                  </span>

                  {/* Segmented Switcher if auto-merges are available */}
                  {recommendedMerges.length > 0 && (
                    <div className="flex bg-[#1E3A2F]/5 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setTableTab('single');
                          if (directMatches.length > 0) {
                            setSelectedOptionType('single_or_existing');
                            setSelectedTableOption(directMatches[0].tableId);
                          }
                        }}
                        className={`px-2.5 py-0.5 rounded-md transition ${
                          tableTab === 'single'
                            ? 'bg-white text-[#1E3A2F] shadow-2xs'
                            : 'text-[#1E3A2F]/60'
                        }`}
                      >
                        Tavoli Singoli ({directMatches.length + oversizedMatches.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTableTab('merge');
                          if (recommendedMerges.length > 0) {
                            setSelectedOptionType('auto_merge');
                            setSelectedMergeCandidate(recommendedMerges[0]);
                          }
                        }}
                        className={`px-2.5 py-0.5 rounded-md transition ${
                          tableTab === 'merge'
                            ? 'bg-[#1E3A2F] text-amber-200 shadow-2xs'
                            : 'text-[#1E3A2F]/60'
                        }`}
                      >
                        ✨ Accorpamenti ({recommendedMerges.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab: Recommended Merges */}
                {tableTab === 'merge' && recommendedMerges.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1 bg-amber-50/60 rounded-xl border border-amber-300">
                    {recommendedMerges.map((merge) => {
                      const isSelected =
                        selectedOptionType === 'auto_merge' &&
                        selectedMergeCandidate?.tableIds.join(',') === merge.tableIds.join(',');

                      return (
                        <div
                          key={merge.tableIds.join('-')}
                          onClick={() => {
                            setSelectedOptionType('auto_merge');
                            setSelectedMergeCandidate(merge);
                          }}
                          className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-amber-400/30 border-amber-600 ring-2 ring-amber-500 shadow-2xs font-bold'
                              : 'bg-white border-amber-200 hover:border-amber-400'
                          }`}
                        >
                          <div className="truncate">
                            <div className="font-bold text-[#1E3A2F] truncate">
                              {merge.combinedName}
                            </div>
                            <span className="text-[10px] text-stone-500">
                              {merge.zone.toUpperCase()} · {merge.totalCapacity} px
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                              isSelected ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {isSelected ? 'Scelto ✓' : 'Scegli'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab: Single Tables */}
                {(tableTab === 'single' || recommendedMerges.length === 0) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-[#1E3A2F]/15">
                    {directMatches.map((opt) => {
                      const isSelected =
                        selectedOptionType === 'single_or_existing' && selectedTableOption === opt.tableId;
                      return (
                        <button
                          key={opt.tableId}
                          type="button"
                          onClick={() => {
                            setSelectedOptionType('single_or_existing');
                            setSelectedTableOption(opt.tableId);
                            setSelectedMergeCandidate(null);
                          }}
                          className={`p-1.5 rounded-lg border text-left transition flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-[#6B3FA0]/15 border-[#6B3FA0] ring-2 ring-[#6B3FA0]/30 font-bold shadow-2xs'
                              : 'bg-[#FBF8F2] border-[#1E3A2F]/10 hover:border-[#6B3FA0]'
                          }`}
                        >
                          <span className="truncate font-brand font-bold">{opt.tableName}</span>
                          <span className="text-[9px] font-mono-num text-stone-500 shrink-0 ml-1">
                            {opt.capacity}p
                          </span>
                        </button>
                      );
                    })}

                    {oversizedMatches.map((opt) => {
                      const isSelected =
                        selectedOptionType === 'single_or_existing' && selectedTableOption === opt.tableId;
                      return (
                        <button
                          key={opt.tableId}
                          type="button"
                          onClick={() => {
                            setSelectedOptionType('single_or_existing');
                            setSelectedTableOption(opt.tableId);
                            setSelectedMergeCandidate(null);
                          }}
                          className={`p-1.5 rounded-lg border text-left transition flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-[#6B3FA0]/15 border-[#6B3FA0] ring-2 ring-[#6B3FA0]/30 font-bold shadow-2xs'
                              : 'bg-stone-50 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <span className="truncate font-bold">{opt.tableName}</span>
                          <span className="text-[9px] font-mono-num text-stone-400 shrink-0 ml-1">
                            {opt.capacity}p
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 4: Tags & Note */}
              <div className="space-y-1.5 pt-2 border-t border-[#1E3A2F]/10">
                <span className="text-[11px] font-bold text-[#1E3A2F] uppercase tracking-wider block">
                  4. Note & Esigenze (Opzionale)
                </span>

                <div className="flex flex-wrap gap-1">
                  {COMMON_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                          active
                            ? 'bg-[#1E3A2F] text-amber-100 font-bold shadow-2xs'
                            : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#1E3A2F]/5'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Note (es. allergie, preferenza finestra)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-1.5 text-xs text-[#1E3A2F] placeholder-stone-400 focus:outline-none focus:border-[#6B3FA0]"
                />
              </div>
            </form>
          )}
        </div>

        {/* 3. FIXED FOOTER (Always visible with Submit CTA) */}
        {!successBookingCode && (
          <div className="px-6 py-3.5 border-t border-[#1E3A2F]/15 bg-[#F6F2E9]/90 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs">
              <span className="text-stone-500 text-[10px] block leading-none">Assegnato:</span>
              <strong className="text-emerald-800 font-bold">{selectedDisplayLabel}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-xl text-xs transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                form="booking-form"
                className="px-5 py-2 bg-[#6B3FA0] hover:bg-[#5A338A] text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Conferma e Occupa Tavolo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
  DINING_SECTIONS,
  getTableDiningSection,
  getSectionArrivalsForSlot,
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
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { RecommendedMerge, TimeSlotOption, GuestProfile, VIPTier } from '../../types';
import { guestCrmService } from '../../services/guestCrmService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTableIds?: string[];
  initialGuest?: GuestProfile | null;
  initialStartTime?: string;
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
  initialGuest,
  initialStartTime,
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
  const [guestProfileId, setGuestProfileId] = useState<string | undefined>(undefined);
  const [vipTier, setVipTier] = useState<VIPTier | undefined>(undefined);
  const [matchedGuestProfile, setMatchedGuestProfile] = useState<GuestProfile | null>(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [guestSuggestions, setGuestSuggestions] = useState<GuestProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [date, setDate] = useState(globalDate);
  const [startTime, setStartTime] = useState(initialStartTime || globalTime);
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

  // Sync date and initialGuest when opening modal
  useEffect(() => {
    if (isOpen) {
      setDate(globalDate);
      setStartTime(initialStartTime || globalTime);
      setSuccessBookingCode(null);
      setErrorMessage(null);
      setNameError(false);
      const defaultDur = calcReservationDuration(partySize, settings);
      setCustomDuration(defaultDur);

      if (initialGuest) {
        setGuestName(initialGuest.name);
        setGuestPhone(initialGuest.phone || '');
        setGuestEmail(initialGuest.email || '');
        setGuestProfileId(initialGuest.id);
        setVipTier(initialGuest.vipTier);
        setDietaryRestrictions(initialGuest.dietaryRestrictions || []);
        setSelectedTags((prev) => Array.from(new Set([...prev, ...initialGuest.tags])));
        if (initialGuest.internalNotes) {
          setNotes(initialGuest.internalNotes);
        }
        setMatchedGuestProfile(initialGuest);
      } else {
        setGuestName('');
        setGuestPhone('');
        setGuestEmail('');
        setGuestProfileId(undefined);
        setVipTier(undefined);
        setMatchedGuestProfile(null);
        setDietaryRestrictions([]);
        setSelectedTags([]);
        setNotes('');
      }
    }
  }, [isOpen, globalDate, globalTime, initialGuest, initialStartTime]);

  const handleSelectGuestProfile = (profile: GuestProfile) => {
    setGuestName(profile.name);
    setGuestPhone(profile.phone || '');
    setGuestEmail(profile.email || '');
    setGuestProfileId(profile.id);
    setVipTier(profile.vipTier);
    setMatchedGuestProfile(profile);
    setDietaryRestrictions(profile.dietaryRestrictions || []);
    setSelectedTags((prev) => Array.from(new Set([...prev, ...profile.tags])));
    if (profile.internalNotes) {
      setNotes((prev) => (prev ? `${prev} | ${profile.internalNotes}` : profile.internalNotes || ''));
    }
    setShowSuggestions(false);
  };

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

  // Live Section Arrivals at current startTime
  const sectionArrivals = useMemo(() => {
    if (!isOpen || !date || !startTime) return { section_1: 0, section_2: 0, section_3: 0 };
    return getSectionArrivalsForSlot(date, startTime, reservations);
  }, [isOpen, date, startTime, reservations]);

  const isSelectedTableInBusySection = useMemo(() => {
    if (!selectedTableOption) return false;
    const targetOpt = [...directMatches, ...oversizedMatches].find((o) => o.tableId === selectedTableOption);
    if (!targetOpt || !targetOpt.sectionId) return false;
    const arrivalsInThisSec = sectionArrivals[targetOpt.sectionId] || 0;
    const hasAlternativeFreeSection = Object.values(sectionArrivals).some((arr) => arr === 0);
    return arrivalsInThisSec > 0 && hasAlternativeFreeSection;
  }, [selectedTableOption, directMatches, oversizedMatches, sectionArrivals]);

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="bg-[#121622] border border-[#273248] rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-slate-100">
        {/* 1. FIXED HEADER (Always visible) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#222A3C] bg-[#161C2A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 flex items-center justify-center font-bold shadow-xs">
              <Utensils className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">
                Nuova Prenotazione
              </h3>
              <p className="text-[11px] text-slate-400">
                Verifica disponibilità oraria e accorpamento tavoli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* 2. SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Success Screen */}
          {successBookingCode ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-lg font-semibold text-white">
                  Prenotazione Confermata!
                </h4>
                <p className="text-xs text-slate-400">
                  Il tavolo è stato riservato in sala.
                </p>
              </div>

              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 max-w-sm mx-auto space-y-1.5 shadow-xs">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Codice Prenotazione
                </div>
                <div className="font-mono text-2xl font-bold text-[#C084FC] tracking-wider">
                  {successBookingCode}
                </div>
                <div className="text-xs text-slate-300 font-medium pt-1.5 border-t border-[#242C3E]">
                  Ospite: <strong className="text-white">{guestName}</strong> ({partySize} px) · {date} ore {startTime} - {calculatedEndTime}
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
                  className="px-4 py-2 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Nuova Prenotazione
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Torna alla Sala
                </button>
              </div>
            </div>
          ) : (
            <form id="booking-form" onSubmit={handleSubmit} noValidate className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-semibold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Dati Ospite */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  1. Dati Ospite
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                      <span>Nome Ospite *</span>
                      {vipTier && (
                        <span className="text-[9px] font-semibold text-[#C084FC] uppercase tracking-wide">
                          {vipTier === 'top_spender' ? '💎 Top Spender' : vipTier === 'vip' ? '⭐ VIP' : ''}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 stroke-[1.5]" />
                      <input
                        type="text"
                        placeholder="Es. Mario Rossi..."
                        value={guestName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGuestName(val);
                          if (val.trim()) {
                            setNameError(false);
                            const matches = guestCrmService.searchGuests(val);
                            setGuestSuggestions(matches);
                            setShowSuggestions(matches.length > 0);
                          } else {
                            setShowSuggestions(false);
                          }
                        }}
                        onFocus={() => {
                          if (guestName.trim()) {
                            const matches = guestCrmService.searchGuests(guestName);
                            setGuestSuggestions(matches);
                            setShowSuggestions(matches.length > 0);
                          }
                        }}
                        className={`w-full bg-[#10141F] border rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none transition ${
                          nameError
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-[#273044] focus:border-[#8B31E0]'
                        }`}
                      />
                    </div>

                    {/* PRERES Smart Recognition™ Autocomplete Popup */}
                    {showSuggestions && guestSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#171D2B] rounded-2xl shadow-2xl border border-[#273248] py-1 z-50 max-h-48 overflow-y-auto">
                        <div className="px-2.5 py-1 text-[9px] font-semibold uppercase text-slate-400 border-b border-[#242C3E] flex items-center justify-between">
                          <span>PRERES Smart Recognition™</span>
                          <span className="text-[#C084FC] font-semibold">Ospiti Riconosciuti</span>
                        </div>
                        {guestSuggestions.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => handleSelectGuestProfile(g)}
                            className="w-full px-3 py-2 text-left hover:bg-[#8B31E0]/20 flex items-center justify-between gap-2 border-b border-[#222A3C] last:border-0 transition"
                          >
                            <div>
                              <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                                <span>{g.name}</span>
                                {g.vipTier === 'top_spender' && <span className="text-[9px] text-amber-400 font-semibold">💎 Top Spender</span>}
                                {g.vipTier === 'vip' && <span className="text-[9px] text-[#C084FC] font-semibold">⭐ VIP</span>}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {g.phone || g.email || 'Nessun recapito'} {g.dietaryRestrictions.length > 0 && `· ⚠️ ${g.dietaryRestrictions.join(', ')}`}
                              </div>
                            </div>
                            <span className="text-[10px] text-[#C084FC] font-semibold">Scegli</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-300 mb-1">
                      Telefono
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 stroke-[1.5]" />
                      <input
                        type="tel"
                        placeholder="+39 340 1234567"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-[#10141F] border border-[#273044] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 stroke-[1.5]" />
                      <input
                        type="email"
                        placeholder="mario@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full bg-[#10141F] border border-[#273044] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                      />
                    </div>
                  </div>
                </div>

                {/* MANAGER ALERT BANNER FOR RECOGNIZED GUEST */}
                {matchedGuestProfile?.attentionAlert?.isAttentionRequired && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border-2 text-xs space-y-1 animate-in fade-in ${
                      matchedGuestProfile.attentionAlert.alertColor === 'red'
                        ? 'bg-rose-950/40 border-rose-600 text-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.2)]'
                        : 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-[0_0_12px_rgba(5,150,105,0.2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider">
                      <span>
                        {matchedGuestProfile.attentionAlert.alertColor === 'red'
                          ? '🚨 ALERT MANAGER (OSPITE CRITICO DA ATTENZIONARE)'
                          : '🌟 ALERT MANAGER (OSPITE SPECIALE / VIP)'}
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-black/40 text-[9px]">
                        {matchedGuestProfile.attentionAlert.alertColor === 'red' ? 'ROSSO' : 'VERDE'}
                      </span>
                    </div>
                    <p className="text-white font-medium text-xs">
                      "{matchedGuestProfile.attentionAlert.reason}"
                    </p>
                  </div>
                )}

                {/* TOP SPENDER MANAGER ALERT BANNER (IF ENABLED BY MANAGER) */}
                {matchedGuestProfile?.enableTopSpenderAlert && (
                  <div className="mt-2 p-2.5 rounded-xl border-2 border-amber-500/60 bg-amber-950/30 text-amber-200 text-xs flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💎</span>
                      <div>
                        <strong className="text-amber-300 font-bold block text-xs">
                          VIP Top Spender (Spesa media: €{matchedGuestProfile.avgSpend}/coperto)
                        </strong>
                        <span className="text-[10px] text-slate-300">
                          Supera il doppio della soglia base (65€ x 2 = 130€). Assegnare tavolo prioritario e cura speciale.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Orario e Coperti */}
              <div className="space-y-2 pt-2 border-t border-[#222A3C]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  2. Orario & Coperti
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-300 mb-1">
                      Data
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 stroke-[1.5]" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#10141F] border border-[#273044] rounded-xl pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-300 mb-1">
                      Ora Inizio
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 stroke-[1.5]" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-[#10141F] border border-[#273044] rounded-xl pl-8 pr-2 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#8B31E0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-300 mb-1">
                      Numero Ospiti
                    </label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 stroke-[1.5]" />
                      <select
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="w-full bg-[#10141F] border border-[#273044] rounded-xl pl-8 pr-2 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-[#8B31E0]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20].map((num) => (
                          <option key={num} value={num} className="bg-[#121622] text-white">
                            {num} {num === 1 ? 'Persona' : 'Persone'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Service Shifts with Structured Slot Grids */}
                <div className="space-y-2 pt-2">
                  {/* Sezione Pranzo */}
                  <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>Pranzo (12:00 – 14:30)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Slot 15 min</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                      {LUNCH_SLOTS.map((slot) => {
                        const isSelected = startTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setStartTime(slot)}
                            className={`py-1.5 px-1 rounded-xl text-xs font-mono font-medium text-center transition cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#8B31E0] text-white font-bold shadow-xs border border-[#A855F7]/40'
                                : 'bg-[#10141F] border border-[#242C3E] text-slate-300 hover:border-[#8B31E0]/50'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sezione Cena */}
                  <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
                        <span>Cena (17:00 – 22:00)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Slot 15 min</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1">
                      {DINNER_SLOTS.map((slot) => {
                        const isSelected = startTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setStartTime(slot)}
                            className={`py-1.5 px-1 rounded-xl text-xs font-mono font-medium text-center transition cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#8B31E0] text-white font-bold shadow-xs border border-[#A855F7]/40'
                                : 'bg-[#10141F] border border-[#242C3E] text-slate-300 hover:border-[#8B31E0]/50'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 font-mono">
                    <span>Durata: <strong className="text-white">{customDuration}m</strong></span>
                    <span>Fine stimata: <strong className="text-[#34D399]">{calculatedEndTime}</strong></span>
                  </div>
                </div>

                {/* Over-Capacity Alert */}
                {!slotCapacityValidation.isValid && (
                  <div className="p-2.5 bg-rose-950/30 border border-rose-800/50 rounded-xl flex items-start gap-2 text-rose-300 text-xs font-medium animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-rose-200 font-semibold">Soglia Massima Raggiunta (Slot 15 Minuti)</strong>
                      <span className="text-[11px]">{slotCapacityValidation.reason}</span>
                    </div>
                  </div>
                )}

                {/* Live 15-Minute Slot Pacing & Section Balance Indicator */}
                {slotCapacityValidation.isValid && (
                  <div className="bg-[#10141F] border border-[#242C3E] rounded-2xl p-3 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#C084FC]" />
                        <span>Pacing Arrivi Scaglione {startTime} (15 Minuti)</span>
                      </span>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        Ritmo Regolare ✓
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono bg-[#171D2B] px-2.5 py-1.5 rounded-xl border border-[#222A3C]">
                      <span>
                        Arrivi alle {startTime}: <strong className="text-white">{(slotCapacityValidation.active4Seaters || 0) + (slotCapacityValidation.active2Seaters || 0)}</strong> (da 4: <strong className="text-[#C084FC]">{slotCapacityValidation.active4Seaters || 0}</strong>, da 2: <strong className="text-[#34D399]">{slotCapacityValidation.active2Seaters || 0}</strong>)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Regola: 2 tab da 4 | 1 tab da 4 + 2 da 2 | 3 tab da 2
                      </span>
                    </div>

                    {/* 3 Dining Room Sections Load Distribution */}
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Distribuzione Carico tra le 3 Sezioni di Sala:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {Object.values(DINING_SECTIONS).map((sec) => {
                          const arrivals = sectionArrivals[sec.id] || 0;
                          const isFree = arrivals === 0;
                          return (
                            <div
                              key={sec.id}
                              className={`p-2 rounded-xl border text-[11px] flex flex-col justify-between transition ${
                                isFree
                                  ? 'bg-[#151D2A] border-emerald-800/40 text-slate-200'
                                  : 'bg-[#1C1A24] border-amber-800/40 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between font-semibold">
                                <span className="truncate">{sec.name.split('—')[1] || sec.name}</span>
                                {isFree ? (
                                  <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                                    0 arrivi ✨
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                                    {arrivals} arrivo
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                <span>Cameriere: {sec.serverName.split(' ')[0]}</span>
                                {isFree && <span className="text-[9px] text-emerald-400 font-semibold">Consigliato</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-1.5">
                      💡 Lo scaglione di 15 minuti permette al cameriere di familiarizzare con la sezione e prendere la comanda prima dell’arrivo successivo, proteggendo la cucina dall’intasamento simultaneo.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 3: Assegnazione Tavolo */}
              <div className="space-y-2 pt-2 border-t border-[#222A3C]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C084FC] stroke-[1.5]" />
                    <span>3. Assegnazione Tavolo (Bilanciamento Sala)</span>
                  </span>

                  {recommendedMerges.length > 0 && (
                    <div className="flex bg-[#10141F] p-0.5 rounded-lg text-[10px] font-medium border border-[#242C3E]">
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
                            ? 'bg-[#171D2B] text-white shadow-xs border border-[#273248]'
                            : 'text-slate-400'
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
                            ? 'bg-[#8B31E0] text-white shadow-xs'
                            : 'text-slate-400'
                        }`}
                      >
                        ✨ Accorpamenti ({recommendedMerges.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab: Recommended Merges */}
                {tableTab === 'merge' && recommendedMerges.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1 bg-[#171D2B] rounded-xl border border-[#273248]">
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
                              ? 'bg-[#8B31E0]/20 border-[#8B31E0] text-white font-semibold'
                              : 'bg-[#10141F] border-[#242C3E] text-slate-300 hover:border-[#8B31E0]/40'
                          }`}
                        >
                          <div className="truncate">
                            <div className="font-semibold text-white truncate">
                              {merge.combinedName}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {merge.zone.toUpperCase()} · {merge.totalCapacity} px
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                              isSelected ? 'bg-[#8B31E0] text-white' : 'bg-[#171D2B] text-[#C084FC]'
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
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#171D2B] rounded-xl border border-[#273248]">
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
                            className={`p-2 rounded-xl border text-left transition flex flex-col justify-between text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-[#8B31E0]/20 border-[#8B31E0] text-white font-semibold shadow-xs'
                                : opt.isRecommendedForBalancing
                                ? 'bg-[#10141F] border-emerald-800/40 hover:border-emerald-500/70 text-slate-200'
                                : 'bg-[#10141F] border-[#242C3E] text-slate-300 hover:border-[#8B31E0]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate font-semibold text-white">{opt.tableName}</span>
                              <span className="text-[9px] font-mono text-[#34D399] shrink-0 font-bold ml-1">
                                {opt.capacity}p
                              </span>
                            </div>
                            <div className="flex items-center justify-between w-full text-[9px] text-slate-400 mt-1">
                              <span className="truncate">
                                {opt.sectionName?.split('—')[1]?.trim() || opt.sectionName}
                              </span>
                              {opt.isRecommendedForBalancing ? (
                                <span className="text-emerald-400 font-semibold shrink-0">✨ Bilanciato</span>
                              ) : (
                                <span className="text-amber-400 font-mono shrink-0">{opt.sectionArrivalsAtSlot} arr.</span>
                              )}
                            </div>
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
                            className={`p-2 rounded-xl border text-left transition flex flex-col justify-between text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-[#8B31E0]/20 border-[#8B31E0] text-white font-semibold shadow-xs'
                                : 'bg-[#10141F] border-[#242C3E] text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate font-medium">{opt.tableName}</span>
                              <span className="text-[9px] font-mono text-slate-500 shrink-0 ml-1">
                                {opt.capacity}p
                              </span>
                            </div>
                            <div className="flex items-center justify-between w-full text-[9px] text-slate-500 mt-1">
                              <span className="truncate">
                                {opt.sectionName?.split('—')[1]?.trim() || opt.sectionName}
                              </span>
                              <span>{opt.serverName?.split(' ')[0]}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Section balancing advisory banner if a loaded section is picked */}
                    {isSelectedTableInBusySection && (
                      <div className="p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-start gap-2 text-amber-300 text-xs animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-amber-200 font-semibold">Suggerimento Bilanciamento Sala</strong>
                          <span className="text-[11px] leading-relaxed">
                            La sezione del tavolo selezionato ha già 1 arrivo programmato alle {startTime}. 
                            Per distribuire equamente i commensali tra i 3 camerieri (15 min per tavolo) e non sovraccaricare la cucina con comande simultanee, è consigliato scegliere un tavolo nelle sezioni contrassegnate con ✨.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 4: Tags & Note */}
              <div className="space-y-1.5 pt-2 border-t border-[#222A3C]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
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
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                          active
                            ? 'bg-[#8B31E0] text-white font-semibold shadow-xs'
                            : 'bg-[#10141F] border border-[#242C3E] text-slate-300 hover:border-[#8B31E0]/40'
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
                  className="w-full bg-[#10141F] border border-[#273044] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
                />
              </div>
            </form>
          )}
        </div>

        {/* 3. FIXED FOOTER (Always visible with Submit CTA) */}
        {!successBookingCode && (
          <div className="px-6 py-3 border-t border-[#222A3C] bg-[#161C2A] flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs">
              <span className="text-slate-400 text-[10px] block leading-none">Assegnato:</span>
              <strong className="text-[#34D399] font-semibold">{selectedDisplayLabel}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#171D2B] hover:bg-[#20273A] text-slate-300 border border-[#273248] font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                form="booking-form"
                className="px-5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs transition shadow-md active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                <span>Conferma e Occupa</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

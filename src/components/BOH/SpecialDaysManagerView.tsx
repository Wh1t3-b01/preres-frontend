import React, { useState, useMemo } from 'react';
import {
  SpecialDayOverride,
  FloorPlanLayout,
  BohShift,
  DaySchedule,
} from '../../types/boh';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Clock,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Edit2,
} from 'lucide-react';

interface SpecialDaysManagerViewProps {
  specialDays: SpecialDayOverride[];
  allLayouts: FloorPlanLayout[];
  weeklySchedules: DaySchedule[];
  onUpdateSpecialDays: (updated: SpecialDayOverride[], changeReason?: string) => void;
}

export const SpecialDaysManagerView: React.FC<SpecialDaysManagerViewProps> = ({
  specialDays,
  allLayouts,
  weeklySchedules,
  onUpdateSpecialDays,
}) => {
  const { theme } = useRestaurant();
  const isLight = theme === 'light';

  // Dual view switcher: Calendar View vs List View
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [cultureFilter, setCultureFilter] = useState<'all' | 'it' | 'us' | 'uk'>('all');

  // Selected date in calendar
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date(2026, 11, 1)); // Default December 2026 for Holiday showcase (Thanksgiving, Christmas, NYE)

  // Drawer / Modal for editing a special day
  const [editingDay, setEditingDay] = useState<SpecialDayOverride | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [formDate, setFormDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<SpecialDayOverride['type']>('holiday');
  const [formCulture, setFormCulture] = useState<SpecialDayOverride['culture']>('it');
  const [formIsClosed, setFormIsClosed] = useState(false);
  const [formOverrideFloorPlanId, setFormOverrideFloorPlanId] = useState<string>('');
  const [formDeletedShifts, setFormDeletedShifts] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formOverrideTurnTimes, setFormOverrideTurnTimes] = useState<{
    party1_2: number;
    party3_4: number;
    party5_6: number;
    party7_plus: number;
  }>({
    party1_2: 120,
    party3_4: 150,
    party5_6: 180,
    party7_plus: 210,
  });

  const handleOpenEdit = (override: SpecialDayOverride) => {
    setEditingDay(override);
    setIsCreatingNew(false);
    setFormDate(override.date);
    setFormTitle(override.title);
    setFormType(override.type);
    setFormCulture(override.culture || 'it');
    setFormIsClosed(override.isClosed);
    setFormOverrideFloorPlanId(override.overrideFloorPlanId || '');
    setFormDeletedShifts(override.deletedShiftIds || []);
    setFormNotes(override.notes || '');
    if (override.overrideTurnTimes) {
      setFormOverrideTurnTimes(override.overrideTurnTimes);
    }
  };

  const handleOpenCreateForDate = (dateStr?: string) => {
    setEditingDay(null);
    setIsCreatingNew(true);
    setFormDate(dateStr || new Date().toISOString().split('T')[0]);
    setFormTitle('');
    setFormType('holiday');
    setFormCulture('it');
    setFormIsClosed(false);
    setFormOverrideFloorPlanId(allLayouts[0]?.id || '');
    setFormDeletedShifts([]);
    setFormNotes('');
    setFormOverrideTurnTimes({
      party1_2: 120,
      party3_4: 150,
      party5_6: 180,
      party7_plus: 210,
    });
  };

  const handleSaveSpecialDay = () => {
    if (!formDate || !formTitle.trim()) return;

    const newOverride: SpecialDayOverride = {
      id: editingDay ? editingDay.id : `spec_${Date.now().toString(36)}`,
      date: formDate,
      title: formTitle.trim(),
      type: formType,
      culture: formCulture,
      isClosed: formIsClosed,
      overrideFloorPlanId: formOverrideFloorPlanId || undefined,
      deletedShiftIds: formDeletedShifts,
      overrideTurnTimes: formOverrideTurnTimes,
      notes: formNotes.trim(),
    };

    let nextList: SpecialDayOverride[];
    if (editingDay) {
      nextList = specialDays.map((sd) => (sd.id === editingDay.id ? newOverride : sd));
    } else {
      nextList = [...specialDays, newOverride];
    }

    onUpdateSpecialDays(nextList, `Salvata eccezione giorno speciale "${newOverride.title}" (${newOverride.date})`);
    setEditingDay(null);
    setIsCreatingNew(false);
  };

  const handleDeleteSpecialDay = (id: string) => {
    const nextList = specialDays.filter((sd) => sd.id !== id);
    onUpdateSpecialDays(nextList, `Eliminata eccezione giorno speciale`);
    if (editingDay?.id === id) setEditingDay(null);
  };

  // Monthly Calendar Calculations
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const monthTitle = currentCalendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  // Special days map by date string
  const specialDaysMap = useMemo(() => {
    const map = new Map<string, SpecialDayOverride>();
    specialDays.forEach((sd) => map.set(sd.date, sd));
    return map;
  }, [specialDays]);

  const filteredSpecialDays = useMemo(() => {
    if (cultureFilter === 'all') return specialDays;
    return specialDays.filter((sd) => sd.culture === cultureFilter);
  }, [specialDays, cultureFilter]);

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL BAR: DUAL-VIEW SWITCHER & ADD BUTTON */}
      <div className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div>
          <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Giorni Speciali, Festività & Override di Turno
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Imposta chiusure straordinarie, cancellazione turni e hot-swap del floor plan per Capodanno, Natale o eventi privati senza alterare la programmazione settimanale.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dual-View Switcher (Calendar vs List) */}
          <div className={`flex items-center p-0.5 rounded-xl border ${
            isLight ? 'bg-slate-100/60 border-slate-200/70' : 'bg-[#151B2A] border-[#222A3C]'
          }`}>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                viewMode === 'calendar'
                  ? isLight
                    ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs'
                    : 'bg-[#1E2536] text-slate-100 border-[#2C364D] shadow-2xs'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Calendario</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                viewMode === 'list'
                  ? isLight
                    ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs'
                    : 'bg-[#1E2536] text-slate-100 border-[#2C364D] shadow-2xs'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Lista</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateForDate()}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Aggiungi Giorno Speciale</span>
          </button>
        </div>
      </div>

      {/* 2. DUAL-VIEW CONTENT */}
      {viewMode === 'calendar' ? (
        /* CALENDAR MONTH PICKER VIEW */
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentCalendarMonth(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="font-brand font-bold text-base capitalize text-slate-900 dark:text-white">
                {monthTitle}
              </h4>
              <button
                onClick={() => setCurrentCalendarMonth(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Culture / Region Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1A2234] p-1 rounded-xl border border-slate-200 dark:border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setCultureFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'all'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🌍 Tutte ({specialDays.length})
              </button>
              <button
                type="button"
                onClick={() => setCultureFilter('it')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'it'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇮🇹 Italia ({specialDays.filter((s) => s.culture === 'it').length})
              </button>
              <button
                type="button"
                onClick={() => setCultureFilter('us')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'us'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇺🇸 USA ({specialDays.filter((s) => s.culture === 'us').length})
              </button>
              <button
                type="button"
                onClick={() => setCultureFilter('uk')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'uk'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇬🇧 UK Bank Holidays ({specialDays.filter((s) => s.culture === 'uk').length})
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Chiuso / Festivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Hot-swap Floor Plan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Turni Modificati
              </span>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-slate-400">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] rounded-xl opacity-20" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const override = specialDaysMap.get(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    if (override) handleOpenEdit(override);
                    else handleOpenCreateForDate(dateStr);
                  }}
                  className={`min-h-[100px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    override
                      ? override.isClosed
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                        : override.overrideFloorPlanId
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60'
                        : 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-900/60'
                      : isLight
                      ? 'bg-slate-50/50 hover:bg-slate-100 border-slate-200'
                      : 'bg-[#171D2B]/50 hover:bg-[#1E2536] border-[#273248]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{dayNum}</span>
                    {override && (
                      <span className={`w-2 h-2 rounded-full ${
                        override.isClosed ? 'bg-rose-500' : override.overrideFloorPlanId ? 'bg-amber-500' : 'bg-sky-500'
                      }`} />
                    )}
                  </div>

                  {override ? (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold block line-clamp-2 leading-tight">
                        {override.title}
                      </span>
                      <span className="text-[9px] font-mono block text-slate-500">
                        {override.isClosed ? 'CHIUSO' : override.overrideFloorPlanId ? 'Layout Hot-Swap' : 'Orari Speciali'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 group-hover:text-slate-600 block opacity-0 hover:opacity-100">
                      + Aggiungi
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className={`p-5 rounded-2xl border space-y-3 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Elenco Eccezioni di Calendario ({filteredSpecialDays.length})
            </h4>

            {/* Culture / Region Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1A2234] p-1 rounded-xl border border-slate-200 dark:border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setCultureFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'all'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🌍 Tutte ({specialDays.length})
              </button>
              <button
                type="button"
                onClick={() => setCultureFilter('it')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'it'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇮🇹 Italia ({specialDays.filter((s) => s.culture === 'it').length})
              </button>
              <button
                type="button"
                onClick={() => setCultureFilter('us')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'us'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇺🇸 USA ({specialDays.filter((s) => s.culture === 'us').length})
              </button>
              <button
                type="button"
                onClick={() => setCultureFilter('uk')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  cultureFilter === 'uk'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇬🇧 UK ({specialDays.filter((s) => s.culture === 'uk').length})
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredSpecialDays.map((sd) => {
              const layoutOverride = allLayouts.find((l) => l.id === sd.overrideFloorPlanId);
              const cultureFlag = sd.culture === 'it' ? '🇮🇹' : sd.culture === 'us' ? '🇺🇸' : sd.culture === 'uk' ? '🇬🇧' : '🌍';
              const cultureLabel = sd.culture === 'it' ? 'Italia' : sd.culture === 'us' ? 'USA' : sd.culture === 'uk' ? 'UK' : 'Intl';
              return (
                <div
                  key={sd.id}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {sd.date}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {cultureFlag} {cultureLabel}
                      </span>
                      <h4 className="font-bold text-sm">{sd.title}</h4>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded-full border ${
                        sd.isClosed
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}>
                        {sd.isClosed ? 'Chiuso Tutto il Giorno' : 'Aperto con Override'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {sd.notes || 'Nessuna nota aggiuntiva.'}
                    </p>

                    {/* Features active on this special day */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      {layoutOverride && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <Layers className="w-3.5 h-3.5" /> Floor Plan Hot-Swap: {layoutOverride.name}
                        </span>
                      )}
                      {sd.deletedShiftIds && sd.deletedShiftIds.length > 0 && (
                        <span className="flex items-center gap-1 text-rose-600 font-semibold">
                          <X className="w-3.5 h-3.5" /> {sd.deletedShiftIds.length} turni cancellati
                        </span>
                      )}
                      {sd.overrideTurnTimes && (
                        <span className="flex items-center gap-1 text-sky-600 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> Turn Times festivi estesi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(sd)}
                      className="px-3 py-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDeleteSpecialDay(sd.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 cursor-pointer"
                      title="Elimina eccezione"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MODAL / DRAWER: DAY-LEVEL CUSTOMIZATION (HOT-SWAP FLOOR PLAN, SHIFT DELETION, TURN TIMES) */}
      {(editingDay || isCreatingNew) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl border max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#273248] text-white'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-sky-500" />
                  <span>{editingDay ? `Modifica: ${editingDay.title}` : 'Nuovo Override Giorno Speciale'}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Configura eccezione senza alterare la programmazione settimanale standard
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingDay(null);
                  setIsCreatingNew(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date & Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Data Eccezione (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Titolo / Festività</label>
                  <input
                    type="text"
                    placeholder="Es. Cenone di San Silvestro, Ringraziamento..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              {/* Close full day toggle */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <div>
                  <span className="text-xs font-bold block">Chiusura Totale (Full Day Close)</span>
                  <span className="text-[11px] text-slate-400">Il locale rimarrà completamente chiuso alle prenotazioni in questa data.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsClosed}
                  onChange={(e) => setFormIsClosed(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              {!formIsClosed && (
                <>
                  {/* HOT-SWAP FLOOR PLAN FOR THIS DAY ONLY */}
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-[#211B10] border-amber-800/60'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Hot-Swap Floor Plan (Assegna Layout Speciale)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Sostituisce il layout abituale unicamente per questo giorno speciale (es. Gala Capodanno con tavolate lunghe) senza modificare i giorni feriali.
                    </p>
                    <select
                      value={formOverrideFloorPlanId}
                      onChange={(e) => setFormOverrideFloorPlanId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold mt-1"
                    >
                      <option value="">Mantieni Floor Plan Predefinito</option>
                      {allLayouts.map((l) => (
                        <option key={l.id} value={l.id}>
                          Hot-swap: {l.name} ({l.tables.length} tavoli)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SHIFT DELETIONS (e.g. Delete lunch, keep dinner) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
                  }`}>
                    <span className="text-xs font-bold block">
                      Cancellazione Selettiva Turni Standard
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Seleziona i turni del programma settimanale da disattivare per questa giornata:
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {[
                        { id: 'shift_lunch', label: 'Turno Pranzo (12:00 - 15:30)' },
                        { id: 'shift_aperitivo', label: 'Aperitivo & Bar Lounge (18:00 - 20:00)' },
                        { id: 'shift_dinner', label: 'Turno Cena Rush (19:30 - 23:30)' },
                      ].map((sh) => {
                        const isDeleted = formDeletedShifts.includes(sh.id);
                        return (
                          <div
                            key={sh.id}
                            onClick={() => {
                              setFormDeletedShifts((prev) =>
                                prev.includes(sh.id) ? prev.filter((id) => id !== sh.id) : [...prev, sh.id]
                              );
                            }}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${
                              isDeleted ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700' : 'bg-white dark:bg-[#121622] border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <span>{sh.label}</span>
                            <span className="font-bold text-[10px] uppercase">
                              {isDeleted ? '✕ Disattivato' : '✓ Attivo'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* OVERRIDE TURN TIMES */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
                  }`}>
                    <span className="text-xs font-bold block">
                      Estensione Turn Times Speciali Festivi
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block">1-2p (min)</label>
                        <input
                          type="number"
                          value={formOverrideTurnTimes.party1_2}
                          onChange={(e) =>
                            setFormOverrideTurnTimes((p) => ({ ...p, party1_2: parseInt(e.target.value, 10) || 120 }))
                          }
                          className="w-full p-1 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">3-4p (min)</label>
                        <input
                          type="number"
                          value={formOverrideTurnTimes.party3_4}
                          onChange={(e) =>
                            setFormOverrideTurnTimes((p) => ({ ...p, party3_4: parseInt(e.target.value, 10) || 150 }))
                          }
                          className="w-full p-1 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">5-6p (min)</label>
                        <input
                          type="number"
                          value={formOverrideTurnTimes.party5_6}
                          onChange={(e) =>
                            setFormOverrideTurnTimes((p) => ({ ...p, party5_6: parseInt(e.target.value, 10) || 180 }))
                          }
                          className="w-full p-1 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">7+p (min)</label>
                        <input
                          type="number"
                          value={formOverrideTurnTimes.party7_plus}
                          onChange={(e) =>
                            setFormOverrideTurnTimes((p) => ({ ...p, party7_plus: parseInt(e.target.value, 10) || 210 }))
                          }
                          className="w-full p-1 border rounded text-center font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-bold block mb-1">Note Interne per la Sala / Cucina</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Es. Menu fisso 7 portate, brindisi a mezzanotte..."
                  className="w-full p-2.5 rounded-xl border text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setEditingDay(null);
                  setIsCreatingNew(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveSpecialDay}
                disabled={!formDate || !formTitle.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-40"
              >
                Salva Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  DaySchedule,
  BohShift,
  DayOfWeek,
  FloorPlanLayout,
} from '../../types/boh';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Activity,
  Sliders,
  Check,
  MoveVertical,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';

interface ShiftScheduleManagerViewProps {
  schedules: DaySchedule[];
  allLayouts: FloorPlanLayout[];
  onUpdateSchedules: (updated: DaySchedule[], changeReason?: string) => void;
}

const DAYS_OF_WEEK: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'monday', label: 'Lunedì', short: 'Lun' },
  { id: 'tuesday', label: 'Martedì', short: 'Mar' },
  { id: 'wednesday', label: 'Mercoledì', short: 'Mer' },
  { id: 'thursday', label: 'Giovedì', short: 'Gio' },
  { id: 'friday', label: 'Venerdì', short: 'Ven' },
  { id: 'saturday', label: 'Sabato', short: 'Sab' },
  { id: 'sunday', label: 'Domenica', short: 'Dom' },
];

const PRESET_COLORS = [
  '#0284C7', // Sky
  '#7C3AED', // Violet
  '#D97706', // Amber
  '#059669', // Emerald
  '#E11D48', // Rose
  '#4F46E5', // Indigo
];

// Helper to convert time "HH:mm" to minutes from 00:00
const timeToMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minsToTime = (m: number) => {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, m));
  const h = Math.floor(clamped / 60);
  const min = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

export const ShiftScheduleManagerView: React.FC<ShiftScheduleManagerViewProps> = ({
  schedules,
  allLayouts,
  onUpdateSchedules,
}) => {
  const { theme } = useRestaurant();
  const isLight = theme === 'light';

  // Selected Day tab
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('friday');

  // Selected shift for details panel
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Dragging handles state for edge resizing (top/start vs bottom/end)
  const [resizingEdge, setResizingEdge] = useState<{
    shiftId: string;
    edge: 'start' | 'end';
  } | null>(null);

  const activeDaySchedule = useMemo(() => {
    return schedules.find((s) => s.day === selectedDay) || schedules[0];
  }, [schedules, selectedDay]);

  const selectedShift = useMemo(() => {
    if (!selectedShiftId) return activeDaySchedule.shifts[0] || null;
    return activeDaySchedule.shifts.find((s) => s.id === selectedShiftId) || activeDaySchedule.shifts[0] || null;
  }, [activeDaySchedule.shifts, selectedShiftId]);

  // Update a shift in active day
  const handleUpdateShift = (shiftId: string, updates: Partial<BohShift>, reason?: string) => {
    const nextSchedules = schedules.map((ds) => {
      if (ds.day === selectedDay) {
        return {
          ...ds,
          shifts: ds.shifts.map((sh) => (sh.id === shiftId ? { ...sh, ...updates } : sh)),
        };
      }
      return ds;
    });
    onUpdateSchedules(nextSchedules, reason || `Aggiornato turno ${shiftId}`);
  };

  // Add new shift to active day
  const handleAddShift = () => {
    const shiftCount = activeDaySchedule.shifts.length + 1;
    const newShift: BohShift = {
      id: `shift_${selectedDay}_${Date.now().toString(36).slice(-4)}`,
      name: `Turno Servizio ${shiftCount}`,
      color: PRESET_COLORS[(shiftCount - 1) % PRESET_COLORS.length],
      startTime: '19:00',
      endTime: '23:00',
      linkedFloorPlanId: allLayouts[0]?.id || 'layout_main_default',
      flowControls: {
        coversPer15Min: 12,
        partiesPer15Min: 4,
        maxPacingCapacity: 60,
      },
      turnTimes: {
        party1_2: 90,
        party3_4: 120,
        party5_6: 150,
        party7_plus: 180,
      },
      isActive: true,
    };

    const nextSchedules = schedules.map((ds) => {
      if (ds.day === selectedDay) {
        return { ...ds, shifts: [...ds.shifts, newShift] };
      }
      return ds;
    });
    onUpdateSchedules(nextSchedules, `Aggiunto turno ${newShift.name} a ${activeDaySchedule.label}`);
    setSelectedShiftId(newShift.id);
  };

  // Delete shift
  const handleDeleteShift = (shiftId: string) => {
    const nextSchedules = schedules.map((ds) => {
      if (ds.day === selectedDay) {
        return { ...ds, shifts: ds.shifts.filter((s) => s.id !== shiftId) };
      }
      return ds;
    });
    onUpdateSchedules(nextSchedules, `Eliminato turno`);
    if (selectedShiftId === shiftId) setSelectedShiftId(null);
  };

  // Toggle Day Open/Closed
  const handleToggleDayOpen = () => {
    const nextSchedules = schedules.map((ds) => {
      if (ds.day === selectedDay) {
        return { ...ds, isOpen: !ds.isOpen };
      }
      return ds;
    });
    onUpdateSchedules(nextSchedules, `${activeDaySchedule.label} impostato su ${!activeDaySchedule.isOpen ? 'Aperto' : 'Chiuso'}`);
  };

  // Copy schedule to all weekdays or weekends
  const handleApplyToWeekdays = () => {
    const targetDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const srcShifts = activeDaySchedule.shifts;
    const nextSchedules = schedules.map((ds) => {
      if (targetDays.includes(ds.day)) {
        return { ...ds, isOpen: activeDaySchedule.isOpen, shifts: JSON.parse(JSON.stringify(srcShifts)) };
      }
      return ds;
    });
    onUpdateSchedules(nextSchedules, `Applicata programmazione di ${activeDaySchedule.label} a tutti i giorni feriali (Lun-Ven)`);
  };

  // Timeline range from 09:00 to 01:00 (16 hours total = 960 mins)
  const timelineStartMins = 9 * 60; // 540
  const timelineTotalMins = 16 * 60; // 960

  return (
    <div className="space-y-6">
      {/* 1. DAY OF WEEK SELECTOR & QUICK ACTIONS */}
      <div className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        {/* Days buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
          {DAYS_OF_WEEK.map((d) => {
            const daySched = schedules.find((s) => s.day === d.id);
            const isSelected = selectedDay === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex flex-col items-center border ${
                  isSelected
                    ? isLight
                      ? 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs font-semibold'
                      : 'bg-sky-950/40 text-sky-300 border-sky-800/50 shadow-2xs font-semibold'
                    : isLight
                    ? 'bg-white/80 hover:bg-slate-100/70 border-slate-200/70 text-slate-600'
                    : 'bg-[#151B2A] hover:bg-[#1E2536] border-[#222A3C] text-slate-300'
                }`}
              >
                <span>{d.label}</span>
                <span className={`text-[9px] font-mono mt-0.5 ${
                  isSelected ? 'opacity-80' : 'text-slate-400'
                }`}>
                  {daySched?.isOpen ? `${daySched.shifts.length} turni` : 'Chiuso'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Batch Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleDayOpen}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              activeDaySchedule.isOpen
                ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {activeDaySchedule.isOpen ? '✓ Giorno Aperto' : '✕ Locale Chiuso'}
          </button>

          <button
            onClick={handleApplyToWeekdays}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700' : 'bg-[#171D2B] hover:bg-[#1F2638] text-slate-300'
            }`}
            title="Replica questi turni su tutti i giorni da Lunedì a Venerdì"
          >
            Replica su Lun-Ven
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE: TIMELINE SCHEDULE BUILDER + SHIFT DETAILS & FLOW CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: VISUAL SHIFT TIMELINE BUILDER (6 Cols) */}
        <div className={`lg:col-span-6 p-4 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Timeline Turni: {activeDaySchedule.label}
              </h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Trascina o usa le frecce bordo (↑/↓) per estendere la durata dei turni
              </p>
            </div>

            <button
              onClick={handleAddShift}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuovo Turno</span>
            </button>
          </div>

          {/* Vertical/Horizontal Timeline Grid */}
          <div className="space-y-3 pt-1">
            {activeDaySchedule.shifts.length > 0 ? (
              activeDaySchedule.shifts.map((shift) => {
                const isSelected = selectedShift?.id === shift.id;
                const startM = timeToMins(shift.startTime);
                const endM = timeToMins(shift.endTime);
                const durationHours = ((endM - startM) / 60).toFixed(1);
                const linkedLayout = allLayouts.find((l) => l.id === shift.linkedFloorPlanId);

                return (
                  <div
                    key={shift.id}
                    onClick={() => setSelectedShiftId(shift.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-sky-500 shadow-md'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        : 'bg-[#171D2B] hover:bg-[#1E2536] border-[#273248]'
                    }`}
                  >
                    {/* Shift Color accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2"
                      style={{ backgroundColor: shift.color }}
                    />

                    <div className="pl-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: shift.color }}
                          />
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {shift.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-800">
                            {shift.startTime} - {shift.endTime} ({durationHours}h)
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShift(shift.id);
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Elimina turno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Interactive edge adjusters (start & end time steppers) */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Adjust start time */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Inizio:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newM = Math.max(0, startM - 15);
                              handleUpdateShift(shift.id, { startTime: minsToTime(newM) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold"
                            title="-15 min"
                          >
                            -15m
                          </button>
                          <span className="font-mono font-bold">{shift.startTime}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newM = Math.min(endM - 30, startM + 15);
                              handleUpdateShift(shift.id, { startTime: minsToTime(newM) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold"
                            title="+15 min"
                          >
                            +15m
                          </button>
                        </div>

                        {/* Adjust end time */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Fine:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newM = Math.max(startM + 30, endM - 15);
                              handleUpdateShift(shift.id, { endTime: minsToTime(newM) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold"
                            title="-15 min"
                          >
                            -15m
                          </button>
                          <span className="font-mono font-bold">{shift.endTime}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newM = Math.min(24 * 60 - 1, endM + 15);
                              handleUpdateShift(shift.id, { endTime: minsToTime(newM) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold"
                            title="+15 min"
                          >
                            +15m
                          </button>
                        </div>
                      </div>

                      {/* Linked Floor Plan info */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                        <Layers className="w-3.5 h-3.5 text-sky-500" />
                        <span>Floor Plan Collegato: <strong className="text-slate-800 dark:text-slate-200">{linkedLayout?.name || 'Standard'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-1">
                <Clock className="w-8 h-8 stroke-1" />
                <p className="text-xs font-semibold">Nessun turno configurato per {activeDaySchedule.label}</p>
                <p className="text-[11px]">Clicca su "+ Nuovo Turno" per iniziare il servizio.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SHIFT DETAILS PANEL, LINKED FLOOR PLAN & FLOW CONTROLS (6 Cols) */}
        <div className={`lg:col-span-6 p-4 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          {selectedShift ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    Dettagli & Vincoli di Flusso Turno
                  </h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedShift.name} ({activeDaySchedule.label})
                  </span>
                </div>

                <span
                  className="w-4 h-4 rounded-full border border-white"
                  style={{ backgroundColor: selectedShift.color }}
                />
              </div>

              {/* Name & Color Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Nome Interno Turno
                  </label>
                  <input
                    type="text"
                    value={selectedShift.name}
                    onChange={(e) => handleUpdateShift(selectedShift.id, { name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Colore Identificativo
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleUpdateShift(selectedShift.id, { color: col })}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          selectedShift.color === col ? 'border-white scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* LINK SPECIFIC FLOOR PLAN TO THIS SHIFT */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-[#172238] border-sky-800/60'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                  <Layers className="w-4 h-4" />
                  <span>Floor Plan Collegato a Questo Turno</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  All'avvio di questo turno, i dispositivi di sala caricheranno automaticamente questa disposizione tavoli.
                </p>
                <select
                  value={selectedShift.linkedFloorPlanId}
                  onChange={(e) => handleUpdateShift(selectedShift.id, { linkedFloorPlanId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-semibold mt-1"
                >
                  {allLayouts.map((layout) => (
                    <option key={layout.id} value={layout.id}>
                      {layout.name} ({layout.tables.length} tavoli) {layout.isDefault ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* FLOW CONTROLS (PACING EVERY 15 MINUTES) */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-sky-500" />
                    <span>Controllo Flussi & Pacing Cucina (Ogni 15 min)</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Pacing Engine</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Max Coperti / 15 min</label>
                    <input
                      type="number"
                      min="4"
                      max="30"
                      value={selectedShift.flowControls.coversPer15Min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 12;
                        handleUpdateShift(selectedShift.id, {
                          flowControls: { ...selectedShift.flowControls, coversPer15Min: val },
                        });
                      }}
                      className="w-full px-2 py-1 rounded border text-xs font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Max Tavoli / 15 min</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={selectedShift.flowControls.partiesPer15Min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 4;
                        handleUpdateShift(selectedShift.id, {
                          flowControls: { ...selectedShift.flowControls, partiesPer15Min: val },
                        });
                      }}
                      className="w-full px-2 py-1 rounded border text-xs font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* TABLE TURN TIMES BY PARTY SIZE */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Turn Times Tavolo Personalizzati per Party Size</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">1-2 persone</label>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min="45"
                        max="240"
                        value={selectedShift.turnTimes.party1_2}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 90;
                          handleUpdateShift(selectedShift.id, {
                            turnTimes: { ...selectedShift.turnTimes, party1_2: val },
                          });
                        }}
                        className="w-full px-1 py-1 rounded border text-xs font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-400">m</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">3-4 persone</label>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min="60"
                        max="240"
                        value={selectedShift.turnTimes.party3_4}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 120;
                          handleUpdateShift(selectedShift.id, {
                            turnTimes: { ...selectedShift.turnTimes, party3_4: val },
                          });
                        }}
                        className="w-full px-1 py-1 rounded border text-xs font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-400">m</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">5-6 persone</label>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min="60"
                        max="300"
                        value={selectedShift.turnTimes.party5_6}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 150;
                          handleUpdateShift(selectedShift.id, {
                            turnTimes: { ...selectedShift.turnTimes, party5_6: val },
                          });
                        }}
                        className="w-full px-1 py-1 rounded border text-xs font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-400">m</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">7+ persone</label>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min="90"
                        max="360"
                        value={selectedShift.turnTimes.party7_plus}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 180;
                          handleUpdateShift(selectedShift.id, {
                            turnTimes: { ...selectedShift.turnTimes, party7_plus: val },
                          });
                        }}
                        className="w-full px-1 py-1 rounded border text-xs font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-400">m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-1">
              <Sliders className="w-8 h-8 stroke-1" />
              <p className="text-xs font-semibold">Nessun turno selezionato</p>
              <p className="text-[11px]">Seleziona un turno a sinistra per visualizzarne e regolarne parametri e flussi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

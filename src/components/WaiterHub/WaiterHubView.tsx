import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { staffAttendanceService, AttendanceRecord } from '../../services/staffAttendanceService';
import { guestCrmService } from '../../services/guestCrmService';
import { SeatOrderModal } from '../WaiterTouch/SeatOrderModal';
import { TableCourseStage, RestaurantTable, Reservation } from '../../types';
import { timeToMins, minsToTime } from '../../utils/bookingEngine';
import {
  Utensils,
  Clock,
  AlertTriangle,
  Sparkles,
  Cake,
  Receipt,
  User,
  LogIn,
  LogOut,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  Flame,
  ShieldCheck,
  Send,
  Coffee,
  Wine,
} from 'lucide-react';

const COURSE_STAGES: {
  id: TableCourseStage;
  label: string;
  shortLabel: string;
  icon: string;
}[] = [
  { id: 'seated', label: '1. Seduti', shortLabel: 'Seduti', icon: '🪑' },
  { id: 'drinks', label: '2. Drink & Bar', shortLabel: 'Drink', icon: '🍸' },
  { id: 'appetizers', label: '3. Antipasti', shortLabel: 'Antipasti', icon: '🥗' },
  { id: 'mains', label: '4. Primi / Mains', shortLabel: 'Mains', icon: '🥩' },
  { id: 'dessert', label: '5. Dolci & Caffè', shortLabel: 'Dolci', icon: '🍰' },
  { id: 'bill_requested', label: '6. Conto Richiesto', shortLabel: 'Conto 💳', icon: '💳' },
  { id: 'clearing', label: '7. Fine / Libera', shortLabel: 'Libera', icon: '🧹' },
];

export const WaiterHubView: React.FC = () => {
  const {
    tables,
    reservations,
    selectedDate,
    selectedTime,
    setTableCourseStage,
    setTableAssistance,
    freeTable,
    updateReservation,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'tables' | 'timeline_gantt'>('tables');
  const [selectedZone, setSelectedZone] = useState<'all' | 'main_a' | 'main_b' | 'bar' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Operator Attendance State (Simone Rinaldi - Main A default)
  const [currentWaiterId] = useState('staff_simone');
  const [currentWaiterName] = useState('Simone Rinaldi');
  const [activePunchIn, setActivePunchIn] = useState<AttendanceRecord | undefined>(() =>
    staffAttendanceService.getActivePunchIn('staff_simone')
  );
  const [serviceMinutes, setServiceMinutes] = useState(0);

  // Comanda Modal State
  const [activeOrderTable, setActiveOrderTable] = useState<{
    table: RestaurantTable;
    reservation?: Reservation;
  } | null>(null);

  // Auto Punch-In al caricamento se non ancora timbrato
  useEffect(() => {
    let punch = staffAttendanceService.getActivePunchIn(currentWaiterId);
    if (!punch) {
      staffAttendanceService
        .punchIn({
          id: currentWaiterId,
          name: currentWaiterName,
          role: 'waiter',
          section: 'main_a',
        })
        .then((rec) => setActivePunchIn(rec));
    } else {
      setActivePunchIn(punch);
    }
  }, [currentWaiterId, currentWaiterName]);

  // Cronometro tempo turno attivo
  useEffect(() => {
    if (!activePunchIn) {
      setServiceMinutes(0);
      return;
    }
    const updateTime = () => {
      const diff = Date.now() - new Date(activePunchIn.punchInAt).getTime();
      setServiceMinutes(Math.max(0, Math.floor(diff / (1000 * 60))));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [activePunchIn]);

  const handlePunchOut = async () => {
    if (!activePunchIn) return;
    await staffAttendanceService.punchOut(currentWaiterId);
    setActivePunchIn(undefined);
  };

  const handleManualPunchIn = async () => {
    const rec = await staffAttendanceService.punchIn({
      id: currentWaiterId,
      name: currentWaiterName,
      role: 'waiter',
      section: selectedZone === 'all' ? 'main_a' : selectedZone,
    });
    setActivePunchIn(rec);
  };

  // Prenotazioni attive del giorno
  const todayReservations = useMemo(() => {
    return reservations.filter(
      (r) => r.reservationDate === selectedDate && r.status !== 'cancelled'
    );
  }, [reservations, selectedDate]);

  // Calcolo timeline per i camerieri (orari turno 12:00-15:30 e 19:00-23:30)
  const isLunch = selectedTime < '16:00';
  const shiftStartTime = isLunch ? '12:00' : '19:00';
  const shiftEndTime = isLunch ? '15:30' : '23:30';
  const shiftStartMins = timeToMins(shiftStartTime);
  const shiftEndMins = timeToMins(shiftEndTime);
  const totalShiftMins = shiftEndMins - shiftStartMins;

  const timeTicks = useMemo(() => {
    const ticks: string[] = [];
    for (let m = shiftStartMins; m <= shiftEndMins; m += 30) {
      ticks.push(minsToTime(m));
    }
    return ticks;
  }, [shiftStartMins, shiftEndMins]);

  // Filtro dei tavoli per zona
  const filteredTables = useMemo(() => {
    return tables
      .filter((t) => {
        if (selectedZone === 'all') return true;
        if (selectedZone === 'main_a') {
          return ['main_a', 'main'].includes(t.zone) && ['20', '21', '22', '23', 'G'].includes(t.id);
        }
        if (selectedZone === 'main_b') {
          return ['main_b', 'main'].includes(t.zone) && ['10', '11', '12', '13', '14', '15', '16'].includes(t.id);
        }
        return t.zone === selectedZone;
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const res = todayReservations.find((r) => r.assignedTableIds?.includes(t.id));
        return (
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (res && res.guestName.toLowerCase().includes(q))
        );
      });
  }, [tables, selectedZone, searchQuery, todayReservations]);

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto text-slate-100 animate-in fade-in duration-200">
      
      {/* 1. TOP OPERATOR HEADER WITH PUNCH-IN BADGE */}
      <div className="bg-[#121622] border border-[#273248] rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B31E0] to-[#6E20C0] text-white flex items-center justify-center font-brand font-bold text-lg shadow-md border border-[#A855F7]/30">
            <Utensils className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-brand font-bold text-white tracking-tight">
                Hub Sala & Comande Waiter
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold font-mono">
                {todayReservations.filter((r) => r.status === 'seated').length} Tavoli Occupati
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cameriere in servizio: <strong className="text-white">{currentWaiterName}</strong> · Assegnato a: <strong className="text-[#C084FC]">Sezione Main A & Booth VIP</strong>
            </p>
          </div>
        </div>

        {/* Punch-In & Active Shift Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#222A3C] pt-3 md:pt-0">
          {activePunchIn ? (
            <div className="flex items-center gap-3 bg-[#171D2B] border border-[#273248] rounded-2xl px-4 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Timbratura Attiva
                  </div>
                  <div className="text-xs text-slate-200 font-mono">
                    Dalle {new Date(activePunchIn.punchInAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} ({Math.floor(serviceMinutes / 60)}h {serviceMinutes % 60}m di turno)
                  </div>
                </div>
              </div>
              <button
                onClick={handlePunchOut}
                className="ml-2 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Timbra Uscita Fine Turno"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Fine Turno</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleManualPunchIn}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Timbra Accesso (Punch In)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION BAR: TABS, SECTIONS & SEARCH */}
      <div className="bg-[#121622] border border-[#273248] rounded-2xl p-2.5 sm:px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        
        {/* Primary View Switcher: Tavoli & Comande vs Timeline Gantt Arrivi */}
        <div className="flex items-center bg-[#10141F] border border-[#242C3E] rounded-xl p-0.5">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'bg-[#8B31E0] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Tavoli & Comande Sala</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline_gantt')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timeline_gantt'
                ? 'bg-[#8B31E0] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline Gantt & Arrivi Turno</span>
          </button>
        </div>

        {/* Section Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tutti' },
            { id: 'main_a', label: 'Main A (Simone)' },
            { id: 'main_b', label: 'Main B' },
            { id: 'bar', label: 'Bar' },
            { id: 'private', label: 'Privé' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedZone(sec.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedZone === sec.id
                  ? 'bg-white text-[#10141F] font-bold shadow-xs'
                  : 'bg-[#171D2B] text-slate-400 hover:text-white border border-[#242C3E]'
              }`}
            >
              {sec.label}
            </button>
          ))}

          {/* Quick Search */}
          <div className="relative w-44 shrink-0 hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cerca tavolo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
            />
          </div>
        </div>
      </div>

      {/* 3A. VIEW TAB 1: TAVOLI & GESTIONE COMANDE */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map((table) => {
            const seatedRes = todayReservations.find(
              (r) => r.assignedTableIds?.includes(table.id) && r.status === 'seated'
            );
            const upcomingRes = todayReservations.find(
              (r) => r.assignedTableIds?.includes(table.id) && r.status === 'confirmed'
            );
            const res = seatedRes || upcomingRes;
            const guestProfile = res ? guestCrmService.getProfileByNameOrPhone(res.guestName, res.guestPhone) : undefined;
            const currentStage = table.courseStage || 'seated';

            const hasAllergies = guestProfile?.dietaryRestrictions && guestProfile.dietaryRestrictions.length > 0;
            const hasAttention = guestProfile?.attentionAlert?.isAttentionRequired;
            const isTopSpender = guestProfile?.isTopSpender;

            // Estimated bill
            const billEstimate = res?.totalSpendEstimate || (table.id === 'G' ? 185 : table.id === '21' ? 230 : table.id === '20' ? 110 : 0);

            return (
              <div
                key={table.id}
                className={`bg-[#121622] border rounded-3xl p-5 shadow-xl flex flex-col justify-between transition relative overflow-hidden ${
                  seatedRes
                    ? table.needsAssistance
                      ? 'border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)] ring-1 ring-rose-500'
                      : 'border-emerald-600/60 shadow-emerald-950/20'
                    : upcomingRes
                    ? 'border-blue-600/50'
                    : 'border-[#222A3C] opacity-75'
                }`}
              >
                {/* Top Card Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#222A3C]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-2xl bg-[#1A2234] border border-[#2B3752] flex items-center justify-center font-brand font-bold text-white text-base">
                        {table.tableNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{table.name}</span>
                          {table.id === 'G' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800 font-bold">
                              BOOTH VIP
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {table.capacity} posti · Zona: <span className="capitalize">{table.zone.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>

                    {seatedRes ? (
                      <div className="text-right">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                          Seduti ({seatedRes.partySize} pax)
                        </span>
                        <span className="text-[10px] font-mono text-[#34D399] font-bold block mt-1">
                          Conto: € {billEstimate}
                        </span>
                      </div>
                    ) : upcomingRes ? (
                      <div className="text-right">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800">
                          Arrivo {upcomingRes.startTime}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {upcomingRes.partySize} persone
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">Tavolo Libero</span>
                    )}
                  </div>

                  {/* Occupant / Guest Details */}
                  {res && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Ospite: {res.guestName}
                        </span>
                        {isTopSpender && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>VIP Top Spender</span>
                          </span>
                        )}
                      </div>

                      {/* HIGH-VISIBILITY ALLERGY BADGES */}
                      {hasAllergies && (
                        <div className="p-2.5 bg-rose-950/30 border border-rose-600/70 rounded-2xl space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Allergie Notificate:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {guestProfile!.dietaryRestrictions.map((diet, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-rose-900 text-white font-bold text-[10px] rounded-lg border border-rose-700 shadow-xs"
                              >
                                ⚠️ {diet}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MANAGER ATTENTION ALERT */}
                      {hasAttention && guestProfile?.attentionAlert && (
                        <div
                          className={`p-2 rounded-xl text-xs ${
                            guestProfile.attentionAlert.alertColor === 'red'
                              ? 'bg-rose-950/40 border border-rose-500/60 text-rose-200'
                              : 'bg-emerald-950/40 border border-emerald-500/60 text-emerald-200'
                          }`}
                        >
                          <span className="font-bold text-[10px] block uppercase">
                            Avviso Manager:
                          </span>
                          <span className="italic text-[11px] leading-snug">
                            "{guestProfile.attentionAlert.reason}"
                          </span>
                        </div>
                      )}

                      {/* SPECIAL OCCASIONS */}
                      {(guestProfile?.birthday || res.tags?.some((t) => t.includes('Birthday'))) && (
                        <div className="p-2 bg-[#1B2232] border border-[#2A3750] rounded-xl text-xs text-amber-300 flex items-center gap-1.5">
                          <Cake className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Ricorrenza Compleanno: Spumante al dessert.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* COURSE STAGE QUICK BUTTONS */}
                  {seatedRes && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Avanza Stato Portata:
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {COURSE_STAGES.slice(0, 6).map((stg) => (
                          <button
                            key={stg.id}
                            onClick={() => {
                              setTableCourseStage(table.id, stg.id);
                            }}
                            className={`p-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 truncate ${
                              currentStage === stg.id
                                ? 'bg-[#8B31E0] text-white border-[#8B31E0] shadow-sm font-bold'
                                : 'bg-[#171D2B] border-[#273248] text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{stg.icon}</span>
                            <span className="truncate">{stg.shortLabel}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTION: APRI PRESA COMANDA MODAL */}
                <div className="pt-3 border-t border-[#222A3C] mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveOrderTable({ table, reservation: res })}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-[#8B31E0] to-[#6E20C0] hover:from-[#9D44F7] hover:to-[#8B31E0] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>{seatedRes ? 'Gestisci Comanda & Conto' : 'Apri Tavolo / Comanda'}</span>
                  </button>

                  {seatedRes && (
                    <button
                      onClick={() => freeTable(table.id)}
                      className="py-2 px-3 bg-[#171D2B] hover:bg-[#20273A] text-slate-400 hover:text-white border border-[#273248] rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Libera tavolo"
                    >
                      Libera
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3B. VIEW TAB 2: TIMELINE GANTT DEI TAVOLI & ARRIVI TURNO */}
      {activeTab === 'timeline_gantt' && (
        <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#222A3C]">
            <div>
              <h3 className="font-brand font-bold text-base text-white flex items-center gap-2">
                <span>Timeline Gantt Arrivi & Turni Tavoli</span>
                <span className="text-[10px] bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 font-bold px-2 py-0.5 rounded-full font-mono">
                  {isLunch ? 'Turno Pranzo 12:00 - 15:30' : 'Turno Cena 19:00 - 23:30'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pianificazione arrivi: verifica gli orari di fine servizio per liberare e riallestire i tavoli del secondo turno.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Data: {selectedDate}
            </span>
          </div>

          {/* Gantt Matrix */}
          <div className="overflow-x-auto min-w-[700px]">
            {/* Header Time Ticks */}
            <div className="flex border-b border-[#242C3E] pb-2 text-[10px] font-mono text-slate-400">
              <div className="w-28 shrink-0 font-bold text-white uppercase tracking-wider pl-2">
                Tavolo
              </div>
              <div className="flex-1 relative h-5">
                {timeTicks.map((time, idx) => {
                  const leftPct = ((timeToMins(time) - shiftStartMins) / totalShiftMins) * 100;
                  return (
                    <span
                      key={idx}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${leftPct}%` }}
                    >
                      {time}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Table Rows with Horizontal Reservation Blocks */}
            <div className="divide-y divide-[#222A3C] pt-1">
              {filteredTables.map((t) => {
                const tableRes = todayReservations.filter((r) =>
                  r.assignedTableIds?.includes(t.id) || r.tableId === t.id
                );

                return (
                  <div key={t.id} className="flex items-center py-2.5 hover:bg-[#171D2B]/40 transition">
                    <div className="w-28 shrink-0 pr-2 pl-2">
                      <span className="font-bold text-xs text-white block">
                        Tavolo {t.tableNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {t.capacity}p · {t.zone}
                      </span>
                    </div>

                    <div className="flex-1 relative h-9 bg-[#10141F] rounded-xl border border-[#222A3C] overflow-hidden">
                      {tableRes.map((r) => {
                        const startM = Math.max(shiftStartMins, timeToMins(r.startTime));
                        const endM = Math.min(shiftEndMins, timeToMins(r.endTime));
                        const leftPct = Math.max(0, ((startM - shiftStartMins) / totalShiftMins) * 100);
                        const widthPct = Math.max(4, ((endM - startM) / totalShiftMins) * 100);

                        const isSeated = r.status === 'seated';

                        return (
                          <div
                            key={r.id}
                            onClick={() => setActiveOrderTable({ table: t, reservation: r })}
                            className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center justify-between text-[11px] font-bold text-white shadow-md cursor-pointer transition hover:brightness-110 truncate ${
                              isSeated
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 border border-emerald-400'
                                : 'bg-gradient-to-r from-[#8B31E0] to-[#6E20C0] border border-[#A855F7]/60'
                            }`}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            title={`${r.guestName} (${r.partySize}p) dalle ${r.startTime} alle ${r.endTime}`}
                          >
                            <span className="truncate">
                              {r.guestName} ({r.partySize}p)
                            </span>
                            <span className="font-mono text-[9px] opacity-80 shrink-0 ml-1">
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
      )}

      {/* 4. SEAT-BY-SEAT COMANDA ORDER MODAL */}
      {activeOrderTable && (
        <SeatOrderModal
          table={activeOrderTable.table}
          reservation={activeOrderTable.reservation}
          serverName={currentWaiterName}
          onClose={() => setActiveOrderTable(null)}
          onUpdateReservation={updateReservation}
          onUpdateTableStage={setTableCourseStage}
        />
      )}
    </div>
  );
};

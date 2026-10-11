import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { staffAttendanceService, AttendanceRecord } from '../../services/staffAttendanceService';
import { guestCrmService } from '../../services/guestCrmService';
import { TableZone, TableCourseStage, Reservation } from '../../types';
import {
  Users,
  Clock,
  AlertTriangle,
  Heart,
  Cake,
  Sparkles,
  Utensils,
  CheckCircle2,
  Calendar,
  Wine,
  Flame,
  Search,
  LogIn,
  LogOut,
  Coffee,
  Receipt,
  Eye,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';

const COURSE_STAGE_LABELS: Record<TableCourseStage, { label: string; color: string; step: number }> = {
  seated: { label: 'Accomodati (Menu)', color: 'bg-blue-950/50 text-blue-300 border-blue-800', step: 1 },
  drinks: { label: 'Bevande Servite', color: 'bg-cyan-950/50 text-cyan-300 border-cyan-800', step: 2 },
  appetizers: { label: 'Antipasti in Tavola', color: 'bg-amber-950/50 text-amber-300 border-amber-800', step: 3 },
  mains: { label: 'Primi / Secondi (Mains)', color: 'bg-emerald-950/50 text-emerald-300 border-emerald-800', step: 4 },
  dessert: { label: 'Dolci & Ammazzacaffè', color: 'bg-purple-950/50 text-purple-300 border-purple-800', step: 5 },
  bill_requested: { label: 'Conto Richiesto', color: 'bg-rose-950/50 text-rose-300 border-rose-800', step: 6 },
  clearing: { label: 'Fine Pasto / Sparecchio', color: 'bg-slate-800/80 text-slate-300 border-slate-700', step: 7 },
};

// Simulazione comande attive per la vista sala
const SIMULATED_TABLE_ORDERS: Record<string, { items: string[]; sentTime: string; total: number }> = {
  G: {
    items: [
      '2x Barolo DOCG Cru Pio Cesare (Bar)',
      '1x Filetto di Manzo al Barolo - Cottura: Media al Sangue',
      '1x Costata di Fassona 600g - Cottura: Al Sangue',
      '2x Patate al Forno con Rosmarino',
      '1x Caponata Siciliana Tradizionale',
    ],
    sentTime: '12:45',
    total: 185,
  },
  '20': {
    items: [
      '1x Bottiglia Franciacorta Satèn (Bar)',
      '1x Tagliatelle al Ragù Bianco di Coniglio',
      '1x Risotto allo Zafferano e Midollo',
      '2x Acqua Naturale Temp. Ambiente',
    ],
    sentTime: '13:05',
    total: 110,
  },
  '21': {
    items: [
      '4x Calice Chianti Classico Riserva',
      '2x Battuta di Manzo al Coltello',
      '2x Risotto ai Porcini',
      '2x Filetto di Chianina al Pepe Verde',
    ],
    sentTime: '12:50',
    total: 230,
  },
  B1: {
    items: [
      '2x Negroni Sbagliato Signature (Bar)',
      '1x Tagliere di Salumi Tipici e Focaccia',
    ],
    sentTime: '13:15',
    total: 42,
  },
};

export const ServerView: React.FC = () => {
  const { tables, reservations, selectedDate, theme } = useRestaurant();
  const isLight = theme === 'light';
  const { user } = useAuth();

  const [selectedSection, setSelectedSection] = useState<'all' | 'main_a' | 'main_b' | 'bar' | 'private'>('all');
  const [selectedSubTab, setSelectedSubTab] = useState<'tables' | 'timeline_readonly'>('tables');
  const [searchFilter, setSearchFilter] = useState('');

  // Operator Punch-In State (Pre-impostato su Simone Rinaldi o operatore autenticato)
  const [operatorId, setOperatorId] = useState('staff_simone');
  const [operatorName, setOperatorName] = useState('Simone Rinaldi');
  const [activePunchIn, setActivePunchIn] = useState<AttendanceRecord | undefined>(() =>
    staffAttendanceService.getActivePunchIn('staff_simone')
  );
  const [serviceMinutes, setServiceMinutes] = useState(0);

  // Auto Punch-In al caricamento se non ancora timbrato
  useEffect(() => {
    let punch = staffAttendanceService.getActivePunchIn(operatorId);
    if (!punch) {
      staffAttendanceService
        .punchIn({
          id: operatorId,
          name: operatorName,
          role: 'waiter',
          section: 'main_a',
        })
        .then((rec) => {
          setActivePunchIn(rec);
        });
    } else {
      setActivePunchIn(punch);
    }
  }, [operatorId, operatorName]);

  // Cronometro tempo turno attivo
  useEffect(() => {
    if (!activePunchIn) {
      setServiceMinutes(0);
      return;
    }

    const calcMinutes = () => {
      const now = Date.now();
      const inTime = new Date(activePunchIn.punchInAt).getTime();
      const mins = Math.max(0, Math.floor((now - inTime) / (1000 * 60)));
      setServiceMinutes(mins);
    };

    calcMinutes();
    const interval = setInterval(calcMinutes, 60000);
    return () => clearInterval(interval);
  }, [activePunchIn]);

  const handlePunchOut = async () => {
    if (!activePunchIn) return;
    await staffAttendanceService.punchOut(operatorId);
    setActivePunchIn(undefined);
  };

  const handleManualPunchIn = async () => {
    const rec = await staffAttendanceService.punchIn({
      id: operatorId,
      name: operatorName,
      role: 'waiter',
      section: selectedSection === 'all' ? 'main_a' : selectedSection,
    });
    setActivePunchIn(rec);
  };

  // Seleziona le prenotazioni del giorno
  const todayReservations = useMemo(() => {
    return reservations.filter(
      (r) => r.reservationDate === selectedDate && r.status !== 'cancelled'
    );
  }, [reservations, selectedDate]);

  // Mappa tavoli con relative prenotazioni attive/future
  const tableCards = useMemo(() => {
    return tables
      .filter((table) => {
        if (selectedSection !== 'all') {
          if (selectedSection === 'main_a') {
            return ['main_a', 'main'].includes(table.zone) && ['20', '21', '22', '23', 'G'].includes(table.id);
          }
          if (selectedSection === 'main_b') {
            return ['main_b', 'main'].includes(table.zone) && ['10', '11', '12', '13', '14', '15', '16'].includes(table.id);
          }
          return table.zone === selectedSection;
        }
        return true;
      })
      .map((table) => {
        // Cerca prenotazione attualmente seduta o confermata
        const seatedRes = todayReservations.find(
          (r) => r.assignedTableIds?.includes(table.id) && r.status === 'seated'
        );
        const upcomingRes = todayReservations.find(
          (r) => r.assignedTableIds?.includes(table.id) && r.status === 'confirmed'
        );
        const currentRes = seatedRes || upcomingRes;

        // Recupera profilo CRM del cliente per allergie e alert manager
        const guestProfile = currentRes?.guestName
          ? guestCrmService.getProfileByNameOrPhone(currentRes.guestName, currentRes.guestPhone)
          : undefined;

        // Calcola tempo seduto (default o orario effettivo)
        let elapsedMins = 0;
        if (seatedRes?.seatedAt) {
          elapsedMins = Math.floor((Date.now() - new Date(seatedRes.seatedAt).getTime()) / (1000 * 60));
        } else if (seatedRes) {
          elapsedMins = 38; // Default verosimile per visualizzazione
        }

        // Stadio della portata (default sequenziale basato sul tavolo se non esplicito)
        const stage: TableCourseStage =
          currentRes?.courseStage ||
          (table.id === 'G' ? 'mains' : table.id === '20' ? 'appetizers' : table.id === 'B1' ? 'drinks' : seatedRes ? 'mains' : 'seated');

        const activeOrder = SIMULATED_TABLE_ORDERS[table.id];

        return {
          table,
          currentRes,
          isSeated: Boolean(seatedRes),
          isUpcoming: Boolean(upcomingRes && !seatedRes),
          guestProfile,
          elapsedMins,
          stage,
          activeOrder,
        };
      })
      .filter((card) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
          card.table.name.toLowerCase().includes(q) ||
          card.table.id.toLowerCase().includes(q) ||
          card.currentRes?.guestName.toLowerCase().includes(q) ||
          card.guestProfile?.dietaryRestrictions.some((d) => d.toLowerCase().includes(q)) ||
          card.guestProfile?.preferences.some((p) => p.toLowerCase().includes(q))
        );
      });
  }, [tables, todayReservations, selectedSection, searchFilter]);

  return (
    <div className={`space-y-5 animate-in fade-in duration-200 transition-colors ${
      isLight ? 'text-slate-900' : 'text-slate-100'
    }`}>
      {/* TOP HEADER: SERVER IDENTITY & PUNCH-IN STATUS */}
      <div className={`border rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248]'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold shadow-xs ${
            isLight ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-[#8B31E0]/20 border-[#8B31E0]/40 text-[#C084FC]'
          }`}>
            <Utensils className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-brand font-bold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Server View & Controllo Sala
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider flex items-center gap-1 ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sola Lettura Protetta
              </span>
            </div>
            <p className={`text-xs flex items-center gap-2 mt-0.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Operatore: <strong className={isLight ? 'text-slate-800' : 'text-white'}>{operatorName}</strong></span>
              <span>·</span>
              <span>Postazione Assegnata: <strong className={isLight ? 'text-sky-700' : 'text-[#C084FC]'}>Sezione Main A & Booth VIP</strong></span>
            </p>
          </div>
        </div>

        {/* PUNCH-IN TIMBRATURA BADGE & ACTION */}
        <div className={`flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 ${
          isLight ? 'border-slate-100' : 'border-[#222A3C]'
        }`}>
          {activePunchIn ? (
            <div className={`flex items-center gap-3 border rounded-2xl px-4 py-2 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <div className={`text-[10px] uppercase font-bold tracking-wider ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>
                    Punch-In Attivo
                  </div>
                  <div className={`text-xs font-mono ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    Dalle {new Date(activePunchIn.punchInAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} ({Math.floor(serviceMinutes / 60)}h {serviceMinutes % 60}m)
                  </div>
                </div>
              </div>
              <button
                onClick={handlePunchOut}
                className={`ml-2 px-3 py-1.5 border rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-800/60'
                }`}
                title="Timbra Uscita Fine Turno"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Fine Turno</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleManualPunchIn}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Timbra Accesso (Punch In)</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER & VIEW SELECTOR BAR */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border rounded-2xl p-2 sm:px-4 sm:py-2.5 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248]'
      }`}>
        {/* Section Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className={`text-[10px] uppercase tracking-wider font-bold mr-1 hidden sm:inline ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Sezione:
          </span>
          {[
            { id: 'all', label: 'Tutte le Zone' },
            { id: 'main_a', label: 'Main A (Simone)' },
            { id: 'main_b', label: 'Main B' },
            { id: 'bar', label: 'Zona Bar' },
            { id: 'private', label: 'Privé' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                selectedSection === sec.id
                  ? isLight
                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                    : 'bg-[#8B31E0] text-white border-[#8B31E0] shadow-md'
                  : isLight
                  ? 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                  : 'bg-[#171D2B] text-slate-400 hover:text-white border-[#242C3E]'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Search Input & Sub-tab Switch */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              placeholder="Cerca tavolo, ospite, allergia..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500'
                  : 'bg-[#10141F] border-[#242C3E] text-white placeholder-slate-500 focus:border-[#8B31E0]'
              }`}
            />
          </div>

          <div className={`flex items-center border rounded-xl p-0.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#10141F] border-[#242C3E]'
          }`}>
            <button
              onClick={() => setSelectedSubTab('tables')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedSubTab === 'tables'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'bg-[#1E2638] text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tavoli di Sala
            </button>
            <button
              onClick={() => setSelectedSubTab('timeline_readonly')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedSubTab === 'timeline_readonly'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'bg-[#1E2638] text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Timeline Turno
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: TABLE CARDS GRID (STATUS, ORDERS, ALLERGIES, ALERTS) */}
      {selectedSubTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tableCards.map(({ table, currentRes, isSeated, isUpcoming, guestProfile, elapsedMins, stage, activeOrder }) => {
            const stageConfig = COURSE_STAGE_LABELS[stage];
            const hasAllergies = guestProfile?.dietaryRestrictions && guestProfile.dietaryRestrictions.length > 0;
            const hasAttention = guestProfile?.attentionAlert?.isAttentionRequired;
            const isTopSpender = guestProfile?.isTopSpender;

            return (
              <div
                key={table.id}
                className={`border rounded-3xl p-5 shadow-xs flex flex-col justify-between transition relative overflow-hidden ${
                  isLight
                    ? isSeated
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : isUpcoming
                      ? 'border-sky-300 bg-sky-50/20'
                      : 'border-slate-200 bg-white opacity-85'
                    : isSeated
                    ? 'bg-[#121622] border-emerald-600/50 shadow-emerald-950/20'
                    : isUpcoming
                    ? 'bg-[#121622] border-blue-600/40'
                    : 'bg-[#121622] border-[#222A3C] opacity-75'
                }`}
              >
                {/* Visual Status Indicator Top Banner */}
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isLight ? 'border-slate-100' : 'border-[#222A3C]'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-brand font-bold text-base ${
                      isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-900'
                        : 'bg-[#1A2234] border-[#2B3752] text-white'
                    }`}>
                      {table.id}
                    </span>
                    <div>
                      <h4 className={`font-bold text-sm flex items-center gap-1.5 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        <span>{table.name}</span>
                        {table.id === 'G' && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${
                            isLight
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                          }`}>
                            BOOTH VIP
                          </span>
                        )}
                      </h4>
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Capienza: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{table.capacity} posti</strong> · Zona: <span className="capitalize">{table.zone.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Course Progression Badge */}
                  {isSeated && (
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageConfig.color}`}>
                        {stageConfig.label}
                      </span>
                      <span className={`text-[10px] font-mono block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Seduti da {elapsedMins} min
                      </span>
                    </div>
                  )}
                  {isUpcoming && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isLight
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-blue-950/50 text-blue-300 border border-blue-800'
                    }`}>
                      In Arrivo {currentRes?.startTime}
                    </span>
                  )}
                  {!isSeated && !isUpcoming && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isLight
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      Tavolo Libero
                    </span>
                  )}
                </div>

                {/* OCCUPANT & OCCASION INFO */}
                <div className="py-3.5 space-y-3 flex-1">
                  {currentRes ? (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                            isLight ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            Commensali:
                          </span>
                          <h5 className={`font-bold text-sm flex items-center gap-1.5 ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            <span>{currentRes.guestName}</span>
                            <span className={`text-xs font-mono font-normal ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              ({currentRes.partySize} ospiti)
                            </span>
                          </h5>
                          {currentRes.bookingCode && (
                            <span className={`text-[10px] font-mono ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              Prenotazione: #{currentRes.bookingCode}
                            </span>
                          )}
                        </div>

                        {/* Top Spender & VIP Badge */}
                        <div className="flex flex-col items-end gap-1">
                          {isTopSpender && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isLight
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>VIP TOP SPENDER</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CRITICAL MANAGER ATTENTION ALERT (GREEN OR RED) */}
                      {hasAttention && guestProfile?.attentionAlert && (
                        <div
                          className={`p-2.5 rounded-2xl border text-xs space-y-1 ${
                            guestProfile.attentionAlert.alertColor === 'red'
                              ? isLight
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-rose-950/30 border-rose-600/70 text-rose-200'
                              : isLight
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-emerald-950/30 border-emerald-500/70 text-emerald-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>
                              Attenzione Direzione (
                              {guestProfile.attentionAlert.alertColor === 'red' ? 'Criticità' : 'Ospite Speciale'}
                              ):
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed italic">
                            "{guestProfile.attentionAlert.reason}"
                          </p>
                        </div>
                      )}

                      {/* HIGH-VISIBILITY ALLERGY BADGES */}
                      {hasAllergies && (
                        <div className={`p-2.5 rounded-2xl space-y-1.5 border ${
                          isLight
                            ? 'bg-rose-50/70 border-rose-200'
                            : 'bg-rose-950/20 border border-rose-800/40'
                        }`}>
                          <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[10px] uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Allergie & Intolleranze Segnalate:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {guestProfile!.dietaryRestrictions.map((diet, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 font-bold text-[11px] rounded-lg border shadow-2xs ${
                                  isLight
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-rose-900/60 text-white border-rose-700/60'
                                }`}
                              >
                                ⚠️ {diet}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SPECIAL OCCASIONS (COMPLEANNI / ANNIVERSARI) */}
                      {(guestProfile?.birthday || guestProfile?.anniversary || currentRes.tags?.some((t) => t.includes('Birthday'))) && (
                        <div className={`flex items-center gap-2 p-2 rounded-xl text-xs border ${
                          isLight
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-[#1B2232] border border-[#2A3750] text-amber-300'
                        }`}>
                          <Cake className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Ricorrenza speciale segnalata: Servire calice augurale al dolce.</span>
                        </div>
                      )}

                      {/* LIVE ORDER SUMMARY (WHAT THEY ORDERED) */}
                      {activeOrder && activeOrder.items.length > 0 && (
                        <div className={`p-2.5 rounded-2xl border space-y-1.5 ${
                          isLight
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-[#10141F] border border-[#242C3E]'
                        }`}>
                          <div className={`flex items-center justify-between text-[10px] uppercase font-bold tracking-wider ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            <span>Comanda In Corso ({activeOrder.items.length} voci):</span>
                            <span className={`font-mono font-bold ${
                              isLight ? 'text-emerald-700' : 'text-emerald-400'
                            }`}>€ {activeOrder.total}</span>
                          </div>
                          <ul className={`text-xs space-y-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            {activeOrder.items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                                <span className={isLight ? 'text-sky-600' : 'text-[#C084FC]'}>•</span>
                                <span className="leading-snug">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={`py-8 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      Nessun servizio attivo. Pronto per nuova assegnazione.
                    </div>
                  )}
                </div>

                {/* BOTTOM FOOTER STATUS */}
                <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                  isLight ? 'border-slate-100 text-slate-500' : 'border-[#222A3C] text-slate-400'
                }`}>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-[#C084FC]'}`} />
                    <span>Controllo Servizio Attivo</span>
                  </span>
                  <span className={`font-mono ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                    {isSeated ? 'Tavolo Occupato' : isUpcoming ? 'Riservato' : 'Libero'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: READ-ONLY TIMELINE VIEW */}
      {selectedSubTab === 'timeline_readonly' && (
        <div className={`border rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-slate-100' : 'border-[#222A3C]'
          }`}>
            <div>
              <h3 className={`font-brand font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Timeline Turno Sola Lettura
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Visualizzazione protetta per il personale di sala. Nessun rischio di spostamento accidentale.
              </p>
            </div>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Data: {selectedDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full text-left text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <thead className={`uppercase text-[10px] tracking-wider border-b ${
                isLight
                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                  : 'bg-[#171D2B] text-slate-400 border-[#242C3E]'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">Tavolo</th>
                  <th className="py-2.5 px-3">Orario</th>
                  <th className="py-2.5 px-3">Ospite</th>
                  <th className="py-2.5 px-3">Coperti</th>
                  <th className="py-2.5 px-3">Stato</th>
                  <th className="py-2.5 px-3">Note di Sala & Allergie</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-[#222A3C]/70'}`}>
                {todayReservations.map((res) => {
                  const guestProfile = guestCrmService.getProfileByNameOrPhone(res.guestName, res.guestPhone);
                  return (
                    <tr key={res.id} className={`transition ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-[#171D2B]/50'
                    }`}>
                      <td className={`py-2.5 px-3 font-bold font-mono ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {res.assignedTableIds?.join(', ') || res.tableId}
                      </td>
                      <td className={`py-2.5 px-3 font-mono ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        {res.startTime} - {res.endTime}
                      </td>
                      <td className={`py-2.5 px-3 font-semibold ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {res.guestName}
                      </td>
                      <td className={`py-2.5 px-3 font-mono ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        {res.partySize}p
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            res.status === 'seated'
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : isLight
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-blue-950/60 text-blue-300 border-blue-800'
                          }`}
                        >
                          {res.status === 'seated' ? 'Al Tavolo' : 'Confermato'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {guestProfile?.dietaryRestrictions && guestProfile.dietaryRestrictions.length > 0 && (
                          <span className="text-rose-600 font-bold mr-2">
                            ⚠️ {guestProfile.dietaryRestrictions.join(', ')}
                          </span>
                        )}
                        {guestProfile?.attentionAlert?.isAttentionRequired && (
                          <span className="text-amber-600 font-medium italic">
                            [{guestProfile.attentionAlert.reason}]
                          </span>
                        )}
                        {!guestProfile?.dietaryRestrictions?.length && !guestProfile?.attentionAlert && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

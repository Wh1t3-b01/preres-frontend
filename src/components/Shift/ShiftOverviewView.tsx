import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuManagementTab } from './MenuManagementTab';
import { ShiftRevenueAnalyticsTab } from './ShiftRevenueAnalyticsTab';
import {
  Users,
  TrendingUp,
  Printer,
  DollarSign,
  Activity,
  Sparkles,
  Utensils,
  BarChart3,
  Clock,
} from 'lucide-react';

interface ShiftOverviewViewProps {
  onOpenPrintRunSheet: () => void;
  onOpenBookingModal: () => void;
}

export const ShiftOverviewView: React.FC<ShiftOverviewViewProps> = ({
  onOpenPrintRunSheet,
}) => {
  const { reservations, tables, settings, selectedDate, kpis, theme } = useRestaurant();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'pacing' | 'menu' | 'analytics'>('pacing');

  const dayReservations = useMemo(() => {
    return reservations
      .filter((r) => r.reservationDate === selectedDate && r.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [reservations, selectedDate]);

  // Lunch vs Dinner splits
  const lunchRes = useMemo(() => dayReservations.filter((r) => r.startTime < '16:00'), [dayReservations]);
  const dinnerRes = useMemo(() => dayReservations.filter((r) => r.startTime >= '16:00'), [dayReservations]);

  const lunchCovers = lunchRes.reduce((sum, r) => sum + r.partySize, 0);
  const dinnerCovers = dinnerRes.reduce((sum, r) => sum + r.partySize, 0);

  // Party size distribution
  const partySizeDist = useMemo(() => {
    const dist = { small: 0, medium: 0, large: 0 };
    dayReservations.forEach((r) => {
      if (r.partySize <= 2) dist.small += 1;
      else if (r.partySize <= 4) dist.medium += 1;
      else dist.large += 1;
    });
    return dist;
  }, [dayReservations]);

  // 15-minute pacing distribution
  const pacingSlots = useMemo(() => {
    const slots = [
      '12:00', '12:30', '13:00', '13:30', '14:00',
      '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
    ];
    return slots.map((time) => {
      const coversInSlot = dayReservations
        .filter((r) => r.startTime === time)
        .reduce((sum, r) => sum + r.partySize, 0);
      const isPeak = coversInSlot >= 12;
      return { time, covers: coversInSlot, isPeak };
    });
  }, [dayReservations]);

  // RevPASH
  const totalCapacity = tables.reduce((sum, t) => sum + (t.capacityOverride || t.capacity), 0);
  const totalServiceHours = 8;
  const availableSeatHours = totalCapacity * totalServiceHours;
  const revPASH = availableSeatHours > 0 ? (kpis.estimatedTotalRevenue / availableSeatHours).toFixed(2) : '0';

  return (
    <div className={`space-y-5 max-w-[1780px] mx-auto pb-12 transition-colors ${
      isLight ? 'text-slate-900' : 'text-slate-100'
    }`}>
      
      {/* SHIFT OVERVIEW HEADER & ACTIONS */}
      <div className={`border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold shadow-xs ${
            isLight ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-[#171D2B] border-[#273248] text-[#C084FC]'
          }`}>
            <Activity className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-semibold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                PRERES Shift Pacing & Kitchen Flow ({selectedDate})
              </h2>
              <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-sky-50 text-sky-800 border-sky-200 font-mono' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/30 font-mono'
              }`}>
                PRERES Pacing Engine™
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Distribuzione coperti per fascia oraria, ritmo cucina, party size e performance di turno
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenPrintRunSheet}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-2xs'
                : 'bg-[#8B31E0] hover:bg-[#7928CA] text-white border-transparent'
            }`}
            title="Stampa Run Sheet per Maître e Cucina"
          >
            <Printer className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Stampa Run Sheet</span>
          </button>
        </div>
      </div>

      {/* SHIFT MASTER NAVIGATION TABS */}
      <div className={`flex items-center gap-1.5 p-1 rounded-xl border overflow-x-auto shadow-2xs [scrollbar-width:none] ${
        isLight ? 'bg-slate-100/60 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <button
          onClick={() => setActiveTab('pacing')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap border ${
            activeTab === 'pacing'
              ? isLight
                ? 'bg-sky-50 text-sky-700 border-sky-200/80 font-semibold shadow-2xs'
                : 'bg-sky-950/40 text-sky-300 border-sky-800/40 font-semibold shadow-2xs'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4 stroke-[1.5]" />
          <span>Pacing Cucina & Turno</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap border ${
            activeTab === 'menu'
              ? isLight
                ? 'bg-amber-50 text-amber-800 border-amber-200/80 font-semibold shadow-2xs'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/40 font-semibold shadow-2xs'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Utensils className="w-4 h-4 stroke-[1.5]" />
          <span>Gestione Menu & Fuori Menù</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap border ${
            activeTab === 'analytics'
              ? isLight
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold shadow-2xs'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 font-semibold shadow-2xs'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4 stroke-[1.5]" />
          <span>Analytics Incassi & Top/Low Sellers</span>
        </button>
      </div>

      {/* TAB 1: PACING CUCINA & FLUSSI TURNO */}
      {activeTab === 'pacing' && (
        <div className="space-y-5">
      {/* 4-KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl border shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className={`font-semibold uppercase tracking-wider text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Totale Coperti</span>
            <Users className={`w-3.5 h-3.5 stroke-[1.5] ${isLight ? 'text-sky-600' : 'text-[#C084FC]'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {kpis.bookedCovers} <span className="text-xs font-normal text-slate-400">pax</span>
          </div>
          <div className={`text-[10px] mt-1 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            ☀️ {lunchCovers} Pranzo · 🌙 {dinnerCovers} Cena
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className={`font-semibold uppercase tracking-wider text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>RevPASH (Seat/Hour)</span>
            <DollarSign className={`w-3.5 h-3.5 stroke-[1.5] ${isLight ? 'text-emerald-600' : 'text-[#34D399]'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
            € {revPASH}
          </div>
          <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Revenue per Available Seat Hour
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className={`font-semibold uppercase tracking-wider text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Table Turnover Rate</span>
            <TrendingUp className={`w-3.5 h-3.5 stroke-[1.5] ${isLight ? 'text-emerald-600' : 'text-[#34D399]'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
            {kpis.turnoverRate}x
          </div>
          <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Rotazione posti a sedere nel turno
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className={`font-semibold uppercase tracking-wider text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Fatturato Stimato</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 stroke-[1.5]" />
          </div>
          <div className={`text-xl font-bold font-mono ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
            € {kpis.estimatedTotalRevenue.toLocaleString('it-IT')}
          </div>
          <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Media € {settings.avgSpendPerCover}/coperto
          </div>
        </div>
      </div>

      {/* PACING ENGINE (KITCHEN & SERVICE THROUGHPUT GAUGE) */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className={`font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Ritmo di Flusso Cucina & Pacing Orario (Covers by Time)
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Controllo carichi per fascia di 30 minuti per prevenire colli di bottiglia
            </p>
          </div>
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-xl font-mono border ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-[#171D2B] border-[#273248] text-slate-300'
          }`}>
            Soglia Cucina: Max 14 pax / slot
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
          {pacingSlots.map((slot) => (
            <div
              key={slot.time}
              className={`p-2 rounded-xl border text-center transition flex flex-col justify-between ${
                slot.isPeak
                  ? isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                  : slot.covers > 0
                  ? isLight
                    ? 'bg-sky-50/70 border-sky-200 text-sky-950'
                    : 'bg-[#8B31E0]/15 border-[#8B31E0]/30 text-white'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                  : 'bg-[#10141F] border-[#222A3C] text-slate-500'
              }`}
            >
              <span className="text-[10px] font-mono font-medium">{slot.time}</span>
              <div className="my-1">
                <span className="text-base font-bold font-mono block leading-none">
                  {slot.covers}
                </span>
                <span className={`text-[8px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>pax</span>
              </div>
              <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-black/40'}`}>
                <div
                  className={`h-full ${slot.isPeak ? 'bg-amber-500' : isLight ? 'bg-sky-500' : 'bg-[#8B31E0]'}`}
                  style={{ width: `${Math.min(100, (slot.covers / 14) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-COLUMN BREAKDOWN: PARTY SIZES & SHIFT SERVICE RUN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Party Size Distribution */}
        <div className={`border rounded-2xl p-4 shadow-xs space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <h4 className={`font-semibold text-xs uppercase tracking-wider ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>
            Distribuzione Dimensione Tavoli (Party Sizes)
          </h4>

          <div className="space-y-2.5">
            <div>
              <div className={`flex justify-between text-xs font-medium mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Coppie & 2 Persone (1-2 pax)</span>
                <span className={`font-mono ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}>{partySizeDist.small} tavoli</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#171D2B] border-[#242C3E]'
              }`}>
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(partySizeDist.small / Math.max(1, dayReservations.length)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className={`flex justify-between text-xs font-medium mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Tavoli Medi (3-4 pax)</span>
                <span className={`font-mono ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}>{partySizeDist.medium} tavoli</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#171D2B] border-[#242C3E]'
              }`}>
                <div
                  className={`h-full ${isLight ? 'bg-sky-500' : 'bg-[#8B31E0]'}`}
                  style={{ width: `${(partySizeDist.medium / Math.max(1, dayReservations.length)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className={`flex justify-between text-xs font-medium mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Grandi Gruppi (5+ pax)</span>
                <span className={`font-mono ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}>{partySizeDist.large} tavoli</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#171D2B] border-[#242C3E]'
              }`}>
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${(partySizeDist.large / Math.max(1, dayReservations.length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shift Service Breakdown (Pranzo vs Cena) */}
        <div className={`border rounded-2xl p-4 shadow-xs space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <h4 className={`font-semibold text-xs uppercase tracking-wider ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>
            Ripartizione Turni di Servizio (Shift Breakdown)
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            <div className={`border p-3 rounded-xl ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <span className={`text-xs font-semibold block ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>☀️ Servizio Pranzo</span>
              <div className={`mt-1.5 text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {lunchCovers} <span className="text-xs font-normal text-slate-400">coperti</span>
              </div>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{lunchRes.length} prenotazioni</p>
            </div>

            <div className={`border p-3 rounded-xl ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <span className={`text-xs font-semibold block ${isLight ? 'text-sky-800' : 'text-[#C084FC]'}`}>🌙 Servizio Cena</span>
              <div className={`mt-1.5 text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {dinnerCovers} <span className="text-xs font-normal text-slate-400">coperti</span>
              </div>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{dinnerRes.length} prenotazioni</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* TAB 2: GESTIONE MENU & FUORI MENÙ */}
      {activeTab === 'menu' && <MenuManagementTab />}

      {/* TAB 3: ANALYTICS & PERFORMANCE INCASSI */}
      {activeTab === 'analytics' && <ShiftRevenueAnalyticsTab />}
    </div>
  );
};

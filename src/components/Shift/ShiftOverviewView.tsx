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
  const { reservations, tables, settings, selectedDate, kpis } = useRestaurant();
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
    <div className="space-y-5 max-w-[1780px] mx-auto pb-12 text-slate-100">
      
      {/* SHIFT OVERVIEW HEADER & ACTIONS */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#171D2B] border border-[#273248] text-[#C084FC] flex items-center justify-center font-bold shadow-xs">
            <Activity className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-white">
                PRERES Shift Pacing & Kitchen Flow ({selectedDate})
              </h2>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.2 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
                PRERES Pacing Engine™
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Distribuzione coperti per fascia oraria, ritmo cucina, party size e performance di turno
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenPrintRunSheet}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            title="Stampa Run Sheet per Maître e Cucina"
          >
            <Printer className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Stampa Run Sheet</span>
          </button>
        </div>
      </div>

      {/* SHIFT MASTER NAVIGATION TABS */}
      <div className="flex items-center gap-2 bg-[#121622] p-1.5 rounded-2xl border border-[#222A3C] overflow-x-auto [scrollbar-width:none]">
        <button
          onClick={() => setActiveTab('pacing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'pacing'
              ? 'bg-[#8B31E0] text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#171D2B]'
          }`}
        >
          <Activity className="w-4 h-4 stroke-[1.75]" />
          <span>Pacing Cucina & Turno</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'menu'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#171D2B]'
          }`}
        >
          <Utensils className="w-4 h-4 stroke-[1.75]" />
          <span>Gestione Menu & Fuori Menù</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#059669] text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#171D2B]'
          }`}
        >
          <BarChart3 className="w-4 h-4 stroke-[1.75]" />
          <span>Analytics Incassi & Top/Low Sellers</span>
        </button>
      </div>

      {/* TAB 1: PACING CUCINA & FLUSSI TURNO */}
      {activeTab === 'pacing' && (
        <div className="space-y-5">
      {/* 4-KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#121622] p-3.5 rounded-2xl border border-[#222A3C] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[9px]">Totale Coperti</span>
            <Users className="w-3.5 h-3.5 text-[#C084FC] stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {kpis.bookedCovers} <span className="text-xs font-normal text-slate-400">pax</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            ☀️ {lunchCovers} Pranzo · 🌙 {dinnerCovers} Cena
          </div>
        </div>

        <div className="bg-[#121622] p-3.5 rounded-2xl border border-[#222A3C] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[9px]">RevPASH (Seat/Hour)</span>
            <DollarSign className="w-3.5 h-3.5 text-[#34D399] stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-[#34D399] font-mono">
            € {revPASH}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Revenue per Available Seat Hour
          </div>
        </div>

        <div className="bg-[#121622] p-3.5 rounded-2xl border border-[#222A3C] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[9px]">Table Turnover Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#34D399] stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-[#34D399] font-mono">
            {kpis.turnoverRate}x
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Rotazione posti a sedere nel turno
          </div>
        </div>

        <div className="bg-[#121622] p-3.5 rounded-2xl border border-[#222A3C] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[9px]">Fatturato Stimato</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            € {kpis.estimatedTotalRevenue.toLocaleString('it-IT')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Media € {settings.avgSpendPerCover}/coperto
          </div>
        </div>
      </div>

      {/* PACING ENGINE (KITCHEN & SERVICE THROUGHPUT GAUGE) */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-sm text-white">
              Ritmo di Flusso Cucina & Pacing Orario (Covers by Time)
            </h3>
            <p className="text-[11px] text-slate-400">
              Controllo carichi per fascia di 30 minuti per prevenire colli di bottiglia
            </p>
          </div>
          <span className="text-[10px] font-medium text-slate-300 bg-[#171D2B] border border-[#273248] px-2.5 py-1 rounded-xl font-mono">
            Soglia Cucina: Max 14 pax / slot
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
          {pacingSlots.map((slot) => (
            <div
              key={slot.time}
              className={`p-2 rounded-xl border text-center transition flex flex-col justify-between ${
                slot.isPeak
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                  : slot.covers > 0
                  ? 'bg-[#8B31E0]/15 border-[#8B31E0]/30 text-white'
                  : 'bg-[#10141F] border-[#222A3C] text-slate-500'
              }`}
            >
              <span className="text-[10px] font-mono font-medium">{slot.time}</span>
              <div className="my-1">
                <span className="text-base font-bold font-mono block leading-none">
                  {slot.covers}
                </span>
                <span className="text-[8px] uppercase text-slate-400">pax</span>
              </div>
              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full ${slot.isPeak ? 'bg-amber-400' : 'bg-[#8B31E0]'}`}
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
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-xs space-y-3">
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
            Distribuzione Dimensione Tavoli (Party Sizes)
          </h4>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                <span>Coppie & 2 Persone (1-2 pax)</span>
                <span className="font-mono text-white">{partySizeDist.small} tavoli</span>
              </div>
              <div className="w-full h-1.5 bg-[#171D2B] rounded-full overflow-hidden border border-[#242C3E]">
                <div
                  className="h-full bg-[#34D399]"
                  style={{ width: `${(partySizeDist.small / Math.max(1, dayReservations.length)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                <span>Tavoli Medi (3-4 pax)</span>
                <span className="font-mono text-white">{partySizeDist.medium} tavoli</span>
              </div>
              <div className="w-full h-1.5 bg-[#171D2B] rounded-full overflow-hidden border border-[#242C3E]">
                <div
                  className="h-full bg-[#8B31E0]"
                  style={{ width: `${(partySizeDist.medium / Math.max(1, dayReservations.length)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                <span>Grandi Gruppi (5+ pax)</span>
                <span className="font-mono text-white">{partySizeDist.large} tavoli</span>
              </div>
              <div className="w-full h-1.5 bg-[#171D2B] rounded-full overflow-hidden border border-[#242C3E]">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${(partySizeDist.large / Math.max(1, dayReservations.length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shift Service Breakdown (Pranzo vs Cena) */}
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-xs space-y-3">
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
            Ripartizione Turni di Servizio (Shift Breakdown)
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-xl">
              <span className="text-xs font-semibold text-amber-300 block">☀️ Servizio Pranzo</span>
              <div className="mt-1.5 text-lg font-bold font-mono text-white">
                {lunchCovers} <span className="text-xs font-normal text-slate-400">coperti</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{lunchRes.length} prenotazioni</p>
            </div>

            <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-xl">
              <span className="text-xs font-semibold text-[#C084FC] block">🌙 Servizio Cena</span>
              <div className="mt-1.5 text-lg font-bold font-mono text-white">
                {dinnerCovers} <span className="text-xs font-normal text-slate-400">coperti</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{dinnerRes.length} prenotazioni</p>
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

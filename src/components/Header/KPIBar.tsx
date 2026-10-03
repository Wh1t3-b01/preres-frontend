import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  TrendingUp,
  Bell,
  Sparkles,
} from 'lucide-react';

export const KPIBar: React.FC = () => {
  const { kpis, settings, waitlist } = useRestaurant();
  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  return (
    <div className="relative z-10 bg-gradient-to-r from-white via-[#FDFBF7] to-white border-b border-[#1E3A2F]/15 px-3 sm:px-6 py-2.5 shadow-xs w-full overflow-hidden">
      <div className="max-w-[1780px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 text-xs">
        
        {/* Core Metric Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-5 w-full lg:w-auto">
          
          {/* Live Operations Ribbon Label */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E3A2F] uppercase tracking-wider pr-3 border-r border-[#1E3A2F]/15 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-brand font-bold text-sm text-[#1E3A2F]">Servizio Live</span>
          </div>

          {/* 1. Booked Covers */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-[#6B3FA0]/10 text-[#6B3FA0] flex items-center justify-center font-bold text-xs">
              📌
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                Prenotati
              </span>
              <span className="font-bold font-mono-num text-xs sm:text-sm text-[#1E3A2F]">
                {kpis.bookedCovers}{' '}
                <span className="text-[10px] font-normal text-stone-400">
                  ({kpis.totalReservationsCount} pren.)
                </span>
              </span>
            </div>
          </div>

          {/* 2. Seated Covers (Currently in Room) */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-emerald-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              🪑
            </div>
            <div>
              <span className="text-[10px] text-emerald-800 font-medium block leading-none">
                Seduti in Sala
              </span>
              <span className="font-bold font-mono-num text-xs sm:text-sm text-emerald-700">
                {kpis.seatedCovers} <span className="text-[10px] font-normal text-emerald-600">ospiti</span>
              </span>
            </div>
          </div>

          {/* 3. In Waitlist (Lista d'Attesa) */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition shadow-2xs ${
            waitingCount > 0
              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
              : 'bg-white border-stone-200/80'
          }`}>
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-xs ${
              waitingCount > 0 ? 'bg-amber-200 text-amber-900 animate-bounce' : 'bg-stone-100 text-stone-600'
            }`}>
              <Bell className="w-3 h-3 text-amber-800" />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                In Attesa
              </span>
              <span className={`font-bold font-mono-num text-xs sm:text-sm ${
                waitingCount > 0 ? 'text-amber-900 font-bold' : 'text-stone-700'
              }`}>
                {waitingCount} <span className="text-[10px] font-normal text-stone-400">gruppi</span>
              </span>
            </div>
          </div>

          {/* 4. Completed Covers */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
              ✅
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                Completati
              </span>
              <span className="font-bold font-mono-num text-xs sm:text-sm text-stone-700">
                {kpis.completedCovers}
              </span>
            </div>
          </div>

          {/* 5. Remaining Covers in Arrival */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
              ⏳
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                In Arrivo
              </span>
              <span className="font-bold font-mono-num text-xs sm:text-sm text-amber-800">
                {kpis.remainingCovers}
              </span>
            </div>
          </div>
        </div>

        {/* Right Financial & Turnover Metrics */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs w-full lg:w-auto justify-end border-t lg:border-t-0 border-[#1E3A2F]/10 pt-1 lg:pt-0">
          <div className="text-right bg-white px-3 py-1 rounded-xl border border-stone-200/80 shadow-2xs">
            <span className="text-[10px] text-stone-500 block leading-none">Rotazione Tavoli</span>
            <span className="font-bold font-mono-num text-xs text-[#1E3A2F]">
              {kpis.turnoverRate}x
            </span>
          </div>
          <div className="text-right bg-white px-3 py-1 rounded-xl border border-[#6B3FA0]/20 shadow-2xs">
            <span className="text-[10px] text-stone-500 block leading-none">Incasso Previsto</span>
            <span className="font-bold font-mono-num text-xs text-[#6B3FA0]">
              {settings.currency} {kpis.estimatedTotalRevenue.toLocaleString('it-IT')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

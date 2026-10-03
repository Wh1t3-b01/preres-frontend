import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Pin,
  Armchair,
  CheckCircle2,
  Hourglass,
  TrendingUp,
  Euro,
  Users,
} from 'lucide-react';

export const KPIBar: React.FC = () => {
  const { kpis, selectedDate, settings } = useRestaurant();

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-[#1E3A2F]/15 px-4 lg:px-8 py-2.5 shadow-2xs">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max text-xs">
          {/* Label Tag */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E3A2F] uppercase tracking-wider pr-2 border-r border-[#1E3A2F]/15">
            <TrendingUp className="w-3.5 h-3.5 text-[#6B3FA0]" />
            <span>Metriche Servizio Live</span>
          </div>

          {/* 1. Booked Covers */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#6B3FA0]/10 text-[#6B3FA0] flex items-center justify-center font-bold">
              📌
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                Coperti Prenotati
              </span>
              <span className="font-bold font-mono-num text-sm text-[#1E3A2F]">
                {kpis.bookedCovers}{' '}
                <span className="text-[10px] font-normal text-stone-400">
                  ({kpis.totalReservationsCount} prenotazioni)
                </span>
              </span>
            </div>
          </div>

          {/* 2. Seated Covers */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              🪑
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                Coperti Seduti
              </span>
              <span className="font-bold font-mono-num text-sm text-emerald-700">
                {kpis.seatedCovers}{' '}
                <span className="text-[10px] font-normal text-emerald-600">in sala ora</span>
              </span>
            </div>
          </div>

          {/* 3. Completed Covers */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
              ✅
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                Coperti Completati
              </span>
              <span className="font-bold font-mono-num text-sm text-stone-700">
                {kpis.completedCovers}{' '}
                <span className="text-[10px] font-normal text-stone-400">tavoli liberati</span>
              </span>
            </div>
          </div>

          {/* 4. Remaining Covers */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              ⏳
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium block leading-none">
                Coperti Rimanenti
              </span>
              <span className="font-bold font-mono-num text-sm text-amber-800">
                {kpis.remainingCovers}{' '}
                <span className="text-[10px] font-normal text-stone-400">in arrivo</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right side Turnover, Estimated Revenue & Live Sync Pulse */}
        <div className="hidden xl:flex items-center gap-5 text-xs pl-4 border-l border-[#1E3A2F]/15">
          {/* Real-time Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs font-mono-num font-semibold text-[10px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>Real-time Sync: Attivo (0ms)</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-stone-500 block leading-none">Turnover Sala</span>
            <span className="font-bold font-mono-num text-xs text-[#1E3A2F]">
              {kpis.turnoverRate}x rotazione
            </span>
          </div>
          <div className="text-right">
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

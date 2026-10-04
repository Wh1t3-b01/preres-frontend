import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Bell } from 'lucide-react';

export const KPIBar: React.FC = () => {
  const { kpis, settings, waitlist } = useRestaurant();
  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  return (
    <div className="relative z-10 bg-[#0E121B]/75 border-b border-[#242C3E]/80 px-4 sm:px-6 py-1.5 shadow-xs w-full overflow-hidden text-slate-200">
      <div className="max-w-[1780px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3 text-xs">
        
        {/* Core Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          
          {/* 1. Booked Covers */}
          <div className="flex items-center gap-2 bg-[#141824] px-2.5 py-1 rounded-xl border border-[#273044] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
            <div>
              <span className="text-[9px] text-slate-400 font-medium block leading-none">
                Prenotati
              </span>
              <span className="font-bold font-mono text-xs text-slate-100">
                {kpis.bookedCovers}{' '}
                <span className="text-[9px] font-normal text-slate-400">
                  ({kpis.totalReservationsCount} tav.)
                </span>
              </span>
            </div>
          </div>

          {/* 2. Seated Covers (Currently in Room) */}
          <div className="flex items-center gap-2 bg-[#141824] px-2.5 py-1 rounded-xl border border-[#059669]/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <div>
              <span className="text-[9px] text-[#34D399] font-medium block leading-none">
                Seduti in Sala
              </span>
              <span className="font-bold font-mono text-xs text-[#34D399]">
                {kpis.seatedCovers} <span className="text-[9px] font-normal text-emerald-300/70">ospiti</span>
              </span>
            </div>
          </div>

          {/* 3. In Waitlist (Lista d'Attesa) */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition shadow-xs ${
            waitingCount > 0
              ? 'bg-[#8B31E0]/15 border-[#8B31E0]/40 text-[#C084FC]'
              : 'bg-[#141824] border-[#273044]'
          }`}>
            <Bell className="w-3 h-3 text-[#C084FC] stroke-[1.5]" />
            <div>
              <span className="text-[9px] text-slate-400 font-medium block leading-none">
                In Attesa
              </span>
              <span className={`font-bold font-mono text-xs ${
                waitingCount > 0 ? 'text-[#C084FC]' : 'text-slate-300'
              }`}>
                {waitingCount} <span className="text-[9px] font-normal text-slate-500">gruppi</span>
              </span>
            </div>
          </div>

          {/* 4. Completed Covers */}
          <div className="flex items-center gap-2 bg-[#141824] px-2.5 py-1 rounded-xl border border-[#273044] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <div>
              <span className="text-[9px] text-slate-400 font-medium block leading-none">
                Completati
              </span>
              <span className="font-bold font-mono text-xs text-slate-300">
                {kpis.completedCovers}
              </span>
            </div>
          </div>

          {/* 5. Remaining Covers */}
          <div className="flex items-center gap-2 bg-[#141824] px-2.5 py-1 rounded-xl border border-[#273044] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <div>
              <span className="text-[9px] text-slate-400 font-medium block leading-none">
                In Arrivo
              </span>
              <span className="font-bold font-mono text-xs text-amber-300">
                {kpis.remainingCovers}
              </span>
            </div>
          </div>
        </div>

        {/* Right Financial & Turnover Metrics */}
        <div className="flex items-center gap-3 text-xs w-full lg:w-auto justify-end border-t lg:border-t-0 border-[#242C3E] pt-1 lg:pt-0">
          <div className="text-right bg-[#141824] px-2.5 py-1 rounded-xl border border-[#273044] shadow-xs">
            <span className="text-[9px] text-slate-400 block leading-none">Turnover</span>
            <span className="font-bold font-mono text-xs text-[#34D399]">
              {kpis.turnoverRate}x
            </span>
          </div>
          <div className="text-right bg-[#141824] px-2.5 py-1 rounded-xl border border-[#8B31E0]/30 shadow-xs">
            <span className="text-[9px] text-slate-400 block leading-none">Previsto</span>
            <span className="font-bold font-mono text-xs text-[#C084FC]">
              {settings.currency} {kpis.estimatedTotalRevenue.toLocaleString('it-IT')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Bell } from 'lucide-react';

export const KPIBar: React.FC = () => {
  const { kpis, settings, waitlist, theme } = useRestaurant();
  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;
  const isLight = theme === 'light';

  const cardClass = isLight
    ? 'bg-white/80 border-slate-200/70 text-slate-800 shadow-2xs'
    : 'bg-[#121622] border-[#222A3C] text-slate-200 shadow-2xs';

  const labelClass = isLight ? 'text-slate-400' : 'text-slate-400';
  const numClass = isLight ? 'text-slate-800' : 'text-slate-100';

  return (
    <div className={`relative z-10 border-b px-4 sm:px-6 py-1.5 w-full overflow-hidden transition-colors ${
      isLight ? 'bg-slate-50/50 border-slate-200/70 text-slate-800' : 'bg-[#0E121B]/75 border-[#222A3C] text-slate-200'
    }`}>
      <div className="max-w-[1780px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3 text-xs">
        
        {/* Core Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          
          {/* 1. Booked Covers */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border ${cardClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <div>
              <span className={`text-[9px] font-medium block leading-none ${labelClass}`}>
                Prenotati
              </span>
              <span className={`font-bold font-mono text-xs ${numClass}`}>
                {kpis.bookedCovers}{' '}
                <span className={`text-[9px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ({kpis.totalReservationsCount} tav.)
                </span>
              </span>
            </div>
          </div>

          {/* 2. Seated Covers (Currently in Room) */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border ${
            isLight
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs'
              : 'bg-[#141824] border-[#059669]/30 shadow-xs'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className={`text-[9px] font-medium block leading-none ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
                Seduti in Sala
              </span>
              <span className={`font-bold font-mono text-xs ${isLight ? 'text-emerald-900' : 'text-[#34D399]'}`}>
                {kpis.seatedCovers} <span className={`text-[9px] font-normal ${isLight ? 'text-emerald-600' : 'text-emerald-300/70'}`}>ospiti</span>
              </span>
            </div>
          </div>

          {/* 3. In Waitlist (Lista d'Attesa) */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition ${
            waitingCount > 0
              ? isLight
                ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-2xs'
                : 'bg-[#8B31E0]/15 border-[#8B31E0]/40 text-[#C084FC] shadow-xs'
              : cardClass
          }`}>
            <Bell className={`w-3 h-3 stroke-[1.5] ${isLight ? 'text-sky-600' : 'text-[#C084FC]'}`} />
            <div>
              <span className={`text-[9px] font-medium block leading-none ${labelClass}`}>
                In Attesa
              </span>
              <span className={`font-bold font-mono text-xs ${
                waitingCount > 0 ? (isLight ? 'text-sky-800' : 'text-[#C084FC]') : numClass
              }`}>
                {waitingCount} <span className={`text-[9px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>gruppi</span>
              </span>
            </div>
          </div>

          {/* 4. Completed Covers */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border ${cardClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <div>
              <span className={`text-[9px] font-medium block leading-none ${labelClass}`}>
                Completati
              </span>
              <span className={`font-bold font-mono text-xs ${numClass}`}>
                {kpis.completedCovers}
              </span>
            </div>
          </div>

          {/* 5. Remaining Covers */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border ${cardClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <div>
              <span className={`text-[9px] font-medium block leading-none ${labelClass}`}>
                In Arrivo
              </span>
              <span className={`font-bold font-mono text-xs ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                {kpis.remainingCovers}
              </span>
            </div>
          </div>
        </div>

        {/* Right Financial & Turnover Metrics */}
        <div className={`flex items-center gap-3 text-xs w-full lg:w-auto justify-end border-t lg:border-t-0 pt-1 lg:pt-0 ${
          isLight ? 'border-slate-200' : 'border-[#242C3E]'
        }`}>
          <div className={`text-right px-2.5 py-1 rounded-xl border ${cardClass}`}>
            <span className={`text-[9px] block leading-none ${labelClass}`}>Turnover</span>
            <span className={`font-bold font-mono text-xs ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
              {kpis.turnoverRate}x
            </span>
          </div>
          <div className={`text-right px-2.5 py-1 rounded-xl border ${
            isLight ? 'bg-sky-50 border-sky-200 text-sky-900 shadow-2xs' : 'bg-[#141824] border-[#8B31E0]/30 shadow-xs'
          }`}>
            <span className={`text-[9px] block leading-none ${isLight ? 'text-sky-700' : 'text-slate-400'}`}>Previsto</span>
            <span className={`font-bold font-mono text-xs ${isLight ? 'text-sky-900' : 'text-[#C084FC]'}`}>
              {settings.currency} {kpis.estimatedTotalRevenue.toLocaleString('it-IT')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface MonthCalendarViewProps {
  onSelectDateAndGoToFloor: (dateStr: string) => void;
  onOpenBookingModal: (dateStr?: string) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  onSelectDateAndGoToFloor,
  onOpenBookingModal,
}) => {
  const { reservations, selectedDate, setSelectedDate } = useRestaurant();

  // Current viewed month state (defaults to selectedDate's month)
  const [currentYear, setCurrentYear] = useState(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? 2026 : d.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? 9 : d.getMonth(); // 0-indexed
  });

  const monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const startOffset = (firstDayOfWeek + 6) % 7;

  // Aggregate reservation metrics by date YYYY-MM-DD
  const monthStatsByDate = useMemo(() => {
    const stats: Record<
      string,
      {
        totalCovers: number;
        lunchCovers: number;
        dinnerCovers: number;
        reservationsCount: number;
        vipCount: number;
        hasAllergies: boolean;
      }
    > = {};

    reservations.forEach((r) => {
      if (r.status === 'cancelled') return;
      if (!stats[r.reservationDate]) {
        stats[r.reservationDate] = {
          totalCovers: 0,
          lunchCovers: 0,
          dinnerCovers: 0,
          reservationsCount: 0,
          vipCount: 0,
          hasAllergies: false,
        };
      }
      const data = stats[r.reservationDate];
      data.totalCovers += r.partySize;
      data.reservationsCount += 1;
      if (r.startTime < '16:00') {
        data.lunchCovers += r.partySize;
      } else {
        data.dinnerCovers += r.partySize;
      }
      if (r.tags?.some((t) => t.toLowerCase().includes('vip')) || r.vipTier === 'vip' || r.vipTier === 'top_spender') {
        data.vipCount += 1;
      }
      if (r.tags?.some((t) => t.toLowerCase().includes('allerg') || t.toLowerCase().includes('glut'))) {
        data.hasAllergies = true;
      }
    });

    return stats;
  }, [reservations]);

  // Aggregate whole month stats
  const totalMonthCovers = useMemo(() => {
    let sum = 0;
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    Object.entries(monthStatsByDate).forEach(([date, stat]) => {
      if (date.startsWith(monthPrefix)) {
        sum += stat.totalCovers;
      }
    });
    return sum;
  }, [monthStatsByDate, currentYear, currentMonth]);

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-12 text-slate-100">
      
      {/* HEADER WITH MONTH NAVIGATION & MONTHLY KPIS */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#171D2B] border border-[#273248] text-[#C084FC] flex items-center justify-center font-bold shadow-xs">
            <CalendarIcon className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-white">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.2 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
                PRERES Horizon Calendar™
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Panoramica mensile coperti, carico pranzo/cena ed eventi speciali
            </p>
          </div>
        </div>

        {/* Month Navigation & KPI stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#10141F] border border-[#242C3E] px-3 py-1 rounded-xl">
            <span className="text-[9px] text-slate-400 font-medium block leading-none">Coperti Mese</span>
            <span className="font-bold font-mono text-xs text-[#34D399]">{totalMonthCovers} pax</span>
          </div>

          <div className="flex items-center bg-[#10141F] border border-[#242C3E] rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-300 transition cursor-pointer"
              title="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>
            <span className="px-2.5 text-xs font-semibold text-slate-200 min-w-[100px] text-center">
              {monthNames[currentMonth]}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-300 transition cursor-pointer"
              title="Mese successivo"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          <button
            onClick={() => onOpenBookingModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>Nuova Prenotazione</span>
          </button>
        </div>
      </div>

      {/* CALENDAR GRID (7 COLUMNS MON-SUN) */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-3 sm:p-5 shadow-sm">
        
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-[#222A3C] pb-2">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mer</span>
          <span>Gio</span>
          <span>Ven</span>
          <span className="text-amber-400/80">Sab</span>
          <span className="text-amber-400/80">Dom</span>
        </div>

        {/* Day Cells Matrix */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty offset cells for days of previous month */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div
              key={`empty_${idx}`}
              className="min-h-[90px] sm:min-h-[110px] rounded-xl bg-[#0E121B]/40 border border-dashed border-[#1C2333]/50 opacity-30"
            />
          ))}

          {/* Actual days of month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const stats = monthStatsByDate[dateStr];
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  onSelectDateAndGoToFloor(dateStr);
                }}
                className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer group shadow-2xs hover:scale-[1.01] ${
                  isSelected
                    ? 'border-[#8B31E0] ring-2 ring-[#8B31E0]/40 bg-[#8B31E0]/15'
                    : isToday
                    ? 'border-[#34D399]/70 bg-[#059669]/10'
                    : 'border-[#222A3C] bg-[#151A26] hover:border-[#8B31E0]/40'
                }`}
              >
                {/* Cell Header: Day Number & Indicators */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono rounded px-1.5 py-0.2 ${
                      isSelected
                        ? 'bg-[#8B31E0] text-white'
                        : isToday
                        ? 'bg-[#059669] text-white'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <div className="flex items-center gap-1">
                    {stats?.vipCount ? (
                      <span className="text-[9px] text-amber-400" title={`${stats.vipCount} VIP`}>
                        ⭐
                      </span>
                    ) : null}
                    {stats?.hasAllergies && (
                      <span className="text-[9px] text-rose-400" title="Allergie segnalate">
                        ⚠️
                      </span>
                    )}
                  </div>
                </div>

                {/* Cover Metrics Body */}
                {stats && stats.totalCovers > 0 ? (
                  <div className="space-y-1 my-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-white font-mono">
                        {stats.totalCovers} px
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono">
                        {stats.reservationsCount} pren.
                      </span>
                    </div>

                    {/* Lunch / Dinner Cover distribution */}
                    <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
                      <div className="bg-[#10141F] border border-[#242C3E] text-amber-300 px-1 py-0.2 rounded text-center truncate">
                        ☀️ {stats.lunchCovers}
                      </div>
                      <div className="bg-[#10141F] border border-[#242C3E] text-[#C084FC] px-1 py-0.2 rounded text-center truncate">
                        🌙 {stats.dinnerCovers}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 italic text-center py-2">
                    —
                  </div>
                )}

                {/* Footer Quick Action */}
                <div className="pt-0.5 border-t border-white/5 flex items-center justify-between text-[8px] text-slate-500 group-hover:text-[#C084FC] font-semibold">
                  <span>Apri Sala ➔</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

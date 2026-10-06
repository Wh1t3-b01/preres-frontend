import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface MonthCalendarViewProps {
  onSelectDateAndGoToTimeline: (dateStr: string) => void;
  onOpenBookingModal: (dateStr?: string) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  onSelectDateAndGoToTimeline,
  onOpenBookingModal,
}) => {
  const { reservations, selectedDate, setSelectedDate, setSelectedTime } = useRestaurant();

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

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime('12:00'); // Always start from lunch shift as requested
    onSelectDateAndGoToTimeline(dateStr);
  };

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-12 text-slate-100">
      {/* HEADER WITH MONTH NAVIGATION & MONTHLY KPIS */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#171D2B] border border-[#273248] text-[#C084FC] flex items-center justify-center font-bold shadow-xs">
            <CalendarIcon className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-white">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
                PRERES Horizon Calendar™
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Clicca su qualsiasi data per aprire la Timeline di quel giorno partendo dal turno di pranzo
            </p>
          </div>
        </div>

        {/* Month Navigation & Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-[#10141F] border border-[#242C3E] px-3.5 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block leading-none">Totale Coperti Mese</span>
            <span className="font-bold font-mono text-sm text-[#34D399]">{totalMonthCovers} ospiti</span>
          </div>

          <div className="flex items-center bg-[#10141F] border border-[#242C3E] rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-300 transition cursor-pointer"
              title="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>
            <span className="px-3 text-xs font-bold text-white min-w-[110px] text-center">
              {monthNames[currentMonth]}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-300 transition cursor-pointer"
              title="Mese successivo"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          <button
            onClick={() => onOpenBookingModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Nuova Prenotazione</span>
          </button>
        </div>
      </div>

      {/* CALENDAR GRID (7 COLUMNS MON-SUN) */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-3 sm:p-5 shadow-sm">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2.5 mb-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#222A3C] pb-2.5">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mer</span>
          <span>Gio</span>
          <span>Ven</span>
          <span className="text-amber-400">Sab</span>
          <span className="text-amber-400">Dom</span>
        </div>

        {/* Day Cells Matrix */}
        <div className="grid grid-cols-7 gap-2.5">
          {/* Empty offset cells for days of previous month */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div
              key={`empty_${idx}`}
              className="min-h-[105px] sm:min-h-[125px] rounded-2xl bg-[#0E121B]/40 border border-dashed border-[#1C2333]/50 opacity-25"
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
                onClick={() => handleDayClick(dateStr)}
                className={`min-h-[105px] sm:min-h-[125px] p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group hover:scale-[1.02] shadow-xs ${
                  isSelected
                    ? 'border-[#8B31E0] ring-2 ring-[#8B31E0]/50 bg-[#8B31E0]/20'
                    : isToday
                    ? 'border-[#34D399] bg-[#059669]/15'
                    : 'border-[#222A3C] bg-[#151A26] hover:border-[#8B31E0]/60 hover:bg-[#181F2E]'
                }`}
                title={`Clicca per aprire la Timeline del ${dayNum} ${monthNames[currentMonth]} (Pranzo 12:00)`}
              >
                {/* Cell Header: Large Day Number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xl sm:text-2xl font-black font-mono px-2 py-0.5 rounded-xl ${
                      isSelected
                        ? 'bg-[#8B31E0] text-white shadow-sm'
                        : isToday
                        ? 'bg-[#059669] text-white shadow-sm'
                        : 'text-white group-hover:text-[#C084FC] transition-colors'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isToday && (
                    <span className="text-[10px] uppercase font-bold text-[#34D399] tracking-wider bg-[#059669]/20 border border-[#059669]/40 px-2 py-0.5 rounded-full">
                      Oggi
                    </span>
                  )}
                </div>

                {/* Minimal Cover Metrics: Only total booked guests per day */}
                {stats && stats.totalCovers > 0 ? (
                  <div className="my-auto py-2 text-center">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white leading-tight">
                      {stats.totalCovers}{' '}
                      <span className="text-xs font-semibold text-slate-300">coperti</span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#C084FC] mt-0.5 font-mono">
                      {stats.reservationsCount}{' '}
                      {stats.reservationsCount === 1 ? 'prenotazione' : 'prenotazioni'}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto py-2 text-center text-xs text-slate-500 font-mono italic">
                    0 prenotati
                  </div>
                )}

                {/* Footer Quick Action */}
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-[#C084FC] font-semibold transition-colors">
                  <span>Vai a Pranzo (12:00)</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

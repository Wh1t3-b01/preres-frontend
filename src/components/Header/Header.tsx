import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { getRestaurantServiceStatus } from '../../utils/bookingEngine';
import {
  Calendar,
  Clock,
  Plus,
  Footprints,
  Move,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Contrast,
  Menu,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentView:
    | 'floor'
    | 'reservations'
    | 'timeline'
    | 'calendar'
    | 'shift_overview'
    | 'waitlist'
    | 'waiter_touch'
    | 'stats'
    | 'crm'
    | 'server_view'
    | 'waiter_hub'
    | 'staff_control'
    | 'boh_management';
  setCurrentView: (view: any) => void;
  onOpenBookingModal: () => void;
  onOpenWalkInModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenServerMonitor?: () => void;
  onOpenShiftBriefing?: () => void;
  onOpenMenuDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  onOpenBookingModal,
  onOpenWalkInModal,
  onOpenDatabaseModal,
  onOpenServerMonitor,
  onOpenShiftBriefing,
  onOpenMenuDrawer,
}) => {
  const {
    staffRole,
    selectedDate,
    setSelectedDate,
    isLayoutEditMode,
    setIsLayoutEditMode,
    isRealtimeConnected,
    connectedPeersCount,
    theme,
    toggleTheme,
    isHighContrast,
    toggleHighContrast,
    addToast,
  } = useRestaurant();

  const isLight = theme === 'light';
  const dateInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => {
    const [y, m, d] = (selectedDate || '').split('-').map(Number);
    return isNaN(y) ? new Date() : new Date(y, (m || 1) - 1, d || 1);
  });

  // Sync calendar month with selectedDate changes
  useEffect(() => {
    const [y, m, d] = (selectedDate || '').split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      setCalendarViewMonth(new Date(y, m - 1, d || 1));
    }
  }, [selectedDate]);

  // Click outside to close calendar popover with protection for inputs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && calendarRef.current.contains(event.target as Node)) {
        return;
      }
      const targetEl = event.target as HTMLElement;
      if (targetEl && (targetEl.tagName === 'INPUT' || targetEl.closest('input'))) {
        return;
      }
      setIsCalendarOpen(false);
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Live real-time clock updating every 10s
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  });

  const [serviceStatus, setServiceStatus] = useState(() => getRestaurantServiceStatus(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      setServiceStatus(getRestaurantServiceStatus(now));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Day Stepper (< / >)
  const handleStepDay = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);
    currentDate.setDate(currentDate.getDate() + days);
    const nextY = currentDate.getFullYear();
    const nextM = String(currentDate.getMonth() + 1).padStart(2, '0');
    const nextD = String(currentDate.getDate()).padStart(2, '0');
    setSelectedDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsCalendarOpen(false);
    const [y, m, d] = dateStr.split('-').map(Number);
    if (y && m && d) {
      const formatted = new Date(y, m - 1, d).toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      addToast({
        type: 'info',
        title: 'Data Operativa',
        message: `Servizio impostato su ${formatted}`,
        duration: 2000,
      });
    }
  };

  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    handleSelectDate(dateStr);
  };

  const formattedDateHeader = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (!y || !m || !d) return selectedDate;
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, [selectedDate]);

  return (
    <header className={`sticky top-0 z-20 backdrop-blur-md px-4 sm:px-6 py-2 transition-all w-full select-none border-b ${
      isLight
        ? 'bg-white/90 border-slate-200/70 text-slate-800 shadow-2xs'
        : 'bg-[#0E121B]/90 border-[#222A3C] text-slate-200'
    }`}>
      <div className="flex items-center justify-between gap-3 w-full">
        
        {/* LEFT: BRAND & SERVICE TELEMETRY WITH MAIN MENU BUTTON */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onOpenMenuDrawer && (
            <button
              onClick={onOpenMenuDrawer}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer text-xs font-medium active:scale-95 ${
                isLight
                  ? 'bg-slate-50/80 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 shadow-2xs'
                  : 'bg-[#151926] hover:bg-[#1E2538] text-slate-200 border-[#222A3C]'
              }`}
              title="Menu Operativo (Tocca su qualsiasi schermata)"
              aria-label="Apri Menu Operativo"
            >
              <Menu className={`w-3.5 h-3.5 stroke-[1.5] ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              <span className="text-[11px] font-medium hidden xs:inline">Menu</span>
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2 leading-none">
              <span className={`text-base sm:text-lg font-brand font-semibold tracking-tight whitespace-nowrap ${
                isLight ? 'text-slate-800' : 'text-slate-100'
              }`}>
                SOTTO SOTTO
              </span>
              <span className={`hidden sm:inline-block text-[8px] uppercase font-medium tracking-widest px-1.5 py-0.5 rounded-md border ${
                isLight ? 'bg-slate-100/70 text-slate-500 border-slate-200/60' : 'bg-white/5 text-slate-400 border-white/10'
              }`}>
                BAR & GRILL
              </span>
              <span className={`inline-block text-[8px] uppercase font-semibold tracking-widest px-1.5 py-0.5 rounded-md border ${
                isLight ? 'bg-sky-50/90 text-sky-700 border-sky-200/60' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
              }`}>
                PRERES™
              </span>
            </div>
            
            <div className={`flex items-center gap-2 text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="flex items-center gap-1 font-mono">
                <Clock className={`w-3 h-3 stroke-[1.5] ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
                <strong className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300 font-medium'}>{currentTimeStr}</strong>
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline opacity-80">{connectedPeersCount} sync live</span>
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: MINIMAL DATE STEPPER WITH RICH INTERACTIVE CALENDAR POPOVER */}
        <div ref={calendarRef} className="relative">
          <div className={`flex items-center gap-1 border rounded-xl p-0.5 ${
            isLight ? 'bg-slate-50/80 border-slate-200/70' : 'bg-[#141824] border-[#222A3C]'
          }`}>
            <button
              onClick={() => handleStepDay(-1)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80' : 'text-slate-400 hover:text-white hover:bg-[#1E2536]'
              }`}
              title="Giorno precedente"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer text-xs font-medium relative select-none ${
                isCalendarOpen
                  ? isLight
                    ? 'bg-sky-50 text-sky-800 border border-sky-200/80'
                    : 'bg-[#1E2536] text-white border border-sky-400/30'
                  : isLight
                  ? 'hover:bg-slate-100/70 text-slate-700'
                  : 'hover:bg-[#1E2536] text-slate-200'
              }`}
              title="Clicca per aprire il calendario e cambiare data"
            >
              <Calendar className={`w-3.5 h-3.5 stroke-[1.5] ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              <span className="capitalize font-sans font-medium">{formattedDateHeader}</span>
            </button>

            <button
              onClick={() => handleStepDay(1)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80' : 'text-slate-400 hover:text-white hover:bg-[#1E2536]'
              }`}
              title="Giorno successivo"
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </div>

          {/* CALENDAR POPOVER DROPDOWN */}
          {isCalendarOpen && (() => {
            const currentYear = calendarViewMonth.getFullYear();
            const currentMonth = calendarViewMonth.getMonth();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
            const monthTitle = calendarViewMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            return (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 sm:w-80 p-3.5 rounded-2xl shadow-xl border animate-in fade-in zoom-in-95 duration-150 ${
                  isLight
                    ? 'bg-white/95 border-slate-200/80 text-slate-800'
                    : 'bg-[#121622] border-[#222A3C] text-slate-100 shadow-2xl'
                }`}
              >
                {/* Header Month / Year Nav */}
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setCalendarViewMonth(new Date(currentYear, currentMonth - 1, 1))}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-white/5 transition cursor-pointer"
                    title="Mese precedente"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
                  </button>

                  <span className="text-xs font-semibold capitalize text-slate-800 dark:text-slate-100">
                    {monthTitle}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCalendarViewMonth(new Date(currentYear, currentMonth + 1, 1))}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-white/5 transition cursor-pointer"
                    title="Mese successivo"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>

                {/* Quick Date Pills */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(0)}
                    className="flex-1 py-1 text-[11px] font-medium rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40 transition cursor-pointer text-center"
                  >
                    Oggi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(1)}
                    className="flex-1 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-[#1A2234] dark:text-slate-300 dark:border-[#273248] transition cursor-pointer text-center"
                  >
                    Domani
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(7)}
                    className="flex-1 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-[#1A2234] dark:text-slate-300 dark:border-[#273248] transition cursor-pointer text-center"
                  >
                    +7 Giorni
                  </button>
                </div>

                {/* Weekday Names Header */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-400 mb-1">
                  <span>L</span>
                  <span>M</span>
                  <span>M</span>
                  <span>G</span>
                  <span>V</span>
                  <span>S</span>
                  <span>D</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-7 w-7" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleSelectDate(dateStr)}
                        className={`h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-xs'
                            : isToday
                            ? 'bg-sky-50 text-sky-700 border border-sky-300 font-semibold hover:bg-sky-100'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {dayNum}
                        {isToday && !isSelected && (
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-sky-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Direct Manual Date Input Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium">Altra data:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSelectDate(e.target.value);
                        }
                      }}
                      className="px-2 py-0.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 rounded cursor-pointer"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* RIGHT: ELEGANT SERVICE BADGE, THEME SWITCHER & ACTION CTAS WITH GRADIENTS OF IMPORTANCE */}
        <div className="flex items-center gap-2">
          
          {/* Service Status Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-medium border ${
              serviceStatus.badgeType === 'open'
                ? isLight
                  ? 'bg-emerald-50/80 border-emerald-200/60 text-emerald-700'
                  : 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300'
                : serviceStatus.badgeType === 'prep'
                ? isLight
                  ? 'bg-amber-50/80 border-amber-200/60 text-amber-700'
                  : 'bg-amber-950/20 border-amber-800/30 text-amber-300'
                : isLight
                ? 'bg-slate-100/70 border-slate-200/60 text-slate-600'
                : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                serviceStatus.badgeType === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{serviceStatus.isOpen ? (serviceStatus.currentService === 'lunch' ? 'Pranzo Aperto' : 'Cena Aperta') : 'Locale Chiuso'}</span>
          </div>

          {/* Theme Mode Toggle (Light vs Dark) */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-200/70 text-slate-600 shadow-2xs'
                : 'bg-[#141824] hover:bg-[#1B2232] border-[#222A3C] text-slate-300'
            }`}
            title={isLight ? 'Passa a Tema Notte' : 'Passa a Tema Chiaro'}
          >
            {isLight ? (
              <Moon className="w-3.5 h-3.5 stroke-[1.5] text-slate-500" />
            ) : (
              <Sun className="w-3.5 h-3.5 stroke-[1.5] text-amber-300" />
            )}
          </button>

          {/* Spatial Layout Edit Toggle */}
          {staffRole === 'manager' && currentView === 'floor' && (
            <button
              onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isLayoutEditMode
                  ? isLight
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-semibold'
                    : 'bg-amber-950/40 text-amber-200 border-amber-700/50 shadow-2xs font-semibold'
                  : isLight
                  ? 'bg-white border-slate-200/70 text-slate-600 hover:bg-slate-50 shadow-2xs'
                  : 'bg-[#141824] border-[#222A3C] text-slate-300 hover:bg-[#1B2232]'
              }`}
              title="Disponi tavoli sulla mappa"
            >
              <Move className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{isLayoutEditMode ? 'Fine Layout' : 'Disponi'}</span>
            </button>
          )}

          {/* Secondary Action Button: Walk-in */}
          <button
            onClick={onOpenWalkInModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer active:scale-95 border ${
              isLight
                ? 'bg-sky-50/80 hover:bg-sky-100/70 text-sky-700 border-sky-200/70 shadow-2xs'
                : 'bg-[#141824] hover:bg-[#1B2232] text-sky-200 border-[#222A3C]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-sky-600 stroke-[1.5]" />
            <span className="hidden xs:inline">Walk-in</span>
          </button>

          {/* Primary Action Button: Book Icon for In-House Reservation */}
          <button
            onClick={onOpenBookingModal}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-medium transition shadow-xs hover:shadow border border-sky-400/40 cursor-pointer active:scale-95"
            title="Seleziona l'icona libro nell'angolo in alto a destra per creare una prenotazione in-house"
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Prenota</span>
          </button>
        </div>

      </div>
    </header>
  );
};

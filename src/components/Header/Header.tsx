import React, { useState, useRef, useEffect } from 'react';
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
    | 'staff_control';
  setCurrentView: (view: any) => void;
  onOpenBookingModal: () => void;
  onOpenWalkInModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenServerMonitor?: () => void;
  onOpenShiftBriefing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  onOpenBookingModal,
  onOpenWalkInModal,
  onOpenDatabaseModal,
  onOpenServerMonitor,
  onOpenShiftBriefing,
}) => {
  const {
    staffRole,
    selectedDate,
    setSelectedDate,
    isLayoutEditMode,
    setIsLayoutEditMode,
    isRealtimeConnected,
    connectedPeersCount,
  } = useRestaurant();

  const dateInputRef = useRef<HTMLInputElement>(null);

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

  const handleTriggerDatePicker = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const formattedDateHeader = new Date(selectedDate).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="sticky top-0 z-20 bg-[#0E121B]/90 backdrop-blur-xl border-b border-[#242C3E] px-4 sm:px-6 py-2 transition-all w-full select-none text-slate-100">
      <div className="flex items-center justify-between gap-3 w-full">
        
        {/* LEFT: BRAND & SERVICE TELEMETRY */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 leading-none">
              <span className="text-base sm:text-lg font-brand font-bold tracking-tight text-white whitespace-nowrap">
                SOTTO SOTTO
              </span>
              <span className="hidden sm:inline-block text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                BAR & GRILL
              </span>
              <span className="inline-block text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
                PRERES™
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#A855F7] stroke-[1.5]" />
                <strong className="text-slate-200">{currentTimeStr}</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-[#10B981] animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline">{connectedPeersCount} sync live</span>
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: MINIMAL DATE STEPPER */}
        <div className="flex items-center gap-1 bg-[#141824] border border-[#273044] rounded-xl p-0.5 shadow-inner">
          <button
            onClick={() => handleStepDay(-1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E2536] rounded-lg transition cursor-pointer"
            title="Giorno precedente"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          <button
            onClick={handleTriggerDatePicker}
            className="flex items-center gap-1.5 px-3 py-1 hover:bg-[#1E2536] rounded-lg transition cursor-pointer text-xs font-medium text-slate-100 relative"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C084FC] stroke-[1.5]" />
            <span className="capitalize font-sans font-medium">{formattedDateHeader}</span>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 pointer-events-none w-full h-full cursor-pointer"
            />
          </button>

          <button
            onClick={() => handleStepDay(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E2536] rounded-lg transition cursor-pointer"
            title="Giorno successivo"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>

        {/* RIGHT: ELEGANT SERVICE BADGE & ACTION CTAS */}
        <div className="flex items-center gap-2">
          
          {/* Service Status Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-medium border ${
              serviceStatus.badgeType === 'open'
                ? 'bg-[#059669]/10 border-[#059669]/30 text-[#34D399]'
                : serviceStatus.badgeType === 'prep'
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                serviceStatus.badgeType === 'open' ? 'bg-[#10B981] animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{serviceStatus.isOpen ? (serviceStatus.currentService === 'lunch' ? 'Pranzo Aperto' : 'Cena Aperta') : 'Locale Chiuso'}</span>
          </div>

          {/* Spatial Layout Edit Toggle */}
          {staffRole === 'manager' && currentView === 'floor' && (
            <button
              onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isLayoutEditMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                  : 'bg-[#141824] border-[#273044] text-slate-300 hover:bg-[#1E2536]'
              }`}
              title="Disponi tavoli sulla mappa"
            >
              <Move className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{isLayoutEditMode ? 'Fine Layout' : 'Disponi'}</span>
            </button>
          )}

          {/* Walk-in Button */}
          <button
            onClick={onOpenWalkInModal}
            className="flex items-center gap-1.5 bg-[#141824] hover:bg-[#1E2536] text-slate-200 border border-[#273044] px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-xs cursor-pointer active:scale-95"
          >
            <Footprints className="w-3.5 h-3.5 text-[#34D399] stroke-[1.5]" />
            <span className="hidden xs:inline">Walk-in</span>
          </button>

          {/* Primary Action Button: + Prenota (Viola Uva) */}
          <button
            onClick={onOpenBookingModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#8B31E0] to-[#7928CA] hover:from-[#9D44F7] hover:to-[#8B31E0] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-[0_0_16px_rgba(139,49,224,0.35)] border border-[#A855F7]/30 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>Prenota</span>
          </button>
        </div>

      </div>
    </header>
  );
};

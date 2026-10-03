import React, { useState, useRef, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Calendar,
  Clock,
  Plus,
  Footprints,
  LayoutGrid,
  ListFilter,
  BarChart3,
  RotateCcw,
  Move,
  ShieldCheck,
  Bell,
  Smartphone,
  LogOut,
  Sliders,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentView: 'floor' | 'reservations' | 'timeline' | 'waitlist' | 'waiter_touch' | 'stats';
  setCurrentView: (view: 'floor' | 'reservations' | 'timeline' | 'waitlist' | 'waiter_touch' | 'stats') => void;
  onOpenBookingModal: () => void;
  onOpenWalkInModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenServerMonitor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  onOpenBookingModal,
  onOpenWalkInModal,
  onOpenDatabaseModal,
  onOpenServerMonitor,
}) => {
  const {
    staffRole,
    setStaffRole,
    selectedDate,
    selectedTime,
    setSelectedDate,
    setSelectedTime,
    isLayoutEditMode,
    setIsLayoutEditMode,
    waitlist,
    resetToDefaults,
    isRealtimeConnected,
    connectedPeersCount,
  } = useRestaurant();

  const { user, signOut } = useAuth();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Close tools dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
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

  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  const navItems = [
    { id: 'floor' as const, label: 'Mappa Sala', icon: LayoutGrid },
    { id: 'timeline' as const, label: 'Timeline', icon: Clock },
    { id: 'reservations' as const, label: 'Prenotazioni', icon: ListFilter },
    { id: 'waitlist' as const, label: 'Attesa', icon: Bell, count: waitingCount },
    { id: 'stats' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'waiter_touch' as const, label: 'Touch Sala', icon: Smartphone },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#1E3A2F]/15 px-3 sm:px-6 py-2 transition-all w-full">
      <div className="max-w-[1780px] mx-auto flex flex-col gap-2">
        
        {/* ROW 1: BRAND LOGO + CONTROLS & PRIMARY CTAs */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          
          {/* Brand Monogram & Name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setCurrentView('floor')}
              title="Sotto Sotto Bar & Grill — Dashboard Sala"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1E3A2F] text-amber-300 flex items-center justify-center font-brand font-bold text-base sm:text-lg shadow-xs border border-amber-400/30 group-hover:scale-105 transition-transform">
                S
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm sm:text-base font-brand font-bold tracking-tight text-[#1E3A2F] whitespace-nowrap">
                    SOTTO SOTTO
                  </span>
                  <span className="hidden sm:inline-block text-[8px] uppercase font-bold tracking-widest px-1 py-0.5 rounded bg-amber-100/80 text-amber-950 border border-amber-300/60 leading-none">
                    BAR & GRILL
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenServerMonitor?.();
                  }}
                  className="flex items-center gap-1 text-[10px] font-medium text-stone-500 hover:text-emerald-700 transition mt-0.5"
                  title="Stato Sincronizzazione WebSocket"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="hidden xs:inline text-[9px] sm:text-[10px]">
                    {isRealtimeConnected
                      ? `Live · ${connectedPeersCount} ${connectedPeersCount === 1 ? 'postazione' : 'postazioni'}`
                      : 'Riconnessione...'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Central Navigation (2xl+ screens) */}
          <nav className="hidden 2xl:flex items-center gap-1 p-1 bg-[#1E3A2F]/5 rounded-2xl border border-[#1E3A2F]/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                      : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Spatial Layout Drag & Drop Toggle (Floor View only) */}
            {staffRole === 'manager' && currentView === 'floor' && (
              <button
                onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap ${
                  isLayoutEditMode
                    ? 'bg-amber-400 text-amber-950 border-2 border-amber-600 ring-2 ring-amber-300 animate-pulse'
                    : 'bg-white border border-[#1E3A2F]/20 text-[#1E3A2F] hover:bg-[#1E3A2F]/5'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>{isLayoutEditMode ? 'Salva' : 'Modifica Piantina'}</span>
              </button>
            )}

            {/* Smart Date & Time Widget */}
            <div className="flex items-center bg-white border border-[#1E3A2F]/20 rounded-xl px-2.5 py-1.5 shadow-2xs gap-2 text-xs">
              {/* Smart Date Picker Button */}
              <button
                type="button"
                onClick={handleTriggerDatePicker}
                className="flex items-center gap-1.5 text-[#1E3A2F] hover:text-[#6B3FA0] font-semibold transition cursor-pointer"
                title="Clicca per cambiare data"
              >
                <Calendar className="w-3.5 h-3.5 text-[#1E3A2F]/70" />
                <span className="font-bold text-xs">{selectedDate}</span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="sr-only"
                  tabIndex={-1}
                />
              </button>

              <span className="text-[#1E3A2F]/20">|</span>

              {/* Time Input with full minute visibility */}
              <div className="flex items-center gap-1 text-[#1E3A2F]">
                <Clock className="w-3.5 h-3.5 text-[#1E3A2F]/70 shrink-0" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-transparent border-0 font-mono-num font-bold text-xs text-[#1E3A2F] focus:outline-none w-20 px-0.5 cursor-pointer text-center"
                />
              </div>
            </div>

            {/* Walk-in Action Button (Walking Person Icon) */}
            <button
              onClick={onOpenWalkInModal}
              className="flex items-center gap-1.5 bg-[#F6F2E9] hover:bg-[#EDE7DA] text-[#1E3A2F] border border-[#1E3A2F]/20 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs whitespace-nowrap active:scale-95 cursor-pointer"
              title="Accomoda ospiti senza prenotazione (Walk-in)"
            >
              <Footprints className="w-4 h-4 text-[#1E3A2F]" />
              <span className="hidden xs:inline">Walk-in</span>
            </button>

            {/* Primary CTA: + Prenota */}
            <button
              onClick={onOpenBookingModal}
              className="flex items-center gap-1 bg-[#6B3FA0] hover:bg-[#5A338A] text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Prenota</span>
            </button>

            {/* Consolidated Tools & Role Popover */}
            <div className="relative z-50" ref={toolsMenuRef}>
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isToolsOpen
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F]'
                    : 'bg-white border-[#1E3A2F]/20 text-[#1E3A2F] hover:bg-[#1E3A2F]/5'
                }`}
                title="Gestione Ruolo Staff & Impostazioni"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden md:inline capitalize">{staffRole}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Popover Menu with high z-index */}
              {isToolsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 z-[100] animate-in fade-in zoom-in-95 duration-150">
                  {/* Staff Role Switcher */}
                  <div className="px-3 py-2 border-b border-stone-100">
                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">
                      Ruolo Operativo Staff
                    </p>
                    <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-[11px] font-semibold">
                      <button
                        onClick={() => {
                          setStaffRole('manager');
                          setIsToolsOpen(false);
                        }}
                        className={`py-1 rounded-lg transition ${
                          staffRole === 'manager'
                            ? 'bg-[#1E3A2F] text-amber-100 shadow-2xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Manager
                      </button>
                      <button
                        onClick={() => {
                          setStaffRole('host');
                          if (currentView === 'waiter_touch') setCurrentView('floor');
                          setIsToolsOpen(false);
                        }}
                        className={`py-1 rounded-lg transition ${
                          staffRole === 'host'
                            ? 'bg-[#1E3A2F] text-amber-100 shadow-2xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Host
                      </button>
                      <button
                        onClick={() => {
                          setStaffRole('waiter');
                          setCurrentView('waiter_touch');
                          setIsToolsOpen(false);
                        }}
                        className={`py-1 rounded-lg transition ${
                          staffRole === 'waiter'
                            ? 'bg-[#1E3A2F] text-amber-100 shadow-2xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Cameriere
                      </button>
                    </div>
                  </div>

                  {/* System Tools */}
                  <div className="px-2 py-1 border-b border-stone-100">
                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider px-2 py-1">
                      Integrazioni & Sistema
                    </p>

                    <button
                      onClick={() => {
                        onOpenServerMonitor?.();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 rounded-xl transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span>Monitor Server WebSocket</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </button>

                    <button
                      onClick={() => {
                        onOpenDatabaseModal();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 rounded-xl transition text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Schema Supabase & RLS</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Vuoi ripristinare i dati e il layout demo di Sotto Sotto?')) {
                          resetToDefaults();
                        }
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-xl transition text-left"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>Ripristina Dati Demo</span>
                    </button>
                  </div>

                  {/* User Session & Logout */}
                  {user && (
                    <div className="px-3 pt-2 pb-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-full bg-[#1E3A2F] text-amber-200 text-[10px] font-bold flex items-center justify-center">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-stone-600 truncate max-w-[140px]">
                            {user.email}
                          </span>
                        </div>
                        <button
                          onClick={() => signOut()}
                          className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Esci</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: ADAPTIVE NAVIGATION BAR (Visible on screens below 2xl) */}
        <div className="2xl:hidden flex items-center justify-start sm:justify-center w-full overflow-x-auto pb-1 no-scrollbar">
          <nav className="flex items-center gap-1 p-1 bg-[#1E3A2F]/5 rounded-2xl border border-[#1E3A2F]/10 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                      : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
};

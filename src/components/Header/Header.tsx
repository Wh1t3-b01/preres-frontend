import React, { useState, useRef, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Calendar,
  Clock,
  Plus,
  Zap,
  LayoutGrid,
  ListFilter,
  BarChart3,
  RotateCcw,
  Move,
  ShieldCheck,
  Bell,
  Smartphone,
  LogOut,
  User,
  Sliders,
  MoreVertical,
  Activity,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import { StaffRole } from '../../types';
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
    settings,
    staffRole,
    setStaffRole,
    selectedDate,
    selectedTime,
    setSelectedDate,
    setSelectedTime,
    isLiveMode,
    setIsLiveMode,
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

  const setNowTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const today = now.toISOString().split('T')[0];
    setSelectedDate(today);
    setSelectedTime(`${h}:${m}`);
    setIsLiveMode(true);
  };

  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#1E3A2F]/15 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-[1780px] mx-auto flex items-center justify-between gap-3 lg:gap-6">
        
        {/* ========================================================= */}
        {/* ZONE 1: BRAND LOGO & LIVE STATUS (Zero-wrap, Prestige)     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setCurrentView('floor')}
            title="Sotto Sotto Bar & Grill — Dashboard Sala"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1E3A2F] text-amber-300 flex items-center justify-center font-brand font-bold text-lg sm:text-xl shadow-xs border border-amber-400/30 group-hover:scale-105 transition-transform">
              S
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-brand font-bold tracking-tight text-[#1E3A2F] leading-none">
                  SOTTO SOTTO
                </span>
                <span className="hidden md:inline-block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-950 border border-amber-300/60 leading-none">
                  BAR & GRILL
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenServerMonitor?.();
                  }}
                  className="flex items-center gap-1 text-[10px] font-medium text-stone-500 hover:text-emerald-700 transition"
                  title="Stato Sincronizzazione Realtime"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {isRealtimeConnected
                      ? `Live · ${connectedPeersCount} ${connectedPeersCount === 1 ? 'postazione' : 'postazioni'}`
                      : 'Riconnessione...'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE 2: PRIMARY NAVIGATION BAR (No Scrollbar, Segmented)   */}
        {/* ========================================================= */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#1E3A2F]/5 rounded-2xl border border-[#1E3A2F]/10 shrink-0">
          <button
            onClick={() => setCurrentView('floor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'floor'
                ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mappa Sala</span>
          </button>

          <button
            onClick={() => setCurrentView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'timeline'
                ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setCurrentView('reservations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'reservations'
                ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Prenotazioni</span>
          </button>

          <button
            onClick={() => setCurrentView('waitlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap relative ${
              currentView === 'waitlist'
                ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Attesa</span>
            {waitingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {waitingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('stats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'stats'
                ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setCurrentView('waiter_touch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'waiter_touch'
                ? 'bg-white text-[#1E3A2F] shadow-xs font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Touch Sala</span>
          </button>
        </nav>

        {/* ========================================================= */}
        {/* ZONE 3: ACTIONS, TIME CONTROLS & LUXURY TOOLS DROPDOWN    */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Spatial Layout Drag & Drop Toggle (Floor View only) */}
          {staffRole === 'manager' && currentView === 'floor' && (
            <button
              onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap ${
                isLayoutEditMode
                  ? 'bg-amber-400 text-amber-950 border-2 border-amber-600 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-white border border-[#1E3A2F]/20 text-[#1E3A2F] hover:bg-[#1E3A2F]/5'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isLayoutEditMode ? 'Salva Layout' : 'Modifica Piantina'}</span>
            </button>
          )}

          {/* Date & Time Widget */}
          <div className="flex items-center bg-white border border-[#1E3A2F]/20 rounded-xl px-2.5 py-1 shadow-2xs gap-1.5 text-xs">
            <div className="flex items-center gap-1 text-[#1E3A2F]">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A2F]/60" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="bg-transparent border-0 font-medium text-xs text-[#1E3A2F] focus:outline-none cursor-pointer w-28 sm:w-auto"
              />
            </div>
            <span className="text-[#1E3A2F]/20 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1 text-[#1E3A2F]">
              <Clock className="w-3.5 h-3.5 text-[#1E3A2F]/60" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  setIsLiveMode(false);
                }}
                className="bg-transparent border-0 font-bold text-xs text-[#1E3A2F] focus:outline-none w-16 px-0.5 cursor-pointer"
              />
            </div>
            <button
              onClick={setNowTime}
              title="Sincronizza orario con tempo reale"
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                isLiveMode
                  ? 'bg-[#1E3A2F] text-amber-100 shadow-2xs'
                  : 'bg-[#1E3A2F]/10 text-[#1E3A2F] hover:bg-[#1E3A2F]/20'
              }`}
            >
              LIVE
            </button>
          </div>

          {/* Quick Action: Walk-in */}
          <button
            onClick={onOpenWalkInModal}
            className="flex items-center gap-1.5 bg-[#F6F2E9] hover:bg-[#EDE7DA] text-[#1E3A2F] border border-[#1E3A2F]/20 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs whitespace-nowrap active:scale-95"
            title="Accomoda ospiti senza prenotazione"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span className="hidden sm:inline">Walk-in</span>
          </button>

          {/* Primary CTA: + Prenota */}
          <button
            onClick={onOpenBookingModal}
            className="flex items-center gap-1.5 bg-[#6B3FA0] hover:bg-[#5A338A] text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Prenota</span>
          </button>

          {/* ========================================================= */}
          {/* CONSOLIDATED TOOLS & ROLE MENU (Clean Graphic Design)     */}
          {/* ========================================================= */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isToolsOpen
                  ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F]'
                  : 'bg-white border-[#1E3A2F]/20 text-[#1E3A2F] hover:bg-[#1E3A2F]/5'
              }`}
              title="Strumenti, Ruolo & Impostazioni"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden lg:inline capitalize">{staffRole}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Dropdown Menu */}
            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                
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

                {/* Mobile Navigation Links (if screen is small) */}
                <div className="md:hidden px-2 py-1 border-b border-stone-100">
                  <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider px-2 py-1">
                    Viste Sala
                  </p>
                  <button
                    onClick={() => {
                      setCurrentView('floor');
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg text-left"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-stone-500" />
                    <span>Mappa Sala</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('timeline');
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg text-left"
                  >
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Timeline Oraria</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('reservations');
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg text-left"
                  >
                    <ListFilter className="w-3.5 h-3.5 text-stone-500" />
                    <span>Registro Prenotazioni</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('waitlist');
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg text-left"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lista d'Attesa</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('stats');
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg text-left"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Executive Analytics</span>
                  </button>
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
                      <span>Monitor Server & WebSocket</span>
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
                        className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 rounded-lg transition"
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
    </header>
  );
};

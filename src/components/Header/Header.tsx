import React from 'react';
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
  Users,
  Layers,
  Move,
  CheckCircle,
  UserCheck,
  ShieldCheck,
  Bell,
  Smartphone,
  LogOut,
  User,
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
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#1E3A2F]/15 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-[1700px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Role Switcher */}
        <div className="flex items-center justify-between w-full xl:w-auto gap-4">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setCurrentView('floor')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E3A2F] text-amber-100 flex items-center justify-center font-brand font-bold text-xl shadow-sm border border-[#1E3A2F]/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-brand font-bold tracking-tight text-[#1E3A2F] leading-tight">
                  {settings.name}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Pro SaaS
                </span>
              </div>
              <p className="text-[11px] text-[#1E3A2F]/60 font-medium">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* RBAC Staff Role Selector */}
          <div className="flex items-center bg-[#1E3A2F]/5 p-1 rounded-xl border border-[#1E3A2F]/10 text-xs font-semibold">
            <button
              onClick={() => setStaffRole('manager')}
              className={`px-2.5 py-1 rounded-lg transition ${
                staffRole === 'manager'
                  ? 'bg-[#1E3A2F] text-amber-100 shadow-xs'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F]'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => {
                setStaffRole('host');
                if (currentView === 'waiter_touch') setCurrentView('floor');
              }}
              className={`px-2.5 py-1 rounded-lg transition ${
                staffRole === 'host'
                  ? 'bg-[#1E3A2F] text-amber-100 shadow-xs'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F]'
              }`}
            >
              Host / Accoglienza
            </button>
            <button
              onClick={() => {
                setStaffRole('waiter');
                setCurrentView('waiter_touch');
              }}
              className={`px-2.5 py-1 rounded-lg transition ${
                staffRole === 'waiter'
                  ? 'bg-[#1E3A2F] text-amber-100 shadow-xs'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F]'
              }`}
            >
              Cameriere Touch
            </button>
          </div>
        </div>

        {/* Zone 2: Navigation Views */}
        <nav className="flex items-center gap-1 p-1 bg-[#1E3A2F]/5 rounded-xl border border-[#1E3A2F]/10 overflow-x-auto max-w-full">
          <button
            onClick={() => setCurrentView('floor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'floor'
                ? 'bg-white text-[#1E3A2F] shadow-sm font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mappa Sala</span>
          </button>

          <button
            onClick={() => setCurrentView('reservations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'reservations'
                ? 'bg-white text-[#1E3A2F] shadow-sm font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/50'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Prenotazioni</span>
          </button>

          <button
            onClick={() => setCurrentView('waitlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap relative ${
              currentView === 'waitlist'
                ? 'bg-white text-[#1E3A2F] shadow-sm font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/50'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Lista d'Attesa</span>
            {waitingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {waitingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('waiter_touch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'waiter_touch'
                ? 'bg-white text-[#1E3A2F] shadow-sm font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Touch Portate</span>
          </button>

          <button
            onClick={() => setCurrentView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'timeline'
                ? 'bg-white text-[#1E3A2F] shadow-sm font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setCurrentView('stats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'stats'
                ? 'bg-white text-[#1E3A2F] shadow-sm font-bold border border-[#1E3A2F]/10'
                : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F] hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Analytics</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Date Controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full xl:w-auto justify-end">
          {/* Spatial Layout Mode Toggle (for Managers) */}
          {staffRole === 'manager' && currentView === 'floor' && (
            <button
              onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap ${
                isLayoutEditMode
                  ? 'bg-amber-400 text-amber-950 border-2 border-amber-600 ring-2 ring-amber-300'
                  : 'bg-white border border-[#1E3A2F]/20 text-[#1E3A2F] hover:bg-[#1E3A2F]/5'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isLayoutEditMode ? 'Salva & Blocca Layout' : 'Modifica Layout (Drag & Drop)'}</span>
            </button>
          )}

          {/* Date & Time Picker */}
          <div className="flex items-center bg-white border border-[#1E3A2F]/20 rounded-xl px-2.5 py-1.5 shadow-xs gap-2 text-xs">
            <div className="flex items-center gap-1 text-[#1E3A2F]">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A2F]/60" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="bg-transparent border-0 font-medium text-xs text-[#1E3A2F] focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-[#1E3A2F]/20">|</span>
            <div className="flex items-center gap-1 text-[#1E3A2F]">
              <Clock className="w-3.5 h-3.5 text-[#1E3A2F]/60" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  setIsLiveMode(false);
                }}
                className="bg-transparent border-0 font-mono-num font-bold text-xs text-[#1E3A2F] focus:outline-none w-20 px-0.5 cursor-pointer"
              />
            </div>
            <button
              onClick={setNowTime}
              title="Sincronizza con ora attuale"
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                isLiveMode
                  ? 'bg-[#1E3A2F] text-amber-100 shadow-xs'
                  : 'bg-[#1E3A2F]/10 text-[#1E3A2F] hover:bg-[#1E3A2F]/20'
              }`}
            >
              LIVE
            </button>
          </div>

          {/* WebSocket Multi-Device Live Sync Status */}
          <button
            type="button"
            onClick={onOpenServerMonitor}
            title={isRealtimeConnected ? "Visualizza monitor del Server e metriche WebSocket" : "Riconnessione automatica al server in corso..."}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shadow-2xs transition cursor-pointer active:scale-95 ${
              isRealtimeConnected
                ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 text-emerald-800'
                : 'bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span>
              {isRealtimeConnected
                ? `WebSocket Live (${connectedPeersCount} ${connectedPeersCount === 1 ? 'dispositivo' : 'dispositivi'})`
                : 'Riconnessione live in corso...'}
            </span>
          </button>

          {/* Quick Walk-in Button */}
          <button
            onClick={onOpenWalkInModal}
            className="flex items-center gap-1.5 bg-[#F6F2E9] hover:bg-[#EDE7DA] text-[#1E3A2F] border border-[#1E3A2F]/20 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-xs whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>Walk-in</span>
          </button>

          {/* New Reservation CTA */}
          <button
            onClick={onOpenBookingModal}
            className="flex items-center gap-1.5 bg-[#6B3FA0] hover:bg-[#5A338A] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Prenota</span>
          </button>

          {/* Database & Supabase SQL Schema Button */}
          {staffRole === 'manager' && (
            <button
              onClick={onOpenDatabaseModal}
              title="Schema Database & SQL Supabase"
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-[#1E3A2F] border border-[#1E3A2F]/20 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-2xs whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E3A2F]" />
              <span>SQL Supabase</span>
            </button>
          )}

          {/* Demo Data Reset */}
          <button
            onClick={() => {
              if (confirm('Vuoi ripristinare i dati e il layout demo di Sotto Sotto?')) {
                resetToDefaults();
              }
            }}
            title="Ripristina dati demo"
            className="p-2 text-[#1E3A2F]/50 hover:text-[#1E3A2F] hover:bg-[#1E3A2F]/5 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Account & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#1E3A2F]/15">
              <span
                className="hidden lg:inline-block max-w-[120px] truncate text-[11px] font-medium text-stone-600"
                title={user.email}
              >
                {user.email?.split('@')[0]}
              </span>
              <button
                onClick={() => signOut()}
                title={`Disconnetti (${user.email})`}
                className="flex items-center gap-1 p-2 text-rose-700/80 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Esci</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

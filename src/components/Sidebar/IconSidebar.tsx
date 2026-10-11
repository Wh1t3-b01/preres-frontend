import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Clock,
  Calendar,
  Activity,
  ListFilter,
  Users,
  Bell,
  BarChart3,
  Smartphone,
  NotebookPen,
  ShieldCheck,
  Radio,
  LogOut,
  User,
  Eye,
  Sliders,
} from 'lucide-react';

interface IconSidebarProps {
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
  onOpenShiftBriefing: () => void;
  onOpenServerMonitor: () => void;
  onOpenDatabaseModal: () => void;
  onOpenStaffManagement: () => void;
}

export const IconSidebar: React.FC<IconSidebarProps> = ({
  currentView,
  setCurrentView,
  onOpenShiftBriefing,
  onOpenServerMonitor,
  onOpenDatabaseModal,
  onOpenStaffManagement,
}) => {
  const { waitlist, staffRole, setStaffRole, isRealtimeConnected, theme } = useRestaurant();
  const { user, signOut } = useAuth();
  const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);
  const isLight = theme === 'light';

  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  const navItems = [
    { id: 'floor' as const, label: 'Mappa Sala PRERES', icon: LayoutGrid, shortcut: '1' },
    { id: 'timeline' as const, label: 'Timeline Tavoli & Planning', icon: Clock, shortcut: '2' },
    { id: 'boh_management' as const, label: 'BOH Disponibilità & Layout', icon: Sliders, shortcut: '3' },
    { id: 'waiter_hub' as const, label: 'Console Sala & Cameriere', icon: Smartphone, shortcut: '4' },
    { id: 'staff_control' as const, label: 'Personale & Controllo Servizio', icon: ShieldCheck, shortcut: '5' },
    { id: 'shift_overview' as const, label: 'Pacing Cucina & Analytics', icon: Activity, shortcut: '6' },
    { id: 'crm' as const, label: 'Guest Intelligence CRM', icon: Users, shortcut: '7' },
    { id: 'calendar' as const, label: 'Horizon Calendar', icon: Calendar, shortcut: '8' },
    { id: 'waitlist' as const, label: "Lista d'Attesa", icon: Bell, count: waitingCount, shortcut: '9' },
  ];

  return (
    <>
      <aside className={`fixed left-2 sm:left-3 top-2 sm:top-3 bottom-2 sm:bottom-3 w-11 sm:w-12 backdrop-blur-xl rounded-2xl flex flex-col justify-between items-center py-2 z-50 select-none transition-all overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
        isLight
          ? 'bg-white/90 border border-slate-200/70 shadow-2xs text-slate-600'
          : 'bg-[#121622]/95 border border-[#222A3C] shadow-lg text-slate-300'
      }`}>
      
      {/* TOP BRAND MONOGRAM */}
      <div className="flex flex-col items-center gap-1 w-full shrink-0">
        <button
          onClick={() => setCurrentView('floor')}
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-brand font-semibold text-xs shadow-2xs hover:scale-102 active:scale-95 transition cursor-pointer border border-sky-400/30 shrink-0"
          title="PRERES™ — Hospitality OS"
        >
          P
        </button>

        <div className={`w-5 h-px my-0.5 ${isLight ? 'bg-slate-200/60' : 'bg-[#222A3C]'}`} />

        {/* PRIMARY ULTRA-MINIMAL THIN-LINE ICON NAV */}
        <nav className="flex flex-col items-center gap-0.5 sm:gap-1 w-full px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'waiter_hub' && (currentView === 'waiter_touch' || currentView === 'server_view'));

            return (
              <div key={item.id} className="relative group flex items-center justify-center w-full">
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all cursor-pointer relative border ${
                    isActive
                      ? isLight
                        ? 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs'
                        : 'bg-[#1C2538] text-sky-300 border-sky-700/40 shadow-2xs'
                      : isLight
                      ? 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-4 h-4 stroke-[1.25]" />

                  {/* Active Indicator Bar on Left */}
                  {isActive && (
                    <span className={`absolute -left-1 top-2 bottom-2 w-0.5 rounded-r-full ${
                      isLight ? 'bg-sky-500' : 'bg-sky-400'
                    }`} />
                  )}

                  {/* Waitlist Badge Counter */}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 text-white font-bold text-[8px] rounded-full flex items-center justify-center shadow-xs">
                      {item.count}
                    </span>
                  )}
                </button>

                {/* High-Precision Floating Tooltip */}
                <div className={`absolute left-full ml-3 px-2.5 py-1.5 text-xs font-semibold rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 flex items-center gap-2 border ${
                  isLight
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-[#171C2B] text-slate-100 border-[#2D364D]'
                }`}>
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-400 bg-white/10 px-1 py-0.2 rounded font-mono">
                    {item.shortcut}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM UTILITY ICONS */}
      <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full px-1 shrink-0">
        <div className={`w-5 h-px my-0.5 ${isLight ? 'bg-slate-200' : 'bg-[#242C3E]/80'}`} />

        {/* ShiftMaster Briefing */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenShiftBriefing}
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-sky-600 hover:bg-slate-100' : 'text-slate-400 hover:text-[#C084FC] hover:bg-[#1B2130]'
            }`}
            title="PRERES ShiftMaster™"
          >
            <NotebookPen className="w-3.5 h-3.5 stroke-[1.25]" />
          </button>
        </div>

        {/* Real-time Sync */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenServerMonitor}
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
              isLight ? 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100' : 'text-slate-400 hover:text-[#10B981] hover:bg-[#1B2130]'
            }`}
            title="WebSocket Sync"
          >
            <Radio className="w-3.5 h-3.5 stroke-[1.25]" />
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>

        {/* Database Schema */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenDatabaseModal}
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-sky-600 hover:bg-slate-100' : 'text-slate-400 hover:text-[#C084FC] hover:bg-[#1B2130]'
            }`}
            title="Schema Database & RLS"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.25]" />
          </button>
        </div>

        {/* Staff Role Avatar */}
        <div className="relative flex items-center justify-center w-full mt-0.5">
          <button
            onClick={() => setIsRoleFlyoutOpen((prev) => !prev)}
            className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
              isRoleFlyoutOpen
                ? isLight
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                  : 'bg-[#1E273A] border-sky-500/40 text-sky-300 shadow-2xs'
                : isLight
                ? 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80 text-slate-700'
                : 'bg-[#181F2E] hover:bg-[#20293D] border-[#2A344A] text-slate-300'
            }`}
            title={`Profilo & Ruolo: ${staffRole}`}
            aria-label="Account e Gestione Ruolo"
          >
            <User className="w-3.5 h-3.5 stroke-[1.25]" />
          </button>
        </div>
      </div>
    </aside>

    {/* Account & Role Popover - Rendered outside the aside to prevent overflow clipping */}
    {isRoleFlyoutOpen && (
      <>
        {/* Backdrop for outside click */}
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsRoleFlyoutOpen(false)}
        />

        <div className={`fixed left-14 sm:left-16 bottom-3 sm:bottom-4 w-60 rounded-2xl p-2.5 shadow-xl z-[70] animate-in fade-in zoom-in-95 duration-150 border ${
          isLight
            ? 'bg-white/95 border-slate-200/80 text-slate-800 shadow-slate-200/50'
            : 'bg-[#151926] border-[#2C364D] text-slate-200 shadow-[0_16px_48px_rgba(0,0,0,0.7)]'
        }`}>
          <div className={`px-2.5 py-1.5 text-[11px] font-medium border-b mb-2 flex items-center justify-between ${
            isLight ? 'text-slate-800 border-slate-100' : 'text-slate-200 border-[#242C3E]'
          }`}>
            <span className="flex items-center gap-1.5">
              <User className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              <span>Profilo & Ruolo</span>
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-mono ${
              isLight
                ? 'bg-sky-50 text-sky-700 border border-sky-200/70'
                : 'bg-sky-950/40 text-sky-300 border border-sky-800/40'
            }`}>
              {staffRole}
            </span>
          </div>

          {user && (
            <div className={`px-2.5 py-1 mb-1.5 rounded-xl text-[10px] truncate border ${
              isLight ? 'bg-slate-50/70 border-slate-200/70 text-slate-600' : 'bg-[#10141F] border-[#222A3C] text-slate-400'
            }`}>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-medium">Utente Connesso</span>
              <span className={`font-normal ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{user.email}</span>
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={() => {
                setStaffRole('manager');
                setIsRoleFlyoutOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between border ${
                staffRole === 'manager'
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs font-semibold'
                    : 'bg-sky-950/40 text-sky-300 border-sky-800/50 font-semibold'
                  : isLight
                  ? 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  : 'border-transparent text-slate-300 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <span>Manager / Maître</span>
              {staffRole === 'manager' && <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-sky-600' : 'bg-sky-400'}`} />}
            </button>

            <button
              onClick={() => {
                setStaffRole('host');
                setIsRoleFlyoutOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between border ${
                staffRole === 'host'
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs font-semibold'
                    : 'bg-sky-950/40 text-sky-300 border-sky-800/50 font-semibold'
                  : isLight
                  ? 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  : 'border-transparent text-slate-300 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <span>Host / Accoglienza</span>
              {staffRole === 'host' && <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-sky-600' : 'bg-sky-400'}`} />}
            </button>

            <button
              onClick={() => {
                setStaffRole('waiter');
                setCurrentView('waiter_hub');
                setIsRoleFlyoutOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between border ${
                staffRole === 'waiter'
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs font-semibold'
                    : 'bg-sky-950/40 text-sky-300 border-sky-800/50 font-semibold'
                  : isLight
                  ? 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  : 'border-transparent text-slate-300 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <span>Cameriere (Console Sala)</span>
              {staffRole === 'waiter' && <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-sky-600' : 'bg-sky-400'}`} />}
            </button>

            <button
              onClick={() => {
                setCurrentView('staff_control');
                setIsRoleFlyoutOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition cursor-pointer border ${
                isLight
                  ? 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 border-amber-200/70'
                  : 'text-amber-300 hover:bg-amber-950/30 border-amber-900/40'
              }`}
            >
              <span>Controllo Personale & Storni</span>
              <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            </button>
          </div>

          {user && (
            <button
              onClick={() => {
                setIsRoleFlyoutOpen(false);
                signOut();
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium border-t mt-2 pt-2 flex items-center justify-between transition cursor-pointer ${
                isLight
                  ? 'text-rose-600 hover:bg-rose-50 border-slate-100'
                  : 'text-rose-400 hover:bg-rose-950/30 border-[#242C3E]'
              }`}
            >
              <span>Logout</span>
              <LogOut className="w-3.5 h-3.5 stroke-[1.25]" />
            </button>
          )}
        </div>
      </>
    )}
  </>
);
};

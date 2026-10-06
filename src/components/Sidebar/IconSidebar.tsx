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
    | 'staff_control';
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
  const { waitlist, staffRole, setStaffRole, isRealtimeConnected } = useRestaurant();
  const { user, signOut } = useAuth();
  const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);

  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  const navItems = [
    { id: 'floor' as const, label: 'Mappa Sala PRERES', icon: LayoutGrid, shortcut: '1' },
    { id: 'timeline' as const, label: 'Timeline Tavoli & Planning', icon: Clock, shortcut: '2' },
    { id: 'waiter_hub' as const, label: 'Console Sala & Cameriere', icon: Smartphone, shortcut: '3' },
    { id: 'staff_control' as const, label: 'Personale & Controllo Servizio', icon: ShieldCheck, shortcut: '4' },
    { id: 'reservations' as const, label: 'Lista Prenotazioni', icon: ListFilter, shortcut: '5' },
    { id: 'shift_overview' as const, label: 'Pacing Cucina & Analytics', icon: Activity, shortcut: '6' },
    { id: 'crm' as const, label: 'Guest Intelligence CRM', icon: Users, shortcut: '7' },
    { id: 'calendar' as const, label: 'Horizon Calendar', icon: Calendar, shortcut: '8' },
    { id: 'waitlist' as const, label: "Lista d'Attesa", icon: Bell, count: waitingCount, shortcut: '9' },
  ];

  return (
    <>
      <aside className="fixed left-2 sm:left-3 top-2 sm:top-3 bottom-2 sm:bottom-3 w-11 sm:w-12 bg-[#121622]/95 backdrop-blur-xl border border-[#273044]/70 rounded-2xl flex flex-col justify-between items-center py-2 z-50 select-none shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      {/* TOP BRAND MONOGRAM */}
      <div className="flex flex-col items-center gap-1 w-full shrink-0">
        <button
          onClick={() => setCurrentView('floor')}
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B31E0] to-[#6E20C0] text-white flex items-center justify-center font-brand font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition cursor-pointer border border-[#A855F7]/30 shrink-0"
          title="PRERES™ — Hospitality OS"
        >
          P
        </button>

        <div className="w-5 h-px bg-[#242C3E]/80 my-0.5" />

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
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/50 shadow-[0_0_12px_rgba(139,49,224,0.3)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#1B2130]'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-4 h-4 stroke-[1.25]" />

                  {/* Active Indicator Bar on Left */}
                  {isActive && (
                    <span className="absolute -left-1 top-1.5 bottom-1.5 w-0.5 bg-[#A855F7] rounded-r-full" />
                  )}

                  {/* Waitlist Badge Counter */}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#059669] text-white font-bold text-[8px] rounded-full flex items-center justify-center shadow-xs">
                      {item.count}
                    </span>
                  )}
                </button>

                {/* High-Precision Floating Tooltip */}
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#171C2B] text-slate-100 text-xs font-semibold rounded-xl shadow-2xl border border-[#2D364D] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 flex items-center gap-2">
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-400 bg-black/40 px-1 py-0.2 rounded font-mono">
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
        <div className="w-5 h-px bg-[#242C3E]/80 my-0.5" />

        {/* ShiftMaster Briefing */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenShiftBriefing}
            className="w-7.5 h-7.5 rounded-lg text-slate-400 hover:text-[#C084FC] hover:bg-[#1B2130] flex items-center justify-center transition cursor-pointer"
            title="PRERES ShiftMaster™"
          >
            <NotebookPen className="w-3.5 h-3.5 stroke-[1.25]" />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#171C2B] text-slate-100 text-xs font-semibold rounded-xl shadow-2xl border border-[#2D364D] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            PRERES ShiftMaster™
          </div>
        </div>

        {/* Real-time Sync */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenServerMonitor}
            className="w-7.5 h-7.5 rounded-lg text-slate-400 hover:text-[#10B981] hover:bg-[#1B2130] flex items-center justify-center transition cursor-pointer relative"
            title="WebSocket Sync"
          >
            <Radio className="w-3.5 h-3.5 stroke-[1.25]" />
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                isRealtimeConnected ? 'bg-[#10B981] animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#171C2B] text-slate-100 text-xs font-semibold rounded-xl shadow-2xl border border-[#2D364D] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            WebSocket Live Sync
          </div>
        </div>

        {/* Database Schema */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenDatabaseModal}
            className="w-7.5 h-7.5 rounded-lg text-slate-400 hover:text-[#C084FC] hover:bg-[#1B2130] flex items-center justify-center transition cursor-pointer"
            title="Schema Database & RLS"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.25]" />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#171C2B] text-slate-100 text-xs font-semibold rounded-xl shadow-2xl border border-[#2D364D] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Schema Supabase & RLS
          </div>
        </div>

        {/* Staff Role Avatar */}
        <div className="relative flex items-center justify-center w-full mt-0.5">
          <button
            onClick={() => setIsRoleFlyoutOpen((prev) => !prev)}
            className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
              isRoleFlyoutOpen
                ? 'bg-[#8B31E0]/30 border-[#A855F7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-[#1B2130] hover:bg-[#232B3E] border-[#2F3950] text-[#C084FC]'
            }`}
            title={`Profilo & Ruolo: ${staffRole}`}
            aria-label="Account e Gestione Ruolo"
          >
            <User className="w-3.5 h-3.5 stroke-[1.3]" />
          </button>
        </div>
      </div>
    </aside>

    {/* Account & Role Popover - Rendered outside the aside to prevent overflow clipping */}
    {isRoleFlyoutOpen && (
      <>
        {/* Backdrop for outside click */}
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          onClick={() => setIsRoleFlyoutOpen(false)}
        />

        <div className="fixed left-14 sm:left-16 bottom-3 sm:bottom-4 w-60 bg-[#151926] border border-[#2C364D] rounded-2xl p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.7)] z-[70] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-200 border-b border-[#242C3E] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>Profilo & Ruolo</span>
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 uppercase font-mono">
              {staffRole}
            </span>
          </div>

          {user && (
            <div className="px-2.5 py-1 mb-1.5 bg-[#10141F] border border-[#222A3C] rounded-xl text-[10px] text-slate-400 truncate">
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Utente Connesso</span>
              <span className="text-slate-200 font-medium">{user.email}</span>
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={() => {
                setStaffRole('manager');
                setIsRoleFlyoutOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                staffRole === 'manager'
                  ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40'
                  : 'text-slate-300 hover:bg-[#1C2335]'
              }`}
            >
              <span>Manager / Maître</span>
              {staffRole === 'manager' && <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />}
            </button>

            <button
              onClick={() => {
                setStaffRole('host');
                setIsRoleFlyoutOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                staffRole === 'host'
                  ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40'
                  : 'text-slate-300 hover:bg-[#1C2335]'
              }`}
            >
              <span>Host / Accoglienza</span>
              {staffRole === 'host' && <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />}
            </button>

            <button
              onClick={() => {
                setStaffRole('waiter');
                setCurrentView('waiter_hub');
                setIsRoleFlyoutOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                staffRole === 'waiter'
                  ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40'
                  : 'text-slate-300 hover:bg-[#1C2335]'
              }`}
            >
              <span>Cameriere (Console Sala)</span>
              {staffRole === 'waiter' && <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />}
            </button>

            <button
              onClick={() => {
                setCurrentView('staff_control');
                setIsRoleFlyoutOpen(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-950/30 border border-amber-900/40 flex items-center justify-between transition cursor-pointer"
            >
              <span>Controllo Personale & Storni</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {user && (
            <button
              onClick={() => {
                setIsRoleFlyoutOpen(false);
                signOut();
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border-t border-[#242C3E] mt-2 pt-2 flex items-center justify-between transition cursor-pointer"
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

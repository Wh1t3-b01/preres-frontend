import React from 'react';
import {
  LayoutGrid,
  ListFilter,
  Clock,
  Calendar,
  Activity,
  Users,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Sparkles,
  Sliders,
  ChevronRight,
  Printer,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface MainMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (viewId: string) => void;
  onOpenSettings: (initialTab?: 'general' | 'logging' | 'staff' | 'hardware') => void;
  onOpenHelp: () => void;
  onOpenServerSections: () => void;
  theme: 'light' | 'dark';
}

export const MainMenuDrawer: React.FC<MainMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenHelp,
  onOpenServerSections,
  theme,
}) => {
  const { user, signOut } = useAuth();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const chapters = [
    {
      chapter: 'Default',
      id: 'floor',
      title: 'Piantina Sala (Floor Plan)',
      description: 'Mappa tavoli, liste attesa e pulsanti rapidi sezioni/anomalie',
      icon: LayoutGrid,
      badge: 'Predefinito',
    },
    {
      chapter: 'Capitolo 2',
      id: 'reservations',
      title: 'Vista Elenco (List View)',
      description: 'Gestisci più prenotazioni insieme e lista d’attesa in colonna',
      icon: ListFilter,
    },
    {
      chapter: 'Capitolo 3',
      id: 'timeline',
      title: 'Timeline (Time Slots)',
      description: 'Identifica buchi, conflitti orari e inserisci prenotazioni al volo',
      icon: Clock,
    },
    {
      chapter: 'Capitolo 4',
      id: 'calendar',
      title: 'Calendario Mensile (Calendar)',
      description: 'Coperti mese per mese, walk-in, giorni speciali ed esperienze',
      icon: Calendar,
    },
    {
      chapter: 'Capitolo 5',
      id: 'shift_overview',
      title: 'Riepilogo Turno (Shift Overview)',
      description: 'Coperti per orario/canale, taglia gruppi, note servizio e maître',
      icon: Activity,
    },
    {
      chapter: 'Capitolo 6',
      id: 'crm',
      title: 'Rubrica Ospiti (Guestbook)',
      description: 'Storico clienti, preferenze alimentari, posti e ricorrenze',
      icon: Users,
    },
    {
      chapter: 'Capitolo 7',
      id: 'server_sections_action',
      title: 'Sezioni Camerieri (Server Sections)',
      description: 'Assegna tavoli ai ranghi e pianifica camerieri per i prossimi turni',
      icon: ShieldCheck,
      isAction: true,
      onClick: () => {
        onClose();
        onOpenServerSections();
      },
    },
    {
      chapter: 'BOH Tech',
      id: 'boh_management',
      title: 'BOH Management OS',
      description: 'Editor multi-layout sale, combinazioni tavoli e regole capienze',
      icon: Sliders,
    },
  ];

  const settingShortcuts = [
    {
      id: 'general',
      label: 'Impostazioni Generali',
      desc: 'Tema chiaro/notte, mostra sempre ranghi su mappa',
    },
    {
      id: 'logging',
      label: 'Registrazione Azioni Utente',
      desc: 'Richiedi username/PIN per cambi data e orario',
    },
    {
      id: 'staff',
      label: 'Gestione Personale',
      desc: 'Aggiungi utenti, ruoli sala e codici PIN',
    },
    {
      id: 'hardware',
      label: 'Hardware & Stampanti Chit',
      desc: 'Stampante comande termica e suoni notifiche',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside
          className={`w-screen max-w-md sm:max-w-lg shadow-xl border-r flex flex-col justify-between transition-transform duration-200 ease-out ${
            isLight
              ? 'bg-white/95 text-slate-800 border-slate-200/80 backdrop-blur-xl'
              : 'bg-[#121622]/95 text-slate-100 border-[#222A3C] backdrop-blur-xl'
          }`}
        >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isLight ? 'border-slate-100' : 'border-[#222A3C]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-brand font-semibold text-sm shadow-2xs">
                SS
              </div>
              <div>
                <h3 className="font-brand font-semibold text-base leading-tight">
                  Menu Operativo Ristorante
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Front-of-House &amp; Gestione di Sala
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'hover:bg-slate-100 border-slate-200/70 text-slate-500'
                  : 'hover:bg-white/5 border-white/10 text-slate-400'
              }`}
              title="Chiudi Menu"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          {/* Body: Chapter List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 [scrollbar-width:thin]">
            <div className="space-y-1.5">
              <span className={`text-[10px] uppercase tracking-wider font-medium block px-2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Navigazione Moduli FOH
              </span>

              {chapters.map((ch) => {
                const Icon = ch.icon;
                const isActive = currentView === ch.id;

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      if (ch.isAction && ch.onClick) {
                        ch.onClick();
                      } else {
                        onNavigate(ch.id);
                        onClose();
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer group ${
                      isActive
                        ? isLight
                          ? 'bg-sky-50/80 border-sky-200/80 text-sky-900 shadow-2xs'
                          : 'bg-[#1C2538] border-sky-800/50 text-sky-200 shadow-2xs'
                        : isLight
                        ? 'bg-white hover:bg-slate-50/80 border-slate-200/60 text-slate-700'
                        : 'bg-[#161C2A] hover:bg-[#1E2536] border-[#222A3C] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition shrink-0 ${
                        isActive
                          ? isLight
                            ? 'bg-sky-500 text-white border-sky-400'
                            : 'bg-sky-500 text-white border-sky-400'
                          : isLight
                          ? 'bg-slate-50 border-slate-200/70 text-slate-500 group-hover:text-sky-600'
                          : 'bg-[#121622] border-[#222A3C] text-slate-400 group-hover:text-sky-300'
                      }`}>
                        <Icon className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
                            {ch.title}
                          </span>
                          {ch.badge && (
                            <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full border ${
                              isLight
                                ? 'bg-sky-100 text-sky-700 border-sky-200'
                                : 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                            }`}>
                              {ch.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] mt-0.5 line-clamp-1 ${
                          isActive
                            ? isLight ? 'text-sky-700' : 'text-sky-300'
                            : isLight ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {ch.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-3.5 h-3.5 stroke-[1.5] transition-transform group-hover:translate-x-0.5 ${
                      isActive ? 'text-sky-600' : isLight ? 'text-slate-300' : 'text-slate-600'
                    }`} />
                  </button>
                );
              })}
            </div>

            {/* Chapter 8: Settings Section */}
            <div className={`pt-3 border-t space-y-2 ${isLight ? 'border-slate-100' : 'border-[#222A3C]'}`}>
              <div className="flex items-center justify-between px-2">
                <span className={`text-[10px] uppercase tracking-wider font-medium ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Capitolo 8: Impostazioni (Settings)
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings('general');
                  }}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer"
                >
                  Apri Tutte
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {settingShortcuts.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      onClose();
                      onOpenSettings(sc.id as any);
                    }}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      isLight
                        ? 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/60 text-slate-700'
                        : 'bg-[#161C2A] hover:bg-[#1E2536] border-[#222A3C] text-slate-300'
                    }`}
                  >
                    <span className="text-[11px] font-medium block leading-tight">{sc.label}</span>
                    <span className={`text-[9px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {sc.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter 9: Help & Feedback */}
            <div className={`pt-3 border-t space-y-1.5 ${isLight ? 'border-slate-100' : 'border-[#222A3C]'}`}>
              <span className={`text-[10px] uppercase tracking-wider font-medium block px-2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Capitolo 9: Risorse &amp; Assistenza
              </span>

              <button
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/60 text-slate-700'
                    : 'bg-[#161C2A] hover:bg-[#1E2536] border-[#222A3C] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    isLight ? 'bg-white border-slate-200/70 text-slate-500' : 'bg-[#121622] border-[#222A3C] text-slate-400'
                  }`}>
                    <HelpCircle className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-medium block leading-tight">Guida &amp; Invia Feedback</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      Manuale di sala, best practice e assistenza
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
            </div>
          </div>

          {/* Footer: User & Sign Out */}
          <div className={`p-4 border-t flex items-center justify-between gap-3 ${
            isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#222A3C] bg-[#10141F]'
          }`}>
            <div className="flex items-center gap-2.5 truncate">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-xs border ${
                isLight ? 'bg-white border-slate-200/70 text-slate-700' : 'bg-[#161C2A] border-[#242E42] text-slate-300'
              }`}>
                {user?.email?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="truncate">
                <span className={`text-xs font-medium block truncate ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {user?.email || 'operatore@sottosotto.it'}
                </span>
                <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sessione Attiva FOH
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Disconnetti dalla sessione"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Esci (Sign Out)</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

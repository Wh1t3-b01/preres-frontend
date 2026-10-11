import React, { useState } from 'react';
import {
  Settings,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Printer,
  Bell,
  Users,
  FileText,
  Check,
  RotateCcw,
  Volume2,
  Lock,
} from 'lucide-react';
import { restaurantSettingsService, RestaurantSettings } from '../../services/restaurantSettingsService';
import { staffService } from '../../services/staffService';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffMember } from '../../types';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'logging' | 'staff' | 'hardware';
  theme: 'light' | 'dark';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'general',
  theme,
}) => {
  const { toggleTheme, addToast } = useRestaurant();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'general' | 'logging' | 'staff' | 'hardware'>(initialTab);

  const [settings, setSettings] = useState<RestaurantSettings>(() => restaurantSettingsService.getSettings());
  const [actionLogs, setActionLogs] = useState(() => restaurantSettingsService.getActionLogs());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => staffService.getStaffMembers());

  // New staff user form
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'manager' | 'host' | 'waiter'>('waiter');
  const [newUserPin, setNewUserPin] = useState('1234');

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<RestaurantSettings>) => {
    const updated = restaurantSettingsService.updateSettings(partial);
    setSettings(updated);
    addToast({
      type: 'success',
      title: 'Impostazione Aggiornata',
      message: 'Le modifiche sono state salvate nelle preferenze di sistema.',
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFirstName || !newUserLastName || !newUserEmail) return;

    staffService.addStaffMember({
      firstName: newUserFirstName,
      lastName: newUserLastName,
      fullName: `${newUserFirstName} ${newUserLastName}`,
      email: newUserEmail,
      role: newUserRole,
      pinCode: newUserPin,
    });

    setStaffList(staffService.getStaffMembers());
    setIsAddingUser(false);
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserEmail('');
    addToast({
      type: 'success',
      title: 'Nuovo Utente Creato',
      message: `${newUserFirstName} ${newUserLastName} aggiunto allo staff con ruolo ${newUserRole}.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-xl flex flex-col max-h-[88vh] overflow-hidden ${
          isLight
            ? 'bg-white text-slate-800 border-slate-200/80'
            : 'bg-[#121622] text-slate-100 border-[#222A3C]'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#222A3C] bg-[#141824]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#182030] border-[#252F43] text-slate-300'
            }`}>
              <Settings className="w-4.5 h-4.5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">
                  Impostazioni &amp; Opzioni (Settings)
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-300 border-white/10'
                }`}>
                  Capitolo 8
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Personalizza preferenze generali, tracciamento azioni, utenti e stampanti chit.
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
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`px-4 pt-2 border-b flex items-center gap-2 overflow-x-auto ${
          isLight ? 'border-slate-100 bg-slate-50/30' : 'border-[#222A3C] bg-[#121622]'
        }`}>
          {[
            { id: 'general' as const, label: '1. Generali', icon: Sun },
            { id: 'logging' as const, label: '2. Azioni Utente', icon: FileText },
            { id: 'staff' as const, label: '3. Gestione Staff', icon: Users },
            { id: 'hardware' as const, label: '4. Hardware & Notifiche', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 border-b-2 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 -mb-px whitespace-nowrap ${
                  isActive
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin]">
          
          {/* TAB 1: GENERAL APP SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Preferenze Interfaccia &amp; Visualizzazione
                </h4>
                <p className="text-xs text-slate-500">
                  Configura l'aspetto visivo e la modalità di visualizzazione della piantina.
                </p>
              </div>

              <div className="space-y-3">
                {/* Theme Mode Toggle */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <div>
                    <span className="text-xs font-medium block">Modalità Tema (Light / Dark)</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {isLight ? 'Attualmente in Tema Chiaro di Gestione' : 'Attualmente in Tema Notte / Servizio Serale'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-[#1E2536] hover:bg-[#252F43] border-slate-700 text-slate-200'
                    }`}
                  >
                    {isLight ? <Moon className="w-3.5 h-3.5 text-slate-500" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isLight ? 'Passa a Notte' : 'Passa a Chiaro'}</span>
                  </button>
                </div>

                {/* Always Display Server Sections on Floor Plan */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <div>
                    <span className="text-xs font-medium block">Mostra Sempre le Sezioni Camerieri su Pianta Sala</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Mantiene visibili i colori distintivi dei ranghi e dei camerieri sopra i tavoli senza doverli attivare manualmente.
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdate({ alwaysDisplayServerSectionsOnFloor: !settings.alwaysDisplayServerSectionsOnFloor })}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                      settings.alwaysDisplayServerSectionsOnFloor ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.alwaysDisplayServerSectionsOnFloor ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Default View Selection */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <div>
                    <span className="text-xs font-medium block">Schermata Predefinita all'Avvio</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Vista iniziale mostrata all'apertura dell'app.
                    </span>
                  </div>
                  <select
                    value={settings.defaultView}
                    onChange={(e) => handleUpdate({ defaultView: e.target.value as any })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-slate-700'
                    }`}
                  >
                    <option value="floor">Piantina Sala (Default Floor Plan)</option>
                    <option value="list">Vista Elenco (List View)</option>
                    <option value="timeline">Timeline Tavoli</option>
                    <option value="calendar">Calendario Mese</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER ACTION LOGGING */}
          {activeTab === 'logging' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Registrazione Azioni Utente (Audit Logging)
                </h4>
                <p className="text-xs text-slate-500">
                  Requisiti di tracciamento per modifiche a date, orari e storni per conformità di sala.
                </p>
              </div>

              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <div>
                    <span className="text-xs font-medium block">Richiedi Username/Operatore sui Cambi Data e Ora</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Quando una prenotazione viene spostata di orario o giorno, registra obbligatoriamente l'utente autore.
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdate({ requireUsernameOnDateChange: !settings.requireUsernameOnDateChange })}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                      settings.requireUsernameOnDateChange ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.requireUsernameOnDateChange ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <div>
                    <span className="text-xs font-medium block">Attiva Registro Audit Completo</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Salva tutte le operazioni di sala (assegnazioni tavoli, cancellazioni, sedute).
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdate({ actionAuditLogEnabled: !settings.actionAuditLogEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                      settings.actionAuditLogEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.actionAuditLogEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Audit Log Preview */}
                <div className="pt-2">
                  <span className="text-xs font-semibold block mb-2">Ultime Azioni Registrate dal Sistema</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {actionLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          isLight ? 'bg-white border-slate-200/70' : 'bg-[#141824] border-[#222A3C]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{log.action}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {log.details}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {log.user}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAFF MANAGEMENT */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Gestione Personale (Staff Management)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Aggiungi nuovi account utenti per host, camerieri e maître.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingUser((v) => !v)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium transition cursor-pointer"
                >
                  + Aggiungi Utente
                </button>
              </div>

              {/* Add user form */}
              {isAddingUser && (
                <form onSubmit={handleCreateUser} className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#161C2A] border-[#252F43]'
                }`}>
                  <span className="text-xs font-semibold block">Crea Nuovo Utente di Sistema</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={newUserFirstName}
                      onChange={(e) => setNewUserFirstName(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border text-xs"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Cognome"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="email"
                      placeholder="Email aziendale"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border text-xs col-span-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="PIN (4 cifre)"
                      value={newUserPin}
                      maxLength={4}
                      onChange={(e) => setNewUserPin(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border text-xs font-mono text-center"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-400">Ruolo:</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="px-2 py-1 rounded border text-xs"
                      >
                        <option value="waiter">Cameriere</option>
                        <option value="host">Host / Accoglienza</option>
                        <option value="manager">Manager / Maître</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingUser(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-700"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium"
                      >
                        Salva Utente
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Staff users list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {staffList.map((st) => (
                  <div
                    key={st.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isLight ? 'bg-white border-slate-200/70' : 'bg-[#141824] border-[#222A3C]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold text-xs flex items-center justify-center">
                        {st.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{st.fullName}</span>
                          <span className="text-[9px] uppercase px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {st.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{st.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        PIN: {st.pinCode || '••••'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HARDWARE & NOTIFICATIONS */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Hardware &amp; Stampanti Chit (Hardware &amp; Notifications)
                </h4>
                <p className="text-xs text-slate-500">
                  Regola impostazioni della stampante comande termica e suoni di notifica.
                </p>
              </div>

              <div className="space-y-3">
                {/* Chit Printer Toggle */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <div>
                    <span className="text-xs font-medium block">Stampante Chit Comande Attiva</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Stampa automatica scontrino comanda all'arrivo e accomodamento ospite.
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdate({ chitPrinterEnabled: !settings.chitPrinterEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                      settings.chitPrinterEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.chitPrinterEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Printer IP & Model */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <span className="text-xs font-semibold block">Configurazione Hardware Stampante</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Modello Stampante</label>
                      <input
                        type="text"
                        value={settings.chitPrinterModel}
                        onChange={(e) => handleUpdate({ chitPrinterModel: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Indirizzo IP Locale / Porta</label>
                      <input
                        type="text"
                        value={settings.chitPrinterIp}
                        onChange={(e) => handleUpdate({ chitPrinterIp: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Sound */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
                }`}>
                  <div>
                    <span className="text-xs font-medium block">Avvisi Acustici &amp; Notifiche Audio</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Suono discreto all'arrivo di nuove prenotazioni online o allarmi VIP.
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdate({ soundAlertsEnabled: !settings.soundAlertsEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                      settings.soundAlertsEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.soundAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'border-slate-100 bg-slate-50/60' : 'border-[#222A3C] bg-[#10141F]'
        }`}>
          <button
            onClick={() => {
              restaurantSettingsService.resetDefaults();
              setSettings(restaurantSettingsService.getSettings());
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ripristina Default</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium cursor-pointer"
          >
            Chiudi Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
};

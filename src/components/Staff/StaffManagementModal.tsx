import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import { orderSecurityService } from '../../services/orderSecurityService';
import { StaffMember, WaiterAuditLog } from '../../types';
import {
  Users,
  ShieldCheck,
  KeyRound,
  UserPlus,
  Lock,
  Unlock,
  AlertTriangle,
  X,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  History,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  ShieldAlert,
} from 'lucide-react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'waiters' | 'analytics' | 'audit_logs'>('waiters');
  const [staffList, setStaffList] = useState<StaffMember[]>(() => staffService.getStaffMembers());
  const [auditLogs, setAuditLogs] = useState<WaiterAuditLog[]>(() => orderSecurityService.getAuditLogs());

  // Create Waiter Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password State
  const [staffToReset, setStaffToReset] = useState<StaffMember | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const reloadData = () => {
    setStaffList(staffService.getStaffMembers());
    setAuditLogs(orderSecurityService.getAuditLogs());
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
    }
  }, [isOpen]);

  const handleToggleActive = async (staffId: string) => {
    await staffService.toggleStaffActive(staffId);
    reloadData();
  };

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) {
      setCreateError('Compila tutti i campi obbligatori.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setCreateError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    const res = await staffService.createWaiterAccount({
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      password: newPassword,
      pinCode: newPassword ? newPassword.slice(0, 4) : '1234',
    });

    if (res.success) {
      setIsCreating(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPassword('');
      reloadData();
    } else {
      setCreateError(res.error || 'Errore durante la creazione.');
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!staffToReset || !resetNewPassword || resetNewPassword.length < 6) {
      setResetError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    const res = await staffService.resetWaiterPassword(staffToReset.id, resetNewPassword);
    if (res.success) {
      setResetSuccess(true);
      setTimeout(() => {
        setStaffToReset(null);
        setResetSuccess(false);
        setResetNewPassword('');
        reloadData();
      }, 1500);
    } else {
      setResetError(res.error || 'Errore durante il reset.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-slate-900 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-brand font-bold text-slate-950">
                  Controllo Personale & Accessi Camerieri (RBAC)
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Manager Only
                </span>
              </div>
              <p className="text-xs text-slate-500">
                I camerieri non possono registrarsi o resettare la password autonomamente. Solo la direzione controlla credenziali, accessi e storni.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('waiters')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'waiters'
                ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold shadow-xs'
                : 'bg-white border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>Gestione Camerieri ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'analytics'
                ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold shadow-xs'
                : 'bg-white border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            <span>Performance & Analytics Sala</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'audit_logs'
                ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold shadow-xs'
                : 'bg-white border-transparent text-rose-600 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Log Storni Post-Send ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: WAITERS CREDENTIALS & IS_ACTIVE TOGGLE */}
        {activeTab === 'waiters' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                Elenco camerieri autorizzati all'order-taking e servizio di sala:
              </span>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Crea Nuovo Account Cameriere</span>
              </button>
            </div>

            {/* Waiter Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {staffList.map((waiter) => (
                <div
                  key={waiter.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    waiter.isActive
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-900 font-bold">
                          {waiter.fullName}
                        </strong>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            waiter.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {waiter.isActive ? 'ABILITATO AL SERVIZIO' : 'ACCESSO BLOCCATO'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono block mt-0.5">
                        {waiter.email}
                      </span>
                    </div>

                    {/* Enable / Disable Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(waiter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                        waiter.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                      }`}
                      title={waiter.isActive ? 'Clicca per disabilitare' : 'Clicca per abilitare'}
                    >
                      {waiter.isActive ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Attivo</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Disattivato</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <div className="font-mono text-[11px] text-slate-600">
                      Tavoli: <strong className="text-slate-900">{waiter.stats?.tablesServedCount || 0}</strong> · Incasso: <strong className="text-emerald-600">€{waiter.stats?.totalRevenueGenerated || 0}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStaffToReset(waiter);
                        setResetNewPassword('');
                        setResetError(null);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 text-sky-700 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-sky-600" />
                      <span>Modifica Password</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PERFORMANCE & ANALYTICS PER WAITER */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {staffList.map((waiter) => (
                <div
                  key={waiter.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{waiter.fullName}</h4>
                      <span className="text-[10px] text-slate-400">Ruolo: Cameriere di Sala</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      € {waiter.stats?.totalRevenueGenerated?.toLocaleString('it-IT') || 0}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tavoli Assegnati & Serviti:</span>
                      <strong className="text-slate-900 font-mono">{waiter.stats?.tablesServedCount || 0}</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Storni Comande Effettuati:</span>
                      <strong className="text-amber-600 font-mono">{waiter.stats?.voidCount || 0}</strong>
                    </div>

                    {waiter.stats?.topSellerItem && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                        <span className="text-[9px] text-emerald-700 uppercase font-bold tracking-wider block">
                          🔥 Piatto Più Venduto (Top Seller):
                        </span>
                        <span className="text-xs text-slate-900 font-medium block truncate">
                          {waiter.stats.topSellerItem}
                        </span>
                      </div>
                    )}

                    {waiter.stats?.lowSellerItem && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
                          ❄️ Piatto Meno Ordinato (Low Seller):
                        </span>
                        <span className="text-xs text-slate-500 block truncate">
                          {waiter.stats.lowSellerItem}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS FOR POST-SEND VOIDS */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                Registro di sicurezza Post-Send: ogni cancellazione di pietanza inviata a bar o cucina viene memorizzata con orario, totale pre/post cancellazione e contatore progressivo.
              </span>
            </div>

            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-bold text-sm">{log.waiterName}</strong>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        Storno #{log.waiterVoidCount} di questo operatore
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pietanza Stornata:</span>
                      <strong className="text-slate-900">{log.itemName}</strong> ({log.quantity}x - €{log.itemPrice})
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tavolo & Conto:</span>
                      <span>Tavolo {log.tableId} · Da <strong className="text-amber-600 font-mono">€{log.totalBefore}</strong> a <strong className="text-emerald-600 font-mono">€{log.totalAfter}</strong></span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Autorizzazione:</span>
                      <span className="text-sky-700 font-semibold">{log.managerApprovedBy || 'Manager'}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 italic pt-0.5">
                    Motivazione: "{log.reason}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: CREATE NEW WAITER */}
        {isCreating && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-sky-600" />
                  <span>Crea Credenziali Cameriere</span>
                </h4>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateWaiter} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Simone"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rinaldi"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Email di Accesso *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="simone.waiter@sottosotto.it"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Password Iniziale (o PIN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Almeno 6 caratteri..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Il cameriere userà questa password per il punch-in e l'accesso ai tablet.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3.5 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Genera Account Cameriere
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RESET WAITER PASSWORD */}
        {staffToReset && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-sky-600" />
                  <span>Modifica Password Cameriere</span>
                </h4>
                <button
                  onClick={() => setStaffToReset(null)}
                  className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Imposta una nuova password di accesso per <strong className="text-slate-900">{staffToReset.fullName}</strong> ({staffToReset.email}):
              </p>

              {resetSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1 text-emerald-700 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
                  <p className="font-bold">Password Reimpostata con Successo!</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmResetPassword} className="space-y-3 text-xs">
                  {resetError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px]">
                      {resetError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      Nuova Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Minimo 6 caratteri..."
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStaffToReset(null)}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Salva Nuova Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

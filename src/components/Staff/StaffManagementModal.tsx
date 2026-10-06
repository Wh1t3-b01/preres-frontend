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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-slate-100 animate-in fade-in">
      <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222A3C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#8B31E0]/20 border border-[#8B31E0]/40 text-[#C084FC] flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-brand font-bold text-white">
                  Controllo Personale & Accessi Camerieri (RBAC)
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
                  Manager Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                I camerieri non possono registrarsi o resettare la password autonomamente. Solo la direzione controlla credenziali, accessi e storni.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#222A3C] pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('waiters')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'waiters'
                ? 'bg-[#8B31E0] text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-[#171D2B]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gestione Camerieri ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-[#8B31E0] text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-[#171D2B]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Performance & Analytics Sala</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit_logs'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-400 hover:text-rose-300 hover:bg-[#171D2B]'
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
              <span className="text-xs text-slate-300 font-medium">
                Elenco camerieri autorizzati all'order-taking e servizio di sala:
              </span>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                      ? 'bg-[#171D2B] border-[#273248]'
                      : 'bg-[#10141F] border-rose-950/60 opacity-65'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-white font-bold">
                          {waiter.fullName}
                        </strong>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            waiter.isActive
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                              : 'bg-rose-950/40 text-rose-300 border-rose-600/40'
                          }`}
                        >
                          {waiter.isActive ? 'ABILITATO AL SERVIZIO' : 'ACCESSO BLOCCATO'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">
                        {waiter.email}
                      </span>
                    </div>

                    {/* Enable / Disable Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(waiter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                        waiter.isActive
                          ? 'bg-emerald-950/30 text-emerald-300 border-emerald-600/50 hover:bg-rose-950/30 hover:text-rose-300 hover:border-rose-600/50'
                          : 'bg-rose-950/30 text-rose-300 border-rose-600/50 hover:bg-emerald-950/30 hover:text-emerald-300 hover:border-emerald-600/50'
                      }`}
                      title={waiter.isActive ? 'Clicca per disabilitare' : 'Clicca per abilitare'}
                    >
                      {waiter.isActive ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Attivo</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Disattivato</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#222A3C] text-xs">
                    <div className="font-mono text-[11px] text-slate-400">
                      Tavoli: <strong className="text-white">{waiter.stats?.tablesServedCount || 0}</strong> · Incasso: <strong className="text-[#34D399]">€{waiter.stats?.totalRevenueGenerated || 0}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStaffToReset(waiter);
                        setResetNewPassword('');
                        setResetError(null);
                      }}
                      className="px-2.5 py-1 bg-[#10141F] hover:bg-[#1E2536] border border-[#242C3E] hover:border-[#8B31E0] text-[#C084FC] rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
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
                  className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#222A3C] pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{waiter.fullName}</h4>
                      <span className="text-[10px] text-slate-400">Ruolo: Cameriere di Sala</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#34D399]">
                      € {waiter.stats?.totalRevenueGenerated?.toLocaleString('it-IT') || 0}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Tavoli Assegnati & Serviti:</span>
                      <strong className="text-white font-mono">{waiter.stats?.tablesServedCount || 0}</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span>Storni Comande Effettuati:</span>
                      <strong className="text-amber-400 font-mono">{waiter.stats?.voidCount || 0}</strong>
                    </div>

                    {waiter.stats?.topSellerItem && (
                      <div className="bg-[#10141F] p-2 rounded-xl border border-[#242C3E] space-y-0.5">
                        <span className="text-[9px] text-[#34D399] uppercase font-bold tracking-wider block">
                          🔥 Piatto Più Venduto (Top Seller):
                        </span>
                        <span className="text-xs text-white font-medium block truncate">
                          {waiter.stats.topSellerItem}
                        </span>
                      </div>
                    )}

                    {waiter.stats?.lowSellerItem && (
                      <div className="bg-[#10141F] p-2 rounded-xl border border-[#242C3E] space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
                          ❄️ Piatto Meno Ordinato (Low Seller):
                        </span>
                        <span className="text-xs text-slate-400 block truncate">
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
            <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                Registro di sicurezza Post-Send: ogni cancellazione di pietanza inviata a bar o cucina viene memorizzata con orario, totale pre/post cancellazione e contatore progressivo.
              </span>
            </div>

            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#171D2B] border border-[#273248] rounded-2xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-white font-bold text-sm">{log.waiterName}</strong>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/50 text-rose-300 border border-rose-800/50 font-bold">
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

                  <div className="bg-[#10141F] p-2.5 rounded-xl border border-[#242C3E] grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Pietanza Stornata:</span>
                      <strong className="text-white">{log.itemName}</strong> ({log.quantity}x - €{log.itemPrice})
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Tavolo & Conto:</span>
                      <span>Tavolo {log.tableId} · Da <strong className="text-amber-400 font-mono">€{log.totalBefore}</strong> a <strong className="text-[#34D399] font-mono">€{log.totalAfter}</strong></span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Autorizzazione:</span>
                      <span className="text-[#C084FC]">{log.managerApprovedBy || 'Manager'}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 italic pt-0.5">
                    Motivazione: "{log.reason}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: CREATE NEW WAITER */}
        {isCreating && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#222A3C]">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#C084FC]" />
                  <span>Crea Credenziali Cameriere</span>
                </h4>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="p-2.5 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateWaiter} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Simone"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rinaldi"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                    Email di Accesso *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="simone.waiter@sottosotto.it"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                    Password Iniziale (o PIN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Almeno 6 caratteri..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#8B31E0]"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Il cameriere userà questa password per il punch-in e l'accesso ai tablet.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222A3C]">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3.5 py-1.5 text-slate-400 hover:text-white"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-bold rounded-xl shadow-xs cursor-pointer"
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
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#222A3C]">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#C084FC]" />
                  <span>Modifica Password Cameriere</span>
                </h4>
                <button
                  onClick={() => setStaffToReset(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Imposta una nuova password di accesso per <strong className="text-white">{staffToReset.fullName}</strong> ({staffToReset.email}):
              </p>

              {resetSuccess ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-xl text-center space-y-1 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                  <p className="font-bold">Password Reimpostata con Successo!</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmResetPassword} className="space-y-3 text-xs">
                  {resetError && (
                    <div className="p-2 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-[11px]">
                      {resetError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                      Nuova Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Minimo 6 caratteri..."
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#8B31E0]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222A3C]">
                    <button
                      type="button"
                      onClick={() => setStaffToReset(null)}
                      className="px-3 py-1.5 text-slate-400 hover:text-white"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-bold rounded-xl shadow-xs cursor-pointer"
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

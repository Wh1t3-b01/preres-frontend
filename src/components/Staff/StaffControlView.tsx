import React, { useState } from 'react';
import { staffService } from '../../services/staffService';
import { staffAttendanceService, AttendanceRecord } from '../../services/staffAttendanceService';
import { orderSecurityService } from '../../services/orderSecurityService';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffMember, WaiterAuditLog, Reservation } from '../../types';
import {
  Users,
  ShieldCheck,
  KeyRound,
  UserPlus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  History,
  Trash2,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  X,
  FileText,
  Search,
  ChevronRight,
  ShieldAlert,
  Receipt,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SelectedReservationInspection {
  tableNumber: string;
  guestName: string;
  partySize: number;
  timeSlot: string;
  totalBill: number;
  items: { name: string; price: number; quantity: number; sentTime: string }[];
  voidLogs: WaiterAuditLog[];
}

export const StaffControlView: React.FC = () => {
  const { reservations, selectedDate } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'attendance' | 'accounts' | 'tables_served' | 'audit_logs'>('attendance');

  const [staffList, setStaffList] = useState<StaffMember[]>(() => staffService.getStaffMembers());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    staffAttendanceService.getAttendanceRecords()
  );
  const [auditLogs, setAuditLogs] = useState<WaiterAuditLog[]>(() => orderSecurityService.getAuditLogs());

  // Waiter Creation Form Modal
  const [isCreatingWaiter, setIsCreatingWaiter] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Password Reset Modal
  const [staffToReset, setStaffToReset] = useState<StaffMember | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Reservation Inspection Drawer
  const [inspectingReservation, setInspectingReservation] = useState<SelectedReservationInspection | null>(null);

  const reloadData = () => {
    setStaffList(staffService.getStaffMembers());
    setAttendanceRecords(staffAttendanceService.getAttendanceRecords());
    setAuditLogs(orderSecurityService.getAuditLogs());
  };

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
      setIsCreatingWaiter(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPassword('');
      reloadData();
    } else {
      setCreateError(res.error || 'Errore durante la creazione.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!staffToReset || !newPasswordVal || newPasswordVal.length < 6) {
      setResetError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    const res = await staffService.resetWaiterPassword(staffToReset.id, newPasswordVal);
    if (res.success) {
      setResetSuccess(true);
      setTimeout(() => {
        setStaffToReset(null);
        setResetSuccess(false);
        setNewPasswordVal('');
        reloadData();
      }, 1500);
    } else {
      setResetError(res.error || 'Errore durante il reset.');
    }
  };

  // Inspect a reservation
  const handleInspectReservation = (tableNumber: string, guestName: string, partySize: number, timeSlot: string) => {
    const tableAuditLogs = auditLogs.filter((l) => l.tableId === tableNumber);

    // Mock items list based on table
    const items =
      tableNumber === 'G'
        ? [
            { name: 'Barolo DOCG Cru Pio Cesare 2018', price: 85, quantity: 1, sentTime: '12:35' },
            { name: 'Filetto di Manzo al Barolo (Media al Sangue)', price: 34, quantity: 1, sentTime: '12:45' },
            { name: 'Costata di Fassona Piemontese (Al Sangue)', price: 38, quantity: 1, sentTime: '12:45' },
            { name: 'Patate al Forno con Rosmarino', price: 7, quantity: 2, sentTime: '12:48' },
            { name: 'Caponata Siciliana Tradizionale', price: 8, quantity: 1, sentTime: '12:48' },
          ]
        : [
            { name: 'Tagliatelle al Ragù Bianco', price: 18, quantity: 2, sentTime: '13:05' },
            { name: 'Risotto allo Zafferano', price: 22, quantity: 1, sentTime: '13:05' },
            { name: 'Franciacorta Satèn Bellavista', price: 60, quantity: 1, sentTime: '13:00' },
          ];

    const totalBill = items.reduce((s, i) => s + i.price * i.quantity, 0);

    setInspectingReservation({
      tableNumber,
      guestName,
      partySize,
      timeSlot,
      totalBill,
      items,
      voidLogs: tableAuditLogs,
    });
  };

  return (
    <div className="space-y-6 max-w-[1780px] mx-auto text-slate-100 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER: STAFF CONTROL & RBAC */}
      <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#8B31E0]/20 border border-[#8B31E0]/40 text-[#C084FC] flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-brand font-bold text-white tracking-tight">
                Controllo Personale, Presenze & Ispezione Conti
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 px-2.5 py-0.5 rounded-full font-mono">
                Pannello Direzione (RBAC)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestione orari punch-in, credenziali di sala, performance tavoli serviti e audit trail degli storni.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingWaiter(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#8B31E0] to-[#6E20C0] hover:from-[#9D44F7] hover:to-[#8B31E0] text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#8B31E0]/25 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crea Credenziali Cameriere</span>
        </button>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="bg-[#121622] border border-[#273248] rounded-2xl p-2 sm:px-4 flex items-center gap-2 overflow-x-auto shadow-md">
        {[
          { id: 'attendance' as const, label: 'Timbrature & Punch-In Attivi', icon: Clock },
          { id: 'tables_served' as const, label: 'Tavoli Serviti & Ispezione Conti', icon: Receipt },
          { id: 'accounts' as const, label: 'Gestione Account & Password', icon: Users },
          { id: 'audit_logs' as const, label: 'Registro Storni Forense (Audit)', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#8B31E0] text-white shadow-md'
                  : 'bg-[#171D2B] text-slate-400 hover:text-white border border-[#242C3E]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3A. TAB 1: PUNCH-IN & ATTENDANCE DASHBOARD */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Operatori Attivi in Sala Oggi:
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {attendanceRecords.filter((r) => r.status === 'active').length}
              </div>
              <span className="text-[11px] text-slate-500">Simone Rinaldi (Main A), Marco Gentili (Main B)</span>
            </div>

            <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Ore Complessive Lavorate:
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                14.5 ore
              </div>
              <span className="text-[11px] text-slate-500">Turno Pranzo & Allestimento Sala</span>
            </div>

            <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Storni Registrati nel Turno:
              </span>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {auditLogs.length}
              </div>
              <span className="text-[11px] text-slate-500">Tutti tracciati con firma autorizzativa</span>
            </div>
          </div>

          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white">Registro Presenze & Orari Timbratura</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171D2B] text-slate-400 uppercase text-[10px] border-b border-[#242C3E]">
                  <tr>
                    <th className="py-2.5 px-3">Operatore</th>
                    <th className="py-2.5 px-3">Ruolo & Sezione</th>
                    <th className="py-2.5 px-3">Orario Punch-In</th>
                    <th className="py-2.5 px-3">Orario Punch-Out</th>
                    <th className="py-2.5 px-3">Stato Servizio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222A3C]">
                  {attendanceRecords.map((att) => (
                    <tr key={att.id} className="hover:bg-[#171D2B]/40 transition">
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#8B31E0]/20 text-[#C084FC] flex items-center justify-center font-bold text-xs">
                          {att.staffName.charAt(0)}
                        </span>
                        <span>{att.staffName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className="capitalize">{att.role}</span> · Sezione <strong className="text-[#C084FC] uppercase">{att.sectionAssigned.replace('_', ' ')}</strong>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        {new Date(att.punchInAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {att.punchOutAt ? new Date(att.punchOutAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '— (In Servizio)'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {att.status === 'active' ? '🟢 Presente al Locale' : 'Turno Chiuso'}
                          </span>
                          {att.status === 'active' && (
                            <button
                              onClick={async () => {
                                await staffAttendanceService.punchOut(att.staffId);
                                reloadData();
                              }}
                              className="text-[10px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                            >
                              Timbra Uscita
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3B. TAB 2: TAVOLI SERVITI & ISPEZIONE DETTAGLIATA CONTI */}
      {activeTab === 'tables_served' && (
        <div className="space-y-4">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">
                Tavoli Serviti per Operatore & Ispezione Comande
              </h3>
              <p className="text-xs text-slate-400">
                Clicca su una qualsiasi prenotazione per aprire la scheda di ispezione del conto e il log forense degli storni.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Simone Rinaldi Section */}
              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#222A3C] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#8B31E0]/20 text-[#C084FC] flex items-center justify-center font-bold">
                      S
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">Simone Rinaldi</h4>
                      <span className="text-[10px] text-slate-400">Sezione: Main A (Tavoli 20, 21, 22, 23, G)</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#34D399]">
                    Incassi: € 14.850
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Tavoli & Prenotazioni Assegnate:
                  </span>
                  {[
                    { table: 'G', name: 'Avv. Giorgio Colombo', pax: 2, slot: '12:30 - 15:00', bill: 185 },
                    { table: '20', name: 'Dott.ssa Elena Moretti', pax: 4, slot: '13:00 - 15:30', bill: 110 },
                    { table: '21', name: 'Famiglia De Luca', pax: 4, slot: '12:45 - 15:15', bill: 230 },
                  ].map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInspectReservation(res.table, res.name, res.pax, res.slot)}
                      className="w-full bg-[#10141F] hover:bg-[#1C2436] border border-[#242C3E] hover:border-[#8B31E0] rounded-xl p-3 flex items-center justify-between text-left transition cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-xs text-white group-hover:text-[#C084FC] flex items-center gap-1.5">
                          <span>Tavolo {res.table}</span>
                          <span>•</span>
                          <span>{res.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {res.pax} coperti · Fascia: {res.slot}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#34D399]">
                          € {res.bill}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Marco Gentili Section */}
              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#222A3C] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-950/40 text-blue-300 flex items-center justify-center font-bold">
                      M
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">Marco Gentili</h4>
                      <span className="text-[10px] text-slate-400">Sezione: Main B (Tavoli 10, 11, 12, 14, 15, 16)</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#34D399]">
                    Incassi: € 11.420
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Tavoli & Prenotazioni Assegnate:
                  </span>
                  {[
                    { table: '16', name: 'Roberto Vannini', pax: 4, slot: '13:00 - 15:30', bill: 140 },
                    { table: '14', name: 'Pranzo Business Ferrari', pax: 4, slot: '12:30 - 14:30', bill: 210 },
                  ].map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInspectReservation(res.table, res.name, res.pax, res.slot)}
                      className="w-full bg-[#10141F] hover:bg-[#1C2436] border border-[#242C3E] hover:border-[#8B31E0] rounded-xl p-3 flex items-center justify-between text-left transition cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-xs text-white group-hover:text-[#C084FC] flex items-center gap-1.5">
                          <span>Tavolo {res.table}</span>
                          <span>•</span>
                          <span>{res.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {res.pax} coperti · Fascia: {res.slot}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#34D399]">
                          € {res.bill}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3C. TAB 3: GESTIONE ACCOUNT & PASSWORD (RBAC) */}
      {activeTab === 'accounts' && (
        <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Account Personale di Sala</h3>
              <p className="text-xs text-slate-400">I camerieri non possono registrarsi da soli né reimpostare la password in autonomia.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffList.map((member) => (
              <div
                key={member.id}
                className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#222A3C]">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-[#8B31E0]/20 text-[#C084FC] flex items-center justify-center font-bold">
                        {member.firstName.charAt(0)}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-white">{member.fullName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{member.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(member.id)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition ${
                        member.isActive
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {member.isActive ? 'Abilitato' : 'Disabilitato'}
                    </button>
                  </div>

                  <div className="text-xs space-y-1.5 pt-2 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ruolo di Sistema:</span>
                      <strong className="text-white capitalize">{member.role}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tavoli Serviti:</span>
                      <span className="font-mono">{member.stats?.tablesServedCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Incassi Generati:</span>
                      <span className="font-mono text-[#34D399] font-bold">
                        € {member.stats?.totalRevenueGenerated?.toLocaleString('it-IT') || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222A3C]">
                  <button
                    onClick={() => {
                      setStaffToReset(member);
                      setNewPasswordVal('');
                      setResetSuccess(false);
                      setResetError(null);
                    }}
                    className="w-full py-1.5 px-3 bg-[#10141F] hover:bg-[#20273A] text-slate-300 hover:text-white border border-[#242C3E] rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reimposta Password</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D. TAB 4: AUDIT LOGS FORENSE (STORNI POST-SEND) */}
      {activeTab === 'audit_logs' && (
        <div className="bg-[#121622] border border-[#273248] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 p-3 bg-rose-950/20 border border-rose-800/40 rounded-2xl text-xs text-rose-300">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              Registro di conformità Post-Send: ogni cancellazione di pietanza inviata a bar o cucina viene registrata con orario, conto pre/post e firma dell'autorizzatore.
            </span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-bold text-sm">{log.waiterName}</strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800 font-bold">
                      Storno #{log.waiterVoidCount} di questo operatore
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleString('it-IT')}
                  </span>
                </div>

                <div className="bg-[#10141F] p-3 rounded-xl border border-[#242C3E] grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pietanza Eliminata:</span>
                    <strong className="text-white">{log.itemName}</strong> ({log.quantity}x - €{log.itemPrice})
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tavolo & Impatto Conto:</span>
                    <span>Tavolo {log.tableId} · Da <strong className="text-amber-400 font-mono">€{log.totalBefore}</strong> a <strong className="text-[#34D399] font-mono">€{log.totalAfter}</strong></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Autorizzato da:</span>
                    <span className="text-[#C084FC]">{log.managerApprovedBy || 'Manager'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 italic pt-0.5">
                  Motivazione registrata: "{log.reason}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODAL: ISPEZIONE DETTAGLIATA PRENOTAZIONE E CONTO */}
      {inspectingReservation && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3C] shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 flex items-center justify-center font-brand font-bold text-lg">
                  {inspectingReservation.tableNumber}
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Ispezione Tavolo {inspectingReservation.tableNumber} · {inspectingReservation.guestName}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {inspectingReservation.partySize} persone · Fascia: {inspectingReservation.timeSlot}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectingReservation(null)}
                className="w-9 h-9 rounded-xl bg-[#171D2B] text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* 1. TOP: GENERAL BILL & ORDER ITEMS SUMMARY */}
              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#242C3E] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                      1. Informazioni Generiche & Riepilogo Conto
                    </span>
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {inspectingReservation.items.length} Portate Ordinate
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">
                      Media: € {(inspectingReservation.totalBill / Math.max(1, inspectingReservation.partySize)).toFixed(2)}/pax
                    </span>
                    <span className="text-xl font-mono font-black text-[#34D399]">
                      Totale: € {inspectingReservation.totalBill}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 divide-y divide-[#242C3E]">
                  {inspectingReservation.items.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-[#8B31E0]/20 text-[#C084FC] flex items-center justify-center font-bold text-[10px]">
                            {item.quantity}x
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono pl-6">
                          Trasmesso in cucina alle ore {item.sentTime}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200">€ {item.price * item.quantity}</span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-slate-400 block font-mono">€{item.price} cad.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. BOTTOM: INFORMAZIONI RISERVATE AL GESTORE (STORNI, ANOMALIE, AUDIT) */}
              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#242C3E] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-[10px]">
                      2. Informazioni Riservate al Gestore (Audit Storni & Eliminazioni)
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 px-2 py-0.5 rounded-full">
                    Controllo Direzione
                  </span>
                </div>

                {inspectingReservation.voidLogs.length === 0 ? (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Nessun articolo stornato o eliminato post-send su questo tavolo. Comanda regolare al 100%.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectingReservation.voidLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-[#10141F] rounded-xl border border-rose-900/50 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-rose-300">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Piatto Eliminato Post-Send: {log.itemName} (-€{log.itemPrice})</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString('it-IT')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 bg-black/30 p-2 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Cameriere Richiedente:</span>
                            <strong className="text-white">{log.waiterName}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Autorizzato con PIN da:</span>
                            <strong className="text-[#C084FC]">{log.managerApprovedBy || 'Direzione / Maître'}</strong>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] text-slate-500 block">Motivazione Certificata:</span>
                            <span className="text-amber-200 italic">"{log.reason}"</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                          <span>Variazione Conto: Da <strong className="text-amber-400 font-mono">€{log.totalBefore}</strong> a <strong className="text-[#34D399] font-mono">€{log.totalAfter}</strong></span>
                          <span className="text-rose-400 font-mono font-semibold">Storno Tracciato</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#222A3C] flex justify-end shrink-0">
              <button
                onClick={() => setInspectingReservation(null)}
                className="px-5 py-2 bg-[#171D2B] hover:bg-[#222A3C] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Chiudi Ispezione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CREATE NEW WAITER */}
      {isCreatingWaiter && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#222A3C]">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#C084FC]" />
                <span>Crea Credenziali Cameriere</span>
              </h4>
              <button
                onClick={() => setIsCreatingWaiter(false)}
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
                  Email Aziendale *
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
                  Password Provvisoria *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Password (min 6 caratteri)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingWaiter(false)}
                  className="px-4 py-2 bg-[#171D2B] text-slate-300 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-bold rounded-xl"
                >
                  Salva Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: RESET PASSWORD */}
      {staffToReset && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#222A3C]">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Reimposta Password</span>
              </h4>
              <button
                onClick={() => setStaffToReset(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Imposta una nuova password per <strong className="text-white">{staffToReset.fullName}</strong>.
            </p>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Password aggiornata con successo!</span>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                {resetError && (
                  <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl">
                    {resetError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                    Nuova Password (min 6 caratteri)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Nuova password sicura..."
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffToReset(null)}
                    className="px-4 py-2 bg-[#171D2B] text-slate-300 rounded-xl"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl"
                  >
                    Conferma Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

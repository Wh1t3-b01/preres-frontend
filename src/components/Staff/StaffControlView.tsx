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
  const { reservations, selectedDate, theme } = useRestaurant();
  const isLight = theme === 'light';
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
    <div className={`space-y-6 max-w-[1780px] mx-auto animate-in fade-in duration-200 transition-colors ${
      isLight ? 'text-slate-900' : 'text-slate-100'
    }`}>
      
      {/* 1. TOP HEADER: STAFF CONTROL & RBAC */}
      <div className={`border rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248] shadow-xl'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs border ${
            isLight ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-[#8B31E0]/20 border-[#8B31E0]/40 text-[#C084FC]'
          }`}>
            <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-brand font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Controllo Personale, Presenze & Ispezione Conti
              </h2>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-mono border ${
                isLight ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
              }`}>
                Pannello Direzione (RBAC)
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Gestione orari punch-in, credenziali di sala, performance tavoli serviti e audit trail degli storni.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingWaiter(true)}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs shadow-xs transition cursor-pointer flex items-center gap-2 shrink-0 ${
            isLight
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-200'
              : 'bg-gradient-to-r from-[#8B31E0] to-[#6E20C0] hover:from-[#9D44F7] hover:to-[#8B31E0] text-white shadow-lg shadow-[#8B31E0]/25'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Crea Credenziali Cameriere</span>
        </button>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className={`border rounded-2xl p-2 sm:px-3 flex items-center gap-2 overflow-x-auto shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248] shadow-md'
      }`}>
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
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isActive
                  ? isLight
                    ? 'bg-sky-50 text-sky-800 border border-sky-300 font-bold shadow-2xs'
                    : 'bg-[#8B31E0] text-white shadow-md'
                  : isLight
                  ? 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
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
            <div className={`border rounded-3xl p-5 space-y-1 ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121622] border-[#273248]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Operatori Attivi in Sala Oggi:
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {attendanceRecords.filter((r) => r.status === 'active').length}
              </div>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Simone Rinaldi (Main A), Marco Gentili (Main B)</span>
            </div>

            <div className={`border rounded-3xl p-5 space-y-1 ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121622] border-[#273248]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ore Complessive Lavorate:
              </span>
              <div className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                14.5 ore
              </div>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Turno Pranzo & Allestimento Sala</span>
            </div>

            <div className={`border rounded-3xl p-5 space-y-1 ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121622] border-[#273248]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Storni Registrati nel Turno:
              </span>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {auditLogs.length}
              </div>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tutti tracciati con firma autorizzativa</span>
            </div>
          </div>

          <div className={`border rounded-3xl p-5 shadow-xs space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248] shadow-xl'
          }`}>
            <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Registro Presenze & Orari Timbratura</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase text-[10px] border-b ${
                  isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#171D2B] text-slate-400 border-[#242C3E]'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Operatore</th>
                    <th className="py-2.5 px-3">Ruolo & Sezione</th>
                    <th className="py-2.5 px-3">Orario Punch-In</th>
                    <th className="py-2.5 px-3">Orario Punch-Out</th>
                    <th className="py-2.5 px-3">Stato Servizio</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-[#222A3C]'}`}>
                  {attendanceRecords.map((att) => (
                    <tr key={att.id} className={`transition ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-[#171D2B]/40'
                    }`}>
                      <td className={`py-3 px-3 font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/30'
                        }`}>
                          {att.staffName.charAt(0)}
                        </span>
                        <span>{att.staffName}</span>
                      </td>
                      <td className={`py-3 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        <span className="capitalize">{att.role}</span> · Sezione <strong className={`uppercase ${isLight ? 'text-sky-700' : 'text-[#C084FC]'}`}>{att.sectionAssigned.replace('_', ' ')}</strong>
                      </td>
                      <td className={`py-3 px-3 font-mono ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                        {new Date(att.punchInAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className={`py-3 px-3 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {att.punchOutAt ? new Date(att.punchOutAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '— (In Servizio)'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === 'active'
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : isLight
                              ? 'bg-slate-100 text-slate-500 border border-slate-200'
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
                              className={`text-[10px] px-2.5 py-0.5 rounded-lg transition cursor-pointer border ${
                                isLight
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50'
                              }`}
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
          <div className={`border rounded-3xl p-5 shadow-xs space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248] shadow-xl'
          }`}>
            <div>
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Tavoli Serviti per Operatore & Ispezione Comande
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Clicca su una qualsiasi prenotazione per aprire la scheda di ispezione del conto e il log forense degli storni.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Simone Rinaldi Section */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${
                  isLight ? 'border-slate-200' : 'border-[#222A3C]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${
                      isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/30'
                    }`}>
                      S
                    </span>
                    <div>
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Simone Rinaldi</h4>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sezione: Main A (Tavoli 20, 21, 22, 23, G)</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
                    Incassi: € 14.850
                  </span>
                </div>

                <div className="space-y-2">
                  <span className={`text-[10px] uppercase font-bold block tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                      className={`w-full border rounded-xl p-3 flex items-center justify-between text-left transition cursor-pointer group ${
                        isLight
                          ? 'bg-white hover:bg-sky-50/50 border-slate-200 hover:border-sky-300 shadow-2xs'
                          : 'bg-[#10141F] hover:bg-[#1C2436] border-[#242C3E] hover:border-[#8B31E0]'
                      }`}
                    >
                      <div>
                        <div className={`font-bold text-xs flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900 group-hover:text-sky-700' : 'text-white group-hover:text-[#C084FC]'
                        }`}>
                          <span>Tavolo {res.table}</span>
                          <span>•</span>
                          <span>{res.name}</span>
                        </div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {res.pax} coperti · Fascia: {res.slot}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
                          € {res.bill}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition ${isLight ? 'text-slate-400 group-hover:text-slate-800' : 'text-slate-500 group-hover:text-white'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Marco Gentili Section */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${
                  isLight ? 'border-slate-200' : 'border-[#222A3C]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${
                      isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                    }`}>
                      M
                    </span>
                    <div>
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Marco Gentili</h4>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sezione: Main B (Tavoli 10, 11, 12, 14, 15, 16)</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
                    Incassi: € 11.420
                  </span>
                </div>

                <div className="space-y-2">
                  <span className={`text-[10px] uppercase font-bold block tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tavoli & Prenotazioni Assegnate:
                  </span>
                  {[
                    { table: '16', name: 'Roberto Vannini', pax: 4, slot: '13:00 - 15:30', bill: 140 },
                    { table: '14', name: 'Pranzo Business Ferrari', pax: 4, slot: '12:30 - 14:30', bill: 210 },
                  ].map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInspectReservation(res.table, res.name, res.pax, res.slot)}
                      className={`w-full border rounded-xl p-3 flex items-center justify-between text-left transition cursor-pointer group ${
                        isLight
                          ? 'bg-white hover:bg-sky-50/50 border-slate-200 hover:border-sky-300 shadow-2xs'
                          : 'bg-[#10141F] hover:bg-[#1C2436] border-[#242C3E] hover:border-[#8B31E0]'
                      }`}
                    >
                      <div>
                        <div className={`font-bold text-xs flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900 group-hover:text-sky-700' : 'text-white group-hover:text-[#C084FC]'
                        }`}>
                          <span>Tavolo {res.table}</span>
                          <span>•</span>
                          <span>{res.name}</span>
                        </div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {res.pax} coperti · Fascia: {res.slot}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
                          € {res.bill}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition ${isLight ? 'text-slate-400 group-hover:text-slate-800' : 'text-slate-500 group-hover:text-white'}`} />
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
        <div className={`border rounded-3xl p-5 shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248] shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Account Personale di Sala</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>I camerieri non possono registrarsi da soli né reimpostare la password in autonomia.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffList.map((member) => (
              <div
                key={member.id}
                className={`border rounded-2xl p-4 space-y-3 flex flex-col justify-between ${
                  isLight ? 'bg-slate-50/70 border-slate-200 shadow-2xs' : 'bg-[#171D2B] border-[#273248]'
                }`}
              >
                <div>
                  <div className={`flex items-center justify-between pb-2 border-b ${
                    isLight ? 'border-slate-200' : 'border-[#222A3C]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${
                        isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/30'
                      }`}>
                        {member.firstName.charAt(0)}
                      </span>
                      <div>
                        <h4 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{member.fullName}</h4>
                        <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{member.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(member.id)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition border ${
                        member.isActive
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : isLight
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {member.isActive ? 'Abilitato' : 'Disabilitato'}
                    </button>
                  </div>

                  <div className={`text-xs space-y-1.5 pt-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Ruolo di Sistema:</span>
                      <strong className={`capitalize ${isLight ? 'text-slate-900' : 'text-white'}`}>{member.role}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Tavoli Serviti:</span>
                      <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{member.stats?.tablesServedCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Incassi Generati:</span>
                      <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
                        € {member.stats?.totalRevenueGenerated?.toLocaleString('it-IT') || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#222A3C]'}`}>
                  <button
                    onClick={() => {
                      setStaffToReset(member);
                      setNewPasswordVal('');
                      setResetSuccess(false);
                      setResetError(null);
                    }}
                    className={`w-full py-1.5 px-3 border rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
                        : 'bg-[#10141F] hover:bg-[#20273A] text-slate-300 hover:text-white border-[#242C3E]'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
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
        <div className={`border rounded-3xl p-5 shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#273248] shadow-xl'
        }`}>
          <div className={`flex items-center gap-2 p-3 border rounded-2xl text-xs ${
            isLight
              ? 'bg-rose-50/80 border-rose-200 text-rose-800'
              : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
          }`}>
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            <span>
              Registro di conformità Post-Send: ogni cancellazione di pietanza inviata a bar o cucina viene registrata con orario, conto pre/post e firma dell'autorizzatore.
            </span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className={`border rounded-2xl p-4 space-y-2 text-xs ${
                  isLight ? 'bg-slate-50/70 border-slate-200 shadow-2xs' : 'bg-[#171D2B] border-[#273248]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{log.waiterName}</strong>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isLight
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-rose-950/60 text-rose-300 border-rose-800'
                    }`}>
                      Storno #{log.waiterVoidCount} di questo operatore
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(log.createdAt).toLocaleString('it-IT')}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-2 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-[#10141F] border-[#242C3E] text-slate-300'
                }`}>
                  <div>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Pietanza Eliminata:</span>
                    <strong className={isLight ? 'text-slate-900' : 'text-white'}>{log.itemName}</strong> ({log.quantity}x - €{log.itemPrice})
                  </div>
                  <div>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Tavolo & Impatto Conto:</span>
                    <span>Tavolo {log.tableId} · Da <strong className="text-amber-600 dark:text-amber-400 font-mono">€{log.totalBefore}</strong> a <strong className="text-emerald-600 dark:text-[#34D399] font-mono">€{log.totalAfter}</strong></span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Autorizzato da:</span>
                    <span className={`font-semibold ${isLight ? 'text-sky-700' : 'text-[#C084FC]'}`}>{log.managerApprovedBy || 'Manager'}</span>
                  </div>
                </div>

                <p className={`text-[11px] italic pt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Motivazione registrata: "{log.reason}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODAL: ISPEZIONE DETTAGLIATA PRENOTAZIONE E CONTO */}
      {inspectingReservation && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#273248] text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${
              isLight ? 'border-slate-200' : 'border-[#222A3C]'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-brand font-bold text-lg ${
                  isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                }`}>
                  {inspectingReservation.tableNumber}
                </span>
                <div>
                  <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Ispezione Tavolo {inspectingReservation.tableNumber} · {inspectingReservation.guestName}
                  </h3>
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {inspectingReservation.partySize} persone · Fascia: {inspectingReservation.timeSlot}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectingReservation(null)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition ${
                  isLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900' : 'bg-[#171D2B] text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* 1. TOP: GENERAL BILL & ORDER ITEMS SUMMARY */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${
                  isLight ? 'border-slate-200' : 'border-[#242C3E]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      1. Informazioni Generiche & Riepilogo Conto
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                    }`}>
                      {inspectingReservation.items.length} Portate Ordinate
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs block font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Media: € {(inspectingReservation.totalBill / Math.max(1, inspectingReservation.partySize)).toFixed(2)}/pax
                    </span>
                    <span className={`text-xl font-mono font-black ${isLight ? 'text-emerald-700' : 'text-[#34D399]'}`}>
                      Totale: € {inspectingReservation.totalBill}
                    </span>
                  </div>
                </div>

                <div className={`space-y-1.5 divide-y ${isLight ? 'divide-slate-200' : 'divide-[#242C3E]'}`}>
                  {inspectingReservation.items.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <div className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] border ${
                            isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/30'
                          }`}>
                            {item.quantity}x
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <span className={`text-[10px] block font-mono pl-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Trasmesso in cucina alle ore {item.sentTime}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>€ {item.price * item.quantity}</span>
                        {item.quantity > 1 && (
                          <span className={`text-[10px] block font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>€{item.price} cad.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. BOTTOM: INFORMAZIONI RISERVATE AL GESTORE (STORNI, ANOMALIE, AUDIT) */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${
                  isLight ? 'border-slate-200' : 'border-[#242C3E]'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-[10px]">
                      2. Informazioni Riservate al Gestore (Audit Storni & Eliminazioni)
                    </span>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                    isLight ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                  }`}>
                    Controllo Direzione
                  </span>
                </div>

                {inspectingReservation.voidLogs.length === 0 ? (
                  <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs ${
                    isLight
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                      : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Nessun articolo stornato o eliminato post-send su questo tavolo. Comanda regolare al 100%.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectingReservation.voidLogs.map((log) => (
                      <div key={log.id} className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isLight ? 'bg-white border-rose-200' : 'bg-[#10141F] border-rose-900/50'
                      }`}>
                        <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-300">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Piatto Eliminato Post-Send: {log.itemName} (-€{log.itemPrice})</span>
                          </span>
                          <span className={`font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {new Date(log.createdAt).toLocaleTimeString('it-IT')}
                          </span>
                        </div>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-2 rounded-lg ${
                          isLight ? 'bg-slate-50 text-slate-700' : 'bg-black/30 text-slate-300'
                        }`}>
                          <div>
                            <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Cameriere Richiedente:</span>
                            <strong className={isLight ? 'text-slate-900' : 'text-white'}>{log.waiterName}</strong>
                          </div>
                          <div>
                            <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Autorizzato con PIN da:</span>
                            <strong className={isLight ? 'text-sky-700' : 'text-[#C084FC]'}>{log.managerApprovedBy || 'Direzione / Maître'}</strong>
                          </div>
                          <div className="sm:col-span-2">
                            <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Motivazione Certificata:</span>
                            <span className="text-amber-700 dark:text-amber-200 italic">"{log.reason}"</span>
                          </div>
                        </div>
                        <div className={`text-[10px] flex items-center justify-between pt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span>Variazione Conto: Da <strong className="text-amber-600 dark:text-amber-400 font-mono">€{log.totalBefore}</strong> a <strong className="text-emerald-600 dark:text-[#34D399] font-mono">€{log.totalAfter}</strong></span>
                          <span className="text-rose-600 dark:text-rose-400 font-mono font-semibold">Storno Tracciato</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`pt-3 border-t flex justify-end shrink-0 ${
              isLight ? 'border-slate-200' : 'border-[#222A3C]'
            }`}>
              <button
                onClick={() => setInspectingReservation(null)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-[#171D2B] hover:bg-[#222A3C] text-white'
                }`}
              >
                Chiudi Ispezione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CREATE NEW WAITER */}
      {isCreatingWaiter && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#273248] text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-slate-200' : 'border-[#222A3C]'
            }`}>
              <h4 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <UserPlus className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-[#C084FC]'}`} />
                <span>Crea Credenziali Cameriere</span>
              </h4>
              <button
                onClick={() => setIsCreatingWaiter(false)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className={`p-2.5 border rounded-xl text-xs ${
                isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
              }`}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateWaiter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-[10px] font-semibold uppercase mb-1 ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Simone"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
                        : 'bg-[#10141F] border-[#242C3E] text-white focus:border-[#8B31E0]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-semibold uppercase mb-1 ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rinaldi"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
                        : 'bg-[#10141F] border-[#242C3E] text-white focus:border-[#8B31E0]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase mb-1 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  Email Aziendale *
                </label>
                <input
                  type="email"
                  required
                  placeholder="simone.waiter@sottosotto.it"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
                      : 'bg-[#10141F] border-[#242C3E] text-white focus:border-[#8B31E0]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase mb-1 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  Password Provvisoria *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Password (min 6 caratteri)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
                      : 'bg-[#10141F] border-[#242C3E] text-white focus:border-[#8B31E0]'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingWaiter(false)}
                  className={`px-4 py-2 rounded-xl cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#171D2B] text-slate-300'
                  }`}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-semibold rounded-xl cursor-pointer transition shadow-xs ${
                    isLight
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white'
                      : 'bg-[#8B31E0] hover:bg-[#7928CA] text-white'
                  }`}
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
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#273248] text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-slate-200' : 'border-[#222A3C]'
            }`}>
              <h4 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Reimposta Password</span>
              </h4>
              <button
                onClick={() => setStaffToReset(null)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Imposta una nuova password per <strong className={isLight ? 'text-slate-950' : 'text-white'}>{staffToReset.fullName}</strong>.
            </p>

            {resetSuccess ? (
              <div className={`p-3 border text-xs rounded-xl flex items-center gap-2 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Password aggiornata con successo!</span>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                {resetError && (
                  <div className={`p-2.5 border text-xs rounded-xl ${
                    isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}>
                    {resetError}
                  </div>
                )}
                <div>
                  <label className={`block text-[10px] font-semibold uppercase mb-1 ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    Nuova Password (min 6 caratteri)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Nuova password sicura..."
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
                        : 'bg-[#10141F] border-[#242C3E] text-white focus:border-[#8B31E0]'
                    }`}
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffToReset(null)}
                    className={`px-4 py-2 rounded-xl cursor-pointer ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#171D2B] text-slate-300'
                    }`}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer shadow-xs"
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

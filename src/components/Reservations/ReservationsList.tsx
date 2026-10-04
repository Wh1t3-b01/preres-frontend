import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Search,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  Trash2,
  Plus,
  Printer,
  Eraser,
} from 'lucide-react';
import { ReservationStatus } from '../../types';

interface ReservationsListProps {
  onOpenBookingModal: () => void;
}

export const ReservationsList: React.FC<ReservationsListProps> = ({ onOpenBookingModal }) => {
  const {
    reservations,
    selectedDate,
    setSelectedDate,
    seatReservation,
    completeReservation,
    cancelReservation,
    deleteReservation,
    clearCompletedReservations,
  } = useRestaurant();

  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'lunch' | 'dinner'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReservationStatus>('all');

  // Completed or cancelled count for currently selected date
  const completedCount = reservations.filter(
    (r) => r.reservationDate === selectedDate && (r.status === 'completed' || r.status === 'cancelled')
  ).length;

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations
      .filter((r) => {
        // Date match
        if (r.reservationDate !== selectedDate) return false;

        // Search match
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = r.guestName.toLowerCase().includes(q);
          const matchCode = r.bookingCode.toLowerCase().includes(q);
          const matchPhone = r.guestPhone?.toLowerCase().includes(q) || false;
          const matchTable = r.tableId.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchPhone && !matchTable) return false;
        }

        // Shift filter
        if (shiftFilter === 'lunch') {
          const startH = parseInt(r.startTime.split(':')[0], 10);
          if (startH < 11 || startH >= 17) return false;
        } else if (shiftFilter === 'dinner') {
          const startH = parseInt(r.startTime.split(':')[0], 10);
          if (startH < 17) return false;
        }

        // Status filter
        if (statusFilter !== 'all') {
          if (r.status !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [reservations, selectedDate, searchTerm, shiftFilter, statusFilter]);

  // Aggregate stats for filtered view
  const totalCovers = filteredReservations.reduce((sum, r) => sum + r.partySize, 0);
  const seatedCovers = filteredReservations
    .filter((r) => r.status === 'seated')
    .reduce((sum, r) => sum + r.partySize, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleClearCompleted = () => {
    if (confirm(`Vuoi eliminare definitivamente tutte le ${completedCount} prenotazioni completate/annullate del ${selectedDate}?`)) {
      clearCompletedReservations(selectedDate);
    }
  };

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-12 text-slate-100">
      {/* Top Controls Header */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Registro Prenotazioni del Giorno
            </h2>
            <p className="text-xs text-slate-400">
              Gestisci l'accoglienza, i turni tavoli, note di servizio e cancellazione definitiva
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-medium rounded-xl transition border border-rose-800/40 shadow-xs cursor-pointer"
                title="Elimina definitivamente tutte le prenotazioni chiuse"
              >
                <Eraser className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Pulisci Completati ({completedCount})</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171D2B] hover:bg-[#20273A] text-slate-200 text-xs font-medium rounded-xl transition border border-[#273248] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Stampa</span>
            </button>

            <button
              onClick={onOpenBookingModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white text-xs font-semibold rounded-xl transition shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span>Nuova Prenotazione</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2.5 border-t border-[#222A3C]">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.5]" />
            <input
              type="text"
              placeholder="Cerca ospite, telefono, codice, tavolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
            />
          </div>

          {/* Date Picker */}
          <label className="flex items-center gap-2 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 cursor-pointer hover:border-[#8B31E0]/50 transition">
            <Calendar className="w-3.5 h-3.5 text-[#C084FC] stroke-[1.5] shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-xs font-medium text-white focus:outline-none w-full cursor-pointer font-mono"
            />
          </label>

          {/* Shift Segmented Control */}
          <div className="flex items-center bg-[#10141F] border border-[#242C3E] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setShiftFilter('all')}
              className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer ${
                shiftFilter === 'all'
                  ? 'bg-[#171D2B] text-white border border-[#273248] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setShiftFilter('lunch')}
              className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer ${
                shiftFilter === 'lunch'
                  ? 'bg-[#171D2B] text-white border border-[#273248] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pranzo
            </button>
            <button
              onClick={() => setShiftFilter('dinner')}
              className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer ${
                shiftFilter === 'dinner'
                  ? 'bg-[#171D2B] text-white border border-[#273248] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cena
            </button>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0] cursor-pointer"
            >
              <option value="all">Tutti gli stati ({filteredReservations.length})</option>
              <option value="confirmed">In Arrivo (Confermati)</option>
              <option value="seated">Seduti in Sala</option>
              <option value="completed">Completati</option>
              <option value="cancelled">Annullati</option>
            </select>
          </div>
        </div>

        {/* Quick KPI Count pill bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#222A3C] flex-wrap gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span>Totale: <strong className="text-white">{filteredReservations.length} prenotazioni</strong></span>
            <span>·</span>
            <span>Coperti: <strong className="text-white">{totalCovers} pax</strong></span>
            <span>·</span>
            <span className="text-[#34D399]">Seduti: <strong>{seatedCovers} pax</strong></span>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#222A3C] bg-[#161C2A] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-3">Orario</th>
                <th className="p-3">Ospite</th>
                <th className="p-3">Coperti</th>
                <th className="p-3">Tavolo</th>
                <th className="p-3">Note & Intolleranze</th>
                <th className="p-3">Codice</th>
                <th className="p-3">Stato</th>
                <th className="p-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202738]">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                    Nessuna prenotazione trovata con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => {
                  const isMerged = r.assignedTableIds && r.assignedTableIds.length > 1;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#161C2A] transition-colors duration-100"
                    >
                      {/* Time */}
                      <td className="p-3 font-mono font-bold text-xs text-[#C084FC]">
                        {r.startTime}
                        <span className="block text-[10px] font-normal text-slate-500 font-sans">
                          {r.endTime} ({r.durationMins}m)
                        </span>
                      </td>

                      {/* Guest */}
                      <td className="p-3">
                        <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                          <span>{r.guestName}</span>
                          {r.vipTier === 'top_spender' && <span className="text-[9px] text-amber-400">💎</span>}
                          {r.vipTier === 'vip' && <span className="text-[9px] text-[#C084FC]">⭐</span>}
                        </div>
                        {(r.guestPhone || r.guestEmail) && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            {r.guestPhone && <span className="font-mono">{r.guestPhone}</span>}
                            {r.guestEmail && <span>{r.guestEmail}</span>}
                          </div>
                        )}
                        {r.tags && r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[8px] font-medium bg-[#171D2B] text-slate-300 px-1.5 py-0.2 rounded border border-[#273248]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Party Size */}
                      <td className="p-3 font-mono font-bold text-xs text-white">
                        {r.partySize} px
                      </td>

                      {/* Table */}
                      <td className="p-3">
                        <div className="font-mono font-semibold text-xs text-[#34D399]">
                          {isMerged ? (
                            <span className="text-[#C084FC] bg-[#8B31E0]/20 px-2 py-0.5 rounded text-[10px] font-semibold border border-[#8B31E0]/30">
                              Uniti: {r.assignedTableIds.join('+')}
                            </span>
                          ) : (
                            `Tav. ${r.tableId}`
                          )}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="p-3 max-w-xs">
                        {r.notes ? (
                          <span className="text-slate-300 text-[11px] line-clamp-2">
                            {r.notes}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-[10px]">—</span>
                        )}
                      </td>

                      {/* Code */}
                      <td className="p-3 font-mono text-[10px] text-slate-400">
                        {r.bookingCode}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                            r.status === 'seated'
                              ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/40'
                              : r.status === 'confirmed'
                              ? 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                              : r.status === 'completed'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
                          }`}
                        >
                          {r.status === 'seated'
                            ? 'Seduto'
                            : r.status === 'confirmed'
                            ? 'In Arrivo'
                            : r.status === 'completed'
                            ? 'Completato'
                            : 'Annullato'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'confirmed' && (
                            <button
                              onClick={() => seatReservation(r.id)}
                              className="px-2.5 py-1 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-semibold rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Fai sedere gli ospiti"
                            >
                              <UserCheck className="w-3 h-3 stroke-[1.5]" />
                              <span>Siedi</span>
                            </button>
                          )}

                          {r.status === 'seated' && (
                            <button
                              onClick={() => completeReservation(r.id)}
                              className="px-2.5 py-1 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-semibold rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Completa e libera il tavolo"
                            >
                              <CheckCircle2 className="w-3 h-3 stroke-[1.5]" />
                              <span>Completa</span>
                            </button>
                          )}

                          {r.status !== 'cancelled' && r.status !== 'completed' && (
                            <button
                              onClick={() => cancelReservation(r.id)}
                              className="p-1 hover:bg-white/5 text-slate-400 hover:text-amber-400 rounded-lg transition cursor-pointer"
                              title="Annulla prenotazione"
                            >
                              <XCircle className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteReservation(r.bookingCode || r.id)}
                            className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                            title="Elimina definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

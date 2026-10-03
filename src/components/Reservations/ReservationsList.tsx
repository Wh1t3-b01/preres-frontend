import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Search,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  Trash2,
  Plus,
  Printer,
  Tag,
  Phone,
  Mail,
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
    tableGroups,
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
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* Top Controls Header */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-brand font-bold text-[#1E3A2F]">
              Registro Prenotazioni del Giorno
            </h2>
            <p className="text-xs text-[#1E3A2F]/70">
              Gestisci l'accoglienza, i turni tavoli, note di servizio e cancellazione definitiva
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl transition border border-rose-300 shadow-2xs"
                title="Elimina definitivamente tutte le prenotazioni chiuse"
              >
                <Eraser className="w-3.5 h-3.5 text-rose-600" />
                <span>Elimina Completati ({completedCount})</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-[#1E3A2F] text-xs font-semibold rounded-xl transition border border-[#1E3A2F]/10"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Foglio</span>
            </button>

            <button
              onClick={onOpenBookingModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#6B3FA0] hover:bg-[#5A338A] text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Prenotazione</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#1E3A2F]/10">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Cerca ospite, telefono, codice, tavolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FBF8F2] border border-[#1E3A2F]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0]"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#FBF8F2] border border-[#1E3A2F]/20 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-stone-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-[#1E3A2F] focus:outline-none w-full cursor-pointer"
            />
          </div>

          {/* Shift Segmented Control */}
          <div className="flex items-center bg-[#FBF8F2] border border-[#1E3A2F]/20 rounded-xl p-1 text-xs">
            <button
              onClick={() => setShiftFilter('all')}
              className={`flex-1 py-1 rounded-lg font-medium transition ${
                shiftFilter === 'all'
                  ? 'bg-[#1E3A2F] text-amber-100 font-bold shadow-xs'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F]'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setShiftFilter('lunch')}
              className={`flex-1 py-1 rounded-lg font-medium transition ${
                shiftFilter === 'lunch'
                  ? 'bg-[#1E3A2F] text-amber-100 font-bold shadow-xs'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F]'
              }`}
            >
              Pranzo
            </button>
            <button
              onClick={() => setShiftFilter('dinner')}
              className={`flex-1 py-1 rounded-lg font-medium transition ${
                shiftFilter === 'dinner'
                  ? 'bg-[#1E3A2F] text-amber-100 font-bold shadow-xs'
                  : 'text-[#1E3A2F]/70 hover:text-[#1E3A2F]'
              }`}
            >
              Cena
            </button>
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#FBF8F2] border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs text-[#1E3A2F] font-semibold focus:outline-none focus:border-[#6B3FA0]"
            >
              <option value="all">Tutti gli Stati</option>
              <option value="confirmed">Confermati (In arrivo)</option>
              <option value="seated">Seduti in Sala</option>
              <option value="completed">Completati (Terminati)</option>
              <option value="cancelled">Annullati</option>
            </select>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-[#1E3A2F]/10">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Prenotazioni filtrate: <strong>{filteredReservations.length}</strong>
            </span>
            <span>·</span>
            <span>
              Coperti totali: <strong>{totalCovers} px</strong>
            </span>
            <span>·</span>
            <span>
              Seduti ora: <strong className="text-emerald-700">{seatedCovers} px</strong>
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono-num">Data: {selectedDate}</span>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E3A2F]">
            <thead className="bg-[#1E3A2F] text-amber-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Orario</th>
                <th className="p-3.5">Ospite</th>
                <th className="p-3.5">Coperti</th>
                <th className="p-3.5">Tavolo</th>
                <th className="p-3.5">Note & Intolleranze</th>
                <th className="p-3.5">Codice</th>
                <th className="p-3.5">Stato</th>
                <th className="p-3.5 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A2F]/10">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-500 italic">
                    Nessuna prenotazione trovata con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => {
                  const isMerged = r.assignedTableIds && r.assignedTableIds.length > 1;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#FBF8F2] transition-colors duration-100"
                    >
                      {/* Time */}
                      <td className="p-3.5 font-mono-num font-bold text-sm text-[#6B3FA0]">
                        {r.startTime}
                        <span className="block text-[10px] font-normal text-stone-400">
                          {r.endTime} ({r.durationMins}m)
                        </span>
                      </td>

                      {/* Guest */}
                      <td className="p-3.5">
                        <div className="font-bold text-xs text-[#1E3A2F]">{r.guestName}</div>
                        {(r.guestPhone || r.guestEmail) && (
                          <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                            {r.guestPhone && <span>{r.guestPhone}</span>}
                            {r.guestEmail && <span>{r.guestEmail}</span>}
                          </div>
                        )}
                        {r.tags && r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-medium bg-[#1E3A2F]/5 text-[#1E3A2F] px-1.5 py-0.2 rounded border border-[#1E3A2F]/10"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Party Size */}
                      <td className="p-3.5 font-bold font-mono-num text-xs">
                        {r.partySize} px
                      </td>

                      {/* Table */}
                      <td className="p-3.5">
                        <div className="font-mono-num font-bold text-xs text-[#1E3A2F]">
                          {isMerged ? (
                            <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                              Uniti: {r.assignedTableIds.join('+')}
                            </span>
                          ) : (
                            `Tav. ${r.tableId}`
                          )}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="p-3.5 max-w-xs">
                        {r.notes ? (
                          <span className="text-stone-700 text-[11px] line-clamp-2">
                            {r.notes}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic text-[10px]">—</span>
                        )}
                      </td>

                      {/* Code */}
                      <td className="p-3.5 font-mono text-[11px] font-semibold text-stone-600">
                        {r.bookingCode}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            r.status === 'seated'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'confirmed'
                              ? 'bg-purple-100 text-purple-800'
                              : r.status === 'completed'
                              ? 'bg-stone-100 text-stone-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status === 'completed' ? 'Completato' : r.status === 'seated' ? 'Seduto' : r.status === 'confirmed' ? 'Confermato' : 'Annullato'}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'confirmed' && (
                            <button
                              onClick={() => seatReservation(r.id)}
                              className="px-2.5 py-1 bg-[#6B3FA0] hover:bg-[#5A338A] text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                              title="Fai sedere gli ospiti"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Siedi</span>
                            </button>
                          )}

                          {r.status === 'seated' && (
                            <button
                              onClick={() => completeReservation(r.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                              title="Completa e libera tavolo"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Libera</span>
                            </button>
                          )}

                          {r.status !== 'cancelled' && r.status !== 'completed' && (
                            <button
                              onClick={() => {
                                if (confirm(`Vuoi annullare la prenotazione ${r.bookingCode}?`)) {
                                  cancelReservation(r.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Annulla prenotazione"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Permanent Delete Button for any row (especially completed ones) */}
                          <button
                            onClick={() => {
                              deleteReservation(r.bookingCode || r.id);
                            }}
                            className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                              r.status === 'completed' || r.status === 'cancelled'
                                ? 'text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 text-[10px] font-bold px-2'
                                : 'text-stone-400 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title="Elimina definitivamente dal database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {(r.status === 'completed' || r.status === 'cancelled') && (
                              <span>Elimina</span>
                            )}
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

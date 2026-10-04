import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Users,
  Clock,
  MessageSquare,
  Plus,
  Send,
  UserCheck,
  Trash2,
  Phone,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  X,
} from 'lucide-react';
import { TableZone } from '../../types';

export const WaitlistView: React.FC = () => {
  const {
    waitlist,
    tables,
    reservations,
    selectedDate,
    addToWaitlist,
    updateWaitlistStatus,
    sendWaitlistSMS,
    seatWaitlistGuest,
  } = useRestaurant();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [estimatedWaitMins, setEstimatedWaitMins] = useState(15);
  const [preferredZone, setPreferredZone] = useState<TableZone>('main_a');
  const [notes, setNotes] = useState('');

  // Selected table for seating modal
  const [seatingWaitlistId, setSeatingWaitlistId] = useState<string | null>(null);
  const [targetTableId, setTargetTableId] = useState<string>('');

  const waitingList = waitlist.filter((w) => w.status !== 'cancelled');
  const activeWaitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) return;

    addToWaitlist({
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      partySize,
      estimatedWaitMins,
      preferredZone,
      notes: notes.trim() || undefined,
    });

    setGuestName('');
    setGuestPhone('');
    setNotes('');
    setIsAddOpen(false);
  };

  const handleSeatConfirm = () => {
    if (!seatingWaitlistId || !targetTableId) return;
    const ok = seatWaitlistGuest(seatingWaitlistId, targetTableId);
    if (ok) {
      setSeatingWaitlistId(null);
      setTargetTableId('');
    }
  };

  // Get available tables
  const availableTables = tables.filter((t) => {
    const isOccupied = reservations.some(
      (r) =>
        r.reservationDate === selectedDate &&
        (r.tableId === t.id || (r.assignedTableIds && r.assignedTableIds.includes(t.id))) &&
        (r.status === 'seated' || r.status === 'confirmed')
    );
    return !isOccupied && !t.isBlocked;
  });

  return (
    <div className="space-y-6 max-w-[1780px] mx-auto pb-16 text-slate-100">
      
      {/* Header */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-white">
              PRERES Waitlist & Coda d'Attesa
            </h2>
            <span className="text-xs bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 font-bold px-2.5 py-0.5 rounded-full font-mono">
              {activeWaitingCount} in attesa
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestione comitive in attesa all'ingresso, notifiche SMS automatiche e assegnazione rapida del tavolo.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white text-xs font-semibold rounded-xl transition shadow-md whitespace-nowrap cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Aggiungi Ospite in Coda</span>
        </button>
      </div>

      {/* Add to Waitlist Drawer / Modal */}
      {isAddOpen && (
        <div className="bg-[#121622] border border-[#8B31E0]/50 rounded-2xl p-5 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#222A3C]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C084FC]" />
              <h4 className="font-brand font-bold text-sm text-white">
                Nuovo Ingresso in Lista d'Attesa
              </h4>
            </div>
            <button
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2536] cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nome Ospite *
              </label>
              <input
                type="text"
                required
                placeholder="Es. Mario Rossi"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Cellulare per SMS *
              </label>
              <input
                type="tel"
                required
                placeholder="+39 340 1234567"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Coperti
              </label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#8B31E0] cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Persona' : 'Persone'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Attesa Stimata
              </label>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={estimatedWaitMins}
                onChange={(e) => setEstimatedWaitMins(Number(e.target.value))}
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-md cursor-pointer active:scale-95"
              >
                Salva in Coda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waitlist Table */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-[#171D2B] text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-[#222A3C]">
            <tr>
              <th className="p-3.5">Ospite</th>
              <th className="p-3.5">Coperti</th>
              <th className="p-3.5">Telefono</th>
              <th className="p-3.5">Ora Inserimento</th>
              <th className="p-3.5">Attesa Prevista</th>
              <th className="p-3.5">Stato Coda</th>
              <th className="p-3.5 text-right">Azioni Notifica & Assegnazione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222A3C]/80">
            {waitingList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500 italic">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  Nessun ospite in attesa in questo momento.
                </td>
              </tr>
            ) : (
              waitingList.map((item) => {
                const addedDate = new Date(item.addedAt);
                const timeStr = `${String(addedDate.getHours()).padStart(2, '0')}:${String(
                  addedDate.getMinutes()
                ).padStart(2, '0')}`;
                const diffMins = Math.floor((Date.now() - addedDate.getTime()) / 60000);

                return (
                  <tr key={item.id} className="hover:bg-[#151A27] transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-xs text-white">{item.guestName}</div>
                      {item.notes && <div className="text-[11px] text-slate-400 mt-0.5">{item.notes}</div>}
                    </td>

                    <td className="p-3.5 font-bold font-mono text-[#C084FC]">{item.partySize} px</td>

                    <td className="p-3.5 font-mono text-slate-300">{item.guestPhone}</td>

                    <td className="p-3.5 font-mono text-slate-300">
                      {timeStr}{' '}
                      <span className="text-[10px] text-slate-500">({diffMins}m fa)</span>
                    </td>

                    <td className="p-3.5 font-mono font-semibold text-amber-300">~{item.estimatedWaitMins} min</td>

                    <td className="p-3.5">
                      <span
                        className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          item.status === 'notified'
                            ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                            : item.status === 'seated'
                            ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/40'
                            : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {item.status === 'waiting'
                          ? 'In Attesa'
                          : item.status === 'notified'
                          ? 'SMS Inviato 📲'
                          : 'Seduto'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'waiting' && (
                          <button
                            onClick={() => sendWaitlistSMS(item.id)}
                            className="flex items-center gap-1 bg-[#8B31E0]/20 hover:bg-[#8B31E0]/40 text-[#C084FC] border border-[#8B31E0]/40 font-semibold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                            title="Invia SMS Tavolo Pronto"
                          >
                            <Send className="w-3 h-3" />
                            <span>Invia SMS</span>
                          </button>
                        )}

                        {item.status !== 'seated' && (
                          <button
                            onClick={() => {
                              setSeatingWaitlistId(item.id);
                              if (availableTables.length > 0) {
                                setTargetTableId(availableTables[0].id);
                              }
                            }}
                            className="flex items-center gap-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
                            title="Accomoda subito al tavolo"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Accomoda</span>
                          </button>
                        )}

                        <button
                          onClick={() => updateWaitlistStatus(item.id, 'cancelled')}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                          title="Rimuovi dalla coda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal for Seating Waitlist Guest */}
      {seatingWaitlistId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <h4 className="font-brand font-bold text-lg text-white">
              Accomoda Ospite al Tavolo
            </h4>
            <p className="text-xs text-slate-400">
              Seleziona il tavolo libero su cui far accomodare l'ospite e avviare il servizio.
            </p>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Tavoli Liberi Disponibili
              </label>
              {availableTables.length === 0 ? (
                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-300">
                  Nessun tavolo libero in questo momento.
                </div>
              ) : (
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#8B31E0] cursor-pointer"
                >
                  {availableTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tavolo {t.tableNumber} (Capienza: {t.capacityOverride || t.capacity} px · {t.zone.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222A3C]">
              <button
                onClick={() => setSeatingWaitlistId(null)}
                className="px-4 py-2 bg-[#171D2B] hover:bg-[#222A3C] text-slate-300 rounded-xl text-xs font-semibold border border-[#273248] cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSeatConfirm}
                disabled={!targetTableId}
                className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs disabled:opacity-50 cursor-pointer shadow-md"
              >
                Conferma e Siedi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

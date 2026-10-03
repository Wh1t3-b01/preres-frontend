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
} from 'lucide-react';
import { TableZone } from '../../types';

export const WaitlistView: React.FC = () => {
  const {
    waitlist,
    tables,
    reservations,
    tableGroups,
    selectedDate,
    selectedTime,
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
  const [preferredZone, setPreferredZone] = useState<TableZone>('main');
  const [notes, setNotes] = useState('');

  // Selected table for seating modal
  const [seatingWaitlistId, setSeatingWaitlistId] = useState<string | null>(null);
  const [targetTableId, setTargetTableId] = useState<string>('');

  const waitingList = waitlist.filter((w) => w.status !== 'cancelled');

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
    return !isOccupied;
  });

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-[#1E3A2F]">
              Lista d'Attesa & Comunicazioni Ospiti
            </h2>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full font-mono-num">
              {waitlist.filter((w) => w.status === 'waiting').length} in attesa
            </span>
          </div>
          <p className="text-xs text-[#1E3A2F]/70 mt-1">
            Gestisci la coda d'attesa all'ingresso e invia SMS/WhatsApp automatici quando il tavolo si libera
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#6B3FA0] hover:bg-[#5A338A] text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Aggiungi Ospite in Coda</span>
        </button>
      </div>

      {/* Add to Waitlist Drawer / Modal */}
      {isAddOpen && (
        <div className="bg-amber-50/80 border-2 border-amber-500/40 rounded-2xl p-5 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-brand font-bold text-sm text-[#1E3A2F]">
              Nuovo Ingresso in Lista d'Attesa
            </h4>
            <button
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-stone-500 hover:text-stone-800 font-semibold"
            >
              Annulla
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#1E3A2F] mb-1">
                Nome Ospite *
              </label>
              <input
                type="text"
                required
                placeholder="Es. Mario Rossi"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#6B3FA0]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#1E3A2F] mb-1">
                Cellulare per SMS *
              </label>
              <input
                type="tel"
                required
                placeholder="+39 340 1234567"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#6B3FA0]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#1E3A2F] mb-1">
                Coperti (Persone)
              </label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#6B3FA0]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Persona' : 'Persone'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#1E3A2F] mb-1">
                Attesa Stimata (Minuti)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={estimatedWaitMins}
                onChange={(e) => setEstimatedWaitMins(Number(e.target.value))}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs font-mono-num font-bold focus:outline-none focus:border-[#6B3FA0]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-[#1E3A2F] hover:bg-[#152a22] text-amber-100 font-bold py-2 px-4 rounded-xl text-xs transition shadow-xs"
              >
                Salva in Coda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waitlist Table */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-[#1E3A2F]">
          <thead className="bg-[#1E3A2F] text-amber-100 uppercase text-[10px] tracking-wider font-semibold">
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
          <tbody className="divide-y divide-[#1E3A2F]/10">
            {waitingList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-500 italic">
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
                  <tr key={item.id} className="hover:bg-[#FBF8F2] transition">
                    <td className="p-3.5">
                      <div className="font-bold text-xs text-[#1E3A2F]">{item.guestName}</div>
                      {item.notes && <div className="text-[11px] text-stone-500">{item.notes}</div>}
                    </td>

                    <td className="p-3.5 font-bold font-mono-num">{item.partySize} px</td>

                    <td className="p-3.5 font-mono-num text-stone-600">{item.guestPhone}</td>

                    <td className="p-3.5 font-mono-num">
                      {timeStr}{' '}
                      <span className="text-[10px] text-stone-400">({diffMins} min fa)</span>
                    </td>

                    <td className="p-3.5 font-mono-num font-semibold">~{item.estimatedWaitMins} min</td>

                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'notified'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'seated'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
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
                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition shadow-2xs"
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
                            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1 rounded-lg text-xs transition shadow-2xs"
                            title="Accomoda subito al tavolo"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Accomoda</span>
                          </button>
                        )}

                        <button
                          onClick={() => updateWaitlistStatus(item.id, 'cancelled')}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] border-2 border-[#1E3A2F]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h4 className="font-brand font-bold text-lg text-[#1E3A2F]">
              Accomoda Ospite da Lista d'Attesa
            </h4>
            <p className="text-xs text-stone-600">
              Seleziona il tavolo libero su cui far accomodare l'ospite e avviare il timer.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1E3A2F] mb-1">
                Tavoli Liberi Disponibili
              </label>
              {availableTables.length === 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  Nessun tavolo libero in questo momento.
                </div>
              ) : (
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                >
                  {availableTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tavolo {t.tableNumber} (Capienza: {t.capacityOverride || t.capacity} px · {t.zone.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3A2F]/10">
              <button
                onClick={() => setSeatingWaitlistId(null)}
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Annulla
              </button>
              <button
                onClick={handleSeatConfirm}
                disabled={!targetTableId}
                className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
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

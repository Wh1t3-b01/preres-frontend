import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { getAvailableSingleAndGroupTables } from '../../utils/bookingEngine';
import { X, Zap, Users, CheckCircle2, Utensils } from 'lucide-react';

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({ isOpen, onClose }) => {
  const {
    tables,
    reservations,
    tableGroups,
    selectedDate,
    selectedTime,
    quickSeatWalkIn,
  } = useRestaurant();

  const [guestName, setGuestName] = useState('Ospite Walk-in');
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [successCode, setSuccessCode] = useState<string | null>(null);

  // Available free tables right now
  const availableTables = useMemo(() => {
    if (!isOpen) return [];
    const { directMatches, oversizedMatches } = getAvailableSingleAndGroupTables(
      selectedDate,
      selectedTime,
      '23:59',
      partySize,
      tables,
      reservations,
      tableGroups
    );
    return [...directMatches, ...oversizedMatches];
  }, [isOpen, selectedDate, selectedTime, partySize, tables, reservations, tableGroups]);

  // Set default selected table
  React.useEffect(() => {
    if (availableTables.length > 0) {
      setSelectedTableId(availableTables[0].tableId);
    } else {
      setSelectedTableId('');
    }
  }, [availableTables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      alert('Nessun tavolo selezionato.');
      return;
    }

    const matchingOpt = availableTables.find((o) => o.tableId === selectedTableId);
    const res = quickSeatWalkIn({
      guestName: guestName.trim() || 'Ospite Walk-in',
      partySize,
      tableId: selectedTableId,
      assignedTableIds: matchingOpt ? matchingOpt.memberTableIds : [selectedTableId],
      notes: notes.trim() || undefined,
    });

    if (res.success && res.bookingCode) {
      setSuccessCode(res.bookingCode);
    } else {
      alert(res.error || 'Errore durante l’assegnazione.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border-2 border-[#1E3A2F]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#1E3A2F]/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-lg font-brand font-bold text-[#1E3A2F]">
                Accomoda Walk-in Immediato
              </h3>
              <p className="text-[11px] text-[#1E3A2F]/70">
                Ospiti arrivati alla porta · Avvio immediato servizio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-[#1E3A2F] p-1.5 rounded-xl hover:bg-[#1E3A2F]/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successCode ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-base text-[#1E3A2F]">Ospiti Seduti al Tavolo!</h4>
              <p className="text-xs text-stone-600 mt-1">
                Codice Walk-in: <strong>{successCode}</strong> · Timer 2h attivato in sala.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccessCode(null);
                onClose();
              }}
              className="px-5 py-2 bg-[#1E3A2F] text-amber-100 font-bold rounded-xl text-xs transition"
            >
              OK, Torna alla Sala
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#1E3A2F]/80 mb-1">
                Nome o Riferimento Ospite
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Es. Walk-in Mario Rossi"
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#1E3A2F]/80 mb-1">
                  Numero di Persone
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPartySize(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        partySize === num
                          ? 'bg-[#1E3A2F] text-amber-100 shadow-xs'
                          : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#1E3A2F]/5'
                      }`}
                    >
                      {num} px
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1E3A2F]/80 mb-1">
                  Personalizza Coperti
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-1.5 text-xs text-[#1E3A2F] font-bold focus:outline-none focus:border-[#6B3FA0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#1E3A2F]/80 mb-1">
                Tavolo Libero di Destinazione
              </label>
              {availableTables.length === 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  Nessun tavolo libero in questo momento per {partySize} persone.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {availableTables.map((opt) => (
                    <button
                      key={opt.tableId}
                      type="button"
                      onClick={() => setSelectedTableId(opt.tableId)}
                      className={`p-2 rounded-xl border text-left text-xs transition flex justify-between items-center ${
                        selectedTableId === opt.tableId
                          ? 'bg-amber-400/20 border-amber-600 font-bold ring-2 ring-amber-500/20'
                          : 'bg-white border-[#1E3A2F]/15 hover:border-amber-500'
                      }`}
                    >
                      <span>{opt.tableName}</span>
                      <span className="text-[10px] text-stone-500 font-mono-num">
                        {opt.capacity} px
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#1E3A2F]/80 mb-1">
                Note Rapide
              </label>
              <input
                type="text"
                placeholder="Es. Aperitivo veloce, solo drink..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-1.5 text-xs text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0]"
              />
            </div>

            <div className="pt-3 border-t border-[#1E3A2F]/15 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-xl text-xs transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!selectedTableId}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Accomoda Ora</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

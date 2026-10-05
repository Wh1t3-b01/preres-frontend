import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { getAvailableSingleAndGroupTables } from '../../utils/bookingEngine';
import { X, Zap, Users, CheckCircle2, Utensils, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-slate-100 animate-in fade-in">
      <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222A3C] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Accomoda Walk-in Immediato
              </h3>
              <p className="text-xs text-slate-400">
                Ospiti arrivati alla porta · Assegnazione tavolo e timer live
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

        {successCode ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-[#059669]/20 border border-[#059669]/40 text-[#34D399] rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Ospiti Seduti al Tavolo!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Codice Walk-in: <strong className="text-[#C084FC] font-mono">{successCode}</strong> · Timer servizio attivo in sala.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccessCode(null);
                onClose();
              }}
              className="px-6 py-2.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-md shadow-[#8B31E0]/25"
            >
              OK, Torna alla Sala
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Guest Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome o Riferimento Ospite
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Es. Walk-in Mario Rossi"
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            {/* Party Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Numero di Persone
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPartySize(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                        partySize === num
                          ? 'bg-[#8B31E0] text-white shadow-xs'
                          : 'bg-[#10141F] border border-[#242C3E] text-slate-300 hover:text-white hover:bg-[#171D2B]'
                      }`}
                    >
                      {num}p
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Coperti Personalizzati
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3.5 py-2 text-xs text-white font-bold font-mono focus:outline-none focus:border-[#8B31E0]"
                />
              </div>
            </div>

            {/* Table Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tavolo Libero di Destinazione
              </label>
              {availableTables.length === 0 ? (
                <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl text-xs text-rose-300">
                  Nessun tavolo libero in questo momento per {partySize} persone.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {availableTables.map((opt) => (
                    <button
                      key={opt.tableId}
                      type="button"
                      onClick={() => setSelectedTableId(opt.tableId)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex justify-between items-center cursor-pointer ${
                        selectedTableId === opt.tableId
                          ? 'bg-[#8B31E0]/20 border-[#8B31E0] text-white font-bold ring-2 ring-[#8B31E0]/30 shadow-xs'
                          : 'bg-[#10141F] border-[#242C3E] text-slate-300 hover:border-[#8B31E0]/50'
                      }`}
                    >
                      <span className="truncate">{opt.tableName}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                        {opt.capacity} px
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Note Rapide
              </label>
              <input
                type="text"
                placeholder="Es. Aperitivo veloce, solo drink, fretta..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#222A3C] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!selectedTableId}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Accomoda Ora</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

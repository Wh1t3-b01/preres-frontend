import React, { useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Printer, X, ChefHat, AlertTriangle, Star, Clock, Users } from 'lucide-react';

interface PrintRunSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintRunSheetModal: React.FC<PrintRunSheetModalProps> = ({ isOpen, onClose }) => {
  const { reservations, settings, selectedDate } = useRestaurant();

  const sortedReservations = useMemo(() => {
    return reservations
      .filter((r) => r.reservationDate === selectedDate && r.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [reservations, selectedDate]);

  const totalCovers = sortedReservations.reduce((sum, r) => sum + r.partySize, 0);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border-2 border-stone-300 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4 my-auto print:p-0 print:border-0 print:shadow-none">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#1E3A2F]" />
            <h3 className="font-brand font-bold text-base text-[#1E3A2F]">
              Foglio di Servizio Cucina & Sala (Run Sheet) · {selectedDate}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A2F] hover:bg-[#152a22] text-amber-100 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / Salva PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RUN SHEET CONTENT */}
        <div className="space-y-4 text-stone-900 font-sans">
          
          {/* Header */}
          <div className="border-b-2 border-stone-900 pb-3 flex items-center justify-between">
            <div>
              <h1 className="font-brand font-bold text-2xl tracking-tight text-[#1E3A2F]">
                {settings.name.toUpperCase()}
              </h1>
              <p className="text-xs text-stone-600 font-medium">
                PRERES Chef Run Sheet™ & Allergen Manifest · Data: <strong>{selectedDate}</strong>
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-sm">Totale: {totalCovers} Coperti</div>
              <div className="text-stone-500">{sortedReservations.length} Tavoli Prenotati</div>
            </div>
          </div>

          {/* Chronological Table List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-800 bg-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-800">
                  <th className="py-2 px-2 w-16">Ora</th>
                  <th className="py-2 px-2 w-20">Tavolo</th>
                  <th className="py-2 px-2 w-14 text-center">Pax</th>
                  <th className="py-2 px-3">Ospite & Contatti</th>
                  <th className="py-2 px-3">Intolleranze & Allergie ⚠️</th>
                  <th className="py-2 px-3">Note di Servizio & Richieste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-[11px]">
                {sortedReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 italic">
                      Nessuna prenotazione registrata per questa data.
                    </td>
                  </tr>
                ) : (
                  sortedReservations.map((res) => {
                    const isVip = res.tags?.some((t) => t.toLowerCase().includes('vip')) || res.vipTier === 'vip' || res.vipTier === 'top_spender';
                    const hasAllergies = res.tags?.some((t) => t.toLowerCase().includes('allerg') || t.toLowerCase().includes('glut')) || (res.dietaryRestrictions && res.dietaryRestrictions.length > 0);

                    return (
                      <tr key={res.id} className={isVip ? 'bg-amber-50/50 font-medium' : ''}>
                        <td className="py-2.5 px-2 font-bold font-mono-num text-sm text-[#1E3A2F]">
                          {res.startTime}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-[#6B3FA0]">
                          Tav. {res.assignedTableIds?.join('+') || res.tableId}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold font-mono-num text-sm">
                          {res.partySize}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#1E3A2F] flex items-center gap-1">
                            <span>{res.guestName}</span>
                            {isVip && <span className="text-amber-600 text-xs">⭐ VIP</span>}
                          </div>
                          {res.guestPhone && <div className="text-[10px] text-stone-500 font-mono-num">{res.guestPhone}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          {hasAllergies ? (
                            <span className="font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                              ⚠️ {res.dietaryRestrictions?.join(', ') || res.tags?.filter((t) => t.includes('Glut') || t.includes('Allerg')).join(', ')}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">
                          {res.notes || (res.tags && res.tags.length > 0 ? res.tags.join(', ') : '—')}
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
    </div>
  );
};

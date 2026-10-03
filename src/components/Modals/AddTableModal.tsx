import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, Plus, Users, Utensils, Shield, Wine, Check } from 'lucide-react';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultZone?: 'main' | 'bar' | 'private';
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  defaultZone = 'main',
}) => {
  const { addCustomTable, tables } = useRestaurant();

  const [tableNumber, setTableNumber] = useState('');
  const [name, setName] = useState('');
  const [zone, setZone] = useState<'main' | 'bar' | 'private'>(defaultZone);
  const [capacity, setCapacity] = useState<number>(4);
  const [shape, setShape] = useState<'rect-h' | 'rect-v' | 'square' | 'round' | 'booth'>('rect-h');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNum = tableNumber.trim();
    if (!cleanNum) {
      setError('Inserisci il numero o la sigla del tavolo (es. 17, B5, VIP-1).');
      return;
    }

    // Check if table number already exists
    const exists = tables.some(
      (t) => t.id.toLowerCase() === cleanNum.toLowerCase() || t.tableNumber.toLowerCase() === cleanNum.toLowerCase()
    );
    if (exists) {
      setError(`Esiste già un tavolo con sigla "${cleanNum}". Scegli un numero diverso.`);
      return;
    }

    addCustomTable({
      tableNumber: cleanNum,
      name: name.trim() || `Tavolo ${cleanNum}`,
      zone,
      capacity,
      shape,
      x: 40 + Math.floor(Math.random() * 20),
      y: 35 + Math.floor(Math.random() * 20),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#FDFBF7] border-2 border-[#1E3A2F]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A2F]/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#6B3FA0] text-white flex items-center justify-center font-bold shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-brand font-bold text-[#1E3A2F] leading-tight">
                Aggiungi Nuovo Tavolo
              </h3>
              <p className="text-[11px] text-[#1E3A2F]/70">
                Inserisci un nuovo tavolo nella disposizione della sala
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-[#1E3A2F] p-1.5 rounded-xl hover:bg-[#1E3A2F]/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Number & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A2F] mb-1">
                Numero / Sigla *
              </label>
              <input
                type="text"
                placeholder="es. 17, 24, B5"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs text-[#1E3A2F] font-bold focus:outline-none focus:border-[#6B3FA0]"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E3A2F] mb-1">
                Nome o Etichetta
              </label>
              <input
                type="text"
                placeholder="es. Tavolo Finestra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0]"
              />
            </div>
          </div>

          {/* Zone Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1E3A2F] mb-1">
              Zona di Posizionamento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setZone('main')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  zone === 'main'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F] shadow-xs'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#FBF8F2]'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Principale</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('bar')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  zone === 'bar'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F] shadow-xs'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#FBF8F2]'
                }`}
              >
                <Wine className="w-4 h-4" />
                <span>Zona Bar</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('private')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  zone === 'private'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F] shadow-xs'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#FBF8F2]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Sala Privata</span>
              </button>
            </div>
          </div>

          {/* Capacity Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1E3A2F] mb-1">
              Capienza Posti a Sedere
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[2, 3, 4, 5, 6, 8, 10, 12, 14].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCapacity(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-num font-bold transition ${
                    capacity === num
                      ? 'bg-[#6B3FA0] text-white shadow-xs'
                      : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-stone-50'
                  }`}
                >
                  {num} {num === 1 ? 'posto' : 'posti'}
                </button>
              ))}
            </div>
          </div>

          {/* Table Shape */}
          <div>
            <label className="block text-xs font-bold text-[#1E3A2F] mb-1">
              Forma del Tavolo
            </label>
            <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setShape('rect-h')}
                className={`p-2 rounded-xl border text-center transition ${
                  shape === 'rect-h'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F]'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F]'
                }`}
              >
                Rettangolare
              </button>
              <button
                type="button"
                onClick={() => setShape('square')}
                className={`p-2 rounded-xl border text-center transition ${
                  shape === 'square'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F]'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F]'
                }`}
              >
                Quadrato
              </button>
              <button
                type="button"
                onClick={() => setShape('round')}
                className={`p-2 rounded-xl border text-center transition ${
                  shape === 'round'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F]'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F]'
                }`}
              >
                Rotondo
              </button>
              <button
                type="button"
                onClick={() => setShape('booth')}
                className={`p-2 rounded-xl border text-center transition ${
                  shape === 'booth'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F]'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F]'
                }`}
              >
                Booth Panca
              </button>
            </div>
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2 bg-[#1E3A2F] hover:bg-[#152a22] text-amber-100 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Aggiungi Tavolo in Sala</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

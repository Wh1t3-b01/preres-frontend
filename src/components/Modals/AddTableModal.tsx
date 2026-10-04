import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableZone } from '../../types';
import { X, Plus, Users, Utensils, Shield, Wine, Check } from 'lucide-react';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultZone?: TableZone;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  defaultZone = 'main_a',
}) => {
  const { addCustomTable, tables } = useRestaurant();

  const [tableNumber, setTableNumber] = useState('');
  const [name, setName] = useState('');
  const [zone, setZone] = useState<TableZone>(defaultZone);
  const [capacity, setCapacity] = useState<number>(4);
  const [shape, setShape] = useState<'rect-h' | 'rect-v' | 'square' | 'round' | 'booth'>('rect-h');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNum = tableNumber.trim();
    if (!cleanNum) {
      setError('Inserisci il numero o la sigla del tavolo (es. 17, 24, B5, VIP-1).');
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
            className="text-stone-400 hover:text-[#1E3A2F] p-1.5 rounded-xl hover:bg-[#1E3A2F]/5 transition cursor-pointer"
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setZone('bar')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'bar'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F] shadow-xs'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#FBF8F2]'
                }`}
              >
                <Wine className="w-4 h-4" />
                <span>Bar</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('private')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'private'
                    ? 'bg-[#1E3A2F] text-amber-100 border-[#1E3A2F] shadow-xs'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#FBF8F2]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Privé</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('main_a')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'main_a' || zone === 'main'
                    ? 'bg-[#6B3FA0] text-white border-[#6B3FA0] shadow-xs'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#FBF8F2]'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>MAIN A</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('main_b')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'main_b'
                    ? 'bg-[#6B3FA0] text-white border-[#6B3FA0] shadow-xs'
                    : 'bg-white border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-[#FBF8F2]'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>MAIN B</span>
              </button>
            </div>
          </div>

          {/* Capacity and Shape */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A2F] mb-1">
                Capienza Coperti
              </label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs font-bold text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0] cursor-pointer"
              >
                <option value={2}>2 Persone</option>
                <option value={4}>4 Persone</option>
                <option value={6}>6 Persone</option>
                <option value={8}>8 Persone (Grande)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E3A2F] mb-1">
                Forma Tavolo
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="w-full bg-white border border-[#1E3A2F]/20 rounded-xl px-3 py-2 text-xs font-bold text-[#1E3A2F] focus:outline-none focus:border-[#6B3FA0] cursor-pointer"
              >
                <option value="rect-h">Rettangolare Orizzontale</option>
                <option value="rect-v">Rettangolare Verticale</option>
                <option value="booth">Booth VIP / Divano</option>
                <option value="round">Rotondo</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E3A2F]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#1E3A2F]/70 hover:text-[#1E3A2F]"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1E3A2F] text-amber-100 hover:bg-[#152a22] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aggiungi alla Sala</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

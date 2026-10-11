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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 text-slate-800 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-700 flex items-center justify-center font-medium shadow-2xs">
              <Plus className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 leading-tight">
                Aggiungi Nuovo Tavolo
              </h3>
              <p className="text-[11px] text-slate-500">
                Inserisci un nuovo tavolo nella disposizione della sala
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100/70 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Number & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numero / Sigla *
              </label>
              <input
                type="text"
                placeholder="es. 17, 24, B5"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome o Etichetta
              </label>
              <input
                type="text"
                placeholder="es. Tavolo Finestra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Zone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Zona di Posizionamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setZone('bar')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'bar'
                    ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Wine className="w-4 h-4 text-sky-600" />
                <span>Bar</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('private')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'private'
                    ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4 text-sky-600" />
                <span>Privé</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('main_a')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'main_a' || zone === 'main'
                    ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Utensils className="w-4 h-4 text-sky-600" />
                <span>MAIN A</span>
              </button>

              <button
                type="button"
                onClick={() => setZone('main_b')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  zone === 'main_b'
                    ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Utensils className="w-4 h-4 text-sky-600" />
                <span>MAIN B</span>
              </button>
            </div>
          </div>

          {/* Capacity and Shape */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capienza Coperti
              </label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value={2}>2 Persone</option>
                <option value={4}>4 Persone</option>
                <option value={6}>6 Persone</option>
                <option value={8}>8 Persone (Grande)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Forma Tavolo
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="rect-h">Rettangolare Orizzontale</option>
                <option value="rect-v">Rettangolare Verticale</option>
                <option value="booth">Booth VIP / Divano</option>
                <option value="round">Rotondo</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200/80 rounded-xl hover:bg-slate-50 cursor-pointer transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Aggiungi alla Sala</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

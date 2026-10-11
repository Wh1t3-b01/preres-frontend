import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  NotebookPen,
  X,
  Plus,
  AlertCircle,
  Users,
  Check,
  Utensils,
  ChefHat,
  Sparkles,
  Award,
} from 'lucide-react';

interface ShiftBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ShiftBriefingData {
  shiftNotes: string;
  specialsOfDay: string[];
  eightySixedItems: string[]; // Esauriti / 86'd items
  vipAlerts: string[];
  assignedServers: { [section: string]: string };
}

const STORAGE_KEY = 'preres_shift_briefing_data';

const DEFAULT_BRIEFING: ShiftBriefingData = {
  shiftNotes: 'Focus massimo sul servizio del vino e presentazione dei tagli speciali di carne dry-aged.',
  specialsOfDay: ['Fiorentina Dry-Aged 45gg', 'Risotto ai Porcini & Tartufo Nero', 'Tartare di Fassona'],
  eightySixedItems: ['Branzino pescato (Esaurito)'],
  vipAlerts: ['Avv. Colombo ore 20:30 al Tavolo G (Booth VIP)', 'Dott.ssa Moretti ore 21:00 (Celiaca severa)'],
  assignedServers: {
    bar: 'Marco (Sommelier)',
    private: 'Sara (Maître)',
    main_a: 'Matteo',
    main_b: 'Alessia',
  },
};

export const ShiftBriefingModal: React.FC<ShiftBriefingModalProps> = ({ isOpen, onClose }) => {
  const { selectedDate } = useRestaurant();

  const [briefing, setBriefing] = useState<ShiftBriefingData>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${selectedDate}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing shift briefing', e);
      }
    }
    return DEFAULT_BRIEFING;
  });

  const [newSpecial, setNewSpecial] = useState('');
  const [new86, setNew86] = useState('');
  const [newVip, setNewVip] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${selectedDate}`);
    if (saved) {
      try {
        setBriefing(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setBriefing(DEFAULT_BRIEFING);
  }, [selectedDate]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem(`${STORAGE_KEY}_${selectedDate}`, JSON.stringify(briefing));
    onClose();
  };

  const addSpecial = () => {
    if (!newSpecial.trim()) return;
    setBriefing((prev) => ({
      ...prev,
      specialsOfDay: [...prev.specialsOfDay, newSpecial.trim()],
    }));
    setNewSpecial('');
  };

  const removeSpecial = (idx: number) => {
    setBriefing((prev) => ({
      ...prev,
      specialsOfDay: prev.specialsOfDay.filter((_, i) => i !== idx),
    }));
  };

  const add86 = () => {
    if (!new86.trim()) return;
    setBriefing((prev) => ({
      ...prev,
      eightySixedItems: [...prev.eightySixedItems, new86.trim()],
    }));
    setNew86('');
  };

  const remove86 = (idx: number) => {
    setBriefing((prev) => ({
      ...prev,
      eightySixedItems: prev.eightySixedItems.filter((_, i) => i !== idx),
    }));
  };

  const addVipAlert = () => {
    if (!newVip.trim()) return;
    setBriefing((prev) => ({
      ...prev,
      vipAlerts: [...prev.vipAlerts, newVip.trim()],
    }));
    setNewVip('');
  };

  const removeVipAlert = (idx: number) => {
    setBriefing((prev) => ({
      ...prev,
      vipAlerts: prev.vipAlerts.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in duration-150 my-auto text-slate-900 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold shadow-xs">
              <NotebookPen className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-brand font-bold text-slate-950 leading-tight">
                  PRERES ShiftMaster™ & Ranghi Sala
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  Briefing ({selectedDate})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Direttive di servizio, assegnazione ranghi ai camerieri, fuori menu e 86'd items.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* General Manager Shift Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-sky-600" />
            <span>Note di Servizio del Maître / Direzione</span>
          </label>
          <textarea
            rows={2}
            value={briefing.shiftNotes}
            onChange={(e) => setBriefing({ ...briefing, shiftNotes: e.target.value })}
            placeholder="Indicazioni per il servizio odierno..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>

        {/* Server Section Table Assignments */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Assegnazione Ranghi / Camerieri alle Sale</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700 block text-[11px]">1. Sala Bar</span>
              <input
                type="text"
                value={briefing.assignedServers.bar || ''}
                onChange={(e) =>
                  setBriefing((prev) => ({
                    ...prev,
                    assignedServers: { ...prev.assignedServers, bar: e.target.value },
                  }))
                }
                placeholder="Cameriere..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700 block text-[11px]">2. Privé</span>
              <input
                type="text"
                value={briefing.assignedServers.private || ''}
                onChange={(e) =>
                  setBriefing((prev) => ({
                    ...prev,
                    assignedServers: { ...prev.assignedServers, private: e.target.value },
                  }))
                }
                placeholder="Cameriere..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700 block text-[11px]">3. MAIN A</span>
              <input
                type="text"
                value={briefing.assignedServers.main_a || ''}
                onChange={(e) =>
                  setBriefing((prev) => ({
                    ...prev,
                    assignedServers: { ...prev.assignedServers, main_a: e.target.value },
                  }))
                }
                placeholder="Cameriere..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700 block text-[11px]">4. MAIN B</span>
              <input
                type="text"
                value={briefing.assignedServers.main_b || ''}
                onChange={(e) =>
                  setBriefing((prev) => ({
                    ...prev,
                    assignedServers: { ...prev.assignedServers, main_b: e.target.value },
                  }))
                }
                placeholder="Cameriere..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* 2-Column: Specials (Fuori Menu) & 86 (Esauriti) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Specials of the Day */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Piatti Fuori Menu / Specials</span>
            </span>

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Aggiungi piatto..."
                value={newSpecial}
                onChange={(e) => setNewSpecial(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSpecial()}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={addSpecial}
                className="p-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-28 overflow-y-auto">
              {briefing.specialsOfDay.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white text-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200"
                >
                  <span>✨ {item}</span>
                  <button onClick={() => removeSpecial(idx)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 86'd / Esauriti Items */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Piatti Esauriti (86 Items)</span>
            </span>

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Piatto esaurito..."
                value={new86}
                onChange={(e) => setNew86(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add86()}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={add86}
                className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-28 overflow-y-auto">
              {briefing.eightySixedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-rose-50 text-rose-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-rose-200"
                >
                  <span>🚫 {item}</span>
                  <button onClick={() => remove86(idx)} className="text-slate-400 hover:text-rose-600 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Chiudi
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2]" />
            <span>Salva Briefing di Turno</span>
          </button>
        </div>

      </div>
    </div>
  );
};

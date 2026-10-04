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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in duration-200 my-auto text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222A3C] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 flex items-center justify-center font-bold shadow-xs">
              <NotebookPen className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-brand font-bold text-white leading-tight">
                  PRERES ShiftMaster™ & Ranghi Sala
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
                  Briefing ({selectedDate})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direttive di servizio, assegnazione ranghi ai camerieri, fuori menu e 86'd items.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1E2536] transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* General Manager Shift Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-[#C084FC]" />
            <span>Note di Servizio del Maître / Direzione</span>
          </label>
          <textarea
            rows={2}
            value={briefing.shiftNotes}
            onChange={(e) => setBriefing({ ...briefing, shiftNotes: e.target.value })}
            placeholder="Indicazioni per il servizio odierno..."
            className="w-full bg-[#10141F] border border-[#242C3E] rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
          />
        </div>

        {/* Server Section Table Assignments */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#34D399]" />
            <span>Assegnazione Ranghi / Camerieri alle Sale</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#171D2B] p-2.5 rounded-xl border border-[#273248]">
              <span className="font-semibold text-slate-300 block text-[11px]">1. Sala Bar</span>
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
                className="w-full mt-1 bg-[#10141F] border border-[#242C3E] rounded-lg p-1.5 text-[11px] font-semibold text-white focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            <div className="bg-[#171D2B] p-2.5 rounded-xl border border-[#273248]">
              <span className="font-semibold text-slate-300 block text-[11px]">2. Privé</span>
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
                className="w-full mt-1 bg-[#10141F] border border-[#242C3E] rounded-lg p-1.5 text-[11px] font-semibold text-white focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            <div className="bg-[#171D2B] p-2.5 rounded-xl border border-[#273248]">
              <span className="font-semibold text-slate-300 block text-[11px]">3. MAIN A</span>
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
                className="w-full mt-1 bg-[#10141F] border border-[#242C3E] rounded-lg p-1.5 text-[11px] font-semibold text-white focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            <div className="bg-[#171D2B] p-2.5 rounded-xl border border-[#273248]">
              <span className="font-semibold text-slate-300 block text-[11px]">4. MAIN B</span>
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
                className="w-full mt-1 bg-[#10141F] border border-[#242C3E] rounded-lg p-1.5 text-[11px] font-semibold text-white focus:outline-none focus:border-[#8B31E0]"
              />
            </div>
          </div>
        </div>

        {/* 2-Column: Specials (Fuori Menu) & 86 (Esauriti) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Specials of the Day */}
          <div className="space-y-2 bg-[#171D2B] p-3.5 rounded-2xl border border-[#273248]">
            <span className="font-semibold text-[#34D399] uppercase tracking-wider flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Piatti Fuori Menu / Specials</span>
            </span>

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Aggiungi piatto..."
                value={newSpecial}
                onChange={(e) => setNewSpecial(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSpecial()}
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#059669]"
              />
              <button
                type="button"
                onClick={addSpecial}
                className="p-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-28 overflow-y-auto">
              {briefing.specialsOfDay.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#059669]/15 text-[#34D399] px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#059669]/30"
                >
                  <span>✨ {item}</span>
                  <button onClick={() => removeSpecial(idx)} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 86'd / Esauriti Items */}
          <div className="space-y-2 bg-[#171D2B] p-3.5 rounded-2xl border border-[#273248]">
            <span className="font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Piatti Esauriti (86 Items)</span>
            </span>

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Piatto esaurito..."
                value={new86}
                onChange={(e) => setNew86(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add86()}
                className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
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
                  className="flex items-center justify-between bg-rose-950/40 text-rose-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-rose-800/40"
                >
                  <span>🚫 {item}</span>
                  <button onClick={() => remove86(idx)} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#222A3C]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Chiudi
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2]" />
            <span>Salva Briefing di Turno</span>
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Award,
  Crown,
  Gift,
  Star,
  Users,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Plus,
  Coins,
  X,
  Trash2,
} from 'lucide-react';

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsRequired: number;
  visitsRequired: number;
  redeemedCount: number;
  status: 'active' | 'paused';
  description: string;
  category: 'drink' | 'dish' | 'discount' | 'vip';
}

const INITIAL_REWARDS: LoyaltyReward[] = [
  {
    id: 'rew_1',
    title: 'Calice di Barolo DOCG di Benvenuto',
    pointsRequired: 200,
    visitsRequired: 3,
    redeemedCount: 88,
    status: 'active',
    description: 'Offerto all’arrivo a tavola per il socio e il suo commensale.',
    category: 'drink',
  },
  {
    id: 'rew_2',
    title: 'Antipasto Storico o Dessert dello Chef in Omaggio',
    pointsRequired: 450,
    visitsRequired: 6,
    redeemedCount: 42,
    status: 'active',
    description: 'A scelta tra Battuta al coltello o Bonet della tradizione piemontese.',
    category: 'dish',
  },
  {
    id: 'rew_3',
    title: 'Tavolo Garantito Senza Attesa (Priorità VIP)',
    pointsRequired: 900,
    visitsRequired: 12,
    redeemedCount: 19,
    status: 'active',
    description: 'Accesso prioritario ai tavoli migliori (Booth G o Privé) anche nei weekend di massima richiesta.',
    category: 'vip',
  },
];

export const BohLoyaltyView: React.FC = () => {
  const { theme, isHighContrast, addToast } = useRestaurant();
  const isLight = theme === 'light';

  const [rewards, setRewards] = useState<LoyaltyReward[]>(INITIAL_REWARDS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for new reward
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardPoints, setRewardPoints] = useState(250);
  const [rewardVisits, setRewardVisits] = useState(3);
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardCategory, setRewardCategory] = useState<LoyaltyReward['category']>('drink');

  const handleCreateReward = () => {
    if (!rewardTitle.trim()) {
      alert('Inserisci il nome del premio');
      return;
    }

    const newReward: LoyaltyReward = {
      id: `rew_${Date.now()}`,
      title: rewardTitle,
      pointsRequired: rewardPoints,
      visitsRequired: rewardVisits,
      redeemedCount: 0,
      status: 'active',
      description: rewardDesc || 'Premio fedeltà riservato ai membri registrati del club.',
      category: rewardCategory,
    };

    setRewards([...rewards, newReward]);
    setIsCreateModalOpen(false);
    setRewardTitle('');
    setRewardDesc('');
    addToast({
      type: 'success',
      title: 'Nuovo Premio Creato!',
      message: `"${newReward.title}" aggiunto al catalogo fedeltà (${newReward.pointsRequired} punti).`,
    });
  };

  const handleDeleteReward = (id: string) => {
    setRewards(rewards.filter((r) => r.id !== id));
    addToast({
      type: 'info',
      title: 'Premio Rimosso',
      message: 'Il premio è stato rimosso dal catalogo.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. MASTER HEADER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-medium">
            <Crown className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Programma Fedeltà, Punti &amp; Membership Club
            </h3>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Crea premi e ricompense automatiche per incentivare visite ricorrenti e premiare i tuoi migliori commensali.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-2xs flex items-center gap-2 cursor-pointer transition active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Crea Nuovo Premio</span>
        </button>
      </div>

      {/* 2. OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
        }`}>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Membri Iscritti al Club</span>
          <span className="text-2xl font-semibold font-mono">482</span>
          <p className="text-[11px] text-slate-500 pt-1">+34 questo mese (+7.6%)</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
        }`}>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Premi Riscattati al Tavolo</span>
          <span className="text-2xl font-semibold font-mono text-emerald-600 dark:text-emerald-400">149</span>
          <p className="text-[11px] text-slate-500 pt-1">Valore generato: €18.400 di ricavi associati</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
        }`}>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Tasso di Ritorno Membri</span>
          <span className="text-2xl font-semibold font-mono text-amber-500">68%</span>
          <p className="text-[11px] text-slate-500 pt-1">Media visite: 3.8x all'anno</p>
        </div>
      </div>

      {/* 3. REWARDS CATALOG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <div
            key={r.id}
            className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col justify-between space-y-3 ${
              isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                  {r.pointsRequired} Punti
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Min. {r.visitsRequired} Visite
                </span>
              </div>

              <h4 className="font-semibold text-sm mt-2">
                {r.title}
              </h4>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {r.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                {r.redeemedCount} riscattati
              </span>
              <button
                type="button"
                onClick={() => handleDeleteReward(r.id)}
                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                title="Elimina premio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE REWARD MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm uppercase">Crea Nuovo Premio Fedeltà</h4>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Nome / Titolo del Premio</label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="Es. Bottiglia di Prosecco Valdobbiadene"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Punti Richiesti</label>
                  <input
                    type="number"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(Number(e.target.value))}
                    min={50}
                    step={50}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Visite Minime</label>
                  <input
                    type="number"
                    value={rewardVisits}
                    onChange={(e) => setRewardVisits(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Categoria Premio</label>
                <select
                  value={rewardCategory}
                  onChange={(e) => setRewardCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                >
                  <option value="drink">Calice / Bevanda di Benvenuto</option>
                  <option value="dish">Piatto / Portata dello Chef in Omaggio</option>
                  <option value="discount">Sconto in Euro sul Conto</option>
                  <option value="vip">Priorità Tavolo &amp; Accesso VIP</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Descrizione del Premio</label>
                <textarea
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  rows={2}
                  placeholder="Spiega all'ospite cosa include e come viene servito al tavolo..."
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleCreateReward}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-xs"
                >
                  Salva &amp; Attiva Premio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

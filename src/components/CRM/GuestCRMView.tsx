import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { guestCrmService } from '../../services/guestCrmService';
import { GuestProfile, VIPTier } from '../../types';
import {
  Users,
  Search,
  Star,
  DollarSign,
  AlertTriangle,
  Calendar,
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Heart,
  Award,
  Crown,
  Sparkles,
  Phone,
  Mail,
  X,
  Check,
  Cake,
  Tag,
  Gift,
  Flame,
  UserCheck,
} from 'lucide-react';

interface GuestCRMViewProps {
  onBookForGuest?: (guest: GuestProfile) => void;
}

const QUICK_DIETARY_OPTIONS = [
  'Senza Glutine (Celiaco)',
  'Lattosio',
  'Frutta Secca',
  'Crostacei / Frutti di Mare',
  'Vegano',
  'Vegetariano',
  'Nichel',
  'Uova',
];

const QUICK_PREFERENCE_OPTIONS = [
  'Preferisce Booth G (VIP)',
  'Tavolo con Vista / Luminoso',
  'Amante Grandi Vini Rossi (Barolo/Brunello)',
  'Seggiolone Bimbo Necessario',
  'Acqua Naturale a Temp. Ambiente',
  'Servizio Molto Discreto / Business',
  'Tavolo Riservato e Silenzioso',
  'Tavolo Spazio Passeggino',
];

const QUICK_TAGS = [
  'VIP 💎',
  'Top Spender',
  'Wine Collector',
  'Regular Storico',
  'Food Critic 📸',
  'Friends & Family 🥂',
  'Business Diner',
  'Local Guide',
];

export const GuestCRMView: React.FC<GuestCRMViewProps> = ({ onBookForGuest }) => {
  const { reservations } = useRestaurant();
  const [profiles, setProfiles] = useState<GuestProfile[]>(() => guestCrmService.getProfiles());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | VIPTier>('all');
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(() => profiles[0] || null);

  // Deletion Confirmation Modal State
  const [guestToDelete, setGuestToDelete] = useState<GuestProfile | null>(null);

  // Form State for editing or creating guest profile
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<GuestProfile>>({
    name: '',
    phone: '',
    email: '',
    vipTier: 'regular',
    dietaryRestrictions: [],
    preferences: [],
    tags: [],
    birthday: '',
    anniversary: '',
    internalNotes: '',
    totalVisits: 1,
    totalSpend: 0,
    avgSpend: 0,
  });

  const [dietaryInput, setDietaryInput] = useState('');
  const [preferenceInput, setPreferenceInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const reloadProfiles = () => {
    const updated = guestCrmService.getProfiles();
    setProfiles(updated);
    if (selectedGuest) {
      const refreshed = updated.find((g: GuestProfile) => g.id === selectedGuest.id);
      setSelectedGuest(refreshed || updated[0] || null);
    } else if (updated.length > 0) {
      setSelectedGuest(updated[0]);
    } else {
      setSelectedGuest(null);
    }
  };

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((g) => {
      // Tier filter
      if (selectedTierFilter !== 'all' && g.vipTier !== selectedTierFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchPhone = g.phone?.toLowerCase().includes(q) || false;
        const matchEmail = g.email?.toLowerCase().includes(q) || false;
        const matchNotes = (g.internalNotes || '').toLowerCase().includes(q);
        const matchDiet = g.dietaryRestrictions.some((d) => d.toLowerCase().includes(q));
        const matchTags = g.tags.some((t) => t.toLowerCase().includes(q));
        const matchPrefs = g.preferences.some((p) => p.toLowerCase().includes(q));
        if (!matchName && !matchPhone && !matchEmail && !matchNotes && !matchDiet && !matchTags && !matchPrefs) {
          return false;
        }
      }
      return true;
    });
  }, [profiles, selectedTierFilter, searchTerm]);

  // Aggregate Metrics
  const totalGuests = profiles.length;
  const vipCount = profiles.filter((g) => g.vipTier === 'vip' || g.vipTier === 'top_spender').length;
  const totalLTV = profiles.reduce((sum, g) => sum + g.totalSpend, 0);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      vipTier: 'regular',
      dietaryRestrictions: [],
      preferences: [],
      tags: ['Regular'],
      birthday: '',
      anniversary: '',
      internalNotes: '',
      totalVisits: 1,
      totalSpend: 75,
      avgSpend: 75,
    });
    setDietaryInput('');
    setPreferenceInput('');
    setTagInput('');
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (guest: GuestProfile) => {
    setFormData({
      name: guest.name,
      phone: guest.phone || '',
      email: guest.email || '',
      vipTier: guest.vipTier,
      dietaryRestrictions: [...guest.dietaryRestrictions],
      preferences: [...guest.preferences],
      tags: [...guest.tags],
      birthday: guest.birthday || '',
      anniversary: guest.anniversary || '',
      internalNotes: guest.internalNotes || '',
      totalVisits: guest.totalVisits || 1,
      totalSpend: guest.totalSpend || 0,
      avgSpend: guest.avgSpend || 0,
    });
    setDietaryInput('');
    setPreferenceInput('');
    setTagInput('');
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleAddDietary = (item: string) => {
    const val = item.trim();
    if (!val) return;
    if (formData.dietaryRestrictions && !formData.dietaryRestrictions.includes(val)) {
      setFormData({
        ...formData,
        dietaryRestrictions: [...formData.dietaryRestrictions, val],
      });
    }
    setDietaryInput('');
  };

  const handleRemoveDietary = (item: string) => {
    setFormData({
      ...formData,
      dietaryRestrictions: (formData.dietaryRestrictions || []).filter((d) => d !== item),
    });
  };

  const handleAddPreference = (item: string) => {
    const val = item.trim();
    if (!val) return;
    if (formData.preferences && !formData.preferences.includes(val)) {
      setFormData({
        ...formData,
        preferences: [...formData.preferences, val],
      });
    }
    setPreferenceInput('');
  };

  const handleRemovePreference = (item: string) => {
    setFormData({
      ...formData,
      preferences: (formData.preferences || []).filter((p) => p !== item),
    });
  };

  const handleAddTag = (item: string) => {
    const val = item.trim();
    if (!val) return;
    if (formData.tags && !formData.tags.includes(val)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, val],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (item: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== item),
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const visits = Math.max(1, Number(formData.totalVisits) || 1);
    const spend = Math.max(0, Number(formData.totalSpend) || 0);
    const calculatedAvg = Math.round(spend / visits);

    if (isEditing && selectedGuest) {
      const updated = guestCrmService.upsertProfile({
        ...selectedGuest,
        ...formData,
        name: formData.name.trim(),
        totalVisits: visits,
        totalSpend: spend,
        avgSpend: calculatedAvg,
      });
      reloadProfiles();
      setSelectedGuest(updated);
    } else {
      const created = guestCrmService.upsertProfile({
        name: formData.name.trim(),
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        vipTier: formData.vipTier || 'regular',
        dietaryRestrictions: formData.dietaryRestrictions || [],
        preferences: formData.preferences || [],
        tags: formData.tags || [],
        birthday: formData.birthday?.trim() || undefined,
        anniversary: formData.anniversary?.trim() || undefined,
        internalNotes: formData.internalNotes?.trim() || '',
        totalVisits: visits,
        totalSpend: spend,
        avgSpend: calculatedAvg,
      });
      reloadProfiles();
      setSelectedGuest(created);
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!guestToDelete) return;
    const remaining = profiles.filter((p) => p.id !== guestToDelete.id);
    guestCrmService.saveProfiles(remaining);
    setGuestToDelete(null);
    reloadProfiles();
  };

  const getTierBadge = (tier: VIPTier) => {
    switch (tier) {
      case 'top_spender':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-950/40 text-amber-300 border border-amber-500/40">
            <Crown className="w-3 h-3 text-amber-400 stroke-[1.5]" />
            Top Spender 💎
          </span>
        );
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40">
            <Star className="w-3 h-3 text-[#C084FC] stroke-[1.5]" />
            VIP Guest ⭐
          </span>
        );
      case 'critic':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-950/40 text-indigo-300 border border-indigo-500/40">
            <Award className="w-3 h-3 text-indigo-400 stroke-[1.5]" />
            Food Critic 📸
          </span>
        );
      case 'friends_family':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-950/40 text-rose-300 border border-rose-500/40">
            <Heart className="w-3 h-3 text-rose-400 stroke-[1.5]" />
            Friends & Family 🥂
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#171D2B] text-slate-300 border border-[#273248]">
            Regular Guest
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-16 text-slate-100">
      
      {/* HEADER & CRM STATS SUMMARY */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-brand font-bold text-lg text-white">
              PRERES Guest Intelligence 360°™
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
              CRM & Hospitality Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dossier completo, preferenze di servizio, storico spese e tracciamento VIP per la massima ospitalità.
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#171D2B] border border-[#273248] px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 block leading-none">Ospiti Profilati</span>
            <span className="text-sm font-bold font-mono text-white">{totalGuests}</span>
          </div>

          <div className="bg-[#171D2B] border border-[#8B31E0]/30 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-[#C084FC] block leading-none">VIP & Top Spenders</span>
            <span className="text-sm font-bold font-mono text-[#C084FC]">{vipCount}</span>
          </div>

          <div className="bg-[#171D2B] border border-[#059669]/30 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-[#34D399] block leading-none">LTV Spesa Totale</span>
            <span className="text-sm font-bold font-mono text-[#34D399]">
              € {totalLTV.toLocaleString('it-IT')}
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>Nuovo Ospite</span>
          </button>
        </div>
      </div>

      {/* CRM TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: SEARCH & GUEST LIST (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Search Bar & Tier Filter */}
          <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-3 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per nome, telefono, allergia o tag..."
                className="w-full bg-[#171D2B] border border-[#273248] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedTierFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedTierFilter === 'all'
                    ? 'bg-[#8B31E0] text-white'
                    : 'bg-[#171D2B] text-slate-400 hover:text-white'
                }`}
              >
                Tutti ({profiles.length})
              </button>
              <button
                onClick={() => setSelectedTierFilter('top_spender')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedTierFilter === 'top_spender'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#171D2B] text-slate-400 hover:text-white'
                }`}
              >
                💎 Top Spenders
              </button>
              <button
                onClick={() => setSelectedTierFilter('vip')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedTierFilter === 'vip'
                    ? 'bg-[#8B31E0] text-white'
                    : 'bg-[#171D2B] text-slate-400 hover:text-white'
                }`}
              >
                ⭐ VIP Guests
              </button>
              <button
                onClick={() => setSelectedTierFilter('critic')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedTierFilter === 'critic'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#171D2B] text-slate-400 hover:text-white'
                }`}
              >
                📸 Food Critics
              </button>
            </div>
          </div>

          {/* Guest Card List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((guest) => {
                const isSelected = selectedGuest?.id === guest.id;
                return (
                  <div
                    key={guest.id}
                    onClick={() => setSelectedGuest(guest)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#171D2B] border-[#8B31E0] shadow-[0_0_16px_rgba(139,49,224,0.25)] ring-1 ring-[#8B31E0]/50'
                        : 'bg-[#121622] border-[#222A3C] hover:border-[#2E3B54] hover:bg-[#151A27]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-xs text-white">{guest.name}</h4>
                          {getTierBadge(guest.vipTier)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          {guest.phone && <span>{guest.phone}</span>}
                          {guest.lastVisitDate && (
                            <>
                              <span>·</span>
                              <span>Ultima: {guest.lastVisitDate}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-[#34D399] block">
                          € {guest.totalSpend.toLocaleString('it-IT')}
                        </span>
                        <span className="text-[9px] text-slate-400">{guest.totalVisits} visite</span>
                      </div>
                    </div>

                    {/* Quick Tags / Dietary */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {guest.dietaryRestrictions.map((d, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-rose-950/40 text-rose-300 border border-rose-800/40"
                        >
                          ⚠️ {d}
                        </span>
                      ))}
                      {guest.tags.slice(0, 2).map((t, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-[#1C2333] text-slate-300 border border-[#273248]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-[#121622] border border-[#222A3C] rounded-2xl text-slate-400">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold">Nessun ospite trovato</p>
                <p className="text-[10px] text-slate-500 mt-1">Prova a modificare i filtri di ricerca</p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: GUEST 360° DOSSIER DETAILS (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedGuest ? (
            <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-5 space-y-5 shadow-sm">
              
              {/* Profile Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#222A3C]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-brand font-bold text-white tracking-tight">
                      {selectedGuest.name}
                    </h3>
                    {getTierBadge(selectedGuest.vipTier)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                    {selectedGuest.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {selectedGuest.phone}
                      </span>
                    )}
                    {selectedGuest.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {selectedGuest.email}
                      </span>
                    )}
                    {selectedGuest.birthday && (
                      <span className="flex items-center gap-1 text-amber-300/90 font-mono text-[11px]">
                        <Cake className="w-3 h-3 text-amber-400" />
                        Compleanno: {selectedGuest.birthday}
                      </span>
                    )}
                    {selectedGuest.anniversary && (
                      <span className="flex items-center gap-1 text-rose-300/90 font-mono text-[11px]">
                        <Gift className="w-3 h-3 text-rose-400" />
                        Anniversario: {selectedGuest.anniversary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(selectedGuest)}
                    className="p-2 bg-[#171D2B] hover:bg-[#222A3C] text-slate-200 border border-[#273248] rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                    title="Modifica scheda completa"
                  >
                    <Edit2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span className="hidden sm:inline">Modifica</span>
                  </button>
                  <button
                    onClick={() => setGuestToDelete(selectedGuest)}
                    className="p-2 bg-rose-950/25 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                    title="Elimina scheda ospite"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span className="hidden sm:inline">Elimina</span>
                  </button>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-[#171D2B] border border-[#273248] p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block leading-none">
                    Totale Speso (LTV)
                  </span>
                  <div className="text-base font-bold font-mono text-[#34D399] mt-1">
                    € {selectedGuest.totalSpend.toLocaleString('it-IT')}
                  </div>
                </div>

                <div className="bg-[#171D2B] border border-[#273248] p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block leading-none">
                    Scontrino Medio
                  </span>
                  <div className="text-base font-bold font-mono text-[#C084FC] mt-1">
                    € {selectedGuest.avgSpend}
                  </div>
                </div>

                <div className="bg-[#171D2B] border border-[#273248] p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block leading-none">
                    Visite Totali
                  </span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {selectedGuest.totalVisits}
                  </div>
                </div>
              </div>

              {/* Tag Badges */}
              {selectedGuest.tags && selectedGuest.tags.length > 0 && (
                <div className="bg-[#171D2B] border border-[#273248] rounded-xl p-3 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Etichette & Profilazione
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedGuest.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1C2333] text-slate-200 border border-[#2E3B54] flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-[#C084FC]" />
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary and Seating Preferences */}
              <div className="space-y-3">
                {/* Dietary Warnings */}
                <div className="bg-[#171D2B] border border-[#273248] rounded-xl p-3 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Allergie & Requisiti Alimentari
                  </span>
                  {selectedGuest.dietaryRestrictions.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedGuest.dietaryRestrictions.map((diet, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/50 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400 stroke-[1.5]" />
                          {diet}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nessuna allergia segnalata.</p>
                  )}
                </div>

                {/* Preferences */}
                {selectedGuest.preferences && selectedGuest.preferences.length > 0 && (
                  <div className="bg-[#171D2B] border border-[#273248] rounded-xl p-3 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Preferenze di Tavolo & Servizio
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedGuest.preferences.map((pref, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#8B31E0]/15 text-[#C084FC] border border-[#8B31E0]/30 flex items-center gap-1"
                        >
                          ✨ {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="bg-[#171D2B] border border-[#273248] rounded-xl p-3 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Note di Servizio del Maître & Note Interne
                  </span>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedGuest.internalNotes || 'Nessuna nota registrata.'}
                  </p>
                </div>
              </div>

              {/* Book Now for this Guest CTA */}
              {onBookForGuest && (
                <div className="pt-2">
                  <button
                    onClick={() => onBookForGuest(selectedGuest)}
                    className="w-full py-2.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2]" />
                    <span>Inserisci Nuova Prenotazione per {selectedGuest.name}</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-12 text-center text-slate-400">
              <p className="text-sm">Seleziona un ospite dalla lista a sinistra per visualizzare il dossier 360°.</p>
            </div>
          )}
        </div>

      </div>

      {/* CONFIRM DELETE MODAL */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/50 border border-rose-800/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Elimina Profilo Ospite</h3>
                <p className="text-xs text-slate-400">Questa operazione rimuove la scheda dal CRM</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#171D2B] p-3 rounded-xl border border-[#273248]">
              Sei sicuro di voler eliminare la scheda di <strong className="text-white">{guestToDelete.name}</strong>? Lo storico visite e le note andranno perse.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setGuestToDelete(null)}
                className="px-4 py-2 bg-[#171D2B] hover:bg-[#222A3C] text-slate-300 rounded-xl text-xs font-semibold border border-[#273248] cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
              >
                Conferma Eliminazione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE CREATE / EDIT GUEST MODAL (ALL PARAMETERS) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 text-slate-100 my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3C]">
              <div>
                <h3 className="text-base font-brand font-bold text-white">
                  {isEditing ? `Modifica Profilo Ospite: ${formData.name}` : 'Nuovo Profilo Ospite nel CRM PRERES™'}
                </h3>
                <p className="text-xs text-slate-400">Compila tutti i parametri di profilazione per il servizio</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1E2536] cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              {/* Row 1: Name & VIP Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nome & Cognome / Intestazione *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Avv. Giorgio Colombo"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Livello VIP & Tier Ospite
                  </label>
                  <select
                    value={formData.vipTier || 'regular'}
                    onChange={(e) => setFormData({ ...formData, vipTier: e.target.value as VIPTier })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0] cursor-pointer"
                  >
                    <option value="regular">Regular Guest</option>
                    <option value="vip">VIP Guest ⭐</option>
                    <option value="top_spender">Top Spender 💎</option>
                    <option value="critic">Food Critic 📸</option>
                    <option value="friends_family">Friends & Family 🥂</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Cellulare / Telefono
                  </label>
                  <input
                    type="tel"
                    placeholder="+39 340 1234567"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Indirizzo Email
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>
              </div>

              {/* Row 3: Birthday & Anniversary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Compleanno (GG-MM)
                  </label>
                  <input
                    type="text"
                    placeholder="Es. 15-05"
                    value={formData.birthday || ''}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Anniversario (GG-MM)
                  </label>
                  <input
                    type="text"
                    placeholder="Es. 22-09"
                    value={formData.anniversary || ''}
                    onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>
              </div>

              {/* Row 4: Historical Visits & Lifetime Spend (LTV) */}
              <div className="grid grid-cols-2 gap-3 bg-[#171D2B] p-3 rounded-2xl border border-[#273248]">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Visite Totali
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalVisits || 1}
                    onChange={(e) => setFormData({ ...formData, totalVisits: Number(e.target.value) })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Spesa Cumulativa (LTV in €)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.totalSpend || 0}
                    onChange={(e) => setFormData({ ...formData, totalSpend: Number(e.target.value) })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>
              </div>

              {/* SECTION: ALLERGIES & DIETARY RESTRICTIONS */}
              <div className="space-y-2 bg-[#171D2B] p-3.5 rounded-2xl border border-[#273248]">
                <label className="block text-[10px] font-semibold text-rose-300 uppercase tracking-wider">
                  ⚠️ Allergie & Requisiti Alimentari
                </label>
                
                {/* Active Badges */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                  {formData.dietaryRestrictions && formData.dietaryRestrictions.length > 0 ? (
                    formData.dietaryRestrictions.map((diet, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/50 text-rose-200 border border-rose-700/60 flex items-center gap-1.5"
                      >
                        <span>{diet}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDietary(diet)}
                          className="text-rose-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Nessuna allergia impostata</span>
                  )}
                </div>

                {/* Custom Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Aggiungi allergia personalizzata..."
                    value={dietaryInput}
                    onChange={(e) => setDietaryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDietary(dietaryInput);
                      }
                    }}
                    className="flex-1 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDietary(dietaryInput)}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    + Aggiungi
                  </button>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="pt-1">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">
                    Suggerimenti Rapidi:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {QUICK_DIETARY_OPTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddDietary(item)}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-[#10141F] hover:bg-[#1E2536] text-slate-300 border border-[#242C3E] transition cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: PREFERENCES & SEATING */}
              <div className="space-y-2 bg-[#171D2B] p-3.5 rounded-2xl border border-[#273248]">
                <label className="block text-[10px] font-semibold text-[#C084FC] uppercase tracking-wider">
                  ✨ Preferenze di Servizio & Tavolo
                </label>
                
                {/* Active Badges */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                  {formData.preferences && formData.preferences.length > 0 ? (
                    formData.preferences.map((pref, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#8B31E0]/20 text-[#E9D5FF] border border-[#8B31E0]/50 flex items-center gap-1.5"
                      >
                        <span>{pref}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePreference(pref)}
                          className="text-[#C084FC] hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Nessuna preferenza impostata</span>
                  )}
                </div>

                {/* Custom Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Aggiungi preferenza personalizzata..."
                    value={preferenceInput}
                    onChange={(e) => setPreferenceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPreference(preferenceInput);
                      }
                    }}
                    className="flex-1 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPreference(preferenceInput)}
                    className="px-3 py-1.5 bg-[#8B31E0]/30 hover:bg-[#8B31E0]/50 border border-[#8B31E0]/60 text-[#E9D5FF] font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    + Aggiungi
                  </button>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="pt-1">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">
                    Suggerimenti Rapidi:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {QUICK_PREFERENCE_OPTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPreference(item)}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-[#10141F] hover:bg-[#1E2536] text-slate-300 border border-[#242C3E] transition cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: TAGS */}
              <div className="space-y-2 bg-[#171D2B] p-3.5 rounded-2xl border border-[#273248]">
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  🏷️ Tag & Profilazione Rapida
                </label>
                
                {/* Active Badges */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                  {formData.tags && formData.tags.length > 0 ? (
                    formData.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C2333] text-slate-200 border border-[#2E3B54] flex items-center gap-1.5"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Nessun tag impostato</span>
                  )}
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nuovo tag (es. Sommelier regular)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    className="flex-1 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="px-3 py-1.5 bg-[#1C2333] hover:bg-[#252E42] border border-[#2E3B54] text-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    + Tag
                  </button>
                </div>

                {/* Quick Tags */}
                <div className="pt-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    {QUICK_TAGS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddTag(item)}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-[#10141F] hover:bg-[#1E2536] text-slate-300 border border-[#242C3E] transition cursor-pointer"
                      >
                        + #{item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: INTERNAL NOTES */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Note Interne del Maître & Direzione
                </label>
                <textarea
                  rows={3}
                  placeholder="Note confidenziali per lo staff di sala (es. cliente abituale del venerdì sera, festeggia anniversario, preferisce pagare con conto aziendale...)"
                  value={formData.internalNotes || ''}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222A3C]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-[#171D2B] hover:bg-[#222A3C] text-slate-300 rounded-xl text-xs font-semibold border border-[#273248] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs shadow-md cursor-pointer transition active:scale-95"
                >
                  {isEditing ? 'Salva Modifiche Profilo' : 'Crea Scheda Ospite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

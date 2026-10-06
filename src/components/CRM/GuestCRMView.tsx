import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { guestCrmService } from '../../services/guestCrmService';
import { GuestProfile, VIPTier, GuestAttentionAlert } from '../../types';
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
  ShieldAlert,
  Bell,
  CheckCircle2,
  Hash,
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
  'Da Attenzionare',
];

export const GuestCRMView: React.FC<GuestCRMViewProps> = ({ onBookForGuest }) => {
  const { reservations, settings, unlinkDeletedGuestProfile } = useRestaurant();
  const [profiles, setProfiles] = useState<GuestProfile[]>(() => guestCrmService.getProfiles());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | VIPTier | 'attention'>('all');
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(() => profiles[0] || null);

  // Deletion Confirmation Modal State
  const [guestToDelete, setGuestToDelete] = useState<GuestProfile | null>(null);

  // Form State for editing or creating guest profile
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<GuestProfile>>({
    firstName: '',
    lastName: '',
    name: '',
    phone: '',
    email: '',
    lastBookingCode: '',
    vipTier: 'regular',
    dietaryRestrictions: [],
    preferences: [],
    tags: [],
    birthday: '',
    anniversary: '',
    internalNotes: '',
    totalVisits: 1,
    totalSpend: 75,
    avgSpend: 75,
    isTopSpender: false,
    enableTopSpenderAlert: false,
    attentionAlert: {
      isAttentionRequired: false,
      alertType: 'positive',
      alertColor: 'green',
      reason: '',
      notifyManagerOnBooking: false,
    },
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
      if (selectedTierFilter === 'attention') {
        if (!g.attentionAlert?.isAttentionRequired) return false;
      } else if (selectedTierFilter !== 'all' && g.vipTier !== selectedTierFilter) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchFirst = g.firstName?.toLowerCase().includes(q) || false;
        const matchLast = g.lastName?.toLowerCase().includes(q) || false;
        const matchCode = g.lastBookingCode?.toLowerCase().includes(q) || false;
        const matchPhone = g.phone?.toLowerCase().includes(q) || false;
        const matchEmail = g.email?.toLowerCase().includes(q) || false;
        const matchNotes = (g.internalNotes || '').toLowerCase().includes(q);
        const matchReason = (g.attentionAlert?.reason || '').toLowerCase().includes(q);
        const matchDiet = g.dietaryRestrictions.some((d) => d.toLowerCase().includes(q));
        const matchTags = g.tags.some((t) => t.toLowerCase().includes(q));
        const matchPrefs = g.preferences.some((p) => p.toLowerCase().includes(q));

        if (
          !matchName &&
          !matchFirst &&
          !matchLast &&
          !matchCode &&
          !matchPhone &&
          !matchEmail &&
          !matchNotes &&
          !matchReason &&
          !matchDiet &&
          !matchTags &&
          !matchPrefs
        ) {
          return false;
        }
      }
      return true;
    });
  }, [profiles, selectedTierFilter, searchTerm]);

  // Aggregate Metrics
  const totalGuests = profiles.length;
  const vipCount = profiles.filter((g) => g.vipTier === 'vip' || g.vipTier === 'top_spender').length;
  const attentionCount = profiles.filter((g) => g.attentionAlert?.isAttentionRequired).length;
  const totalLTV = profiles.reduce((sum, g) => sum + g.totalSpend, 0);

  const handleOpenAdd = () => {
    setFormData({
      firstName: '',
      lastName: '',
      name: '',
      phone: '',
      email: '',
      lastBookingCode: '',
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
      isTopSpender: false,
      enableTopSpenderAlert: false,
      attentionAlert: {
        isAttentionRequired: false,
        alertType: 'positive',
        alertColor: 'green',
        reason: '',
        notifyManagerOnBooking: false,
      },
    });
    setDietaryInput('');
    setPreferenceInput('');
    setTagInput('');
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (guest: GuestProfile) => {
    const nameParts = (guest.name || '').split(' ');
    const fName = guest.firstName || (nameParts.length > 1 ? nameParts[0] : guest.name);
    const lName = guest.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

    setFormData({
      firstName: fName,
      lastName: lName,
      name: guest.name,
      phone: guest.phone || '',
      email: guest.email || '',
      lastBookingCode: guest.lastBookingCode || '',
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
      isTopSpender: guest.isTopSpender || guest.avgSpend >= 130,
      enableTopSpenderAlert: guest.enableTopSpenderAlert ?? false,
      attentionAlert: guest.attentionAlert
        ? { ...guest.attentionAlert }
        : {
            isAttentionRequired: false,
            alertType: 'positive',
            alertColor: 'green',
            reason: '',
            notifyManagerOnBooking: false,
          },
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
    const fName = formData.firstName?.trim() || '';
    const lName = formData.lastName?.trim() || '';
    const fullName = fName && lName ? `${fName} ${lName}` : formData.name?.trim() || `${fName} ${lName}`.trim();

    if (!fullName) return;

    const visits = Math.max(1, Number(formData.totalVisits) || 1);
    const spend = Math.max(0, Number(formData.totalSpend) || 0);
    const calculatedAvg = Math.round(spend / visits);
    const isTop = calculatedAvg >= 130;

    const payload: Partial<GuestProfile> & { name: string } = {
      ...formData,
      firstName: fName,
      lastName: lName,
      name: fullName,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      lastBookingCode: formData.lastBookingCode?.trim() || undefined,
      totalVisits: visits,
      totalSpend: spend,
      avgSpend: calculatedAvg,
      isTopSpender: isTop,
      vipTier: isTop && formData.vipTier === 'regular' ? 'top_spender' : (formData.vipTier || 'regular'),
      enableTopSpenderAlert: Boolean(formData.enableTopSpenderAlert),
      attentionAlert: formData.attentionAlert?.isAttentionRequired
        ? {
            ...formData.attentionAlert,
            updatedAt: new Date().toISOString(),
          }
        : undefined,
    };

    if (isEditing && selectedGuest) {
      const updated = guestCrmService.upsertProfile({
        ...selectedGuest,
        ...payload,
      });
      reloadProfiles();
      setSelectedGuest(updated);
    } else {
      const created = guestCrmService.upsertProfile(payload);
      reloadProfiles();
      setSelectedGuest(created);
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!guestToDelete) return;
    const targetId = guestToDelete.id;
    await guestCrmService.deleteProfile(targetId);
    unlinkDeletedGuestProfile(targetId);
    setGuestToDelete(null);
    reloadProfiles();
  };

  const toggleTopSpenderAlert = (guest: GuestProfile) => {
    const updated = guestCrmService.upsertProfile({
      ...guest,
      enableTopSpenderAlert: !guest.enableTopSpenderAlert,
    });
    reloadProfiles();
    setSelectedGuest(updated);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/40">
            <Heart className="w-3 h-3 text-emerald-400 stroke-[1.5]" />
            Friends & Family 🥂
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#1C2333] text-slate-300 border border-[#273248]">
            Regular Guest
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-12 text-slate-100">
      {/* HEADER WITH KPIS & ADD BUTTON */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#171D2B] border border-[#273248] text-[#C084FC] flex items-center justify-center font-bold shadow-xs">
              <Users className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">
                Preres Guest Intelligence 360™
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C084FC]">
                CRM Ospiti, Tracciamento Dettagliato & Alert Manager
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dossier completo: Nome, Cognome, Telefono, Email, N° Prenotazione, Alert a colori e Soglia Top Spender.
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#171D2B] border border-[#273248] px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 block leading-none">Ospiti Totali</span>
            <span className="text-sm font-bold font-mono text-white">{totalGuests}</span>
          </div>

          <div className="bg-[#171D2B] border border-amber-500/30 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-amber-300 block leading-none">VIP & Top Spenders</span>
            <span className="text-sm font-bold font-mono text-amber-400">{vipCount}</span>
          </div>

          <div className="bg-[#171D2B] border border-rose-500/30 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-rose-300 block leading-none">Da Attenzionare</span>
            <span className="text-sm font-bold font-mono text-rose-400">{attentionCount}</span>
          </div>

          <div className="bg-[#171D2B] border border-[#059669]/30 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-[#34D399] block leading-none">LTV Spesa Complessiva</span>
            <span className="text-sm font-bold font-mono text-[#34D399]">
              € {totalLTV.toLocaleString('it-IT')}
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuovo Profilo Ospite</span>
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
                placeholder="Cerca per nome, cognome, N° pren, tel, email..."
                className="w-full bg-[#171D2B] border border-[#273248] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
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
                onClick={() => setSelectedTierFilter('attention')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedTierFilter === 'attention'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-[#171D2B] text-rose-400 hover:text-rose-300'
                }`}
              >
                ⚠️ Da Attenzionare ({attentionCount})
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
                ⭐ VIP
              </button>
            </div>
          </div>

          {/* Guest Card List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((guest) => {
                const isSelected = selectedGuest?.id === guest.id;
                const hasAlert = guest.attentionAlert?.isAttentionRequired;
                const alertIsRed = guest.attentionAlert?.alertColor === 'red';
                const isTopSpender = guest.isTopSpender || guest.avgSpend >= 130;

                return (
                  <div
                    key={guest.id}
                    onClick={() => setSelectedGuest(guest)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-[#8B31E0] bg-[#8B31E0]/15 ring-2 ring-[#8B31E0]/30 shadow-md'
                        : 'border-[#222A3C] bg-[#121622] hover:border-[#8B31E0]/50 hover:bg-[#151A26]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <strong className="text-xs text-white font-semibold truncate">
                          {guest.name}
                        </strong>
                        {hasAlert && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              alertIsRed ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                            }`}
                            title={guest.attentionAlert?.reason}
                          />
                        )}
                        {isTopSpender && (
                          <span className="text-[10px]" title="Top Spender (>=130€)">
                            💎
                          </span>
                        )}
                      </div>
                      {getTierBadge(guest.vipTier)}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{guest.phone || guest.email || 'Nessun contatto'}</span>
                      <span className="text-slate-200">
                        {guest.totalVisits} vis. · <strong className="text-[#34D399]">€{guest.avgSpend} avg</strong>
                      </span>
                    </div>

                    {guest.lastBookingCode && (
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#C084FC]" />
                        <span>Ultima prenotazione: <strong className="text-slate-300">{guest.lastBookingCode}</strong></span>
                      </div>
                    )}

                    {hasAlert && (
                      <div
                        className={`text-[10px] px-2 py-0.5 rounded-lg border truncate font-medium ${
                          alertIsRed
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                        }`}
                      >
                        {alertIsRed ? '🔴 ATTENZIONE: ' : '🟢 NOTA SPECIALE: '}
                        {guest.attentionAlert?.reason}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-[#121622] border border-[#222A3C] rounded-2xl text-slate-400">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold">Nessun ospite trovato</p>
                <p className="text-[10px] text-slate-500 mt-1">Modifica i criteri di ricerca</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: GUEST 360° DOSSIER DETAILS (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedGuest ? (
            <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              {/* Profile Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#222A3C]">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-brand font-bold text-white tracking-tight">
                      {selectedGuest.name}
                    </h3>
                    {getTierBadge(selectedGuest.vipTier)}
                  </div>

                  {/* Detailed Personal Tracking Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300 mt-2.5 pt-2 border-t border-[#222A3C]/70">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Nome:</span>
                      <strong className="text-white font-medium">{selectedGuest.firstName || selectedGuest.name}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Cognome:</span>
                      <strong className="text-white font-medium">{selectedGuest.lastName || '—'}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{selectedGuest.phone || 'Non specificato'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{selectedGuest.email || 'Non specificata'}</span>
                    </div>
                    {selectedGuest.lastBookingCode && (
                      <div className="flex items-center gap-1.5 sm:col-span-2 text-[#C084FC] font-mono text-[11px]">
                        <Hash className="w-3 h-3" />
                        <span>N° Ultima Prenotazione: <strong>{selectedGuest.lastBookingCode}</strong></span>
                      </div>
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
                    title="Elimina definitivamente scheda ospite"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span className="hidden sm:inline">Elimina</span>
                  </button>
                </div>
              </div>

              {/* MANAGER ATTENTION ALERT BANNER (IF ACTIVE) */}
              {selectedGuest.attentionAlert?.isAttentionRequired && (
                <div
                  className={`rounded-2xl p-4 border-2 space-y-1.5 animate-in fade-in ${
                    selectedGuest.attentionAlert.alertColor === 'red'
                      ? 'bg-rose-950/30 border-rose-600/70 shadow-[0_0_16px_rgba(225,29,72,0.25)]'
                      : 'bg-emerald-950/30 border-emerald-600/70 shadow-[0_0_16px_rgba(5,150,105,0.25)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedGuest.attentionAlert.alertColor === 'red' ? (
                        <ShieldAlert className="w-5 h-5 text-rose-400 stroke-[2]" />
                      ) : (
                        <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      )}
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          selectedGuest.attentionAlert.alertColor === 'red'
                            ? 'text-rose-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {selectedGuest.attentionAlert.alertColor === 'red'
                          ? '🚨 Ospite da Attenzionare (Motivo Critico / Esigente)'
                          : '🌟 Ospite da Attenzionare (Motivo Positivo / VIP Speciale)'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedGuest.attentionAlert.alertColor === 'red'
                          ? 'bg-rose-900/50 text-rose-200 border-rose-700'
                          : 'bg-emerald-900/50 text-emerald-200 border-emerald-700'
                      }`}
                    >
                      {selectedGuest.attentionAlert.alertColor === 'red' ? 'ALERT ROSSO' : 'ALERT VERDE'}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed font-medium ${
                      selectedGuest.attentionAlert.alertColor === 'red'
                        ? 'text-rose-100'
                        : 'text-emerald-100'
                    }`}
                  >
                    "{selectedGuest.attentionAlert.reason}"
                  </p>

                  {selectedGuest.attentionAlert.notifyManagerOnBooking && (
                    <div className="text-[10px] pt-1 flex items-center gap-1.5 opacity-90 font-medium">
                      <Bell className="w-3 h-3" />
                      <span>Notifica visiva attiva per il Manager alla creazione della prossima prenotazione.</span>
                    </div>
                  )}
                </div>
              )}

              {/* TOP SPENDER THRESHOLD BAR & MANUAL MANAGER ALERT TOGGLE */}
              {(selectedGuest.isTopSpender || selectedGuest.avgSpend >= 130) && (
                <div className="bg-[#171D2B] border border-amber-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-300">
                          Soglia VIP Top Spender Raggiunta
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-600/40 font-bold">
                          €{selectedGuest.avgSpend}/pax ≥ 130€
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Spesa media pro-capite superiore al doppio della soglia base (65€ x 2 = 130€).
                      </p>
                    </div>
                  </div>

                  {/* Manual Alert Toggle by Manager */}
                  <button
                    type="button"
                    onClick={() => toggleTopSpenderAlert(selectedGuest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0 active:scale-95 ${
                      selectedGuest.enableTopSpenderAlert
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-[#10141F] text-slate-400 border-[#242C3E] hover:text-white'
                    }`}
                  >
                    {selectedGuest.enableTopSpenderAlert
                      ? '🔔 Alert Visivo Manager: ATTIVO'
                      : '🔕 Alert Visivo Manager: DISATTIVO'}
                  </button>
                </div>
              )}

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-2xl text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block leading-none">
                    Totale Speso (LTV)
                  </span>
                  <div className="text-base font-bold font-mono text-[#34D399] mt-1">
                    € {selectedGuest.totalSpend.toLocaleString('it-IT')}
                  </div>
                </div>

                <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-2xl text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block leading-none">
                    Scontrino Medio Pro-Capite
                  </span>
                  <div className="text-base font-bold font-mono text-[#C084FC] mt-1">
                    € {selectedGuest.avgSpend}
                  </div>
                </div>

                <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-2xl text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block leading-none">
                    Visite Totali
                  </span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {selectedGuest.totalVisits}
                  </div>
                </div>
              </div>

              {/* Dietary Warnings */}
              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-3.5 space-y-1.5">
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
                  <span className="text-xs text-slate-500 italic">Nessuna allergia segnalata</span>
                )}
              </div>

              {/* Preferences */}
              <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Preferenze Tavolo & Servizio
                </span>
                {selectedGuest.preferences.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedGuest.preferences.map((pref, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1C2333] text-[#E9D5FF] border border-[#8B31E0]/30"
                      >
                        ★ {pref}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">Nessuna preferenza registrata</span>
                )}
              </div>

              {/* Internal Notes */}
              {selectedGuest.internalNotes && (
                <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Note Riservate Maître / Direzione
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{selectedGuest.internalNotes}"
                  </p>
                </div>
              )}

              {/* Book Now Button */}
              {onBookForGuest && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onBookForGuest(selectedGuest)}
                    className="w-full py-2.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs shadow-md shadow-[#8B31E0]/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2]" />
                    <span>Prenota Subito per {selectedGuest.name}</span>
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

      {/* CONFIRM DEFINITIVE DELETE MODAL */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/50 border border-rose-800/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Elimina Definitivamente Ospite</h3>
                <p className="text-xs text-slate-400">Operazione irreversibile su PRERES Guest Intelligence</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#171D2B] p-3 rounded-xl border border-[#273248]">
              Sei sicuro di voler eliminare la scheda di <strong className="text-white">{guestToDelete.name}</strong>? Lo storico visite, le preferenze e gli alert andranno eliminati definitivamente.
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

      {/* COMPLETE CREATE / EDIT GUEST MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 text-slate-100 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3C]">
              <div>
                <h3 className="text-base font-brand font-bold text-white">
                  {isEditing ? `Modifica Scheda: ${formData.name}` : 'Nuovo Profilo in Guest Intelligence 360'}
                </h3>
                <p className="text-xs text-slate-400">
                  Dati anagrafici, tracciamento, alert personalizzati e impostazioni manager
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1E2536] cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Row 1: Nome e Cognome distinti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Giorgio"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Colombo"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>
              </div>

              {/* Row 2: Phone, Email e Numero Prenotazione */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Telefono / Cellulare
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

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    N° Prenotazione Collegato
                  </label>
                  <input
                    type="text"
                    placeholder="Es. ST-8821"
                    value={formData.lastBookingCode || ''}
                    onChange={(e) => setFormData({ ...formData, lastBookingCode: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>
              </div>

              {/* SECTION: MANAGER ATTENTION ALERT SYSTEM */}
              <div className="bg-[#171D2B] p-4 rounded-2xl border border-[#273248] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Sistema di Alert / Attenzionamento Manager
                    </label>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.attentionAlert?.isAttentionRequired)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          attentionAlert: {
                            isAttentionRequired: e.target.checked,
                            alertType: formData.attentionAlert?.alertType || 'positive',
                            alertColor: formData.attentionAlert?.alertColor || 'green',
                            reason: formData.attentionAlert?.reason || '',
                            notifyManagerOnBooking: formData.attentionAlert?.notifyManagerOnBooking ?? true,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#10141F] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B31E0]"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-200">
                      {formData.attentionAlert?.isAttentionRequired ? 'ATTIVO' : 'DISATTIVO'}
                    </span>
                  </label>
                </div>

                {formData.attentionAlert?.isAttentionRequired && (
                  <div className="space-y-3 pt-2 border-t border-[#222A3C] animate-in fade-in">
                    {/* Alert Color Code Selection: Green vs Red */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Codice Colore & Tipologia di Alert
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              attentionAlert: {
                                ...formData.attentionAlert!,
                                alertType: 'positive',
                                alertColor: 'green',
                              },
                            })
                          }
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                            formData.attentionAlert?.alertColor === 'green'
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                              : 'bg-[#10141F] border-[#242C3E] text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                          <div>
                            <span className="block text-xs">🟢 VERDE (Positivo / Speciale)</span>
                            <span className="text-[10px] opacity-80 font-normal">Amico di casa, VIP, omaggiare calice</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              attentionAlert: {
                                ...formData.attentionAlert!,
                                alertType: 'negative',
                                alertColor: 'red',
                              },
                            })
                          }
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                            formData.attentionAlert?.alertColor === 'red'
                              ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-2 ring-rose-500/30 font-bold'
                              : 'bg-[#10141F] border-[#242C3E] text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                          <div>
                            <span className="block text-xs">🔴 ROSSO (Critico / Difficile)</span>
                            <span className="text-[10px] opacity-80 font-normal">Esigente sui tempi, critico, cura extra</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Motivazione Specifica dell'Alert (Visibile allo Staff/Manager)
                      </label>
                      <input
                        type="text"
                        required={formData.attentionAlert?.isAttentionRequired}
                        placeholder="Es. Ospite esigente sui tempi del servizio / Amico personale del titolare..."
                        value={formData.attentionAlert?.reason || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            attentionAlert: {
                              ...formData.attentionAlert!,
                              reason: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                      />
                    </div>

                    {/* Notify Manager on Booking checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.attentionAlert?.notifyManagerOnBooking)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            attentionAlert: {
                              ...formData.attentionAlert!,
                              notifyManagerOnBooking: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-[#242C3E] bg-[#10141F] text-[#8B31E0] focus:ring-[#8B31E0]"
                      />
                      <span className="text-xs text-slate-300 font-medium">
                        Mostra banner visivo di Alert al Manager alla successiva prenotazione
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Row 4: Historical Visits & Lifetime Spend (LTV) + TOP SPENDER TOGGLE */}
              <div className="bg-[#171D2B] p-4 rounded-2xl border border-[#273248] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Visite Totali
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalVisits || 1}
                      onChange={(e) => setFormData({ ...formData, totalVisits: Number(e.target.value) })}
                      className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
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
                      className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                    />
                  </div>
                </div>

                {/* Top Spender Manual Alert Toggle */}
                <div className="p-3 bg-[#10141F] border border-[#242C3E] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Alert Visivo "VIP Top Spender" per il Manager
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Soglia calcolata automatica: ≥ 130€ pro-capite (doppio di 65€).
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.enableTopSpenderAlert)}
                      onChange={(e) => setFormData({ ...formData, enableTopSpenderAlert: e.target.checked })}
                      className="rounded border-[#242C3E] bg-[#171D2B] text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-amber-300">
                      {formData.enableTopSpenderAlert ? 'Attivo' : 'Disattivato'}
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION: ALLERGIES & DIETARY RESTRICTIONS */}
              <div className="space-y-2 bg-[#171D2B] p-3.5 rounded-2xl border border-[#273248]">
                <label className="block text-[10px] font-semibold text-rose-300 uppercase tracking-wider">
                  ⚠️ Allergie & Requisiti Alimentari
                </label>
                <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                  {formData.dietaryRestrictions && formData.dietaryRestrictions.length > 0 ? (
                    formData.dietaryRestrictions.map((diet, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/50 flex items-center gap-1.5"
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
                    <span className="text-[11px] text-slate-500 italic">Nessuna allergia specificata</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Aggiungi allergia (es. Celiaco)..."
                    value={dietaryInput}
                    onChange={(e) => setDietaryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDietary(dietaryInput);
                      }
                    }}
                    className="flex-1 bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDietary(dietaryInput)}
                    className="px-3 py-1.5 bg-[#1C2333] hover:bg-[#252E42] border border-[#2E3B54] text-rose-300 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    + Aggiungi
                  </button>
                </div>
              </div>

              {/* SECTION: INTERNAL NOTES */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Note Interne del Maître & Direzione
                </label>
                <textarea
                  rows={3}
                  placeholder="Note confidenziali per lo staff di sala..."
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

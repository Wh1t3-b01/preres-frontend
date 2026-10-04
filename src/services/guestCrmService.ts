import { GuestProfile, VIPTier, Reservation } from '../types';

const CRM_STORAGE_KEY = 'sotto_guest_crm_profiles';

export const INITIAL_GUEST_PROFILES: GuestProfile[] = [
  {
    id: 'guest_1',
    name: 'Avv. Giorgio Colombo',
    phone: '+39 340 1234567',
    email: 'g.colombo@studiolegale.it',
    vipTier: 'top_spender',
    dietaryRestrictions: ['Senza Frutta Secca'],
    preferences: ['Preferisce Tavolo G (Booth VIP)', 'Ama vini piemontesi (Barolo)', 'Servizio discreto'],
    internalNotes: 'Cliente abituale per pranzi e cene di lavoro importanti. Sommelier dedicato.',
    birthday: '04-12',
    totalVisits: 14,
    totalSpend: 3450,
    avgSpend: 246,
    lastVisitDate: '2026-09-28',
    noShowCount: 0,
    cancellationCount: 1,
    tags: ['VIP 💎', 'Top Spender', 'Wine Lover', 'Booth Regular'],
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-09-28T22:30:00Z',
  },
  {
    id: 'guest_2',
    name: 'Dott.ssa Elena Moretti',
    phone: '+39 333 9876543',
    email: 'elena.moretti@clinica.it',
    vipTier: 'vip',
    dietaryRestrictions: ['Celiaca (Senza Glutine)'],
    preferences: ['Acqua naturale a temp. ambiente', 'Tavolo luminoso'],
    internalNotes: 'Attenzione massima alle contaminazioni da glutine in cucina.',
    birthday: '11-05',
    totalVisits: 8,
    totalSpend: 1120,
    avgSpend: 140,
    lastVisitDate: '2026-09-15',
    noShowCount: 0,
    cancellationCount: 0,
    tags: ['⭐ VIP', 'Celiaco Severo', 'Privé Lover'],
    createdAt: '2026-02-14T18:00:00Z',
    updatedAt: '2026-09-15T21:00:00Z',
  },
  {
    id: 'guest_3',
    name: 'Famiglia De Luca',
    phone: '+39 347 5551234',
    email: 'deluca.marco@gmail.com',
    vipTier: 'regular',
    dietaryRestrictions: ['Lattosio'],
    preferences: ['Seggiolone bimbo necessario', 'Pranzo domenicale'],
    internalNotes: 'Famiglia con bambino piccolo, preferiscono tavoli comodi con spazio per passeggino (Tavolo 20 o 21).',
    totalVisits: 5,
    totalSpend: 620,
    avgSpend: 124,
    lastVisitDate: '2026-09-22',
    noShowCount: 0,
    cancellationCount: 0,
    tags: ['Regular', 'Famiglia', 'Seggiolone'],
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-09-22T15:00:00Z',
  },
];

export const guestCrmService = {
  getProfiles(): GuestProfile[] {
    const saved = localStorage.getItem(CRM_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse guest CRM profiles', e);
      }
    }
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(INITIAL_GUEST_PROFILES));
    return INITIAL_GUEST_PROFILES;
  },

  saveProfiles(profiles: GuestProfile[]): void {
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(profiles));
  },

  searchGuests(query: string): GuestProfile[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    const profiles = this.getProfiles();
    return profiles.filter(
      (g) =>
        g.name.toLowerCase().includes(clean) ||
        (g.phone && g.phone.includes(clean)) ||
        (g.email && g.email.toLowerCase().includes(clean)) ||
        g.tags.some((t) => t.toLowerCase().includes(clean)) ||
        g.dietaryRestrictions.some((d) => d.toLowerCase().includes(clean))
    );
  },

  getProfileById(id: string): GuestProfile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  },

  getProfileByNameOrPhone(name: string, phone?: string): GuestProfile | undefined {
    const profiles = this.getProfiles();
    const cleanName = name.trim().toLowerCase();
    const cleanPhone = phone?.trim();

    return profiles.find((p) => {
      if (cleanPhone && p.phone && p.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')) {
        return true;
      }
      return p.name.toLowerCase() === cleanName;
    });
  },

  upsertProfile(profileData: Partial<GuestProfile> & { name: string }): GuestProfile {
    const profiles = this.getProfiles();
    let existing = profileData.id ? profiles.find((p) => p.id === profileData.id) : undefined;

    if (!existing && profileData.phone) {
      existing = profiles.find((p) => p.phone === profileData.phone);
    }
    if (!existing) {
      existing = profiles.find((p) => p.name.toLowerCase() === profileData.name.trim().toLowerCase());
    }

    const now = new Date().toISOString();

    if (existing) {
      const updated: GuestProfile = {
        ...existing,
        ...profileData,
        name: profileData.name.trim() || existing.name,
        updatedAt: now,
      };
      const newProfiles = profiles.map((p) => (p.id === existing!.id ? updated : p));
      this.saveProfiles(newProfiles);
      return updated;
    } else {
      const newProfile: GuestProfile = {
        id: profileData.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: profileData.name.trim(),
        phone: profileData.phone || '',
        email: profileData.email || '',
        vipTier: profileData.vipTier || 'regular',
        dietaryRestrictions: profileData.dietaryRestrictions || [],
        preferences: profileData.preferences || [],
        internalNotes: profileData.internalNotes || '',
        birthday: profileData.birthday,
        anniversary: profileData.anniversary,
        totalVisits: profileData.totalVisits || 1,
        totalSpend: profileData.totalSpend || 0,
        avgSpend: profileData.avgSpend || 0,
        lastVisitDate: profileData.lastVisitDate || new Date().toISOString().split('T')[0],
        noShowCount: profileData.noShowCount || 0,
        cancellationCount: profileData.cancellationCount || 0,
        tags: profileData.tags || [],
        createdAt: now,
        updatedAt: now,
      };
      profiles.unshift(newProfile);
      this.saveProfiles(profiles);
      return newProfile;
    }
  },

  recordVisitCompleted(guestName: string, guestPhone?: string, estimatedSpend: number = 70): void {
    const profile = this.getProfileByNameOrPhone(guestName, guestPhone);
    if (profile) {
      const totalVisits = profile.totalVisits + 1;
      const totalSpend = profile.totalSpend + estimatedSpend;
      const avgSpend = Math.round(totalSpend / totalVisits);
      this.upsertProfile({
        ...profile,
        totalVisits,
        totalSpend,
        avgSpend,
        lastVisitDate: new Date().toISOString().split('T')[0],
      });
    } else {
      this.upsertProfile({
        name: guestName,
        phone: guestPhone,
        totalVisits: 1,
        totalSpend: estimatedSpend,
        avgSpend: estimatedSpend,
        vipTier: 'regular',
      });
    }
  },
};

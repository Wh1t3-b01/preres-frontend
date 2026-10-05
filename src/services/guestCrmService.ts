import { GuestProfile, VIPTier, GuestAttentionAlert } from '../types';

const CRM_STORAGE_KEY = 'sotto_guest_crm_profiles';
const TOP_SPENDER_THRESHOLD_PRO_CAPITE = 130; // Threshold: 65€ * 2 = 130€

export const INITIAL_GUEST_PROFILES: GuestProfile[] = [
  {
    id: 'guest_1',
    firstName: 'Giorgio',
    lastName: 'Colombo',
    name: 'Avv. Giorgio Colombo',
    phone: '+39 340 1234567',
    email: 'g.colombo@studiolegale.it',
    lastBookingCode: 'ST-8821',
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
    isTopSpender: true,
    enableTopSpenderAlert: true,
    attentionAlert: {
      isAttentionRequired: true,
      alertType: 'positive',
      alertColor: 'green',
      reason: 'Cliente Top Spender e amico storico della casa. Offrire sempre calice di benvenuto Barolo Cru.',
      notifyManagerOnBooking: true,
    },
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-09-28T22:30:00Z',
  },
  {
    id: 'guest_2',
    firstName: 'Elena',
    lastName: 'Moretti',
    name: 'Dott.ssa Elena Moretti',
    phone: '+39 333 9876543',
    email: 'elena.moretti@clinica.it',
    lastBookingCode: 'ST-9104',
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
    isTopSpender: true,
    enableTopSpenderAlert: false,
    attentionAlert: {
      isAttentionRequired: true,
      alertType: 'positive',
      alertColor: 'green',
      reason: 'VIP & Celiaca severa. Verificare preventivamente con lo chef la linea gluten-free.',
      notifyManagerOnBooking: true,
    },
    createdAt: '2026-02-14T18:00:00Z',
    updatedAt: '2026-09-15T21:00:00Z',
  },
  {
    id: 'guest_3',
    firstName: 'Marco',
    lastName: 'De Luca',
    name: 'Famiglia De Luca',
    phone: '+39 347 5551234',
    email: 'deluca.marco@gmail.com',
    lastBookingCode: 'ST-7432',
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
    isTopSpender: false,
    enableTopSpenderAlert: false,
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-09-22T15:00:00Z',
  },
  {
    id: 'guest_4',
    firstName: 'Roberto',
    lastName: 'Vannini',
    name: 'Roberto Vannini',
    phone: '+39 320 8899001',
    email: 'roberto.vannini@libero.it',
    lastBookingCode: 'ST-6319',
    vipTier: 'regular',
    dietaryRestrictions: [],
    preferences: ['Servizio rapidissimo', 'Tavolo isolato'],
    internalNotes: 'Cliente molto critico sui tempi di attesa e sui conti. Richiede massima precisione.',
    totalVisits: 3,
    totalSpend: 280,
    avgSpend: 93,
    lastVisitDate: '2026-08-14',
    noShowCount: 1,
    cancellationCount: 2,
    tags: ['Da Attenzionare', 'Esigente'],
    isTopSpender: false,
    enableTopSpenderAlert: false,
    attentionAlert: {
      isAttentionRequired: true,
      alertType: 'negative',
      alertColor: 'red',
      reason: 'Ospite molto critico e suscettibile sui tempi di attesa e servizio. Seguire con cameriere senior e massima cura.',
      notifyManagerOnBooking: true,
    },
    createdAt: '2026-04-18T19:00:00Z',
    updatedAt: '2026-08-14T21:30:00Z',
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

  deleteProfile(id: string): boolean {
    const profiles = this.getProfiles();
    const remaining = profiles.filter((p) => p.id !== id);
    if (remaining.length === profiles.length) return false;
    this.saveProfiles(remaining);
    return true;
  },

  searchGuests(query: string): GuestProfile[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    const profiles = this.getProfiles();
    return profiles.filter(
      (g) =>
        g.name.toLowerCase().includes(clean) ||
        (g.firstName && g.firstName.toLowerCase().includes(clean)) ||
        (g.lastName && g.lastName.toLowerCase().includes(clean)) ||
        (g.lastBookingCode && g.lastBookingCode.toLowerCase().includes(clean)) ||
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

    const visits = Math.max(1, profileData.totalVisits || (existing?.totalVisits ?? 1));
    const spend = Math.max(0, profileData.totalSpend ?? (existing?.totalSpend ?? 0));
    const avg = Math.round(spend / visits);
    const isTop = avg >= TOP_SPENDER_THRESHOLD_PRO_CAPITE;

    // Derived or explicit firstName/lastName
    const fullName = profileData.name.trim() || existing?.name || '';
    const nameParts = fullName.split(' ');
    const firstName = profileData.firstName || (nameParts.length > 1 ? nameParts[0] : fullName);
    const lastName = profileData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

    if (existing) {
      const updated: GuestProfile = {
        ...existing,
        ...profileData,
        firstName,
        lastName,
        name: fullName,
        totalVisits: visits,
        totalSpend: spend,
        avgSpend: avg,
        isTopSpender: isTop,
        vipTier: isTop && profileData.vipTier === 'regular' ? 'top_spender' : (profileData.vipTier || existing.vipTier),
        updatedAt: now,
      };
      const newProfiles = profiles.map((p) => (p.id === existing!.id ? updated : p));
      this.saveProfiles(newProfiles);
      return updated;
    } else {
      const newProfile: GuestProfile = {
        id: profileData.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        firstName,
        lastName,
        name: fullName,
        phone: profileData.phone || '',
        email: profileData.email || '',
        lastBookingCode: profileData.lastBookingCode,
        vipTier: isTop ? 'top_spender' : (profileData.vipTier || 'regular'),
        dietaryRestrictions: profileData.dietaryRestrictions || [],
        preferences: profileData.preferences || [],
        internalNotes: profileData.internalNotes || '',
        birthday: profileData.birthday,
        anniversary: profileData.anniversary,
        totalVisits: visits,
        totalSpend: spend,
        avgSpend: avg,
        isTopSpender: isTop,
        enableTopSpenderAlert: profileData.enableTopSpenderAlert ?? false,
        attentionAlert: profileData.attentionAlert,
        lastVisitDate: profileData.lastVisitDate || new Date().toISOString().split('T')[0],
        noShowCount: profileData.noShowCount || 0,
        cancellationCount: profileData.cancellationCount || 0,
        tags: profileData.tags || (isTop ? ['Top Spender'] : []),
        createdAt: now,
        updatedAt: now,
      };
      profiles.unshift(newProfile);
      this.saveProfiles(profiles);
      return newProfile;
    }
  },

  recordVisitCompleted(
    guestName: string,
    guestPhone?: string,
    estimatedSpend: number = 70,
    bookingCode?: string
  ): void {
    const profile = this.getProfileByNameOrPhone(guestName, guestPhone);
    if (profile) {
      const totalVisits = profile.totalVisits + 1;
      const totalSpend = profile.totalSpend + estimatedSpend;
      const avgSpend = Math.round(totalSpend / totalVisits);
      this.upsertProfile({
        ...profile,
        lastBookingCode: bookingCode || profile.lastBookingCode,
        totalVisits,
        totalSpend,
        avgSpend,
        lastVisitDate: new Date().toISOString().split('T')[0],
      });
    } else {
      this.upsertProfile({
        name: guestName,
        phone: guestPhone,
        lastBookingCode: bookingCode,
        totalVisits: 1,
        totalSpend: estimatedSpend,
        avgSpend: estimatedSpend,
        vipTier: estimatedSpend >= TOP_SPENDER_THRESHOLD_PRO_CAPITE ? 'top_spender' : 'regular',
      });
    }
  },
};

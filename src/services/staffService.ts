import { StaffMember, StaffRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { realtimeSync } from '../utils/realtimeSync';

const STAFF_STORAGE_KEY = 'sotto_staff_members_db';

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff_simone',
    firstName: 'Simone',
    lastName: 'Rinaldi',
    fullName: 'Simone Rinaldi',
    email: 'simone.waiter@sottosotto.it',
    role: 'waiter',
    isActive: true,
    pinCode: '1234',
    createdAt: '2026-01-15T10:00:00Z',
    lastLoginAt: '2026-10-05T08:30:00Z',
    stats: {
      tablesServedCount: 142,
      totalRevenueGenerated: 14850,
      voidCount: 2,
      topSellerItem: 'Filetto di Manzo al Barolo',
      lowSellerItem: 'Risotto agli Asparagi',
    },
  },
  {
    id: 'staff_marco',
    firstName: 'Marco',
    lastName: 'Gentili',
    fullName: 'Marco Gentili',
    email: 'marco.waiter@sottosotto.it',
    role: 'waiter',
    isActive: true,
    pinCode: '5678',
    createdAt: '2026-02-01T10:00:00Z',
    lastLoginAt: '2026-10-04T19:00:00Z',
    stats: {
      tablesServedCount: 118,
      totalRevenueGenerated: 11420,
      voidCount: 4,
      topSellerItem: 'Tagliata di Fassona',
      lowSellerItem: 'Insalata di Mare',
    },
  },
  {
    id: 'staff_chiara',
    firstName: 'Chiara',
    lastName: 'Valli',
    fullName: 'Chiara Valli',
    email: 'chiara.waiter@sottosotto.it',
    role: 'waiter',
    isActive: false, // Disabled by Manager for demo
    pinCode: '9012',
    createdAt: '2026-03-10T10:00:00Z',
    lastLoginAt: '2026-09-28T22:00:00Z',
    stats: {
      tablesServedCount: 84,
      totalRevenueGenerated: 7950,
      voidCount: 1,
      topSellerItem: 'Tartare di Manzo Tartufata',
      lowSellerItem: 'Panna Cotta ai Frutti di Bosco',
    },
  },
];

export const staffService = {
  getStaffMembers(): StaffMember[] {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse staff members', e);
      }
    }
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF_MEMBERS));
    return INITIAL_STAFF_MEMBERS;
  },

  saveStaffMembers(members: StaffMember[]): void {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(members));
  },

  async createWaiterAccount(data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    pinCode?: string;
  }): Promise<{ success: boolean; staff?: StaffMember; error?: string }> {
    const members = this.getStaffMembers();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check email uniqueness
    if (members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Un account con questa email esiste già nel sistema.' };
    }

    const newStaff: StaffMember = {
      id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
      email: cleanEmail,
      role: 'waiter',
      isActive: true,
      pinCode: data.pinCode || '1234',
      createdAt: new Date().toISOString(),
      stats: {
        tablesServedCount: 0,
        totalRevenueGenerated: 0,
        voidCount: 0,
      },
    };

    members.unshift(newStaff);
    this.saveStaffMembers(members);

    // If Supabase configured, call auth admin / staff table
    if (isSupabaseConfigured) {
      try {
        await supabase.from('staff_members').insert({
          id: newStaff.id,
          first_name: newStaff.firstName,
          last_name: newStaff.lastName,
          email: newStaff.email,
          role: 'waiter',
          is_active: true,
          pin_code: newStaff.pinCode,
        });
      } catch (err) {
        console.warn('[Supabase Staff] Could not persist staff remotely:', err);
      }
    }

    realtimeSync.broadcast({ type: 'STAFF_MEMBER_CREATED', payload: newStaff });
    return { success: true, staff: newStaff };
  },

  async resetWaiterPassword(
    staffId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La nuova password deve contenere almeno 6 caratteri.' };
    }

    const members = this.getStaffMembers();
    const target = members.find((m) => m.id === staffId);
    if (!target) {
      return { success: false, error: 'Cameriere non trovato.' };
    }

    // Persist locally
    target.pinCode = newPassword.slice(0, 4); // Sync 4-digit PIN for quick waiter touch
    this.saveStaffMembers(members);

    // If Supabase configured, call server RPC or admin route
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('admin_reset_staff_password', {
          target_staff_id: staffId,
          new_password: newPassword,
        });
      } catch (err) {
        console.warn('[Supabase Staff] Remote password reset notice:', err);
      }
    }

    return { success: true };
  },

  async toggleStaffActive(
    staffId: string
  ): Promise<{ success: boolean; isActive: boolean; error?: string }> {
    const members = this.getStaffMembers();
    const target = members.find((m) => m.id === staffId);
    if (!target) {
      return { success: false, isActive: false, error: 'Membro del personale non trovato.' };
    }

    target.isActive = !target.isActive;
    this.saveStaffMembers(members);

    // If Supabase is configured
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('staff_members')
          .update({ is_active: target.isActive, updated_at: new Date().toISOString() })
          .eq('id', staffId);
      } catch (err) {
        console.warn('[Supabase Staff] Toggle status error:', err);
      }
    }

    realtimeSync.broadcast({
      type: 'STAFF_STATUS_CHANGED',
      payload: { staffId, isActive: target.isActive },
    });

    return { success: true, isActive: target.isActive };
  },

  getWaiterStats(waiterId: string) {
    const staff = this.getStaffMembers().find((s) => s.id === waiterId);
    return staff?.stats || {
      tablesServedCount: 0,
      totalRevenueGenerated: 0,
      voidCount: 0,
    };
  },
};

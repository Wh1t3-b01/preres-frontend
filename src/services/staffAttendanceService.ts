/**
 * Sotto Sotto Bar & Grill — Staff Attendance & Punch-In Service
 * Traccia gli orari di accesso/uscita (Punch In / Punch Out) del personale di sala,
 * la sezione assegnata (Main A, Main B, Bar, Private) e la durata del turno.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { realtimeSync } from '../utils/realtimeSync';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: 'waiter' | 'host' | 'manager';
  shiftDate: string; // YYYY-MM-DD
  sectionAssigned: 'main_a' | 'main_b' | 'bar' | 'private' | 'all';
  punchInAt: string; // ISO
  punchOutAt?: string; // ISO
  totalHoursWorked?: number;
  status: 'active' | 'completed';
}

const ATTENDANCE_STORAGE_KEY = 'sotto_staff_attendance_records';

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_simone_today',
    staffId: 'staff_simone',
    staffName: 'Simone Rinaldi',
    role: 'waiter',
    shiftDate: new Date().toISOString().split('T')[0],
    sectionAssigned: 'main_a',
    punchInAt: new Date(Date.now() - 1000 * 60 * 145).toISOString(), // ~2.5 ore fa
    status: 'active',
  },
  {
    id: 'att_marco_today',
    staffId: 'staff_marco',
    staffName: 'Marco Gentili',
    role: 'waiter',
    shiftDate: new Date().toISOString().split('T')[0],
    sectionAssigned: 'main_b',
    punchInAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'active',
  },
];

export const staffAttendanceService = {
  getAttendanceRecords(): AttendanceRecord[] {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse attendance records', e);
      }
    }
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
    return INITIAL_ATTENDANCE;
  },

  saveAttendanceRecords(records: AttendanceRecord[]): void {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
  },

  getActivePunchIn(staffId: string): AttendanceRecord | undefined {
    const records = this.getAttendanceRecords();
    const today = new Date().toISOString().split('T')[0];
    return records.find(
      (r) => r.staffId === staffId && r.shiftDate === today && r.status === 'active'
    );
  },

  async punchIn(staff: {
    id: string;
    name: string;
    role: 'waiter' | 'host' | 'manager';
    section?: 'main_a' | 'main_b' | 'bar' | 'private' | 'all';
  }): Promise<AttendanceRecord> {
    const records = this.getAttendanceRecords();
    const today = new Date().toISOString().split('T')[0];

    // Check if already active today
    const existing = records.find(
      (r) => r.staffId === staff.id && r.shiftDate === today && r.status === 'active'
    );
    if (existing) {
      return existing;
    }

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      shiftDate: today,
      sectionAssigned: staff.section || 'main_a',
      punchInAt: new Date().toISOString(),
      status: 'active',
    };

    records.unshift(newRecord);
    this.saveAttendanceRecords(records);

    // Persist to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('staff_attendance').insert({
          id: newRecord.id,
          staff_id: newRecord.staffId,
          staff_name: newRecord.staffName,
          shift_date: newRecord.shiftDate,
          section_assigned: newRecord.sectionAssigned,
          punch_in_at: newRecord.punchInAt,
          status: 'active',
        });
      } catch (err) {
        console.warn('[Supabase Attendance] Could not record punch-in remotely:', err);
      }
    }

    realtimeSync.broadcast({
      type: 'STAFF_STATUS_CHANGED',
      payload: { staffId: staff.id, isActive: true },
    });

    return newRecord;
  },

  async punchOut(staffId: string): Promise<AttendanceRecord | null> {
    const records = this.getAttendanceRecords();
    const active = this.getActivePunchIn(staffId);
    if (!active) return null;

    const punchOutTime = new Date();
    const punchInTime = new Date(active.punchInAt);
    const diffHours = (punchOutTime.getTime() - punchInTime.getTime()) / (1000 * 60 * 60);

    active.punchOutAt = punchOutTime.toISOString();
    active.totalHoursWorked = Number(diffHours.toFixed(2));
    active.status = 'completed';

    this.saveAttendanceRecords(records);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('staff_attendance')
          .update({
            punch_out_at: active.punchOutAt,
            total_hours_worked: active.totalHoursWorked,
            status: 'completed',
          })
          .eq('id', active.id);
      } catch (err) {
        console.warn('[Supabase Attendance] Could not record punch-out remotely:', err);
      }
    }

    return active;
  },
};

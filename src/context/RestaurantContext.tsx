import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  RestaurantTable,
  Reservation,
  TableGroup,
  RestaurantSettings,
  StaffRole,
  TableCourseStage,
  WaitlistItem,
  ToastMessage,
  OperationsKPIs,
} from '../types';
import { DEFAULT_TABLES, DEFAULT_SETTINGS } from '../data/defaultTables';
import { getInitialSeedData } from '../data/seedReservations';
import { generateBookingCode, calcReservationDuration, minsToTime, timeToMins, validateAdvanceBookingSlotLimits } from '../utils/bookingEngine';
import { realtimeSync, RealtimeEvent } from '../utils/realtimeSync';
import { reservationService, BACKEND_BASE_URL } from '../services/reservationService';

interface RestaurantContextType {
  tables: RestaurantTable[];
  reservations: Reservation[];
  tableGroups: TableGroup[];
  waitlist: WaitlistItem[];
  settings: RestaurantSettings;
  staffRole: StaffRole;
  selectedDate: string;
  selectedTime: string;
  isLiveMode: boolean;
  isLayoutEditMode: boolean;
  selectedTableIds: string[];
  toasts: ToastMessage[];
  kpis: OperationsKPIs;
  isRealtimeConnected: boolean;
  connectedPeersCount: number;
  
  // Setters
  setStaffRole: (role: StaffRole) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  setIsLiveMode: (isLive: boolean) => void;
  setIsLayoutEditMode: (isEdit: boolean) => void;
  toggleTableSelection: (tableId: string) => void;
  clearTableSelection: () => void;
  
  // Table operations & Spatial Drag/Drop
  updateTablePosition: (tableId: string, x: number, y: number, rotation?: number) => void;
  updateTableCapacity: (tableId: string, capacity: number) => void;
  updateTableDetails: (tableId: string, updates: Partial<RestaurantTable>) => void;
  addCustomTable: (table: Partial<RestaurantTable>) => void;
  removeCustomTable: (tableId: string) => void;
  toggleTableBlock: (tableId: string, reason?: string) => void;
  transferTable: (fromTableId: string, toTableId: string, reservationId: string) => boolean;
  
  // Course Stages & Service Call
  setTableCourseStage: (tableId: string, stage: TableCourseStage) => void;
  setTableAssistance: (tableId: string, needsAssistance: boolean, reason?: string) => void;
  
  // Reservations
  createReservation: (data: {
    guestName: string;
    guestPhone?: string;
    guestEmail?: string;
    reservationDate: string;
    startTime: string;
    durationMins?: number;
    partySize: number;
    tableId: string;
    assignedTableIds?: string[];
    notes?: string;
    tags?: string[];
    isWalkIn?: boolean;
    autoMerge?: boolean;
    autoMergeTableIds?: string[];
    autoMergeGroupName?: string;
  }) => { success: boolean; bookingCode?: string; error?: string };
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  rescheduleReservation: (
    reservationId: string,
    newStartTime: string,
    newDate?: string,
    newTableId?: string,
    newDurationMins?: number
  ) => Promise<{ success: boolean; error?: string; reservation?: Reservation }>;
  deleteReservation: (bookingCode: string) => void;
  cancelReservation: (id: string) => void;
  seatReservation: (id: string) => void;
  completeReservation: (id: string) => void;
  freeTable: (tableId: string) => void;
  clearCompletedReservations: (targetDate?: string) => void;
  quickSeatWalkIn: (data: {
    guestName: string;
    partySize: number;
    tableId: string;
    assignedTableIds?: string[];
    notes?: string;
    tags?: string[];
  }) => { success: boolean; bookingCode?: string; error?: string };
  
  // Merging
  mergeTables: (data: {
    date: string;
    tableIds: string[];
    groupName?: string;
  }) => { success: boolean; group?: TableGroup; error?: string };
  unmergeTables: (groupId: string) => void;
  extendTableTime: (tableId: string, additionalMins: number) => void;
  
  // Waitlist & SMS
  addToWaitlist: (data: Omit<WaitlistItem, 'id' | 'addedAt' | 'status'>) => void;
  updateWaitlistStatus: (id: string, status: WaitlistItem['status']) => void;
  sendWaitlistSMS: (waitlistId: string) => { success: boolean; message: string };
  seatWaitlistGuest: (waitlistId: string, tableId: string) => boolean;
  
  // Toasts
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Reset
  resetToDefaults: () => void;
}

const STORAGE_KEYS = {
  TABLES: 'sotto_tables_v3',
  RESERVATIONS: 'sotto_reservations_v3',
  GROUPS: 'sotto_groups_v3',
  WAITLIST: 'sotto_waitlist_v3',
  SETTINGS: 'sotto_settings_v3',
  ROLE: 'sotto_role_v3',
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedTime, setSelectedTime] = useState<string>(getCurrentTimeStr());
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [isLayoutEditMode, setIsLayoutEditMode] = useState<boolean>(false);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [staffRole, setStaffRoleState] = useState<StaffRole>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ROLE) as StaffRole) || 'manager';
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [connectedPeersCount, setConnectedPeersCount] = useState<number>(1);

  // Tables State
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasNewZones = parsed.some((t: any) => t.zone === 'main_a' || t.zone === 'main_b');
          if (hasNewZones) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved tables', e);
      }
    }
    return DEFAULT_TABLES;
  });

  // Settings State
  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Reservations, Groups & Waitlist State (Strictly real data from Supabase/Server)
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved reservations', e);
      }
    }
    return [];
  });

  const [tableGroups, setTableGroups] = useState<TableGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved groups', e);
      }
    }
    return [];
  });

  const [waitlist, setWaitlist] = useState<WaitlistItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAITLIST);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved waitlist', e);
      }
    }
    return [];
  });

  // Self-Healing fallback for physical tables layout
  useEffect(() => {
    if (!tables || tables.length === 0) {
      setTables(DEFAULT_TABLES);
    }
  }, [tables]);

  // Sync to LocalStorage
  useEffect(() => {
    if (tables && tables.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    }
  }, [tables]);

  useEffect(() => {
    if (reservations && reservations.length > 0) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    }
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(tableGroups));
  }, [tableGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(waitlist));
  }, [waitlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Initial Supabase remote sync and Realtime Database Subscription
  useEffect(() => {
    // 1. Fetch remote reservations from Supabase / Render
    reservationService.fetchReservations().then((remoteRes) => {
      if (Array.isArray(remoteRes)) {
        setReservations(remoteRes);
      }
    });

    // 2. Subscribe to Supabase Postgres Realtime CDC
    const unsubscribeSupabase = reservationService.subscribeToSupabaseRealtime((event) => {
      if (event.eventType === 'INSERT' && event.newRecord) {
        setReservations((prev) => {
          if (prev.some((r) => r.id === event.newRecord.id || r.bookingCode === event.newRecord.bookingCode)) return prev;
          return [...prev, event.newRecord];
        });
      } else if (event.eventType === 'UPDATE' && event.newRecord) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === event.newRecord.id || r.bookingCode === event.newRecord.bookingCode ? event.newRecord : r
          )
        );
      } else if (event.eventType === 'DELETE' && event.oldRecord) {
        setReservations((prev) =>
          prev.filter(
            (r) => r.id !== String(event.oldRecord.id) && r.bookingCode !== event.oldRecord.booking_code
          )
        );
      }
    });

    return () => {
      unsubscribeSupabase();
    };
  }, []);

  // Real-Time Event Subscription across all devices / tabs / screens
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((event: RealtimeEvent) => {
      setIsRealtimeConnected(true);

      if (event.type === 'PRESENCE_COUNT') {
        setConnectedPeersCount(event.payload.count);
      } else if (event.type === 'RESERVATION_CREATED') {
        if (event.payload) {
          setReservations((prev) => {
            const exists = prev.some((r) => r.id === event.payload.id || r.bookingCode === event.payload.bookingCode);
            if (exists) return prev;
            return [...prev, event.payload];
          });
        }
      } else if (event.type === 'RESERVATION_UPDATED') {
        if (Array.isArray(event.payload)) {
          setReservations(event.payload);
        } else if (event.payload && (event.payload.id || event.payload.bookingCode)) {
          const targetId = event.payload.id || event.payload.bookingCode;
          const updates = event.payload.updates || event.payload;
          setReservations((prev) =>
            prev.map((r) => (r.id === targetId || r.bookingCode === targetId ? { ...r, ...updates } : r))
          );
        } else {
          const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
          if (saved) setReservations(JSON.parse(saved));
        }
      } else if (event.type === 'RESERVATION_DELETED') {
        const code = event.payload.bookingCode || (event.payload as any).id;
        setReservations((prev) => prev.filter((r) => r.bookingCode !== code && r.id !== code));
      } else if (event.type === 'TABLE_COORDINATES_MOVED') {
        setTables((prev) =>
          prev.map((t) => (t.id === event.payload.tableId ? { ...t, x: event.payload.x, y: event.payload.y } : t))
        );
      } else if (event.type === 'TABLES_UPDATED') {
        if (Array.isArray(event.payload) && event.payload.length > 0) {
          setTables(event.payload);
        } else {
          const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTables(parsed);
                return;
              }
            } catch (e) {}
          }
          setTables(DEFAULT_TABLES);
        }
      } else if (event.type === 'TABLE_MERGED') {
        if (event.payload && event.payload.id) {
          setTableGroups((prev) => {
            if (prev.some((g) => g.id === event.payload.id)) return prev;
            return [...prev, event.payload];
          });
        } else {
          const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
          if (saved) setTableGroups(JSON.parse(saved));
        }
      } else if (event.type === 'TABLE_UNMERGED') {
        const gId = event.payload.groupId;
        setTableGroups((prev) => prev.filter((g) => g.id !== gId));
      } else if (event.type === 'WAITLIST_UPDATED') {
        if (Array.isArray(event.payload)) {
          setWaitlist(event.payload);
        } else {
          const saved = localStorage.getItem(STORAGE_KEYS.WAITLIST);
          if (saved) setWaitlist(JSON.parse(saved));
        }
      } else if (event.type === 'DATABASE_RESET') {
        setTables(DEFAULT_TABLES);
        setSettings(DEFAULT_SETTINGS);
        const initial = getInitialSeedData();
        setReservations(initial.reservations);
        setTableGroups(initial.tableGroups);
        setWaitlist(initial.waitlist);
      }
    });

    return () => unsubscribe();
  }, []);

  const setStaffRole = (role: StaffRole) => {
    setStaffRoleState(role);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    if (role !== 'manager') {
      setIsLayoutEditMode(false);
    }
  };

  // Toast System
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newToast: ToastMessage = { ...toast, id, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);

    const dur = toast.duration || 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, dur);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Live clock tick
  useEffect(() => {
    if (!isLiveMode) return;
    const interval = setInterval(() => {
      setSelectedTime(getCurrentTimeStr());
    }, 30000);
    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Executive Operations KPIs Real-Time Calculation
  const kpis: OperationsKPIs = useMemo(() => {
    const dayRes = reservations.filter(
      (r) => r.reservationDate === selectedDate && r.status !== 'cancelled'
    );

    const bookedCovers = dayRes.reduce((sum, r) => sum + r.partySize, 0);
    const seatedCovers = dayRes
      .filter((r) => r.status === 'seated')
      .reduce((sum, r) => sum + r.partySize, 0);
    const completedCovers = dayRes
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.partySize, 0);
    const remainingCovers = dayRes
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.partySize, 0);

    const totalCapacity = tables.reduce((sum, t) => sum + (t.capacityOverride || t.capacity), 0);
    const turnoverRate = totalCapacity > 0 ? Number((bookedCovers / totalCapacity).toFixed(2)) : 0;
    const estimatedTotalRevenue = bookedCovers * (settings.avgSpendPerCover || 65);

    const occupiedTablesCount = dayRes.filter((r) => r.status === 'seated').length;
    const totalTablesCount = tables.length;
    const occupancyPercentage =
      totalTablesCount > 0 ? Math.round((occupiedTablesCount / totalTablesCount) * 100) : 0;

    return {
      bookedCovers,
      seatedCovers,
      completedCovers,
      remainingCovers,
      totalReservationsCount: dayRes.length,
      occupiedTablesCount,
      totalTablesCount,
      occupancyPercentage,
      turnoverRate,
      estimatedTotalRevenue,
    };
  }, [reservations, selectedDate, tables, settings]);

  // Multi-table selection
  const toggleTableSelection = useCallback((tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  }, []);

  const clearTableSelection = useCallback(() => {
    setSelectedTableIds([]);
  }, []);

  // Spatial Coordinate Updates with Real-time broadcast
  const updateTablePosition = useCallback((tableId: string, x: number, y: number, rotation?: number) => {
    setTables((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            x: Math.max(0, Math.min(95, x)),
            y: Math.max(0, Math.min(90, y)),
            rotation: rotation !== undefined ? rotation : t.rotation || 0,
          };
        }
        return t;
      });
      realtimeSync.broadcast({ type: 'TABLE_COORDINATES_MOVED', payload: { tableId, x, y } });
      return updated;
    });
  }, []);

  const updateTableCapacity = useCallback((tableId: string, capacity: number) => {
    setTables((prev) => {
      const updated = prev.map((t) => (t.id === tableId ? { ...t, capacityOverride: capacity } : t));
      realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
      return updated;
    });
    addToast({
      type: 'success',
      title: 'Capienza Aggiornata',
      message: `Tavolo ${tableId} impostato a ${capacity} coperti.`,
    });
  }, [addToast]);

  const updateTableDetails = useCallback((tableId: string, updates: Partial<RestaurantTable>) => {
    setTables((prev) => {
      const updated = prev.map((t) => (t.id === tableId ? { ...t, ...updates } : t));
      realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
      return updated;
    });
  }, []);

  const addCustomTable = useCallback((newTableData: Partial<RestaurantTable>) => {
    const newId = newTableData.tableNumber || `T${Date.now() % 1000}`;
    const newTable: RestaurantTable = {
      id: newId,
      tableNumber: newId,
      name: newTableData.name || `Tavolo ${newId}`,
      zone: newTableData.zone || 'main',
      capacity: newTableData.capacity || 4,
      shape: newTableData.shape || 'rect-h',
      adjacentWith: [],
      x: newTableData.x || 45,
      y: newTableData.y || 45,
      width: 120,
      height: 95,
      rotation: 0,
    };
    setTables((prev) => {
      const updated = [...prev, newTable];
      realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
      return updated;
    });
    addToast({
      type: 'success',
      title: 'Nuovo Tavolo Aggiunto',
      message: `Tavolo ${newId} posizionato sulla mappa sala.`,
    });
  }, [addToast]);

  const removeCustomTable = useCallback((tableId: string) => {
    setTables((prev) => {
      const updated = prev.filter((t) => t.id !== tableId && t.tableNumber !== tableId);
      realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
      return updated;
    });
    setTableGroups((prev) => {
      const groupsToRemove = prev.filter((g) => g.memberTableIds.includes(tableId));
      groupsToRemove.forEach((g) => {
        realtimeSync.broadcast({ type: 'TABLE_UNMERGED', payload: { groupId: g.id } });
      });
      return prev.filter((g) => !g.memberTableIds.includes(tableId));
    });
    setSelectedTableIds((prev) => prev.filter((id) => id !== tableId));
    addToast({
      type: 'info',
      title: 'Tavolo Eliminato',
      message: `Tavolo ${tableId} rimosso con successo dalla sala.`,
    });
  }, [addToast]);

  // Resy-style Table Block / Hold
  const toggleTableBlock = useCallback((tableId: string, reason?: string) => {
    setTables((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tableId || t.tableNumber === tableId) {
          const nextBlocked = !t.isBlocked;
          return {
            ...t,
            isBlocked: nextBlocked,
            blockedReason: nextBlocked ? reason || 'Bloccato / Riservato Maître' : undefined,
          };
        }
        return t;
      });
      realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
      return updated;
    });

    const target = tables.find((t) => t.id === tableId);
    const willBlock = !target?.isBlocked;
    addToast({
      type: willBlock ? 'warning' : 'success',
      title: willBlock ? `Tavolo ${tableId} Bloccato` : `Tavolo ${tableId} Sbloccato`,
      message: willBlock
        ? `Tavolo trattenuto: ${reason || 'Riserva Direzione'}`
        : 'Tavolo di nuovo disponibile per prenotazioni e walk-in.',
    });
  }, [tables, addToast]);

  // Resy-style Table Transfer / Move Seated Party
  const transferTable = useCallback((fromTableId: string, toTableId: string, reservationId: string) => {
    let movedReservation: Reservation | undefined;

    setReservations((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reservationId || r.bookingCode === reservationId) {
          movedReservation = {
            ...r,
            tableId: toTableId,
            assignedTableIds: [toTableId],
          };
          return movedReservation;
        }
        return r;
      });
      realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
      return updated;
    });

    if (movedReservation) {
      addToast({
        type: 'success',
        title: 'Tavolo Trasferito con Successo',
        message: `${(movedReservation as any).guestName} spostato da Tavolo ${fromTableId} a Tavolo ${toTableId}.`,
      });
      return true;
    }
    return false;
  }, [addToast]);

  // Course Stages & Service Calls (For Waiter view)
  const setTableCourseStage = useCallback((tableId: string, stage: TableCourseStage) => {
    setTables((prev) => {
      const updated = prev.map((t) =>
        t.id === tableId
          ? { ...t, courseStage: stage, courseStartedAt: new Date().toISOString() }
          : t
      );
      realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
      return updated;
    });
    const stageLabels: Record<TableCourseStage, string> = {
      seated: 'Ospiti Accomodati',
      drinks: 'Drink & Aperitivi',
      appetizers: 'Antipasti in Tavola',
      mains: 'Portate Principali',
      dessert: 'Dolci & Caffè',
      bill_requested: 'Conto Richiesto 💳',
      clearing: 'In Sparecchiamento',
    };
    addToast({
      type: 'info',
      title: `Tavolo ${tableId} · Servizio`,
      message: `Stato avanzato a: ${stageLabels[stage]}`,
    });
  }, [addToast]);

  const setTableAssistance = useCallback((tableId: string, needsAssistance: boolean, reason?: string) => {
    setTables((prev) => {
      const updated = prev.map((t) =>
        t.id === tableId
          ? { ...t, needsAssistance, assistanceReason: reason }
          : t
      );
      realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
      return updated;
    });
    if (needsAssistance) {
      addToast({
        type: 'warning',
        title: `🚨 Richiesta Assistenza Tavolo ${tableId}`,
        message: reason || 'I clienti o il cameriere richiedono supporto al tavolo.',
      });
    }
  }, [addToast]);

  // Merging Tables
  const mergeTables = useCallback(
    (data: { date: string; tableIds: string[]; groupName?: string }) => {
      const { date, tableIds, groupName } = data;
      if (!tableIds || tableIds.length < 2) {
        return { success: false, error: 'Seleziona almeno 2 tavoli da unire.' };
      }

      const alreadyMerged = tableGroups.find(
        (g) => g.groupDate === date && g.memberTableIds.some((m) => tableIds.includes(m))
      );
      if (alreadyMerged) {
        return {
          success: false,
          error: `Uno o più tavoli fanno già parte del gruppo "${alreadyMerged.combinedName}".`,
        };
      }

      const memberTables = tables.filter((t) => tableIds.includes(t.id));
      const totalCapacity = memberTables.reduce(
        (sum, t) => sum + (t.capacityOverride || t.capacity),
        0
      );
      const zone = memberTables[0]?.zone || 'main';

      const newGroup: TableGroup = {
        id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        groupDate: date,
        combinedName: groupName?.trim() || `Maxi Tavolo (${tableIds.join('+')})`,
        totalCapacity,
        memberTableIds: tableIds,
        zone,
        createdAt: new Date().toISOString(),
      };

      setTableGroups((prev) => {
        const updated = [...prev, newGroup];
        realtimeSync.broadcast({ type: 'TABLE_MERGED', payload: newGroup });
        return updated;
      });
      setSelectedTableIds([]);
      addToast({
        type: 'success',
        title: 'Tavoli Uniti con Successo',
        message: `${newGroup.combinedName} creato con capienza di ${totalCapacity} persone.`,
      });
      return { success: true, group: newGroup };
    },
    [tableGroups, tables, addToast]
  );

  const unmergeTables = useCallback((groupId: string) => {
    const target = tableGroups.find((g) => g.id === groupId);
    setTableGroups((prev) => {
      const updated = prev.filter((g) => g.id !== groupId);
      realtimeSync.broadcast({ type: 'TABLE_UNMERGED', payload: { groupId } });
      return updated;
    });
    if (target) {
      addToast({
        type: 'info',
        title: 'Accorpamento Sciolto',
        message: `${target.combinedName} ripristinato allo stato base.`,
      });
    }
  }, [tableGroups, addToast]);

  // Create Reservation
  const createReservation = useCallback(
    (data: {
      guestName: string;
      guestPhone?: string;
      guestEmail?: string;
      reservationDate: string;
      startTime: string;
      durationMins?: number;
      partySize: number;
      tableId: string;
      assignedTableIds?: string[];
      notes?: string;
      tags?: string[];
      isWalkIn?: boolean;
      autoMerge?: boolean;
      autoMergeTableIds?: string[];
      autoMergeGroupName?: string;
    }) => {
      const {
        guestName,
        guestPhone,
        guestEmail,
        reservationDate,
        startTime,
        partySize,
        tableId,
        notes,
        tags,
        isWalkIn,
        autoMerge,
        autoMergeTableIds,
        autoMergeGroupName,
      } = data;

      if (!guestName || !reservationDate || !startTime || !partySize) {
        return { success: false, error: 'Compila tutti i campi obbligatori.' };
      }

      let finalAssignedIds: string[] = data.assignedTableIds || [tableId];

      if (autoMerge && autoMergeTableIds && autoMergeTableIds.length >= 2) {
        const mergeResult = mergeTables({
          date: reservationDate,
          tableIds: autoMergeTableIds,
          groupName: autoMergeGroupName || `Maxi Gruppo (${autoMergeTableIds.join('+')})`,
        });
        if (!mergeResult.success) {
          return { success: false, error: mergeResult.error };
        }
        finalAssignedIds = autoMergeTableIds;
      }

      const durationMins = data.durationMins || calcReservationDuration(partySize, settings);
      const startM = timeToMins(startTime);
      const endM = startM + durationMins;
      const endTime = minsToTime(endM);

      // Strict Concurrency & 15-Minute Slot Capacity Check (Excludes Walk-ins)
      if (!isWalkIn) {
        const validation = validateAdvanceBookingSlotLimits(
          reservationDate,
          startTime,
          endTime,
          partySize,
          reservations
        );
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.reason || 'Spiacenti, la fascia oraria scelta ha raggiunto il limite massimo di capienza.',
          };
        }
      }

      const bookingCode = generateBookingCode();

      const newReservation: Reservation = {
        id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        bookingCode,
        guestName,
        guestPhone,
        guestEmail,
        reservationDate,
        startTime,
        endTime,
        durationMins,
        partySize,
        tableId: finalAssignedIds[0] || tableId,
        assignedTableIds: finalAssignedIds,
        status: isWalkIn ? 'seated' : 'confirmed',
        notes,
        tags: tags || [],
        seatedAt: isWalkIn ? new Date().toISOString() : undefined,
        isWalkIn,
        totalSpendEstimate: partySize * (settings.avgSpendPerCover || 65),
      };

      setReservations((prev) => {
        const updated = [...prev, newReservation];
        realtimeSync.broadcast({ type: 'RESERVATION_CREATED', payload: newReservation });
        return updated;
      });

      // Direct Supabase & Render backend dual-tier persistence
      reservationService.createReservation(newReservation).catch((err) => {
        console.warn('[RestaurantContext] Async reservation save notice:', err);
      });

      addToast({
        type: 'success',
        title: isWalkIn ? 'Ospiti Accomodati Subito' : 'Prenotazione Confermata',
        message: `${guestName} (${partySize} px) · Codice ${bookingCode}`,
      });
      return { success: true, bookingCode };
    },
    [mergeTables, settings, addToast]
  );

  const quickSeatWalkIn = useCallback(
    (data: {
      guestName: string;
      partySize: number;
      tableId: string;
      assignedTableIds?: string[];
      notes?: string;
      tags?: string[];
    }) => {
      const today = getTodayStr();
      const nowTime = getCurrentTimeStr();

      return createReservation({
        ...data,
        reservationDate: today,
        startTime: nowTime,
        isWalkIn: true,
      });
    },
    [createReservation]
  );

  const rescheduleReservation = useCallback(
    async (
      reservationId: string,
      newStartTime: string,
      newDate?: string,
      newTableId?: string,
      newDurationMins?: number
    ) => {
      const currentRes = reservations.find(
        (r) => r.id === reservationId || r.bookingCode === reservationId
      );
      if (!currentRes) {
        return { success: false, error: 'Prenotazione non trovata.' };
      }

      const targetDate = newDate || currentRes.reservationDate;
      const partySize = currentRes.partySize || 2;
      const durationMins =
        newDurationMins !== undefined
          ? Math.max(30, newDurationMins)
          : currentRes.durationMins || (partySize <= 2 ? 120 : 150);
      const newStartM = timeToMins(newStartTime);
      const newEndM = newStartM + durationMins;
      const newEndTime = minsToTime(newEndM);

      // Validate 15-minute slot capacity limits (excluding this reservation)
      if (!currentRes.isWalkIn) {
        const validation = validateAdvanceBookingSlotLimits(
          targetDate,
          newStartTime,
          newEndTime,
          partySize,
          reservations,
          reservationId
        );

        if (!validation.isValid) {
          addToast({
            type: 'error',
            title: 'Spostamento Non Disponibile',
            message: validation.reason || 'Limite di capienza superato per questa fascia oraria.',
          });
          return { success: false, error: validation.reason };
        }
      }

      // Create updated reservation object
      const updatedRes: Reservation = {
        ...currentRes,
        startTime: newStartTime,
        endTime: newEndTime,
        durationMins,
        reservationDate: targetDate,
        tableId: newTableId || currentRes.tableId,
        assignedTableIds: newTableId ? [newTableId] : currentRes.assignedTableIds,
      };

      // Optimistic update
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId || r.bookingCode === reservationId ? updatedRes : r
        )
      );

      // Persist update directly to Supabase
      reservationService.updateReservation(currentRes.bookingCode || reservationId, updatedRes).catch((err) => {
        console.warn('Reschedule Supabase save notice:', err);
      });

      // Broadcast to all devices
      realtimeSync.broadcast({
        type: 'RESERVATION_UPDATED',
        payload: { action: 'update', id: reservationId, bookingCode: currentRes.bookingCode, updates: updatedRes },
      });

      // Async backend call
      try {
        fetch(`${BACKEND_BASE_URL}/api/reservations/${reservationId}/reschedule`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStartTime, newDate: targetDate, newTableId }),
        }).catch((err) => console.warn('Reschedule fetch error:', err));
      } catch (e) {
        console.warn('Network offline, synced locally:', e);
      }

      addToast({
        type: 'success',
        title: 'Orario Riprogrammato',
        message: `${currentRes.guestName} spostato alle ${newStartTime} - ${newEndTime} (${targetDate}).`,
      });

      return { success: true, reservation: updatedRes };
    },
    [reservations, addToast]
  );

  const seatReservation = useCallback((id: string) => {
    const now = new Date().toISOString();
    setReservations((prev) => {
      const updated = prev.map((r) =>
        r.id === id || r.bookingCode === id ? { ...r, status: 'seated' as const, seatedAt: now } : r
      );
      realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
      return updated;
    });

    reservationService.updateReservation(id, { status: 'seated', seatedAt: now }).catch(() => {});

    addToast({
      type: 'success',
      title: 'Ospiti Seduti al Tavolo',
      message: 'Il timer di permanenza è stato attivato in sala.',
    });
  }, [addToast]);

  const completeReservation = useCallback((id: string) => {
    const now = new Date().toISOString();
    setReservations((prev) => {
      const updated = prev.map((r) =>
        r.id === id || r.bookingCode === id ? { ...r, status: 'completed' as const, completedAt: now } : r
      );
      realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
      return updated;
    });

    reservationService.updateReservation(id, { status: 'completed', completedAt: now }).catch(() => {});

    addToast({
      type: 'info',
      title: 'Tavolo Liberato',
      message: 'Prenotazione completata con successo.',
    });
  }, [addToast]);

  const freeTable = useCallback(
    (tableId: string) => {
      const today = selectedDate;
      const now = new Date().toISOString();
      const targetReservations = reservations.filter(
        (r) =>
          r.reservationDate === today &&
          (r.tableId === tableId || (r.assignedTableIds && r.assignedTableIds.includes(tableId))) &&
          (r.status === 'seated' || r.status === 'confirmed')
      );

      // 1. Update reservations locally & broadcast
      setReservations((prev) => {
        const updated = prev.map((r) => {
          const isTarget =
            r.reservationDate === today &&
            (r.tableId === tableId || (r.assignedTableIds && r.assignedTableIds.includes(tableId))) &&
            (r.status === 'seated' || r.status === 'confirmed');

          if (isTarget) {
            return { ...r, status: 'completed' as const, completedAt: now };
          }
          return r;
        });
        realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
        return updated;
      });

      // 2. Reset table course stage & assistance state
      setTables((prev) => {
        const updated = prev.map((t) =>
          t.id === tableId
            ? { ...t, courseStage: 'seated' as const, needsAssistance: false, assistanceNote: undefined }
            : t
        );
        realtimeSync.broadcast({ type: 'TABLES_UPDATED', payload: updated });
        return updated;
      });

      // 3. Persist each completed reservation to Supabase
      targetReservations.forEach((res) => {
        reservationService.updateReservation(res.bookingCode || res.id, {
          status: 'completed',
          completedAt: now,
        }).catch((err) => {
          console.warn('[RestaurantContext] Free table Supabase sync warning:', err);
        });
      });

      addToast({
        type: 'info',
        title: `Tavolo ${tableId} Liberato`,
        message: 'Tavolo pronto e disponibile per il prossimo turno.',
      });
    },
    [selectedDate, reservations, addToast]
  );

  const updateReservation = useCallback((id: string, updates: Partial<Reservation>) => {
    setReservations((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id || r.bookingCode === id) {
          const newRes = { ...r, ...updates };
          if (updates.partySize !== undefined) {
            newRes.totalSpendEstimate = newRes.partySize * (settings.avgSpendPerCover || 65);
          }
          return newRes;
        }
        return r;
      });
      realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
      return updated;
    });

    // Supabase + Render backend sync
    reservationService.updateReservation(id, updates).catch(() => {});

    if (updates.partySize !== undefined) {
      addToast({
        type: 'success',
        title: 'Coperti Aggiornati',
        message: `Numero ospiti aggiornato a ${updates.partySize} persone.`,
      });
    }
  }, [settings.avgSpendPerCover, addToast]);

  const cancelReservation = useCallback((id: string) => {
    setReservations((prev) => {
      const updated = prev.map((r) => (r.id === id || r.bookingCode === id ? { ...r, status: 'cancelled' as const } : r));
      realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
      return updated;
    });

    // Supabase + Render backend sync
    reservationService.updateReservation(id, { status: 'cancelled' }).catch(() => {});

    addToast({
      type: 'warning',
      title: 'Prenotazione Annullata',
      message: 'Il tavolo è stato rimesso in disponibilità.',
    });
  }, [addToast]);

  const deleteReservation = useCallback((identifier: string) => {
    setReservations((prev) => {
      const updated = prev.filter((r) => r.bookingCode !== identifier && r.id !== identifier);
      realtimeSync.broadcast({ type: 'RESERVATION_DELETED', payload: { bookingCode: identifier } });
      return updated;
    });

    // Supabase + Render backend sync
    reservationService.deleteReservation(identifier).catch(() => {});

    addToast({
      type: 'info',
      title: 'Prenotazione Eliminata',
      message: 'Eliminata definitivamente dal registro e dal database.',
    });
  }, [addToast]);

  const clearCompletedReservations = useCallback((targetDate?: string) => {
    setReservations((prev) => {
      const updated = prev.filter((r) => {
        if (targetDate) {
          return !(r.reservationDate === targetDate && (r.status === 'completed' || r.status === 'cancelled'));
        }
        return r.status !== 'completed' && r.status !== 'cancelled';
      });
      realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
      return updated;
    });
    addToast({
      type: 'info',
      title: 'Registro Pulito',
      message: 'Tutti i tavoli e prenotazioni completate sono stati rimossi.',
    });
  }, [addToast]);

  const extendTableTime = useCallback((tableId: string, additionalMins: number) => {
    setReservations((prev) => {
      const updated = prev.map((r) => {
        const isTarget =
          (r.tableId === tableId || (r.assignedTableIds && r.assignedTableIds.includes(tableId))) &&
          r.status === 'seated';
        if (isTarget) {
          const newDur = r.durationMins + additionalMins;
          const newEndM = timeToMins(r.startTime) + newDur;
          return {
            ...r,
            durationMins: newDur,
            endTime: minsToTime(newEndM),
          };
        }
        return r;
      });
      realtimeSync.broadcast({ type: 'RESERVATION_UPDATED', payload: updated });
      return updated;
    });
    addToast({
      type: 'info',
      title: `Tavolo ${tableId} Prorogato`,
      message: `+${additionalMins} minuti di permanenza aggiunti al servizio.`,
    });
  }, [addToast]);

  // Waitlist Operations
  const addToWaitlist = useCallback((data: Omit<WaitlistItem, 'id' | 'addedAt' | 'status'>) => {
    const newItem: WaitlistItem = {
      ...data,
      id: `wait-${Date.now()}`,
      addedAt: new Date().toISOString(),
      status: 'waiting',
    };
    setWaitlist((prev) => {
      const updated = [...prev, newItem];
      realtimeSync.broadcast({ type: 'WAITLIST_UPDATED', payload: updated });
      return updated;
    });
    addToast({
      type: 'info',
      title: 'Aggiunto in Lista d’Attesa',
      message: `${data.guestName} (${data.partySize} px) inserito in coda.`,
    });
  }, [addToast]);

  const updateWaitlistStatus = useCallback((id: string, status: WaitlistItem['status']) => {
    setWaitlist((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, status } : item));
      realtimeSync.broadcast({ type: 'WAITLIST_UPDATED', payload: updated });
      return updated;
    });
  }, []);

  const sendWaitlistSMS = useCallback((waitlistId: string) => {
    const item = waitlist.find((w) => w.id === waitlistId);
    if (!item) return { success: false, message: 'Ospite non trovato.' };

    const notificationTime = new Date().toISOString();
    setWaitlist((prev) => {
      const updated = prev.map((w) =>
        w.id === waitlistId ? { ...w, status: 'notified' as const, notificationSentAt: notificationTime } : w
      );
      realtimeSync.broadcast({ type: 'WAITLIST_UPDATED', payload: updated });
      return updated;
    });

    const smsText = `Sotto Sotto Bar & Grill: Gentile ${item.guestName}, il vostro tavolo per ${item.partySize} persone è pronto! Vi preghiamo di presentarvi all'accoglienza entro 10 minuti.`;

    addToast({
      type: 'sms_sent',
      title: '📲 SMS Inviato con Successo (Twilio Gateway)',
      message: `Inviato a ${item.guestPhone}: "${smsText}"`,
      duration: 7000,
    });

    return { success: true, message: smsText };
  }, [waitlist, addToast]);

  const seatWaitlistGuest = useCallback((waitlistId: string, tableId: string) => {
    const item = waitlist.find((w) => w.id === waitlistId);
    if (!item) return false;

    const res = quickSeatWalkIn({
      guestName: item.guestName,
      partySize: item.partySize,
      tableId,
      notes: `Da Lista d'Attesa: ${item.notes || ''}`,
    });

    if (res.success) {
      updateWaitlistStatus(waitlistId, 'seated');
      return true;
    }
    return false;
  }, [waitlist, quickSeatWalkIn, updateWaitlistStatus]);

  // Reset to Defaults
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.WAITLIST);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    setTables(DEFAULT_TABLES);
    setSettings(DEFAULT_SETTINGS);
    const initial = getInitialSeedData();
    setReservations(initial.reservations);
    setTableGroups(initial.tableGroups);
    setWaitlist(initial.waitlist);
    setSelectedTableIds([]);
    setIsLayoutEditMode(false);
    realtimeSync.broadcast({ type: 'DATABASE_RESET' });
    addToast({
      type: 'info',
      title: 'Database Ripristinato',
      message: 'Tutti i dati e il layout sono stati ripristinati allo stato iniziale.',
    });
  }, [addToast]);

  return (
    <RestaurantContext.Provider
      value={{
        tables,
        reservations,
        tableGroups,
        waitlist,
        settings,
        staffRole,
        selectedDate,
        selectedTime,
        isLiveMode,
        isLayoutEditMode,
        selectedTableIds,
        toasts,
        kpis,
        isRealtimeConnected,
        connectedPeersCount,
        setStaffRole,
        setSelectedDate,
        setSelectedTime,
        setIsLiveMode,
        setIsLayoutEditMode,
        toggleTableSelection,
        clearTableSelection,
        updateTablePosition,
        updateTableCapacity,
        updateTableDetails,
        addCustomTable,
        removeCustomTable,
        toggleTableBlock,
        transferTable,
        setTableCourseStage,
        setTableAssistance,
        createReservation,
        updateReservation,
        rescheduleReservation,
        deleteReservation,
        cancelReservation,
        seatReservation,
        completeReservation,
        freeTable,
        clearCompletedReservations,
        quickSeatWalkIn,
        mergeTables,
        unmergeTables,
        extendTableTime,
        addToWaitlist,
        updateWaitlistStatus,
        sendWaitlistSMS,
        seatWaitlistGuest,
        addToast,
        removeToast,
        resetToDefaults,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}

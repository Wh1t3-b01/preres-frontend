import {
  RestaurantTable,
  Reservation,
  TableGroup,
  RecommendedMerge,
  RestaurantSettings,
  TimeSlotOption,
} from '../types';

export function timeToMins(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minsToTime(mins: number): string {
  const normalized = Math.max(0, Math.min(mins, 24 * 60 - 1));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const LUNCH_SLOTS = [
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45'
];

export const DINNER_SLOTS = [
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45'
];

export const ALL_BOOKING_SLOTS = [...LUNCH_SLOTS, ...DINNER_SLOTS];

export interface RestaurantServiceStatus {
  isOpen: boolean;
  isWeeklyClosedDay: boolean;
  currentService: 'lunch' | 'dinner' | 'prep' | 'closed';
  statusLabel: string;
  subLabel: string;
  badgeType: 'open' | 'prep' | 'closed';
}

/**
 * Computes live operational status for Sotto Sotto Bar & Grill:
 * - Weekly Closed: Monday (1) & Tuesday (2)
 * - Open Days: Wednesday through Sunday
 * - Lunch: 12:00 – 15:00
 * - Afternoon Prep / Break: 15:00 – 17:00
 * - Dinner: 17:00 – 23:00
 * - Night Closed: 23:00 – 12:00
 */
export function getRestaurantServiceStatus(date: Date = new Date()): RestaurantServiceStatus {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMins = hours * 60 + minutes;

  // Monday (1) or Tuesday (2) = Weekly Rest Days
  if (day === 1 || day === 2) {
    const dayName = day === 1 ? 'Lunedì' : 'Martedì';
    return {
      isOpen: false,
      isWeeklyClosedDay: true,
      currentService: 'closed',
      statusLabel: `Chiuso · Riposo Settimanale (${dayName})`,
      subLabel: 'Riapertura Mercoledì ore 12:00',
      badgeType: 'closed',
    };
  }

  // Open Days (Wednesday to Sunday)
  // 1. Lunch Shift: 12:00 - 15:00
  if (currentMins >= 12 * 60 && currentMins < 15 * 60) {
    return {
      isOpen: true,
      isWeeklyClosedDay: false,
      currentService: 'lunch',
      statusLabel: 'Aperto · Servizio Pranzo',
      subLabel: 'Turno attivo fino alle 15:00',
      badgeType: 'open',
    };
  }

  // 2. Afternoon Break / Kitchen Prep: 15:00 - 17:00
  if (currentMins >= 15 * 60 && currentMins < 17 * 60) {
    return {
      isOpen: false,
      isWeeklyClosedDay: false,
      currentService: 'prep',
      statusLabel: 'Pausa Pomeridiana · Prep Linea',
      subLabel: 'Apertura servizio Cena alle 17:00',
      badgeType: 'prep',
    };
  }

  // 3. Dinner Shift: 17:00 - 23:00
  if (currentMins >= 17 * 60 && currentMins < 23 * 60) {
    return {
      isOpen: true,
      isWeeklyClosedDay: false,
      currentService: 'dinner',
      statusLabel: 'Aperto · Servizio Cena',
      subLabel: 'Turno serale attivo fino alle 23:00',
      badgeType: 'open',
    };
  }

  // 4. Night Closed: 23:00 - 12:00
  return {
    isOpen: false,
    isWeeklyClosedDay: false,
    currentService: 'closed',
    statusLabel: 'Chiuso · Fuori Orario di Servizio',
    subLabel: 'Apertura Pranzo alle 12:00',
    badgeType: 'closed',
  };
}

export interface SlotValidationResult {
  isValid: boolean;
  reason?: string;
  violatingSlot?: string;
  active2Seaters?: number;
  active4Seaters?: number;
  maxAllowedNotice?: string;
}

export type DiningSectionId = 'section_1' | 'section_2' | 'section_3';

export interface DiningSectionInfo {
  id: DiningSectionId;
  name: string;
  serverName: string;
  zone: string;
  description: string;
  twoSeaters: string[];
  fourSeaters: string[];
}

export const DINING_SECTIONS: Record<DiningSectionId, DiningSectionInfo> = {
  section_1: {
    id: 'section_1',
    name: 'Sezione 1 — Main A (Ala Ovest)',
    serverName: 'Simone Rinaldi',
    zone: 'main_a',
    description: 'Tavoli 2-pax: G, 10, 11 | Tavoli 4-pax: 12, 20, 21',
    twoSeaters: ['G', '10', '11'],
    fourSeaters: ['12', '20', '21'],
  },
  section_2: {
    id: 'section_2',
    name: 'Sezione 2 — Main B (Ala Est & Centro)',
    serverName: 'Marco Gentili',
    zone: 'main_b',
    description: 'Tavoli 2-pax: 13, 15, 22, 23 | Tavoli 4-pax: 14, 16',
    twoSeaters: ['13', '15', '22', '23'],
    fourSeaters: ['14', '16'],
  },
  section_3: {
    id: 'section_3',
    name: 'Sezione 3 — Private Room (Privé)',
    serverName: 'Chiara Valli',
    zone: 'private',
    description: 'Tavolo 2-pax: 30 | Tavoli 4-pax: 31, 32, 33, 34',
    twoSeaters: ['30'],
    fourSeaters: ['31', '32', '33', '34'],
  },
};

/**
 * Returns the assigned dining room section for a given table.
 */
export function getTableDiningSection(tableId: string, zone?: string): DiningSectionInfo {
  // Section 1: Main A / West wing
  if (['G', '10', '11', '12', '20', '21'].includes(tableId) || zone === 'main_a') {
    return DINING_SECTIONS.section_1;
  }
  // Section 2: Main B / East wing & Center
  if (['13', '14', '15', '16', '22', '23'].includes(tableId) || zone === 'main_b') {
    return DINING_SECTIONS.section_2;
  }
  // Section 3: Private Room
  return DINING_SECTIONS.section_3;
}

/**
 * Counts how many tables are already booked to ARRIVE at a specific 15-minute slot
 * across each of the 3 dining room sections.
 */
export function getSectionArrivalsForSlot(
  date: string,
  startTime: string,
  reservations: Reservation[],
  excludeReservationId?: string
): Record<DiningSectionId, number> {
  const counts: Record<DiningSectionId, number> = {
    section_1: 0,
    section_2: 0,
    section_3: 0,
  };

  const slotReservations = reservations.filter(
    (r) =>
      r.reservationDate === date &&
      r.startTime === startTime &&
      r.status !== 'cancelled' &&
      r.id !== excludeReservationId
  );

  for (const r of slotReservations) {
    const sec = getTableDiningSection(r.tableId);
    if (counts[sec.id] !== undefined) {
      counts[sec.id] = (counts[sec.id] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Determines the round-robin section priority order for the next reservation.
 * 1st -> Main A (section_1)
 * 2nd -> Main B (section_2)
 * 3rd -> Private Room (section_3)
 * 4th -> Main A, and so on.
 */
export function getSectionRoundRobinOrder(
  date: string,
  startTime: string,
  reservations: Reservation[],
  excludeReservationId?: string
): DiningSectionId[] {
  // Check active arrivals for this specific 15-min slot
  const slotArrivals = getSectionArrivalsForSlot(date, startTime, reservations, excludeReservationId);

  // If there are zero arrivals in this slot across all sections, check total day/service reservations
  const totalSlot = slotArrivals.section_1 + slotArrivals.section_2 + slotArrivals.section_3;

  let counts: Record<DiningSectionId, number> = slotArrivals;

  if (totalSlot === 0) {
    // Check total active reservations for the day to keep global shift balance
    const dayCounts: Record<DiningSectionId, number> = {
      section_1: 0,
      section_2: 0,
      section_3: 0,
    };
    for (const r of reservations) {
      if (r.reservationDate === date && r.status !== 'cancelled' && r.id !== excludeReservationId) {
        const sec = getTableDiningSection(r.tableId);
        if (dayCounts[sec.id] !== undefined) {
          dayCounts[sec.id]++;
        }
      }
    }
    counts = dayCounts;
  }

  // Determine section rotation based on lowest count, with strict priority order: section_1 -> section_2 -> section_3
  const sectionList: DiningSectionId[] = ['section_1', 'section_2', 'section_3'];

  // Sort sections: least booked first. In case of tie, keep the canonical order (Main A -> Main B -> Private)
  sectionList.sort((a, b) => {
    const diff = (counts[a] || 0) - (counts[b] || 0);
    if (diff !== 0) return diff;
    const orderMap: Record<DiningSectionId, number> = { section_1: 1, section_2: 2, section_3: 3 };
    return orderMap[a] - orderMap[b];
  });

  return sectionList;
}

/**
 * Strict Concurrency & 15-Minute Slot Pacing Engine.
 * 
 * Rules specified by management:
 * In any 15-minute slot (e.g. at 19:30):
 * The limit of tables arriving at that specific 15-minute slot is:
 * - Option A: Max 2 tables of 4 (and 0 of 2)
 * - Option B: Max 1 table of 4 AND up to 2 tables of 2
 * - Option C: Max 3 tables of 2 (and 0 of 4)
 * 
 * In the next 15-minute slot (e.g. 19:45):
 * Another set of guests can arrive following the exact same rules.
 * And so on every 15 minutes until all the physical tables in the restaurant are occupied.
 * 
 * This gives waiters 15 minutes to greet guests, explain the menu, and take food/drink orders
 * without overwhelming any server section or sending kitchen ticket storms all at once.
 */
export function validateAdvanceBookingSlotLimits(
  date: string,
  startTime: string,
  endTime: string,
  partySize: number,
  reservations: Reservation[],
  excludeReservationId?: string
): SlotValidationResult {
  const isRequested4Seater = partySize >= 3;

  // Filter reservations on the same date arriving at this specific 15-minute slot
  const slotArrivals = reservations.filter(
    (r) =>
      r.reservationDate === date &&
      !r.isWalkIn &&
      r.status !== 'cancelled' &&
      r.status !== 'completed' &&
      r.id !== excludeReservationId &&
      r.startTime === startTime
  );

  let count2 = 0;
  let count4 = 0;

  for (const res of slotArrivals) {
    if (res.partySize <= 2) {
      count2++;
    } else {
      count4++;
    }
  }

  const projected2 = count2 + (isRequested4Seater ? 0 : 1);
  const projected4 = count4 + (isRequested4Seater ? 1 : 0);

  // Management Rules per 15-minute slot:
  // Option A: 2 tables of 4 (projected4 <= 2 && projected2 === 0)
  // Option B: 1 table of 4 and 2 tables of 2 (projected4 <= 1 && projected2 <= 2)
  // Option C: 3 tables of 2 (projected4 === 0 && projected2 <= 3)
  const satisfiesOptionA = projected4 <= 2 && projected2 === 0;
  const satisfiesOptionB = projected4 <= 1 && projected2 <= 2;
  const satisfiesOptionC = projected4 === 0 && projected2 <= 3;

  if (!satisfiesOptionA && !satisfiesOptionB && !satisfiesOptionC) {
    let explanation = '';
    if (isRequested4Seater) {
      explanation = `Lo scaglione delle ${startTime} ha già ${count4} tavoli da 4 e ${count2} tavoli da 2 in arrivo. Il limite per slot di 15 min è 2 tavoli da 4 (senza tavoli da 2) oppure 1 tavolo da 4 + 2 tavoli da 2.`;
    } else {
      explanation = `Lo scaglione delle ${startTime} ha già ${count4} tavoli da 4 e ${count2} tavoli da 2 in arrivo. Il limite per slot di 15 min è 3 tavoli da 2 (oppure 2 tavoli da 2 se è presente 1 tavolo da 4).`;
    }

    return {
      isValid: false,
      reason: `Spiacenti, la fascia oraria delle ${startTime} ha raggiunto il limite massimo di arrivi scaglionati. ${explanation} Si consiglia di selezionare lo scaglione delle 15 minuti successivi per garantire il ritmo ottimale di servizio in sala e in cucina.`,
      violatingSlot: startTime,
      active2Seaters: count2,
      active4Seaters: count4,
      maxAllowedNotice: 'Max: 2 tab da 4 (0 tab da 2) | 1 tab da 4 + 2 tab da 2 | 3 tab da 2 (0 tab da 4)',
    };
  }

  return {
    isValid: true,
    active2Seaters: count2,
    active4Seaters: count4,
    maxAllowedNotice: 'Capacità slot 15 min disponibile',
  };
}

export function calcReservationDuration(partySize: number, settings?: RestaurantSettings): number {
  if (partySize <= 2) return settings?.durationSmallMins ?? 120;
  if (partySize <= 4) return settings?.durationMediumMins ?? 150;
  return settings?.durationLargeMins ?? 150;
}

export function isTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMins(startA);
  const eA = timeToMins(endA);
  const sB = timeToMins(startB);
  const eB = timeToMins(endB);

  // Overlap condition: max(startA, startB) < min(endA, endB)
  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Checks if a specific physical table is free on a given date and time window.
 */
export function isTableFreeDuringSlot(
  tableId: string,
  date: string,
  startTime: string,
  endTime: string,
  reservations: Reservation[],
  excludeReservationId?: string
): boolean {
  const activeReservations = reservations.filter(
    (r) =>
      r.reservationDate === date &&
      r.status !== 'cancelled' &&
      r.status !== 'completed' &&
      r.id !== excludeReservationId
  );

  for (const res of activeReservations) {
    const isTargeted =
      res.tableId === tableId ||
      (res.assignedTableIds && res.assignedTableIds.includes(tableId));

    if (isTargeted) {
      if (isTimeOverlap(startTime, endTime, res.startTime, res.endTime)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Table priority maps for each section according to exact restaurant specification:
 * - Main A: 2-pax [G, 10, 11], 4-pax [12, 20, 21]
 * - Main B: 2-pax [13, 15, 22, 23], 4-pax [14, 16]
 * - Private Room: 2-pax [30], 4-pax [31, 32, 33, 34]
 * - Bar: [B1, B2, B3, B4] (Sala d'attesa e tampone)
 */
export const SECTION_CANONICAL_TABLES: Record<DiningSectionId, { twoPax: string[]; fourPax: string[] }> = {
  section_1: {
    twoPax: ['G', '10', '11'],
    fourPax: ['12', '20', '21'],
  },
  section_2: {
    twoPax: ['13', '15', '22', '23'],
    fourPax: ['14', '16'],
  },
  section_3: {
    twoPax: ['30'],
    fourPax: ['31', '32', '33', '34'],
  },
};

/**
 * Finds all single tables and pre-existing groups available for a booking,
 * ordered by the exact 3-section round-robin algorithm and capacity rules:
 * - 1-2 pax: Strict 2-seaters (Main A -> Main B -> Private Room). No 4-seaters in direct matches!
 * - 3-5 pax: 4-seaters (Main A -> Main B -> Private Room).
 * - Bar tables (B1-B4) are buffer/waiting area.
 */
export function getAvailableSingleAndGroupTables(
  date: string,
  startTime: string,
  endTime: string,
  partySize: number,
  tables: RestaurantTable[],
  reservations: Reservation[],
  activeGroups: TableGroup[],
  excludeReservationId?: string
): {
  directMatches: TimeSlotOption[];
  oversizedMatches: TimeSlotOption[];
} {
  const directMatches: TimeSlotOption[] = [];
  const oversizedMatches: TimeSlotOption[] = [];

  // Calculate live section arrivals & section round-robin rotation order
  const sectionArrivals = getSectionArrivalsForSlot(date, startTime, reservations, excludeReservationId);
  const prioritizedSectionOrder = getSectionRoundRobinOrder(date, startTime, reservations, excludeReservationId);

  // 1. Check existing active TableGroups for this date
  const dateGroups = activeGroups.filter((g) => g.groupDate === date);
  for (const group of dateGroups) {
    const allMembersFree = group.memberTableIds.every((mId) =>
      isTableFreeDuringSlot(mId, date, startTime, endTime, reservations, excludeReservationId)
    );

    if (allMembersFree) {
      const section = getTableDiningSection(group.memberTableIds[0], group.zone);
      const arrivalsInSec = sectionArrivals[section.id] || 0;

      const option: TimeSlotOption = {
        tableId: group.memberTableIds[0], // primary anchor
        tableName: group.combinedName,
        capacity: group.totalCapacity,
        isGroup: true,
        memberTableIds: group.memberTableIds,
        zone: group.zone,
        fitScore: Math.max(0, group.totalCapacity - partySize),
        sectionId: section.id,
        sectionName: section.name,
        serverName: section.serverName,
        sectionArrivalsAtSlot: arrivalsInSec,
        isRecommendedForBalancing: arrivalsInSec === 0,
      };

      if (group.totalCapacity >= partySize) {
        if (partySize > 4 && group.totalCapacity <= partySize + 2) {
          directMatches.push(option);
        } else {
          oversizedMatches.push(option);
        }
      }
    }
  }

  // 2. Check individual tables
  for (const table of tables) {
    // If the table is part of an active group on this date, handle it as part of that group
    const isPartOfActiveGroup = dateGroups.some((g) =>
      g.memberTableIds.includes(table.id)
    );
    if (isPartOfActiveGroup) continue;

    const isFree = isTableFreeDuringSlot(
      table.id,
      date,
      startTime,
      endTime,
      reservations,
      excludeReservationId
    );

    if (isFree) {
      const cap = table.capacityOverride || table.capacity;
      const isBar = table.zone === 'bar' || ['B1', 'B2', 'B3', 'B4'].includes(table.id);
      const section = getTableDiningSection(table.id, table.zone);
      const arrivalsInSec = isBar ? 99 : (sectionArrivals[section.id] || 0);

      const option: TimeSlotOption = {
        tableId: table.id,
        tableName: table.id === 'G' ? 'Tavolo G (Booth VIP)' : `Tavolo ${table.tableNumber}`,
        capacity: cap,
        isGroup: false,
        memberTableIds: [table.id],
        zone: table.zone,
        fitScore: Math.max(0, cap - partySize),
        sectionId: isBar ? 'bar_waiting' : section.id,
        sectionName: isBar ? "Bar / Area d'Attesa Tampone" : section.name,
        serverName: isBar ? 'Banco Bar' : section.serverName,
        sectionArrivalsAtSlot: arrivalsInSec,
        isRecommendedForBalancing: !isBar && arrivalsInSec === 0,
      };

      if (isBar) {
        // Bar tables are buffer / holding area: placed in oversized/alternative matches
        if (cap >= partySize) {
          oversizedMatches.push(option);
        }
        continue;
      }

      // DINING ROOM RULES:
      if (partySize <= 2) {
        // Strict: 1-2 pax ONLY matches 2-seaters (capacity === 2) as direct matches
        if (cap === 2) {
          directMatches.push(option);
        } else if (cap >= 4) {
          // Do not sit 2 pax in 4-seater: place in oversizedMatches as last resort fallback
          oversizedMatches.push(option);
        }
      } else if (partySize <= 5) {
        // 3-5 pax matches 4-seaters (capacity >= 4)
        if (cap >= 4 && cap <= 5) {
          directMatches.push(option);
        } else if (cap > 5) {
          oversizedMatches.push(option);
        }
      } else {
        // 6+ pax: matches large tables or merges
        if (cap >= partySize && cap <= partySize + 2) {
          directMatches.push(option);
        } else if (cap > partySize + 2) {
          oversizedMatches.push(option);
        }
      }
    }
  }

  // Helper sorting function strictly respecting:
  // 1. Non-bar first
  // 2. Section Round-Robin Order (Main A -> Main B -> Private Room)
  // 3. Exact table order within section (e.g. G, 10, 11 for Main A 2-pax; 12, 20, 21 for Main A 4-pax; etc.)
  const sortDiningOptions = (a: TimeSlotOption, b: TimeSlotOption) => {
    // Non-bar before bar
    const aIsBar = a.sectionId === 'bar_waiting' || a.zone === 'bar';
    const bIsBar = b.sectionId === 'bar_waiting' || b.zone === 'bar';
    if (aIsBar && !bIsBar) return 1;
    if (!aIsBar && bIsBar) return -1;

    // Compare section round-robin priority index
    const aSecIndex = prioritizedSectionOrder.indexOf(a.sectionId as DiningSectionId);
    const bSecIndex = prioritizedSectionOrder.indexOf(b.sectionId as DiningSectionId);

    const normASec = aSecIndex === -1 ? 99 : aSecIndex;
    const normBSec = bSecIndex === -1 ? 99 : bSecIndex;

    if (normASec !== normBSec) {
      return normASec - normBSec;
    }

    // Inside same section, sort by table priority list
    const secKey = a.sectionId as DiningSectionId;
    const canon = SECTION_CANONICAL_TABLES[secKey];
    if (canon) {
      const list = partySize <= 2 ? canon.twoPax : canon.fourPax;
      const aIdx = list.indexOf(a.tableId);
      const bIdx = list.indexOf(b.tableId);
      const normA = aIdx === -1 ? 99 : aIdx;
      const normB = bIdx === -1 ? 99 : bIdx;
      if (normA !== normB) return normA - normB;
    }

    // Closest fit score
    return a.fitScore - b.fitScore;
  };

  directMatches.sort(sortDiningOptions);
  oversizedMatches.sort(sortDiningOptions);

  return { directMatches, oversizedMatches };
}

export interface AutoAssignResult {
  table: TimeSlotOption | null;
  sectionId?: DiningSectionId;
  sectionName?: string;
  serverName?: string;
  reason: string;
}

/**
 * Automates table allocation for a new booking using the exact management rotation:
 * 1. Checks 15-minute slot capacity
 * 2. Picks next section in sequence: Main A -> Main B -> Private Room
 * 3. Matches party capacity (1-2 pax -> 2-seaters, 3-5 pax -> 4-seaters)
 * 4. Never places 1-2 pax in 4-seaters while any 2-seater is available across dining sections
 */
export function findBestAutoAssignedTable(
  date: string,
  startTime: string,
  endTime: string,
  partySize: number,
  tables: RestaurantTable[],
  reservations: Reservation[],
  activeGroups: TableGroup[] = [],
  excludeReservationId?: string
): AutoAssignResult {
  const { directMatches, oversizedMatches } = getAvailableSingleAndGroupTables(
    date,
    startTime,
    endTime,
    partySize,
    tables,
    reservations,
    activeGroups,
    excludeReservationId
  );

  if (directMatches.length > 0) {
    const chosen = directMatches[0];
    const sec = chosen.sectionId ? DINING_SECTIONS[chosen.sectionId as DiningSectionId] : undefined;
    return {
      table: chosen,
      sectionId: chosen.sectionId as DiningSectionId,
      sectionName: chosen.sectionName,
      serverName: chosen.serverName,
      reason: `Assegnazione automatica ottimale: ${chosen.tableName} in ${chosen.sectionName} (${partySize <= 2 ? 'Tavolo 2-pax dedicato' : 'Tavolo 4-pax dedicato'}). Rotazione bilanciata per il cameriere ${chosen.serverName}.`,
    };
  }

  if (oversizedMatches.length > 0) {
    const chosen = oversizedMatches[0];
    return {
      table: chosen,
      sectionId: chosen.sectionId as DiningSectionId,
      sectionName: chosen.sectionName,
      serverName: chosen.serverName,
      reason: `Tutti i tavoli dedicati da ${partySize <= 2 ? '2' : '4'} persone sono occupati nelle 3 sezioni per le ${startTime}. Proposto ${chosen.tableName} come alternativa.`,
    };
  }

  return {
    table: null,
    reason: `Nessun tavolo disponibile per ${partySize} persone nello scaglione delle ${startTime}.`,
  };
}

/**
 * Intelligent Combination Engine:
 * Suggests adjoining tables to join if party size is larger than single tables or if optimal.
 */
export function findSmartMergeCombinations(
  date: string,
  startTime: string,
  endTime: string,
  partySize: number,
  tables: RestaurantTable[],
  reservations: Reservation[],
  activeGroups: TableGroup[]
): RecommendedMerge[] {
  // Pre-configured adjacent join clusters across zones
  const candidateClusters: { zone: RestaurantTable['zone']; tableIds: string[] }[] = [
    // Main dining lower row pairs
    { zone: 'main', tableIds: ['10', '11'] },
    { zone: 'main', tableIds: ['11', '12'] },
    { zone: 'main', tableIds: ['10', '11', '12'] },
    { zone: 'main', tableIds: ['13', '14'] },
    { zone: 'main', tableIds: ['14', '15'] },
    { zone: 'main', tableIds: ['13', '14', '15'] },
    { zone: 'main', tableIds: ['15', '16'] },
    // Main dining upper row
    { zone: 'main', tableIds: ['20', '21'] },
    { zone: 'main', tableIds: ['22', '23'] },
    { zone: 'main', tableIds: ['21', '22'] },
    { zone: 'main', tableIds: ['20', '21', '22'] },
    // Private dining room
    { zone: 'private', tableIds: ['31', '30'] },
    { zone: 'private', tableIds: ['34', '33'] },
    { zone: 'private', tableIds: ['33', '32'] },
    { zone: 'private', tableIds: ['34', '33', '32'] },
    { zone: 'private', tableIds: ['31', '30', '34', '33'] },
    // Bar area
    { zone: 'bar', tableIds: ['B1', 'B2'] },
    { zone: 'bar', tableIds: ['B2', 'B3'] },
    { zone: 'bar', tableIds: ['B3', 'B4'] },
    { zone: 'bar', tableIds: ['B1', 'B2', 'B3'] },
  ];

  const recommendations: RecommendedMerge[] = [];
  const tableMap = new Map(tables.map((t) => [t.id, t]));

  for (const candidate of candidateClusters) {
    // Check if all tables in candidate exist
    const memberTables = candidate.tableIds
      .map((id) => tableMap.get(id))
      .filter((t): t is RestaurantTable => Boolean(t));

    if (memberTables.length !== candidate.tableIds.length) continue;

    // Check total combined capacity
    const totalCapacity = memberTables.reduce(
      (sum, t) => sum + (t.capacityOverride || t.capacity),
      0
    );

    // Must be able to accommodate party
    if (totalCapacity < partySize) continue;

    // Don't recommend gigantic 12-person table for 3 people
    if (totalCapacity > partySize + 4 && partySize <= 4) continue;

    // Check if EVERY table in the cluster is free
    const allFree = candidate.tableIds.every((tId) =>
      isTableFreeDuringSlot(tId, date, startTime, endTime, reservations)
    );

    if (allFree) {
      recommendations.push({
        combinedName: `Uniti (${candidate.tableIds.join('+')})`,
        tableIds: candidate.tableIds,
        totalCapacity,
        zone: candidate.zone,
        fitScore: totalCapacity - partySize,
      });
    }
  }

  // Sort by closest capacity fit
  recommendations.sort((a, b) => a.fitScore - b.fitScore);
  return recommendations;
}

export function generateBookingCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `ST-${digits}`;
}

export interface TableLiveStatus {
  status: 'free' | 'reserved' | 'seated' | 'warning' | 'expired';
  currentReservation?: Reservation;
  nextReservation?: Reservation;
  elapsedMinutes?: number;
  remainingMinutes?: number;
  occupancyPercent?: number;
}

/**
 * Computes the real-time status of a table at any instant (current or selected time).
 */
export function computeTableInstantStatus(
  tableId: string,
  date: string,
  instantTimeStr: string,
  reservations: Reservation[],
  settings: RestaurantSettings
): TableLiveStatus {
  const instantMins = timeToMins(instantTimeStr);
  const dateReservations = reservations.filter(
    (r) => r.reservationDate === date && r.status !== 'cancelled'
  );

  // Find active seated or currently running reservation
  const currentActive = dateReservations.find((r) => {
    const isTargeted =
      r.tableId === tableId ||
      (r.assignedTableIds && r.assignedTableIds.includes(tableId));
    if (!isTargeted) return false;

    if (r.status === 'seated') return true;

    if (r.status === 'confirmed') {
      const sMins = timeToMins(r.startTime);
      const eMins = timeToMins(r.endTime);
      return instantMins >= sMins && instantMins < eMins;
    }

    return false;
  });

  if (currentActive) {
    if (currentActive.status === 'seated' && currentActive.seatedAt) {
      const seatedDate = new Date(currentActive.seatedAt);
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - seatedDate.getTime());
      const elapsedMinutes = Math.floor(diffMs / 60000);
      const maxTurn = settings.maxTurnMins || 120;
      const remainingMinutes = Math.max(0, maxTurn - elapsedMinutes);
      const occupancyPercent = Math.min(100, Math.round((elapsedMinutes / maxTurn) * 100));

      let statusType: TableLiveStatus['status'] = 'seated';
      if (elapsedMinutes >= maxTurn) {
        statusType = 'expired';
      } else if (elapsedMinutes >= (settings.turnWarningMins || 100)) {
        statusType = 'warning';
      }

      return {
        status: statusType,
        currentReservation: currentActive,
        elapsedMinutes,
        remainingMinutes,
        occupancyPercent,
      };
    }

    return {
      status: 'reserved',
      currentReservation: currentActive,
    };
  }

  // Check next upcoming reservation in next 60 mins
  const nextRes = dateReservations
    .filter((r) => {
      const isTargeted =
        r.tableId === tableId || (r.assignedTableIds && r.assignedTableIds.includes(tableId));
      if (!isTargeted || r.status === 'completed') return false;
      const sMins = timeToMins(r.startTime);
      return sMins > instantMins && sMins <= instantMins + 60;
    })
    .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime))[0];

  return {
    status: 'free',
    nextReservation: nextRes,
  };
}

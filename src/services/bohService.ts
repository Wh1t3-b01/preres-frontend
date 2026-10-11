import {
  FloorPlanLayout,
  BohTable,
  DiningAreaZone,
  TableCombination,
  BohRules,
  DaySchedule,
  SpecialDayOverride,
  BohDraftState,
  BohShift,
  BohTableType,
} from '../types/boh';
import { RestaurantTable } from '../types';

const STORAGE_KEYS = {
  LIVE_LAYOUTS: 'boh_live_layouts_v4',
  LIVE_COMBINATIONS: 'boh_live_combinations_v4',
  LIVE_RULES: 'boh_live_rules_v4',
  LIVE_SCHEDULES: 'boh_live_schedules_v4',
  LIVE_SPECIAL_DAYS: 'boh_live_special_days_v4',
  DRAFT_CONFIG: 'boh_draft_config_v4',
  LAST_PUBLISHED: 'boh_last_published_timestamp_v4',
};

// -------------------------------------------------------------
// REAL DINING AREAS (The exact 4 rooms of Sotto Sotto)
// -------------------------------------------------------------
export const SOTTO_SOTTO_DINING_AREAS: DiningAreaZone[] = [
  {
    id: 'area_bar',
    title: '1. BAR',
    locationTag: 'Sala Bar & Lounge',
    description: 'Tavoli B1 - B4 (2 pax compatti e 4 pax bench) & Bancone Ovest',
    color: '#F59E0B',
    tableIds: ['B1', 'B2', 'B3', 'B4'],
    dimensions: { widthMeters: 10, heightMeters: 8 },
  },
  {
    id: 'area_main_a',
    title: '2. MAIN A',
    locationTag: 'Ala Ovest',
    description: 'Booth VIP G, Tavoli Nord 10, 11, 12 e Sud 20, 21',
    color: '#3B82F6',
    tableIds: ['G', '10', '11', '12', '20', '21'],
    dimensions: { widthMeters: 14, heightMeters: 10 },
  },
  {
    id: 'area_main_b',
    title: '3. MAIN B',
    locationTag: 'Ala Est',
    description: 'Tavoli Nord 13, 14, 15, 16 e Sud 22, 23',
    color: '#8B5CF6',
    tableIds: ['13', '14', '15', '16', '22', '23'],
    dimensions: { widthMeters: 14, heightMeters: 10 },
  },
  {
    id: 'area_private',
    title: '4. PRIVATE DINING ROOM',
    locationTag: 'Privé Riservato',
    description: 'Tavoli 30-34 per cene riservate ed eventi speciali',
    color: '#10B981',
    tableIds: ['30', '31', '32', '33', '34'],
    dimensions: { widthMeters: 12, heightMeters: 9 },
  },
];

// -------------------------------------------------------------
// REAL RESTAURANT TABLES (21 Tables across 4 rooms)
// -------------------------------------------------------------
export const SOTTO_SOTTO_REAL_TABLES: BohTable[] = [
  // 1. BAR (B1, B2, B3, B4)
  {
    id: 'B1',
    tableNumber: 'B1',
    name: 'Tavolo B1',
    shape: 'rect-v',
    tableType: 'bar',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 22,
    y: 18,
    width: 80,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_bar',
    adjacentWith: ['B2'],
  },
  {
    id: 'B2',
    tableNumber: 'B2',
    name: 'Tavolo B2',
    shape: 'rect-v',
    tableType: 'bar',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 50,
    y: 18,
    width: 80,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_bar',
    adjacentWith: ['B1', 'B3'],
  },
  {
    id: 'B3',
    tableNumber: 'B3',
    name: 'Tavolo B3',
    shape: 'rect-v',
    tableType: 'bar',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 78,
    y: 18,
    width: 80,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_bar',
    adjacentWith: ['B2'],
  },
  {
    id: 'B4',
    tableNumber: 'B4',
    name: 'Tavolo B4',
    shape: 'rect-h',
    tableType: 'bar',
    minPartySize: 2,
    maxPartySize: 4,
    physicalSeats: 4,
    x: 36,
    y: 62,
    width: 130,
    height: 85,
    rotation: 0,
    diningAreaId: 'area_bar',
    adjacentWith: ['B1', 'B2'],
  },

  // 2. MAIN A (G, 10, 11, 12, 20, 21)
  {
    id: 'G',
    tableNumber: 'G',
    name: 'Tavolo G (Booth VIP)',
    shape: 'rect-v',
    tableType: 'private',
    minPartySize: 2,
    maxPartySize: 6,
    physicalSeats: 6,
    x: 6,
    y: 40,
    width: 85,
    height: 115,
    rotation: 0,
    diningAreaId: 'area_main_a',
    adjacentWith: [],
  },
  {
    id: '10',
    tableNumber: '10',
    name: 'Tavolo 10',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 32,
    y: 18,
    width: 75,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_a',
    adjacentWith: ['11'],
  },
  {
    id: '11',
    tableNumber: '11',
    name: 'Tavolo 11',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 56,
    y: 18,
    width: 75,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_a',
    adjacentWith: ['10', '12'],
  },
  {
    id: '12',
    tableNumber: '12',
    name: 'Tavolo 12',
    shape: 'rect-h',
    tableType: 'regular',
    minPartySize: 2,
    maxPartySize: 4,
    physicalSeats: 4,
    x: 80,
    y: 18,
    width: 105,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_a',
    adjacentWith: ['11'],
  },
  {
    id: '20',
    tableNumber: '20',
    name: 'Tavolo 20',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 2,
    maxPartySize: 5,
    physicalSeats: 4,
    x: 40,
    y: 62,
    width: 95,
    height: 110,
    rotation: 0,
    diningAreaId: 'area_main_a',
    adjacentWith: ['21'],
  },
  {
    id: '21',
    tableNumber: '21',
    name: 'Tavolo 21',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 2,
    maxPartySize: 5,
    physicalSeats: 4,
    x: 76,
    y: 62,
    width: 95,
    height: 110,
    rotation: 0,
    diningAreaId: 'area_main_a',
    adjacentWith: ['20'],
  },

  // 3. MAIN B (13, 14, 15, 16, 22, 23)
  {
    id: '13',
    tableNumber: '13',
    name: 'Tavolo 13',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 8,
    y: 16,
    width: 75,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_b',
    adjacentWith: ['14'],
  },
  {
    id: '14',
    tableNumber: '14',
    name: 'Tavolo 14',
    shape: 'rect-h',
    tableType: 'regular',
    minPartySize: 2,
    maxPartySize: 5,
    physicalSeats: 4,
    x: 32,
    y: 16,
    width: 110,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_b',
    adjacentWith: ['13', '15'],
  },
  {
    id: '15',
    tableNumber: '15',
    name: 'Tavolo 15',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 58,
    y: 16,
    width: 75,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_b',
    adjacentWith: ['14', '16'],
  },
  {
    id: '16',
    tableNumber: '16',
    name: 'Tavolo 16',
    shape: 'rect-h',
    tableType: 'regular',
    minPartySize: 2,
    maxPartySize: 5,
    physicalSeats: 4,
    x: 80,
    y: 16,
    width: 110,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_b',
    adjacentWith: ['15'],
  },
  {
    id: '22',
    tableNumber: '22',
    name: 'Tavolo 22',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 1,
    maxPartySize: 3,
    physicalSeats: 2,
    x: 36,
    y: 60,
    width: 75,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_b',
    adjacentWith: ['23'],
  },
  {
    id: '23',
    tableNumber: '23',
    name: 'Tavolo 23',
    shape: 'rect-v',
    tableType: 'regular',
    minPartySize: 1,
    maxPartySize: 3,
    physicalSeats: 2,
    x: 68,
    y: 60,
    width: 75,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_main_b',
    adjacentWith: ['22'],
  },

  // 4. PRIVATE DINING ROOM (30, 31, 32, 33, 34)
  {
    id: '30',
    tableNumber: '30',
    name: 'Tavolo 30',
    shape: 'rect-v',
    tableType: 'private',
    minPartySize: 1,
    maxPartySize: 2,
    physicalSeats: 2,
    x: 10,
    y: 18,
    width: 75,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_private',
    adjacentWith: ['31'],
  },
  {
    id: '31',
    tableNumber: '31',
    name: 'Tavolo 31',
    shape: 'rect-h',
    tableType: 'private',
    minPartySize: 2,
    maxPartySize: 4,
    physicalSeats: 4,
    x: 40,
    y: 18,
    width: 110,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_private',
    adjacentWith: ['30', '32'],
  },
  {
    id: '32',
    tableNumber: '32',
    name: 'Tavolo 32',
    shape: 'rect-h',
    tableType: 'private',
    minPartySize: 2,
    maxPartySize: 4,
    physicalSeats: 4,
    x: 74,
    y: 18,
    width: 110,
    height: 95,
    rotation: 0,
    diningAreaId: 'area_private',
    adjacentWith: ['31'],
  },
  {
    id: '33',
    tableNumber: '33',
    name: 'Tavolo 33',
    shape: 'rect-v',
    tableType: 'private',
    minPartySize: 2,
    maxPartySize: 4,
    physicalSeats: 4,
    x: 24,
    y: 58,
    width: 90,
    height: 115,
    rotation: 0,
    diningAreaId: 'area_private',
    adjacentWith: ['34'],
  },
  {
    id: '34',
    tableNumber: '34',
    name: 'Tavolo 34',
    shape: 'rect-v',
    tableType: 'private',
    minPartySize: 2,
    maxPartySize: 4,
    physicalSeats: 4,
    x: 66,
    y: 58,
    width: 90,
    height: 115,
    rotation: 0,
    diningAreaId: 'area_private',
    adjacentWith: ['33'],
  },
];

// -------------------------------------------------------------
// SEED DATA: 1. REAL RESTAURANT FLOOR PLANS (The 4 Real Rooms)
// -------------------------------------------------------------
const SOTTO_SOTTO_OFFICIAL_LAYOUT: FloorPlanLayout = {
  id: 'layout_sotto_sotto_official',
  name: 'Sotto Sotto — Layout Principale (BAR, MAIN A, MAIN B, PRIVÉ)',
  description: 'Layout attivo del ristorante con le 4 sale autentiche: 1. BAR, 2. MAIN A, 3. MAIN B, 4. PRIVATE DINING ROOM (21 tavoli).',
  isDefault: true,
  rotation: 0,
  canvasDimensions: {
    widthMeters: 24,
    heightMeters: 16,
    gridScale: 50,
  },
  diningAreas: SOTTO_SOTTO_DINING_AREAS,
  tables: SOTTO_SOTTO_REAL_TABLES,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T15:00:00Z',
};

const SOTTO_SOTTO_EVENTS_LAYOUT: FloorPlanLayout = {
  id: 'layout_sotto_sotto_events',
  name: 'Sotto Sotto — Layout Grandi Gruppi & Eventi (4 Sale)',
  description: 'Disposizione per banchetti ed eventi nelle 4 sale autentiche: 1. BAR, 2. MAIN A, 3. MAIN B, 4. PRIVATE DINING ROOM.',
  isDefault: false,
  rotation: 0,
  canvasDimensions: {
    widthMeters: 24,
    heightMeters: 16,
    gridScale: 50,
  },
  diningAreas: SOTTO_SOTTO_DINING_AREAS,
  tables: SOTTO_SOTTO_REAL_TABLES.map((t) => {
    // Extended capacities for event layout
    if (['10', '11', '12', '20', '21', '31', '32', '33', '34'].includes(t.id)) {
      return { ...t, maxPartySize: t.maxPartySize + 2 };
    }
    return t;
  }),
  createdAt: '2026-03-15T12:00:00Z',
  updatedAt: '2026-03-15T15:00:00Z',
};

// -------------------------------------------------------------
// SEED DATA: 2. REAL TABLE COMBINATIONS
// -------------------------------------------------------------
const SOTTO_SOTTO_COMBINATIONS: TableCombination[] = [
  {
    id: 'combo_10_11',
    name: 'Unione 10 + 11 (Main A)',
    tableIds: ['10', '11'],
    tableType: 'regular',
    minPartySize: 4,
    maxPartySize: 6,
    totalPhysicalSeats: 4,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Unione standard in linea retta parete Nord Main A.',
  },
  {
    id: 'combo_11_12',
    name: 'Unione 11 + 12 (Main A)',
    tableIds: ['11', '12'],
    tableType: 'regular',
    minPartySize: 4,
    maxPartySize: 8,
    totalPhysicalSeats: 6,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Adiacenza orizzontale diretta 11 e 12 panca parete Nord.',
  },
  {
    id: 'combo_20_21',
    name: 'Unione 20 + 21 (Main A)',
    tableIds: ['20', '21'],
    tableType: 'regular',
    minPartySize: 6,
    maxPartySize: 10,
    totalPhysicalSeats: 8,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Tavolata Sud Main A con servizio cameriere in testata.',
  },
  {
    id: 'combo_13_14',
    name: 'Unione 13 + 14 (Main B)',
    tableIds: ['13', '14'],
    tableType: 'regular',
    minPartySize: 4,
    maxPartySize: 8,
    totalPhysicalSeats: 6,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Accostamento fila 1 Nord Main B.',
  },
  {
    id: 'combo_15_16',
    name: 'Unione 15 + 16 (Main B)',
    tableIds: ['15', '16'],
    tableType: 'regular',
    minPartySize: 4,
    maxPartySize: 8,
    totalPhysicalSeats: 6,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Accostamento fila 1 Est Main B.',
  },
  {
    id: 'combo_22_23',
    name: 'Unione 22 + 23 (Main B)',
    tableIds: ['22', '23'],
    tableType: 'regular',
    minPartySize: 4,
    maxPartySize: 6,
    totalPhysicalSeats: 4,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Fila 2 Sud Main B per tavolata media.',
  },
  {
    id: 'combo_b1_b2',
    name: 'Aperitivo B1 + B2 (Bar)',
    tableIds: ['B1', 'B2'],
    tableType: 'bar',
    minPartySize: 3,
    maxPartySize: 5,
    totalPhysicalSeats: 4,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Tavoli Bar uniti per aperitivo o drink pre-cena.',
  },
  {
    id: 'combo_30_31',
    name: 'Unione 30 + 31 (Private Dining)',
    tableIds: ['30', '31'],
    tableType: 'private',
    minPartySize: 4,
    maxPartySize: 8,
    totalPhysicalSeats: 6,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Tavolata parete Nord nel Private Dining Room.',
  },
  {
    id: 'combo_33_34',
    name: 'Grande Tavolo 33 + 34 (Private Dining)',
    tableIds: ['33', '34'],
    tableType: 'private',
    minPartySize: 6,
    maxPartySize: 10,
    totalPhysicalSeats: 8,
    floorPlanId: 'layout_sotto_sotto_official',
    isActive: true,
    notes: 'Fila Sud Private Dining per banchetto riservato.',
  },
];

// -------------------------------------------------------------
// SEED DATA: 3. Settings & Rules
// -------------------------------------------------------------
const DEFAULT_BOH_RULES: BohRules = {
  largeParty: {
    threshold: 6,
    disableOnlineBooking: true,
    requireDeposit: true,
    depositAmountPerCover: 25,
    customNotice: 'Per gruppi superiori a 6 persone al Sotto Sotto è richiesta la conferma telefonica con il maître per garantire la migliore esperienza di servizio.',
  },
  lateArrival: {
    enabled: true,
    maintainOriginalOutTime: true,
    gracePeriodMinutes: 15,
    showOverbookingRiskWarning: true,
  },
  onlineWaitlist: {
    enabled: true,
    minPartySize: 1,
    maxPartySize: 6,
    estimatedWaitCalculation: 'auto',
    autoNotifyWindowMins: 10,
  },
  reservationBehavior: {
    recalculateTurnOnMove: true,
    notifyServerOnMove: true,
    requireManagerApprovalOnVIPMove: true,
    earlyNotificationTiers: ['top_spender', 'vip', 'friends_family'],
  },
};

// -------------------------------------------------------------
// SEED DATA: 4. Shifts & Schedules
// -------------------------------------------------------------
const STANDARD_SHIFTS: BohShift[] = [
  {
    id: 'shift_lunch',
    name: 'Servizio Pranzo (Lunch)',
    color: '#0284C7', // sky
    startTime: '12:00',
    endTime: '15:30',
    linkedFloorPlanId: 'layout_sotto_sotto_official',
    flowControls: {
      coversPer15Min: 12,
      partiesPer15Min: 4,
      maxPacingCapacity: 60,
    },
    turnTimes: {
      party1_2: 90,
      party3_4: 105,
      party5_6: 120,
      party7_plus: 150,
    },
    isActive: true,
  },
  {
    id: 'shift_aperitivo',
    name: 'Aperitivo & Sala Bar',
    color: '#D97706', // amber
    startTime: '18:00',
    endTime: '20:00',
    linkedFloorPlanId: 'layout_sotto_sotto_official',
    flowControls: {
      coversPer15Min: 10,
      partiesPer15Min: 3,
      maxPacingCapacity: 35,
    },
    turnTimes: {
      party1_2: 60,
      party3_4: 75,
      party5_6: 90,
      party7_plus: 100,
    },
    isActive: true,
  },
  {
    id: 'shift_dinner',
    name: 'Servizio Cena (Dinner Rush)',
    color: '#7C3AED', // violet
    startTime: '19:30',
    endTime: '23:30',
    linkedFloorPlanId: 'layout_sotto_sotto_official',
    flowControls: {
      coversPer15Min: 14,
      partiesPer15Min: 5,
      maxPacingCapacity: 85,
    },
    turnTimes: {
      party1_2: 120,
      party3_4: 150,
      party5_6: 165,
      party7_plus: 180,
    },
    isActive: true,
  },
];

const DEFAULT_SCHEDULES: DaySchedule[] = [
  { day: 'monday', label: 'Lunedì', isOpen: true, shifts: [STANDARD_SHIFTS[0], STANDARD_SHIFTS[2]] },
  { day: 'tuesday', label: 'Martedì', isOpen: true, shifts: [STANDARD_SHIFTS[0], STANDARD_SHIFTS[2]] },
  { day: 'wednesday', label: 'Mercoledì', isOpen: true, shifts: [STANDARD_SHIFTS[0], STANDARD_SHIFTS[2]] },
  { day: 'thursday', label: 'Giovedì', isOpen: true, shifts: [STANDARD_SHIFTS[0], STANDARD_SHIFTS[1], STANDARD_SHIFTS[2]] },
  { day: 'friday', label: 'Venerdì', isOpen: true, shifts: [STANDARD_SHIFTS[0], STANDARD_SHIFTS[1], STANDARD_SHIFTS[2]] },
  { day: 'saturday', label: 'Sabato', isOpen: true, shifts: [STANDARD_SHIFTS[0], STANDARD_SHIFTS[1], STANDARD_SHIFTS[2]] },
  { day: 'sunday', label: 'Domenica', isOpen: true, shifts: [STANDARD_SHIFTS[0], STANDARD_SHIFTS[2]] },
];

// -------------------------------------------------------------
// SEED DATA: 5. Special Days & Holidays (Italian, US & UK Bank Holidays)
// -------------------------------------------------------------
const DEFAULT_SPECIAL_DAYS: SpecialDayOverride[] = [
  // --- ITALIAN HOLIDAYS & TRADITIONS ---
  {
    id: 'spec_nye_jan1_2026',
    date: '2026-01-01',
    title: 'Capodanno (New Year’s Day)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    overrideTurnTimes: { party1_2: 120, party3_4: 150, party5_6: 180, party7_plus: 210 },
    notes: 'Pranzo di Capodanno con menu beneaugurante delle Langhe e Piemonte.',
  },
  {
    id: 'spec_epiphany_2026',
    date: '2026-01-06',
    title: 'Epifania del Signore (La Befana)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Festa nazionale italiana. Pranzo delle famiglie con dolci tradizionali.',
  },
  {
    id: 'spec_valentine_2026',
    date: '2026-02-14',
    title: 'San Valentino (Valentine’s Day)',
    type: 'special_event',
    culture: 'it',
    isClosed: false,
    overrideFloorPlanId: 'layout_sotto_sotto_official',
    overrideTurnTimes: { party1_2: 130, party3_4: 150, party5_6: 180, party7_plus: 200 },
    notes: 'Serata romantica esclusiva con tavoli per coppie (Booth VIP G & Privé) e menu a tema.',
  },
  {
    id: 'spec_carnival_tue_2026',
    date: '2026-02-17',
    title: 'Martedì Grasso (Carnevale)',
    type: 'special_event',
    culture: 'it',
    isClosed: false,
    notes: 'Festa di Carnevale con dolci tipici: bugie torinesi, friciò e zabaione caldo.',
  },
  {
    id: 'spec_womens_day_2026',
    date: '2026-03-08',
    title: 'Festa della Donna (Giornata Internazionale dei Diritti delle Donne)',
    type: 'special_event',
    culture: 'it',
    isClosed: false,
    notes: 'Omaggio floreale con mimosa a tutte le commensali e menu degustazione dedicato.',
  },
  {
    id: 'spec_fathers_day_2026',
    date: '2026-03-19',
    title: 'Festa del Papà (San Giuseppe)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Pranzo e cena in famiglia con zeppole di San Giuseppe e bignè.',
  },
  {
    id: 'spec_easter_sun_2026',
    date: '2026-04-05',
    title: 'Domenica di Pasqua (Holy Easter)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    overrideTurnTimes: { party1_2: 150, party3_4: 180, party5_6: 210, party7_plus: 240 },
    notes: 'Grande Pranzo di Pasqua con agnello sambucano, torta pasqualina e colomba artigianale.',
  },
  {
    id: 'spec_easter_mon_2026',
    date: '2026-04-06',
    title: 'Lunedì dell’Angelo (Pasquetta)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Tradizionale gita e pranzo di Pasquetta al Sotto Sotto con grigliata gourmet.',
  },
  {
    id: 'spec_liberation_2026',
    date: '2026-04-25',
    title: 'Festa della Liberazione (25 Aprile)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Festa Nazionale Italiana.',
  },
  {
    id: 'spec_labor_day_it_2026',
    date: '2026-05-01',
    title: 'Festa del Lavoro (1° Maggio)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Festa Nazionale dei Lavoratori.',
  },
  {
    id: 'spec_republic_day_2026',
    date: '2026-06-02',
    title: 'Festa della Repubblica Italiana (2 Giugno)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Festa Nazionale della Repubblica.',
  },
  {
    id: 'spec_san_giovanni_2026',
    date: '2026-06-24',
    title: 'Festa Patronale di San Giovanni Battista (Torino)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Patrono della città di Torino! Farò e fuochi d’artificio sul Po. Cene con vista.',
  },
  {
    id: 'spec_ferragosto_2026',
    date: '2026-08-15',
    title: 'Ferragosto (Assunzione di Maria)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    overrideTurnTimes: { party1_2: 140, party3_4: 170, party5_6: 190, party7_plus: 210 },
    notes: 'Grande festa d’estate con menu estivo e terrazza rinfrescata.',
  },
  {
    id: 'spec_all_saints_2026',
    date: '2026-11-01',
    title: 'Festa di Ognissanti (Tutti i Santi)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Festività nazionale italiana e piatti a base di zucca mantovana e castagne.',
  },
  {
    id: 'spec_immacolata_2026',
    date: '2026-12-08',
    title: 'Immacolata Concezione (Ponte dell’Immacolata)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Apertura ufficiale della stagione festiva natalizia e luci d’artista a Torino.',
  },
  {
    id: 'spec_xmas_eve_2026',
    date: '2026-12-24',
    title: 'Vigilia di Natale (Cena di Pesce Tradizionale)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    deletedShiftIds: ['shift_lunch'],
    overrideFloorPlanId: 'layout_sotto_sotto_official',
    overrideTurnTimes: { party1_2: 130, party3_4: 160, party5_6: 180, party7_plus: 200 },
    notes: 'Menu degustazione pesce della Vigilia nelle 4 sale. Solo cena con prenotazione su acconto.',
  },
  {
    id: 'spec_xmas_day_2026',
    date: '2026-12-25',
    title: 'Santo Natale (Pranzo di Natale)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    deletedShiftIds: ['shift_dinner', 'shift_aperitivo'],
    overrideFloorPlanId: 'layout_sotto_sotto_official',
    notes: 'Solo servizio pranzo natalizio 12:00 - 17:00.',
  },
  {
    id: 'spec_st_stephen_2026',
    date: '2026-12-26',
    title: 'Santo Stefano (Festa Nazionale)',
    type: 'holiday',
    culture: 'it',
    isClosed: false,
    notes: 'Pranzo conviviale di Santo Stefano in famiglia.',
  },
  {
    id: 'spec_nye_2026',
    date: '2026-12-31',
    title: "Cenone di San Silvestro & Capodanno",
    type: 'special_event',
    culture: 'it',
    isClosed: false,
    deletedShiftIds: ['shift_lunch', 'shift_aperitivo'],
    overrideFloorPlanId: 'layout_sotto_sotto_events',
    overrideTurnTimes: { party1_2: 180, party3_4: 210, party5_6: 240, party7_plus: 270 },
    notes: 'Hot-swap attivo: Layout Grandi Gruppi & Eventi assegnato con turni prolungati e brindisi.',
  },
  {
    id: 'spec_nye_jan1_2027',
    date: '2027-01-01',
    title: "Capodanno 2027 (Chiusura Straordinaria)",
    type: 'closure',
    culture: 'it',
    isClosed: true,
    notes: 'Locale chiuso tutto il giorno per riposo del personale.',
  },

  // --- AMERICAN / US HOLIDAYS ---
  {
    id: 'spec_mlk_day_2026',
    date: '2026-01-19',
    title: 'Martin Luther King Jr. Day (US Federal Holiday)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Festività federale statunitense (terzo lunedì di gennaio).',
  },
  {
    id: 'spec_presidents_day_2026',
    date: '2026-02-16',
    title: 'Presidents’ Day / Washington’s Birthday (US)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Festività federale USA in onore dei Presidenti statunitensi.',
  },
  {
    id: 'spec_st_patrick_2026',
    date: '2026-03-17',
    title: 'St. Patrick’s Day (San Patrizio)',
    type: 'special_event',
    culture: 'us',
    isClosed: false,
    notes: 'Celebrazione amatissima negli USA e in UK con piatti e birre speciali.',
  },
  {
    id: 'spec_memorial_day_2026',
    date: '2026-05-25',
    title: 'Memorial Day (US Federal Holiday)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Giorno della Memoria USA per i caduti, segna l’inizio ufficioso dell’estate.',
  },
  {
    id: 'spec_juneteenth_2026',
    date: '2026-06-19',
    title: 'Juneteenth National Independence Day (US)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Festività federale USA per la celebrazione dell’emancipazione.',
  },
  {
    id: 'spec_july4_2026',
    date: '2026-07-04',
    title: '4th of July (US Independence Day)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Festa dell’Indipendenza Americana! BBQ Special, cocktail e atmosfera a stelle e strisce.',
  },
  {
    id: 'spec_labor_day_us_2026',
    date: '2026-09-07',
    title: 'Labor Day USA (Primo lunedì di Settembre)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Festa del Lavoro negli Stati Uniti (US Federal Holiday).',
  },
  {
    id: 'spec_columbus_day_2026',
    date: '2026-10-12',
    title: 'Columbus Day / Indigenous Peoples’ Day (US)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Festività federale americana.',
  },
  {
    id: 'spec_halloween_2026',
    date: '2026-10-31',
    title: 'Halloween Night (US & UK Tradition)',
    type: 'special_event',
    culture: 'us',
    isClosed: false,
    overrideTurnTimes: { party1_2: 120, party3_4: 150, party5_6: 180, party7_plus: 200 },
    notes: 'Cena mascherata con piatti speciali a base di zucca, spezie e cocktail scuri.',
  },
  {
    id: 'spec_veterans_day_2026',
    date: '2026-11-11',
    title: 'Veterans Day (US Federal Holiday)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    notes: 'Festività federale USA per tutti i veterani delle forze armate.',
  },
  {
    id: 'spec_thanksgiving_2026',
    date: '2026-11-26',
    title: 'Giorno del Ringraziamento (Thanksgiving Day US)',
    type: 'holiday',
    culture: 'us',
    isClosed: false,
    deletedShiftIds: ['shift_lunch'],
    overrideFloorPlanId: 'layout_sotto_sotto_official',
    overrideTurnTimes: { party1_2: 130, party3_4: 160, party5_6: 190, party7_plus: 220 },
    notes: 'Cena tradizionale con tacchino arrosto ripieno, salsa di mirtilli e pumpkin pie.',
  },
  {
    id: 'spec_black_friday_2026',
    date: '2026-11-27',
    title: 'Black Friday Weekend Dining (US & International)',
    type: 'special_event',
    culture: 'us',
    isClosed: false,
    notes: 'Weekend promozionale con alta richiesta di tavoli doposhopping.',
  },

  // --- BRITISH / UK BANK HOLIDAYS & TRADITIONS ---
  {
    id: 'spec_burns_night_2026',
    date: '2026-01-25',
    title: 'Burns Night (Scottish & British Celebration)',
    type: 'special_event',
    culture: 'uk',
    isClosed: false,
    notes: 'Celebrazione del poeta Robert Burns con degustazione di single malt whisky scozzesi.',
  },
  {
    id: 'spec_st_david_2026',
    date: '2026-03-01',
    title: 'St. David’s Day (Patrono del Galles - UK)',
    type: 'special_event',
    culture: 'uk',
    isClosed: false,
    notes: 'Festa nazionale gallese del Regno Unito.',
  },
  {
    id: 'spec_mothering_sunday_2026',
    date: '2026-03-15',
    title: 'Mothering Sunday (UK Mother’s Day)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Festa della Mamma nel Regno Unito (quarta domenica di Quaresima). Sunday Roast a tavola.',
  },
  {
    id: 'spec_good_friday_uk_2026',
    date: '2026-04-03',
    title: 'Good Friday (UK Bank Holiday - Venerdì Santo)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Official UK Bank Holiday in Inghilterra, Galles, Scozia e Irlanda del Nord.',
  },
  {
    id: 'spec_st_george_2026',
    date: '2026-04-23',
    title: 'St. George’s Day (Patrono d’Inghilterra - UK)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Festa nazionale inglese di San Giorgio.',
  },
  {
    id: 'spec_early_may_bank_2026',
    date: '2026-05-04',
    title: 'Early May Bank Holiday (UK Bank Holiday)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Official UK Bank Holiday (primo lunedì di Maggio). Weekend lungo nel Regno Unito.',
  },
  {
    id: 'spec_spring_bank_2026',
    date: '2026-05-25',
    title: 'Spring Bank Holiday (Late May UK Bank Holiday)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Official UK Bank Holiday (ultimo lunedì di Maggio).',
  },
  {
    id: 'spec_kings_birthday_2026',
    date: '2026-06-13',
    title: 'King’s Official Birthday (Trooping the Colour - UK)',
    type: 'special_event',
    culture: 'uk',
    isClosed: false,
    notes: 'Celebrazione ufficiale del Sovrano del Regno Unito con parata reale a Londra.',
  },
  {
    id: 'spec_summer_bank_2026',
    date: '2026-08-31',
    title: 'Summer Bank Holiday (UK Bank Holiday)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Official UK Bank Holiday (ultimo lunedì di Agosto in Inghilterra, Galles e NI).',
  },
  {
    id: 'spec_guy_fawkes_2026',
    date: '2026-11-05',
    title: 'Guy Fawkes Night / Bonfire Night (UK Tradition)',
    type: 'special_event',
    culture: 'uk',
    isClosed: false,
    notes: 'Storica ricorrenza britannica ("Remember, remember the 5th of November") con falò e cene speciali.',
  },
  {
    id: 'spec_remembrance_sun_2026',
    date: '2026-11-08',
    title: 'Remembrance Sunday (UK National Commemoration)',
    type: 'special_event',
    culture: 'uk',
    isClosed: false,
    notes: 'Domenica del Ricordo nel Regno Unito e nel Commonwealth (Poppy Day).',
  },
  {
    id: 'spec_boxing_day_2026',
    date: '2026-12-26',
    title: 'Boxing Day (UK Bank Holiday)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Celeberrimo Bank Holiday britannico del 26 Dicembre.',
  },
  {
    id: 'spec_boxing_day_sub_2026',
    date: '2026-12-28',
    title: 'Boxing Day Substitute (UK Bank Holiday)',
    type: 'holiday',
    culture: 'uk',
    isClosed: false,
    notes: 'Lunedì sostitutivo ufficiale per il Boxing Day festivo nel Regno Unito.',
  },
  {
    id: 'spec_hogmanay_2026',
    date: '2026-12-31',
    title: 'Hogmanay (New Year’s Eve in Scotland & UK)',
    type: 'special_event',
    culture: 'uk',
    isClosed: false,
    notes: 'Celebre festa scozzese e britannica per il passaggio al nuovo anno.',
  },
];

export interface BohFullConfiguration {
  layouts: FloorPlanLayout[];
  combinations: TableCombination[];
  rules: BohRules;
  schedules: DaySchedule[];
  specialDays: SpecialDayOverride[];
}

class BohManagementService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    // Purge any stale cache with obsolete names like "Disposizione Standard", "Main & Terrace", "Cenone di Capodanno", "Gala Banquet"
    try {
      const rawLive = localStorage.getItem(STORAGE_KEYS.LIVE_LAYOUTS);
      if (rawLive) {
        const parsed = JSON.parse(rawLive);
        if (Array.isArray(parsed)) {
          const hasObsolete = parsed.some((p: any) =>
            p.name?.includes('Disposizione Standard') ||
            p.name?.includes('Cenone di Capodanno') ||
            p.name?.includes('Gala Banquet') ||
            p.name?.includes('Main & Terrace')
          );
          if (hasObsolete) {
            localStorage.removeItem(STORAGE_KEYS.LIVE_LAYOUTS);
            localStorage.removeItem(STORAGE_KEYS.DRAFT_CONFIG);
          }
        }
      }

      const rawDraft = localStorage.getItem(STORAGE_KEYS.DRAFT_CONFIG);
      if (rawDraft) {
        const parsedDraft = JSON.parse(rawDraft);
        if (parsedDraft?.layouts && Array.isArray(parsedDraft.layouts)) {
          const hasObsoleteDraft = parsedDraft.layouts.some((p: any) =>
            p.name?.includes('Disposizione Standard') ||
            p.name?.includes('Cenone di Capodanno') ||
            p.name?.includes('Gala Banquet') ||
            p.name?.includes('Main & Terrace')
          );
          if (hasObsoleteDraft) {
            localStorage.removeItem(STORAGE_KEYS.DRAFT_CONFIG);
          }
        }
      }
    } catch {
      // ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.LIVE_LAYOUTS)) {
      localStorage.setItem(STORAGE_KEYS.LIVE_LAYOUTS, JSON.stringify([SOTTO_SOTTO_OFFICIAL_LAYOUT, SOTTO_SOTTO_EVENTS_LAYOUT]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LIVE_COMBINATIONS)) {
      localStorage.setItem(STORAGE_KEYS.LIVE_COMBINATIONS, JSON.stringify(SOTTO_SOTTO_COMBINATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LIVE_RULES)) {
      localStorage.setItem(STORAGE_KEYS.LIVE_RULES, JSON.stringify(DEFAULT_BOH_RULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LIVE_SCHEDULES)) {
      localStorage.setItem(STORAGE_KEYS.LIVE_SCHEDULES, JSON.stringify(DEFAULT_SCHEDULES));
    }
    const storedSpecialDays = localStorage.getItem(STORAGE_KEYS.LIVE_SPECIAL_DAYS);
    if (!storedSpecialDays || JSON.parse(storedSpecialDays).length < 10) {
      localStorage.setItem(STORAGE_KEYS.LIVE_SPECIAL_DAYS, JSON.stringify(DEFAULT_SPECIAL_DAYS));
      // Also update draft config if it has the old minimal specialDays list
      const draftRaw = localStorage.getItem(STORAGE_KEYS.DRAFT_CONFIG);
      if (draftRaw) {
        try {
          const parsedDraft = JSON.parse(draftRaw);
          if (parsedDraft?.specialDays && parsedDraft.specialDays.length < 10) {
            parsedDraft.specialDays = DEFAULT_SPECIAL_DAYS;
            localStorage.setItem(STORAGE_KEYS.DRAFT_CONFIG, JSON.stringify(parsedDraft));
          }
        } catch {
          // ignore
        }
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAST_PUBLISHED)) {
      localStorage.setItem(STORAGE_KEYS.LAST_PUBLISHED, new Date().toISOString());
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ---------------------------------------------------------------------------
  // LIVE VS DRAFT CONFIGURATION
  // ---------------------------------------------------------------------------
  public getLiveConfig(): BohFullConfiguration {
    try {
      return {
        layouts: JSON.parse(localStorage.getItem(STORAGE_KEYS.LIVE_LAYOUTS) || '[]'),
        combinations: JSON.parse(localStorage.getItem(STORAGE_KEYS.LIVE_COMBINATIONS) || '[]'),
        rules: JSON.parse(localStorage.getItem(STORAGE_KEYS.LIVE_RULES) || '{}'),
        schedules: JSON.parse(localStorage.getItem(STORAGE_KEYS.LIVE_SCHEDULES) || '[]'),
        specialDays: JSON.parse(localStorage.getItem(STORAGE_KEYS.LIVE_SPECIAL_DAYS) || '[]'),
      };
    } catch {
      return {
        layouts: [SOTTO_SOTTO_OFFICIAL_LAYOUT, SOTTO_SOTTO_EVENTS_LAYOUT],
        combinations: SOTTO_SOTTO_COMBINATIONS,
        rules: DEFAULT_BOH_RULES,
        schedules: DEFAULT_SCHEDULES,
        specialDays: DEFAULT_SPECIAL_DAYS,
      };
    }
  }

  public getDraftConfig(): BohFullConfiguration {
    const draftRaw = localStorage.getItem(STORAGE_KEYS.DRAFT_CONFIG);
    if (!draftRaw) {
      return this.getLiveConfig();
    }
    try {
      const parsed = JSON.parse(draftRaw);
      const live = this.getLiveConfig();
      return {
        layouts: parsed.layouts || live.layouts,
        combinations: parsed.combinations || live.combinations,
        rules: parsed.rules || live.rules,
        schedules: parsed.schedules || live.schedules,
        specialDays: parsed.specialDays || live.specialDays,
      };
    } catch {
      return this.getLiveConfig();
    }
  }

  public hasDraftChanges(): boolean {
    const draftRaw = localStorage.getItem(STORAGE_KEYS.DRAFT_CONFIG);
    if (!draftRaw) return false;
    const live = JSON.stringify(this.getLiveConfig());
    const draft = JSON.stringify(this.getDraftConfig());
    return live !== draft;
  }

  public saveDraft(updates: Partial<BohFullConfiguration>, reason?: string) {
    const current = this.getDraftConfig();
    const updated: BohFullConfiguration = {
      ...current,
      ...updates,
    };
    localStorage.setItem(STORAGE_KEYS.DRAFT_CONFIG, JSON.stringify(updated));

    if (reason) {
      const logs = this.getDraftChangeLogs();
      logs.unshift(`${new Date().toLocaleTimeString('it-IT')}: ${reason}`);
      localStorage.setItem('boh_draft_change_logs_v4', JSON.stringify(logs.slice(0, 30)));
    }

    this.notify();
  }

  public getDraftChangeLogs(): string[] {
    try {
      return JSON.parse(localStorage.getItem('boh_draft_change_logs_v4') || '[]');
    } catch {
      return [];
    }
  }

  public discardDraft() {
    localStorage.removeItem(STORAGE_KEYS.DRAFT_CONFIG);
    localStorage.removeItem('boh_draft_change_logs_v4');
    this.notify();
  }

  public publishDraft(): { success: boolean; publishedAt: string; diffCount: number; publishedLayout: FloorPlanLayout } {
    const draft = this.getDraftConfig();
    const now = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.LIVE_LAYOUTS, JSON.stringify(draft.layouts));
    localStorage.setItem(STORAGE_KEYS.LIVE_COMBINATIONS, JSON.stringify(draft.combinations));
    localStorage.setItem(STORAGE_KEYS.LIVE_RULES, JSON.stringify(draft.rules));
    localStorage.setItem(STORAGE_KEYS.LIVE_SCHEDULES, JSON.stringify(draft.schedules));
    localStorage.setItem(STORAGE_KEYS.LIVE_SPECIAL_DAYS, JSON.stringify(draft.specialDays));
    localStorage.setItem(STORAGE_KEYS.LAST_PUBLISHED, now);

    // Clean up draft
    localStorage.removeItem(STORAGE_KEYS.DRAFT_CONFIG);
    localStorage.removeItem('boh_draft_change_logs_v4');

    this.notify();
    const activeLayout = draft.layouts.find((l) => l.isDefault) || draft.layouts[0] || SOTTO_SOTTO_OFFICIAL_LAYOUT;
    return {
      success: true,
      publishedAt: now,
      diffCount: 1,
      publishedLayout: activeLayout,
    };
  }

  public getLastPublishedAt(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_PUBLISHED);
  }

  // ---------------------------------------------------------------------------
  // SMART SUGGESTIONS: TABLE COMBINATIONS
  // ---------------------------------------------------------------------------
  public getSmartCombinationSuggestions(layoutId?: string): {
    tableA: BohTable;
    tableB: BohTable;
    suggestedMinPax: number;
    suggestedMaxPax: number;
    reason: string;
  }[] {
    const config = this.getDraftConfig();
    const activeLayout = config.layouts.find((l) => (layoutId ? l.id === layoutId : l.isDefault)) || config.layouts[0];
    if (!activeLayout) return [];

    const existingCombos = config.combinations.filter((c) => c.floorPlanId === activeLayout.id);
    const existingPairs = new Set<string>();
    existingCombos.forEach((c) => {
      for (let i = 0; i < c.tableIds.length; i++) {
        for (let j = i + 1; j < c.tableIds.length; j++) {
          existingPairs.add([c.tableIds[i], c.tableIds[j]].sort().join('_'));
        }
      }
    });

    const suggestions: {
      tableA: BohTable;
      tableB: BohTable;
      suggestedMinPax: number;
      suggestedMaxPax: number;
      reason: string;
    }[] = [];

    const tables = activeLayout.tables;
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const tA = tables[i];
        const tB = tables[j];

        // 1. Strict category check: tables of different types CANNOT be combined!
        if (tA.tableType !== tB.tableType) continue;

        // 2. Room check: tables from different dining rooms CANNOT be combined!
        if (tA.diningAreaId && tB.diningAreaId && tA.diningAreaId !== tB.diningAreaId) continue;

        const pairKey = [tA.id, tB.id].sort().join('_');
        if (existingPairs.has(pairKey)) continue;

        // Proximity calculation
        const dx = tA.x - tB.x;
        const dy = tA.y - tB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isNearby = dist <= 35 || tA.adjacentWith?.includes(tB.id) || tB.adjacentWith?.includes(tA.id);

        if (isNearby) {
          const combinedPhysicalSeats = tA.physicalSeats + tB.physicalSeats;
          const areaObj = activeLayout.diningAreas.find((a) => a.id === tA.diningAreaId);
          suggestions.push({
            tableA: tA,
            tableB: tB,
            suggestedMinPax: combinedPhysicalSeats - 1,
            suggestedMaxPax: combinedPhysicalSeats + 2,
            reason: `Tavoli adiacenti in ${areaObj?.title || 'sala'} (${tA.tableType.toUpperCase()}). Percorso sgombro per unione.`,
          });
        }
      }
    }

    return suggestions.slice(0, 6);
  }

  // ---------------------------------------------------------------------------
  // ACTIVE FLOOR PLAN RESOLVER
  // ---------------------------------------------------------------------------
  public getEffectiveFloorPlanForDate(dateStr: string): {
    layout: FloorPlanLayout;
    isOverridden: boolean;
    specialDayTitle?: string;
  } {
    const config = this.getLiveConfig();
    const specialDay = config.specialDays.find((sd) => sd.date === dateStr);

    if (specialDay && specialDay.overrideFloorPlanId) {
      const overriddenLayout = config.layouts.find((l) => l.id === specialDay.overrideFloorPlanId);
      if (overriddenLayout) {
        return {
          layout: overriddenLayout,
          isOverridden: true,
          specialDayTitle: specialDay.title,
        };
      }
    }

    const defaultLayout = config.layouts.find((l) => l.isDefault) || config.layouts[0] || SOTTO_SOTTO_OFFICIAL_LAYOUT;
    return {
      layout: defaultLayout,
      isOverridden: false,
    };
  }
}

export const bohService = new BohManagementService();

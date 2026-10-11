import { TableShape, TableZone, VIPTier } from './index';

export type BohTableType = 'regular' | 'outdoor' | 'bar' | 'private' | 'high_top';

export interface BohTable {
  id: string;
  tableNumber: string;
  name: string;
  shape: TableShape;
  tableType: BohTableType;
  minPartySize: number;
  maxPartySize: number;
  physicalSeats: number;
  x: number; // percentage (0 - 100) on canvas
  y: number; // percentage (0 - 100) on canvas
  width: number; // px width on reference 1000px canvas
  height: number; // px height
  rotation: number; // 0, 45, 90, 135, 180, 225, 270, 315
  diningAreaId?: string;
  adjacentWith: string[];
}

export interface DiningAreaZone {
  id: string;
  title: string;
  locationTag: string; // e.g. "Main Dining West", "Terrace Garden", "Mezzanine"
  description: string;
  color: string; // hex or tailwind class
  tableIds: string[];
  dimensions?: {
    widthMeters: number;
    heightMeters: number;
  };
}

export interface FloorPlanLayout {
  id: string;
  name: string;
  description: string;
  canvasDimensions: {
    widthMeters: number;
    heightMeters: number;
    gridScale: number; // pixels per meter
  };
  rotation: number; // 0, 90, 180, 270
  diningAreas: DiningAreaZone[];
  tables: BohTable[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableCombination {
  id: string;
  name: string;
  tableIds: string[];
  tableType: BohTableType;
  minPartySize: number;
  maxPartySize: number;
  totalPhysicalSeats: number;
  floorPlanId: string;
  isActive: boolean;
  notes?: string;
}

export interface LargePartyRules {
  threshold: number; // e.g. 6 or 8 pax
  disableOnlineBooking: boolean; // requires phone call
  requireDeposit: boolean;
  depositAmountPerCover: number;
  customNotice: string;
}

export interface LateArrivalRules {
  enabled: boolean;
  maintainOriginalOutTime: boolean; // turn time remains fixed to booked start time
  gracePeriodMinutes: number; // e.g. 15 mins
  showOverbookingRiskWarning: boolean;
}

export interface OnlineWaitlistRules {
  enabled: boolean;
  minPartySize: number;
  maxPartySize: number;
  estimatedWaitCalculation: 'auto' | 'manual';
  autoNotifyWindowMins: number;
}

export interface ReservationBehaviorRules {
  recalculateTurnOnMove: boolean;
  notifyServerOnMove: boolean;
  requireManagerApprovalOnVIPMove: boolean;
  earlyNotificationTiers: VIPTier[];
}

export interface BohRules {
  largeParty: LargePartyRules;
  lateArrival: LateArrivalRules;
  onlineWaitlist: OnlineWaitlistRules;
  reservationBehavior: ReservationBehaviorRules;
}

export interface FlowControls {
  coversPer15Min: number;
  partiesPer15Min: number;
  maxPacingCapacity: number;
}

export interface TurnTimesByPartySize {
  party1_2: number; // minutes
  party3_4: number;
  party5_6: number;
  party7_plus: number;
}

export interface BohShift {
  id: string;
  name: string;
  color: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  linkedFloorPlanId: string;
  flowControls: FlowControls;
  turnTimes: TurnTimesByPartySize;
  isActive: boolean;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
  day: DayOfWeek;
  label: string;
  isOpen: boolean;
  shifts: BohShift[];
}

export interface SpecialDayOverride {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'holiday' | 'special_event' | 'closure' | 'custom_schedule';
  culture?: 'it' | 'us' | 'uk' | 'intl';
  isClosed: boolean;
  deletedShiftIds?: string[];
  customShifts?: BohShift[];
  overrideFloorPlanId?: string; // Hot-swap layout for this day (e.g. NYE Gala Layout)
  overrideTurnTimes?: TurnTimesByPartySize;
  notes?: string;
}

export interface BohDraftState {
  isDirty: boolean;
  lastPublishedAt: string | null;
  changeLog: string[];
}

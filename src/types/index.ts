export type TableZone = 'bar' | 'main' | 'private' | 'terrace';

export type TableShape = 'rect-h' | 'rect-v' | 'square' | 'round' | 'booth';

export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';

export type TableCourseStage =
  | 'seated'
  | 'drinks'
  | 'appetizers'
  | 'mains'
  | 'dessert'
  | 'bill_requested'
  | 'clearing';

export type StaffRole = 'manager' | 'host' | 'waiter';

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  name: string;
  zone: TableZone;
  capacity: number;
  capacityOverride?: number;
  shape: TableShape;
  adjacentWith: string[]; // Neighbor table IDs that can be joined
  minPartySize?: number;
  maxPartySize?: number;
  isAvailable?: boolean;
  // Spatial Floor Designer Coordinates
  x: number; // percentage or pixel offset in zone canvas
  y: number;
  width?: number;
  height?: number;
  rotation?: number; // 0, 90, 180, 270 deg
  // Service & Course State
  courseStage?: TableCourseStage;
  courseStartedAt?: string;
  needsAssistance?: boolean;
  assistanceReason?: string;
}

export interface TableGroup {
  id: string;
  groupDate: string; // YYYY-MM-DD
  combinedName: string;
  totalCapacity: number;
  memberTableIds: string[];
  zone: TableZone;
  createdAt: string;
}

export interface Reservation {
  id: string;
  bookingCode: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  reservationDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMins: number;
  partySize: number;
  tableId: string; // Primary or representative table ID
  assignedTableIds: string[]; // List of all physical tables booked (e.g. ['10', '11'])
  status: ReservationStatus;
  notes?: string;
  tags?: string[]; // e.g. ['VIP', 'Birthday', 'Gluten Free', 'Highchair']
  seatedAt?: string; // ISO string when seated
  completedAt?: string;
  isWalkIn?: boolean;
  depositAmount?: number;
  serverName?: string;
  totalSpendEstimate?: number;
}

export interface WaitlistItem {
  id: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  addedAt: string; // ISO
  estimatedWaitMins: number;
  notes?: string;
  tags?: string[];
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
  notificationSentAt?: string;
  preferredZone?: TableZone;
}

export interface TimeSlotOption {
  tableId: string;
  tableName: string;
  capacity: number;
  isGroup: boolean;
  memberTableIds: string[];
  zone: TableZone;
  fitScore: number; // How optimal the match is (lower is closer to exact capacity)
}

export interface RecommendedMerge {
  combinedName: string;
  tableIds: string[];
  totalCapacity: number;
  zone: TableZone;
  fitScore: number;
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  currency: string;
  avgSpendPerCover: number;
  openingHours: {
    lunch: { start: string; end: string; enabled: boolean };
    dinner: { start: string; end: string; enabled: boolean };
  };
  durationSmallMins: number; // 1-2 guests (e.g. 120)
  durationMediumMins: number; // 3-4 guests (e.g. 165)
  durationLargeMins: number; // 5+ guests (e.g. 180)
  turnWarningMins: number; // 100 min
  maxTurnMins: number; // 120 min
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'turn_warning' | 'turn_expired' | 'sms_sent';
  title: string;
  message: string;
  tableId?: string;
  actionLabel?: string;
  onAction?: () => void;
  timestamp?: number;
  duration?: number;
}

export interface OperationsKPIs {
  bookedCovers: number; // Total covers booked for the day
  seatedCovers: number; // Covers currently sitting
  completedCovers: number; // Covers finished
  remainingCovers: number; // Covers yet to arrive later in shift
  totalReservationsCount: number;
  turnoverRate: number;
  estimatedTotalRevenue: number;
}

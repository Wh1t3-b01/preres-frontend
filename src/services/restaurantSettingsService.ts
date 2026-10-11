export interface RestaurantSettings {
  // Chapter 8: General App Settings
  alwaysDisplayServerSectionsOnFloor: boolean;
  defaultView: 'floor' | 'list' | 'timeline' | 'calendar';
  
  // Chapter 8: User Action Logging
  requireUsernameOnDateChange: boolean;
  requirePinOnCancellation: boolean;
  actionAuditLogEnabled: boolean;

  // Chapter 8: Hardware & Notifications
  chitPrinterEnabled: boolean;
  chitPrinterIp: string;
  chitPrinterModel: string;
  autoPrintChitOnSeat: boolean;
  printCourseTickets: boolean;
  soundAlertsEnabled: boolean;
  vipArrivalNotification: boolean;
  problemReservationNotification: boolean;
  waitlistSmsAutoNotify: boolean;
}

export interface UserActionLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category: 'reservation_change' | 'table_assign' | 'status_change' | 'server_section' | 'settings';
}

const STORAGE_KEY_SETTINGS = 'sotto_app_settings_v2';
const STORAGE_KEY_LOGS = 'sotto_app_action_logs_v2';
const LEGACY_STORAGE_KEY_SETTINGS = 'sotto_restaurant_settings_legacy';
const LEGACY_STORAGE_KEY_LOGS = 'sotto_restaurant_action_logs_legacy';

const DEFAULT_SETTINGS: RestaurantSettings = {
  alwaysDisplayServerSectionsOnFloor: false,
  defaultView: 'floor',
  requireUsernameOnDateChange: true,
  requirePinOnCancellation: false,
  actionAuditLogEnabled: true,
  chitPrinterEnabled: true,
  chitPrinterIp: '192.168.1.240:9100',
  chitPrinterModel: 'Epson TM-T88VI Thermal Chit Printer',
  autoPrintChitOnSeat: true,
  printCourseTickets: true,
  soundAlertsEnabled: true,
  vipArrivalNotification: true,
  problemReservationNotification: true,
  waitlistSmsAutoNotify: true,
};

const DEFAULT_LOGS: UserActionLogEntry[] = [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    action: 'Data / Ora Modificata',
    user: 'Marco Rossi (Maître)',
    details: 'Spostato tavolo 12 dalle 20:00 alle 20:30 (Ospite: Cav. Rossi)',
    category: 'reservation_change',
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    action: 'Tavolo Assegnato',
    user: 'Sofia V. (Host)',
    details: 'Assegnato Tavolo 14 a prenotazione Fam. Bianchi (4 pax)',
    category: 'table_assign',
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    action: 'Stato Cambiato in Seated',
    user: 'Luca M. (Host)',
    details: 'Tavolo 22 accomodato con successo',
    category: 'status_change',
  },
  {
    id: 'log_4',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    action: 'Aggiornamento Ranghi Sala',
    user: 'Marco Rossi (Maître)',
    details: 'Modificata assegnazione Sezione Est per turno Cena',
    category: 'server_section',
  },
];

class RestaurantSettingsService {
  private settings: RestaurantSettings = DEFAULT_SETTINGS;
  private actionLogs: UserActionLogEntry[] = DEFAULT_LOGS;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS) || localStorage.getItem(LEGACY_STORAGE_KEY_SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS) || localStorage.getItem(LEGACY_STORAGE_KEY_LOGS);
      if (storedLogs) {
        this.actionLogs = JSON.parse(storedLogs);
      }
    } catch (e) {
      console.warn('Could not load restaurant settings from storage:', e);
      this.settings = { ...DEFAULT_SETTINGS };
      this.actionLogs = [...DEFAULT_LOGS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.actionLogs));
    } catch (e) {
      console.warn('Could not save restaurant settings to storage:', e);
    }
  }

  public getSettings(): RestaurantSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<RestaurantSettings>): RestaurantSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveToStorage();
    return { ...this.settings };
  }

  public getActionLogs(): UserActionLogEntry[] {
    return [...this.actionLogs];
  }

  public logAction(
    action: string,
    user: string,
    details: string,
    category: UserActionLogEntry['category'] = 'reservation_change'
  ) {
    const entry: UserActionLogEntry = {
      id: `log_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      action,
      user,
      details,
      category,
    };
    this.actionLogs.unshift(entry);
    if (this.actionLogs.length > 100) {
      this.actionLogs.pop();
    }
    this.saveToStorage();
    return entry;
  }

  public resetDefaults(): RestaurantSettings {
    this.settings = { ...DEFAULT_SETTINGS };
    this.actionLogs = [...DEFAULT_LOGS];
    this.saveToStorage();
    return { ...this.settings };
  }
}

export const restaurantSettingsService = new RestaurantSettingsService();

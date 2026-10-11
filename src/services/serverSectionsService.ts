export interface ServerSection {
  id: string;
  serverName: string;
  serverRole: 'waiter' | 'head_waiter' | 'runner';
  color: string; // Tailwind-friendly hex or color code
  bgSoft: string;
  borderSoft: string;
  textSoft: string;
  assignedTableIds: string[];
  maxCoversCapacity?: number;
  shift: 'lunch' | 'dinner' | 'all';
}

const STORAGE_KEY = 'sotto_server_sections_v2';

const DEFAULT_SECTIONS: ServerSection[] = [
  {
    id: 'sec_marco',
    serverName: 'Marco Rossi',
    serverRole: 'head_waiter',
    color: '#0EA5E9', // Sky
    bgSoft: 'bg-sky-50 dark:bg-sky-950/40',
    borderSoft: 'border-sky-300 dark:border-sky-700/60',
    textSoft: 'text-sky-700 dark:text-sky-300',
    assignedTableIds: ['10', '11', '12', 'G'], // Main A Nord & Ovest
    shift: 'dinner',
  },
  {
    id: 'sec_sofia',
    serverName: 'Sofia Bianchi',
    serverRole: 'waiter',
    color: '#10B981', // Emerald
    bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderSoft: 'border-emerald-300 dark:border-emerald-700/60',
    textSoft: 'text-emerald-700 dark:text-emerald-300',
    assignedTableIds: ['13', '14', '15', '16', '22', '23'], // Main B
    shift: 'dinner',
  },
  {
    id: 'sec_alessandro',
    serverName: 'Alessandro Conti',
    serverRole: 'waiter',
    color: '#F59E0B', // Amber
    bgSoft: 'bg-amber-50 dark:bg-amber-950/40',
    borderSoft: 'border-amber-300 dark:border-amber-700/60',
    textSoft: 'text-amber-700 dark:text-amber-300',
    assignedTableIds: ['B1', 'B2', 'B3', 'B4', 'B5', '20', '21'], // Bar & South Main
    shift: 'dinner',
  },
  {
    id: 'sec_elena',
    serverName: 'Elena Moretti',
    serverRole: 'head_waiter',
    color: '#8B5CF6', // Purple
    bgSoft: 'bg-purple-50 dark:bg-purple-950/40',
    borderSoft: 'border-purple-300 dark:border-purple-700/60',
    textSoft: 'text-purple-700 dark:text-purple-300',
    assignedTableIds: ['30', '31', '32', '33', '34'], // Privé
    shift: 'dinner',
  },
];

class ServerSectionsService {
  private sections: ServerSection[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.sections = JSON.parse(saved);
      } else {
        this.sections = DEFAULT_SECTIONS;
        this.save();
      }
    } catch {
      this.sections = DEFAULT_SECTIONS;
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sections));
    } catch {
      // ignore
    }
  }

  public getSections(): ServerSection[] {
    return [...this.sections];
  }

  public getSectionForTable(tableId: string): ServerSection | undefined {
    return this.sections.find((sec) => sec.assignedTableIds.includes(tableId));
  }

  public assignTableToSection(tableId: string, sectionId: string) {
    // Remove from other sections first
    this.sections = this.sections.map((sec) => {
      const filtered = sec.assignedTableIds.filter((t) => t !== tableId);
      if (sec.id === sectionId) {
        return { ...sec, assignedTableIds: [...filtered, tableId] };
      }
      return { ...sec, assignedTableIds: filtered };
    });
    this.save();
  }

  public addServerSection(data: {
    serverName: string;
    serverRole: ServerSection['serverRole'];
    color: string;
    shift: ServerSection['shift'];
    tableIds?: string[];
  }): ServerSection {
    const newSec: ServerSection = {
      id: `sec_${Date.now()}`,
      serverName: data.serverName,
      serverRole: data.serverRole,
      color: data.color,
      bgSoft: 'bg-slate-50 dark:bg-slate-900',
      borderSoft: 'border-slate-300 dark:border-slate-700',
      textSoft: 'text-slate-800 dark:text-slate-200',
      assignedTableIds: data.tableIds || [],
      shift: data.shift,
    };
    this.sections.push(newSec);
    this.save();
    return newSec;
  }

  public removeSection(sectionId: string) {
    this.sections = this.sections.filter((s) => s.id !== sectionId);
    this.save();
  }

  public resetToDefault() {
    this.sections = DEFAULT_SECTIONS;
    this.save();
  }
}

export const serverSectionsService = new ServerSectionsService();

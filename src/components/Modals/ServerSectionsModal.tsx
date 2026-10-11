import React, { useState } from 'react';
import {
  Users,
  X,
  Plus,
  Trash2,
  Check,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { serverSectionsService, ServerSection } from '../../services/serverSectionsService';
import { RestaurantTable } from '../../types';

interface ServerSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  theme: 'light' | 'dark';
  onUpdated?: () => void;
}

export const ServerSectionsModal: React.FC<ServerSectionsModalProps> = ({
  isOpen,
  onClose,
  tables,
  theme,
  onUpdated,
}) => {
  const isLight = theme === 'light';
  const [sections, setSections] = useState<ServerSection[]>(() => serverSectionsService.getSections());
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || '');

  // Add Server Form State
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerRole, setNewServerRole] = useState<'waiter' | 'head_waiter' | 'runner'>('waiter');
  const [newServerShift, setNewServerShift] = useState<'dinner' | 'lunch' | 'all'>('dinner');
  const [newServerColor, setNewServerColor] = useState('#0EA5E9');

  if (!isOpen) return null;

  const currentSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  const handleToggleTableForSection = (tableId: string) => {
    if (!currentSection) return;
    serverSectionsService.assignTableToSection(tableId, currentSection.id);
    const updated = serverSectionsService.getSections();
    setSections(updated);
    if (onUpdated) onUpdated();
  };

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;

    const created = serverSectionsService.addServerSection({
      serverName: newServerName.trim(),
      serverRole: newServerRole,
      color: newServerColor,
      shift: newServerShift,
    });

    const updated = serverSectionsService.getSections();
    setSections(updated);
    setSelectedSectionId(created.id);
    setIsAddingServer(false);
    setNewServerName('');
    if (onUpdated) onUpdated();
  };

  const handleDeleteSection = (sectionId: string) => {
    if (window.confirm('Eliminare questo rango / cameriere?')) {
      serverSectionsService.removeSection(sectionId);
      const updated = serverSectionsService.getSections();
      setSections(updated);
      setSelectedSectionId(updated[0]?.id || '');
      if (onUpdated) onUpdated();
    }
  };

  const colorPalette = [
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#14B8A6', // Teal
    '#F43F5E', // Rose
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-xl flex flex-col max-h-[88vh] overflow-hidden ${
          isLight
            ? 'bg-white text-slate-800 border-slate-200/80'
            : 'bg-[#121622] text-slate-100 border-[#222A3C]'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-100 bg-sky-50/30' : 'border-[#222A3C] bg-sky-950/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isLight
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-sky-950/40 text-sky-300 border-sky-800/50'
            }`}>
              <ShieldCheck className="w-4.5 h-4.5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">
                  Sezioni Camerieri &amp; Ranghi di Sala (Server Sections)
                </h3>
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                }`}>
                  Capitolo 7: Operazioni FOH
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Modifica i tavoli assegnati a ciascun cameriere e aggiungi personale per i turni futuri.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'hover:bg-slate-100 border-slate-200/70 text-slate-500'
                : 'hover:bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-[#222A3C]">
          
          {/* Left Column (5 Cols): Servers List & Add Server */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-3.5 [scrollbar-width:thin]">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase tracking-wider font-medium ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Camerieri &amp; Ranghi Attivi
              </span>
              <button
                onClick={() => setIsAddingServer((prev) => !prev)}
                className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Aggiungi Cameriere</span>
              </button>
            </div>

            {/* Add Server Form */}
            {isAddingServer && (
              <form onSubmit={handleCreateServer} className={`p-3 rounded-xl border space-y-2.5 animate-in fade-in duration-150 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#161C2A] border-[#252F43]'
              }`}>
                <span className="text-xs font-semibold block">Nuovo Cameriere / Rango</span>
                <div>
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="Nome e Cognome (es. Luca Neri)"
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-slate-700 text-slate-200'
                    }`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ruolo</label>
                    <select
                      value={newServerRole}
                      onChange={(e) => setNewServerRole(e.target.value as any)}
                      className={`w-full px-2 py-1 rounded-lg border text-xs ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-slate-700'
                      }`}
                    >
                      <option value="waiter">Cameriere Sala</option>
                      <option value="head_waiter">Capo Rango</option>
                      <option value="runner">Runner / Commis</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Turno Pianificato</label>
                    <select
                      value={newServerShift}
                      onChange={(e) => setNewServerShift(e.target.value as any)}
                      className={`w-full px-2 py-1 rounded-lg border text-xs ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-slate-700'
                      }`}
                    >
                      <option value="dinner">Turno Cena</option>
                      <option value="lunch">Turno Pranzo</option>
                      <option value="all">Entrambi i Turni</option>
                    </select>
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Colore Distintivo Rango</label>
                  <div className="flex items-center gap-1.5">
                    {colorPalette.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewServerColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                          newServerColor === col ? 'scale-125 ring-2 ring-sky-400' : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingServer(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium"
                  >
                    Salva Cameriere
                  </button>
                </div>
              </form>
            )}

            {/* List of Server Sections */}
            <div className="space-y-1.5">
              {sections.map((sec) => {
                const isSelected = sec.id === selectedSectionId;
                const assignedTables = tables.filter((t) => sec.assignedTableIds.includes(t.id));
                const totalSeats = assignedTables.reduce((acc, t) => acc + (t.capacityOverride || t.capacity), 0);

                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-sky-50/80 border-sky-200/80 text-sky-900 shadow-2xs'
                          : 'bg-[#1C2538] border-sky-800/50 text-sky-200 shadow-2xs'
                        : isLight
                        ? 'bg-white hover:bg-slate-50 border-slate-200/60 text-slate-700'
                        : 'bg-[#161C2A] hover:bg-[#1E2536] border-[#222A3C] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-black/10"
                        style={{ backgroundColor: sec.color }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold leading-tight">{sec.serverName}</span>
                          <span className={`text-[9px] uppercase px-1.5 rounded-sm ${
                            sec.serverRole === 'head_waiter' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {sec.serverRole === 'head_waiter' ? 'Capo Rango' : 'Cameriere'}
                          </span>
                        </div>
                        <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          {sec.assignedTableIds.length} tavoli assegnati ({totalSeats} coperti fisici)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {sections.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(sec.id);
                          }}
                          className="p-1 hover:text-rose-500 opacity-60 hover:opacity-100 transition cursor-pointer"
                          title="Elimina sezione"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (7 Cols): Table Assignment Grid for Selected Server */}
          <div className="md:col-span-7 p-4 sm:p-5 overflow-y-auto space-y-3.5 [scrollbar-width:thin]">
            {currentSection ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentSection.color }}
                    />
                    <h4 className="text-xs font-semibold">
                      Tavoli Assegnati a {currentSection.serverName}
                    </h4>
                  </div>
                  <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Clicca su un tavolo per assegnarlo o rimuoverlo dal rango
                  </span>
                </div>

                {/* Table tiles selector */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {tables.map((table) => {
                    const isAssignedToCurrent = currentSection.assignedTableIds.includes(table.id);
                    const otherSection = sections.find(
                      (s) => s.id !== currentSection.id && s.assignedTableIds.includes(table.id)
                    );

                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => handleToggleTableForSection(table.id)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between cursor-pointer relative ${
                          isAssignedToCurrent
                            ? isLight
                              ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs font-semibold'
                              : 'bg-sky-950/50 border-sky-700/80 text-sky-200 shadow-2xs font-semibold'
                            : otherSection
                            ? isLight
                              ? 'bg-slate-50/70 border-slate-200/70 text-slate-500 hover:border-slate-300'
                              : 'bg-[#151A27] border-[#242C3E] text-slate-400 hover:border-slate-600'
                            : isLight
                            ? 'bg-white border-slate-200/80 text-slate-700 hover:border-sky-300'
                            : 'bg-[#161C2A] border-[#222A3C] text-slate-300 hover:border-sky-500'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-brand font-bold text-sm">
                            {table.tableNumber}
                          </span>
                          {isAssignedToCurrent ? (
                            <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px]">
                              ✓
                            </span>
                          ) : otherSection ? (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: otherSection.color }}
                              title={`Assegnato a ${otherSection.serverName}`}
                            />
                          ) : null}
                        </div>

                        <span className={`text-[9px] font-mono mt-1 ${
                          isAssignedToCurrent
                            ? isLight ? 'text-sky-700' : 'text-sky-300'
                            : 'text-slate-400'
                        }`}>
                          {table.capacityOverride || table.capacity} pax · {table.zone}
                        </span>

                        {otherSection && !isAssignedToCurrent && (
                          <span className="text-[8px] truncate max-w-full text-slate-400 mt-0.5">
                            {otherSection.serverName.split(' ')[0]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'border-slate-100 bg-slate-50/60' : 'border-[#222A3C] bg-[#10141F]'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            I ranghi assegnati sono visibili direttamente sulla Mappa Sala per bilanciare i carichi di lavoro.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium cursor-pointer"
          >
            Fatto (Applica a Sala)
          </button>
        </div>
      </div>
    </div>
  );
};

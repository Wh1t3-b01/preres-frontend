import React, { useState, useMemo } from 'react';
import {
  TableCombination,
  FloorPlanLayout,
  BohTable,
  BohTableType,
} from '../../types/boh';
import { bohService } from '../../services/bohService';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Link2,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Users,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';

interface TableCombinationsViewProps {
  combinations: TableCombination[];
  activeLayout: FloorPlanLayout;
  onUpdateCombinations: (updated: TableCombination[], changeReason?: string) => void;
}

export const TableCombinationsView: React.FC<TableCombinationsViewProps> = ({
  combinations,
  activeLayout,
  onUpdateCombinations,
}) => {
  const { theme } = useRestaurant();
  const isLight = theme === 'light';

  // Category filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | BohTableType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combination Builder State
  const [selectedTableIdsForCombo, setSelectedTableIdsForCombo] = useState<string[]>([]);
  const [comboNameInput, setComboNameInput] = useState('');
  const [comboMinPax, setComboMinPax] = useState<number>(4);
  const [comboMaxPax, setComboMaxPax] = useState<number>(8);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Editing existing combination modal / inline
  const [editingComboId, setEditingComboId] = useState<string | null>(null);

  // Tables of active layout filtered
  const filteredTables = useMemo(() => {
    return activeLayout.tables.filter((t) => {
      const matchType = selectedCategoryFilter === 'all' || t.tableType === selectedCategoryFilter;
      const matchSearch =
        !searchQuery ||
        t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [activeLayout.tables, selectedCategoryFilter, searchQuery]);

  // Smart suggestions from bohService
  const smartSuggestions = useMemo(() => {
    return bohService.getSmartCombinationSuggestions(activeLayout.id);
  }, [activeLayout.id, combinations]);

  // Selected tables objects
  const selectedTables = useMemo(() => {
    return activeLayout.tables.filter((t) => selectedTableIdsForCombo.includes(t.id));
  }, [activeLayout.tables, selectedTableIdsForCombo]);

  // Strict Validation: check if selected tables belong to the same category
  const isStrictCategoryValid = useMemo(() => {
    if (selectedTables.length <= 1) return true;
    const firstType = selectedTables[0].tableType;
    return selectedTables.every((t) => t.tableType === firstType);
  }, [selectedTables]);

  const handleToggleTableForCombo = (tableId: string) => {
    setValidationError(null);
    setSelectedTableIdsForCombo((prev) => {
      let next: string[];
      if (prev.includes(tableId)) {
        next = prev.filter((id) => id !== tableId);
      } else {
        next = [...prev, tableId];
      }

      // Pre-calculate suggested capacities
      const nextTables = activeLayout.tables.filter((t) => next.includes(t.id));
      if (nextTables.length > 0) {
        const totalSeats = nextTables.reduce((sum, t) => sum + t.physicalSeats, 0);
        setComboMinPax(Math.max(2, totalSeats - 1));
        setComboMaxPax(totalSeats + 2);
        setComboNameInput(`Unione ${nextTables.map((t) => t.tableNumber).join(' + ')}`);
      }
      return next;
    });
  };

  const handleCreateCombination = () => {
    setValidationError(null);
    if (selectedTableIdsForCombo.length < 2) {
      setValidationError('Seleziona almeno 2 tavoli per creare una combinazione.');
      return;
    }

    // STRICT VALIDATION ENFORCEMENT: different types cannot be merged!
    const tableTypes = Array.from(new Set(selectedTables.map((t) => t.tableType)));
    if (tableTypes.length > 1) {
      setValidationError(
        `Violazione Regola di Unione: Non è consentito unire tavoli di tipologie differenti (${tableTypes
          .map((t) => t.toUpperCase())
          .join(' con ')}). Assicurati che tutti i tavoli appartengano alla stessa categoria.`
      );
      return;
    }

    const firstTable = selectedTables[0];
    const totalPhysical = selectedTables.reduce((sum, t) => sum + t.physicalSeats, 0);

    const newCombo: TableCombination = {
      id: `combo_${Date.now().toString(36)}`,
      name: comboNameInput.trim() || `Unione ${selectedTables.map((t) => t.tableNumber).join(' + ')}`,
      tableIds: selectedTableIdsForCombo,
      tableType: firstTable.tableType,
      minPartySize: comboMinPax,
      maxPartySize: comboMaxPax,
      totalPhysicalSeats: totalPhysical,
      floorPlanId: activeLayout.id,
      isActive: true,
      notes: `Unione configurata per sala ${firstTable.diningAreaId || 'centrale'}`,
    };

    const nextCombos = [...combinations, newCombo];
    onUpdateCombinations(nextCombos, `Creata combinazione "${newCombo.name}"`);

    // Reset selection
    setSelectedTableIdsForCombo([]);
    setComboNameInput('');
  };

  const handleDeleteCombination = (comboId: string) => {
    const nextCombos = combinations.filter((c) => c.id !== comboId);
    onUpdateCombinations(nextCombos, `Eliminata combinazione`);
  };

  const handleApplySuggestion = (sug: typeof smartSuggestions[0]) => {
    const totalSeats = sug.tableA.physicalSeats + sug.tableB.physicalSeats;
    const newCombo: TableCombination = {
      id: `combo_sug_${Date.now().toString(36)}`,
      name: `Unione ${sug.tableA.tableNumber} + ${sug.tableB.tableNumber}`,
      tableIds: [sug.tableA.id, sug.tableB.id],
      tableType: sug.tableA.tableType,
      minPartySize: sug.suggestedMinPax,
      maxPartySize: sug.suggestedMaxPax,
      totalPhysicalSeats: totalSeats,
      floorPlanId: activeLayout.id,
      isActive: true,
      notes: sug.reason,
    };

    const nextCombos = [...combinations, newCombo];
    onUpdateCombinations(nextCombos, `Aggiunta combinazione suggerita ${newCombo.name}`);
  };

  const handleUpdateCombinationCapacity = (comboId: string, minPax: number, maxPax: number) => {
    const nextCombos = combinations.map((c) => {
      if (c.id === comboId) {
        return { ...c, minPartySize: minPax, maxPartySize: maxPax };
      }
      return c;
    });
    onUpdateCombinations(nextCombos, `Modificata capacità combinazione`);
    setEditingComboId(null);
  };

  // Combinations belonging to active layout
  const activeLayoutCombos = combinations.filter((c) => c.floorPlanId === activeLayout.id);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & CATEGORY FILTER BAR */}
      <div className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-base ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Gestione Combinazioni & Unioni Tavoli
            </h3>
            <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-sky-50 text-sky-700 border-sky-200/70' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
            }`}>
              {activeLayoutCombos.length} combinazioni attive
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Associa tavoli fisici adiacenti per accogliere gruppi numerosi con regole rigide di categoria e percorsi sgombri.
          </p>
        </div>

        {/* Category Filter segmented control */}
        <div className={`flex items-center gap-1 p-0.5 rounded-xl border overflow-x-auto max-w-full ${
          isLight ? 'bg-slate-100/60 border-slate-200/70' : 'bg-[#141824] border-[#222A3C]'
        }`}>
          {[
            { id: 'all' as const, label: 'Tutti' },
            { id: 'regular' as const, label: 'Standard' },
            { id: 'outdoor' as const, label: 'Dehor' },
            { id: 'bar' as const, label: 'Bar' },
            { id: 'private' as const, label: 'Privé' },
            { id: 'high_top' as const, label: 'Alti' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition cursor-pointer border ${
                selectedCategoryFilter === cat.id
                  ? isLight
                    ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                    : 'bg-[#1C2538] text-slate-100 border-white/10 shadow-2xs font-medium'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SMART SUGGESTIONS BANNER (ADJACENT VALID COMBINATIONS) */}
      {smartSuggestions.length > 0 && (
        <div className={`p-4 rounded-2xl border space-y-3 shadow-xs ${
          isLight ? 'bg-sky-50/70 border-sky-200 text-slate-900' : 'bg-[#162033]/80 border-sky-800/60 text-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Suggerimenti Intelligenti di Unione (Smart Suggestions)
              </h4>
            </div>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
              Rilevati tavoli adiacenti della stessa tipologia con percorso sgombro
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {smartSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-white border-sky-200 shadow-2xs' : 'bg-[#10141F] border-[#222A3C]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">
                      Tavolo {sug.tableA.tableNumber} + {sug.tableB.tableNumber}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {sug.tableA.tableType}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {sug.reason}
                  </p>
                  <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 block mt-1">
                    Capacità: {sug.suggestedMinPax} - {sug.suggestedMaxPax} pax
                  </span>
                </div>

                <button
                  onClick={() => handleApplySuggestion(sug)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shrink-0 cursor-pointer transition shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. COMBINATION BUILDER & ACTIVE COMBINATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: TABLE SELECTOR & COMBINATION BUILDER (5 Cols) */}
        <div className={`lg:col-span-5 p-4 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Costruttore Nuova Combinazione
            </h4>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Seleziona 2 o più tavoli compatibili della stessa categoria
            </p>
          </div>

          {/* Table multi-selection grid */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filteredTables.map((table) => {
                const isSelected = selectedTableIdsForCombo.includes(table.id);
                return (
                  <button
                    key={table.id}
                    onClick={() => handleToggleTableForCombo(table.id)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-between ${
                      isSelected
                        ? isLight
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-[#8B31E0] text-white border-[#8B31E0] shadow-sm'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        : 'bg-[#171D2B] hover:bg-[#1E2536] border-[#273248] text-slate-200'
                    }`}
                  >
                    <span className="font-brand font-bold text-sm leading-tight">{table.tableNumber}</span>
                    <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      {table.physicalSeats}p · {table.tableType.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Feedback Warning */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Errore di Validazione:</strong>
                <span className="text-[11px] leading-relaxed">{validationError}</span>
              </div>
            </div>
          )}

          {/* Selected tables summary & capacities */}
          {selectedTableIdsForCombo.length > 0 && (
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Tavoli Selezionati ({selectedTableIdsForCombo.length}):</span>
                <span className="font-mono text-sky-600 font-bold">
                  {selectedTables.map((t) => t.tableNumber).join(' + ')}
                </span>
              </div>

              {/* Strict validation indicator */}
              <div className="flex items-center gap-1.5 text-[11px]">
                {isStrictCategoryValid ? (
                  <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Categorie omogenee ({selectedTables[0]?.tableType.toUpperCase()})
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Tipi discordanti non unibili!
                  </span>
                )}
              </div>

              {/* Combination Name */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Nome Combinazione
                </label>
                <input
                  type="text"
                  value={comboNameInput}
                  onChange={(e) => setComboNameInput(e.target.value)}
                  placeholder="Es. Tavolata Banchetto 10+11"
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium"
                />
              </div>

              {/* Capacity settings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Min Coperti (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={comboMaxPax}
                    value={comboMinPax}
                    onChange={(e) => setComboMinPax(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-1 rounded-lg border text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Max Coperti (Pax)
                  </label>
                  <input
                    type="number"
                    min={comboMinPax}
                    max="40"
                    value={comboMaxPax}
                    onChange={(e) => setComboMaxPax(parseInt(e.target.value, 10) || 4)}
                    className="w-full px-2 py-1 rounded-lg border text-xs font-bold text-center"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateCombination}
                disabled={!isStrictCategoryValid || selectedTableIdsForCombo.length < 2}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Salva Combinazione Tavoli</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIST OF ACTIVE COMBINATIONS (7 Cols) */}
        <div className={`lg:col-span-7 p-4 rounded-2xl border space-y-3 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Registro Combinazioni Attive ({activeLayoutCombos.length})
              </h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Disponibili per motore di booking online e assegnazione manuale
              </p>
            </div>

            <span className="text-[10px] font-mono text-slate-400">
              Layout: {activeLayout.name}
            </span>
          </div>

          {activeLayoutCombos.length > 0 ? (
            <div className="space-y-2.5">
              {activeLayoutCombos.map((combo) => {
                const memberTables = activeLayout.tables.filter((t) => combo.tableIds.includes(t.id));
                const isEditing = editingComboId === combo.id;

                return (
                  <div
                    key={combo.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isLight ? 'bg-slate-50/70 hover:bg-slate-50 border-slate-200' : 'bg-[#171D2B] hover:bg-[#1E2536] border-[#273248]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {combo.name}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold">
                          {combo.tableType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Tavoli uniti: <strong className="text-slate-800 dark:text-slate-200">{memberTables.map((t) => t.tableNumber).join(' + ')}</strong></span>
                        <span>·</span>
                        <span className="font-mono">Fisici: {combo.totalPhysicalSeats} posti</span>
                      </div>

                      {combo.notes && (
                        <p className="text-[10px] text-slate-400 italic">
                          {combo.notes}
                        </p>
                      )}
                    </div>

                    {/* Capacity & Action buttons */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            defaultValue={combo.minPartySize}
                            id={`min_${combo.id}`}
                            className="w-12 px-1 py-0.5 border text-xs font-bold text-center rounded"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            defaultValue={combo.maxPartySize}
                            id={`max_${combo.id}`}
                            className="w-12 px-1 py-0.5 border text-xs font-bold text-center rounded"
                          />
                          <button
                            onClick={() => {
                              const minEl = document.getElementById(`min_${combo.id}`) as HTMLInputElement;
                              const maxEl = document.getElementById(`max_${combo.id}`) as HTMLInputElement;
                              handleUpdateCombinationCapacity(
                                combo.id,
                                parseInt(minEl.value, 10) || combo.minPartySize,
                                parseInt(maxEl.value, 10) || combo.maxPartySize
                              );
                            }}
                            className="p-1 rounded bg-sky-500 text-white text-xs font-bold"
                          >
                            Salva
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingComboId(combo.id)}
                          className="px-2.5 py-1 rounded-xl border text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-[#121622] cursor-pointer hover:border-sky-400"
                          title="Clicca per modificare capacità min/max"
                        >
                          {combo.minPartySize} - {combo.maxPartySize} pax
                        </div>
                      )}

                      {/* Bin icon to un-combine tables */}
                      <button
                        onClick={() => handleDeleteCombination(combo.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                        title="Separa ed elimina combinazione"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-1">
              <Link2 className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold">Nessuna combinazione per questo layout</p>
              <p className="text-[11px]">
                Seleziona due o più tavoli a sinistra per creare una combinazione valida.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

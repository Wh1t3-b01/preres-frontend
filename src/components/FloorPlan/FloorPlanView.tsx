import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { SpatialZoneCanvas } from './SpatialZoneCanvas';
import { AddTableModal } from '../Modals/AddTableModal';
import {
  Layers,
  X,
  Plus,
  Users,
  Clock,
  Wine,
  UtensilsCrossed,
  Shield,
  HelpCircle,
  Move,
  Check,
  Compass,
  RotateCcw,
} from 'lucide-react';

interface FloorPlanViewProps {
  onSelectTableForDetails: (tableId: string) => void;
  onOpenBookingModalWithTables?: (tableIds: string[]) => void;
}

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  onSelectTableForDetails,
  onOpenBookingModalWithTables,
}) => {
  const {
    tables,
    tableGroups,
    selectedDate,
    selectedTime,
    selectedTableIds,
    clearTableSelection,
    mergeTables,
    unmergeTables,
    isLayoutEditMode,
    setIsLayoutEditMode,
    resetToDefaults,
  } = useRestaurant();

  const [groupNameInput, setGroupNameInput] = useState('');
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [addTableZone, setAddTableZone] = useState<'main' | 'bar' | 'private'>('main');

  // Tables separated by zone
  const barTables = tables.filter((t) => t.zone === 'bar');
  const mainTables = tables.filter((t) => t.zone === 'main');
  const privateTables = tables.filter((t) => t.zone === 'private');

  // Active groups for currently selected date
  const activeDateGroups = tableGroups.filter((g) => g.groupDate === selectedDate);

  // Selected tables capacity sum
  const selectedTablesList = tables.filter((t) => selectedTableIds.includes(t.id));
  const selectedTotalCapacity = selectedTablesList.reduce(
    (sum, t) => sum + (t.capacityOverride || t.capacity),
    0
  );

  const handleMergeSelected = () => {
    if (selectedTableIds.length < 2) return;
    const result = mergeTables({
      date: selectedDate,
      tableIds: selectedTableIds,
      groupName: groupNameInput.trim() || undefined,
    });
    if (result.success) {
      setGroupNameInput('');
    }
  };

  const handleOpenAddTable = (zone: 'main' | 'bar' | 'private' = 'main') => {
    setAddTableZone(zone);
    setIsAddTableOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* MANAGEMENT & LAYOUT ACTION TOOLBAR */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1E3A2F] text-amber-100 flex items-center justify-center font-bold text-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-brand font-bold text-sm text-[#1E3A2F]">
              Disposizione Sala & Gestione Tavoli
            </h3>
            <p className="text-[11px] text-stone-500">
              Aggiungi nuovi tavoli, spostali con drag-and-drop o unisci per grandi gruppi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Add Table Button */}
          <button
            onClick={() => handleOpenAddTable('main')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6B3FA0] hover:bg-[#5A338A] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi Tavolo</span>
          </button>

          {/* Move Table Toggle (Drag & Drop Mode) */}
          <button
            onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition border shadow-xs cursor-pointer ${
              isLayoutEditMode
                ? 'bg-amber-400 text-[#1E3A2F] border-amber-500 ring-2 ring-amber-300'
                : 'bg-stone-100 hover:bg-stone-200 text-[#1E3A2F] border-[#1E3A2F]/10'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isLayoutEditMode ? 'Termina Spostamento Tavoli' : 'Sposta Tavoli (Drag & Drop)'}</span>
          </button>

          {/* Reset Layout to Default 32 Tables */}
          <button
            onClick={resetToDefaults}
            title="Ripristina layout originale con tutti i 32 tavoli"
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#1E3A2F]/80 text-xs font-semibold rounded-xl transition border border-[#1E3A2F]/10 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Ripristina Sala ({tables.length} tavoli)</span>
          </button>
        </div>
      </div>

      {/* ACTIVE DRAG-AND-DROP MOVE BANNER */}
      {isLayoutEditMode && (
        <div className="bg-amber-500 text-[#1E3A2F] rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Move className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold block text-sm">Modalità Spostamento Tavoli Attiva</strong>
              <span>Trascina con il mouse o dito qualsiasi tavolo per posizionarlo dove desideri nella sala.</span>
            </div>
          </div>
          <button
            onClick={() => setIsLayoutEditMode(false)}
            className="px-4 py-1.5 bg-[#1E3A2F] text-amber-100 text-xs font-bold rounded-xl hover:bg-[#152a22] transition shadow-xs whitespace-nowrap"
          >
            Salva Posizioni
          </button>
        </div>
      )}

      {/* FLOATING MULTI-TABLE MERGE ACTION BAR (when tables are selected) */}
      {selectedTableIds.length > 0 && (
        <div className="sticky top-24 z-30 bg-[#1E3A2F] text-white rounded-2xl p-4 shadow-xl border border-amber-300/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 font-bold text-sm">
              {selectedTableIds.length}
            </div>
            <div>
              <div className="font-bold text-sm text-amber-200 flex items-center gap-2">
                <span>Tavoli Selezionati: {selectedTableIds.join(' + ')}</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded font-mono-num">
                  Capienza Totale: {selectedTotalCapacity} Ospiti
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Accorpa in un unico maxi-tavolo o prenota direttamente per questo gruppo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <input
              type="text"
              placeholder="Nome maxi-tavolo (es. Tavolo 14+15 Gruppo)"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-amber-300 w-full md:w-56"
            />
            <button
              onClick={handleMergeSelected}
              disabled={selectedTableIds.length < 2}
              className="bg-amber-400 hover:bg-amber-300 text-[#1E3A2F] font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Unisci Tavoli</span>
            </button>
            <button
              onClick={clearTableSelection}
              className="p-2 text-stone-300 hover:text-white rounded-xl hover:bg-white/10 transition"
              title="Deseleziona tutti"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE ACCORPAMENTI BANNER */}
      {activeDateGroups.length > 0 && (
        <div className="bg-amber-50/90 border-2 border-amber-500/40 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              Accorpamenti Attivi per la data selezionata ({activeDateGroups.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeDateGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white border border-amber-300/80 rounded-xl p-3 flex items-center justify-between shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-xs text-[#1E3A2F]">{group.combinedName}</h4>
                  <div className="text-[11px] text-stone-600 flex items-center gap-2 mt-0.5">
                    <span>Tavoli: {group.memberTableIds.join(', ')}</span>
                    <span>·</span>
                    <span className="font-semibold text-[#6B3FA0]">{group.totalCapacity} posti</span>
                  </div>
                </div>
                <button
                  onClick={() => unmergeTables(group.id)}
                  className="text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition"
                >
                  Sciogli
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 SPATIAL ZONES WITH DRAG-AND-DROP REPOSITIONING */}
      <div className="grid grid-cols-1 gap-8">
        {/* Zone 1: Bar Area */}
        <SpatialZoneCanvas
          zoneKey="bar"
          zoneTitle="1. Zona Bar & Aperitivi"
          zoneSubtitle="Tavoli B1 - B4 & Bancone Mixology"
          icon={<Wine className="w-4 h-4" />}
          tables={barTables}
          activeGroups={activeDateGroups}
          onSelectTableForDetails={onSelectTableForDetails}
          onAddNewTable={() => handleOpenAddTable('bar')}
        />

        {/* Zone 2: Main Dining Room */}
        <SpatialZoneCanvas
          zoneKey="main"
          zoneTitle="2. Sala Principale (Main Dining Room)"
          zoneSubtitle="Fila Inferiore 10-16 & Booth G · Fila Superiore 20-23"
          icon={<UtensilsCrossed className="w-4 h-4" />}
          tables={mainTables}
          activeGroups={activeDateGroups}
          onSelectTableForDetails={onSelectTableForDetails}
          onAddNewTable={() => handleOpenAddTable('main')}
        />

        {/* Zone 3: Private Dining Room */}
        <SpatialZoneCanvas
          zoneKey="private"
          zoneTitle="3. Sala Riservata (Private Dining Room)"
          zoneSubtitle="Tavoli VIP 30 - 34 · Atmosfera Esclusiva"
          icon={<Shield className="w-4 h-4" />}
          tables={privateTables}
          activeGroups={activeDateGroups}
          onSelectTableForDetails={onSelectTableForDetails}
          onAddNewTable={() => handleOpenAddTable('private')}
        />
      </div>

      {/* Legend Footer */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#1E3A2F]/80">
        <div className="flex items-center gap-2 font-semibold">
          <HelpCircle className="w-4 h-4 text-[#1E3A2F]/50" />
          <span>Legenda Stati Tavolo:</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span>
            <span>Libero</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#6B3FA0] border border-[#5A338A]"></span>
            <span>Prenotato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-700"></span>
            <span>Seduto (Timer attivo)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
            <span>Avviso Turno (&gt; 100m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-700"></span>
            <span>Tempo Scaduto (&gt; 120m)</span>
          </div>
        </div>
      </div>

      {/* Add Table Modal */}
      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        defaultZone={addTableZone}
      />
    </div>
  );
};

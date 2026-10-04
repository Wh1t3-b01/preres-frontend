import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { SpatialZoneCanvas } from './SpatialZoneCanvas';
import { AddTableModal } from '../Modals/AddTableModal';
import { TableZone } from '../../types';
import {
  Layers,
  X,
  Wine,
  UtensilsCrossed,
  Shield,
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
    selectedTableIds,
    clearTableSelection,
    mergeTables,
    unmergeTables,
  } = useRestaurant();

  const [activeZoneFilter, setActiveZoneFilter] = useState<'all' | TableZone>('all');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [addTableZone, setAddTableZone] = useState<TableZone>('main_a');

  // Tables separated by modern zoning
  const barTables = tables.filter((t) => t.zone === 'bar');
  const privateTables = tables.filter((t) => t.zone === 'private');
  
  // MAIN A: Table G (West wall), North wall 10, 11, 12, South wall 20, 21
  const mainATables = tables.filter(
    (t) => t.zone === 'main_a' || (t.zone === 'main' && ['G', '10', '11', '12', '20', '21'].includes(t.id))
  );

  // MAIN B: North wall 13, 14, 15, 16, South wall 21, 22, 23
  const mainBTables = tables.filter(
    (t) =>
      t.zone === 'main_b' ||
      (t.zone === 'main' && ['13', '14', '15', '16', '21_b', '22', '23'].includes(t.id))
  );

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

  const handleOpenAddTable = (zone: TableZone = 'main_a') => {
    setAddTableZone(zone);
    setIsAddTableOpen(true);
  };

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-16 text-slate-100">
      
      {/* ZONE FILTER & VIEW SELECTOR TOOLBAR */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left: Minimal Zone Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0B0E17] border border-[#1C2333] rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveZoneFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeZoneFilter === 'all'
                ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#151A27]'
            }`}
          >
            Vista Completa (Sviluppo Verticale)
          </button>

          <button
            onClick={() => setActiveZoneFilter('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeZoneFilter === 'bar'
                ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#151A27]'
            }`}
          >
            Sala Bar ({barTables.length})
          </button>

          <button
            onClick={() => setActiveZoneFilter('main_a')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeZoneFilter === 'main_a'
                ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#151A27]'
            }`}
          >
            MAIN A - Ovest ({mainATables.length})
          </button>

          <button
            onClick={() => setActiveZoneFilter('main_b')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeZoneFilter === 'main_b'
                ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#151A27]'
            }`}
          >
            MAIN B - Est ({mainBTables.length})
          </button>

          <button
            onClick={() => setActiveZoneFilter('private')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeZoneFilter === 'private'
                ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#151A27]'
            }`}
          >
            Privé ({privateTables.length})
          </button>
        </div>

        {/* Right: Minimal Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Libero</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
            <span>Prenotato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#059669] ring-2 ring-[#10B981]/40" />
            <span>Seduto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>&gt;100 min</span>
          </div>
        </div>

      </div>

      {/* FLOATING MULTI-TABLE MERGE ACTION BAR (when tables are selected) */}
      {selectedTableIds.length > 0 && (
        <div className="sticky top-16 z-30 bg-[#161B28] text-white rounded-2xl p-3 shadow-2xl border border-[#8B31E0]/60 flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-7 h-7 rounded-xl bg-[#8B31E0]/30 border border-[#A855F7]/40 flex items-center justify-center text-[#C084FC] font-bold text-xs">
              {selectedTableIds.length}
            </div>
            <div>
              <div className="font-semibold text-xs text-[#E9D5FF] flex items-center gap-2">
                <span>Tavoli Selezionati: {selectedTableIds.join(' + ')}</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.2 rounded font-mono">
                  Capienza: {selectedTotalCapacity} pax
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Nome maxi-tavolo..."
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              className="bg-[#0E121C] border border-[#273044] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A855F7] w-full md:w-48"
            />
            <button
              onClick={handleMergeSelected}
              disabled={selectedTableIds.length < 2}
              className="bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs transition shadow-md whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Unisci Tavoli</span>
            </button>
            <button
              onClick={clearTableSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              title="Deseleziona"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE GROUPS BANNER */}
      {activeDateGroups.length > 0 && (
        <div className="bg-[#121622] border border-[#8B31E0]/40 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#C084FC] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 stroke-[1.5]" />
              Accorpamenti Attivi ({activeDateGroups.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeDateGroups.map((group) => (
              <div
                key={group.id}
                className="bg-[#0E121B] border border-[#222A3C] rounded-xl p-2.5 flex items-center justify-between shadow-xs"
              >
                <div>
                  <h4 className="font-semibold text-xs text-white">{group.combinedName}</h4>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Tavoli: {group.memberTableIds.join(', ')}</span>
                    <span>·</span>
                    <span className="font-semibold text-[#C084FC]">{group.totalCapacity} posti</span>
                  </div>
                </div>
                <button
                  onClick={() => unmergeTables(group.id)}
                  className="text-[11px] font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 px-2 py-0.5 rounded-lg transition cursor-pointer"
                >
                  Sciogli
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTINUOUS VERTICAL DEVELOPMENT FLOOR PLAN (STACKED ARCHITECTURAL ZONES) */}
      {/* ========================================================================= */}
      
      {(activeZoneFilter === 'all' || activeZoneFilter === 'bar') && (
        <SpatialZoneCanvas
          zoneKey="bar"
          zoneTitle="1. Sala Bar & Lounge"
          zoneSubtitle="Tavoli B1 - B4 (2 pax compatti e 4 pax bench) & Bancone Ovest"
          icon={<Wine className="w-3.5 h-3.5 stroke-[1.5]" />}
          tables={barTables}
          activeGroups={activeDateGroups}
          onSelectTableForDetails={onSelectTableForDetails}
          onAddNewTable={() => handleOpenAddTable('bar')}
        />
      )}

      {(activeZoneFilter === 'all' || activeZoneFilter === 'main_a') && (
        <SpatialZoneCanvas
          zoneKey="main_a"
          zoneTitle="2. MAIN A — Ala Ovest"
          zoneSubtitle="Booth VIP G, Tavoli Nord 10-12 e Sud 20-21 (Tavolo 21 unificato)"
          icon={<UtensilsCrossed className="w-3.5 h-3.5 stroke-[1.5]" />}
          tables={mainATables}
          activeGroups={activeDateGroups}
          onSelectTableForDetails={onSelectTableForDetails}
          onAddNewTable={() => handleOpenAddTable('main_a')}
        />
      )}

      {(activeZoneFilter === 'all' || activeZoneFilter === 'main_b') && (
        <SpatialZoneCanvas
          zoneKey="main_b"
          zoneTitle="3. MAIN B — Ala Est"
          zoneSubtitle="Tavoli Nord 13-16 e Sud 21-23 (Tavolo 21 specchiato in tempo reale)"
          icon={<UtensilsCrossed className="w-3.5 h-3.5 stroke-[1.5]" />}
          tables={mainBTables}
          activeGroups={activeDateGroups}
          onSelectTableForDetails={onSelectTableForDetails}
          onAddNewTable={() => handleOpenAddTable('main_b')}
        />
      )}

      {(activeZoneFilter === 'all' || activeZoneFilter === 'private') && (
        <SpatialZoneCanvas
          zoneKey="private"
          zoneTitle="4. Private Dining Room (Privé)"
          zoneSubtitle="Tavoli 30-34 per cene riservate ed eventi speciali"
          icon={<Shield className="w-3.5 h-3.5 stroke-[1.5]" />}
          tables={privateTables}
          activeGroups={activeDateGroups}
          onSelectTableForDetails={onSelectTableForDetails}
          onAddNewTable={() => handleOpenAddTable('private')}
        />
      )}

      {/* Add Custom Table Modal */}
      <AddTableModal
        isOpen={isAddTableOpen}
        defaultZone={addTableZone}
        onClose={() => setIsAddTableOpen(false)}
      />

    </div>
  );
};

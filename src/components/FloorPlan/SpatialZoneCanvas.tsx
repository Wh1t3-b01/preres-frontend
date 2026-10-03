import React, { useRef, useState } from 'react';
import { RestaurantTable, TableGroup } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from './TableCard';
import { Move, Trash2, Plus } from 'lucide-react';

interface SpatialZoneCanvasProps {
  zoneKey: 'bar' | 'main' | 'private';
  zoneTitle: string;
  zoneSubtitle: string;
  icon: React.ReactNode;
  tables: RestaurantTable[];
  activeGroups: TableGroup[];
  onSelectTableForDetails: (tableId: string) => void;
  onAddNewTable?: () => void;
}

export const SpatialZoneCanvas: React.FC<SpatialZoneCanvasProps> = ({
  zoneKey,
  zoneTitle,
  zoneSubtitle,
  icon,
  tables,
  activeGroups,
  onSelectTableForDetails,
  onAddNewTable,
}) => {
  const {
    isLayoutEditMode,
    updateTablePosition,
    removeCustomTable,
  } = useRestaurant();

  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, table: RestaurantTable) => {
    if (!isLayoutEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setDraggingTableId(table.id);
    setDragOffset({
      x: clickXPercent - table.x,
      y: clickYPercent - table.y,
    });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const moveRect = containerRef.current.getBoundingClientRect();
      const currentXPercent = ((moveEvent.clientX - moveRect.left) / moveRect.width) * 100;
      const currentYPercent = ((moveEvent.clientY - moveRect.top) / moveRect.height) * 100;

      let newX = currentXPercent - dragOffset.x;
      let newY = currentYPercent - dragOffset.y;

      newX = Math.round(newX / 2) * 2;
      newY = Math.round(newY / 2) * 2;

      newX = Math.max(1, Math.min(88, newX));
      newY = Math.max(1, Math.min(82, newY));

      updateTablePosition(table.id, newX, newY);
    };

    const handlePointerUp = () => {
      setDraggingTableId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <section className="bg-[#F6F2E9] border-2 border-[#1E3A2F]/20 rounded-3xl p-4 sm:p-6 shadow-xs relative w-full overflow-hidden">
      {/* Zone Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-[#1E3A2F]/15 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#1E3A2F] text-amber-100 rounded-xl shadow-2xs">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold font-brand text-[#1E3A2F] tracking-wide">
              {zoneTitle}
            </h3>
            <p className="text-[11px] text-[#1E3A2F]/60">{zoneSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddNewTable && (
            <button
              onClick={onAddNewTable}
              className="flex items-center gap-1 bg-[#6B3FA0] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#5A338A] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Tavolo</span>
            </button>
          )}
          <span className="text-xs text-[#1E3A2F] font-bold bg-white px-2.5 py-1 rounded-lg border border-[#1E3A2F]/15 font-mono-num shadow-2xs">
            {tables.length} Tavoli
          </span>
        </div>
      </div>

      {/* Blueprint Room Canvas with responsive scroll wrapper */}
      <div className="w-full overflow-x-auto pb-2">
        <div
          ref={containerRef}
          className={`relative w-full min-w-[700px] md:min-w-full min-h-[440px] md:min-h-[480px] rounded-2xl border border-[#1E3A2F]/15 bg-[#FDFBF7] overflow-hidden transition-all shadow-inner ${
            isLayoutEditMode ? 'ring-4 ring-amber-400 bg-amber-50/20' : ''
          }`}
          style={{
            backgroundImage: isLayoutEditMode
              ? 'radial-gradient(#1E3A2F 2px, transparent 2px)'
              : 'radial-gradient(#1E3A2F 0.5px, transparent 0.5px)',
            backgroundSize: isLayoutEditMode ? '24px 24px' : '32px 32px',
          }}
        >
          {/* Architectural zone accents */}
          {zoneKey === 'bar' && (
            <div className="absolute top-4 left-6 right-6 h-8 bg-amber-900/10 border-2 border-dashed border-amber-900/20 rounded-xl flex items-center justify-center text-[10px] uppercase font-bold text-amber-900/60 tracking-widest pointer-events-none">
              🍸 Bancone Cocktails & Sommelier
            </div>
          )}

          {zoneKey === 'private' && (
            <div className="absolute top-4 left-6 right-6 h-8 bg-[#1E3A2F]/5 border-2 border-dashed border-[#1E3A2F]/20 rounded-xl flex items-center justify-center text-[10px] uppercase font-bold text-[#1E3A2F]/60 tracking-widest pointer-events-none">
              🕯️ Privé Esclusivo & Degustazione
            </div>
          )}

          {/* Tables rendered on spatial coordinates */}
          {tables.map((table) => {
            const matchingGroup = activeGroups.find((g) =>
              g.memberTableIds.includes(table.id)
            );

            return (
              <div
                key={table.id}
                onPointerDown={(e) => handlePointerDown(e, table)}
                style={{
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  touchAction: 'none',
                }}
                className={`absolute transition-all duration-75 ${
                  isLayoutEditMode
                    ? 'cursor-grab active:cursor-grabbing hover:scale-105 z-20'
                    : 'z-10'
                } ${draggingTableId === table.id ? 'opacity-80 scale-110 z-30 ring-4 ring-[#6B3FA0] rounded-2xl' : ''}`}
              >
                {/* Drag handle & Delete badge when Move Mode is active */}
                {isLayoutEditMode && (
                  <div className="absolute -top-3 -right-2 flex items-center gap-1 z-30 animate-in fade-in">
                    <div className="bg-amber-500 text-stone-900 p-1 rounded-full shadow-md">
                      <Move className="w-3 h-3" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomTable(table.id);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md transition active:scale-90"
                      title="Elimina tavolo dalla sala"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <TableCard
                  table={table}
                  group={matchingGroup}
                  onSelectTableForDetails={onSelectTableForDetails}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

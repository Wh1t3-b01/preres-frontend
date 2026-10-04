import React, { useRef, useState } from 'react';
import { RestaurantTable, TableGroup, TableZone } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from './TableCard';
import { Trash2, Plus } from 'lucide-react';

interface SpatialZoneCanvasProps {
  zoneKey: TableZone;
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
    <section className="bg-[#10141F] border border-[#222A3C] rounded-3xl p-3.5 sm:p-5 shadow-sm relative w-full overflow-hidden flex flex-col justify-between text-slate-100">
      {/* Zone Header */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 mb-2.5 border-b border-[#222A3C] gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#171C2A] text-[#C084FC] rounded-xl shadow-xs border border-[#273044] shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide leading-tight">
              {zoneTitle}
            </h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[280px] sm:max-w-none">
              {zoneSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddNewTable && (
            <button
              onClick={onAddNewTable}
              className="px-2 py-1 bg-[#171C2A] hover:bg-[#20273A] border border-[#273044] text-[#C084FC] rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3 h-3 stroke-[2]" />
              <span className="hidden sm:inline text-[10px] font-semibold">+ Tavolo</span>
            </button>
          )}

          <div className="text-[10px] font-mono text-slate-400 bg-[#171C2A] px-2 py-0.5 rounded-lg border border-[#273044]">
            {tables.length} tavoli
          </div>
        </div>
      </div>

      {/* Spatial 2D Interactive Canvas */}
      <div
        ref={containerRef}
        className={`relative w-full h-[360px] sm:h-[390px] rounded-2xl transition-all duration-200 overflow-hidden ${
          isLayoutEditMode
            ? 'bg-[#0B0E17] ring-2 ring-[#A855F7]/40 cursor-crosshair'
            : 'bg-[#0B0E17] border border-[#1A2030]'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(circle, #21293D 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        {/* Wall & Boundary Visual Guides */}
        <div className="absolute top-2 left-3 text-[8px] uppercase tracking-widest text-slate-600 font-semibold pointer-events-none select-none">
          Nord · Parete Esterna
        </div>
        <div className="absolute bottom-2 right-3 text-[8px] uppercase tracking-widest text-slate-600 font-semibold pointer-events-none select-none">
          Sud · Passaggio Sala
        </div>

        {/* Render Tables */}
        {tables.map((table) => {
          const group = activeGroups.find((g) => g.memberTableIds.includes(table.id));
          const isDragging = draggingTableId === table.id;

          return (
            <div
              key={table.id}
              onPointerDown={(e) => handlePointerDown(e, table)}
              className={`absolute transition-transform ${
                isDragging ? 'z-30 scale-105 opacity-90' : 'z-10'
              } ${isLayoutEditMode ? 'cursor-grab active:cursor-grabbing ring-1 ring-[#A855F7]/40 rounded-2xl' : ''}`}
              style={{
                left: `${table.x}%`,
                top: `${table.y}%`,
                touchAction: 'none',
              }}
            >
              <TableCard
                table={table}
                group={group}
                onSelectTableForDetails={onSelectTableForDetails}
              />

              {/* Edit Mode Delete Button */}
              {isLayoutEditMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Rimuovere ${table.name || table.tableNumber}?`)) {
                      removeCustomTable(table.id);
                    }
                  }}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 z-40 transition cursor-pointer"
                  title="Elimina Tavolo"
                >
                  <Trash2 className="w-2.5 h-2.5 stroke-[1.5]" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React, { useState, useRef, useMemo } from 'react';
import {
  FloorPlanLayout,
  BohTable,
  DiningAreaZone,
  BohTableType,
} from '../../types/boh';
import { TableShape } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { SOTTO_SOTTO_DINING_AREAS } from '../../services/bohService';
import {
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy,
  Layers,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  Move,
  Square,
  Circle,
  RectangleHorizontal,
  Armchair,
  Wine,
  FolderPlus,
  Shield,
  UtensilsCrossed,
  Maximize2,
  Columns,
  Grid3X3,
  Ruler,
  Sliders,
  ChevronRight,
  Sparkles,
  Contrast,
} from 'lucide-react';

interface FloorPlanLayoutEditorProps {
  layout: FloorPlanLayout;
  allLayouts: FloorPlanLayout[];
  onUpdateLayout: (updated: FloorPlanLayout, changeReason?: string) => void;
  onSwitchLayout: (layoutId: string) => void;
  onCreateNewLayout: (name: string, copyFromId?: string) => void;
  onDeleteLayout: (layoutId: string) => void;
  onNavigateToFloor?: () => void;
}

const TABLE_SHAPES: { shape: TableShape; label: string; icon: React.FC<any>; defaultSeats: number; w: number; h: number }[] = [
  { shape: 'square', label: 'Tavolo Quadrato (2p)', icon: Square, defaultSeats: 2, w: 80, h: 80 },
  { shape: 'round', label: 'Tavolo Rotondo (4p)', icon: Circle, defaultSeats: 4, w: 90, h: 90 },
  { shape: 'rect-h', label: 'Rettangolare Orizzontale (6p)', icon: RectangleHorizontal, defaultSeats: 6, w: 120, h: 80 },
  { shape: 'booth', label: 'Booth VIP Divanetto (4p)', icon: Armchair, defaultSeats: 4, w: 110, h: 95 },
  { shape: 'rect-v', label: 'Postazione Bar / Parete (2p)', icon: Wine, defaultSeats: 2, w: 75, h: 95 },
];

export const resolveTableAreaId = (t: BohTable, areas: DiningAreaZone[]): string => {
  if (t.diningAreaId && areas.some((a) => a.id === t.diningAreaId)) {
    return t.diningAreaId;
  }
  const tid = (t.id || t.tableNumber || '').toUpperCase();
  if (t.tableType === 'bar' || tid.startsWith('B')) return 'area_bar';
  if (t.tableType === 'private' || ['30', '31', '32', '33', '34'].includes(tid)) return 'area_private';
  if (['13', '14', '15', '16', '22', '23'].includes(tid)) return 'area_main_b';
  return 'area_main_a';
};

export const FloorPlanLayoutEditor: React.FC<FloorPlanLayoutEditorProps> = ({
  layout,
  allLayouts,
  onUpdateLayout,
  onSwitchLayout,
  onCreateNewLayout,
  onDeleteLayout,
  onNavigateToFloor,
}) => {
  const { theme, applyBohLayout, activeFloorPlanName, isHighContrast, toggleHighContrast } = useRestaurant();
  const isLight = theme === 'light';
  const isAppliedToLiveFloor = activeFloorPlanName === layout.name;

  // View mode: 'single' (focused on 1 room) or 'all_separated' (multi-room grid: all 4 rooms separated side by side)
  const [viewMode, setViewMode] = useState<'single' | 'all_separated'>('single');

  // Active Dining Area (Room) Selector: default to 'area_bar'
  const [activeDiningAreaId, setActiveDiningAreaId] = useState<string>('area_bar');

  // Effective dining areas with per-room dimensions
  const effectiveAreas: DiningAreaZone[] = useMemo(() => {
    const rawAreas = layout.diningAreas && layout.diningAreas.length > 0 ? layout.diningAreas : SOTTO_SOTTO_DINING_AREAS;
    return rawAreas.map((a) => {
      const defaultDim =
        a.id === 'area_bar'
          ? { widthMeters: 10, heightMeters: 8 }
          : a.id === 'area_main_a'
          ? { widthMeters: 14, heightMeters: 10 }
          : a.id === 'area_main_b'
          ? { widthMeters: 14, heightMeters: 10 }
          : a.id === 'area_private'
          ? { widthMeters: 12, heightMeters: 9 }
          : { widthMeters: 12, heightMeters: 9 };
      return {
        ...a,
        dimensions: a.dimensions || defaultDim,
      };
    });
  }, [layout.diningAreas]);

  // Current single room in focus
  const activeArea = useMemo(() => {
    return effectiveAreas.find((a) => a.id === activeDiningAreaId) || effectiveAreas[0] || null;
  }, [effectiveAreas, activeDiningAreaId]);

  // Map each room to its tables (guaranteed NO OVERLAP across rooms)
  const roomTablesMap = useMemo(() => {
    const map: Record<string, BohTable[]> = {
      area_bar: [],
      area_main_a: [],
      area_main_b: [],
      area_private: [],
    };
    effectiveAreas.forEach((area) => {
      if (!map[area.id]) map[area.id] = [];
    });

    layout.tables.forEach((t) => {
      const areaId = resolveTableAreaId(t, effectiveAreas);
      if (map[areaId]) {
        map[areaId].push(t);
      } else {
        if (!map['area_main_a']) map['area_main_a'] = [];
        map['area_main_a'].push(t);
      }
    });

    return map;
  }, [layout.tables, effectiveAreas]);

  // Tables visible in single-room focus mode
  const singleRoomVisibleTables = useMemo(() => {
    return roomTablesMap[activeDiningAreaId] || [];
  }, [roomTablesMap, activeDiningAreaId]);

  // Update real dimensions in scale (width & depth in meters) for a specific room
  const handleUpdateRoomDimensions = (areaId: string, widthMeters: number, heightMeters: number) => {
    const clampedW = Math.max(6, Math.min(30, widthMeters));
    const clampedH = Math.max(5, Math.min(25, heightMeters));
    const nextAreas = effectiveAreas.map((a) => {
      if (a.id === areaId) {
        return {
          ...a,
          dimensions: { widthMeters: clampedW, heightMeters: clampedH },
        };
      }
      return a;
    });
    const roomTitle = effectiveAreas.find((a) => a.id === areaId)?.title || areaId;
    onUpdateLayout(
      { ...layout, diningAreas: nextAreas },
      `Dimensioni sala ${roomTitle} aggiornate a ${clampedW}m × ${clampedH}m`
    );
  };

  const handleSaveAndApplyToFloor = () => {
    const updatedLayout = { ...layout, updatedAt: new Date().toISOString() };
    onUpdateLayout(updatedLayout, `Salvato e assegnato layout "${layout.name}" alla Mappa Sala visiva`);
    applyBohLayout(updatedLayout);
  };

  // Selection state
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [multiSelectedTableIds, setMultiSelectedTableIds] = useState<string[]>([]);

  // Undo / Redo history stack
  const [history, setHistory] = useState<BohTable[][]>([layout.tables]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Canvas zoom & scale
  const [zoomLevel, setZoomLevel] = useState(1);
  const singleCanvasRef = useRef<HTMLDivElement>(null);

  // Dragging table state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCanvasEl, setDragCanvasEl] = useState<HTMLDivElement | null>(null);

  // Modal / Side drawer states
  const [isNewLayoutModalOpen, setIsNewLayoutModalOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [copyFromSourceId, setCopyFromSourceId] = useState<string>('');

  // Push new state to undo history
  const pushToHistory = (newTables: BohTable[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newTables);
    if (updatedHistory.length > 30) updatedHistory.shift();
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onUpdateLayout({ ...layout, tables: prev }, 'Annulla ultima modifica');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onUpdateLayout({ ...layout, tables: next }, 'Ripristina modifica');
    }
  };

  // Rotate active room tables 90° CW / CCW
  const handleRotateActiveRoom = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    const targetRoomId = activeDiningAreaId;

    const transformedTables = layout.tables.map((t) => {
      if (resolveTableAreaId(t, effectiveAreas) !== targetRoomId) {
        return t;
      }
      const cx = t.x - 50;
      const cy = t.y - 50;
      let newX = t.x;
      let newY = t.y;

      if (direction === 'cw') {
        newX = 50 - cy;
        newY = 50 + cx;
      } else {
        newX = 50 + cy;
        newY = 50 - cx;
      }

      newX = Math.max(6, Math.min(94, newX));
      newY = Math.max(6, Math.min(94, newY));

      const newTableRot = (t.rotation + delta + 360) % 360;
      return {
        ...t,
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        rotation: newTableRot,
      };
    });

    // Invert dimensions on 90deg turn
    let nextAreas = effectiveAreas;
    if (activeArea) {
      const curDims = activeArea.dimensions || { widthMeters: 12, heightMeters: 9 };
      nextAreas = effectiveAreas.map((a) =>
        a.id === activeArea.id
          ? { ...a, dimensions: { widthMeters: curDims.heightMeters, heightMeters: curDims.widthMeters } }
          : a
      );
    }

    pushToHistory(transformedTables);
    onUpdateLayout(
      {
        ...layout,
        diningAreas: nextAreas,
        tables: transformedTables,
      },
      `Ruotata ${activeArea ? activeArea.title : 'sala'} 90°`
    );
  };

  // Add Element into specific room
  const handleAddTableElement = (shapeDef: typeof TABLE_SHAPES[0], targetRoomId?: string) => {
    const destRoomId = targetRoomId || activeDiningAreaId || 'area_bar';
    const roomTables = roomTablesMap[destRoomId] || [];

    // Formulate a smart table number according to the room
    let nextNumber = '';
    if (destRoomId === 'area_bar') {
      const existingB = roomTables
        .map((t) => parseInt((t.tableNumber || '').replace('B', ''), 10))
        .filter((n) => !isNaN(n));
      const nextBNum = existingB.length > 0 ? Math.max(...existingB) + 1 : roomTables.length + 1;
      nextNumber = `B${nextBNum}`;
    } else if (destRoomId === 'area_private') {
      const existingPriv = roomTables
        .map((t) => parseInt(t.tableNumber, 10))
        .filter((n) => !isNaN(n) && n >= 30);
      const nextPrivNum = existingPriv.length > 0 ? Math.max(...existingPriv) + 1 : 35;
      nextNumber = `${nextPrivNum}`;
    } else {
      const existingNums = layout.tables
        .map((t) => parseInt(t.tableNumber, 10))
        .filter((n) => !isNaN(n));
      const nextN = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 25;
      nextNumber = `${nextN}`;
    }

    const tableId = `${nextNumber}_${Date.now().toString(36).slice(-4)}`;
    const targetType: BohTableType =
      destRoomId === 'area_bar'
        ? 'bar'
        : destRoomId === 'area_private'
        ? 'private'
        : shapeDef.shape === 'rect-v'
        ? 'bar'
        : shapeDef.shape === 'booth'
        ? 'private'
        : 'regular';

    // Position staggered based on existing table count in that room
    const countInRoom = roomTables.length;
    const initialX = 25 + ((countInRoom * 18) % 55);
    const initialY = 30 + ((Math.floor(countInRoom / 3) * 22) % 45);

    const newTable: BohTable = {
      id: tableId,
      tableNumber: nextNumber,
      name: `Tavolo ${nextNumber}`,
      shape: shapeDef.shape,
      tableType: targetType,
      minPartySize: shapeDef.defaultSeats <= 2 ? 1 : 2,
      maxPartySize: shapeDef.defaultSeats,
      physicalSeats: shapeDef.defaultSeats,
      x: initialX,
      y: initialY,
      width: shapeDef.w,
      height: shapeDef.h,
      rotation: 0,
      diningAreaId: destRoomId,
      adjacentWith: [],
    };

    const nextTables = [...layout.tables, newTable];
    pushToHistory(nextTables);
    onUpdateLayout(
      { ...layout, tables: nextTables },
      `Aggiunto nuovo Tavolo ${nextNumber} in ${effectiveAreas.find((a) => a.id === destRoomId)?.title || destRoomId}`
    );
    setSelectedTableId(newTable.id);
  };

  // Duplicate Table
  const handleDuplicateTable = (tableId: string) => {
    const src = layout.tables.find((t) => t.id === tableId);
    if (!src) return;

    const existingNums = layout.tables
      .map((t) => parseInt(t.tableNumber, 10))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : layout.tables.length + 1;

    const dup: BohTable = {
      ...src,
      id: `${src.tableNumber}_bis_${Date.now().toString(36).slice(-4)}`,
      tableNumber: `${src.tableNumber}b`,
      name: `${src.name} (Bis)`,
      x: Math.min(88, src.x + 8),
      y: Math.min(88, src.y + 8),
    };

    const nextTables = [...layout.tables, dup];
    pushToHistory(nextTables);
    onUpdateLayout({ ...layout, tables: nextTables }, `Duplicato ${src.name}`);
    setSelectedTableId(dup.id);
  };

  // Delete Table
  const handleDeleteTable = (tableId: string) => {
    const nextTables = layout.tables.filter((t) => t.id !== tableId);
    pushToHistory(nextTables);
    onUpdateLayout({ ...layout, tables: nextTables }, `Eliminato tavolo ${tableId}`);
    if (selectedTableId === tableId) setSelectedTableId(null);
    setMultiSelectedTableIds((prev) => prev.filter((id) => id !== tableId));
  };

  // Table Details Edit
  const handleUpdateSelectedTable = (updates: Partial<BohTable>) => {
    if (!selectedTableId) return;
    const nextTables = layout.tables.map((t) => {
      if (t.id === selectedTableId) {
        return { ...t, ...updates };
      }
      return t;
    });
    pushToHistory(nextTables);
    onUpdateLayout({ ...layout, tables: nextTables }, `Modificati dettagli tavolo ${selectedTableId}`);
  };

  // Drag & drop handlers
  const handleMouseDownTable = (e: React.MouseEvent, table: BohTable, canvasEl: HTMLDivElement | null) => {
    e.stopPropagation();

    if (e.shiftKey) {
      setMultiSelectedTableIds((prev) =>
        prev.includes(table.id) ? prev.filter((id) => id !== table.id) : [...prev, table.id]
      );
      return;
    }

    setSelectedTableId(table.id);
    setDraggingTableId(table.id);

    if (canvasEl) {
      setDragCanvasEl(canvasEl);
      const rect = canvasEl.getBoundingClientRect();
      const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clickYPct = ((e.clientY - rect.top) / rect.height) * 100;
      setDragOffset({
        x: clickXPct - table.x,
        y: clickYPct - table.y,
      });
    }
  };

  const handleMouseMoveWorkspace = (e: React.MouseEvent) => {
    if (draggingTableId && dragCanvasEl) {
      const rect = dragCanvasEl.getBoundingClientRect();
      let newXPct = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
      let newYPct = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;

      // Clamping within room canvas
      newXPct = Math.round(Math.max(6, Math.min(94, newXPct)));
      newYPct = Math.round(Math.max(6, Math.min(94, newYPct)));

      onUpdateLayout({
        ...layout,
        tables: layout.tables.map((t) => (t.id === draggingTableId ? { ...t, x: newXPct, y: newYPct } : t)),
      });
    }
  };

  const handleMouseUpWorkspace = () => {
    if (draggingTableId) {
      setDraggingTableId(null);
      setDragCanvasEl(null);
      pushToHistory(layout.tables);
    }
  };

  // Selected table helper
  const selectedTable = useMemo(() => {
    return layout.tables.find((t) => t.id === selectedTableId);
  }, [layout.tables, selectedTableId]);

  // Selected table's current room
  const selectedTableAreaId = useMemo(() => {
    if (!selectedTable) return '';
    return resolveTableAreaId(selectedTable, effectiveAreas);
  }, [selectedTable, effectiveAreas]);

  // Architectural accents for room canvases
  const renderRoomArchitecturalDetails = (areaId: string) => {
    if (areaId === 'area_bar') {
      return (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-amber-500/6 border-r border-dashed border-amber-300/40 dark:border-amber-700/30 flex items-center justify-center pointer-events-none select-none z-10">
            <span className="text-[9px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40 -rotate-90 uppercase tracking-widest whitespace-nowrap shadow-2xs">
              Bancone Bar
            </span>
          </div>
          <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 pointer-events-none shadow-2xs">
            Zona Lounge Ovest
          </div>
        </>
      );
    }
    if (areaId === 'area_main_a') {
      return (
        <>
          <div className="absolute top-0 left-0 right-0 h-6 bg-sky-500/6 border-b border-dashed border-sky-300/40 dark:border-sky-700/30 flex items-center justify-center pointer-events-none select-none z-10">
            <span className="text-[9px] font-medium text-sky-800 dark:text-sky-300 bg-sky-50/90 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200/60 dark:border-sky-800/40 tracking-wider shadow-2xs">
              Panca Nord (Tavoli 10 - 11 - 12)
            </span>
          </div>
          <div className="absolute left-0 top-7 bottom-7 w-7 bg-blue-500/6 border-r border-dashed border-blue-300/40 dark:border-blue-700/30 flex items-center justify-center pointer-events-none select-none z-10">
            <span className="text-[9px] font-medium text-blue-800 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/40 px-1 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/40 -rotate-90 tracking-wider shadow-2xs">
              Alcova VIP G
            </span>
          </div>
        </>
      );
    }
    if (areaId === 'area_main_b') {
      return (
        <>
          <div className="absolute top-0 left-0 right-0 h-6 bg-purple-500/6 border-b border-dashed border-purple-300/40 dark:border-purple-700/30 flex items-center justify-center pointer-events-none select-none z-10">
            <span className="text-[9px] font-medium text-purple-800 dark:text-purple-300 bg-purple-50/90 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/40 tracking-wider shadow-2xs">
              Ala Est Nord (13 - 14 - 15 - 16)
            </span>
          </div>
          <div className="absolute right-3 bottom-2.5 text-[10px] font-mono text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 pointer-events-none shadow-2xs">
            Corridoio Servizio Est
          </div>
        </>
      );
    }
    if (areaId === 'area_private') {
      return (
        <>
          <div className="absolute inset-0 border border-dashed border-emerald-300/40 dark:border-emerald-700/30 rounded-2xl pointer-events-none" />
          <div className="absolute top-2.5 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-medium text-emerald-800 dark:text-emerald-300 pointer-events-none shadow-2xs">
            <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Perimetro Privé Riservato (Tavoli 30-34)</span>
          </div>
        </>
      );
    }
    return null;
  };

  // Reusable Table Render component
  const renderTableOnCanvas = (table: BohTable, canvasEl: HTMLDivElement | null, scale: number = 1) => {
    const isSelected = table.id === selectedTableId;
    const isMultiSelected = multiSelectedTableIds.includes(table.id);

    return (
      <div
        key={table.id}
        onMouseDown={(e) => handleMouseDownTable(e, table, canvasEl)}
        style={{
          left: `${table.x}%`,
          top: `${table.y}%`,
          transform: `translate(-50%, -50%) rotate(${table.rotation}deg)`,
          width: `${Math.round(table.width * scale)}px`,
          height: `${Math.round(table.height * scale)}px`,
        }}
        className={`absolute flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing z-20 group select-none ${
          table.shape === 'round' ? 'rounded-full' : table.shape === 'booth' ? 'rounded-2xl' : 'rounded-xl'
        } ${
          isSelected
            ? 'ring-2 ring-sky-500/80 shadow-md scale-102 z-30'
            : isMultiSelected
            ? 'ring-2 ring-amber-400/80 shadow-sm z-25'
            : 'shadow-2xs hover:border-slate-400 dark:hover:border-slate-600'
        } ${
          isLight
            ? table.tableType === 'bar'
              ? 'bg-[#FCFAF5] border border-amber-200/80 text-amber-950'
              : table.tableType === 'private'
              ? 'bg-[#F6FAF7] border border-emerald-200/80 text-emerald-950'
              : 'bg-white border border-slate-200/90 text-slate-800'
            : table.tableType === 'bar'
            ? 'bg-[#1C1812] border border-amber-700/50 text-amber-200'
            : table.tableType === 'private'
            ? 'bg-[#0E1A14] border border-emerald-700/50 text-emerald-200'
            : 'bg-[#161D2B] border border-slate-700/70 text-slate-200'
        }`}
      >
        {/* Table Number Identifier */}
        <span className="font-brand font-semibold text-xs leading-none">
          {table.tableNumber}
        </span>

        {/* Capacity */}
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 mt-0.5">
          {table.minPartySize}-{table.maxPartySize}p
        </span>

        {/* Interactive Rotation Button on selected table */}
        {isSelected && (
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              const nextRot = (table.rotation + 45) % 360;
              handleUpdateSelectedTable({ rotation: nextRot });
            }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-white dark:bg-slate-800 hover:bg-sky-50 text-slate-700 dark:text-slate-200 hover:text-sky-600 flex items-center justify-center text-[10px] font-medium shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700 z-40 transition"
            title="Ruota di 45°"
          >
            ↻
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      onMouseMove={handleMouseMoveWorkspace}
      onMouseUp={handleMouseUpWorkspace}
      className="space-y-4"
    >
      {/* 1. TOP TOOLBAR: LAYOUT SELECTOR, VIEW MODE TOGGLE & QUICK ACTIONS */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition-colors flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3.5 shadow-2xs ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        {/* Left: Layout switcher & creation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase tracking-wider ${isLight ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>
              Layout:
            </span>
            <select
              value={layout.id}
              onChange={(e) => onSwitchLayout(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50/80 border-slate-200/80 text-slate-700 focus:border-sky-400'
                  : 'bg-[#171D2B] border-[#273248] text-slate-200 focus:border-sky-400'
              }`}
            >
              {allLayouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.isDefault ? '★ (Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setCopyFromSourceId(layout.id);
              setIsNewLayoutModalOpen(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
              isLight
                ? 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/70 text-slate-600'
                : 'bg-[#171D2B] hover:bg-[#202738] border-[#273248] text-slate-300'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>+ Nuovo / Duplica</span>
          </button>

          {/* Action: Save & Apply Layout Directly to Visual Floor Plan */}
          <button
            onClick={handleSaveAndApplyToFloor}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isAppliedToLiveFloor
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-sky-500 hover:bg-sky-600 text-white'
            }`}
            title="Salva questo layout e applicalo direttamente alla Mappa Sala visiva del ristorante"
          >
            <Check className="w-3.5 h-3.5 stroke-[2]" />
            <span>{isAppliedToLiveFloor ? '✓ Attivo in Mappa Sala' : 'Salva & Assegna a Mappa Sala'}</span>
          </button>

          {onNavigateToFloor && (
            <button
              onClick={onNavigateToFloor}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100/70 hover:bg-slate-200/70 text-slate-600 border-slate-200/70'
                  : 'bg-[#171D2B] hover:bg-[#202738] text-slate-300 border-[#273248]'
              }`}
              title="Apri la schermata Mappa Sala PRERES"
            >
              <Layers className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Vedi Mappa Sala</span>
            </button>
          )}

          {allLayouts.length > 1 && !layout.isDefault && (
            <button
              onClick={() => {
                if (window.confirm(`Sei sicuro di voler eliminare il layout "${layout.name}"?`)) {
                  onDeleteLayout(layout.id);
                }
              }}
              className={`p-1.5 rounded-xl text-xs border transition cursor-pointer text-rose-500 hover:bg-rose-50/70 ${
                isLight ? 'border-slate-200/70 hover:border-rose-200' : 'border-[#273248] hover:bg-rose-950/30'
              }`}
              title="Elimina questo layout"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>

        {/* Center / Right: View Mode Toggle & Undo/Redo & Zoom */}
        <div className="flex flex-wrap items-center gap-2">
          {/* VIEW MODE TOGGLE: SINGLE ROOM FOCUS vs ALL 4 ROOMS SEPARATED */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100/60 border-slate-200/70' : 'bg-[#161C2A] border-[#222A3C]'
          }`}>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer border ${
                viewMode === 'single'
                  ? isLight
                    ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                    : 'bg-[#1E2638] text-slate-100 border-white/10 shadow-2xs font-medium'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Singola Sala (1:1)</span>
            </button>
            <button
              onClick={() => setViewMode('all_separated')}
              className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer border ${
                viewMode === 'all_separated'
                  ? isLight
                    ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                    : 'bg-[#1E2638] text-slate-100 border-white/10 shadow-2xs font-medium'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent font-normal'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent font-normal'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Tutte le 4 Sale</span>
            </button>
          </div>

          {/* Undo / Redo */}
          <div className={`flex items-center gap-0.5 border rounded-xl p-0.5 ${
            isLight ? 'border-slate-200/70 bg-slate-50/50' : 'border-[#222A3C] bg-[#141824]'
          }`}>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-[#1C2333] text-slate-300'
              }`}
              title="Annulla ultima azione (Undo)"
            >
              <Undo2 className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-[#1C2333] text-slate-300'
              }`}
              title="Ripristina azione (Redo)"
            >
              <Redo2 className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </div>

          {/* Zoom controls (for single mode) */}
          {viewMode === 'single' && (
            <div className={`flex items-center gap-0.5 border rounded-xl p-0.5 ${
              isLight ? 'border-slate-200/70 bg-slate-50/50' : 'border-[#222A3C] bg-[#141824]'
            }`}>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-[#1C2333] text-slate-300'
                }`}
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
              <span className={`text-[11px] font-mono px-1 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-[#1C2333] text-slate-300'
                }`}
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. DEDICATED ROOM NAVIGATOR TABS (SEPARATED ROOM SELECTOR) */}
      <div className={`p-2 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${isLight ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>
            Sale:
          </span>

          {effectiveAreas.map((area) => {
            const isCurrentActive = activeDiningAreaId === area.id && viewMode === 'single';
            const roomTables = roomTablesMap[area.id] || [];
            const roomPax = roomTables.reduce((acc, t) => acc + (t.maxPartySize || 0), 0);
            const dims = area.dimensions || { widthMeters: 12, heightMeters: 9 };

            return (
              <button
                key={area.id}
                onClick={() => {
                  setActiveDiningAreaId(area.id);
                  setViewMode('single');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-2 border cursor-pointer ${
                  isCurrentActive
                    ? isLight
                      ? 'bg-sky-50/80 text-sky-800 border-sky-200/80 shadow-2xs font-medium'
                      : 'bg-[#1C2538] text-sky-200 border-sky-800/40 shadow-2xs font-medium'
                    : isLight
                    ? 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/60 text-slate-600 hover:text-slate-800 font-normal'
                    : 'bg-[#161C2A] hover:bg-[#1E2536] border-[#252F43] text-slate-300 hover:text-white font-normal'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                  style={{ backgroundColor: area.color }}
                />
                <span className="font-medium">{area.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isCurrentActive
                    ? isLight
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-sky-950 text-sky-300'
                    : isLight
                    ? 'bg-slate-200/70 text-slate-500'
                    : 'bg-[#1A2234] text-slate-400'
                }`}>
                  {roomTables.length}t · {roomPax}p · {dims.widthMeters}×{dims.heightMeters}m
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick button to view all 4 rooms separated */}
        <button
          onClick={() => setViewMode('all_separated')}
          className={`px-3 py-1.5 rounded-xl text-xs border flex items-center gap-1.5 transition cursor-pointer ${
            viewMode === 'all_separated'
              ? isLight
                ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs font-medium'
                : 'bg-[#1C2538] text-slate-100 border-white/10 shadow-2xs font-medium'
              : isLight
              ? 'bg-slate-50/60 hover:bg-slate-100/80 text-slate-600 border-slate-200/60 font-normal'
              : 'bg-[#161C2A] hover:bg-[#1E2536] text-slate-300 border-[#252F43] font-normal'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Vedi 4 Sale Insieme</span>
        </button>
      </div>

      {/* 3. MAIN WORKSPACE: 3-COLUMN OR MULTI-ROOM STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN (2 Cols): TABLE SHAPE ELEMENT LIBRARY */}
        <div className={`lg:col-span-2 p-3.5 rounded-2xl border space-y-3 shadow-2xs ${
          isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div>
            <h4 className={`text-xs uppercase tracking-wider font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              Libreria Tavoli
            </h4>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Aggiungi in: <strong className="text-sky-600 dark:text-sky-400 font-medium">{activeArea?.title || 'Sala'}</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            {TABLE_SHAPES.map((shapeDef) => {
              const Icon = shapeDef.icon;
              return (
                <button
                  key={shapeDef.shape}
                  onClick={() => handleAddTableElement(shapeDef, activeDiningAreaId)}
                  className={`w-full p-2 rounded-xl border flex items-center gap-2.5 transition text-left cursor-pointer group ${
                    isLight
                      ? 'bg-slate-50/60 hover:bg-sky-50/70 border-slate-200/70 hover:border-sky-200 text-slate-700'
                      : 'bg-[#161C2A] hover:bg-[#1E2638] border-[#242E42] hover:border-sky-500/40 text-slate-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition border ${
                    isLight
                      ? 'bg-white border-slate-200/70 text-slate-500 group-hover:text-sky-600'
                      : 'bg-[#121622] border-[#242E42] text-slate-400 group-hover:text-sky-300'
                  }`}>
                    <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-medium block leading-tight">{shapeDef.label}</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {shapeDef.defaultSeats} posti fisici
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Rooms Summary in Sidebar */}
          <div className={`pt-3 border-t space-y-1.5 ${isLight ? 'border-slate-100' : 'border-[#222A3C]'}`}>
            <span className={`text-[10px] uppercase tracking-wider block ${isLight ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>
              Riepilogo 4 Sale
            </span>
            <div className="space-y-1">
              {effectiveAreas.map((a) => {
                const count = (roomTablesMap[a.id] || []).length;
                const dims = a.dimensions || { widthMeters: 12, heightMeters: 9 };
                const isCur = activeDiningAreaId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setActiveDiningAreaId(a.id);
                      setViewMode('single');
                    }}
                    className={`w-full p-2 rounded-xl border text-xs flex items-center justify-between text-left transition cursor-pointer ${
                      isCur
                        ? isLight
                          ? 'bg-sky-50/80 border-sky-200/80 text-sky-800 font-medium'
                          : 'bg-[#1C2538] border-sky-800/40 text-sky-200 font-medium'
                        : isLight
                        ? 'bg-white/80 hover:bg-slate-50/80 border-slate-200/60 text-slate-600'
                        : 'bg-[#161C2A] hover:bg-[#1E2536] border-[#242E42] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: a.color }} />
                      <span className="truncate">{a.title}</span>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ${
                      isCur ? (isLight ? 'text-sky-700 font-medium' : 'text-sky-300 font-medium') : (isLight ? 'text-slate-400' : 'text-slate-500')
                    }`}>
                      {count}t · {dims.widthMeters}×{dims.heightMeters}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (7 Cols): EITHER FOCUSED SINGLE ROOM OR ALL 4 SEPARATED ROOMS */}
        <div className={`lg:col-span-7 rounded-2xl border p-4 shadow-xs flex flex-col justify-between overflow-hidden relative ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>

          {/* ========================================================================= */}
          {/* VIEW MODE 1: SINGLE ROOM FOCUS EDITOR (NO OVERLAP, ACCURATE METRIC SCALE)  */}
          {/* ========================================================================= */}
          {viewMode === 'single' && activeArea && (
            <div className="flex flex-col h-full space-y-3">
              {/* Header with Title, Real Dimensions editor and metric scale info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/50"
                    style={{ backgroundColor: activeArea.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {activeArea.title}
                      </h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#1D2436] text-slate-300'
                      }`}>
                        {activeArea.locationTag}
                      </span>
                    </div>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {singleRoomVisibleTables.length} tavoli · {singleRoomVisibleTables.reduce((a, b) => a + b.maxPartySize, 0)} posti a sedere totali
                    </p>
                  </div>
                </div>

                {/* Real Scaled Metric Dimensions Resizer for this room */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#171D2B] border-[#273248] text-slate-300'
                  }`}>
                    <Ruler className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="font-semibold">Dimensioni Scala:</span>
                    <input
                      type="number"
                      min="6"
                      max="30"
                      value={activeArea.dimensions?.widthMeters || 12}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 12;
                        handleUpdateRoomDimensions(activeArea.id, val, activeArea.dimensions?.heightMeters || 9);
                      }}
                      className={`w-10 px-1 py-0.5 rounded text-center border font-bold text-xs ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#111624] border-[#313E5C] text-white'
                      }`}
                      title="Larghezza sala in metri"
                    />
                    <span className="font-bold">m</span>
                    <span>×</span>
                    <input
                      type="number"
                      min="5"
                      max="25"
                      value={activeArea.dimensions?.heightMeters || 9}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 9;
                        handleUpdateRoomDimensions(activeArea.id, activeArea.dimensions?.widthMeters || 12, val);
                      }}
                      className={`w-10 px-1 py-0.5 rounded text-center border font-bold text-xs ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#111624] border-[#313E5C] text-white'
                      }`}
                      title="Profondità sala in metri"
                    />
                    <span className="font-bold">m</span>
                    <span className={`text-[10px] pl-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({(activeArea.dimensions?.widthMeters || 12) * (activeArea.dimensions?.heightMeters || 9)} m²)
                    </span>
                  </div>

                  {/* Rotate Active Room Tables */}
                  <div className="flex items-center gap-1 border rounded-xl p-0.5">
                    <button
                      onClick={() => handleRotateActiveRoom('ccw')}
                      className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
                        isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-[#1C2333] text-slate-300'
                      }`}
                      title="Ruota sala 90° antiorario"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRotateActiveRoom('cw')}
                      className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
                        isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-[#1C2333] text-slate-300'
                      }`}
                      title="Ruota sala 90° orario"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scaled Canvas Container */}
              <div className="relative overflow-auto flex-1 min-h-[520px] flex items-center justify-center p-3 bg-slate-50/50 dark:bg-black/25 rounded-2xl">
                <div
                  ref={singleCanvasRef}
                  style={{
                    width: `${(activeArea.dimensions?.widthMeters || 12) * 50 * zoomLevel}px`,
                    height: `${(activeArea.dimensions?.heightMeters || 9) * 50 * zoomLevel}px`,
                    maxWidth: '100%',
                    aspectRatio: `${activeArea.dimensions?.widthMeters || 12} / ${activeArea.dimensions?.heightMeters || 9}`,
                    backgroundImage: isLight
                      ? 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)'
                      : 'radial-gradient(circle, #2d384e 1.2px, transparent 1.2px)',
                    backgroundSize: `${25 * zoomLevel}px ${25 * zoomLevel}px`,
                  }}
                  className="relative border-2 border-dashed border-sky-400/60 dark:border-sky-500/50 rounded-2xl select-none transition-all shadow-inner overflow-hidden cursor-crosshair bg-white/70 dark:bg-[#111726]/80"
                >
                  {/* Top-left metric scale badge */}
                  <div className={`absolute top-2.5 left-3 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold pointer-events-none uppercase tracking-wider z-10 flex items-center gap-1.5 shadow-sm ${
                    isLight
                      ? 'bg-white/95 text-slate-950 border-slate-300'
                      : 'bg-[#182032]/95 text-white border-slate-700'
                  }`}>
                    <span className="font-bold">{activeArea.title}</span>
                    <span>·</span>
                    <span>
                      {(activeArea.dimensions?.widthMeters || 12)}m × {(activeArea.dimensions?.heightMeters || 9)}m (
                      {(activeArea.dimensions?.widthMeters || 12) * (activeArea.dimensions?.heightMeters || 9)} m²)
                    </span>
                  </div>

                  {/* Architectural cues for this specific room */}
                  {renderRoomArchitecturalDetails(activeArea.id)}

                  {/* Render ONLY tables in this room - ZERO OVERLAP! */}
                  {singleRoomVisibleTables.map((table) =>
                    renderTableOnCanvas(table, singleCanvasRef.current, zoomLevel)
                  )}

                  {singleRoomVisibleTables.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-slate-400 pointer-events-none">
                      <LayoutGrid className="w-8 h-8 opacity-40 mb-2" />
                      <p className="text-xs font-semibold">Nessun tavolo in questa sala</p>
                      <p className="text-[11px]">Usa la Libreria a sinistra per posizionare nuovi tavoli</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom bar with room guidance */}
              <div className={`flex items-center justify-between pt-1 text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium'}`}>
                <div className="flex items-center gap-2">
                  <span>Trascina i tavoli per posizionarli all'interno della sala</span>
                  <span>·</span>
                  <span>Fai clic su un tavolo per modificarne i dettagli</span>
                </div>
                <div className="font-mono text-[11px] font-bold">
                  Scala 1:1 · Griglia a maglie metriche
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: ALL 4 SEPARATED ROOMS (MULTI-ROOM ARCHITECTURAL GRID)       */}
          {/* ========================================================================= */}
          {viewMode === 'all_separated' && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-sky-500" />
                    <span>Visuale a 4 Sale Separate (Nessuna Sovrapposizione)</span>
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Ciascuna sala è mostrata in scala reale separata. Clicca su una sala per modificarla singolarmente.
                  </p>
                </div>
              </div>

              {/* 2x2 Grid of Separated Rooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto max-h-[640px] p-1">
                {effectiveAreas.map((area) => {
                  const roomTables = roomTablesMap[area.id] || [];
                  const dims = area.dimensions || { widthMeters: 12, heightMeters: 9 };
                  const roomPax = roomTables.reduce((acc, t) => acc + (t.maxPartySize || 0), 0);
                  const isCurrentSelected = activeDiningAreaId === area.id;

                  return (
                    <div
                      key={area.id}
                      className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                        isCurrentSelected
                          ? isLight
                            ? 'bg-white border-sky-400 shadow-md ring-2 ring-sky-400/20'
                            : 'bg-[#151C2C] border-[#8B31E0] shadow-md ring-2 ring-[#8B31E0]/20'
                          : isLight
                          ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          : 'bg-[#131826] border-[#222B3D] hover:border-[#2C374D]'
                      }`}
                    >
                      {/* Room Card Header */}
                      <div className={`flex items-center justify-between pb-2 mb-2 border-b ${
                        isLight ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/20"
                            style={{ backgroundColor: area.color }}
                          />
                          <span className={`font-bold text-xs truncate ${isLight ? 'text-slate-950 font-bold' : 'text-white font-bold'}`}>
                            {area.title}
                          </span>
                          <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            ({dims.widthMeters}×{dims.heightMeters}m · {dims.widthMeters * dims.heightMeters}m²)
                          </span>
                        </div>

                        {/* Focus Room CTA */}
                        <button
                          onClick={() => {
                            setActiveDiningAreaId(area.id);
                            setViewMode('single');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition flex items-center gap-1 cursor-pointer ${
                            isLight
                              ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200/80 shadow-2xs'
                              : 'bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border-sky-800/40 shadow-2xs'
                          }`}
                          title="Focalizza ed ingrandisci questa sala"
                        >
                          <Maximize2 className="w-2.5 h-2.5" />
                          <span>Modifica Singola</span>
                        </button>
                      </div>

                      {/* Dedicated Scaled Canvas for this Room */}
                      <div className="relative w-full aspect-[4/3] bg-white dark:bg-[#0E131F] rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-inner flex items-center justify-center p-2">
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            aspectRatio: `${dims.widthMeters} / ${dims.heightMeters}`,
                            backgroundImage: isLight
                              ? 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)'
                              : 'radial-gradient(circle, #2a3449 1px, transparent 1px)',
                            backgroundSize: '16px 16px',
                          }}
                          className="relative border border-dashed border-sky-400/40 rounded-lg overflow-hidden select-none"
                        >
                          {/* Architectural cue */}
                          {renderRoomArchitecturalDetails(area.id)}

                          {/* Render this room's tables ONLY */}
                          {roomTables.map((table) => renderTableOnCanvas(table, null, 0.85))}
                        </div>
                      </div>

                      {/* Room Card Footer */}
                      <div className={`flex items-center justify-between pt-2 mt-2 text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        <span>{roomTables.length} tavoli · {roomPax} pax totali</span>
                        <button
                          onClick={() => handleAddTableElement(TABLE_SHAPES[0], area.id)}
                          className={`font-bold flex items-center gap-1 ${isLight ? 'text-sky-700 hover:text-sky-900' : 'text-sky-300 hover:text-white'}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tavolo</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (3 Cols): TABLE DETAILS PANEL (SIDE DRAWER) */}
        <div className={`lg:col-span-3 p-4 rounded-2xl border space-y-3.5 shadow-2xs ${
          isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          {selectedTable ? (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl font-brand font-medium flex items-center justify-center text-xs border ${
                    isLight ? 'bg-sky-50 text-sky-800 border-sky-200/80 shadow-2xs' : 'bg-sky-950/40 text-sky-200 border-sky-800/40 shadow-2xs'
                  }`}>
                    {selectedTable.tableNumber}
                  </div>
                  <div>
                    <h4 className={`text-xs uppercase tracking-wider font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Pannello Tavolo</h4>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      ID: {selectedTable.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateTable(selectedTable.id)}
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70' : 'bg-[#1A2234] hover:bg-[#222E44] text-slate-300 border-[#26334A]'
                    }`}
                    title="Duplica tavolo"
                  >
                    <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(selectedTable.id)}
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 transition cursor-pointer"
                    title="Elimina tavolo"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>
              </div>

              {/* Table Name & Number */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[10px] uppercase tracking-wider block mb-1 font-medium ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Numero Tavolo
                  </label>
                  <input
                    type="text"
                    value={selectedTable.tableNumber}
                    onChange={(e) => handleUpdateSelectedTable({ tableNumber: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-medium ${
                      isLight ? 'bg-slate-50/60 border-slate-200/80 text-slate-700 focus:border-sky-400 focus:bg-white' : 'bg-[#161C2A] border-[#242E42] text-slate-200 focus:border-sky-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider block mb-1 font-medium ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Nome Interno
                  </label>
                  <input
                    type="text"
                    value={selectedTable.name}
                    onChange={(e) => handleUpdateSelectedTable({ name: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-medium ${
                      isLight ? 'bg-slate-50/60 border-slate-200/80 text-slate-700 focus:border-sky-400 focus:bg-white' : 'bg-[#161C2A] border-[#242E42] text-slate-200 focus:border-sky-400'
                    }`}
                  />
                </div>
              </div>

              {/* Dining Room Assignment (Switch Room) */}
              <div>
                <label className={`text-[10px] uppercase tracking-wider block mb-1 font-medium ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Sala Assegnata
                </label>
                <select
                  value={selectedTableAreaId}
                  onChange={(e) => {
                    const newAreaId = e.target.value;
                    handleUpdateSelectedTable({ diningAreaId: newAreaId });
                  }}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${
                    isLight ? 'bg-slate-50/60 border-slate-200/80 text-slate-700 focus:border-sky-400' : 'bg-[#161C2A] border-[#242E42] text-slate-200 focus:border-sky-400'
                  }`}
                >
                  {effectiveAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.title} ({area.locationTag})
                    </option>
                  ))}
                </select>
              </div>

              {/* Min & Independent Max Party Sizes */}
              <div className={`p-3 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50/60 border-slate-200/70' : 'bg-[#161C2A] border-[#242E42]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Capienza
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isLight ? 'bg-sky-50 text-sky-700 border border-sky-200/70 font-medium' : 'bg-sky-950/40 text-sky-300 border border-sky-800/40 font-medium'}`}>
                    Fisici: {selectedTable.physicalSeats} posti
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Min Pax</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedTable.maxPartySize}
                      value={selectedTable.minPartySize}
                      onChange={(e) => handleUpdateSelectedTable({ minPartySize: parseInt(e.target.value, 10) || 1 })}
                      className={`w-full px-2 py-1 rounded-lg border text-xs font-medium text-center ${
                        isLight ? 'bg-white border-slate-200/80 text-slate-700' : 'bg-[#111726] border-[#222A3C] text-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Max Pax</label>
                    <input
                      type="number"
                      min={selectedTable.minPartySize}
                      max="20"
                      value={selectedTable.maxPartySize}
                      onChange={(e) => handleUpdateSelectedTable({ maxPartySize: parseInt(e.target.value, 10) || 2 })}
                      className={`w-full px-2 py-1 rounded-lg border text-xs font-medium text-center ${
                        isLight ? 'bg-white border-slate-200/80 text-slate-700' : 'bg-[#111726] border-[#222A3C] text-slate-200'
                      }`}
                    />
                  </div>
                </div>
                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  *Min e Max regolano l'accettazione online indipendente dai posti fisici.
                </p>
              </div>

              {/* Table Type Categorization */}
              <div>
                <label className={`text-[10px] uppercase tracking-wider block mb-1 font-medium ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Categoria Tavolo
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'regular' as const, label: 'Standard / Sala' },
                    { id: 'outdoor' as const, label: 'Dehor / Esterno' },
                    { id: 'bar' as const, label: 'Bar & Lounge' },
                    { id: 'private' as const, label: 'Privé Riservato' },
                    { id: 'high_top' as const, label: 'Tavolo Alto' },
                  ].map((typ) => (
                    <button
                      key={typ.id}
                      onClick={() => handleUpdateSelectedTable({ tableType: typ.id })}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] transition cursor-pointer text-left truncate ${
                        selectedTable.tableType === typ.id
                          ? isLight
                            ? 'bg-sky-50 text-sky-800 border-sky-200/80 shadow-2xs font-medium'
                            : 'bg-sky-950/40 text-sky-200 border-sky-800/50 shadow-2xs font-medium'
                          : isLight
                          ? 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-slate-50/80 font-normal'
                          : 'bg-[#161C2A] border-[#242E42] text-slate-400 hover:text-slate-200 font-normal'
                      }`}
                    >
                      {typ.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotation & Quick Orientation */}
              <div className={`pt-2 border-t flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={`text-[10px] uppercase ${isLight ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>Rotazione:</span>
                <div className="flex items-center gap-1">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => handleUpdateSelectedTable({ rotation: deg })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border cursor-pointer ${
                        selectedTable.rotation === deg
                          ? isLight
                            ? 'bg-sky-50 text-sky-800 border-sky-200/80 font-medium'
                            : 'bg-sky-950/40 text-sky-200 border-sky-800/40 font-medium'
                          : isLight
                          ? 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100/70'
                          : 'bg-[#161C2A] text-slate-400 border-[#242E42] hover:bg-[#1E2536]'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
              <Move className="w-7 h-7 stroke-[1.25] text-slate-300 dark:text-slate-600" />
              <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Nessun tavolo selezionato</p>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Clicca su un tavolo nella sala per modificarne numero, capienza slegata, sala assegnata o orientamento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NEW / DUPLICATE FLOOR PLAN */}
      {isNewLayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl border max-w-md w-full shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#273248] text-white'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-sky-500" />
                <span>Crea Nuovo Floor Plan</span>
              </h3>
              <button
                onClick={() => setIsNewLayoutModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Nome Layout</label>
                <input
                  type="text"
                  placeholder="Es. Disposizione Evento Speciale, Configurazione Weekend..."
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                      : 'bg-[#182030] border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Copia Tavoli Da (Opzionale)</label>
                <select
                  value={copyFromSourceId}
                  onChange={(e) => setCopyFromSourceId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-950'
                      : 'bg-[#182030] border-slate-700 text-white'
                  }`}
                >
                  <option value="">Inizia da foglio vuoto</option>
                  {allLayouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      Copia da: {l.name} ({l.tables.length} tavoli)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsNewLayoutModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (newLayoutName.trim()) {
                    onCreateNewLayout(newLayoutName.trim(), copyFromSourceId || undefined);
                    setIsNewLayoutModalOpen(false);
                    setNewLayoutName('');
                  }
                }}
                disabled={!newLayoutName.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold disabled:opacity-50"
              >
                Crea Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

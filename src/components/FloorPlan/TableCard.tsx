import React from 'react';
import { RestaurantTable, TableGroup } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { computeTableInstantStatus } from '../../utils/bookingEngine';
import { Users, Edit2, CheckCircle2, UserCheck, AlertTriangle, Eye } from 'lucide-react';

interface TableCardProps {
  table: RestaurantTable;
  group?: TableGroup;
  onSelectTableForDetails: (tableId: string) => void;
  customWidthClass?: string;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  group,
  onSelectTableForDetails,
}) => {
  const {
    selectedDate,
    selectedTime,
    reservations,
    settings,
    selectedTableIds,
    toggleTableSelection,
    seatReservation,
    freeTable,
    updateTableCapacity,
    isLayoutEditMode,
  } = useRestaurant();

  const isSelected = selectedTableIds.includes(table.id);
  const liveStatus = computeTableInstantStatus(
    table.id,
    selectedDate,
    selectedTime,
    reservations,
    settings
  );

  const effectiveCapacity = group
    ? group.totalCapacity
    : table.capacityOverride || table.capacity;

  const displayName = group ? group.combinedName : table.tableNumber;

  const isLeaderOfGroup = group ? group.memberTableIds[0] === table.id : true;
  if (group && !isLeaderOfGroup) {
    return null;
  }

  const handleEditCapacity = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectTableForDetails(table.id);
  };

  // Dimensions based on shape and table
  let sizeStyle = 'w-24 h-24';
  if (['32', '23', '22', '15', '13', '11', '10', 'B1', 'B2', 'B3'].includes(table.id)) {
    sizeStyle = 'w-20 h-28';
  } else if (table.id === 'G') {
    sizeStyle = 'w-22 h-32';
  } else if (table.id === 'B4') {
    sizeStyle = 'w-36 h-22';
  } else if (['34', '33', '16', '14', '12', '21', '20', '31', '30'].includes(table.id)) {
    sizeStyle = 'w-26 h-24';
  }

  if (group) {
    sizeStyle = 'w-52 h-28';
  }

  // Bespoke aesthetic styling (Warm, elegant Italian bistro theme)
  let cardBg = 'bg-white border-[#1E3A2F]/25 text-[#1E3A2F] hover:border-[#6B3FA0] hover:shadow-md';
  let badgeEl = (
    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center justify-center gap-1 border border-emerald-200/60">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle"></span>
      Libero
    </span>
  );

  if (isSelected) {
    cardBg = 'bg-[#6B3FA0]/15 border-2 border-[#6B3FA0] ring-3 ring-[#6B3FA0]/25 shadow-lg text-[#1E3A2F] scale-105';
  } else if (liveStatus.status === 'seated' || liveStatus.status === 'warning' || liveStatus.status === 'expired') {
    const res = liveStatus.currentReservation;
    const elapsed = liveStatus.elapsedMinutes || 0;
    const isWarning = liveStatus.status === 'warning';
    const isExpired = liveStatus.status === 'expired';

    cardBg = isExpired
      ? 'bg-rose-50/95 border-2 border-rose-500 shadow-md animate-pulse-subtle'
      : isWarning
      ? 'bg-amber-50/95 border-2 border-amber-500 shadow-md'
      : 'bg-emerald-50/90 border-2 border-emerald-600 shadow-md';

    badgeEl = (
      <div className="flex flex-col items-center gap-0.5 w-full">
        <div className="flex items-center justify-between w-full text-[10px] font-bold">
          <span className="truncate max-w-[85px] text-[#1E3A2F]">
            {res?.guestName.split(' ')[0]}
          </span>
          <span
            className={`font-mono-num font-bold px-1.5 py-0.2 rounded text-[9px] ${
              isExpired
                ? 'bg-rose-600 text-white'
                : isWarning
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-700 text-white'
            }`}
          >
            ⏱️ {elapsed}m
          </span>
        </div>
        {/* Turn Progress Gauge */}
        <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden mt-0.5">
          <div
            className={`h-full transition-all ${
              isExpired ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
            }`}
            style={{ width: `${Math.min(100, liveStatus.occupancyPercent || 0)}%` }}
          />
        </div>
      </div>
    );
  } else if (liveStatus.status === 'reserved') {
    const res = liveStatus.currentReservation;
    cardBg = 'bg-[#6B3FA0]/10 border-2 border-[#6B3FA0] shadow-sm';
    badgeEl = (
      <div className="flex flex-col items-center gap-0.5 w-full">
        <span className="text-[10px] font-bold text-[#6B3FA0] truncate max-w-full">
          {res?.startTime} · {res?.guestName.split(' ')[0]}
        </span>
        <span className="text-[9px] text-[#6B3FA0]/80 font-medium">
          {res?.partySize} persone
        </span>
      </div>
    );
  } else if (group) {
    cardBg = 'bg-amber-50/90 border-2 border-amber-600 shadow-md';
  }

  return (
    <div className="relative group select-none m-2.5 shrink-0">
      {/* Table Card Body - Single Click opens Details Modal */}
      <div
        onClick={() => {
          if (isLayoutEditMode) return;
          onSelectTableForDetails(table.id);
        }}
        className={`${cardBg} ${sizeStyle} rounded-2xl p-2 cursor-pointer transition-all duration-150 flex flex-col justify-between items-center text-center shadow-xs border relative hover:shadow-lg active:scale-95`}
      >
        {/* Top Capacity & Quick Edit Pill */}
        <div className="absolute -top-2.5 bg-[#1E3A2F] text-amber-100 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-[#1E3A2F] shadow-xs flex items-center gap-1 z-10">
          <Users className="w-2.5 h-2.5" />
          <span className="font-mono-num">{effectiveCapacity} px</span>
          <button
            onClick={handleEditCapacity}
            className="text-amber-300 hover:text-white p-0.5 ml-0.5 hover:bg-white/10 rounded transition"
            title="Modifica capienza"
          >
            <Edit2 className="w-2 h-2" />
          </button>
        </div>

        {/* Table Number Identifier */}
        <div className="mt-1">
          <span className="font-brand font-bold text-xs md:text-sm tracking-wide text-[#1E3A2F]">
            {displayName}
          </span>
        </div>

        {/* State Badge */}
        <div className="w-full my-0.5">{badgeEl}</div>

        {/* Bottom Quick Action bar */}
        <div className="w-full flex items-center justify-center gap-1 pt-0.5 border-t border-[#1E3A2F]/10">
          {liveStatus.status === 'reserved' && liveStatus.currentReservation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                seatReservation(liveStatus.currentReservation!.id);
              }}
              className="w-full py-0.5 bg-[#6B3FA0] hover:bg-[#5A338A] text-white text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
              title="Fai sedere gli ospiti"
            >
              <UserCheck className="w-2.5 h-2.5" />
              <span>Siedi</span>
            </button>
          )}

          {(liveStatus.status === 'seated' || liveStatus.status === 'warning' || liveStatus.status === 'expired') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                freeTable(table.id);
              }}
              className="w-full py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
              title="Libera tavolo"
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Libera</span>
            </button>
          )}

          {liveStatus.status === 'free' && (
            <span className="text-[9px] text-[#1E3A2F]/60 font-medium flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5" />
              <span>Dettagli</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

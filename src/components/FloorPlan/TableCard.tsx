import React from 'react';
import { RestaurantTable, TableGroup } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { computeTableInstantStatus } from '../../utils/bookingEngine';
import { Users, CheckCircle2, UserCheck } from 'lucide-react';

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
    seatReservation,
    freeTable,
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

  // Rectangular Dimensions: 2 pax compact, 4 pax double width, 6+ pax extended
  let sizeStyle = 'w-22 h-18';
  if (effectiveCapacity <= 2) {
    sizeStyle = 'w-20 sm:w-22 h-18';
  } else if (effectiveCapacity === 4) {
    sizeStyle = 'w-38 sm:w-42 h-18';
  } else {
    sizeStyle = 'w-54 sm:w-58 h-20';
  }

  if (table.id === 'G') {
    sizeStyle = 'w-40 sm:w-44 h-20';
  }

  // Refined Twilight Slate Styling
  let cardBg = 'bg-[#151A26] border-[#252E42] text-slate-100 hover:border-[#8B31E0]/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]';
  let badgeEl = (
    <span className="text-[9px] font-medium text-[#34D399] flex items-center justify-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
      Libero
    </span>
  );

  if (table.isBlocked) {
    cardBg = 'bg-[#0E121B] border border-dashed border-[#37425B] text-slate-400 opacity-75';
    badgeEl = (
      <span className="text-[9px] font-semibold text-slate-300 flex items-center justify-center gap-1">
        🔒 {table.blockedReason || 'Bloccato'}
      </span>
    );
  } else if (isSelected) {
    cardBg = 'bg-[#8B31E0]/20 border border-[#8B31E0] ring-2 ring-[#8B31E0]/30 text-white shadow-[0_0_20px_rgba(139,49,224,0.4)] scale-105';
  } else if (liveStatus.status === 'seated' || liveStatus.status === 'warning' || liveStatus.status === 'expired') {
    const res = liveStatus.currentReservation;
    const elapsed = liveStatus.elapsedMinutes || 0;
    const isWarning = liveStatus.status === 'warning';
    const isExpired = liveStatus.status === 'expired';

    cardBg = isExpired
      ? 'bg-[#E11D48]/15 border border-[#E11D48]/70 shadow-[0_0_16px_rgba(225,29,72,0.25)] text-white animate-pulse'
      : isWarning
      ? 'bg-amber-950/30 border border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.2)] text-white'
      : 'bg-[#059669]/15 border border-[#059669]/60 shadow-[0_0_16px_rgba(5,150,105,0.2)] text-white';

    badgeEl = (
      <div className="flex flex-col items-center leading-none">
        <span className="font-semibold text-[10px] text-white truncate max-w-[125px]">
          {res?.guestName || 'Seduto'}
        </span>
        <span
          className={`text-[9px] font-mono font-bold mt-0.5 ${
            isExpired ? 'text-rose-400' : isWarning ? 'text-amber-300' : 'text-[#34D399]'
          }`}
        >
          ⏱️ {elapsed}m ({res?.partySize} px)
        </span>
      </div>
    );
  } else if (liveStatus.status === 'reserved') {
    const res = liveStatus.currentReservation;
    cardBg = 'bg-[#8B31E0]/15 border border-[#8B31E0]/60 shadow-[0_0_15px_rgba(139,49,224,0.2)] text-slate-100';
    badgeEl = (
      <div className="flex flex-col items-center leading-none">
        <span className="font-semibold text-[10px] text-[#C084FC] truncate max-w-[125px]">
          {res?.guestName}
        </span>
        <span className="text-[9px] text-[#D8B4FE] font-medium font-mono">
          {res?.startTime} · {res?.partySize} px
        </span>
      </div>
    );
  }

  return (
    <div className="relative group select-none m-1.5 shrink-0">
      {/* Rectangular Table Body */}
      <div
        onClick={() => {
          if (isLayoutEditMode) return;
          onSelectTableForDetails(table.id);
        }}
        className={`${cardBg} ${sizeStyle} rounded-2xl p-1.5 cursor-pointer transition-all duration-150 flex flex-col justify-between items-center text-center shadow-md border relative active:scale-95`}
      >
        {/* Top Capacity Pill */}
        <div className="absolute -top-2 bg-[#0E121B] text-[#C084FC] text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-[#273044] shadow-xs flex items-center gap-0.5 z-10 font-mono">
          <Users className="w-2.5 h-2.5 stroke-[1.5]" />
          <span>{effectiveCapacity}</span>
        </div>

        {/* Table Number Identifier */}
        <div className="mt-0.5 flex items-center justify-center gap-1">
          <span className="font-brand font-bold text-xs md:text-sm tracking-wide text-white">
            {displayName}
          </span>
          {liveStatus.currentReservation?.tags?.some((t) => t.toLowerCase().includes('vip')) && (
            <span className="text-[9px] text-amber-400" title="Ospite VIP">⭐</span>
          )}
          {liveStatus.currentReservation?.tags?.some((t) => t.toLowerCase().includes('glut') || t.toLowerCase().includes('allerg')) && (
            <span className="text-[9px] text-rose-400" title="Allergie">⚠️</span>
          )}
        </div>

        {/* State Badge */}
        <div className="w-full my-0.5">{badgeEl}</div>

        {/* Bottom Action strip */}
        <div className="w-full flex items-center justify-center gap-1 pt-0.5 border-t border-white/5">
          {liveStatus.status === 'reserved' && liveStatus.currentReservation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                seatReservation(liveStatus.currentReservation!.id);
              }}
              className="w-full py-0.5 bg-[#8B31E0] hover:bg-[#7928CA] text-white text-[8px] font-semibold rounded-lg transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <UserCheck className="w-2.5 h-2.5 stroke-[1.5]" />
              <span>Siedi</span>
            </button>
          )}

          {(liveStatus.status === 'seated' || liveStatus.status === 'warning' || liveStatus.status === 'expired') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                freeTable(table.id);
              }}
              className="w-full py-0.5 bg-[#059669] hover:bg-[#047857] text-white text-[8px] font-semibold rounded-lg transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-2.5 h-2.5 stroke-[1.5]" />
              <span>Libera</span>
            </button>
          )}

          {liveStatus.status === 'free' && (
            <span className="text-[7px] text-slate-500 uppercase tracking-widest font-semibold">
              Disponibile
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

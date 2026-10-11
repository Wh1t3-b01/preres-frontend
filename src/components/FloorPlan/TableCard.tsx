import React from 'react';
import { RestaurantTable, TableGroup } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { computeTableInstantStatus } from '../../utils/bookingEngine';
import { getTableSeatConfiguration, SeatPositionDetail } from '../../utils/tableSeatLayout';
import {
  Users,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

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
    theme,
  } = useRestaurant();

  const isLight = theme === 'light';
  const isSelected = selectedTableIds.includes(table.id);
  const liveStatus = computeTableInstantStatus(
    table.id,
    selectedDate,
    selectedTime,
    reservations,
    settings
  );

  const rawCapacity = table.id === 'G' ? 2 : (table.capacityOverride || table.capacity);
  const effectiveCapacity = group ? group.totalCapacity : rawCapacity;
  const displayName = group ? group.combinedName : table.tableNumber;

  const isLeaderOfGroup = group ? group.memberTableIds[0] === table.id : true;
  if (group && !isLeaderOfGroup) {
    return null;
  }

  // Get seat configuration and waiter perspective from registry
  const seatConfig = getTableSeatConfiguration(table.id, effectiveCapacity);
  const isHorizontal = table.shape === 'rect-h';

  // Table Surface Dimensions matching physical orientation (rect-h vs rect-v)
  let tableDimensions = 'w-22 sm:w-24 h-26 sm:h-28'; // 2 pax vertical default
  if (isHorizontal) {
    tableDimensions = 'w-38 sm:w-44 h-20 sm:h-22'; // 4 pax horizontal (e.g. 31, 32, 12, 14, 16)
  } else if (effectiveCapacity >= 4) {
    tableDimensions = 'w-24 sm:w-28 h-32 sm:h-36'; // 4 pax vertical (e.g. 33, 34, 20, 21)
  }

  if (table.id === 'G') {
    tableDimensions = 'w-24 sm:w-26 h-28 sm:h-30';
  }

  // Card Background & Border according to live status & theme - Soft, Light, Low Contrast
  let cardBg = isLight
    ? 'bg-white/95 border-slate-200/80 text-slate-800 shadow-2xs hover:border-sky-300 hover:shadow-xs'
    : 'bg-[#141A28] border-[#222A3C] text-slate-200 hover:border-sky-500/50 hover:shadow-xs';
  
  let badgeEl = (
    <span className={`text-[9px] font-medium flex items-center justify-center gap-1.5 ${
      isLight ? 'text-emerald-700' : 'text-emerald-300'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      Libero
    </span>
  );

  if (table.isBlocked) {
    cardBg = isLight
      ? 'bg-slate-50/80 border border-dashed border-slate-200 text-slate-400 opacity-80'
      : 'bg-[#0E121B] border border-dashed border-[#283248] text-slate-400 opacity-75';
    badgeEl = (
      <span className={`text-[9px] font-medium flex items-center justify-center gap-1 ${
        isLight ? 'text-slate-600' : 'text-slate-300'
      }`}>
        🔒 {table.blockedReason || 'Bloccato'}
      </span>
    );
  } else if (isSelected) {
    cardBg = isLight
      ? 'bg-sky-50/80 border border-sky-400 ring-2 ring-sky-200/60 text-slate-800 shadow-xs'
      : 'bg-sky-950/30 border border-sky-500/70 ring-2 ring-sky-500/30 text-white shadow-xs';
  } else if (
    liveStatus.status === 'seated' ||
    liveStatus.status === 'warning' ||
    liveStatus.status === 'expired'
  ) {
    const res = liveStatus.currentReservation;
    const elapsed = liveStatus.elapsedMinutes || 0;
    const isWarning = liveStatus.status === 'warning';
    const isExpired = liveStatus.status === 'expired';

    cardBg = isExpired
      ? isLight
        ? 'bg-rose-50/70 border border-rose-200 text-slate-800 shadow-2xs'
        : 'bg-rose-950/20 border border-rose-800/40 text-rose-100'
      : isWarning
      ? isLight
        ? 'bg-amber-50/70 border border-amber-200 text-slate-800 shadow-2xs'
        : 'bg-amber-950/20 border border-amber-800/40 text-amber-100'
      : isLight
      ? 'bg-emerald-50/70 border border-emerald-200 text-slate-800 shadow-2xs'
      : 'bg-emerald-950/20 border border-emerald-800/40 text-emerald-100';

    badgeEl = (
      <div className="flex flex-col items-center leading-tight">
        <span className={`font-semibold text-[10px] truncate max-w-[110px] ${
          isLight ? 'text-slate-800' : 'text-slate-100'
        }`}>
          {res?.guestName || 'Seduto'}
        </span>
        <span
          className={`text-[9px] font-mono mt-0.5 ${
            isExpired
              ? isLight ? 'text-rose-600' : 'text-rose-300'
              : isWarning
              ? isLight ? 'text-amber-600' : 'text-amber-300'
              : isLight ? 'text-emerald-600' : 'text-emerald-300'
          }`}
        >
          ⏱️ {elapsed}m ({res?.partySize} px)
        </span>
      </div>
    );
  } else if (liveStatus.status === 'reserved') {
    const res = liveStatus.currentReservation;
    cardBg = isLight
      ? 'bg-sky-50/70 border border-sky-200 text-slate-800 shadow-2xs'
      : 'bg-sky-950/20 border border-sky-800/40 text-sky-100';
    badgeEl = (
      <div className="flex flex-col items-center leading-tight">
        <span className={`font-semibold text-[10px] truncate max-w-[110px] ${
          isLight ? 'text-slate-800' : 'text-slate-100'
        }`}>
          {res?.guestName}
        </span>
        <span className={`text-[9px] font-mono ${
          isLight ? 'text-sky-600' : 'text-sky-300'
        }`}>
          {res?.startTime} · {res?.partySize} px
        </span>
      </div>
    );
  }

  // Filter and arrange chairs so opposite seats face each other:
  // 1 is near waiter (left), 2 is further along (right).
  // 3 is directly opposite 2 (far right), and 4 is directly opposite 1 (near left)!
  const topSeats = seatConfig.seats
    .filter((s) => s.side === 'top' || s.side === 'bench')
    .sort((a, b) => a.seatNumber - b.seatNumber);

  const bottomSeats = seatConfig.seats
    .filter((s) => s.side === 'bottom' || s.side === 'opposite')
    .sort((a, b) => b.seatNumber - a.seatNumber);

  const leftSeats = seatConfig.seats
    .filter((s) => s.side === 'left')
    .sort((a, b) => a.seatNumber - b.seatNumber);

  const rightSeats = seatConfig.seats
    .filter((s) => s.side === 'right')
    .sort((a, b) => b.seatNumber - a.seatNumber);

  // Check if top has a bench (like tables 10, 11, 12 in Main A)
  const hasBench = topSeats.some((s) => s.isOnBench);

  // Render individual chair component
  const renderChair = (seat: SeatPositionDetail, orientation: 'h' | 'v') => {
    const isSeated = liveStatus.status === 'seated';
    const isReserved = liveStatus.status === 'reserved';

    let chairBg = isLight
      ? isSeated
        ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
        : isReserved
        ? 'bg-sky-100 border-sky-300 text-sky-800'
        : 'bg-white border-slate-300 text-slate-700 hover:border-sky-500 hover:text-sky-700 shadow-2xs'
      : isSeated
      ? 'bg-[#1D273B] border-emerald-500/60 text-emerald-300'
      : 'bg-[#182030] border-[#303B52] text-slate-300 hover:border-sky-400 hover:text-white';

    return (
      <div
        key={seat.seatNumber}
        title={`${seat.label} - ${seat.locationDescription}`}
        className={`group/chair flex items-center justify-center transition-all ${
          orientation === 'h' ? 'w-5 h-4.5 sm:w-6 sm:h-5' : 'w-4.5 h-5 sm:w-5 sm:h-6'
        }`}
      >
        <div
          className={`relative rounded-md border text-[8px] font-mono font-bold flex items-center justify-center shadow-xs transition ${chairBg} ${
            orientation === 'h' ? 'w-full h-3.5 sm:h-4' : 'w-3.5 sm:w-4 h-full'
          }`}
        >
          {seat.seatNumber}
        </div>
      </div>
    );
  };

  return (
    <div className="relative group select-none m-2 shrink-0">
      {/* TOP SEATS / BENCH (PANCA A MURO O SEDIE SUPERIORI) */}
      {topSeats.length > 0 && (
        <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-10 w-full px-1">
          {hasBench ? (
            /* Continuous Bench (Panca a Muro Nord in Main A: 10, 11, 12) */
            <div className={`w-full flex items-center justify-center border rounded-t-lg py-0.5 px-1 shadow-2xs ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-gradient-to-r from-[#2A354C] via-[#323E59] to-[#2A354C] border-[#445374] text-sky-200'
            }`}>
              <span className={`text-[7px] uppercase font-bold font-mono tracking-wider mr-1 ${
                isLight ? 'text-slate-500' : 'text-sky-300'
              }`}>
                Panca
              </span>
              <div className="flex items-center gap-2">
                {topSeats.map((seat) => (
                  <span
                    key={seat.seatNumber}
                    title={seat.label}
                    className={`w-4 h-3 rounded border text-[7px] font-mono font-bold flex items-center justify-center shadow-2xs ${
                      isLight
                        ? 'bg-white text-slate-800 border-slate-300'
                        : 'bg-[#1D273B] text-sky-200 border-sky-400/40'
                    }`}
                  >
                    {seat.seatNumber}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* Individual Single Chairs along Top Edge */
            topSeats.map((seat) => renderChair(seat, 'h'))
          )}
        </div>
      )}

      {/* LEFT FLANK SEATS (Fianco Sinistro - e.g. 33, 34, 20, 21) */}
      {leftSeats.length > 0 && (
        <div className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-2 z-10 h-full py-1">
          {leftSeats.map((seat) => renderChair(seat, 'v'))}
        </div>
      )}

      {/* RIGHT FLANK SEATS (Fianco Destro - e.g. 33, 34, 20, 21) */}
      {rightSeats.length > 0 && (
        <div className="absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-2 z-10 h-full py-1">
          {rightSeats.map((seat) => renderChair(seat, 'v'))}
        </div>
      )}

      {/* BOTTOM SEATS (Sedie Inferiori o Fronte Panca) */}
      {bottomSeats.length > 0 && (
        <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-10 w-full px-1">
          {bottomSeats.map((seat) => renderChair(seat, 'h'))}
        </div>
      )}

      {/* MAIN TABLE SURFACE BODY */}
      <div
        onClick={() => {
          if (isLayoutEditMode) return;
          onSelectTableForDetails(table.id);
        }}
        className={`${cardBg} ${tableDimensions} rounded-2xl p-1.5 cursor-pointer transition-all duration-150 flex flex-col justify-between items-center text-center shadow-md border relative active:scale-95`}
      >
        {/* Top Capacity Pill - Soft, Low Contrast, Thin Line */}
        <div className={`absolute -top-2 text-[9px] font-medium px-2 py-0.5 rounded-full border shadow-2xs flex items-center gap-1 z-10 font-mono transition-colors ${
          isLight
            ? 'bg-slate-100/90 text-slate-600 border-slate-200/80'
            : 'bg-[#1C2335] text-slate-300 border-[#2A354C]'
        }`}>
          <Users className="w-2.5 h-2.5 stroke-[1.5]" />
          <span>{effectiveCapacity}p</span>
        </div>

        {/* Table Number Identifier */}
        <div className="mt-0.5 flex items-center justify-center gap-1">
          <span className={`font-brand text-xs sm:text-sm tracking-wide font-medium ${
            isLight ? 'text-slate-700' : 'text-slate-200'
          }`}>
            {displayName}
          </span>
          {liveStatus.currentReservation?.tags?.some((t) =>
            t.toLowerCase().includes('vip')
          ) && (
            <span className="text-[9px] text-amber-500" title="Ospite VIP">
              ⭐
            </span>
          )}
          {liveStatus.currentReservation?.tags?.some(
            (t) => t.toLowerCase().includes('glut') || t.toLowerCase().includes('allerg')
          ) && (
            <span className="text-[9px] text-rose-500" title="Allergie">
              ⚠️
            </span>
          )}
        </div>

        {/* State Badge */}
        <div className="w-full my-0.5">{badgeEl}</div>

        {/* Bottom Action strip - Soft, Airy, Low Contrast Buttons */}
        <div className={`w-full flex items-center justify-center gap-1 pt-0.5 border-t ${
          isLight ? 'border-slate-100' : 'border-white/5'
        }`}>
          {liveStatus.status === 'reserved' && liveStatus.currentReservation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                seatReservation(liveStatus.currentReservation!.id);
              }}
              className={`w-full py-0.5 text-[8px] font-medium rounded-md transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer border ${
                isLight
                  ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200/70'
                  : 'bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border-sky-800/40'
              }`}
            >
              <UserCheck className="w-2.5 h-2.5 stroke-[1.5]" />
              <span>Siedi</span>
            </button>
          )}

          {(liveStatus.status === 'seated' ||
            liveStatus.status === 'warning' ||
            liveStatus.status === 'expired') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                freeTable(table.id);
              }}
              className={`w-full py-0.5 text-[8px] font-medium rounded-md transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer border ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/70'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border-emerald-800/40'
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5 stroke-[1.5]" />
              <span>Libera</span>
            </button>
          )}

          {liveStatus.status === 'free' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectTableForDetails(table.id);
              }}
              className={`w-full py-0.5 text-[8px] font-medium rounded-md transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer border ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/70'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border-emerald-800/40'
              }`}
              title="Tocca il tavolo vuoto, poi Seat Walk-In per accomodare subito (Essential #1)"
            >
              <UserCheck className="w-2.5 h-2.5 stroke-[1.5]" />
              <span>Seat Walk-In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

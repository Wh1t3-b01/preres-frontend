import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { computeTableInstantStatus } from '../../utils/bookingEngine';
import {
  X,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Layers,
  Edit2,
  UserCheck,
  Phone,
  Mail,
  User,
  Tag,
  MessageSquare,
  Utensils,
  Check,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';

interface TableDetailModalProps {
  tableId: string | null;
  onClose: () => void;
  onOpenBookingForTable?: (tableId: string) => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  tableId,
  onClose,
  onOpenBookingForTable,
}) => {
  const {
    tables,
    reservations,
    tableGroups,
    settings,
    selectedDate,
    selectedTime,
    seatReservation,
    freeTable,
    extendTableTime,
    updateTableCapacity,
    updateReservation,
    updateTableDetails,
    removeCustomTable,
    unmergeTables,
    cancelReservation,
    deleteReservation,
    toggleTableBlock,
    transferTable,
    setTableCourseStage,
  } = useRestaurant();

  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [isConfirmingDeleteTable, setIsConfirmingDeleteTable] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');

  if (!tableId) return null;

  const table = tables.find((t) => t.id === tableId);
  if (!table) return null;

  // Active group if merged
  const activeGroup = tableGroups.find(
    (g) => g.groupDate === selectedDate && g.memberTableIds.includes(tableId)
  );

  const effectiveCapacity = activeGroup
    ? activeGroup.totalCapacity
    : table.capacityOverride || table.capacity;

  const liveStatus = computeTableInstantStatus(
    tableId,
    selectedDate,
    selectedTime,
    reservations,
    settings
  );

  const currentRes = liveStatus.currentReservation;

  // All reservations on this table for the selected date
  const tableDayReservations = reservations
    .filter(
      (r) =>
        r.reservationDate === selectedDate &&
        (r.tableId === tableId || (r.assignedTableIds && r.assignedTableIds.includes(tableId))) &&
        r.status !== 'cancelled'
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalTurns = tableDayReservations.length;
  const totalDailyCovers = tableDayReservations.reduce((sum, r) => sum + r.partySize, 0);

  const handleSetReservationCovers = (newCovers: number) => {
    if (!currentRes) return;
    const clampedCovers = Math.max(1, Math.min(20, newCovers));
    updateReservation(currentRes.id, {
      partySize: clampedCovers,
    });
  };

  const handleUpdateNotes = (notes: string) => {
    if (!currentRes) return;
    updateReservation(currentRes.id, { notes });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121622]/95 border border-[#273248] rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222A3C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#171D2B] border border-[#273248] text-[#C084FC] flex items-center justify-center font-brand font-bold text-base shadow-xs">
              {table.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  {activeGroup ? activeGroup.combinedName : table.name || `Tavolo ${table.tableNumber}`}
                </h3>
                {activeGroup && (
                  <span className="text-[10px] font-semibold bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 px-2 py-0.2 rounded-full">
                    {activeGroup.combinedName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-0.5">
                <span>Zona {table.zone.toUpperCase()}</span>
                <span>·</span>
                <span>Capienza: <strong className="text-white font-mono">{effectiveCapacity} px</strong></span>
                <span>·</span>
                <span className="text-[#34D399]">
                  Oggi: {totalTurns} {totalTurns === 1 ? 'giro' : 'giri'} ({totalDailyCovers} px)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Current Reservation Details Card */}
        {currentRes ? (
          <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C084FC] stroke-[1.5]" />
                <span>Ospite / Prenotazione Attiva</span>
              </span>
              <span
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                  currentRes.status === 'seated'
                    ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/40'
                    : currentRes.status === 'confirmed'
                    ? 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {currentRes.status === 'seated' ? 'Seduto in Sala' : currentRes.status === 'confirmed' ? 'In Arrivo' : currentRes.status}
              </span>
            </div>

            {/* Guest Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#222A3C]">
              <div>
                <span className="text-[10px] text-slate-400 block leading-none">Ospite</span>
                <strong className="text-sm text-white font-medium">{currentRes.guestName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block leading-none">Orario</span>
                <span className="font-mono font-bold text-[#C084FC]">
                  {currentRes.startTime} – {currentRes.endTime} ({currentRes.durationMins}m)
                </span>
              </div>
            </div>

            {/* DIRECT COVERS MODIFIER */}
            <div className="bg-[#10141F] border border-[#242C3E] rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#C084FC] stroke-[1.5]" />
                  <span>Coperti Effettivi</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#C084FC] bg-[#171D2B] px-2 py-0.5 rounded border border-[#273248]">
                  {currentRes.partySize} persone
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                {/* Stepper +/- */}
                <div className="flex items-center bg-[#171D2B] border border-[#273248] rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => handleSetReservationCovers(currentRes.partySize - 1)}
                    className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-300 active:scale-95 transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white">
                    {currentRes.partySize}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSetReservationCovers(currentRes.partySize + 1)}
                    className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-300 active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSetReservationCovers(num)}
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                        currentRes.partySize === num
                          ? 'bg-[#8B31E0] text-white border border-[#A855F7]/40 shadow-xs'
                          : 'bg-[#171D2B] text-slate-400 hover:text-white border border-[#242C3E]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE TIMER / SERVICE DURATION */}
            {currentRes.status === 'seated' && (
              <div className="bg-[#10141F] border border-[#242C3E] rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#34D399] stroke-[1.5]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block leading-none">Tempo al Tavolo</span>
                    <span className="text-xs font-mono font-bold text-[#34D399]">
                      {liveStatus.elapsedMinutes || 0} minuti trascorsi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => extendTableTime(table.id, 15)}
                    className="px-2.5 py-1 bg-[#171D2B] hover:bg-[#222A3C] border border-[#273248] text-[10px] font-semibold text-slate-200 rounded-lg transition cursor-pointer"
                  >
                    +15m
                  </button>
                  <button
                    onClick={() => extendTableTime(table.id, 30)}
                    className="px-2.5 py-1 bg-[#171D2B] hover:bg-[#222A3C] border border-[#273248] text-[10px] font-semibold text-slate-200 rounded-lg transition cursor-pointer"
                  >
                    +30m
                  </button>
                </div>
              </div>
            )}

            {/* PRERES Course Progression */}
            {currentRes.status === 'seated' && (
              <div className="bg-[#10141F] border border-[#242C3E] rounded-xl p-2.5 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Avanzamento Portate</span>
                  <span className="text-[#C084FC] font-semibold capitalize">{table.courseStage || 'Seduto'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => setTableCourseStage(table.id, 'drinks')}
                    className={`py-1 rounded-lg border transition cursor-pointer ${table.courseStage === 'drinks' ? 'bg-[#8B31E0] text-white border-[#8B31E0]' : 'bg-[#171D2B] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'}`}
                  >
                    🍸 Drink
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableCourseStage(table.id, 'appetizers')}
                    className={`py-1 rounded-lg border transition cursor-pointer ${table.courseStage === 'appetizers' ? 'bg-[#8B31E0] text-white border-[#8B31E0]' : 'bg-[#171D2B] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'}`}
                  >
                    🥗 Antipasti
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableCourseStage(table.id, 'mains')}
                    className={`py-1 rounded-lg border transition cursor-pointer ${table.courseStage === 'mains' ? 'bg-[#8B31E0] text-white border-[#8B31E0]' : 'bg-[#171D2B] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'}`}
                  >
                    🥩 Portate
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableCourseStage(table.id, 'dessert')}
                    className={`py-1 rounded-lg border transition cursor-pointer ${table.courseStage === 'dessert' ? 'bg-[#8B31E0] text-white border-[#8B31E0]' : 'bg-[#171D2B] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'}`}
                  >
                    🍰 Dolce
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableCourseStage(table.id, 'bill_requested')}
                    className={`py-1 rounded-lg border transition cursor-pointer ${table.courseStage === 'bill_requested' ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-[#171D2B] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'}`}
                  >
                    💳 Conto
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableCourseStage(table.id, 'clearing')}
                    className={`py-1 rounded-lg border transition cursor-pointer ${table.courseStage === 'clearing' ? 'bg-[#059669] text-white font-bold border-[#059669]' : 'bg-[#171D2B] text-slate-300 border-[#242C3E] hover:bg-[#20273A]'}`}
                  >
                    🧹 Libero
                  </button>
                </div>
              </div>
            )}

            {/* PRERES Table Switcher Drawer */}
            {isTransferring && (
              <div className="bg-[#10141F] border border-[#8B31E0]/50 rounded-xl p-3 space-y-2 animate-in fade-in">
                <span className="text-xs font-semibold text-[#E9D5FF] block">
                  Seleziona il tavolo di destinazione su cui spostare la comitiva:
                </span>
                <div className="flex gap-2">
                  <select
                    value={targetTransferTableId}
                    onChange={(e) => setTargetTransferTableId(e.target.value)}
                    className="flex-1 bg-[#171D2B] border border-[#273248] rounded-lg p-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-[#8B31E0]"
                  >
                    <option value="">-- Scegli Tavolo Libero --</option>
                    {tables
                      .filter((t) => t.id !== table.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Tavolo {t.tableNumber} ({t.capacityOverride || t.capacity} px)
                        </option>
                      ))}
                  </select>
                  <button
                    disabled={!targetTransferTableId}
                    onClick={() => {
                      if (targetTransferTableId && currentRes) {
                        transferTable(table.id, targetTransferTableId, currentRes.id);
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 bg-[#8B31E0] text-white font-semibold text-xs rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Trasferisci
                  </button>
                  <button
                    onClick={() => setIsTransferring(false)}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {currentRes.status === 'confirmed' && (
                <button
                  onClick={() => {
                    seatReservation(currentRes.id);
                    onClose();
                  }}
                  className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 stroke-[1.5]" />
                  <span>Fai Sedere Subito</span>
                </button>
              )}

              {currentRes.status === 'seated' && (
                <button
                  onClick={() => {
                    freeTable(table.id);
                    onClose();
                  }}
                  className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                  <span>Completa & Libera</span>
                </button>
              )}

              {/* Transfer Table Button */}
              <button
                type="button"
                onClick={() => setIsTransferring(!isTransferring)}
                className="px-3 py-2 bg-[#171D2B] hover:bg-[#222A3C] text-slate-200 font-semibold text-xs rounded-xl transition border border-[#273248] cursor-pointer"
                title="Sposta su altro tavolo"
              >
                🔄 Sposta
              </button>

              {/* Delete / Cancel */}
              <button
                onClick={() => {
                  deleteReservation(currentRes.bookingCode || currentRes.id);
                  onClose();
                }}
                className="p-2 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 rounded-xl text-xs transition cursor-pointer"
                title="Elimina definitivamente"
              >
                <Trash2 className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#171D2B] border border-[#273248] rounded-2xl p-4 text-center space-y-3 shadow-xs">
            <div className="text-[#34D399] font-semibold text-xs flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>Tavolo attualmente disponibile alle ore {selectedTime}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Nessun ospite seduto al momento. Puoi inserire una prenotazione o trattenere il tavolo.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              {onOpenBookingForTable && (
                <button
                  onClick={() => onOpenBookingForTable(table.id)}
                  className="px-4 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Prenota questo Tavolo</span>
                </button>
              )}

              {/* PRERES Table Hold & Lock Button */}
              <button
                type="button"
                onClick={() => toggleTableBlock(table.id, 'Bloccato / Riserva Maître')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                  table.isBlocked
                    ? 'bg-rose-950/30 text-rose-400 border-rose-800/50'
                    : 'bg-[#10141F] text-slate-300 border-[#273248] hover:bg-[#1E2536]'
                }`}
              >
                {table.isBlocked ? '🔓 Sblocca' : '🔒 Hold (Blocca)'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

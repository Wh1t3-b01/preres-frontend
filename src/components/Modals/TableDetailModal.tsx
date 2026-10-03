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
  } = useRestaurant();

  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [isConfirmingDeleteTable, setIsConfirmingDeleteTable] = useState(false);

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

  // Handler to adjust reservation covers
  const handleSetReservationCovers = (newPartySize: number) => {
    if (!currentRes) return;
    const clamped = Math.max(1, Math.min(30, newPartySize));
    updateReservation(currentRes.id, { partySize: clamped });

    if (clamped > effectiveCapacity) {
      updateTableCapacity(table.id, clamped);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#FDFBF7] border-2 border-[#1E3A2F]/30 rounded-3xl p-5 md:p-6 max-w-lg w-full shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A2F]/15 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1E3A2F] text-amber-100 flex items-center justify-center font-bold text-base font-brand shadow-xs">
              {table.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-brand font-bold text-[#1E3A2F]">
                  Tavolo {table.tableNumber}
                </h3>
                {activeGroup && (
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    {activeGroup.combinedName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
                <span>Zona {table.zone.toUpperCase()}</span>
                <span>·</span>
                <span>Capienza: <strong className="text-[#1E3A2F] font-mono-num">{effectiveCapacity} px</strong></span>
                <span>·</span>
                <span className="text-[#6B3FA0] font-semibold">
                  Oggi: {totalTurns} {totalTurns === 1 ? 'giro' : 'giri'} ({totalDailyCovers} px)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-[#1E3A2F] p-1.5 rounded-xl hover:bg-[#1E3A2F]/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Reservation Details Card */}
        {currentRes ? (
          <div className="bg-white border-2 border-[#1E3A2F]/20 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A2F] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#6B3FA0]" />
                <span>Prenotazione In Corso / In Arrivo</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  currentRes.status === 'seated'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentRes.status === 'confirmed'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {currentRes.status === 'seated' ? 'Seduto in Sala' : currentRes.status === 'confirmed' ? 'In Arrivo / Confermato' : currentRes.status}
              </span>
            </div>

            {/* Guest Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-100">
              <div>
                <span className="text-[10px] text-stone-400 block leading-none">Ospite</span>
                <strong className="text-sm font-brand text-[#1E3A2F]">{currentRes.guestName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block leading-none">Turno Orario</span>
                <span className="font-mono-num font-bold text-[#6B3FA0]">
                  {currentRes.startTime} – {currentRes.endTime} ({currentRes.durationMins}m)
                </span>
              </div>
            </div>

            {/* DIRECT COVERS MODIFIER FOR ACTIVE RESERVATION */}
            <div className="bg-[#FBF8F2] border-2 border-[#6B3FA0]/30 rounded-xl p-2.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E3A2F] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#6B3FA0]" />
                  <span>Coperti Effettivi Prenotazione</span>
                </span>
                <span className="text-xs font-mono-num font-extrabold text-[#6B3FA0] bg-white px-2 py-0.5 rounded-md border border-[#6B3FA0]/30 shadow-2xs">
                  {currentRes.partySize} persone
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                {/* Stepper +/- */}
                <div className="flex items-center bg-white border border-[#1E3A2F]/20 rounded-xl p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSetReservationCovers(currentRes.partySize - 1)}
                    className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-700 active:scale-95 transition"
                    title="Riduci di 1 coperto"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono-num text-[#1E3A2F]">
                    {currentRes.partySize}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSetReservationCovers(currentRes.partySize + 1)}
                    className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-700 active:scale-95 transition"
                    title="Aggiungi 1 coperto (es. ospite in più)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Party Size Presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSetReservationCovers(num)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono-num font-bold transition ${
                        currentRes.partySize === num
                          ? 'bg-[#6B3FA0] text-white shadow-2xs'
                          : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-white/80'
                      }`}
                    >
                      {num}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone & Email if available */}
            {(currentRes.guestPhone || currentRes.guestEmail) && (
              <div className="bg-[#FBF8F2] p-2 rounded-xl border border-[#1E3A2F]/10 flex flex-wrap items-center gap-3 text-xs text-[#1E3A2F]">
                {currentRes.guestPhone && (
                  <a
                    href={`tel:${currentRes.guestPhone}`}
                    className="flex items-center gap-1 hover:text-[#6B3FA0] font-mono-num"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>{currentRes.guestPhone}</span>
                  </a>
                )}
                {currentRes.guestEmail && (
                  <a
                    href={`mailto:${currentRes.guestEmail}`}
                    className="flex items-center gap-1 hover:text-[#6B3FA0]"
                  >
                    <Mail className="w-3.5 h-3.5 text-stone-500" />
                    <span>{currentRes.guestEmail}</span>
                  </a>
                )}
                <span className="text-[10px] text-stone-400 ml-auto font-mono">
                  Cod: {currentRes.bookingCode}
                </span>
              </div>
            )}

            {/* Tags / Dietary Requirements */}
            {currentRes.tags && currentRes.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {currentRes.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold bg-[#1E3A2F] text-amber-100 px-2 py-0.5 rounded-lg shadow-2xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Notes */}
            {currentRes.notes && (
              <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-2 text-xs text-amber-950">
                <span className="font-bold block text-[10px] uppercase text-amber-900 mb-0.5">
                  Note di Servizio:
                </span>
                <p className="leading-snug">{currentRes.notes}</p>
              </div>
            )}

            {/* Turn Timer for seated guests */}
            {currentRes.status === 'seated' && (
              <div className="bg-[#FBF8F2] p-2.5 rounded-xl border border-[#1E3A2F]/15 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Permanenza al tavolo:
                  </span>
                  <span className="font-mono-num font-bold text-[#1E3A2F]">
                    {liveStatus.elapsedMinutes}m trascorsi / {settings.maxTurnMins}m max
                  </span>
                </div>

                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      liveStatus.status === 'expired'
                        ? 'bg-rose-600'
                        : liveStatus.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, liveStatus.occupancyPercent || 0)}%` }}
                  />
                </div>

                {/* Quick Extension Buttons */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[10px] text-stone-500">Proroga servizio:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => extendTableTime(table.id, 15)}
                      className="px-2 py-0.5 bg-white border border-[#1E3A2F]/20 text-[10px] font-bold text-[#1E3A2F] rounded-lg hover:bg-[#1E3A2F]/5 transition shadow-2xs"
                    >
                      +15 min
                    </button>
                    <button
                      onClick={() => extendTableTime(table.id, 30)}
                      className="px-2 py-0.5 bg-white border border-[#1E3A2F]/20 text-[10px] font-bold text-[#1E3A2F] rounded-lg hover:bg-[#1E3A2F]/5 transition shadow-2xs"
                    >
                      +30 min
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {currentRes.status === 'confirmed' && (
                <button
                  onClick={() => {
                    seatReservation(currentRes.id);
                    onClose();
                  }}
                  className="flex-1 bg-[#6B3FA0] hover:bg-[#5A338A] text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Fai Sedere Ospiti Subito</span>
                </button>
              )}

              {currentRes.status === 'seated' && (
                <button
                  onClick={() => {
                    freeTable(table.id);
                    onClose();
                  }}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completa & Libera Tavolo</span>
                </button>
              )}

              <button
                onClick={() => {
                  deleteReservation(currentRes.bookingCode || currentRes.id);
                  onClose();
                }}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs transition"
                title="Elimina definitivamente prenotazione"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-4 text-center space-y-2 shadow-xs">
            <div className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tavolo attualmente libero alle ore {selectedTime}</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Nessun ospite seduto al momento. Puoi inserire una nuova prenotazione o walk-in.
            </p>
            {onOpenBookingForTable && (
              <button
                onClick={() => onOpenBookingForTable(table.id)}
                className="mt-1 px-4 py-2 bg-[#6B3FA0] hover:bg-[#5A338A] text-white font-bold rounded-xl text-xs transition shadow-2xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Prenota questo Tavolo</span>
              </button>
            )}
          </div>
        )}

        {/* Physical Table Capacity Modifier */}
        <div className="bg-[#F6F2E9] border border-[#1E3A2F]/15 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="text-xs">
            <span className="text-[10px] text-stone-500 block leading-none">Capienza Fisica Tavolo</span>
            <strong className="text-[#1E3A2F] font-mono-num font-bold">{effectiveCapacity} posti</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-white border border-[#1E3A2F]/20 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, effectiveCapacity - 1);
                  updateTableCapacity(table.id, next);
                }}
                className="w-6 h-6 rounded hover:bg-stone-100 flex items-center justify-center text-stone-700 active:scale-95 transition"
                title="Riduci capienza fisica"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 text-xs font-bold font-mono-num text-[#1E3A2F]">
                {effectiveCapacity}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(30, effectiveCapacity + 1);
                  updateTableCapacity(table.id, next);
                }}
                className="w-6 h-6 rounded hover:bg-stone-100 flex items-center justify-center text-stone-700 active:scale-95 transition"
                title="Aumenta capienza fisica"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="flex gap-1">
              {[2, 4, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateTableCapacity(table.id, num)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num font-bold transition ${
                    effectiveCapacity === num
                      ? 'bg-[#1E3A2F] text-amber-100'
                      : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F]'
                  }`}
                >
                  {num}p
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ON-DEMAND EXPANDABLE TURN SCHEDULE (Shown only if requested) */}
        <div className="border-t border-[#1E3A2F]/10 pt-2">
          <button
            type="button"
            onClick={() => setShowFullSchedule(!showFullSchedule)}
            className="w-full flex items-center justify-between p-2.5 bg-white border border-[#1E3A2F]/15 rounded-xl text-xs font-bold text-[#1E3A2F] hover:bg-[#FBF8F2] transition shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#6B3FA0]" />
              <span>
                Storico Turni di Oggi su questo Tavolo ({tableDayReservations.length} prenotazioni)
              </span>
            </div>
            {showFullSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullSchedule && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-150">
              {tableDayReservations.length === 0 ? (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs text-stone-500 italic">
                  Nessun'altra prenotazione registrata per questa data.
                </div>
              ) : (
                tableDayReservations.map((r, idx) => (
                  <div
                    key={r.id}
                    className="bg-white border border-[#1E3A2F]/10 rounded-xl p-2.5 flex items-center justify-between text-xs hover:border-[#6B3FA0] transition"
                  >
                    <div>
                      <div className="font-bold text-[#1E3A2F]">
                        Turno #{idx + 1}: {r.startTime} – {r.endTime} · {r.guestName}
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-2">
                        <span className="font-bold text-[#6B3FA0]">{r.partySize} px</span>
                        <span>·</span>
                        <span className="font-mono">Cod: {r.bookingCode}</span>
                        {r.notes ? ` · "${r.notes}"` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          r.status === 'seated'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'completed'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {r.status === 'completed' ? 'Completato' : r.status === 'seated' ? 'Seduto' : 'Confermato'}
                      </span>
                      <button
                        onClick={() => deleteReservation(r.bookingCode || r.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                        title="Elimina definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Table Zone Relocation & Removal */}
        <div className="bg-[#F6F2E9] border border-[#1E3A2F]/15 rounded-2xl p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E3A2F] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#1E3A2F]" />
              <span>Sposta Tavolo in un'Altra Sala</span>
            </span>
            <span className="text-[10px] font-bold uppercase text-[#6B3FA0] bg-white px-2 py-0.5 rounded border border-[#1E3A2F]/10">
              Attuale: {table.zone.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => updateTableDetails(table.id, { zone: 'main' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  table.zone === 'main'
                    ? 'bg-[#1E3A2F] text-amber-100 shadow-2xs'
                    : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-white/80'
                }`}
              >
                Sala Principale
              </button>
              <button
                type="button"
                onClick={() => updateTableDetails(table.id, { zone: 'bar' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  table.zone === 'bar'
                    ? 'bg-[#1E3A2F] text-amber-100 shadow-2xs'
                    : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-white/80'
                }`}
              >
                Zona Bar
              </button>
              <button
                type="button"
                onClick={() => updateTableDetails(table.id, { zone: 'private' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  table.zone === 'private'
                    ? 'bg-[#1E3A2F] text-amber-100 shadow-2xs'
                    : 'bg-white border border-[#1E3A2F]/15 text-[#1E3A2F] hover:bg-white/80'
                }`}
              >
                Sala Privata VIP
              </button>
            </div>

            {!isConfirmingDeleteTable ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDeleteTable(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs whitespace-nowrap"
                title="Elimina tavolo dalla disposizione della sala"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Rimuovi Tavolo</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-100 border border-rose-300 p-1 rounded-lg animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    removeCustomTable(table.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition shadow-xs whitespace-nowrap"
                >
                  Conferma Eliminazione
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDeleteTable(false)}
                  className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 rounded text-xs font-semibold transition"
                >
                  Annulla
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#1E3A2F]/15 flex items-center justify-between gap-2">
          {activeGroup ? (
            <button
              onClick={() => {
                unmergeTables(activeGroup.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-100 transition shadow-2xs"
            >
              Sciogli Accorpamento
            </button>
          ) : (
            <span className="text-[11px] text-stone-400">Tavolo Singolo</span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1E3A2F] text-amber-100 font-bold rounded-xl text-xs transition hover:bg-[#152a22] shadow-xs"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

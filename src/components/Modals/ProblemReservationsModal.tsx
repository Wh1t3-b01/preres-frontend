import React from 'react';
import {
  AlertTriangle,
  X,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Phone,
  Calendar,
} from 'lucide-react';
import { Reservation, RestaurantTable } from '../../types';

export interface ProblemItem {
  id: string;
  type: 'unassigned' | 'overstay' | 'capacity_mismatch' | 'conflict' | 'vip_unconfirmed';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reservation?: Reservation;
  table?: RestaurantTable;
  suggestedAction: string;
}

interface ProblemReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  problems: ProblemItem[];
  onResolveOverstay?: (tableId: string, addMins: number) => void;
  onReassignTable?: (reservationId: string) => void;
  onSeatNow?: (reservationId: string) => void;
  theme: 'light' | 'dark';
}

export const ProblemReservationsModal: React.FC<ProblemReservationsModalProps> = ({
  isOpen,
  onClose,
  problems,
  onResolveOverstay,
  onReassignTable,
  onSeatNow,
  theme,
}) => {
  const isLight = theme === 'light';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-xl flex flex-col max-h-[85vh] overflow-hidden ${
          isLight
            ? 'bg-white text-slate-800 border-slate-200/80'
            : 'bg-[#121622] text-slate-100 border-[#222A3C]'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-100 bg-amber-50/30' : 'border-[#222A3C] bg-amber-950/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isLight
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
            }`}>
              <AlertTriangle className="w-4.5 h-4.5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">
                  Anomalie Prenotazioni (Problem Reservations)
                </h3>
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                  problems.length > 0
                    ? isLight
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                    : isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                }`}>
                  {problems.length} {problems.length === 1 ? 'anomalia rilevata' : 'anomalie rilevate'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Rilevamento intelligente di tavoli scaduti, conflitti di orario e tavoli non assegnati.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'hover:bg-slate-100 border-slate-200/70 text-slate-500'
                : 'hover:bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* List of problems */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 [scrollbar-width:thin]">
          {problems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200">
                Nessuna anomalia presente nel turno
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                Tutte le prenotazioni hanno tavoli assegnati con capienze coerenti e nessun tavolo ha superato la durata massima prevista.
              </p>
            </div>
          ) : (
            problems.map((prob) => {
              const res = prob.reservation;
              const tbl = prob.table;

              return (
                <div
                  key={prob.id}
                  className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                    prob.severity === 'high'
                      ? isLight
                        ? 'bg-rose-50/50 border-rose-200/80'
                        : 'bg-rose-950/20 border-rose-900/40'
                      : isLight
                      ? 'bg-amber-50/40 border-amber-200/70'
                      : 'bg-amber-950/20 border-amber-900/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${
                      prob.severity === 'high'
                        ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                    }`}>
                      <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${
                          prob.severity === 'high'
                            ? 'text-rose-800 dark:text-rose-200'
                            : 'text-amber-800 dark:text-amber-200'
                        }`}>
                          {prob.title}
                        </span>
                        {res && (
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                            isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-[#182030] border-slate-700 text-slate-300'
                          }`}>
                            {res.guestName} ({res.partySize} px)
                          </span>
                        )}
                        {tbl && (
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                            isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-[#182030] border-slate-700 text-slate-300'
                          }`}>
                            Tavolo {tbl.tableNumber}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {prob.description}
                      </p>

                      <div className={`text-[11px] flex items-center gap-1.5 font-medium ${
                        isLight ? 'text-sky-700' : 'text-sky-400'
                      }`}>
                        <Sparkles className="w-3 h-3 stroke-[1.5]" />
                        <span>Azione consigliata: {prob.suggestedAction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800">
                    {prob.type === 'overstay' && tbl && onResolveOverstay && (
                      <>
                        <button
                          onClick={() => onResolveOverstay(tbl.id, 15)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition shadow-2xs cursor-pointer"
                        >
                          +15 min
                        </button>
                        <button
                          onClick={() => onResolveOverstay(tbl.id, 30)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition shadow-2xs cursor-pointer"
                        >
                          +30 min
                        </button>
                      </>
                    )}

                    {prob.type === 'unassigned' && res && onReassignTable && (
                      <button
                        onClick={() => {
                          onClose();
                          onReassignTable(res.id);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Assegna Tavolo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {prob.type === 'capacity_mismatch' && res && onReassignTable && (
                      <button
                        onClick={() => {
                          onClose();
                          onReassignTable(res.id);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white transition shadow-2xs cursor-pointer"
                      >
                        Sposta su Tavolo Idoneo
                      </button>
                    )}

                    {res && res.status === 'confirmed' && onSeatNow && (
                      <button
                        onClick={() => {
                          onSeatNow(res.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Accomoda
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'border-slate-100 bg-slate-50/60' : 'border-[#222A3C] bg-[#10141F]'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Risolvi le anomalie per massimizzare la rotazione dei coperti e prevenire attese in sala.
          </span>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-200/80 text-slate-700'
                : 'bg-[#182030] hover:bg-[#202A3C] border-[#28344A] text-slate-200'
            }`}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

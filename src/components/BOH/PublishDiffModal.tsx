import React, { useState } from 'react';
import { BohFullConfiguration } from '../../services/bohService';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  UploadCloud,
  CheckCircle2,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Link2,
  Sliders,
  Calendar,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface PublishDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftConfig: BohFullConfiguration;
  liveConfig: BohFullConfiguration;
  changeLogs: string[];
  onConfirmPublish: () => void;
  onDiscardDraft: () => void;
}

export const PublishDiffModal: React.FC<PublishDiffModalProps> = ({
  isOpen,
  onClose,
  draftConfig,
  liveConfig,
  changeLogs,
  onConfirmPublish,
  onDiscardDraft,
}) => {
  const { theme } = useRestaurant();
  const isLight = theme === 'light';

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  if (!isOpen) return null;

  // Compute diff breakdown
  const layoutDiffCount = Math.abs(draftConfig.layouts.length - liveConfig.layouts.length) +
    draftConfig.layouts.filter((l, i) => JSON.stringify(l) !== JSON.stringify(liveConfig.layouts[i])).length;

  const combinationDiffCount = Math.abs(draftConfig.combinations.length - liveConfig.combinations.length) +
    draftConfig.combinations.filter((c, i) => JSON.stringify(c) !== JSON.stringify(liveConfig.combinations[i])).length;

  const rulesModified = JSON.stringify(draftConfig.rules) !== JSON.stringify(liveConfig.rules);
  const scheduleModified = JSON.stringify(draftConfig.schedules) !== JSON.stringify(liveConfig.schedules);
  const specialDaysModified = JSON.stringify(draftConfig.specialDays) !== JSON.stringify(liveConfig.specialDays);

  const handleExecutePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      onConfirmPublish();
      setIsPublishing(false);
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        onClose();
      }, 1800);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className={`p-6 rounded-3xl border max-w-lg w-full shadow-2xl space-y-5 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#273248] text-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Pubblica Modifiche BOH in Produzione
              </h3>
              <p className="text-xs text-slate-500">
                Meccanismo Draft-to-Live verso i dispositivi Front-of-House
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {publishSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold">Pubblicazione Riuscita!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Le modifiche a floor plan, regole e programmazione sono ora live su tutti i terminali cameriere, cassa e booking engine.
            </p>
          </div>
        ) : (
          <>
            {/* Diff Summary Cards */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Riepilogo Modifiche Pronte per il Rilascio:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  layoutDiffCount > 0
                    ? 'border-sky-300 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 opacity-60'
                }`}>
                  <Layers className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Floor Plans</span>
                    <span className="text-[10px] text-slate-500">{layoutDiffCount} modifiche</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  combinationDiffCount > 0
                    ? 'border-sky-300 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 opacity-60'
                }`}>
                  <Link2 className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Combinazioni</span>
                    <span className="text-[10px] text-slate-500">{combinationDiffCount} modifiche</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  rulesModified
                    ? 'border-sky-300 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 opacity-60'
                }`}>
                  <Sliders className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Regole & Politiche</span>
                    <span className="text-[10px] text-slate-500">{rulesModified ? 'Aggiornate' : 'Invariate'}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  scheduleModified || specialDaysModified
                    ? 'border-sky-300 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 opacity-60'
                }`}>
                  <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Turni & Festività</span>
                    <span className="text-[10px] text-slate-500">
                      {scheduleModified || specialDaysModified ? 'Aggiornati' : 'Invariati'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Log History */}
            {changeLogs.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ultime Azioni Eseguite nella Bozza:
                </span>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-[11px] font-mono max-h-24 overflow-y-auto space-y-1">
                  {changeLogs.slice(0, 5).map((log, i) => (
                    <div key={i} className="text-slate-600 dark:text-slate-400 truncate">
                      • {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notice regarding live sync */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs text-slate-500 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-500 shrink-0" />
              <span>
                La pubblicazione aggiornerà istantaneamente i tablet cameriere, la mappa tavoli e il widget di prenotazione web senza riavvio.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  if (window.confirm('Sei sicuro di voler scartare tutte le modifiche non pubblicate e ripristinare la configurazione live?')) {
                    onDiscardDraft();
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Scarta Bozza</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  Continua a Modificare
                </button>
                <button
                  onClick={handleExecutePublish}
                  disabled={isPublishing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isPublishing ? 'Pubblicazione in corso...' : 'Pubblica Updates Live'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

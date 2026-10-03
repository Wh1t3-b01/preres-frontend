import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  MessageSquare,
  X,
  ExternalLink,
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useRestaurant();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((toast) => {
        let bgClasses = 'bg-white/95 border-[#1E3A2F]/20 text-[#1E3A2F]';
        let iconEl = <Info className="w-4 h-4 text-sky-600 shrink-0" />;

        if (toast.type === 'success') {
          bgClasses = 'bg-emerald-900/95 border-emerald-700 text-amber-50';
          iconEl = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'warning' || toast.type === 'turn_warning') {
          bgClasses = 'bg-amber-900/95 border-amber-700 text-amber-50';
          iconEl = <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />;
        } else if (toast.type === 'error' || toast.type === 'turn_expired') {
          bgClasses = 'bg-rose-900/95 border-rose-700 text-rose-50';
          iconEl = <XCircle className="w-4 h-4 text-rose-300 shrink-0" />;
        } else if (toast.type === 'sms_sent') {
          bgClasses = 'bg-indigo-900/95 border-indigo-700 text-indigo-50';
          iconEl = <MessageSquare className="w-4 h-4 text-indigo-300 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`${bgClasses} pointer-events-auto border rounded-xl py-2 px-3 shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-3 flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90 select-none`}
            title="Clicca per chiudere la notifica"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0">{iconEl}</div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs leading-tight truncate">{toast.title}</h5>
                <p className="text-[11px] opacity-85 leading-snug line-clamp-1">{toast.message}</p>
                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.onAction!();
                      removeToast(toast.id);
                    }}
                    className="mt-1 text-[10px] font-bold underline hover:opacity-80 flex items-center gap-1"
                  >
                    <span>{toast.actionLabel}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-white/60 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition shrink-0 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

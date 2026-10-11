import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  Send,
  Star,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  FileQuestion,
  Headphones,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface HelpFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export const HelpFeedbackModal: React.FC<HelpFeedbackModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const { addToast } = useRestaurant();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'resources' | 'feedback'>('resources');
  const [feedbackCategory, setFeedbackCategory] = useState<'ui' | 'tables' | 'waitlist' | 'bug' | 'feature'>('ui');
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      addToast({
        type: 'success',
        title: 'Feedback Inviato',
        message: 'Grazie per aver contribuito al miglioramento del sistema di sala.',
      });
    }, 500);
  };

  const resources = [
    {
      title: 'Guida Gestione Mappa & Tavoli FOH',
      desc: 'Come gestire assegnazioni, unioni dinamiche e rotazione coperti in servizio.',
      category: 'Mappa Sala',
    },
    {
      title: 'Timeline & Pacing: Riconoscere i Buchi',
      desc: 'Come individuare intervalli vuoti e incastrare prenotazioni da 2 e 4 coperti.',
      category: 'Timeline',
    },
    {
      title: 'Ottimizzazione Sezioni Camerieri (Server Sections)',
      desc: 'Bilanciare il numero di coperti tra i ranghi per mantenere gli standard di servizio.',
      category: 'Operazioni',
    },
    {
      title: 'Configurazione Stampanti Chit Comande',
      desc: 'Guida all’integrazione con stampanti termiche IP/USB per scontrini di comanda.',
      category: 'Hardware',
    },
  ];

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
          isLight ? 'border-slate-100 bg-sky-50/30' : 'border-[#222A3C] bg-sky-950/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/50'
            }`}>
              <HelpCircle className="w-4.5 h-4.5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">
                  Guida &amp; Invia Feedback (Help &amp; Feedback)
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                }`}>
                  Capitolo 9
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Risorse formative e canale diretto di supporto e feedback.
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

        {/* Tab Switcher */}
        <div className={`px-4 pt-2 border-b flex items-center gap-2 ${
          isLight ? 'border-slate-100 bg-slate-50/30' : 'border-[#222A3C] bg-[#121622]'
        }`}>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-2 border-b-2 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 -mb-px ${
              activeTab === 'resources'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Risorse &amp; Guide Utente</span>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-2 border-b-2 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 -mb-px ${
              activeTab === 'feedback'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Invia Feedback &amp; Idee</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 [scrollbar-width:thin]">
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <span className={`text-[10px] uppercase tracking-wider font-medium block ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Documentazione Ufficiale Gestionale di Sala
              </span>

              <div className="space-y-2">
                {resources.map((res, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                      isLight
                        ? 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/70'
                        : 'bg-[#161C2A] hover:bg-[#1E2536] border-[#222A3C]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{res.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          {res.category}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {res.desc}
                      </p>
                    </div>

                    <span className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer">
                      <span>Leggi</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-3 mt-3 ${
                isLight ? 'bg-sky-50/50 border-sky-200/60' : 'bg-sky-950/20 border-sky-800/40'
              }`}>
                <Headphones className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold block text-sky-900 dark:text-sky-200">Supporto Tecnico &amp; Help Desk 24/7</span>
                  <span className="text-[11px] text-sky-700 dark:text-sky-300">
                    Per emergenze durante il servizio: 800-987-654 o tramite chat dal vivo.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              {isSubmitted ? (
                <div className="py-10 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="font-semibold text-sm">Feedback Inviato con Successo!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Il tuo messaggio è stato inoltrato al team di sviluppo del software per le prossime release.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFeedbackText('');
                    }}
                    className="mt-2 text-xs text-sky-600 hover:underline font-medium"
                  >
                    Invia un altro suggerimento
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider block mb-1 font-medium ${
                      isLight ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Ambito del Feedback
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'ui' as const, label: 'Interfaccia / UI' },
                        { id: 'tables' as const, label: 'Mappa Tavoli' },
                        { id: 'waitlist' as const, label: 'Lista Attesa' },
                        { id: 'feature' as const, label: 'Nuova Feature' },
                        { id: 'bug' as const, label: 'Segnalazione Bug' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFeedbackCategory(cat.id)}
                          className={`px-2 py-1.5 rounded-lg border text-[11px] transition cursor-pointer text-center truncate ${
                            feedbackCategory === cat.id
                              ? isLight
                                ? 'bg-sky-50 text-sky-800 border-sky-300 font-medium'
                                : 'bg-sky-950/40 text-sky-200 border-sky-700 font-medium'
                              : isLight
                              ? 'bg-slate-50/60 border-slate-200 text-slate-600'
                              : 'bg-[#161C2A] border-[#222A3C] text-slate-400'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider block mb-1 font-medium ${
                      isLight ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Valutazione Esperienza d'Uso
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              rating >= star
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 ml-2">
                        {rating === 5 ? 'Eccellente' : rating === 4 ? 'Molto Buona' : 'Migliorabile'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider block mb-1 font-medium ${
                      isLight ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Descrivi il tuo suggerimento o segnalazione
                    </label>
                    <textarea
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Cosa possiamo migliorare nella gestione della sala o nella piantina? Condividi i tuoi commenti..."
                      className={`w-full p-2.5 rounded-xl border text-xs resize-none ${
                        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#161C2A] border-slate-700 text-slate-200'
                      }`}
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !feedbackText.trim()}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Invio in corso...' : 'Invia Feedback'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'border-slate-100 bg-slate-50/60' : 'border-[#222A3C] bg-[#10141F]'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Sistema Gestionale di Sala · Versione Pro FOH
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

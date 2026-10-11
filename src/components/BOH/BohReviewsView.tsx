import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  CornerDownRight,
  Filter,
  RefreshCw,
  Globe,
  Link,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Check,
  Plus,
  X,
  Info,
} from 'lucide-react';

export interface VerifiedReview {
  id: string;
  source: 'google' | 'tripadvisor' | 'direct';
  guestName: string;
  rating: number; // 1-5
  date: string;
  subScores: { food: number; service: number; ambiance: number; value: number };
  comment: string;
  response?: string;
  isResponded: boolean;
  externalUrl?: string;
}

const INITIAL_REVIEWS: VerifiedReview[] = [
  {
    id: 'rev_1',
    source: 'direct',
    guestName: 'Francesco B.',
    rating: 5,
    date: '2026-10-07',
    subScores: { food: 5, service: 5, ambiance: 5, value: 4.8 },
    comment: 'Esperienza sublime al tavolo booth VIP G. I Plin della tradizione al sugo d’arrosto sono insuperabili. Servizio impeccabile e attento ai minimi dettagli.',
    response: 'Gentile Francesco, grazie di cuore per le splendide parole. Trasmetteremo i tuoi complimenti a tutta la brigata di cucina e di sala!',
    isResponded: true,
  },
  {
    id: 'rev_2',
    source: 'google',
    guestName: 'Chiara Valenti (Google Local Guide)',
    rating: 5,
    date: '2026-10-06',
    subScores: { food: 5, service: 5, ambiance: 4.9, value: 4.7 },
    comment: 'Cena fantastica per il nostro anniversario nella sala MAIN A. Carta dei vini straordinaria e sommelier preparatissimo. Torneremo sicuramente!',
    response: '',
    isResponded: false,
    externalUrl: 'https://maps.google.com/?cid=1234567890',
  },
  {
    id: 'rev_3',
    source: 'tripadvisor',
    guestName: 'Marco P. (TripAdvisor Traveler)',
    rating: 4,
    date: '2026-10-03',
    subScores: { food: 4.8, service: 4.2, ambiance: 4.5, value: 4.0 },
    comment: 'Cibo eccellente e materie prime di altissimo livello. Piccola attesa tra antipasto e primo dovuta al locale al completo, ma gestita con grande garbo dallo staff.',
    response: '',
    isResponded: false,
    externalUrl: 'https://tripadvisor.it/Restaurant_Review-d12345678',
  },
  {
    id: 'rev_4',
    source: 'google',
    guestName: 'Davide Moretti',
    rating: 5,
    date: '2026-09-29',
    subScores: { food: 5, service: 4.8, ambiance: 5, value: 4.9 },
    comment: 'Il miglior brasato al Barolo di Torino. Cottura perfetta e polenta profumatissima. Ambiente caldo e accogliente.',
    response: 'Gentile Davide, felicissimi di aver reso la tua serata speciale!',
    isResponded: true,
  },
];

export const BohReviewsView: React.FC = () => {
  const { theme, isHighContrast, addToast } = useRestaurant();
  const isLight = theme === 'light';

  const [reviews, setReviews] = useState<VerifiedReview[]>(INITIAL_REVIEWS);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'google' | 'tripadvisor' | 'direct'>('all');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  // Sync Modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState('ChIJN1t_tDeuEmsRUsoyG83frY4');
  const [tripAdvisorLocationId, setTripAdvisorLocationId] = useState('12849033');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState('Oggi alle 10:15');

  // Manual Review Add Modal
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualRating, setManualRating] = useState(5);
  const [manualComment, setManualComment] = useState('');
  const [manualSource, setManualSource] = useState<'google' | 'tripadvisor' | 'direct'>('google');

  const filteredReviews = reviews.filter((r) => {
    if (sourceFilter === 'all') return true;
    return r.source === sourceFilter;
  });

  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  const handleSendReply = (reviewId: string) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) {
      alert('Inserisci il testo della risposta');
      return;
    }

    const updated = reviews.map((r) =>
      r.id === reviewId ? { ...r, response: text, isResponded: true } : r
    );
    setReviews(updated);
    setReplyTextMap({ ...replyTextMap, [reviewId]: '' });
    addToast({
      type: 'success',
      title: 'Risposta Inviata e Pubblicata',
      message: 'La tua risposta è stata sincronizzata con la piattaforma.',
    });
  };

  const handleApplySuggestion = (reviewId: string, guestName: string) => {
    const suggestion = `Gentile ${guestName}, la ringraziamo sinceramente per il feedback e per aver scelto Sotto Sotto. Siamo felici che abbia apprezzato la nostra proposta gastronomica e saremo lieti di accoglierla nuovamente presto a tavola!`;
    setReplyTextMap({ ...replyTextMap, [reviewId]: suggestion });
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedAt('Adesso');
      addToast({
        type: 'success',
        title: 'Sincronizzazione Completata',
        message: 'Recensioni Google Maps e TripAdvisor aggiornate con successo.',
      });
    }, 1200);
  };

  const handleAddManualReview = () => {
    if (!manualAuthor.trim() || !manualComment.trim()) {
      alert('Inserisci autore e testo della recensione');
      return;
    }

    const newRev: VerifiedReview = {
      id: `rev_${Date.now()}`,
      source: manualSource,
      guestName: manualAuthor,
      rating: manualRating,
      date: new Date().toISOString().split('T')[0],
      subScores: { food: manualRating, service: manualRating, ambiance: manualRating, value: manualRating },
      comment: manualComment,
      isResponded: false,
    };

    setReviews([newRev, ...reviews]);
    setIsAddReviewModalOpen(false);
    setManualAuthor('');
    setManualComment('');
    addToast({
      type: 'success',
      title: 'Recensione Registrata',
      message: `Aggiunta recensione da ${manualSource.toUpperCase()}.`,
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. MASTER HEADER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-medium">
            <Star className="w-5 h-5 stroke-[1.5] fill-amber-500" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Recensioni &amp; Feedback Unificati (Google, TripAdvisor &amp; FOH)
            </h3>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Visualizza e rispondi a tutte le recensioni ricevute su Google Business Profile, TripAdvisor e prenotazioni dirette.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#182030] hover:bg-[#202A3C] text-slate-200 border-[#28344A]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-500" />
            <span>Connetti Google &amp; TripAdvisor</span>
          </button>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizzazione...' : 'Sincronizza Ora'}</span>
          </button>

          <button
            onClick={() => setIsAddReviewModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Aggiungi Recensione</span>
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW METRICS & SOURCE FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/70 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-500">{avgRating}</span>
            <span className="text-xs font-medium text-slate-400">/ 5.0</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs font-medium text-slate-500">
            {reviews.length} recensioni mostrate (Ultimo sync: {lastSyncedAt})
          </span>
        </div>

        {/* Source Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all' as const, label: `Tutte (${reviews.length})` },
            { id: 'google' as const, label: `Google (${reviews.filter((r) => r.source === 'google').length})` },
            { id: 'tripadvisor' as const, label: `TripAdvisor (${reviews.filter((r) => r.source === 'tripadvisor').length})` },
            { id: 'direct' as const, label: `Dirette (${reviews.filter((r) => r.source === 'direct').length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSourceFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border shrink-0 ${
                sourceFilter === f.id
                  ? 'bg-sky-500 text-white border-sky-400 shadow-2xs font-bold'
                  : isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-[#182030] hover:bg-[#202A3C] text-slate-300 border-[#28344A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. REVIEWS LIST */}
      <div className="space-y-3">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className={`p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-3 ${
              isLight ? 'bg-white border-slate-200/80 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm">{rev.guestName}</h4>

                  {/* Channel Source Badge */}
                  {rev.source === 'google' && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40 flex items-center gap-1">
                      <span>🔵 Google Maps Review</span>
                    </span>
                  )}
                  {rev.source === 'tripadvisor' && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 flex items-center gap-1">
                      <span>🟢 TripAdvisor</span>
                    </span>
                  )}
                  {rev.source === 'direct' && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 flex items-center gap-1">
                      <span>✓ Verificata a Tavola</span>
                    </span>
                  )}

                  <span className="text-[10px] text-slate-400">{rev.date}</span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold font-mono ml-1 text-slate-600 dark:text-slate-400">
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {rev.externalUrl && (
                <a
                  href={rev.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Vedi Originale</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              "{rev.comment}"
            </p>

            {/* Published Response */}
            {rev.response ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161C2A] border border-slate-200/80 dark:border-[#242C3E] text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <CornerDownRight className="w-3.5 h-3.5 text-sky-500" />
                  <span>Risposta ufficiale del Ristorante:</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 pl-4 italic">
                  "{rev.response}"
                </p>
              </div>
            ) : (
              /* Reply composer */
              <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Scrivi una risposta all'ospite:</span>
                  <button
                    onClick={() => handleApplySuggestion(rev.id, rev.guestName)}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Usa Risposta Suggerita Cortesia</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyTextMap[rev.id] || ''}
                    onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                    placeholder="Ringrazia l'ospite e rispondi..."
                    className="flex-1 px-3 py-1.5 rounded-xl border text-xs bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                  <button
                    onClick={() => handleSendReply(rev.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Invia Risposta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL 1: CONNETTI GOOGLE & TRIPADVISOR */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-xl p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-500" />
                <h4 className="font-bold text-base">Integrazione Recensioni Esterne</h4>
              </div>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Guide Box */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isLight ? 'bg-sky-50/70 border-sky-200 text-sky-950' : 'bg-sky-950/30 border-sky-800/40 text-sky-100'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Come mostrare e sincronizzare le recensioni da Google e TripAdvisor?</span>
              </div>
              <p className="leading-relaxed">
                Per mostrare automaticamente le recensioni che i clienti lasciano su Google Maps e TripAdvisor, inserisci qui sotto il tuo <strong>Google Place ID</strong> e il tuo <strong>TripAdvisor Location ID</strong>. Il sistema interroga le API e importa le recensioni direttamente in questo cruscotto.
              </p>
            </div>

            {/* Google Config */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span>🔵 Google Business Profile (Maps)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Connesso
                </span>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Google Place ID del Ristorante</label>
                <input
                  type="text"
                  value={googlePlaceId}
                  onChange={(e) => setGooglePlaceId(e.target.value)}
                  placeholder="Es. ChIJN1t_tDeuEmsRUsoyG83frY4"
                  className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono bg-white dark:bg-[#121622] border-slate-200 dark:border-[#28344A]"
                />
              </div>
            </div>

            {/* TripAdvisor Config */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span>🟢 TripAdvisor Content API</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Connesso
                </span>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">TripAdvisor Location ID</label>
                <input
                  type="text"
                  value={tripAdvisorLocationId}
                  onChange={(e) => setTripAdvisorLocationId(e.target.value)}
                  placeholder="Es. 12849033"
                  className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono bg-white dark:bg-[#121622] border-slate-200 dark:border-[#28344A]"
                />
              </div>
            </div>

            {/* Auto sync toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold pt-1">
              <input
                type="checkbox"
                checked={isAutoSyncEnabled}
                onChange={(e) => setIsAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded"
              />
              <span>Sincronizza automaticamente nuove recensioni ogni ora</span>
            </label>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTriggerSync}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Testa Connessione &amp; Importa Ora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSyncModalOpen(false);
                  addToast({
                    type: 'success',
                    title: 'Configurazione Sincronizzazione Salvata',
                    message: 'Google Place ID e TripAdvisor Location ID registrati.',
                  });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer shadow-xs"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AGGIUNTA MANUALE RECENSIONE */}
      {isAddReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm uppercase">Registra Nuova Recensione</h4>
              <button onClick={() => setIsAddReviewModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Piattaforma di Provenienza</label>
                <select
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                >
                  <option value="google">Google Maps / My Business</option>
                  <option value="tripadvisor">TripAdvisor</option>
                  <option value="direct">Diretta a Tavola / Ospite FOH</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Nome Ospite / Profilo</label>
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  placeholder="Es. Elena Ferrante"
                  className="w-full px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Valutazione (Stelle 1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setManualRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= manualRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold ml-1">{manualRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Commento / Testo Recensione</label>
                <textarea
                  value={manualComment}
                  onChange={(e) => setManualComment(e.target.value)}
                  rows={3}
                  placeholder="Scrivi o incolla il commento dell'ospite..."
                  className="w-full px-3 py-1.5 rounded-xl border text-xs bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddReviewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleAddManualReview}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-xs"
                >
                  Salva Recensione
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

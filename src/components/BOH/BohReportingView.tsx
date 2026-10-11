import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  TrendingUp,
  Users,
  Euro,
  Star,
  Flame,
  Calendar,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Sparkles,
  BarChart3,
  PieChart,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const BohReportingView: React.FC = () => {
  const { theme, isHighContrast } = useRestaurant();
  const isLight = theme === 'light';

  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d'>('30d');
  const [activeReportTab, setActiveReportTab] = useState<'benchmark' | 'heatmap' | 'occupancy' | 'noshow'>('benchmark');

  // Heatmap days and slots
  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const slots = ['12:00', '13:00', '14:00', '19:30', '20:30', '21:30', '22:30'];

  // Dynamic metrics per timeRange
  const rangeData = {
    today: {
      label: 'Oggi',
      totalCovers: '142',
      coversDelta: '+8.5%',
      marketCoversAvg: '115 coperti',
      marketShareText: '+23% rispetto alla media locale',
      avgSpend: '€76,20',
      spendDelta: '+5.4%',
      marketSpendAvg: '€61,50',
      totalRevenue: '€10.820',
      rating: '4.95 / 5',
      positivePct: '100% positivi',
      reviewCountText: 'Basato su 12 recensioni di oggi',
      noShowRate: '0.7%',
      noShowDelta: '-1.4%',
      marketNoShow: '4.8%',
      occupancy: '91%',
      topDish: 'Plin della Tradizione (38 porzioni)',
      wineShare: '36% del conto',
      demandMatrix: {
        Lun: [0, 0, 0, 1, 1, 1, 0],
        Mar: [1, 2, 1, 2, 3, 2, 1],
        Mer: [1, 2, 1, 2, 3, 3, 1],
        Gio: [2, 3, 2, 3, 3, 3, 2],
        Ven: [2, 3, 2, 3, 3, 3, 2],
        Sab: [3, 3, 2, 3, 3, 3, 3],
        Dom: [3, 3, 2, 2, 2, 1, 0],
      },
    },
    '7d': {
      label: 'Ultimi 7 Giorni',
      totalCovers: '864',
      coversDelta: '+12.1%',
      marketCoversAvg: '680 coperti',
      marketShareText: '+27% di quota mercato settimanale',
      avgSpend: '€77,40',
      spendDelta: '+6.1%',
      marketSpendAvg: '€62,00',
      totalRevenue: '€66.873',
      rating: '4.93 / 5',
      positivePct: '99% positivi',
      reviewCountText: 'Basato su 84 recensioni questa settimana',
      noShowRate: '1.4%',
      noShowDelta: '-1.1%',
      marketNoShow: '5.2%',
      occupancy: '85%',
      topDish: 'Battuta di Fassona con Tartufo (192 porzioni)',
      wineShare: '38% del conto',
      demandMatrix: {
        Lun: [0, 0, 0, 1, 2, 1, 0],
        Mar: [1, 2, 1, 2, 3, 2, 1],
        Mer: [2, 2, 1, 2, 3, 3, 1],
        Gio: [2, 3, 2, 3, 3, 3, 2],
        Ven: [3, 3, 2, 3, 3, 3, 3],
        Sab: [3, 3, 3, 3, 3, 3, 3],
        Dom: [3, 3, 2, 2, 2, 1, 0],
      },
    },
    '30d': {
      label: 'Ultimi 30 Giorni',
      totalCovers: '3.420',
      coversDelta: '+16.4%',
      marketCoversAvg: '2.680 coperti',
      marketShareText: '+27.6% di quota di mercato',
      avgSpend: '€78,50',
      spendDelta: '+6.8%',
      marketSpendAvg: '€62,00',
      totalRevenue: '€268.470',
      rating: '4.92 / 5',
      positivePct: '98% positivi',
      reviewCountText: 'Basato su 418 recensioni verificate',
      noShowRate: '1.8%',
      noShowDelta: '-0.9%',
      marketNoShow: '5.4%',
      occupancy: '87%',
      topDish: 'Brasato al Barolo DOCG (740 porzioni)',
      wineShare: '41% del conto',
      demandMatrix: {
        Lun: [0, 0, 0, 1, 1, 1, 0],
        Mar: [1, 2, 1, 2, 3, 2, 1],
        Mer: [1, 2, 1, 2, 3, 3, 1],
        Gio: [2, 3, 2, 3, 3, 3, 2],
        Ven: [2, 3, 2, 3, 3, 3, 2],
        Sab: [3, 3, 2, 3, 3, 3, 3],
        Dom: [3, 3, 2, 2, 2, 1, 0],
      },
    },
    '90d': {
      label: 'Ultimo Trimestre',
      totalCovers: '10.150',
      coversDelta: '+19.8%',
      marketCoversAvg: '7.950 coperti',
      marketShareText: '+28.2% quota record rispetto alla concorrenza',
      avgSpend: '€79,80',
      spendDelta: '+8.2%',
      marketSpendAvg: '€63,10',
      totalRevenue: '€809.970',
      rating: '4.91 / 5',
      positivePct: '98.5% positivi',
      reviewCountText: 'Basato su 1.280 recensioni verificate',
      noShowRate: '2.0%',
      noShowDelta: '-1.3%',
      marketNoShow: '5.6%',
      occupancy: '89%',
      topDish: 'Degustazione Classici Piemonte (2.410 menù)',
      wineShare: '42% del conto',
      demandMatrix: {
        Lun: [0, 0, 0, 1, 2, 1, 0],
        Mar: [1, 2, 1, 2, 3, 2, 1],
        Mer: [2, 2, 1, 2, 3, 3, 2],
        Gio: [2, 3, 2, 3, 3, 3, 2],
        Ven: [3, 3, 2, 3, 3, 3, 3],
        Sab: [3, 3, 3, 3, 3, 3, 3],
        Dom: [3, 3, 2, 2, 2, 1, 1],
      },
    },
  };

  const current = rangeData[timeRange];
  const demandMatrix = current.demandMatrix;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & DATE RANGE FILTER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-medium">
            <BarChart3 className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Reporting & Market Insights Dashboard
            </h3>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Analisi delle performance del ristorante rispetto ai benchmark dei locali concorrenti della zona.
            </p>
          </div>
        </div>

        {/* Segmented Time Control */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${
          isLight ? 'border-slate-200/70 bg-slate-100/60' : 'border-[#222A3C] bg-[#151B2A]'
        }`}>
          {[
            { id: 'today' as const, label: 'Oggi' },
            { id: '7d' as const, label: '7 Giorni' },
            { id: '30d' as const, label: 'Ultimi 30 Giorni' },
            { id: '90d' as const, label: 'Trimestre' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                timeRange === t.id
                  ? isLight
                    ? 'bg-white text-slate-800 border-slate-200/80 shadow-2xs'
                    : 'bg-[#1E2536] text-slate-100 border-[#2C364D] shadow-2xs'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. TOP BENCHMARK KPI METRICS vs LOCAL RESTAURANTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: COVERS */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-2 ${
          isLight ? 'bg-white/80 border-slate-200/70 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Coperti ({current.label})</span>
            <Users className="w-4 h-4 text-sky-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">{current.totalCovers}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> {current.coversDelta}
            </span>
          </div>
          <div className="text-[11px] font-normal text-slate-500 pt-1 border-t border-slate-100 dark:border-white/5">
            Media mercato locale: <strong className="font-semibold text-slate-700 dark:text-slate-300">{current.marketCoversAvg}</strong> ({current.marketShareText})
          </div>
        </div>

        {/* KPI 2: SPEND PER COVER */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-2 ${
          isLight ? 'bg-white/80 border-slate-200/70 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Spesa Media / Coperto</span>
            <Euro className="w-4 h-4 text-emerald-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">{current.avgSpend}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> {current.spendDelta}
            </span>
          </div>
          <div className="text-[11px] font-normal text-slate-500 pt-1 border-t border-slate-100 dark:border-white/5">
            Media concorrenti: <strong className="font-semibold text-slate-700 dark:text-slate-300">{current.marketSpendAvg}</strong> (Fatturato: {current.totalRevenue})
          </div>
        </div>

        {/* KPI 3: FEEDBACK RATING */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-2 ${
          isLight ? 'bg-white/80 border-slate-200/70 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Feedback &amp; Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">{current.rating}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {current.positivePct}
            </span>
          </div>
          <div className="text-[11px] font-normal text-slate-500 pt-1 border-t border-slate-100 dark:border-white/5">
            {current.reviewCountText}
          </div>
        </div>

        {/* KPI 4: NO-SHOW RATE */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-2 ${
          isLight ? 'bg-white/80 border-slate-200/70 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tasso No-Show</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">{current.noShowRate}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowDownRight className="w-3.5 h-3.5" /> {current.noShowDelta}
            </span>
          </div>
          <div className="text-[11px] font-normal text-slate-500 pt-1 border-t border-slate-100 dark:border-white/5">
            Media zona: <strong className="font-semibold text-slate-700 dark:text-slate-300">{current.marketNoShow}</strong> (Occupazione sala: {current.occupancy})
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: FATTURATO, OCCUPAZIONE & TOP DISH */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          isLight ? 'bg-white/80 border-slate-200/70 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
        }`}>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Fatturato Stimato ({current.label})</span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{current.totalRevenue}</span>
          <p className="text-[11px] text-slate-500 pt-1">Incassi diretti sala &amp; degustazioni</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          isLight ? 'bg-white/80 border-slate-200/70 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
        }`}>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Piatto Più Ordinato</span>
          <span className="text-sm font-bold truncate block">{current.topDish}</span>
          <p className="text-[11px] text-slate-500 pt-1">Best-seller della cucina nel periodo</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          isLight ? 'bg-white/80 border-slate-200/70 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
        }`}>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Incidenza Vino &amp; Beverage</span>
          <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">{current.wineShare}</span>
          <p className="text-[11px] text-slate-500 pt-1">Etichette al calice &amp; bottiglie della cantina</p>
        </div>
      </div>

      {/* 3. MARKET INSIGHTS HEAT MAP */}
      <div className={`p-5 rounded-2xl border shadow-2xs space-y-4 ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#141A29] border-[#222A3C]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <h4 className="font-medium text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-amber-500 stroke-[1.5]" />
              <span>Mappa Termica di Mercato (Demand & Spend Heat Map)</span>
            </h4>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Rilevamento orari di massimo afflusso e spesa più alta nei ristoranti limitrofi.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-normal text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
              <span>Bassa</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-200 dark:bg-amber-800/60 border border-amber-300 dark:border-amber-700" />
              <span>Media</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-200 dark:bg-rose-800/60 border border-rose-300 dark:border-rose-700" />
              <span>Picco / Alta Spesa</span>
            </span>
          </div>
        </div>

        {/* Interactive Heat Map Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs font-black uppercase text-slate-500">Giorno</th>
                {slots.map((s) => (
                  <th key={s} className="p-2 text-xs font-black font-mono text-slate-700 dark:text-slate-300">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const row = demandMatrix[day] || [0, 0, 0, 0, 0, 0, 0];
                return (
                  <tr key={day} className="border-t border-slate-100 dark:border-white/5">
                    <td className="p-2.5 text-left font-medium text-xs text-slate-700 dark:text-slate-200">
                      {day}
                    </td>
                    {row.map((lvl, idx) => {
                      const colorCls =
                        lvl === 3
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40 font-medium'
                          : lvl === 2
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40 font-medium'
                          : lvl === 1
                          ? 'bg-sky-50 text-sky-700 border border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/40 font-normal'
                          : isLight ? 'bg-slate-50/70 text-slate-400 border border-slate-100' : 'bg-slate-900/40 text-slate-600 border border-white/5';
                      return (
                        <td key={idx} className="p-1">
                          <div
                            className={`w-full py-2 rounded-xl text-xs transition cursor-pointer select-none hover:opacity-90 ${colorCls}`}
                            title={`${day} ore ${slots[idx]}: Intensità domanda ${lvl}/3`}
                          >
                            {lvl === 3 ? '🔥 Picco' : lvl === 2 ? '⚡ Forte' : lvl === 1 ? 'Moderato' : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. STRATEGIC ACTIONABLE SUGGESTIONS */}
      <div className={`p-5 rounded-2xl border shadow-2xs space-y-3 ${
        isLight
          ? 'bg-gradient-to-r from-sky-50/60 via-white to-blue-50/60 border-sky-200/70 text-slate-800'
          : 'bg-[#141A29] border-[#222A3C] text-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4.5 h-4.5 text-amber-500 stroke-[1.5]" />
          <h4 className="font-semibold text-xs uppercase tracking-wider text-sky-900 dark:text-sky-300">
            Suggerimenti Strategici per Massimizzare i Ricavi
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
          <div className="p-3.5 rounded-xl bg-white/90 dark:bg-black/20 border border-sky-200/60 dark:border-sky-900/40 space-y-1 shadow-2xs">
            <strong className="block font-medium text-slate-800 dark:text-slate-100">Martedì e Mercoledì a Pranzo:</strong>
            <p className="text-slate-600 dark:text-slate-400 font-normal">
              I ristoranti vicini registrano un +18% di coperti aziendali. Valuta di promuovere un Business Lunch a €35 con la funzione Email Marketing.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/90 dark:bg-black/20 border border-sky-200/60 dark:border-sky-900/40 space-y-1 shadow-2xs">
            <strong className="block font-medium text-slate-800 dark:text-slate-100">Venerdì ore 22:30 Secondo Turno:</strong>
            <p className="text-slate-600 dark:text-slate-400 font-normal">
              La domanda locale è al massimo (+40%). Riduci il turn time di 15 min nei tavoli da 2 persone per aprire 6 slot di prenotazione extra.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/90 dark:bg-black/20 border border-sky-200/60 dark:border-sky-900/40 space-y-1 shadow-2xs">
            <strong className="block font-medium text-slate-800 dark:text-slate-100">Programma Fedeltà & Riconoscimento:</strong>
            <p className="text-slate-600 dark:text-slate-400 font-normal">
              I clienti frequenti con tag VIP hanno generato il 34% dei ricavi totali questo mese. Invia loro un invito esclusivo per il nuovo menu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

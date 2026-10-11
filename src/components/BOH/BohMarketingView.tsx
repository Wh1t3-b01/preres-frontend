import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Megaphone,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  Euro,
  MousePointerClick,
  Plus,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
  Palette,
  BarChart,
  FileText,
  X,
  Eye,
  Edit2,
  ArrowUpRight,
  Check,
} from 'lucide-react';

export interface MarketingCampaign {
  id: string;
  title: string;
  type: 'email_blast' | 'automated_flow' | 'boost_promoted' | 'special_offer';
  audienceSegment: 'all' | 'vip' | 'frequent' | 'lapsed';
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  sentDate: string;
  recipientsCount: number;
  openRate: number; // e.g. 48.2%
  clickRate: number; // e.g. 14.5%
  coversGenerated: number;
  revenueGenerated: number;
}

export interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  desc: string;
  content: string;
  badge: string;
}

const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp_1',
    title: 'Lancio Menù Tartufo Bianco & Barolo Riserva',
    type: 'email_blast',
    audienceSegment: 'vip',
    status: 'completed',
    sentDate: '2026-10-02',
    recipientsCount: 420,
    openRate: 64.2,
    clickRate: 28.5,
    coversGenerated: 84,
    revenueGenerated: 7140,
  },
  {
    id: 'camp_2',
    title: 'Automazione Recall Post-Dining (30gg di assenza)',
    type: 'automated_flow',
    audienceSegment: 'lapsed',
    status: 'active',
    sentDate: 'Attiva Giornalmente',
    recipientsCount: 180,
    openRate: 51.0,
    clickRate: 19.2,
    coversGenerated: 36,
    revenueGenerated: 2880,
  },
  {
    id: 'camp_3',
    title: 'Weekend Boost Promoted Placement Prenotazioni Dirette',
    type: 'boost_promoted',
    audienceSegment: 'all',
    status: 'active',
    sentDate: '2026-10-01 - 2026-10-31',
    recipientsCount: 3500,
    openRate: 100,
    clickRate: 12.8,
    coversGenerated: 162,
    revenueGenerated: 12630,
  },
];

const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_1',
    title: 'Conferma Prenotazione & Benvenuto',
    subject: 'La tua prenotazione è confermata — Sotto Sotto Bar & Grill',
    desc: 'Inviata automaticamente subito dopo la prenotazione con mappa, orario e note intolleranze.',
    content: 'Gentile {NOME_CLIENTE}, siamo lieti di confermare la tua prenotazione per {OSPITI} persone il {DATA} alle {ORA}. Il tuo tavolo è riservato.',
    badge: 'Automatico FOH',
  },
  {
    id: 'tpl_2',
    title: 'Recall 30 Giorni "Ci manchi a tavola"',
    subject: 'È passato un po’ di tempo: ti aspetta un calice speciale da Sotto Sotto',
    desc: 'Trigger automatico per clienti che non cenano da 30+ giorni con calice di benvenuto offerto.',
    content: 'Caro {NOME_CLIENTE}, è trascorso un mese dalla tua ultima cena con noi! Torna a trovarci questo weekend: un calice di Nebbiolo delle Langhe ti aspetta in omaggio.',
    badge: 'Retention',
  },
  {
    id: 'tpl_3',
    title: 'Auguri di Compleanno & Sorpresa Chef',
    subject: 'Buon Compleanno da Sotto Sotto! Festeggia con noi a cena',
    desc: 'Inviata 7 giorni prima del compleanno con invito a festeggiare e dessert in omaggio.',
    content: 'Tanti auguri {NOME_CLIENTE}! Per festeggiare il tuo giorno speciale, prenota un tavolo questa settimana: il dessert dello Chef e una bottiglia di bollicine sono offerti da noi!',
    badge: 'Anniversari',
  },
];

export const BohMarketingView: React.FC = () => {
  const { theme, isHighContrast, addToast } = useRestaurant();
  const isLight = theme === 'light';

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_CAMPAIGNS);
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);
  const [subTab, setSubTab] = useState<'insights' | 'campaigns' | 'email_builder'>('insights');

  // Modals state
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [selectedCampaignForStats, setSelectedCampaignForStats] = useState<MarketingCampaign | null>(null);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<EmailTemplate | null>(null);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);

  // New Campaign Form
  const [campTitle, setCampTitle] = useState('');
  const [campType, setCampType] = useState<MarketingCampaign['type']>('email_blast');
  const [campSegment, setCampSegment] = useState<MarketingCampaign['audienceSegment']>('vip');

  // New Template Form
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplSubject, setNewTplSubject] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplContent, setNewTplContent] = useState('');

  const totalRev = campaigns.reduce((acc, c) => acc + c.revenueGenerated, 0);
  const totalCovers = campaigns.reduce((acc, c) => acc + c.coversGenerated, 0);

  const handleCreateCampaign = () => {
    if (!campTitle.trim()) {
      alert('Inserisci il titolo della campagna');
      return;
    }

    const newCamp: MarketingCampaign = {
      id: `camp_${Date.now()}`,
      title: campTitle,
      type: campType,
      audienceSegment: campSegment,
      status: 'scheduled',
      sentDate: 'Programmata (Prossima finestra)',
      recipientsCount: campSegment === 'vip' ? 320 : campSegment === 'frequent' ? 680 : 1250,
      openRate: 0,
      clickRate: 0,
      coversGenerated: 0,
      revenueGenerated: 0,
    };

    setCampaigns([newCamp, ...campaigns]);
    setIsNewCampaignModalOpen(false);
    setCampTitle('');
    addToast({
      type: 'success',
      title: 'Campagna Creata e Programmata',
      message: `"${newCamp.title}" pronta per l'invio al segmento ${campSegment.toUpperCase()}.`,
    });
  };

  const handleCreateTemplate = () => {
    if (!newTplTitle.trim() || !newTplSubject.trim()) {
      alert('Inserisci titolo e oggetto del template');
      return;
    }

    const newTpl: EmailTemplate = {
      id: `tpl_${Date.now()}`,
      title: newTplTitle,
      subject: newTplSubject,
      desc: newTplDesc || 'Template personalizzato dal ristoratore.',
      content: newTplContent || 'Gentile {NOME_CLIENTE}, ti invitiamo a vivere una nuova esperienza culinaria da Sotto Sotto.',
      badge: 'Personalizzato',
    };

    setTemplates([...templates, newTpl]);
    setIsNewTemplateModalOpen(false);
    setNewTplTitle('');
    setNewTplSubject('');
    setNewTplDesc('');
    setNewTplContent('');
    addToast({
      type: 'success',
      title: 'Nuovo Template Salvato',
      message: `"${newTpl.title}" aggiunto alla libreria template email.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. MASTER HEADER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-medium">
            <Megaphone className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Marketing &amp; Email Marketing OS
            </h3>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Performance insights, promozioni direct booking, campagne email pre/post-dining e fidelizzazione segmentata.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewCampaignModalOpen(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-2xs flex items-center gap-2 cursor-pointer transition active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>+ Nuova Campagna Marketing</span>
        </button>
      </div>

      {/* 2. SUB-TABS */}
      <div className="flex items-center gap-1.5 border-b pb-2 border-slate-200/70 dark:border-white/5 overflow-x-auto">
        {[
          { id: 'insights' as const, label: 'Performance Insights & ROI', icon: TrendingUp },
          { id: 'campaigns' as const, label: `Gestione Campagne (${campaigns.length})`, icon: Megaphone },
          { id: 'email_builder' as const, label: `Email Marketing & Template (${templates.length})`, icon: Mail },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-white border-sky-400 shadow-2xs font-bold'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-[#161C2A] hover:bg-[#1E2536] text-slate-300 border-[#242C3E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: PERFORMANCE INSIGHTS */}
      {subTab === 'insights' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
              isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
            }`}>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Ricavi Totali Attribuiti</span>
              <span className="text-2xl font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                €{totalRev.toLocaleString('it-IT')}
              </span>
              <p className="text-[11px] text-slate-500 pt-1">ROI stimato: 14.8x sull'investimento marketing</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
              isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
            }`}>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Coperti Aggiuntivi Generati</span>
              <span className="text-2xl font-semibold font-mono">{totalCovers} ospiti</span>
              <p className="text-[11px] text-slate-500 pt-1">Coperti diretti da campagne email &amp; Boost Prenotazioni</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
              isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
            }`}>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Tasso di Apertura Medio</span>
              <span className="text-2xl font-semibold font-mono text-purple-600 dark:text-purple-400">57.6%</span>
              <p className="text-[11px] text-slate-500 pt-1">+22% sopra la media di settore food &amp; beverage</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CAMPAIGNS LIST */}
      {subTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${
                isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                  <span className={`text-[9px] font-mono font-medium uppercase px-2 py-0.5 rounded-full border ${
                    camp.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                      : camp.status === 'scheduled'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {camp.status === 'active' ? '● In Corso' : camp.status === 'scheduled' ? '⏳ Programmata' : '✓ Conclusa'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{camp.sentDate}</span>
                </div>

                <h4 className="font-semibold text-sm mt-2.5">
                  {camp.title}
                </h4>

                <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Segmento:</span>
                    <strong className="text-slate-800 dark:text-slate-200 uppercase text-[10px]">{camp.audienceSegment}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Destinatari:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{camp.recipientsCount}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Aperture:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{camp.openRate}%</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Coperti Generati:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{camp.coversGenerated} pax</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ricavi Generati:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">€{camp.revenueGenerated.toLocaleString('it-IT')}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedCampaignForStats(camp)}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center justify-end gap-1 w-full"
                >
                  <span>Visualizza Statistiche Dettagliate</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: EMAIL MARKETING & TEMPLATES */}
      {subTab === 'email_builder' && (
        <div className={`p-5 rounded-2xl border shadow-2xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#141A29] border-[#222A3C]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                Template Email con Branding Ristorante
              </h4>
              <p className="text-xs text-slate-500">
                Personalizza logo, colori sociali, foto e pulsanti CTA per newsletter e auguri di compleanno.
              </p>
            </div>
            <button
              onClick={() => setIsNewTemplateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuovo Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-xl border bg-slate-50 dark:bg-[#101522] border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {tpl.badge}
                    </span>
                  </div>
                  <h5 className="font-semibold text-xs text-slate-900 dark:text-white pt-1">{tpl.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <button
                    onClick={() => setSelectedTemplateForPreview(tpl)}
                    className="hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modifica Grafica</span>
                  </button>
                  <button
                    onClick={() => setSelectedTemplateForPreview(tpl)}
                    className="hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Anteprima →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: STATISTICHE DETTAGLIATE CAMPAGNA */}
      {selectedCampaignForStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-xl p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Statistiche Dettagliate Marketing</span>
                <h4 className="font-bold text-base">{selectedCampaignForStats.title}</h4>
              </div>
              <button
                onClick={() => setSelectedCampaignForStats(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#182030] border border-slate-200/70 dark:border-[#242C3E]">
                <span className="text-[10px] uppercase text-slate-400 block font-medium">Inviate</span>
                <span className="text-base font-bold font-mono">{selectedCampaignForStats.recipientsCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#182030] border border-slate-200/70 dark:border-[#242C3E]">
                <span className="text-[10px] uppercase text-slate-400 block font-medium">Tasso Aperture</span>
                <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
                  {selectedCampaignForStats.openRate}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#182030] border border-slate-200/70 dark:border-[#242C3E]">
                <span className="text-[10px] uppercase text-slate-400 block font-medium">Click CTA</span>
                <span className="text-base font-bold font-mono text-sky-600 dark:text-sky-400">
                  {selectedCampaignForStats.clickRate}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#182030] border border-slate-200/70 dark:border-[#242C3E]">
                <span className="text-[10px] uppercase text-slate-400 block font-medium">Coperti Generati</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedCampaignForStats.coversGenerated} pax
                </span>
              </div>
            </div>

            {/* Performance Timeline Visualization */}
            <div className="p-4 rounded-2xl border bg-slate-50/60 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E] space-y-3">
              <span className="text-xs font-bold block">Progresso Aperture &amp; Conversioni nelle 48 Ore:</span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] pb-1">
                    <span>Prime 4 Ore (Picco Notifiche)</span>
                    <strong className="font-mono">42% aperture</strong>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] pb-1">
                    <span>Entro 24 Ore</span>
                    <strong className="font-mono">58% aperture</strong>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '58%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] pb-1">
                    <span>Prenotazioni Tavolo Generate</span>
                    <strong className="font-mono text-emerald-600">{selectedCampaignForStats.coversGenerated} coperti</strong>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '74%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Report Campagna Esportato',
                    message: 'Statistiche CSV inviate all’email amministratore.',
                  });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Esporta Report Completo
              </button>
              <button
                type="button"
                onClick={() => setSelectedCampaignForStats(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-xs"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ANTEPRIMA & MODIFICA TEMPLATE EMAIL */}
      {selectedTemplateForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-2xl p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Editor Grafico &amp; Anteprima Email</span>
                <h4 className="font-bold text-base">{selectedTemplateForPreview.title}</h4>
              </div>
              <button
                onClick={() => setSelectedTemplateForPreview(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Subject */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Oggetto dell'Email</label>
              <input
                type="text"
                value={selectedTemplateForPreview.subject}
                onChange={(e) =>
                  setSelectedTemplateForPreview({
                    ...selectedTemplateForPreview,
                    subject: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
              />
            </div>

            {/* Rendered Email Card */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isLight ? 'bg-slate-50/80 border-slate-200 text-slate-800' : 'bg-[#182030] border-[#28344A] text-slate-100'
            }`}>
              <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="font-brand font-bold text-lg text-amber-500 uppercase tracking-widest">
                  SOTTO SOTTO
                </span>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Bar &amp; Grill · Torino</p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-sm">{selectedTemplateForPreview.subject}</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedTemplateForPreview.content}
                </p>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xs"
                >
                  Prenota il Tuo Tavolo Ora
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-center text-[10px] text-slate-400 italic">
                Sotto Sotto Bar &amp; Grill · Via San Quintino 22, Torino · Per disiscriverti clicca qui.
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Email di Prova Spedita!',
                    message: 'Controlla la tua casella di posta ironwhisper69@gmail.com.',
                  });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invia Test a ironwhisper69@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplates(templates.map((t) => (t.id === selectedTemplateForPreview.id ? selectedTemplateForPreview : t)));
                  setSelectedTemplateForPreview(null);
                  addToast({
                    type: 'success',
                    title: 'Template Salvato',
                    message: 'Modifiche alla grafica e all’oggetto registrate con successo.',
                  });
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-xs"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NUOVO TEMPLATE */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm uppercase">Crea Nuovo Template Email</h4>
              <button onClick={() => setIsNewTemplateModalOpen(false)} className="text-xs font-bold text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Nome Template</label>
                <input
                  type="text"
                  value={newTplTitle}
                  onChange={(e) => setNewTplTitle(e.target.value)}
                  placeholder="Es. Invito Serata Vini Piemontesi"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Oggetto dell'Email</label>
                <input
                  type="text"
                  value={newTplSubject}
                  onChange={(e) => setNewTplSubject(e.target.value)}
                  placeholder="Es. Degustazione Esclusiva Barolo e Plin"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Descrizione Breve</label>
                <input
                  type="text"
                  value={newTplDesc}
                  onChange={(e) => setNewTplDesc(e.target.value)}
                  placeholder="Es. Inviato per eventi a tema e cene guidate"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Testo dell'Email</label>
                <textarea
                  value={newTplContent}
                  onChange={(e) => setNewTplContent(e.target.value)}
                  rows={3}
                  placeholder="Gentile {NOME_CLIENTE}, ti invitiamo a..."
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs"
                >
                  Crea Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: NUOVA CAMPAGNA */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm uppercase">Crea Nuova Campagna Marketing</h4>
              <button onClick={() => setIsNewCampaignModalOpen(false)} className="text-xs font-bold text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Nome Campagna</label>
                <input
                  type="text"
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  placeholder="Es. Invito Menu Primavera 2026"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Tipologia Campagna</label>
                <select
                  value={campType}
                  onChange={(e) => setCampType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                >
                  <option value="email_blast">Email Newsletter Singola</option>
                  <option value="automated_flow">Automazione Ricorrente Post-Dining</option>
                  <option value="boost_promoted">Posizionamento Promosso Prenotazioni Dirette</option>
                  <option value="special_offer">Offerta Speciale &amp; Calice di Benvenuto</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Segmento Destinatari</label>
                <select
                  value={campSegment}
                  onChange={(e) => setCampSegment(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                >
                  <option value="vip">Ospiti VIP &amp; Grandi Speditori (320 contatti)</option>
                  <option value="frequent">Clienti Abituali / Frequent (680 contatti)</option>
                  <option value="lapsed">Clienti Inattivi da 30+ gg (450 contatti)</option>
                  <option value="all">Tutto il Database Ristorante (1.250 contatti)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleCreateCampaign}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs"
                >
                  Attiva &amp; Pianifica Campagna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

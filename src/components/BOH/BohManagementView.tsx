import React, { useState, useEffect, useMemo } from 'react';
import {
  bohService,
  BohFullConfiguration,
} from '../../services/bohService';
import { FloorPlanLayoutEditor } from './FloorPlanLayoutEditor';
import { TableCombinationsView } from './TableCombinationsView';
import { BohRulesSettingsView } from './BohRulesSettingsView';
import { ShiftScheduleManagerView } from './ShiftScheduleManagerView';
import { SpecialDaysManagerView } from './SpecialDaysManagerView';
import { BohExperiencesView } from './BohExperiencesView';
import { BohReportingView } from './BohReportingView';
import { BohMenusView } from './BohMenusView';
import { BohMarketingView } from './BohMarketingView';
import { BohCommunicationsView } from './BohCommunicationsView';
import { BohGuestsView } from './BohGuestsView';
import { BohLoyaltyView } from './BohLoyaltyView';
import { BohReviewsView } from './BohReviewsView';
import { PublishDiffModal } from './PublishDiffModal';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Grid,
  Link2,
  Sliders,
  Clock,
  Calendar,
  UploadCloud,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Shield,
  BarChart3,
  UtensilsCrossed,
  Megaphone,
  MessageSquare,
  Users,
  Crown,
  Star,
  Contrast,
  Filter,
  ChevronDown,
} from 'lucide-react';

export type BohTab =
  | 'layouts'
  | 'combinations'
  | 'rules'
  | 'schedules'
  | 'special_days'
  | 'experiences'
  | 'reporting'
  | 'menus'
  | 'marketing'
  | 'communications'
  | 'guests'
  | 'loyalty'
  | 'reviews';

interface BohManagementViewProps {
  initialTab?: BohTab;
  onNavigateToFloor?: () => void;
}

export const BohManagementView: React.FC<BohManagementViewProps> = ({
  initialTab = 'layouts',
  onNavigateToFloor,
}) => {
  const { theme, addToast, updateTableDetails, resetToDefaults, applyBohLayout, isHighContrast, toggleHighContrast } = useRestaurant();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<BohTab>(initialTab);
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<'all' | 'floor' | 'management'>('all');

  // Configuration state
  const [draftConfig, setDraftConfig] = useState<BohFullConfiguration>(() => bohService.getDraftConfig());
  const [liveConfig, setLiveConfig] = useState<BohFullConfiguration>(() => bohService.getLiveConfig());
  const [hasDraftChanges, setHasDraftChanges] = useState<boolean>(() => bohService.hasDraftChanges());
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(() => bohService.getLastPublishedAt());
  const [changeLogs, setChangeLogs] = useState<string[]>(() => bohService.getDraftChangeLogs());

  // Active floor plan ID within the editor
  const [activeLayoutId, setActiveLayoutId] = useState<string>(() => {
    const defaultLayout = draftConfig.layouts.find((l) => l.isDefault) || draftConfig.layouts[0];
    return defaultLayout?.id || 'layout_main_default';
  });

  // Publish Modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Subscribe to service updates
  useEffect(() => {
    const unsubscribe = bohService.subscribe(() => {
      setDraftConfig(bohService.getDraftConfig());
      setLiveConfig(bohService.getLiveConfig());
      setHasDraftChanges(bohService.hasDraftChanges());
      setLastPublishedAt(bohService.getLastPublishedAt());
      setChangeLogs(bohService.getDraftChangeLogs());
    });
    return unsubscribe;
  }, []);

  // Currently viewed layout
  const activeLayout = useMemo(() => {
    return draftConfig.layouts.find((l) => l.id === activeLayoutId) || draftConfig.layouts[0];
  }, [draftConfig.layouts, activeLayoutId]);

  // Handlers for Floor Plan updates
  const handleUpdateLayout = (updatedLayout: typeof activeLayout, changeReason?: string) => {
    const nextLayouts = draftConfig.layouts.map((l) => (l.id === updatedLayout.id ? updatedLayout : l));
    bohService.saveDraft({ layouts: nextLayouts }, changeReason);
  };

  const handleCreateNewLayout = (name: string, copyFromId?: string) => {
    const source = copyFromId ? draftConfig.layouts.find((l) => l.id === copyFromId) : null;
    const newId = `layout_${Date.now().toString(36)}`;
    const newLayout = {
      id: newId,
      name,
      description: source ? `Copia da ${source.name}` : 'Nuovo layout personalizzato',
      isDefault: false,
      rotation: 0,
      canvasDimensions: source ? { ...source.canvasDimensions } : { widthMeters: 18, heightMeters: 12, gridScale: 50 },
      diningAreas: source ? JSON.parse(JSON.stringify(source.diningAreas)) : [],
      tables: source ? JSON.parse(JSON.stringify(source.tables)) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextLayouts = [...draftConfig.layouts, newLayout];
    bohService.saveDraft({ layouts: nextLayouts }, `Creato nuovo layout "${name}"`);
    setActiveLayoutId(newId);
  };

  const handleDeleteLayout = (layoutId: string) => {
    const nextLayouts = draftConfig.layouts.filter((l) => l.id !== layoutId);
    bohService.saveDraft({ layouts: nextLayouts }, `Eliminato layout`);
    if (activeLayoutId === layoutId) {
      setActiveLayoutId(nextLayouts[0]?.id || 'layout_main_default');
    }
  };

  // Handlers for Combinations
  const handleUpdateCombinations = (updated: typeof draftConfig.combinations, changeReason?: string) => {
    bohService.saveDraft({ combinations: updated }, changeReason);
  };

  // Handlers for Rules
  const handleUpdateRules = (updated: typeof draftConfig.rules, changeReason?: string) => {
    bohService.saveDraft({ rules: updated }, changeReason);
  };

  // Handlers for Schedules
  const handleUpdateSchedules = (updated: typeof draftConfig.schedules, changeReason?: string) => {
    bohService.saveDraft({ schedules: updated }, changeReason);
  };

  // Handlers for Special Days
  const handleUpdateSpecialDays = (updated: typeof draftConfig.specialDays, changeReason?: string) => {
    bohService.saveDraft({ specialDays: updated }, changeReason);
  };

  // Discard draft
  const handleDiscardDraft = () => {
    bohService.discardDraft();
    addToast({
      type: 'info',
      title: 'Bozza Scartata',
      message: 'Tutte le modifiche non pubblicate sono state ripristinate alla configurazione live.',
    });
  };

  // Publish draft live
  const handleConfirmPublish = () => {
    const res = bohService.publishDraft();
    if (res.success) {
      if (res.publishedLayout) {
        applyBohLayout(res.publishedLayout);
      }
      addToast({
        type: 'success',
        title: 'Modifiche BOH Pubblicate con Successo!',
        message: 'Floor plan, combinazioni, regole e orari sono stati distribuiti in tempo reale a tutti i terminali e alla Mappa Sala.',
      });
    }
  };

  const lastPublishedFormatted = useMemo(() => {
    if (!lastPublishedAt) return 'Mai pubblicata';
    const d = new Date(lastPublishedAt);
    return `${d.toLocaleDateString('it-IT')} ore ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
  }, [lastPublishedAt]);

  const floorTabs = [
    { id: 'layouts' as const, label: '1. Pianta Sale 1:1', icon: Grid, count: draftConfig.layouts.length },
    { id: 'combinations' as const, label: '2. Combinazioni', icon: Link2, count: draftConfig.combinations.length },
    { id: 'rules' as const, label: '3. Regole', icon: Sliders },
    { id: 'schedules' as const, label: '4. Turni & Pacing', icon: Clock },
    { id: 'special_days' as const, label: '5. Giorni Speciali', icon: Calendar, count: draftConfig.specialDays.length },
    { id: 'experiences' as const, label: '6. Esperienze', icon: Sparkles },
  ];

  const managementTabs = [
    { id: 'reporting' as const, label: 'Reportistica & Heatmap', icon: BarChart3 },
    { id: 'menus' as const, label: 'Menù', icon: UtensilsCrossed },
    { id: 'marketing' as const, label: 'Marketing & Email', icon: Megaphone },
    { id: 'communications' as const, label: 'Comunicazioni', icon: MessageSquare },
    { id: 'guests' as const, label: 'Clienti & Pre-Conto', icon: Users },
    { id: 'loyalty' as const, label: 'Fedeltà', icon: Crown },
    { id: 'reviews' as const, label: 'Recensioni', icon: Star },
  ];

  return (
    <div className={`space-y-4 max-w-[1780px] mx-auto pb-16 transition-colors ${
      isLight ? 'text-slate-900' : 'text-slate-100'
    }`}>
      
      {/* 1. MASTER STICKY BOH NAVIGATION BAR - 100% VISIBLE & ACCESSIBLE ON ALL DEVICES */}
      <div className={`sticky top-12 sm:top-14 z-30 p-3 sm:p-4 rounded-2xl border shadow-md backdrop-blur-xl transition-all space-y-3 ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-slate-200/60'
          : 'bg-[#101420]/95 border-[#222A3C] shadow-black/50'
      }`}>
        {/* Row 1: Header Info & Publishing Actions & Quick Filter */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/70 dark:border-white/5">
          {/* Left: Title & Live Status */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-medium shadow-2xs border shrink-0 ${
              hasDraftChanges
                ? isLight
                  ? 'bg-amber-100/70 text-amber-700 border-amber-200/80'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                : isLight
                ? 'bg-sky-50 text-sky-700 border-sky-200/60'
                : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
            }`}>
              <Sliders className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base sm:text-lg font-brand font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  BOH Management OS
                </h2>
                <span className={`text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded-full border ${
                  hasDraftChanges
                    ? isLight
                      ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                      : 'bg-amber-950/30 text-amber-300 border-amber-800/40'
                    : isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                    : 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                }`}>
                  {hasDraftChanges ? '● Bozza con modifiche' : '✓ Live & Sincronizzato'}
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs mt-0.5 hidden sm:block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Piante sale 1:1, combinazioni, regole capienze, orari turni, festività e moduli operativi.
              </p>
            </div>
          </div>

          {/* Center: View Filter Pills (Tutti 14, Sala & Piante 6, Moduli Gestione 8) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border self-start xl:self-center shrink-0 overflow-x-auto max-w-full">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Filtra:</span>
            </span>
            <button
              onClick={() => setModuleCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                moduleCategoryFilter === 'all'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-2xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 border-slate-200'
                  : 'bg-[#182030] hover:bg-[#202A3C] text-slate-300 border-[#28344A]'
              }`}
            >
              Tutti i Moduli (14)
            </button>
            <button
              onClick={() => setModuleCategoryFilter('floor')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                moduleCategoryFilter === 'floor'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-2xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 border-slate-200'
                  : 'bg-[#182030] hover:bg-[#202A3C] text-slate-300 border-[#28344A]'
              }`}
            >
              Sala &amp; Piante (6)
            </button>
            <button
              onClick={() => setModuleCategoryFilter('management')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                moduleCategoryFilter === 'management'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-2xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 border-slate-200'
                  : 'bg-[#182030] hover:bg-[#202A3C] text-slate-300 border-[#28344A]'
              }`}
            >
              Gestione &amp; Moduli (8)
            </button>
          </div>

          {/* Right: Draft Actions & Publish CTA */}
          <div className="flex items-center gap-2 self-end xl:self-center shrink-0 flex-wrap">
            <div className="text-right hidden md:block">
              <span className={`text-[9px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ultimo Rilascio:</span>
              <span className={`text-[10px] font-mono font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {lastPublishedFormatted}
              </span>
            </div>

            {hasDraftChanges && (
              <button
                onClick={() => {
                  if (window.confirm('Scartare tutte le modifiche in bozza?')) {
                    handleDiscardDraft();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 transition cursor-pointer flex items-center gap-1.5"
                title="Annulla modifiche bozza"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
                <span className="hidden sm:inline">Scarta Bozza</span>
              </button>
            )}

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer border ${
                hasDraftChanges
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400/40 shadow-amber-500/20'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                  : 'bg-[#182030] hover:bg-[#202A3C] text-slate-200 border-[#28344A]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{hasDraftChanges ? 'Pubblica Live' : 'Stato'}</span>
            </button>
          </div>
        </div>

        {/* Quick Dropdown on Mobile */}
        <div className="sm:hidden flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Modulo:</span>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as BohTab)}
            className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#171D2B] border-[#273248] text-slate-100'
            }`}
          >
            <optgroup label="Sala, Piante & Disponibilità">
              {floorTabs.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </optgroup>
            <optgroup label="Moduli Operativi & Gestione">
              {managementTabs.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Row 2: MODULE BUTTONS - FULL VISIBILITY WITH WRAP & NO OVERFLOW CLIPPING */}
        <div className="space-y-2">
          {/* Section A: Sala & Disponibilità (Piante sale, combinazioni, regole, etc.) */}
          {(moduleCategoryFilter === 'all' || moduleCategoryFilter === 'floor') && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg border shrink-0 ${
                isLight ? 'bg-sky-50 text-sky-700 border-sky-200/80' : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
              }`}>
                Sala &amp; Piante:
              </span>
              {floorTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                      isActive
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-400 shadow-xs scale-[1.02]'
                        : isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/80 font-medium'
                        : 'bg-[#161C2A] hover:bg-[#1E2536] text-slate-300 hover:text-white border-[#242C3E] font-medium'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 stroke-[1.8]" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white font-bold'
                          : isLight
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-[#121622] text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Section B: Moduli Operativi & Gestione */}
          {(moduleCategoryFilter === 'all' || moduleCategoryFilter === 'management') && (
            <div className={`flex flex-wrap items-center gap-1.5 ${
              moduleCategoryFilter === 'all' ? 'pt-1.5 border-t border-slate-200/60 dark:border-white/5' : ''
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg border shrink-0 ${
                isLight ? 'bg-purple-50 text-purple-700 border-purple-200/80' : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
              }`}>
                Moduli &amp; Gestione:
              </span>
              {managementTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                      isActive
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-400 shadow-xs scale-[1.02]'
                        : isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/80 font-medium'
                        : 'bg-[#161C2A] hover:bg-[#1E2536] text-slate-300 hover:text-white border-[#242C3E] font-medium'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 stroke-[1.8]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. TAB VIEW CONTENT */}
      {activeTab === 'layouts' && (
        <FloorPlanLayoutEditor
          layout={activeLayout}
          allLayouts={draftConfig.layouts}
          onUpdateLayout={handleUpdateLayout}
          onSwitchLayout={(id) => setActiveLayoutId(id)}
          onCreateNewLayout={handleCreateNewLayout}
          onDeleteLayout={handleDeleteLayout}
          onNavigateToFloor={onNavigateToFloor}
        />
      )}

      {activeTab === 'combinations' && (
        <TableCombinationsView
          combinations={draftConfig.combinations}
          activeLayout={activeLayout}
          onUpdateCombinations={handleUpdateCombinations}
        />
      )}

      {activeTab === 'rules' && (
        <BohRulesSettingsView
          rules={draftConfig.rules}
          onUpdateRules={handleUpdateRules}
        />
      )}

      {activeTab === 'schedules' && (
        <ShiftScheduleManagerView
          schedules={draftConfig.schedules}
          allLayouts={draftConfig.layouts}
          onUpdateSchedules={handleUpdateSchedules}
        />
      )}

      {activeTab === 'special_days' && (
        <SpecialDaysManagerView
          specialDays={draftConfig.specialDays}
          allLayouts={draftConfig.layouts}
          weeklySchedules={draftConfig.schedules}
          onUpdateSpecialDays={handleUpdateSpecialDays}
        />
      )}

      {activeTab === 'experiences' && (
        <BohExperiencesView />
      )}

      {activeTab === 'reporting' && (
        <BohReportingView />
      )}

      {activeTab === 'menus' && (
        <BohMenusView />
      )}

      {activeTab === 'marketing' && (
        <BohMarketingView />
      )}

      {activeTab === 'communications' && (
        <BohCommunicationsView />
      )}

      {activeTab === 'guests' && (
        <BohGuestsView />
      )}

      {activeTab === 'loyalty' && (
        <BohLoyaltyView />
      )}

      {activeTab === 'reviews' && (
        <BohReviewsView />
      )}

      {/* 4. PUBLISH CONFIRMATION & DIFF MODAL */}
      <PublishDiffModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        draftConfig={draftConfig}
        liveConfig={liveConfig}
        changeLogs={changeLogs}
        onConfirmPublish={handleConfirmPublish}
        onDiscardDraft={handleDiscardDraft}
      />
    </div>
  );
};

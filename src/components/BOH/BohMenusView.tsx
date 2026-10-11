import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  UtensilsCrossed,
  Plus,
  Link,
  Upload,
  FileText,
  Euro,
  Tag,
  CheckCircle2,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  QrCode,
  Globe,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'antipasti' | 'primi' | 'secondi' | 'contorni' | 'dessert' | 'vini' | 'fuori_menu';
  allergens: string[];
  isSpecial: boolean;
  isAvailable: boolean;
  isHolidaySpecial?: boolean;
  holidayName?: string;
}

export interface RestaurantMenu {
  id: string;
  title: string;
  type: 'builder' | 'pdf' | 'url';
  externalUrl?: string;
  pdfFileName?: string;
  lastUpdated: string;
  isPublished: boolean;
  items: MenuItem[];
}

const INITIAL_MENUS: RestaurantMenu[] = [
  {
    id: 'menu_ala_carte',
    title: 'Menù Principale alla Carta (Autunno / Inverno)',
    type: 'builder',
    lastUpdated: '2026-10-08',
    isPublished: true,
    items: [
      {
        id: 'dish_1',
        name: 'Battuta di Fassona Piemontese con Tartufo Nero',
        description: 'Carne cruda tagliata al coltello, tuorlo d’uovo marinato e scaglie di tartufo nero.',
        price: 24,
        category: 'antipasti',
        allergens: ['Uova'],
        isSpecial: true,
        isAvailable: true,
      },
      {
        id: 'dish_val_1',
        name: 'Ostriche Gillardeau con Coulis di Lamponi & Caviale',
        description: 'Piatto d’amore dello Chef con ostriche fresche francesi, granita allo Champagne e caviale siberiano.',
        price: 36,
        category: 'fuori_menu',
        allergens: ['Molluschi', 'Pesce', 'Solfiti'],
        isSpecial: true,
        isAvailable: true,
        isHolidaySpecial: true,
        holidayName: "San Valentino (Valentine's Day)",
      },
      {
        id: 'dish_2',
        name: 'Plin della Tradizione al Sugo d’Arrosto',
        description: 'Pasta fresca ripiena di tre arrosti, burro di malga e riduzione di fondo bruno.',
        price: 22,
        category: 'primi',
        allergens: ['Glutine', 'Uova', 'Latticini'],
        isSpecial: false,
        isAvailable: true,
      },
      {
        id: 'dish_val_2',
        name: 'Risotto Carnaroli con Quaglie Laccate & Melograno',
        description: 'Risotto mantecato con riduzione di melograno e bocconi di quaglia profumati all’anice stellato.',
        price: 28,
        category: 'fuori_menu',
        allergens: ['Latticini', 'Solfiti'],
        isSpecial: true,
        isAvailable: true,
        isHolidaySpecial: true,
        holidayName: "San Valentino (Valentine's Day)",
      },
      {
        id: 'dish_3',
        name: 'Tagliolini ai 40 Tuorli con Funghi Porcini',
        description: 'Porcini freschi trifolati, timo selvatico e parmigiano 36 mesi.',
        price: 26,
        category: 'primi',
        allergens: ['Glutine', 'Uova', 'Latticini'],
        isSpecial: true,
        isAvailable: true,
      },
      {
        id: 'dish_4',
        name: 'Brasato al Barolo con Polenta Taragna',
        description: 'Cappello del prete brasato lentamente per 8 ore nel vino Barolo DOCG.',
        price: 32,
        category: 'secondi',
        allergens: ['Solfiti'],
        isSpecial: false,
        isAvailable: true,
      },
      {
        id: 'dish_5',
        name: 'Bonet Piemontese della Casa',
        description: 'Budino tradizionale con amaretti, cacao amaro, caramello e rum.',
        price: 12,
        category: 'dessert',
        allergens: ['Uova', 'Latticini', 'Frutta a guscio'],
        isSpecial: false,
        isAvailable: true,
      },
      {
        id: 'dish_val_3',
        name: 'Cuore al Cioccolato Valrhona Fondente & Peperoncino',
        description: 'Mousse al cioccolato fondente 72% guanaja, gelée ai frutti di bosco e crumble speziato.',
        price: 15,
        category: 'dessert',
        allergens: ['Latticini', 'Uova', 'Frutta a guscio'],
        isSpecial: true,
        isAvailable: true,
        isHolidaySpecial: true,
        holidayName: "San Valentino (Valentine's Day)",
      },
    ],
  },
  {
    id: 'menu_vini_carta',
    title: 'Carta dei Vini & Cantina Riserve',
    type: 'url',
    externalUrl: 'https://sottosotto.it/carta-vini-2026.pdf',
    lastUpdated: '2026-10-01',
    isPublished: true,
    items: [],
  },
];

export const BohMenusView: React.FC = () => {
  const { theme, isHighContrast, addToast } = useRestaurant();
  const isLight = theme === 'light';

  const [menus, setMenus] = useState<RestaurantMenu[]>(() => {
    const saved = localStorage.getItem('sotto_boh_menus');
    return saved ? JSON.parse(saved) : INITIAL_MENUS;
  });

  const [activeMenuId, setActiveMenuId] = useState<string>(menus[0]?.id || '');
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // New Menu form
  const [newMenuTitle, setNewMenuTitle] = useState('');
  const [newMenuType, setNewMenuType] = useState<'builder' | 'url' | 'pdf'>('builder');
  const [newMenuUrl, setNewMenuUrl] = useState('');

  // New Dish item form
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState(20);
  const [dishCategory, setDishCategory] = useState<MenuItem['category']>('primi');
  const [dishAllergens, setDishAllergens] = useState('Glutine, Latticini');
  const [dishSpecial, setDishSpecial] = useState(false);
  const [dishHolidaySpecial, setDishHolidaySpecial] = useState(false);
  const [dishHolidayName, setDishHolidayName] = useState("San Valentino (Valentine's Day)");

  // Editing dish state
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);

  // Filter for dishes
  const [dishFilter, setDishFilter] = useState<'all' | 'regular' | 'holiday'>('all');

  const activeMenu = menus.find((m) => m.id === activeMenuId) || menus[0] || null;

  const handleCreateMenu = () => {
    if (!newMenuTitle.trim()) {
      alert('Inserisci un titolo per il menù');
      return;
    }

    const newMenu: RestaurantMenu = {
      id: `menu_${Date.now().toString(36)}`,
      title: newMenuTitle,
      type: newMenuType,
      externalUrl: newMenuType === 'url' ? newMenuUrl : undefined,
      pdfFileName: newMenuType === 'pdf' ? 'menu_caricato.pdf' : undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
      isPublished: true,
      items: [],
    };

    const next = [...menus, newMenu];
    setMenus(next);
    localStorage.setItem('sotto_boh_menus', JSON.stringify(next));
    setActiveMenuId(newMenu.id);
    setIsAddMenuModalOpen(false);
    addToast({ type: 'success', title: 'Menù Creato', message: `Menù "${newMenuTitle}" aggiunto e pubblicato` });
  };

  const handleOpenAddDish = () => {
    setDishName('');
    setDishDesc('');
    setDishPrice(22);
    setDishCategory('primi');
    setDishAllergens('');
    setDishSpecial(false);
    setDishHolidaySpecial(false);
    setDishHolidayName("San Valentino (Valentine's Day)");
    setIsAddItemModalOpen(true);
  };

  const handleOpenEditDish = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishDesc(dish.description);
    setDishPrice(dish.price);
    setDishCategory(dish.category);
    setDishAllergens(dish.allergens.join(', '));
    setDishSpecial(dish.isSpecial);
    setDishHolidaySpecial(!!dish.isHolidaySpecial);
    setDishHolidayName(dish.holidayName || "San Valentino (Valentine's Day)");
  };

  const handleSaveDish = () => {
    if (!dishName.trim()) {
      alert('Inserisci il nome del piatto');
      return;
    }

    if (!activeMenu) return;

    if (editingDish) {
      // Update existing dish
      const updatedDish: MenuItem = {
        ...editingDish,
        name: dishName,
        description: dishDesc,
        price: dishPrice,
        category: dishCategory,
        allergens: dishAllergens.split(',').map((s) => s.trim()).filter(Boolean),
        isSpecial: dishSpecial,
        isHolidaySpecial: dishHolidaySpecial,
        holidayName: dishHolidaySpecial ? dishHolidayName : undefined,
      };

      const updated = menus.map((m) =>
        m.id === activeMenu.id
          ? {
              ...m,
              items: m.items.map((d) => (d.id === editingDish.id ? updatedDish : d)),
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : m
      );

      setMenus(updated);
      localStorage.setItem('sotto_boh_menus', JSON.stringify(updated));
      setEditingDish(null);
      addToast({
        type: 'success',
        title: 'Piatto Modificato',
        message: `Modifiche a "${dishName}" salvate con successo.`,
      });
    } else {
      // Create new dish
      const newItem: MenuItem = {
        id: `dish_${Date.now().toString(36)}`,
        name: dishName,
        description: dishDesc,
        price: dishPrice,
        category: dishCategory,
        allergens: dishAllergens.split(',').map((s) => s.trim()).filter(Boolean),
        isSpecial: dishSpecial,
        isAvailable: true,
        isHolidaySpecial: dishHolidaySpecial,
        holidayName: dishHolidaySpecial ? dishHolidayName : undefined,
      };

      const updated = menus.map((m) =>
        m.id === activeMenu.id
          ? {
              ...m,
              items: [...m.items, newItem],
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : m
      );

      setMenus(updated);
      localStorage.setItem('sotto_boh_menus', JSON.stringify(updated));
      setIsAddItemModalOpen(false);
      addToast({
        type: 'success',
        title: dishHolidaySpecial ? 'Piatto Speciale / Fuori Menù Aggiunto' : 'Piatto Aggiunto',
        message: `"${dishName}" inserito in ${activeMenu.title}${dishHolidaySpecial ? ` per ${dishHolidayName}` : ''}.`,
      });
    }
  };

  const handleToggleDishAvailability = (dishId: string) => {
    if (!activeMenu) return;
    const updated = menus.map((m) =>
      m.id === activeMenu.id
        ? {
            ...m,
            items: m.items.map((d) => (d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d)),
          }
        : m
    );
    setMenus(updated);
    localStorage.setItem('sotto_boh_menus', JSON.stringify(updated));
  };

  const handleDeleteDish = (dishId: string) => {
    if (!activeMenu) return;
    const updated = menus.map((m) =>
      m.id === activeMenu.id ? { ...m, items: m.items.filter((d) => d.id !== dishId) } : m
    );
    setMenus(updated);
    localStorage.setItem('sotto_boh_menus', JSON.stringify(updated));
    addToast({
      type: 'info',
      title: 'Piatto Rimosso',
      message: 'Il piatto è stato eliminato dal menù.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. MASTER HEADER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-medium">
            <UtensilsCrossed className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Gestione Menù & Carte del Ristorante
            </h3>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Crea menù interattivi con il menu builder oppure collega un PDF o link URL esterno per la sincronizzazione diretta.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddMenuModalOpen(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white shadow-2xs flex items-center gap-2 cursor-pointer transition active:scale-98 border border-sky-400/40"
        >
          <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>+ Add Menu (Aggiungi Menù)</span>
        </button>
      </div>

      {/* 2. MENU SELECTOR TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {menus.map((m) => {
          const isCur = activeMenuId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMenuId(m.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                isCur
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs'
                    : 'bg-[#1C2538] text-sky-300 border-sky-700/50 shadow-2xs'
                  : isLight
                  ? 'bg-white/80 hover:bg-slate-100/70 text-slate-600 border-slate-200/70'
                  : 'bg-[#151B2A] hover:bg-[#1E2536] text-slate-300 border-[#222A3C]'
              }`}
            >
              {m.type === 'builder' ? <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500 stroke-[1.5]" /> : <Link className="w-3.5 h-3.5 text-sky-500 stroke-[1.5]" />}
              <span>{m.title}</span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                isCur
                  ? isLight ? 'bg-sky-100/70 text-sky-800' : 'bg-sky-950/60 text-sky-300'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
              }`}>
                {m.type === 'builder' ? `${m.items.length} piatti` : 'PDF / URL'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. MENU CONTENT WORKSPACE */}
      {activeMenu && activeMenu.type === 'builder' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-white/5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`text-sm sm:text-base font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  {activeMenu.title}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                  {activeMenu.items.length} piatti totali
                </span>
              </div>
              <span className="text-[11px] font-normal text-slate-400">
                Ultimo aggiornamento: {activeMenu.lastUpdated} · Stato: ✓ Pubblicato online e su QR
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category / Holiday Filter */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setDishFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition ${
                    dishFilter === 'all'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tutti ({activeMenu.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDishFilter('regular')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition ${
                    dishFilter === 'regular'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Carta ({activeMenu.items.filter((d) => !d.isHolidaySpecial).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDishFilter('holiday')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition flex items-center gap-1 ${
                    dishFilter === 'holiday'
                      ? 'bg-rose-500 text-white shadow-2xs font-semibold'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Fuori Menù &amp; Festività ({activeMenu.items.filter((d) => d.isHolidaySpecial).length})</span>
                </button>
              </div>

              <button
                onClick={handleOpenAddDish}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
                <span>+ Aggiungi Piatto</span>
              </button>
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeMenu.items
              .filter((dish) => {
                if (dishFilter === 'regular') return !dish.isHolidaySpecial;
                if (dishFilter === 'holiday') return !!dish.isHolidaySpecial;
                return true;
              })
              .map((dish) => (
                <div
                  key={dish.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between shadow-2xs transition relative group ${
                    dish.isHolidaySpecial
                      ? isLight
                        ? 'bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 border-rose-200'
                        : 'bg-gradient-to-br from-[#1E1420] via-[#141A29] to-[#1A1812] border-rose-900/40'
                      : isLight
                      ? 'bg-white/90 border-slate-200/80'
                      : 'bg-[#141A29] border-[#222A3C]'
                  }`}
                >
                  <div>
                    {/* Holiday Special Banner Badge */}
                    {dish.isHolidaySpecial && (
                      <div className="mb-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <Sparkles className="w-3 h-3 text-rose-500" />
                          <span>Fuori Menù: {dish.holidayName || "San Valentino / Valentine's Day"}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {dish.category === 'fuori_menu' ? 'FUORI MENÙ' : dish.category.toUpperCase()}
                        </span>
                        <h5 className={`font-bold text-sm mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {dish.name}
                        </h5>
                      </div>
                      <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        €{dish.price}
                      </span>
                    </div>

                    <p className={`text-xs mt-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {dish.description}
                    </p>

                    {dish.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {dish.allergens.map((all) => (
                          <span
                            key={all}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                          >
                            ⚠️ {all}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleDishAvailability(dish.id)}
                      className={`text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                        dish.isAvailable
                          ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                          : 'text-slate-400 hover:text-slate-600 line-through'
                      }`}
                      title="Clicca per cambiare disponibilità"
                    >
                      <span className={`w-2 h-2 rounded-full ${dish.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{dish.isAvailable ? 'Disponibile in servizio' : 'Esaurito / Sospeso'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDish(dish)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer flex items-center gap-1 border border-transparent hover:border-sky-200 dark:hover:border-sky-800"
                        title="Modifica piatto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDish(dish.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Elimina piatto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : activeMenu ? (
        /* EXTERNAL URL OR PDF MENU VIEW */
        <div className={`p-8 rounded-3xl border-2 text-center max-w-xl mx-auto space-y-4 ${
          isLight ? 'bg-white border-slate-300' : 'bg-[#141A29] border-slate-700'
        }`}>
          <div className="w-16 h-16 rounded-3xl bg-sky-500/20 text-sky-500 flex items-center justify-center mx-auto">
            <Link className="w-8 h-8" />
          </div>
          <h4 className={`text-lg font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
            {activeMenu.title}
          </h4>
          <p className="text-xs font-bold text-slate-500">
            Questo menù è sincronizzato tramite link diretto o documento PDF. Gli ospiti visualizzano il file al momento della prenotazione.
          </p>
          <div className="p-3 rounded-xl border font-mono text-xs font-bold break-all bg-slate-50 dark:bg-[#101522] border-slate-200 dark:border-slate-800">
            {activeMenu.externalUrl || 'menu_caricato_sotto_sotto.pdf'}
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <a
              href={activeMenu.externalUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Apri Menù Esterno</span>
            </a>
          </div>
        </div>
      ) : null}

      {/* CREATE MENU MODAL */}
      {isAddMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h4 className="font-bold text-sm uppercase">Crea o Collega Nuovo Menù</h4>
              <button onClick={() => setIsAddMenuModalOpen(false)} className="text-xs font-bold text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase block mb-1">Titolo Menù</label>
                <input
                  type="text"
                  value={newMenuTitle}
                  onChange={(e) => setNewMenuTitle(e.target.value)}
                  placeholder="Es. Menù Degustazione Stagionale"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase block mb-1">Modalità Menù</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMenuType('builder')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition ${
                      newMenuType === 'builder'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <UtensilsCrossed className="w-5 h-5 mx-auto mb-1 text-sky-500" />
                    <span>Menu Builder (Da zero)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMenuType('url')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition ${
                      newMenuType === 'url'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Link className="w-5 h-5 mx-auto mb-1 text-sky-500" />
                    <span>Link PDF / URL</span>
                  </button>
                </div>
              </div>

              {newMenuType === 'url' && (
                <div>
                  <label className="text-[11px] font-semibold uppercase block mb-1">URL o Link al Menù</label>
                  <input
                    type="url"
                    value={newMenuUrl}
                    onChange={(e) => setNewMenuUrl(e.target.value)}
                    placeholder="https://tuoristorante.it/menu.pdf"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setIsAddMenuModalOpen(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isLight
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    : 'border-[#2A354C] text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                Annulla
              </button>
              <button
                onClick={handleCreateMenu}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-2xs transition"
              >
                Pubblica Menù
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD OR EDIT DISH MODAL */}
      {(isAddItemModalOpen || editingDish) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-lg p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-sky-500" />
                <h4 className="font-bold text-sm uppercase">
                  {editingDish ? `Modifica Piatto: ${editingDish.name}` : `Aggiungi Piatto a ${activeMenu?.title}`}
                </h4>
              </div>
              <button
                onClick={() => {
                  setIsAddItemModalOpen(false);
                  setEditingDish(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase block mb-1">Nome del Piatto</label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="Es. Risotto ai Porcini & Tartufo Nero"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold uppercase block mb-1">Portata / Sezione</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  >
                    <option value="antipasti">Antipasti</option>
                    <option value="primi">Primi Piatti</option>
                    <option value="secondi">Secondi Piatti</option>
                    <option value="contorni">Contorni</option>
                    <option value="dessert">Dolci &amp; Dessert</option>
                    <option value="vini">Vini &amp; Calici</option>
                    <option value="fuori_menu">⭐ Fuori Menù dello Chef</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase block mb-1">Prezzo (€)</label>
                  <input
                    type="number"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(Number(e.target.value))}
                    min={0}
                    step={1}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-center bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase block mb-1">Descrizione, Cottura &amp; Ingredienti</label>
                <textarea
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  rows={2}
                  placeholder="Descrizione organolettica, provenienza degli ingredienti e accostamenti consigliati..."
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase block mb-1">Allergeni (separati da virgola)</label>
                <input
                  type="text"
                  value={dishAllergens}
                  onChange={(e) => setDishAllergens(e.target.value)}
                  placeholder="Glutine, Latticini, Uova, Solfiti, Frutta a guscio"
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              {/* SPECIAL HOLIDAY / VALENTINE'S DAY SECTION */}
              <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishHolidaySpecial}
                    onChange={(e) => setDishHolidaySpecial(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded"
                  />
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      Piatto Fuori Menù per Festività Speciali (es. Valentine's Day / San Valentino)
                    </span>
                  </div>
                </label>

                {dishHolidaySpecial && (
                  <div className="pt-1.5 space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase text-rose-700 dark:text-rose-300 block">
                      Nome Festività o Ricorrenza Speciale
                    </label>
                    <select
                      value={dishHolidayName}
                      onChange={(e) => setDishHolidayName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white dark:bg-[#161C2A] border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                    >
                      <option value="San Valentino (Valentine's Day)">San Valentino (Valentine's Day)</option>
                      <option value="Capodanno (New Year's Eve)">Capodanno (New Year's Eve)</option>
                      <option value="Natale (Christmas Day)">Natale (Christmas Day)</option>
                      <option value="Pasqua & Pasquetta (Easter)">Pasqua &amp; Pasquetta (Easter)</option>
                      <option value="Festa della Donna (Women's Day)">Festa della Donna (Women's Day)</option>
                      <option value="Thanksgiving Day">Thanksgiving Day (Giorno del Ringraziamento)</option>
                      <option value="Halloween Special Menu">Halloween Special Menu</option>
                      <option value="Ferragosto (Mid-August)">Ferragosto (Mid-August)</option>
                      <option value="Serata Degustazione Fuori Carta">Serata Degustazione Fuori Carta</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsAddItemModalOpen(false);
                  setEditingDish(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveDish}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-2xs transition"
              >
                {editingDish ? 'Salva Modifiche' : 'Salva Piatto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

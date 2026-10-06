import React, { useState } from 'react';
import { menuService, MenuItem, MenuCategory, MenuSubCategory } from '../../services/menuService';
import {
  Utensils,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wine,
  Sparkles,
  DollarSign,
  Coffee,
  X,
  Check,
  Tag,
} from 'lucide-react';

const COMMON_ALLERGENS = [
  'Glutine',
  'Lattosio',
  'Frutta Secca',
  'Uova',
  'Crostacei / Frutti di Mare',
  'Pesce',
  'Soia',
  'Sedano',
  'Solfiti',
  'Arachidi',
];

export const MenuManagementTab: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>(() => menuService.getItems());
  const [selectedCategory, setSelectedCategory] = useState<'all' | MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    category: MenuCategory;
    subCategory: MenuSubCategory;
    price: number;
    cost: number;
    destination: 'kitchen' | 'bar';
    isMeat: boolean;
    isAvailable: boolean;
    description: string;
    allergens: string[];
  }>({
    name: '',
    category: 'fuori_menu',
    subCategory: 'Special dello Chef (Fuori Menù)',
    price: 25,
    cost: 8,
    destination: 'kitchen',
    isMeat: false,
    isAvailable: true,
    description: '',
    allergens: [],
  });

  const reloadItems = () => {
    setItems(menuService.getItems());
  };

  const handleOpenCreate = (categoryDefault: MenuCategory = 'fuori_menu') => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: categoryDefault,
      subCategory:
        categoryDefault === 'fuori_menu'
          ? 'Special dello Chef (Fuori Menù)'
          : categoryDefault === 'dolci'
          ? 'Dolci & Dessert'
          : categoryDefault === 'vini'
          ? 'Vini Rossi'
          : categoryDefault === 'bibite'
          ? 'Acque & Bibite'
          : 'Primi Piatti',
      price: categoryDefault === 'vini' ? 50 : 20,
      cost: 6,
      destination: categoryDefault === 'vini' || categoryDefault === 'bibite' ? 'bar' : 'kitchen',
      isMeat: false,
      isAvailable: true,
      description: '',
      allergens: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      subCategory: item.subCategory,
      price: item.price,
      cost: item.cost || Math.round(item.price * 0.3),
      destination: item.destination,
      isMeat: Boolean(item.isMeat),
      isAvailable: item.isAvailable,
      description: item.description || '',
      allergens: item.allergens || [],
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      menuService.updateItem(editingItem.id, {
        name: formData.name.trim(),
        category: formData.category,
        subCategory: formData.subCategory,
        price: Number(formData.price) || 1,
        cost: Number(formData.cost) || 0,
        destination: formData.destination,
        isMeat: formData.isMeat,
        isAvailable: formData.isAvailable,
        description: formData.description.trim() || undefined,
        allergens: formData.allergens,
      });
    } else {
      menuService.addItem({
        name: formData.name.trim(),
        category: formData.category,
        subCategory: formData.subCategory,
        price: Number(formData.price) || 1,
        cost: Number(formData.cost) || 0,
        destination: formData.destination,
        isMeat: formData.isMeat,
        isAvailable: formData.isAvailable,
        description: formData.description.trim() || undefined,
        allergens: formData.allergens,
      });
    }

    reloadItems();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Eliminare questo piatto dal menu?')) {
      menuService.deleteItem(id);
      reloadItems();
    }
  };

  const handleToggleAvailable = (id: string) => {
    menuService.toggleAvailability(id);
    reloadItems();
  };

  const toggleAllergen = (allergen: string) => {
    setFormData((prev) => {
      const exists = prev.allergens.includes(allergen);
      return {
        ...prev,
        allergens: exists ? prev.allergens.filter((a) => a !== allergen) : [...prev.allergens, allergen],
      };
    });
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchSub = item.subCategory.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchSub) return false;
    }
    return true;
  });

  const availableCount = items.filter((i) => i.isAvailable).length;
  const eightySixCount = items.filter((i) => !i.isAvailable).length;
  const specialsCount = items.filter((i) => i.category === 'fuori_menu').length;

  return (
    <div className="space-y-6">
      {/* TOP CONTROLS & KPI SUMMARY */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Utensils className="w-4.5 h-4.5 text-[#C084FC]" />
                <span>Gestione Menu & Fuori Menù</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/40 font-mono">
                {items.length} Referenze
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestione a la carte, dolci, carta vini, bibite e speciali del giorno con disponibilità live (86'd).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenCreate('fuori_menu')}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>+ Aggiungi Fuori Menù</span>
            </button>
            <button
              onClick={() => handleOpenCreate('a_la_carte')}
              className="px-3.5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Nuovo Piatto / Prodotto</span>
            </button>
          </div>
        </div>

        {/* METRICS MINI-BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-[#222A3C]/70">
          <div className="bg-[#171D2B] border border-[#273248] p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">In Linea (Disponibili)</span>
            <span className="text-base font-bold font-mono text-[#34D399]">{availableCount}</span>
          </div>
          <div className="bg-[#171D2B] border border-[#273248] p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Esauriti / 86'd</span>
            <span className="text-base font-bold font-mono text-rose-400">{eightySixCount}</span>
          </div>
          <div className="bg-[#171D2B] border border-[#273248] p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Speciali Fuori Menù</span>
            <span className="text-base font-bold font-mono text-amber-400">{specialsCount}</span>
          </div>
          <div className="bg-[#171D2B] border border-[#273248] p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Destinazione Cucina / Bar</span>
            <span className="text-base font-bold font-mono text-[#C084FC]">
              {items.filter((i) => i.destination === 'kitchen').length} / {items.filter((i) => i.destination === 'bar').length}
            </span>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[
              { id: 'all' as const, label: 'Tutti' },
              { id: 'a_la_carte' as const, label: 'A La Carte' },
              { id: 'dolci' as const, label: 'Dolci & Dessert' },
              { id: 'vini' as const, label: 'Carta Vini' },
              { id: 'bibite' as const, label: 'Bibite & Amari' },
              { id: 'fuori_menu' as const, label: '✨ Fuori Menù (Specials)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? cat.id === 'fuori_menu'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-[#8B31E0] text-white shadow-xs'
                    : 'bg-[#171D2B] text-slate-400 hover:text-white border border-[#273248]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca piatto, vino, ingrediente..."
              className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
            />
          </div>
        </div>
      </div>

      {/* ITEMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredItems.map((item) => {
          const isSpecial = item.category === 'fuori_menu';
          const isBar = item.destination === 'bar';

          return (
            <div
              key={item.id}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                !item.isAvailable
                  ? 'bg-[#10141F]/60 border-rose-900/40 opacity-75'
                  : isSpecial
                  ? 'bg-gradient-to-br from-[#171D2B] to-[#1e1a12] border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                  : 'bg-[#121622] border-[#222A3C] hover:border-[#8B31E0]/50'
              }`}
            >
              <div>
                {/* Header: Title, Category Badge, Price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      {isSpecial && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          FUORI MENÙ
                        </span>
                      )}
                      {item.isMeat && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-rose-950/50 text-rose-300 border border-rose-800/40">
                          Cottura Obbligatoria
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{item.subCategory}</span>
                      <span>·</span>
                      <span className={isBar ? 'text-amber-400' : 'text-[#C084FC]'}>
                        Dest. {item.destination.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black font-mono text-white">£ {item.price.toFixed(2)}</span>
                    {item.glassPrice && item.bottlePrice && (
                      <span className="block text-[9px] text-[#C084FC] font-mono">
                        Calice £{item.glassPrice.toFixed(2)} · Btl £{item.bottlePrice.toFixed(2)}
                      </span>
                    )}
                    {item.cost !== undefined && (
                      <span className="block text-[10px] text-slate-500 font-mono">
                        Cost: £{item.cost.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Allergens tags */}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2.5">
                    {item.allergens.map((alg) => (
                      <span
                        key={alg}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-[#1A2234] text-amber-300 border border-[#2D3A54] font-medium"
                      >
                        ⚠️ {alg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Sales KPIs & Actions */}
              <div className="pt-2.5 border-t border-[#222A3C] flex items-center justify-between text-xs">
                {/* Stats */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>Ordini: <strong className="text-white">{item.orderCount}</strong></span>
                  <span>·</span>
                  <span>Incasso: <strong className="text-[#34D399]">€{item.revenueGenerated}</strong></span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAvailable(item.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                      item.isAvailable
                        ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/40 hover:bg-[#059669]/30'
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
                    }`}
                    title={item.isAvailable ? 'Clicca per impostare su Esaurito (86’d)' : 'Clicca per rimettere in linea'}
                  >
                    {item.isAvailable ? 'In Linea' : '86’d (Esaurito)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-300 rounded-lg transition cursor-pointer"
                    title="Modifica piatto"
                  >
                    <Edit2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-800/40 text-rose-400 rounded-lg transition cursor-pointer"
                    title="Elimina dal menu"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-10 text-center text-slate-400 space-y-2">
          <Utensils className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="font-bold text-white text-sm">Nessun elemento trovato</h4>
          <p className="text-xs">Prova a cambiare categoria o a modificare la ricerca.</p>
        </div>
      )}

      {/* CREATE / EDIT ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-slate-100 animate-in fade-in">
          <div className="bg-[#121622] border border-[#273248] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#222A3C] pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#C084FC]" />
                <span>{editingItem ? 'Modifica Piatto / Prodotto' : 'Nuovo Piatto o Fuori Menù'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nome del Piatto / Bottiglia / Prodotto
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es. Risotto allo Zafferano, Fiorentina Dry-Aged..."
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                />
              </div>

              {/* Category & SubCategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Macro Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value as MenuCategory;
                      setFormData({
                        ...formData,
                        category: cat,
                        destination: cat === 'vini' || cat === 'bibite' ? 'bar' : 'kitchen',
                        subCategory:
                          cat === 'fuori_menu'
                            ? 'Special dello Chef (Fuori Menù)'
                            : cat === 'dolci'
                            ? 'Dolci & Dessert'
                            : cat === 'vini'
                            ? 'Vini Rossi'
                            : cat === 'bibite'
                            ? 'Acque & Bibite'
                            : 'Primi Piatti',
                      });
                    }}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  >
                    <option value="a_la_carte">A La Carte (Antipasti, Primi, Carni, Contorni)</option>
                    <option value="fuori_menu">✨ Fuori Menù (Special dello Chef)</option>
                    <option value="dolci">Dolci & Dessert</option>
                    <option value="vini">Carta Vini</option>
                    <option value="bibite">Bibite & Amari</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Sotto-Categoria
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value as MenuSubCategory })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  >
                    <option value="Antipasti">Antipasti</option>
                    <option value="Primi Piatti">Primi Piatti</option>
                    <option value="Secondi & Carni">Secondi & Carni</option>
                    <option value="Contorni">Contorni</option>
                    <option value="Dolci & Dessert">Dolci & Dessert</option>
                    <option value="Vini Rossi">Vini Rossi</option>
                    <option value="Vini Bianchi & Bollicine">Vini Bianchi & Bollicine</option>
                    <option value="Prosecco & Champagne">Prosecco & Champagne</option>
                    <option value="Acque & Bibite">Acque & Bibite</option>
                    <option value="Caffè & Digestivi">Caffè & Digestivi</option>
                    <option value="Special dello Chef (Fuori Menù)">Special dello Chef (Fuori Menù)</option>
                  </select>
                </div>
              </div>

              {/* Price, Cost & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Prezzo di Vendita (£)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Food / Beverage Cost (£)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Destinazione Comanda
                  </label>
                  <select
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value as 'kitchen' | 'bar' })}
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B31E0]"
                  >
                    <option value="kitchen">🍳 Cucina</option>
                    <option value="bar">🍸 Bar / Sommelier</option>
                  </select>
                </div>
              </div>

              {/* Flags: Meat cooking mandatory & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#10141F] border border-[#242C3E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMeat}
                    onChange={(e) => setFormData({ ...formData, isMeat: e.target.checked })}
                    className="rounded text-[#8B31E0] focus:ring-0"
                  />
                  <span className="text-slate-200">Richiede selezione cottura carne</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#10141F] border border-[#242C3E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded text-[#059669] focus:ring-0"
                  />
                  <span className="text-slate-200">Disponibile subito in sala</span>
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Descrizione & Provenienza Ingredienti
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Es. Taglio di razza piemontese frollato 45 giorni..."
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
                />
              </div>

              {/* Allergens selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Allergeni Presenti
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMMON_ALLERGENS.map((alg) => {
                    const isSelected = formData.allergens.includes(alg);
                    return (
                      <button
                        key={alg}
                        type="button"
                        onClick={() => toggleAllergen(alg)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-[#10141F] border-[#242C3E] text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}
                        {alg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#222A3C] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#171D2B] hover:bg-[#20273A] border border-[#273248] text-slate-300 rounded-xl text-xs transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B31E0] hover:bg-[#7928CA] text-white font-semibold rounded-xl text-xs transition shadow-md cursor-pointer active:scale-95"
                >
                  {editingItem ? 'Salva Modifiche' : 'Salva nel Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

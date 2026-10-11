import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Users,
  Search,
  Filter,
  Star,
  Tag,
  Euro,
  Calendar,
  Phone,
  Mail,
  Plus,
  Sliders,
  CheckCircle2,
  Receipt,
  Printer,
  FileText,
  UtensilsCrossed,
  X,
  Clock,
  Wine,
} from 'lucide-react';

export interface GuestProfileRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  totalSpend: number;
  avgSpendPerVisit: number;
  lastVisit: string;
  favoriteTable: string;
  tags: string[];
  notes: string;
  isVip: boolean;
}

export interface TablePreReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export interface TablePreReceipt {
  tableNumber: string;
  tableName: string;
  serverName: string;
  covers: number;
  timeSeated: string;
  items: TablePreReceiptItem[];
}

const INITIAL_GUEST_PROFILES: GuestProfileRecord[] = [
  {
    id: 'g_1',
    name: 'Avv. Andrea Moretti',
    email: 'a.moretti@studiolegalemoretti.com',
    phone: '+39 335 129 8840',
    totalVisits: 14,
    totalSpend: 2450,
    avgSpendPerVisit: 175,
    lastVisit: '2026-10-04',
    favoriteTable: 'G (Booth VIP)',
    tags: ['VIP Top Spender', 'Frequent Guest (10+)', 'Barolo Lover'],
    notes: 'Preferisce il tavolo booth G, acqua minerale naturale e pane integrale caldo.',
    isVip: true,
  },
  {
    id: 'g_2',
    name: 'Dott.ssa Giulia Colombo',
    email: 'giulia.colombo@biomed.it',
    phone: '+39 347 992 1045',
    totalVisits: 8,
    totalSpend: 980,
    avgSpendPerVisit: 122,
    lastVisit: '2026-09-28',
    favoriteTable: '11 (Main A)',
    tags: ['Frequent Guest', 'Gluten Free'],
    notes: 'Intollerante al glutine certificata, proporre pasta senza glutine fatta dallo Chef.',
    isVip: false,
  },
  {
    id: 'g_3',
    name: 'Matteo Rinaldi',
    email: 'm.rinaldi@luxuryliving.eu',
    phone: '+39 338 554 2210',
    totalVisits: 6,
    totalSpend: 1320,
    avgSpendPerVisit: 220,
    lastVisit: '2026-10-01',
    favoriteTable: '31 (Privé)',
    tags: ['Top Spender', 'Champagne Collector'],
    notes: 'Ama iniziare sempre con Champagne Blanc de Blancs prima di ordinare.',
    isVip: true,
  },
];

const INITIAL_ACTIVE_TABLE_RECEIPTS: Record<string, TablePreReceipt> = {
  '12': {
    tableNumber: '12',
    tableName: 'Tavolo 12 (Main A)',
    serverName: 'Marco Rossi (Maître)',
    covers: 4,
    timeSeated: '20:15',
    items: [
      { name: 'Coperti & Servizio Pane', qty: 4, price: 4.0 },
      { name: 'Battuta di Fassona con Tartufo', qty: 2, price: 24.0 },
      { name: 'Plin della Tradizione al Sugo d’Arrosto', qty: 4, price: 22.0 },
      { name: 'Brasato al Barolo DOCG', qty: 2, price: 32.0 },
      { name: 'Barolo Riserva 2018 (Bottiglia)', qty: 1, price: 85.0 },
      { name: 'Acqua Minerale Naturale', qty: 2, price: 3.5 },
      { name: 'Caffè Espresso Torrefazione', qty: 4, price: 2.5 },
    ],
  },
  'G': {
    tableNumber: 'G',
    tableName: 'Booth VIP G (Main A)',
    serverName: 'Sofia V. (Chef de Rang)',
    covers: 2,
    timeSeated: '20:45',
    items: [
      { name: 'Coperti & Servizio Pane', qty: 2, price: 4.0 },
      { name: 'Percorso Degustazione Classici', qty: 2, price: 85.0 },
      { name: 'Accostamento Enologico Grandi Annate', qty: 2, price: 45.0 },
      { name: 'Acqua Minerale Frizzante', qty: 2, price: 3.5 },
    ],
  },
  '14': {
    tableNumber: '14',
    tableName: 'Tavolo 14 (Main B)',
    serverName: 'Luca M. (Cameriere)',
    covers: 3,
    timeSeated: '19:50',
    items: [
      { name: 'Coperti & Servizio Pane', qty: 3, price: 4.0 },
      { name: 'Tagliolini ai 40 Tuorli con Porcini', qty: 3, price: 26.0 },
      { name: 'Bonet Piemontese della Casa', qty: 3, price: 12.0 },
      { name: 'Barbera d’Alba Superiore DOC', qty: 1, price: 38.0 },
      { name: 'Acqua Minerale', qty: 2, price: 3.5 },
    ],
  },
};

export const BohGuestsView: React.FC = () => {
  const { theme, isHighContrast, addToast } = useRestaurant();
  const isLight = theme === 'light';

  const [activeSection, setActiveSection] = useState<'pre_receipt' | 'guestbook'>('pre_receipt');
  const [guests, setGuests] = useState<GuestProfileRecord[]>(INITIAL_GUEST_PROFILES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(guests[0]?.id || null);

  // Pre-receipt table selector
  const [selectedReceiptTableId, setSelectedReceiptTableId] = useState<string>('12');
  const [tableReceipts, setTableReceipts] = useState<Record<string, TablePreReceipt>>(INITIAL_ACTIVE_TABLE_RECEIPTS);

  // Add Item to Receipt Form
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(15);

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone.includes(searchTerm);
    const matchesTag =
      selectedTagFilter === 'all' ||
      (selectedTagFilter === 'vip' && g.isVip) ||
      g.tags.some((t) => t.toLowerCase().includes(selectedTagFilter.toLowerCase()));
    return matchesSearch && matchesTag;
  });

  const selectedGuest = guests.find((g) => g.id === selectedGuestId) || filteredGuests[0] || null;
  const currentReceipt = tableReceipts[selectedReceiptTableId] || tableReceipts['12'];

  const receiptTotal = currentReceipt
    ? currentReceipt.items.reduce((acc, it) => acc + it.price * it.qty, 0)
    : 0;

  const handlePrintReceipt = () => {
    addToast({
      type: 'success',
      title: 'Ricevuta Preliminare Inviata alla Stampante',
      message: `Pre-conto Tavolo ${currentReceipt.tableNumber} stampato con successo (€${receiptTotal.toFixed(2)}).`,
    });
  };

  const handleAddItemToReceipt = () => {
    if (!newItemName.trim()) return;
    const cur = tableReceipts[selectedReceiptTableId];
    if (!cur) return;

    const nextItems = [...cur.items, { name: newItemName, qty: newItemQty, price: newItemPrice }];
    setTableReceipts({
      ...tableReceipts,
      [selectedReceiptTableId]: {
        ...cur,
        items: nextItems,
      },
    });

    setIsAddItemModalOpen(false);
    setNewItemName('');
    addToast({
      type: 'success',
      title: 'Voce Aggiunta al Pre-Conto',
      message: `Aggiunto "${newItemName}" al Tavolo ${cur.tableNumber}.`,
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. MASTER HEADER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-medium">
            <Receipt className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Clienti &amp; Pre-Conto Tavoli (Ricevute Preliminari Non Fiscali)
            </h3>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Stampa pre-conti dettagliati con comande e coperti prima del pagamento in cassa, e consulta l'anagrafica ospiti.
            </p>
          </div>
        </div>

        {/* Section Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-[#222A3C] bg-slate-100/60 dark:bg-[#161C2A]">
          <button
            onClick={() => setActiveSection('pre_receipt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'pre_receipt'
                ? 'bg-sky-500 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Pre-Conto Tavoli (Stampa Ricevuta)</span>
          </button>
          <button
            onClick={() => setActiveSection('guestbook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'guestbook'
                ? 'bg-sky-500 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rubrica Clienti ({guests.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PRE-CONTO TAVOLI & RICEVUTE PRELIMINARI */}
      {activeSection === 'pre_receipt' && (
        <div className="space-y-4">
          {/* Informational Callout */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            isLight ? 'bg-sky-50/70 border-sky-200 text-sky-900' : 'bg-sky-950/20 border-sky-800/40 text-sky-200'
          }`}>
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                <strong>Funzione Ricevute Preliminari:</strong> Questa schermata permette ai camerieri e al maître di stampare il conto del tavolo dettagliato voce per voce da mostrare al cliente prima che si rechi alla cassa per il pagamento.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-200/60 dark:bg-sky-900/60 shrink-0">
              Documento Non Fiscale
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Table Selector Column */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                Seleziona Tavolo Attivo:
              </span>
              <div className="space-y-2">
                {Object.keys(tableReceipts).map((tid) => {
                  const rec = tableReceipts[tid];
                  const isSel = selectedReceiptTableId === tid;
                  const total = rec.items.reduce((acc, it) => acc + it.price * it.qty, 0);

                  return (
                    <button
                      key={tid}
                      onClick={() => setSelectedReceiptTableId(tid)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSel
                          ? isLight
                            ? 'bg-sky-50/80 border-sky-300 shadow-2xs font-semibold text-sky-900'
                            : 'bg-[#1C2538] border-sky-700/60 shadow-2xs font-semibold text-sky-200'
                          : isLight
                          ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-[#141A29] hover:bg-[#1A2234] border-[#222A3C] text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{rec.tableName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {rec.covers} pax
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {rec.serverName} · Seduti alle {rec.timeSeated}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        €{total.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-50/50 dark:hover:bg-sky-950/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi Voce Extra al Pre-Conto</span>
              </button>
            </div>

            {/* PREVIEW RICEVUTA PRELIMINARE / SCONTRINO TERMICO (80mm) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              <div className="w-full max-w-md p-6 rounded-3xl border shadow-lg bg-white text-slate-900 space-y-4 font-mono select-none">
                {/* Header Scontrino */}
                <div className="text-center pb-3 border-b-2 border-dashed border-slate-300 space-y-1">
                  <h4 className="font-brand font-bold text-lg tracking-wider uppercase text-slate-950">
                    SOTTO SOTTO BAR &amp; GRILL
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Via San Quintino 22 · Torino · Tel. 011 5567890
                  </p>
                  <div className="pt-1.5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                      RICEVUTA PRELIMINARE (NON FISCALE)
                    </span>
                  </div>
                </div>

                {/* Table Info Meta */}
                <div className="text-xs space-y-1 pb-2 border-b border-dashed border-slate-200">
                  <div className="flex justify-between">
                    <span>TAVOLO:</span>
                    <strong>{currentReceipt.tableName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>OPERATORE / RANGO:</span>
                    <span>{currentReceipt.serverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATA &amp; ORA:</span>
                    <span>{new Date().toLocaleDateString('it-IT')} ore {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COPERTI:</span>
                    <span>{currentReceipt.covers} persone</span>
                  </div>
                </div>

                {/* Portate List */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 pb-1 border-b">
                    <span>Descrizione</span>
                    <span>Q.tà · Importo</span>
                  </div>
                  {currentReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs pt-0.5">
                      <span className="flex-1 pr-2 truncate font-sans text-slate-800">{it.name}</span>
                      <span className="shrink-0 font-mono">
                        {it.qty} × €{it.price.toFixed(2)} = <strong>€{(it.qty * it.price).toFixed(2)}</strong>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totale Pre-Conto */}
                <div className="pt-3 border-t-2 border-dashed border-slate-300 space-y-1">
                  <div className="flex justify-between text-base font-bold">
                    <span>TOTALE PRE-CONTO:</span>
                    <span className="text-lg text-emerald-700">€{receiptTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Di cui IVA 10% (informativa):</span>
                    <span>€{(receiptTotal * 0.1).toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="pt-3 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-500 font-sans italic space-y-1">
                  <p>
                    Documento pro-forma rilasciato per verifica del cliente prima del saldo.
                  </p>
                  <p className="font-bold text-slate-700">
                    Non ha valore di scontrino fiscale. Scontrino/Fattura verrà emesso in cassa.
                  </p>
                  <p className="pt-1">Grazie per aver scelto Sotto Sotto!</p>
                </div>

                {/* Print Action Buttons */}
                <div className="pt-4 flex items-center justify-between gap-3 font-sans">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Stampa Ricevuta Preliminare (Pre-Conto)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: RUBRICA CLIENTI (GUESTBOOK) */}
      {activeSection === 'guestbook' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141A29] border-[#222A3C]'
          }`}>
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca ospite per nome, email o telefono..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { id: 'all', label: 'Tutti gli Ospiti' },
                { id: 'vip', label: '★ Ospiti VIP' },
                { id: 'frequent', label: 'Clienti Abituali' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTagFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 cursor-pointer ${
                    selectedTagFilter === t.id
                      ? 'bg-sky-500 text-white border-sky-400 shadow-2xs'
                      : isLight
                      ? 'bg-white text-slate-700 border-slate-200'
                      : 'bg-[#182030] text-slate-300 border-[#28344A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* GUESTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredGuests.map((g) => (
              <div
                key={g.id}
                className={`p-4 rounded-2xl border shadow-2xs space-y-3 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-sm">{g.name}</h4>
                      {g.isVip && <span className="text-amber-500 text-xs">★ VIP</span>}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{g.phone}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {g.totalVisits} visite
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  "{g.notes}"
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span>Tavolo preferito: <strong>{g.favoriteTable}</strong></span>
                  <span className="font-mono text-emerald-600 font-bold">~€{g.avgSpendPerVisit}/visita</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL AGGIUNGI VOCE AL PRE-CONTO */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm uppercase">Aggiungi Voce al Pre-Conto (Tavolo {currentReceipt.tableNumber})</h4>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Nome Piatto / Bevanda</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Es. Amaro San Simone o Calice Barolo"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Quantità</label>
                  <input
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, Number(e.target.value)))}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Prezzo Unitario (€)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Math.max(0, Number(e.target.value)))}
                    min={0}
                    step={0.5}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleAddItemToReceipt}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-xs"
                >
                  Inserisci nel Pre-Conto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

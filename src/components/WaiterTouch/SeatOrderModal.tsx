import React, { useState, useMemo } from 'react';
import { RestaurantTable, Reservation, TableCourseStage } from '../../types';
import { orderSecurityService } from '../../services/orderSecurityService';
import { menuService } from '../../services/menuService';
import {
  X,
  Plus,
  Trash2,
  Check,
  Clock,
  Send,
  Coffee,
  Wine,
  Utensils,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
  DollarSign,
  Sparkles,
} from 'lucide-react';

export type MeatDoneness = 'Al Sangue' | 'Media al Sangue' | 'Media' | 'Media Cotta' | 'Ben Cotta';

export type ItemCategory =
  | 'antipasti'
  | 'mains'
  | 'contorni'
  | 'dolci'
  | 'bevande'
  | 'caffe_digestivi'
  | 'fuori_menu';

export interface OrderItemEntry {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  seatPosition: string; // e.g. 'Posizione 1 (Sinistra)', 'Posizione 2 (Destra)', 'Tavolo Condiviso'
  meatDoneness?: MeatDoneness;
  notes?: string;
  destination: 'kitchen' | 'bar';
  isSent: boolean;
  sentAt?: string;
}

const MENU_ITEMS = [
  // Antipasti
  { id: 'ant_1', name: 'Battuta di Fassona con Tartufo', category: 'antipasti' as const, price: 18, destination: 'kitchen' as const },
  { id: 'ant_2', name: 'Carpaccio di Angus Affumicato', category: 'antipasti' as const, price: 16, destination: 'kitchen' as const },
  { id: 'ant_3', name: 'Capasanta Scottata con Crema di Zucca', category: 'antipasti' as const, price: 19, destination: 'kitchen' as const },
  { id: 'ant_4', name: 'Tagliere Salumi Tipici & Gnocco Fritto', category: 'antipasti' as const, price: 20, destination: 'kitchen' as const },

  // Mains (Carni & Primi)
  { id: 'main_1', name: 'Filetto di Manzo al Barolo', category: 'mains' as const, price: 34, destination: 'kitchen' as const, isMeat: true },
  { id: 'main_2', name: 'Costata di Fassona Piemontese (600g)', category: 'mains' as const, price: 38, destination: 'kitchen' as const, isMeat: true },
  { id: 'main_3', name: 'Tagliata di Chianina con Rosmarino', category: 'mains' as const, price: 30, destination: 'kitchen' as const, isMeat: true },
  { id: 'main_4', name: 'Risotto allo Zafferano e Midollo', category: 'mains' as const, price: 22, destination: 'kitchen' as const, isMeat: false },
  { id: 'main_5', name: 'Tagliolini al Tartufo Nero Pregiato', category: 'mains' as const, price: 26, destination: 'kitchen' as const, isMeat: false },

  // Contorni
  { id: 'side_1', name: 'Patate al Forno con Rosmarino', category: 'contorni' as const, price: 7, destination: 'kitchen' as const },
  { id: 'side_2', name: 'Caponata Siciliana Tradizionale', category: 'contorni' as const, price: 8, destination: 'kitchen' as const },
  { id: 'side_3', name: 'Verdure di Stagione alla Griglia', category: 'contorni' as const, price: 8, destination: 'kitchen' as const },
  { id: 'side_4', name: 'Insalata Mista con Noci e Pere', category: 'contorni' as const, price: 7, destination: 'kitchen' as const },

  // Bevande & Vini (Smistate al Bar)
  { id: 'bev_1', name: 'Barolo DOCG Cru Pio Cesare 2018', category: 'bevande' as const, price: 85, destination: 'bar' as const },
  { id: 'bev_2', name: 'Brunello di Montalcino DOCG Banfi', category: 'bevande' as const, price: 75, destination: 'bar' as const },
  { id: 'bev_3', name: 'Franciacorta Satèn Bellavista', category: 'bevande' as const, price: 60, destination: 'bar' as const },
  { id: 'bev_4', name: 'Acqua Naturale San Pellegrino 75cl', category: 'bevande' as const, price: 4, destination: 'bar' as const },
  { id: 'bev_5', name: 'Acqua Frizzante Perrier 75cl', category: 'bevande' as const, price: 4, destination: 'bar' as const },

  // Dolci & Dessert
  { id: 'des_1', name: 'Tiramisù Tradizionale al Mascarpone', category: 'dolci' as const, price: 9, destination: 'kitchen' as const },
  { id: 'des_2', name: 'Millefoglie Scomposta ai Frutti di Bosco', category: 'dolci' as const, price: 10, destination: 'kitchen' as const },
  { id: 'des_3', name: 'Sfera di Cioccolato Fondente e Mango', category: 'dolci' as const, price: 11, destination: 'kitchen' as const },

  // Caffè & Ammazzacaffè (Digestivi)
  { id: 'caf_1', name: 'Caffè Espresso Monorigine Arabica', category: 'caffe_digestivi' as const, price: 3, destination: 'bar' as const },
  { id: 'caf_2', name: 'Grappa Barrique Riserva Berta', category: 'caffe_digestivi' as const, price: 9, destination: 'bar' as const },
  { id: 'caf_3', name: 'Amaro del Capo / Montenegro', category: 'caffe_digestivi' as const, price: 6, destination: 'bar' as const },
  { id: 'caf_4', name: 'Limoncello di Sorrento Tradizionale', category: 'caffe_digestivi' as const, price: 6, destination: 'bar' as const },
];

const MEAT_DONENESS_OPTIONS: MeatDoneness[] = [
  'Al Sangue',
  'Media al Sangue',
  'Media',
  'Media Cotta',
  'Ben Cotta',
];

interface SeatOrderModalProps {
  table: RestaurantTable;
  reservation?: Reservation;
  serverName: string;
  onClose: () => void;
  onUpdateReservation?: (bookingCode: string, updates: Partial<Reservation>) => void;
  onUpdateTableStage?: (tableId: string, stage: TableCourseStage) => void;
}

export const SeatOrderModal: React.FC<SeatOrderModalProps> = ({
  table,
  reservation,
  serverName,
  onClose,
  onUpdateReservation,
  onUpdateTableStage,
}) => {
  const rawCap = table.id === 'G' ? 2 : (table.capacityOverride || table.capacity || 2);
  const seatsCount = table.id === 'G' ? 2 : (reservation?.partySize || rawCap);
  const seatPositions = useMemo(() => {
    return Array.from({ length: seatsCount }, (_, i) => {
      if (i === 0) return 'Posizione 1 (Sinistra)';
      if (i === 1) return 'Posizione 2 (Destra)';
      return `Posizione ${i + 1}`;
    });
  }, [seatsCount]);

  const [activeSeat, setActiveSeat] = useState<string>(seatPositions[0]);
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('mains');

  // Dynamic menu items loaded from menuService with Fuori Menu support
  const dynamicMenuItems = useMemo(() => {
    return menuService
      .getItems()
      .filter((i) => i.isAvailable)
      .map((item) => {
        let mappedCat: ItemCategory = 'mains';
        if (item.category === 'fuori_menu') mappedCat = 'fuori_menu';
        else if (item.category === 'dolci') mappedCat = 'dolci';
        else if (item.category === 'vini' || item.category === 'bibite') {
          mappedCat = item.subCategory === 'Caffè & Digestivi' ? 'caffe_digestivi' : 'bevande';
        } else if (item.subCategory === 'Antipasti') mappedCat = 'antipasti';
        else if (item.subCategory === 'Contorni') mappedCat = 'contorni';
        else mappedCat = 'mains';

        return {
          id: item.id,
          name: item.name,
          category: mappedCat,
          price: item.price,
          destination: item.destination,
          isMeat: Boolean(item.isMeat),
          isSpecial: item.category === 'fuori_menu',
        };
      });
  }, []);

  // Simulated existing items on this table
  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>(() => {
    if (table.id === 'G') {
      return [
        {
          id: 'item_g_bev_1',
          name: 'Barolo DOCG Cru Pio Cesare 2018',
          category: 'bevande',
          price: 85,
          seatPosition: 'Tavolo Condiviso',
          destination: 'bar',
          isSent: true,
          sentAt: '12:35',
        },
        {
          id: 'item_g_main_1',
          name: 'Filetto di Manzo al Barolo',
          category: 'mains',
          price: 34,
          meatDoneness: 'Media al Sangue',
          seatPosition: 'Posizione 1 (Sinistra)',
          notes: 'Salsa a parte',
          destination: 'kitchen',
          isSent: true,
          sentAt: '12:45',
        },
      ];
    }
    return [];
  });

  // Current table course stage
  const [currentStage, setCurrentStage] = useState<TableCourseStage>(table.courseStage || 'mains');

  // Mandatory Meat Doneness Modal State
  const [pendingMeatItem, setPendingMeatItem] = useState<{
    item: typeof MENU_ITEMS[0];
    seat: string;
  } | null>(null);
  const [selectedDoneness, setSelectedDoneness] = useState<MeatDoneness>('Media al Sangue');
  const [meatNotes, setMeatNotes] = useState('');

  // Side Dish (Prompt Contorni) Pop-up State
  const [isSidePromptOpen, setIsSidePromptOpen] = useState(false);
  const [promptGuestSeat, setPromptGuestSeat] = useState<string>('');

  // Post-Send Security Void Warning Modal
  const [itemToVoid, setItemToVoid] = useState<OrderItemEntry | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  // Success Feedback
  const [sentSuccessNotice, setSentSuccessNotice] = useState<string | null>(null);

  // Live Bill Calculation
  const totalBill = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.price, 0);
  }, [orderItems]);

  const unspentCount = orderItems.filter((i) => !i.isSent).length;

  const handleSelectItem = (item: typeof MENU_ITEMS[0]) => {
    // If item is meat, require doneness selection
    if (item.category === 'mains' && (item as any).isMeat) {
      setPendingMeatItem({ item, seat: activeSeat });
      setSelectedDoneness('Media al Sangue');
      setMeatNotes('');
      return;
    }

    // Direct add for regular items
    const newEntry: OrderItemEntry = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      category: item.category,
      price: item.price,
      seatPosition: item.category === 'bevande' ? 'Tavolo Condiviso' : activeSeat,
      destination: item.destination,
      isSent: false,
    };

    setOrderItems((prev) => [...prev, newEntry]);

    // If it's a main, prompt for side dishes (contorni)
    if (item.category === 'mains') {
      setPromptGuestSeat(activeSeat);
      setIsSidePromptOpen(true);
    }
  };

  const handleConfirmMeatDoneness = () => {
    if (!pendingMeatItem) return;

    const newEntry: OrderItemEntry = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: pendingMeatItem.item.name,
      category: 'mains',
      price: pendingMeatItem.item.price,
      seatPosition: pendingMeatItem.seat,
      meatDoneness: selectedDoneness,
      notes: meatNotes.trim() || undefined,
      destination: 'kitchen',
      isSent: false,
    };

    setOrderItems((prev) => [...prev, newEntry]);
    const guestSeat = pendingMeatItem.seat;
    setPendingMeatItem(null);

    // Mandatory prompt: "Desidera qualche contorno?"
    setPromptGuestSeat(guestSeat);
    setIsSidePromptOpen(true);
  };

  const handleAddPromptSide = (sideItem: typeof MENU_ITEMS[0]) => {
    const newEntry: OrderItemEntry = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: sideItem.name,
      category: 'contorni',
      price: sideItem.price,
      seatPosition: promptGuestSeat || activeSeat,
      destination: 'kitchen',
      isSent: false,
    };

    setOrderItems((prev) => [...prev, newEntry]);
    setIsSidePromptOpen(false);
  };

  const handleRemoveDraftItem = (id: string) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleInitiateVoid = (item: OrderItemEntry) => {
    if (!item.isSent) {
      // Draft items can be removed freely before sending
      handleRemoveDraftItem(item.id);
      return;
    }
    // Post-Send Security Lock: item was already sent to kitchen/bar!
    setItemToVoid(item);
    setVoidReason('');
    setVoidError(null);
  };

  const handleConfirmAuthorizedVoid = async () => {
    if (!itemToVoid) return;
    if (!voidReason.trim()) {
      setVoidError('Specificare la motivazione dello storno.');
      return;
    }

    const currentTotal = totalBill;
    const result = await orderSecurityService.logAuthorizedVoid({
      waiterId: 'staff_simone',
      waiterName: serverName,
      tableId: table.id,
      itemId: itemToVoid.id,
      itemName: itemToVoid.name + (itemToVoid.meatDoneness ? ` (${itemToVoid.meatDoneness})` : ''),
      itemPrice: itemToVoid.price,
      quantity: 1,
      reason: voidReason.trim(),
      totalBefore: currentTotal,
      managerApprovedBy: 'Manager di Turno',
    });

    if (result.success) {
      setOrderItems((prev) => prev.filter((i) => i.id !== itemToVoid.id));
      setItemToVoid(null);
      setSentSuccessNotice(`Storno registrato nel registro audit (#${result.auditLog.waiterVoidCount})`);
      setTimeout(() => setSentSuccessNotice(null), 3000);
    }
  };

  const handleSendOrder = () => {
    if (unspentCount === 0) return;

    const timeStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    // Track items ordered in menuService for Top/Low sellers analytics
    orderItems
      .filter((i) => !i.isSent)
      .forEach((item) => {
        const matched = menuService.getItems().find((m) => m.name === item.name || m.id === item.id);
        if (matched) {
          menuService.recordItemOrder(matched.id, 1);
        }
      });

    // Mark all as sent
    const updated = orderItems.map((item) => {
      if (!item.isSent) {
        return { ...item, isSent: true, sentAt: timeStr };
      }
      return item;
    });

    setOrderItems(updated);

    // Smistamento Bar vs Cucina
    const barCount = orderItems.filter((i) => !i.isSent && i.destination === 'bar').length;
    const kitchenCount = orderItems.filter((i) => !i.isSent && i.destination === 'kitchen').length;

    let notice = 'Comanda Inviata con successo!';
    if (barCount > 0 && kitchenCount > 0) {
      notice = `Inviata: ${kitchenCount} pietanze in Cucina, ${barCount} comande al Bar 🍷`;
    } else if (barCount > 0) {
      notice = `Inviata comanda bevande al Bar (${barCount} voci) 🍷`;
    } else if (kitchenCount > 0) {
      notice = `Inviata comanda pietanze in Cucina (${kitchenCount} piatti) 👨‍🍳`;
    }

    setSentSuccessNotice(notice);
    setTimeout(() => setSentSuccessNotice(null), 3500);

    if (onUpdateReservation && reservation) {
      onUpdateReservation(reservation.bookingCode, {
        totalSpendEstimate: totalBill,
      });
    }
  };

  const handleAdvanceStage = (nextStage: TableCourseStage) => {
    setCurrentStage(nextStage);
    if (onUpdateTableStage) {
      onUpdateTableStage(table.id, nextStage);
    }
    setSentSuccessNotice(`Stato tavolo avanzato a: ${nextStage.toUpperCase()}`);
    setTimeout(() => setSentSuccessNotice(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-slate-100 animate-in fade-in">
      <div className="bg-[#10141F] border border-[#273248] rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER: TABLE, GUEST & REAL-TIME BILL */}
        <div className="p-4 sm:p-5 bg-[#121622] border-b border-[#222A3C] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-[#8B31E0]/20 border border-[#8B31E0]/40 text-[#C084FC] flex items-center justify-center font-brand font-bold text-xl shadow-xs">
              {table.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-brand">
                  {table.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold font-mono">
                  {seatsCount} Commensali
                </span>
                {table.id === 'G' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
                    BOOTH VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Ospite: <strong className="text-white">{reservation?.guestName || 'Commensali al Tavolo'}</strong> · Cameriere in servizio: <strong className="text-[#C084FC]">{serverName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Bill Tracker */}
            <div className="text-right bg-[#171D2B] border border-[#273248] px-4 py-2 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Conto Tavolo Live
              </span>
              <span className="text-xl font-bold font-mono text-[#34D399]">
                € {totalBill.toLocaleString('it-IT')}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-[#171D2B] hover:bg-[#222A3C] border border-[#273248] flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {sentSuccessNotice && (
          <div className="bg-emerald-950/40 border-b border-emerald-800/60 px-5 py-2.5 flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sentSuccessNotice}</span>
          </div>
        )}

        {/* STAGE ADVANCEMENT STRIP (AVANZAMENTO ORDINI) */}
        <div className="px-5 py-3 bg-[#121724] border-b border-[#222A3C] flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Avanzamento Servizio:
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'seated' as const, label: '1. Seduti' },
              { id: 'drinks' as const, label: '2. Drink & Bar' },
              { id: 'appetizers' as const, label: '3. Antipasti' },
              { id: 'mains' as const, label: '4. Primi / Mains' },
              { id: 'dessert' as const, label: '5. Dolci & Caffè' },
              { id: 'bill_requested' as const, label: '6. Conto Richiesto' },
            ].map((stg) => (
              <button
                key={stg.id}
                onClick={() => handleAdvanceStage(stg.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  currentStage === stg.id
                    ? 'bg-[#8B31E0] text-white shadow-md'
                    : 'bg-[#171D2B] text-slate-400 hover:text-white border border-[#242C3E]'
                }`}
              >
                {stg.label}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN BODY: 2 COLUMNS (LEFT: MENU & SEATS, RIGHT: CURRENT ORDER & RECEIPT) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#222A3C] overflow-hidden">
          
          {/* LEFT 7 COLS: SEAT SELECTION & MENU ITEMS */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col min-h-0 overflow-y-auto space-y-4">
            
            {/* SEAT SELECTOR BUTTONS (COMMENSALI) */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Assegnazione Commensale al Tavolo:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {seatPositions.map((seat) => (
                  <button
                    key={seat}
                    onClick={() => setActiveSeat(seat)}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      activeSeat === seat
                        ? 'bg-[#8B31E0]/20 border-[#8B31E0] text-white shadow-md'
                        : 'bg-[#171D2B] border-[#273248] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">Posto a Sedere</div>
                    <div className="font-bold text-xs truncate">{seat}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* CATEGORY SELECTOR TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {[
                { id: 'fuori_menu' as const, label: '✨ Fuori Menù' },
                { id: 'antipasti' as const, label: 'Antipasti' },
                { id: 'mains' as const, label: 'Portate Principali (Carni/Primi)' },
                { id: 'contorni' as const, label: 'Contorni' },
                { id: 'bevande' as const, label: 'Vini & Bar' },
                { id: 'dolci' as const, label: 'Dolci & Dessert' },
                { id: 'caffe_digestivi' as const, label: 'Caffè & Digestivi' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat.id
                      ? cat.id === 'fuori_menu'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                        : 'bg-white text-[#10141F] font-bold shadow-md'
                      : 'bg-[#171D2B] text-slate-400 hover:text-white border border-[#242C3E]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* MENU ITEMS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1">
              {dynamicMenuItems.filter((i) => i.category === activeCategory).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item as any)}
                  className={`border rounded-2xl p-3.5 text-left transition cursor-pointer flex items-center justify-between group ${
                    item.isSpecial
                      ? 'bg-gradient-to-br from-[#171D2B] to-[#251e12] border-amber-500/50 hover:border-amber-400'
                      : 'bg-[#171D2B] hover:bg-[#1E2638] border-[#273248] hover:border-[#8B31E0]/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white block group-hover:text-[#C084FC] transition">
                        {item.name}
                      </span>
                      {item.isSpecial && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          SPECIAL
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="capitalize">{item.destination === 'bar' ? 'Smistamento Bar 🍸' : 'Cucina 👨‍🍳'}</span>
                      {item.isMeat && (
                        <span className="text-amber-400 font-bold">• Cottura Obbligatoria</span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#34D399] ml-2 shrink-0">
                    € {item.price}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT 5 COLS: COMANDA CONTO LIVE & BOTTONE INVIO */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-[#121622] min-h-0">
            <div className="space-y-3 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-[#222A3C]">
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    Riepilogo Comanda ({orderItems.length} articoli)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {unspentCount > 0 ? `${unspentCount} voci pronte da inviare` : 'Tutte le voci inviate'}
                  </span>
                </div>
                <Receipt className="w-4 h-4 text-slate-400" />
              </div>

              {/* ITEMS LIST */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                {orderItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Nessun articolo selezionato. Scegli un piatto a sinistra per iniziare la comanda.
                  </div>
                ) : (
                  orderItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border text-xs space-y-1 transition ${
                        item.isSent
                          ? 'bg-[#10141F] border-[#222A3C]'
                          : 'bg-[#171D2B] border-[#8B31E0]/50 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-white text-xs">{item.name}</span>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[#C084FC]">{item.seatPosition}</span>
                            <span>•</span>
                            <span>{item.destination === 'bar' ? 'Bar' : 'Cucina'}</span>
                            {item.isSent && (
                              <span className="text-emerald-400 font-mono">
                                (Inviato ore {item.sentAt})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">€ {item.price}</span>
                          <button
                            onClick={() => handleInitiateVoid(item)}
                            className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition cursor-pointer"
                            title={item.isSent ? 'Richiedi Storno Autorizzato' : 'Elimina voce'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Doneness & Notes Badge */}
                      {(item.meatDoneness || item.notes) && (
                        <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/40 px-2 py-0.5 rounded-lg flex items-center gap-2">
                          {item.meatDoneness && <strong>Cottura: {item.meatDoneness}</strong>}
                          {item.notes && <span>Nota: {item.notes}</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SEND CTA & BOTTOM ACTIONS */}
            <div className="pt-4 border-t border-[#222A3C] space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Totale Da Inviare:</span>
                <span className="font-mono font-bold text-white">
                  € {orderItems.filter((i) => !i.isSent).reduce((s, i) => s + i.price, 0)}
                </span>
              </div>

              <button
                onClick={handleSendOrder}
                disabled={unspentCount === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#8B31E0] to-[#6E20C0] hover:from-[#9D44F7] hover:to-[#8B31E0] disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#8B31E0]/30 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Invia Comanda a Bar & Cucina ({unspentCount} Voci)</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODAL 1: MANDATORY MEAT DONENESS SELECTION */}
        {pendingMeatItem && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#121622] border-2 border-amber-500/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#222A3C]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Selezione Cottura Carne</h4>
                  <span className="text-xs text-amber-300">{pendingMeatItem.item.name}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Cottura Desiderata per {pendingMeatItem.seat}:
                </label>
                <div className="space-y-2">
                  {MEAT_DONENESS_OPTIONS.map((doneness) => (
                    <button
                      key={doneness}
                      onClick={() => setSelectedDoneness(doneness)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        selectedDoneness === doneness
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-[#171D2B] border-[#273248] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span>{doneness}</span>
                      {selectedDoneness === doneness && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Note Cottura (Opzionali):
                </label>
                <input
                  type="text"
                  placeholder="Es. Tagliata spessa, poco sale, salsa a parte..."
                  value={meatNotes}
                  onChange={(e) => setMeatNotes(e.target.value)}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPendingMeatItem(null)}
                  className="px-4 py-2 bg-[#171D2B] text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmMeatDoneness}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Conferma & Procedi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: MANDATORY SIDE DISH PROMPT ("Desidera qualche contorno?") */}
        {isSidePromptOpen && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#121622] border-2 border-[#8B31E0] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="text-center space-y-1.5 pb-2 border-b border-[#222A3C]">
                <div className="w-12 h-12 rounded-2xl bg-[#8B31E0]/20 text-[#C084FC] flex items-center justify-center mx-auto">
                  <Utensils className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h4 className="text-lg font-brand font-bold text-white">
                  Desidera qualche contorno?
                </h4>
                <p className="text-xs text-slate-400">
                  Proposta automatica per <strong className="text-white">{promptGuestSeat}</strong> abbinata alla portata principale.
                </p>
              </div>

              <div className="space-y-2">
                {dynamicMenuItems.filter((i) => i.category === 'contorni').map((side) => (
                  <button
                    key={side.id}
                    onClick={() => handleAddPromptSide(side as any)}
                    className="w-full bg-[#171D2B] hover:bg-[#1F273A] border border-[#273248] hover:border-[#8B31E0] rounded-xl p-3 flex items-center justify-between text-left transition cursor-pointer group"
                  >
                    <div>
                      <span className="font-bold text-xs text-white group-hover:text-[#C084FC]">
                        {side.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#34D399]">
                      +£ {side.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsSidePromptOpen(false)}
                  className="w-full py-2.5 px-4 bg-[#171D2B] hover:bg-[#222A3C] text-slate-300 font-semibold text-xs rounded-xl border border-[#273248] transition cursor-pointer"
                >
                  Nessun contorno, procedi oltre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: POST-SEND AUTHORIZED VOID REQUEST (BLOCCO POST-SEND) */}
        {itemToVoid && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#121622] border-2 border-rose-600 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#222A3C]">
                <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Storno Articolo Inviato</h4>
                  <span className="text-xs text-rose-400">Blocco di Sicurezza Post-Send</span>
                </div>
              </div>

              <div className="p-3 bg-[#10141F] rounded-xl border border-[#242C3E] text-xs space-y-1">
                <div className="text-slate-400">Pietanza da stornare:</div>
                <div className="font-bold text-white text-sm">{itemToVoid.name}</div>
                <div className="flex items-center justify-between text-slate-400 pt-1">
                  <span>Valore: € {itemToVoid.price}</span>
                  <span>Inviato alle: {itemToVoid.sentAt}</span>
                </div>
              </div>

              {voidError && (
                <div className="p-2 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs">
                  {voidError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Motivazione dello Storno (Obbligatoria):
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Es. Cliente ha cambiato idea, difetto preparazione, rifacimento..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setItemToVoid(null)}
                  className="px-4 py-2 bg-[#171D2B] text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmAuthorizedVoid}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Autorizza Storno & Registra
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

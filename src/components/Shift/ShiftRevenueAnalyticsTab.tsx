import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { menuService, MenuItem } from '../../services/menuService';
import { TableZone } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  Clock,
  Layers,
  Utensils,
  Wine,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';

type TimeRangeFilter = 'shift' | 'day' | 'week' | 'month' | 'custom';
type ShiftFilter = 'all' | 'lunch' | 'dinner';

export const ShiftRevenueAnalyticsTab: React.FC = () => {
  const { tables, reservations, selectedDate, settings } = useRestaurant();

  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('day');
  const [activeShift, setActiveShift] = useState<ShiftFilter>('all');
  const [selectedZone, setSelectedZone] = useState<'all' | TableZone>('all');
  const [selectedTableId, setSelectedTableId] = useState<string>('all');

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState(selectedDate);
  const [customEndDate, setCustomEndDate] = useState(selectedDate);

  // Top & Low sellers from menuService
  const [menuItems] = useState<MenuItem[]>(() => menuService.getItems());

  const topFoodSellers = useMemo(() => menuService.getTopSellers(5, 'food'), [menuItems]);
  const lowFoodSellers = useMemo(() => menuService.getLowSellers(5, 'food'), [menuItems]);
  const topDrinkSellers = useMemo(() => menuService.getTopSellers(3, 'beverage'), [menuItems]);
  const lowDrinkSellers = useMemo(() => menuService.getLowSellers(3, 'beverage'), [menuItems]);

  // Filter reservations based on selected period
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status === 'cancelled') return false;

      // Date range filtering
      if (timeRange === 'day' || timeRange === 'shift') {
        if (r.reservationDate !== selectedDate) return false;
      } else if (timeRange === 'week') {
        const resDate = new Date(r.reservationDate);
        const curDate = new Date(selectedDate);
        const diffDays = (curDate.getTime() - resDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (timeRange === 'month') {
        if (!r.reservationDate.startsWith(selectedDate.slice(0, 7))) return false;
      } else if (timeRange === 'custom') {
        if (r.reservationDate < customStartDate || r.reservationDate > customEndDate) return false;
      }

      // Shift filtering
      if (activeShift === 'lunch' && r.startTime >= '16:00') return false;
      if (activeShift === 'dinner' && r.startTime < '16:00') return false;

      // Table filtering
      if (selectedTableId !== 'all') {
        const matchesPrimary = r.tableId === selectedTableId;
        const matchesAssigned = r.assignedTableIds && r.assignedTableIds.includes(selectedTableId);
        if (!matchesPrimary && !matchesAssigned) return false;
      }

      // Zone filtering
      if (selectedZone !== 'all') {
        const table = tables.find((t) => t.id === r.tableId);
        if (table && table.zone !== selectedZone) return false;
      }

      return true;
    });
  }, [
    reservations,
    selectedDate,
    timeRange,
    activeShift,
    selectedTableId,
    selectedZone,
    customStartDate,
    customEndDate,
    tables,
  ]);

  // Aggregate metrics
  const totalCovers = filteredReservations.reduce((sum, r) => sum + r.partySize, 0);
  const totalBookings = filteredReservations.length;
  const totalRevenue = filteredReservations.reduce(
    (sum, r) => sum + (r.totalSpendEstimate || r.partySize * (settings.avgSpendPerCover || 65)),
    0
  );
  const avgSpendPerCover = totalCovers > 0 ? Math.round(totalRevenue / totalCovers) : settings.avgSpendPerCover || 65;

  // Revenue breakdown by Section (Bar, Main A, Main B, Private)
  const zoneRevenueBreakdown = useMemo(() => {
    const zones: Record<TableZone, { zoneName: string; totalRevenue: number; covers: number; tableCount: number }> = {
      bar: { zoneName: 'Sala Bar & Lounge', totalRevenue: 0, covers: 0, tableCount: 0 },
      main_a: { zoneName: 'Main A (Ala Ovest & Booth G)', totalRevenue: 0, covers: 0, tableCount: 0 },
      main_b: { zoneName: 'Main B (Ala Est)', totalRevenue: 0, covers: 0, tableCount: 0 },
      private: { zoneName: 'Private Dining Room', totalRevenue: 0, covers: 0, tableCount: 0 },
      main: { zoneName: 'Sala Principale', totalRevenue: 0, covers: 0, tableCount: 0 },
      terrace: { zoneName: 'Terrazza Estiva', totalRevenue: 0, covers: 0, tableCount: 0 },
    };

    tables.forEach((t) => {
      if (zones[t.zone]) {
        zones[t.zone].tableCount += 1;
      }
    });

    filteredReservations.forEach((r) => {
      const table = tables.find((t) => t.id === r.tableId);
      const zoneKey = table ? table.zone : 'main_a';
      if (zones[zoneKey]) {
        const rev = r.totalSpendEstimate || r.partySize * (settings.avgSpendPerCover || 65);
        zones[zoneKey].totalRevenue += rev;
        zones[zoneKey].covers += r.partySize;
      }
    });

    return [
      { key: 'main_a' as TableZone, ...zones.main_a },
      { key: 'main_b' as TableZone, ...zones.main_b },
      { key: 'bar' as TableZone, ...zones.bar },
      { key: 'private' as TableZone, ...zones.private },
    ];
  }, [filteredReservations, tables, settings.avgSpendPerCover]);

  // Breakdown by individual table
  const tableRevenueList = useMemo(() => {
    return tables
      .map((t) => {
        const tBookings = filteredReservations.filter(
          (r) => r.tableId === t.id || (r.assignedTableIds && r.assignedTableIds.includes(t.id))
        );
        const tCovers = tBookings.reduce((sum, r) => sum + r.partySize, 0);
        const tRev = tBookings.reduce(
          (sum, r) => sum + (r.totalSpendEstimate || r.partySize * (settings.avgSpendPerCover || 65)),
          0
        );
        return {
          tableId: t.id,
          tableName: t.name || `Tavolo ${t.tableNumber}`,
          tableNumber: t.tableNumber,
          zone: t.zone,
          capacity: t.capacityOverride || t.capacity,
          bookingsCount: tBookings.length,
          covers: tCovers,
          revenue: tRev,
          avgPerCover: tCovers > 0 ? Math.round(tRev / tCovers) : 0,
        };
      })
      .filter((t) => {
        if (selectedZone !== 'all' && t.zone !== selectedZone) return false;
        if (selectedTableId !== 'all' && t.tableId !== selectedTableId) return false;
        return true;
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [tables, filteredReservations, selectedZone, selectedTableId, settings.avgSpendPerCover]);

  return (
    <div className="space-y-6">
      {/* FILTER BAR FOR REVENUE CALCULATIONS */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-[#C084FC]" />
              <span>Calcolo Incassi Effettivi & Performance Operativa</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisi ricavi per turno, giornata, settimana, mese, intervallo temporale, sale e singolo tavolo.
            </p>
          </div>

          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1.5 bg-[#171D2B] p-1 rounded-xl border border-[#273248] text-xs">
            {[
              { id: 'shift' as const, label: 'Turno Attivo' },
              { id: 'day' as const, label: 'Giornata' },
              { id: 'week' as const, label: 'Settimana' },
              { id: 'month' as const, label: 'Mese' },
              { id: 'custom' as const, label: 'Personalizzato' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setTimeRange(p.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  timeRange === p.id
                    ? 'bg-[#8B31E0] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* SUB-FILTERS: SHIFTS, ZONES, TABS, CUSTOM DATE RANGE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#222A3C]/70 text-xs">
          {/* Shift Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Filtro Turno
            </label>
            <select
              value={activeShift}
              onChange={(e) => setActiveShift(e.target.value as ShiftFilter)}
              className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
            >
              <option value="all">Tutti i Turni (Pranzo + Cena)</option>
              <option value="lunch">☀️ Solo Pranzo (12:00 – 15:00)</option>
              <option value="dinner">🌙 Solo Cena (17:00 – 23:00)</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Sezione / Sala
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as 'all' | TableZone)}
              className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
            >
              <option value="all">Tutte le Sezioni</option>
              <option value="main_a">Main A (Ala Ovest & Booth G)</option>
              <option value="main_b">Main B (Ala Est)</option>
              <option value="bar">Bar & Lounge</option>
              <option value="private">Private Dining Room</option>
            </select>
          </div>

          {/* Table Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Singolo Tavolo
            </label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8B31E0]"
            >
              <option value="all">Tutti i Tavoli ({tables.length})</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || `Tavolo ${t.tableNumber}`} ({t.zone.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range if selected */}
          {timeRange === 'custom' ? (
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Intervallo Date
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-1/2 bg-[#10141F] border border-[#242C3E] rounded-xl px-2 py-1.5 text-xs text-white"
                />
                <span className="text-slate-500">al</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-1/2 bg-[#10141F] border border-[#242C3E] rounded-xl px-2 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Data di Riferimento
              </label>
              <div className="p-2 bg-[#10141F] border border-[#242C3E] rounded-xl text-slate-300 font-mono text-xs">
                {selectedDate}
              </div>
            </div>
          )}
        </div>

        {/* MACRO KPIS RESULT */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Incasso Totale Effettivo</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-[#34D399] mt-0.5 block">
              € {totalRevenue.toLocaleString('it-IT')}
            </span>
          </div>

          <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Coperti Totali Serviti</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5 block">
              {totalCovers} <span className="text-xs font-normal text-slate-400">pax</span>
            </span>
          </div>

          <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Scontrino Medio Pro-Capite</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-[#C084FC] mt-0.5 block">
              € {avgSpendPerCover}
            </span>
          </div>

          <div className="bg-[#171D2B] border border-[#273248] p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Prenotazioni & Turni</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-0.5 block">
              {totalBookings}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION & ZONE REVENUE BREAKDOWN */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#C084FC]" />
          <span>Incassi Suddivisi per Sezione (Bar, Main A, Main B, Private)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {zoneRevenueBreakdown.map((z) => {
            const percentOfTotal = totalRevenue > 0 ? Math.round((z.totalRevenue / totalRevenue) * 100) : 0;
            return (
              <div
                key={z.key}
                className="bg-[#171D2B] border border-[#273248] p-4 rounded-2xl space-y-2 hover:border-[#8B31E0]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{z.zoneName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-300 font-bold">
                    {z.tableCount} tavoli
                  </span>
                </div>

                <div className="text-xl font-black font-mono text-[#34D399]">
                  € {z.totalRevenue.toLocaleString('it-IT')}
                </div>

                <div className="space-y-1 pt-1 border-t border-[#222A3C] text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Coperti:</span>
                    <strong className="text-white">{z.covers} px</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Incidenza sul totale:</span>
                    <strong className="text-[#C084FC]">{percentOfTotal}%</strong>
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="w-full bg-[#10141F] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B31E0] to-[#34D399] rounded-full"
                    style={{ width: `${percentOfTotal}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP SELLERS & LOW SELLERS PERFORMANCE (FOOD & BEVERAGES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* TOP SELLERS CARD */}
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#34D399]" />
              <span>Piatti & Bevande TOP SELLER</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 font-mono">
              Massima Rotazione
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top 5 Piatti Cucina</div>
            {topFoodSellers.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#171D2B] border border-[#273248] p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-5 h-5 rounded-lg bg-[#059669]/20 text-[#34D399] font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.subCategory}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="font-bold text-[#34D399] block">{item.orderCount} ordini</span>
                  <span className="text-[10px] text-slate-400">€ {item.revenueGenerated}</span>
                </div>
              </div>
            ))}

            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-2">Top 3 Vini & Bar</div>
            {topDrinkSellers.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#171D2B] border border-[#273248] p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-5 h-5 rounded-lg bg-[#8B31E0]/20 text-[#C084FC] font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.subCategory}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="font-bold text-[#C084FC] block">{item.orderCount} ordini</span>
                  <span className="text-[10px] text-slate-400">€ {item.revenueGenerated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LOW SELLERS CARD */}
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Piatti & Bevande LOW SELLER (Attenzione Scarti)</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
              Bassa Rotazione
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Low 5 Piatti Cucina</div>
            {lowFoodSellers.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#171D2B] border border-[#273248] p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-slate-200 block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.subCategory}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="font-bold text-amber-400 block">{item.orderCount} ordini</span>
                  <span className="text-[10px] text-slate-500">€ {item.revenueGenerated}</span>
                </div>
              </div>
            ))}

            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-2">Low 3 Vini & Bar</div>
            {lowDrinkSellers.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#171D2B] border border-[#273248] p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-5 h-5 rounded-lg bg-rose-950/40 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-slate-200 block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.subCategory}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="font-bold text-rose-400 block">{item.orderCount} ordini</span>
                  <span className="text-[10px] text-slate-500">€ {item.revenueGenerated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SINGLE TABLE PERFORMANCE BREAKDOWN */}
      <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#34D399]" />
            <span>Classifica Redditività per Singolo Tavolo ({tableRevenueList.length} tavoli analizzati)</span>
          </h4>
          <span className="text-xs text-slate-400 font-mono">Ordinati per incasso decrescente</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tableRevenueList.map((t) => (
            <div
              key={t.tableId}
              className={`p-3.5 rounded-2xl border transition-all ${
                t.tableNumber === 'G'
                  ? 'bg-gradient-to-br from-[#171D2B] to-[#251b36] border-[#8B31E0]/60 ring-1 ring-[#8B31E0]/30'
                  : 'bg-[#171D2B] border-[#273248] hover:border-[#8B31E0]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{t.tableName}</span>
                  {t.tableNumber === 'G' && <span className="text-xs">👑</span>}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/40 text-slate-300">
                  {t.zone} · {t.capacity}p
                </span>
              </div>

              <div className="text-lg font-black font-mono text-[#34D399] mt-1.5">
                € {t.revenue.toLocaleString('it-IT')}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-[#222A3C]/70 mt-2">
                <span>{t.bookingsCount} turni · {t.covers} coperti</span>
                <span className="text-[#C084FC]">€{t.avgPerCover}/pax</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

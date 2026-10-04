import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Users,
  TrendingUp,
  Clock,
  Wine,
  Utensils,
  Layers,
  Percent,
  Download,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowUpDown,
  Filter,
  DollarSign,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export const StatsOverview: React.FC = () => {
  const { tables, reservations, selectedDate, settings } = useRestaurant();

  const [zoneFilter, setZoneFilter] = useState<'all' | 'main' | 'bar' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'turns' | 'covers' | 'revenue' | 'table'>('turns');

  const dayReservations = useMemo(() => {
    return reservations.filter((r) => r.reservationDate === selectedDate);
  }, [reservations, selectedDate]);

  const activeReservations = dayReservations.filter((r) => r.status !== 'cancelled');

  const totalCapacity = useMemo(() => {
    return tables.reduce((sum, t) => sum + (t.capacityOverride || t.capacity), 0);
  }, [tables]);

  const totalCovers = activeReservations.reduce((sum, r) => sum + r.partySize, 0);
  const seatedCovers = activeReservations
    .filter((r) => r.status === 'seated')
    .reduce((sum, r) => sum + r.partySize, 0);

  const completedCovers = activeReservations
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.partySize, 0);

  const totalEstimatedRevenue = activeReservations.reduce(
    (sum, r) => sum + (r.totalSpendEstimate || r.partySize * (settings.avgSpendPerCover || 65)),
    0
  );

  // Compute Table-by-Table Turnover & Performance Metrics
  const tableTurnoverList = useMemo(() => {
    const list = tables.map((t) => {
      // Find all reservations assigned to this table (either as primary or member of merge)
      const tableBookings = activeReservations.filter(
        (r) => r.tableId === t.id || (r.assignedTableIds && r.assignedTableIds.includes(t.id))
      );

      const turnsCount = tableBookings.length;
      const coversTotal = tableBookings.reduce((sum, r) => sum + r.partySize, 0);
      const cap = t.capacityOverride || t.capacity;
      const saturationPercent = cap > 0 ? Math.round((coversTotal / cap) * 100) : 0;
      const revenue = tableBookings.reduce(
        (sum, r) => sum + (r.totalSpendEstimate || r.partySize * (settings.avgSpendPerCover || 65)),
        0
      );

      return {
        table: t,
        tableId: t.id,
        tableNumber: t.tableNumber,
        zone: t.zone,
        capacity: cap,
        turnsCount,
        coversTotal,
        saturationPercent,
        revenue,
        bookings: tableBookings.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      };
    });

    // Filter by Zone
    const filtered = list.filter((item) => {
      if (zoneFilter !== 'all' && item.zone !== zoneFilter) return false;
      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'turns') {
        return b.turnsCount - a.turnsCount || b.coversTotal - a.coversTotal;
      }
      if (sortBy === 'covers') {
        return b.coversTotal - a.coversTotal;
      }
      if (sortBy === 'revenue') {
        return b.revenue - a.revenue;
      }
      return a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true });
    });
  }, [tables, activeReservations, zoneFilter, sortBy, settings.avgSpendPerCover]);

  // Overall Table Turnover Multiplier (Total Turns / Total Tables)
  const totalTurnsAllTables = tableTurnoverList.reduce((sum, t) => sum + t.turnsCount, 0);
  const avgTableTurns = tables.length > 0 ? (totalTurnsAllTables / tables.length).toFixed(2) : '0';

  // Zone Breakdown
  const zoneStats = useMemo(() => {
    const zones = {
      bar: { label: 'Zona Bar', capacity: 0, bookedCovers: 0, tablesCount: 0 },
      main: { label: 'Sale Principali (A & B)', capacity: 0, bookedCovers: 0, tablesCount: 0 },
      private: { label: 'Sala Privata', capacity: 0, bookedCovers: 0, tablesCount: 0 },
    };

    tables.forEach((t) => {
      const z = t.zone === 'main_a' || t.zone === 'main_b' || t.zone === 'main' ? 'main' : (t.zone as 'bar' | 'private');
      if (zones[z]) {
        zones[z].capacity += t.capacityOverride || t.capacity;
        zones[z].tablesCount += 1;
      }
    });

    activeReservations.forEach((r) => {
      const primaryTable = tables.find((t) => t.id === r.tableId);
      const zoneKey = primaryTable
        ? (primaryTable.zone === 'main_a' || primaryTable.zone === 'main_b' || primaryTable.zone === 'main'
            ? 'main'
            : (primaryTable.zone as 'bar' | 'private'))
        : 'main';
      if (zones[zoneKey]) {
        zones[zoneKey].bookedCovers += r.partySize;
      }
    });

    return zones;
  }, [tables, activeReservations]);

  const handleExportData = () => {
    const exportObj = {
      restaurant: settings.name,
      exportDate: selectedDate,
      totalCovers,
      totalTurns: totalTurnsAllTables,
      avgTurnsPerTable: avgTableTurns,
      tableTurnoverReport: tableTurnoverList.map((t) => ({
        table: t.tableNumber,
        zone: t.zone,
        capacity: t.capacity,
        turnsCount: t.turnsCount,
        coversTotal: t.coversTotal,
        saturation: `${t.saturationPercent}%`,
        estimatedRevenue: `${t.revenue} €`,
      })),
      reservations: dayReservations,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `preres_report_rotazione_${selectedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-[1780px] mx-auto pb-16 text-slate-100">
      
      {/* Header */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-white">
              PRERES Analytics & Rendimento Turni ({selectedDate})
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30">
              Live RevPASH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analisi dettagliata di rotazione per tavolo, saturazione oraria e performance economica del servizio.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-[#171D2B] hover:bg-[#222A3C] text-slate-200 border border-[#273248] font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#C084FC]" />
          <span>Esporta Report JSON</span>
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Coperti Totali di Oggi</span>
            <div className="text-2xl font-brand font-bold text-white mt-1 font-mono">
              {totalCovers} px
            </div>
            <span className="text-[11px] text-slate-500">su {activeReservations.length} prenotazioni</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#8B31E0]/20 text-[#C084FC] border border-[#8B31E0]/30 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

        {/* KPI 2: Indice Rotazione Media */}
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Rotazione Media Tavoli</span>
            <div className="text-2xl font-brand font-bold text-amber-300 mt-1 font-mono">
              {avgTableTurns}x
            </div>
            <span className="text-[11px] text-slate-500">giri medi per tavolo</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-950/40 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold">
            <RefreshCw className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Incasso Stimato Coperti</span>
            <div className="text-2xl font-brand font-bold text-[#34D399] mt-1 font-mono">
              € {totalEstimatedRevenue.toLocaleString('it-IT')}
            </div>
            <span className="text-[11px] text-emerald-400/80 font-mono">€{settings.avgSpendPerCover || 65} / persona</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Capienza & Seduti Ora</span>
            <div className="text-2xl font-brand font-bold text-[#C084FC] mt-1 font-mono">
              {seatedCovers} / {totalCapacity} px
            </div>
            <span className="text-[11px] text-slate-500">{completedCovers} completati</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-950/40 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold">
            <Utensils className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* DEDICATED TABLE TURNOVER & COVERS YIELD REPORT */}
      <div className="bg-[#10141F] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#222A3C] pb-3.5">
          <div>
            <h3 className="font-brand font-bold text-base text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#C084FC]" />
              <span>Registro Dettagliato Rotazione Tavoli ({tableTurnoverList.length} tavoli)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Verifica quante volte è stato girato ogni tavolo e il rendimento totale di coperti
            </p>
          </div>

          {/* Controls: Filter by Zone & Sort By */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Zone Filter */}
            <div className="flex items-center bg-[#0B0E17] border border-[#1C2333] rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setZoneFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  zoneFilter === 'all'
                    ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setZoneFilter('main')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  zoneFilter === 'main'
                    ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Main (A & B)
              </button>
              <button
                onClick={() => setZoneFilter('bar')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  zoneFilter === 'bar'
                    ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setZoneFilter('private')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  zoneFilter === 'private'
                    ? 'bg-[#8B31E0]/25 text-[#C084FC] border border-[#8B31E0]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Privé
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Ordina:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#171D2B] border border-[#273248] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-[#8B31E0] cursor-pointer"
              >
                <option value="turns">🔥 Più Girati (Max Turni)</option>
                <option value="covers">👥 Più Coperti Generati</option>
                <option value="revenue">💶 Maggior Fatturato</option>
                <option value="table">🔢 Numero Tavolo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Turnover Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#171D2B] text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-[#222A3C]">
              <tr>
                <th className="p-3">Tavolo & Zona</th>
                <th className="p-3">Capienza Base</th>
                <th className="p-3 text-center">Girate / Turni</th>
                <th className="p-3 text-center">Coperti Generati</th>
                <th className="p-3 text-center">Tasso Saturazione</th>
                <th className="p-3 text-right">Incasso Stimato</th>
                <th className="p-3">Dettaglio Turni Orari di Oggi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222A3C]/80">
              {tableTurnoverList.map((item) => (
                <tr key={item.tableId} className="hover:bg-[#151A27] transition">
                  {/* Table identifier */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-[#171D2B] text-[#C084FC] border border-[#273248] font-bold flex items-center justify-center font-brand text-xs">
                        {item.tableNumber}
                      </span>
                      <div>
                        <strong className="text-xs font-semibold text-white">Tavolo {item.tableNumber}</strong>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          {item.zone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Base Capacity */}
                  <td className="p-3 font-mono font-semibold text-slate-300">
                    {item.capacity} posti
                  </td>

                  {/* Turn count */}
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-full text-xs border ${
                        item.turnsCount >= 3
                          ? 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/50'
                          : item.turnsCount === 2
                          ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                          : item.turnsCount === 1
                          ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/40'
                          : 'bg-[#171D2B] text-slate-400 border-[#273248]'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {item.turnsCount} {item.turnsCount === 1 ? 'giro' : 'giri'}
                    </span>
                  </td>

                  {/* Total Covers */}
                  <td className="p-3 text-center font-mono font-bold text-sm text-white">
                    {item.coversTotal} px
                  </td>

                  {/* Saturation */}
                  <td className="p-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-mono font-bold text-xs text-[#C084FC]">
                        {item.saturationPercent}%
                      </span>
                      <div className="w-16 h-1 bg-[#171D2B] rounded-full overflow-hidden mt-0.5 border border-[#273248]">
                        <div
                          className="h-full bg-gradient-to-r from-[#8B31E0] to-[#A855F7]"
                          style={{ width: `${Math.min(100, item.saturationPercent)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Revenue */}
                  <td className="p-3 text-right font-mono font-bold text-[#34D399] text-xs">
                    € {item.revenue.toLocaleString('it-IT')}
                  </td>

                  {/* Bookings detail strip */}
                  <td className="p-3">
                    {item.bookings.length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">Nessun turno oggi</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.bookings.map((b) => (
                          <span
                            key={b.id}
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                              b.status === 'seated'
                                ? 'bg-[#059669]/20 text-[#34D399] border-[#059669]/50'
                                : b.status === 'completed'
                                ? 'bg-[#171D2B] text-slate-400 border-[#273248]'
                                : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
                            }`}
                            title={`${b.guestName} (${b.partySize} px) · ${b.startTime}-${b.endTime}`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{b.startTime}</span>
                            <span className="font-bold">({b.partySize}p)</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.entries(zoneStats).map(([key, stat]) => {
          const occupancyRate =
            stat.capacity > 0 ? Math.min(150, Math.round((stat.bookedCovers / stat.capacity) * 100)) : 0;

          return (
            <div
              key={key}
              className="bg-[#121622] border border-[#222A3C] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#222A3C] pb-2">
                <h3 className="font-brand font-bold text-sm text-white">{stat.label}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {stat.tablesCount} Tavoli
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Coperti Prenotati:</span>
                  <span className="font-bold font-mono text-white">
                    {stat.bookedCovers} / {stat.capacity} px
                  </span>
                </div>

                <div className="w-full h-1.5 bg-[#171D2B] rounded-full overflow-hidden border border-[#273248]">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B31E0] to-[#A855F7] transition-all"
                    style={{ width: `${Math.min(100, occupancyRate)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Saturazione Turno:</span>
                  <span className="font-bold font-mono text-[#C084FC]">
                    {occupancyRate}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

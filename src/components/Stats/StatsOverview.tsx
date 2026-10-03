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
} from 'lucide-react';

export const StatsOverview: React.FC = () => {
  const { tables, reservations, tableGroups, selectedDate, settings } = useRestaurant();

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

  const avgPartySize =
    activeReservations.length > 0
      ? (totalCovers / activeReservations.length).toFixed(1)
      : '0';

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
      main: { label: 'Sala Principale', capacity: 0, bookedCovers: 0, tablesCount: 0 },
      private: { label: 'Sala Privata', capacity: 0, bookedCovers: 0, tablesCount: 0 },
    };

    tables.forEach((t) => {
      const z = t.zone as 'bar' | 'main' | 'private';
      if (zones[z]) {
        zones[z].capacity += t.capacityOverride || t.capacity;
        zones[z].tablesCount += 1;
      }
    });

    activeReservations.forEach((r) => {
      const primaryTable = tables.find((t) => t.id === r.tableId);
      const z = primaryTable ? (primaryTable.zone as 'bar' | 'main' | 'private') : 'main';
      if (zones[z]) {
        zones[z].bookedCovers += r.partySize;
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
    downloadAnchor.setAttribute('download', `report_rotazione_tavoli_${selectedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-brand font-bold text-[#1E3A2F]">
            Analisi Rotazione Tavoli & Performance Coperti ({selectedDate})
          </h2>
          <p className="text-xs text-[#1E3A2F]/70">
            Monitora quanti turni e coperti ha generato ogni singolo tavolo nella giornata
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A2F] text-amber-100 hover:bg-[#152a22] font-semibold text-xs rounded-xl transition shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Esporta Report Rotazione (JSON)</span>
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Coperti Totali di Oggi</span>
            <div className="text-2xl font-brand font-bold text-[#1E3A2F] mt-1 font-mono-num">
              {totalCovers} px
            </div>
            <span className="text-[11px] text-stone-400">su {activeReservations.length} prenotazioni</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#6B3FA0]/10 text-[#6B3FA0] flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Indice Rotazione Media */}
        <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Rotazione Media Tavoli</span>
            <div className="text-2xl font-brand font-bold text-amber-800 mt-1 font-mono-num">
              {avgTableTurns}x
            </div>
            <span className="text-[11px] text-stone-400">giri medi per tavolo</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Incasso Stimato Coperti</span>
            <div className="text-2xl font-brand font-bold text-emerald-800 mt-1 font-mono-num">
              {totalEstimatedRevenue.toLocaleString('it-IT')} €
            </div>
            <span className="text-[11px] text-emerald-600">€{settings.avgSpendPerCover || 65} / persona</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Capienza & Coperti Seduti</span>
            <div className="text-2xl font-brand font-bold text-[#1E3A2F] mt-1 font-mono-num">
              {seatedCovers} / {totalCapacity} px
            </div>
            <span className="text-[11px] text-stone-400">seduti ora in sala</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Utensils className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* DEDICATED TABLE TURNOVER & COVERS YIELD REPORT */}
      <div className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-brand font-bold text-lg text-[#1E3A2F] flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#6B3FA0]" />
              <span>Registro Dettagliato Rotazione Tavoli ({tableTurnoverList.length} tavoli)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Verifica quante volte è stato girato ogni tavolo e il rendimento totale di coperti
            </p>
          </div>

          {/* Controls: Filter by Zone & Sort By */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Zone Filter */}
            <div className="flex items-center bg-[#FBF8F2] border border-[#1E3A2F]/20 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setZoneFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  zoneFilter === 'all' ? 'bg-[#1E3A2F] text-amber-100' : 'text-stone-600'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setZoneFilter('main')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  zoneFilter === 'main' ? 'bg-[#1E3A2F] text-amber-100' : 'text-stone-600'
                }`}
              >
                Principale
              </button>
              <button
                onClick={() => setZoneFilter('bar')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  zoneFilter === 'bar' ? 'bg-[#1E3A2F] text-amber-100' : 'text-stone-600'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setZoneFilter('private')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  zoneFilter === 'private' ? 'bg-[#1E3A2F] text-amber-100' : 'text-stone-600'
                }`}
              >
                Privata
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-medium">Ordina:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FBF8F2] border border-[#1E3A2F]/20 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1E3A2F] focus:outline-none"
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
          <table className="w-full text-left text-xs text-[#1E3A2F]">
            <thead className="bg-[#1E3A2F] text-amber-100 uppercase text-[10px] tracking-wider font-semibold">
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
            <tbody className="divide-y divide-[#1E3A2F]/10">
              {tableTurnoverList.map((item) => (
                <tr key={item.tableId} className="hover:bg-[#FBF8F2] transition">
                  {/* Table identifier */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-[#1E3A2F] text-amber-100 font-bold flex items-center justify-center font-brand text-xs">
                        {item.tableNumber}
                      </span>
                      <div>
                        <strong className="text-xs font-brand">Tavolo {item.tableNumber}</strong>
                        <span className="text-[10px] text-stone-500 block">
                          Zona {item.zone.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Base Capacity */}
                  <td className="p-3 font-mono-num font-semibold text-stone-700">
                    {item.capacity} posti
                  </td>

                  {/* Turn count */}
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 font-mono-num font-extrabold px-2.5 py-1 rounded-full text-xs ${
                        item.turnsCount >= 3
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : item.turnsCount === 2
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : item.turnsCount === 1
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {item.turnsCount} {item.turnsCount === 1 ? 'giro' : 'giri'}
                    </span>
                  </td>

                  {/* Total Covers */}
                  <td className="p-3 text-center font-mono-num font-extrabold text-sm text-[#1E3A2F]">
                    {item.coversTotal} px
                  </td>

                  {/* Saturation */}
                  <td className="p-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-mono-num font-bold text-xs text-[#6B3FA0]">
                        {item.saturationPercent}%
                      </span>
                      <div className="w-16 h-1 bg-stone-200 rounded-full overflow-hidden mt-0.5">
                        <div
                          className="h-full bg-[#6B3FA0]"
                          style={{ width: `${Math.min(100, item.saturationPercent)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Revenue */}
                  <td className="p-3 text-right font-mono-num font-bold text-emerald-800 text-xs">
                    {item.revenue.toLocaleString('it-IT')} €
                  </td>

                  {/* Bookings detail strip */}
                  <td className="p-3">
                    {item.bookings.length === 0 ? (
                      <span className="text-stone-400 italic text-[11px]">Nessun turno oggi</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.bookings.map((b) => (
                          <span
                            key={b.id}
                            className={`text-[10px] font-mono-num font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                              b.status === 'seated'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : b.status === 'completed'
                                ? 'bg-stone-100 text-stone-700 border-stone-200'
                                : 'bg-purple-50 text-purple-900 border-purple-200'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(zoneStats).map(([key, stat]) => {
          const occupancyRate =
            stat.capacity > 0 ? Math.min(150, Math.round((stat.bookedCovers / stat.capacity) * 100)) : 0;

          return (
            <div
              key={key}
              className="bg-white border border-[#1E3A2F]/15 rounded-2xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="font-brand font-bold text-sm text-[#1E3A2F]">{stat.label}</h3>
                <span className="text-xs text-stone-500 font-mono-num">
                  {stat.tablesCount} Tavoli
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">Coperti Prenotati:</span>
                  <span className="font-bold font-mono-num text-[#1E3A2F]">
                    {stat.bookedCovers} / {stat.capacity} px
                  </span>
                </div>

                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6B3FA0] transition-all"
                    style={{ width: `${Math.min(100, occupancyRate)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Saturazione Turno:</span>
                  <span className="font-bold font-mono-num text-[#6B3FA0]">
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

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  X,
  Server,
  Activity,
  Wifi,
  Radio,
  RefreshCw,
  CheckCircle2,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface ServerMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerMonitorModal: React.FC<ServerMonitorModalProps> = ({ isOpen, onClose }) => {
  const { isRealtimeConnected, connectedPeersCount, tables, reservations } = useRestaurant();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'logs'>('overview');

  const fetchHealth = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const end = performance.now();
      setPingLatency(Math.round(end - start));
      setHealthData(data);
    } catch (e: any) {
      console.error('Error fetching server health:', e);
      setHealthData({ status: 'offline', error: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#152a22] text-stone-100 border-2 border-emerald-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-brand font-bold text-emerald-200">
                  Pannello di Controllo & Monitor Server Real-Time
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Node.js + Express + Socket.io Engine · Porta 3000
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Stato & Metriche
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'endpoints'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Endpoint REST API
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'logs'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Canali WebSocket Live
          </button>

          <button
            onClick={fetchHealth}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
            title="Esegui ping al server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Ping Server</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-black/30 border border-emerald-500/20 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-stone-400 font-bold block">Stato WebSocket</span>
                <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <Wifi className="w-4 h-4" />
                  <span>Connesso</span>
                </div>
                <span className="text-[10px] text-stone-500">Persistente v4</span>
              </div>

              <div className="bg-black/30 border border-emerald-500/20 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-stone-400 font-bold block">Schermi Connessi</span>
                <div className="text-base font-bold text-amber-300 flex items-center gap-1.5 mt-1 font-mono-num">
                  <Radio className="w-4 h-4" />
                  <span>{connectedPeersCount} Peer</span>
                </div>
                <span className="text-[10px] text-stone-500">In ascolto sincronizzato</span>
              </div>

              <div className="bg-black/30 border border-emerald-500/20 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-stone-400 font-bold block">Latenza Round-Trip</span>
                <div className="text-base font-bold text-blue-300 flex items-center gap-1.5 mt-1 font-mono-num">
                  <Activity className="w-4 h-4" />
                  <span>{pingLatency !== null ? `${pingLatency} ms` : '—'}</span>
                </div>
                <span className="text-[10px] text-stone-500">Zero lag di rete</span>
              </div>

              <div className="bg-black/30 border border-emerald-500/20 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-stone-400 font-bold block">Uptime Server</span>
                <div className="text-base font-bold text-purple-300 flex items-center gap-1.5 mt-1 font-mono-num">
                  <ClockIcon />
                  <span>{healthData?.uptimeSeconds ? `${healthData.uptimeSeconds}s` : 'Attivo'}</span>
                </div>
                <span className="text-[10px] text-stone-500">Processo Node.js</span>
              </div>
            </div>

            {/* Server Architecture Details Box */}
            <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-400 border-b border-white/5 pb-1.5">
                <span>Stack Backend:</span>
                <strong className="text-emerald-300">Node.js Express + Socket.io Server</strong>
              </div>
              <div className="flex items-center justify-between text-stone-400 border-b border-white/5 pb-1.5">
                <span>Porta di Ascolto HTTP/WS:</span>
                <strong className="text-stone-200 font-mono">Port 3000 (0.0.0.0)</strong>
              </div>
              <div className="flex items-center justify-between text-stone-400 border-b border-white/5 pb-1.5">
                <span>Replica Supabase Database:</span>
                <strong className="text-amber-300">supabase_realtime (PostgreSQL CDC)</strong>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Canale Locale Cross-Tab:</span>
                <strong className="text-stone-200 font-mono">sotto_sotto_realtime_sync</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: REST Endpoints */}
        {activeTab === 'endpoints' && (
          <div className="space-y-2 text-xs animate-in fade-in duration-150">
            <p className="text-[11px] text-stone-400 mb-2">
              Puoi interrogare o verificare questi endpoint HTTP esposti dal server Express:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-300 font-bold text-[10px] px-2 py-0.5 rounded font-mono">GET</span>
                  <span className="font-mono text-emerald-300">/api/health</span>
                </div>
                <span className="text-[11px] text-stone-400">Controllo integrità e stato server</span>
              </div>

              <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-300 font-bold text-[10px] px-2 py-0.5 rounded font-mono">GET</span>
                  <span className="font-mono text-emerald-300">/api/state</span>
                </div>
                <span className="text-[11px] text-stone-400">Snapshot completo dati per reconnessione</span>
              </div>

              <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded font-mono">POST</span>
                  <span className="font-mono text-emerald-300">/api/reservations</span>
                </div>
                <span className="text-[11px] text-stone-400">Crea prenotazione + broadcast automatico</span>
              </div>

              <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded font-mono">PUT</span>
                  <span className="font-mono text-emerald-300">/api/tables/:id/position</span>
                </div>
                <span className="text-[11px] text-stone-400">Aggiorna coordinate tavolo con drag & drop</span>
              </div>

              <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500/20 text-purple-300 font-bold text-[10px] px-2 py-0.5 rounded font-mono">POST</span>
                  <span className="font-mono text-emerald-300">/api/tables/merge</span>
                </div>
                <span className="text-[11px] text-stone-400">Unione tavoli in maxi-tavolo gruppo</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Socket.io Channels */}
        {activeTab === 'logs' && (
          <div className="space-y-2 text-xs animate-in fade-in duration-150">
            <div className="bg-black/50 border border-emerald-500/20 rounded-2xl p-3 font-mono text-[11px] space-y-1.5 text-stone-300">
              <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>Canali Broadcast Socket.io Registrati:</span>
              </div>
              <div className="text-stone-400 pl-4 space-y-1">
                <div>⚡ <strong className="text-white">reservationUpdate</strong>: sincronizza inserimenti, cancellazioni e cambi stato coperti.</div>
                <div>⚡ <strong className="text-white">roomLayoutUpdate</strong>: trasmette accorpamenti tavoli, variazioni capienza e modifiche sale.</div>
                <div>⚡ <strong className="text-white">tableCoordinateUpdate</strong>: propagazione spaziale coordinate X/Y durante il drag-and-drop.</div>
                <div>⚡ <strong className="text-white">presenceUpdate</strong>: notifica il numero esatto di tablet e schermi collegati.</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between">
          <div className="text-[11px] text-stone-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Server in esecuzione su porta 3000</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition shadow-md"
          >
            Chiudi Monitor
          </button>
        </div>
      </div>
    </div>
  );
};

function ClockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

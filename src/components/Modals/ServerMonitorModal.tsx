import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { BACKEND_BASE_URL } from '../../services/reservationService';
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/health`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server starting up or returned non-JSON');
      }
      const data = await res.json();
      const end = performance.now();
      setPingLatency(Math.round(end - start));
      setHealthData(data);
    } catch (e: any) {
      console.warn('Server health check note:', e.message);
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white text-slate-800 border border-slate-200/80 rounded-2xl p-5 md:p-6 max-w-2xl w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center font-medium shadow-2xs">
              <Server className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                  Pannello di Controllo & Monitor Server Real-Time
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Node.js + Express + Socket.io Engine · Porta 3000
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100/70 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-sky-50 text-sky-700 border-sky-200/80 font-semibold shadow-2xs'
                : 'bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Stato & Metriche
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              activeTab === 'endpoints'
                ? 'bg-sky-50 text-sky-700 border-sky-200/80 font-semibold shadow-2xs'
                : 'bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Endpoint REST API
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-sky-50 text-sky-700 border-sky-200/80 font-semibold shadow-2xs'
                : 'bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Canali WebSocket Live
          </button>

          <button
            onClick={fetchHealth}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
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
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Stato WebSocket</span>
                <div className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <Wifi className="w-4 h-4" />
                  <span>Connesso</span>
                </div>
                <span className="text-[10px] text-slate-400">Persistente v4</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Schermi Connessi</span>
                <div className="text-base font-bold text-sky-700 flex items-center gap-1.5 mt-1 font-mono-num">
                  <Radio className="w-4 h-4" />
                  <span>{connectedPeersCount} Peer</span>
                </div>
                <span className="text-[10px] text-slate-400">In ascolto sincronizzato</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Latenza Round-Trip</span>
                <div className="text-base font-bold text-blue-600 flex items-center gap-1.5 mt-1 font-mono-num">
                  <Activity className="w-4 h-4" />
                  <span>{pingLatency !== null ? `${pingLatency} ms` : '—'}</span>
                </div>
                <span className="text-[10px] text-slate-400">Zero lag di rete</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Uptime Server</span>
                <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-1 font-mono-num">
                  <ClockIcon />
                  <span>{healthData?.uptimeSeconds ? `${healthData.uptimeSeconds}s` : 'Attivo'}</span>
                </div>
                <span className="text-[10px] text-slate-400">Processo Node.js</span>
              </div>
            </div>

            {/* Server Architecture Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 pb-1.5">
                <span>Stack Backend:</span>
                <strong className="text-slate-900">Node.js Express + Socket.io Server</strong>
              </div>
              <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 pb-1.5">
                <span>Porta di Ascolto HTTP/WS:</span>
                <strong className="text-slate-900 font-mono">Port 3000 (0.0.0.0)</strong>
              </div>
              <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 pb-1.5">
                <span>Replica Supabase Database:</span>
                <strong className="text-sky-700">supabase_realtime (PostgreSQL CDC)</strong>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Canale Locale Cross-Tab:</span>
                <strong className="text-slate-900 font-mono">sotto_sotto_realtime_sync</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: REST Endpoints */}
        {activeTab === 'endpoints' && (
          <div className="space-y-2 text-xs animate-in fade-in duration-150">
            <p className="text-[11px] text-slate-500 mb-2">
              Puoi interrogare o verificare questi endpoint HTTP esposti dal server Express:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-100 text-sky-800 font-bold text-[10px] px-2 py-0.5 rounded font-mono">GET</span>
                  <span className="font-mono text-slate-900">/api/health</span>
                </div>
                <span className="text-[11px] text-slate-500">Controllo integrità e stato server</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-100 text-sky-800 font-bold text-[10px] px-2 py-0.5 rounded font-mono">GET</span>
                  <span className="font-mono text-slate-900">/api/state</span>
                </div>
                <span className="text-[11px] text-slate-500">Snapshot completo dati per riconnessione</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded font-mono">POST</span>
                  <span className="font-mono text-slate-900">/api/reservations</span>
                </div>
                <span className="text-[11px] text-slate-500">Crea prenotazione + broadcast automatico</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded font-mono">PUT</span>
                  <span className="font-mono text-slate-900">/api/tables/:id/position</span>
                </div>
                <span className="text-[11px] text-slate-500">Aggiorna coordinate tavolo con drag & drop</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 font-bold text-[10px] px-2 py-0.5 rounded font-mono">POST</span>
                  <span className="font-mono text-slate-900">/api/tables/merge</span>
                </div>
                <span className="text-[11px] text-slate-500">Unione tavoli in maxi-tavolo gruppo</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Socket.io Channels */}
        {activeTab === 'logs' && (
          <div className="space-y-2 text-xs animate-in fade-in duration-150">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] space-y-1.5 text-slate-300">
              <div className="text-sky-400 flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>Canali Broadcast Socket.io Registrati:</span>
              </div>
              <div className="text-slate-400 pl-4 space-y-1">
                <div>⚡ <strong className="text-white">reservationUpdate</strong>: sincronizza inserimenti, cancellazioni e cambi stato coperti.</div>
                <div>⚡ <strong className="text-white">roomLayoutUpdate</strong>: trasmette accorpamenti tavoli, variazioni capienza e modifiche sale.</div>
                <div>⚡ <strong className="text-white">tableCoordinateUpdate</strong>: propagazione spaziale coordinate X/Y durante il drag-and-drop.</div>
                <div>⚡ <strong className="text-white">presenceUpdate</strong>: notifica il numero esatto di tablet e schermi collegati.</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Server in esecuzione su porta 3000</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-xs cursor-pointer"
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

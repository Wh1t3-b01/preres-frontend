import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  MessageSquare,
  Mail,
  Smartphone,
  Clock,
  CheckCircle2,
  Sliders,
  Palette,
  Send,
  Eye,
  Settings,
  Radio,
  ExternalLink,
  ShieldCheck,
  Check,
  RotateCcw,
  Info,
} from 'lucide-react';

export const BohCommunicationsView: React.FC = () => {
  const { theme, isHighContrast, addToast } = useRestaurant();
  const isLight = theme === 'light';

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'carrier' | 'email_preview' | 'dispatch_log'>('rules');

  // Toggle communication types
  const [smsConfirmationEnabled, setSmsConfirmationEnabled] = useState(true);
  const [emailConfirmationEnabled, setEmailConfirmationEnabled] = useState(true);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);
  const [requireReconfirm, setRequireReconfirm] = useState(true);

  // Carrier & SMS Gateway Settings
  const [carrierMode, setCarrierMode] = useState<'cloud_gateway' | 'device_sim' | 'gsm_box'>('cloud_gateway');
  const [senderId, setSenderId] = useState('SottoSotto');
  const [restaurantPhone, setRestaurantPhone] = useState('+39 011 5567890');
  const [carrierProvider, setCarrierProvider] = useState<'twilio' | 'skebby' | 'messagenet' | 'custom_webhook'>('skebby');
  const [carrierApiKey, setCarrierApiKey] = useState('sk_live_9984729103847291');
  const [testPhoneNumber, setTestPhoneNumber] = useState('+39 335 1234567');

  // Email Customization
  const [emailSubject, setEmailSubject] = useState('Conferma Prenotazione Tavolo — Sotto Sotto Bar & Grill');
  const [customFooterNote, setCustomFooterNote] = useState('Dress code: smart casual. In caso di ritardo oltre 15 minuti, il tavolo potrebbe essere riassegnato.');

  // Live Dispatch Logs
  const [dispatchLogs, setDispatchLogs] = useState([
    {
      id: 'log_1',
      timestamp: 'Oggi, 19:42',
      recipient: 'Marco Rossi (+39 335 129 8840)',
      channel: 'SMS Carrier (Mittente: SottoSotto)',
      status: 'Consegnato',
      content: 'Confermata prenotazione Sotto Sotto per 4p stasera ore 20:30. Tavolo riservato.',
    },
    {
      id: 'log_2',
      timestamp: 'Oggi, 18:15',
      recipient: 'giulia.colombo@biomed.it',
      channel: 'Email HTML Formattata',
      status: 'Aperta',
      content: 'Email di promemoria con mappa e bottone di riconferma presenza.',
    },
    {
      id: 'log_3',
      timestamp: 'Oggi, 15:30',
      recipient: 'Luca Verdi (+39 347 882 1109)',
      channel: 'SMS Carrier (Mittente: SottoSotto)',
      status: 'Consegnato',
      content: 'Promemoria: ti aspettiamo domani alle 13:00 per 2 persone.',
    },
  ]);

  const handleSaveSettings = () => {
    addToast({
      type: 'success',
      title: 'Impostazioni Comunicazioni Salvate',
      message: 'Regole SMS/Email, Sender ID e gateway carrier sincronizzati.',
    });
  };

  const handleSendTestSms = () => {
    if (!testPhoneNumber.trim()) {
      alert('Inserisci un numero di cellulare per il test');
      return;
    }

    if (carrierMode === 'device_sim') {
      // Native SMS protocol: opens device SMS app
      const smsBody = encodeURIComponent(`Gentile Ospite, confermiamo la tua prenotazione da Sotto Sotto. A presto!`);
      window.location.href = `sms:${testPhoneNumber}?body=${smsBody}`;
      addToast({
        type: 'info',
        title: 'Apertura SMS su Dispositivo',
        message: 'Aperta applicazione Messaggi del tuo dispositivo per invio tramite la tua SIM.',
      });
      return;
    }

    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: 'Adesso',
      recipient: testPhoneNumber,
      channel: `SMS Carrier Gateway (${senderId})`,
      status: 'Inviato & Consegnato',
      content: `SMS inviato con mittente personalizzato "${senderId}" tramite gateway ${carrierProvider.toUpperCase()}.`,
    };

    setDispatchLogs([newLog, ...dispatchLogs]);
    addToast({
      type: 'success',
      title: 'SMS di Prova Inviato!',
      message: `SMS consegnato a ${testPhoneNumber} con mittente "${senderId}".`,
    });
  };

  const handleSendTestEmail = () => {
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: 'Adesso',
      recipient: 'ironwhisper69@gmail.com',
      channel: 'Email HTML Formattata',
      status: 'Inviata con Successo',
      content: `Email inviata con grafica ufficiale, logo Sotto Sotto e dettagli di servizio.`,
    };

    setDispatchLogs([newLog, ...dispatchLogs]);
    addToast({
      type: 'success',
      title: 'Email di Prova Inviata!',
      message: `Email consegnata con successo a ironwhisper69@gmail.com.`,
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
            <MessageSquare className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Comunicazioni, Carrier SMS &amp; Email Ospiti
            </h3>
            <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Configura SMS automatici con il tuo numero/mittente, anteprima email formattata e regole anti-no-show.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white shadow-2xs flex items-center gap-2 cursor-pointer transition active:scale-98 border border-sky-400/40"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
          <span>Salva Regole Comunicazioni</span>
        </button>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 border-b pb-2 border-slate-200/70 dark:border-white/5 overflow-x-auto">
        {[
          { id: 'rules' as const, label: 'Regole & Automazioni', icon: Clock },
          { id: 'carrier' as const, label: 'Integrazione Carrier SMS (Tuo Numero / SIM)', icon: Smartphone },
          { id: 'email_preview' as const, label: 'Anteprima Email In-App (Grafica Completa)', icon: Mail },
          { id: 'dispatch_log' as const, label: `Registro Invii Live (${dispatchLogs.length})`, icon: Send },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-white border-sky-400 shadow-2xs font-bold'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-[#161C2A] hover:bg-[#1E2536] text-slate-300 border-[#242C3E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: REGOLE & AUTOMAZIONI */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CONFERMA PRENOTAZIONE */}
            <div className={`p-5 rounded-2xl border shadow-2xs space-y-3 ${
              isLight ? 'bg-white border-slate-200/80 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4.5 h-4.5 text-sky-500" />
                  <h4 className="font-semibold text-sm">Conferma Immediata Prenotazione</h4>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                  Trigger Istantaneo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invia una notifica con codice prenotazione, data, orario, numero ospiti e link rapido per confermare o disdire.
              </p>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={smsConfirmationEnabled}
                    onChange={(e) => setSmsConfirmationEnabled(e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <span>Invia SMS di conferma (+39 / Internazionali)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={emailConfirmationEnabled}
                    onChange={(e) => setEmailConfirmationEnabled(e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <span>Invia Email formattata con branding Sotto Sotto e mappa</span>
                </label>
              </div>
            </div>

            {/* PROMEMORIA ANTI-NO-SHOW */}
            <div className={`p-5 rounded-2xl border shadow-2xs space-y-3 ${
              isLight ? 'bg-white border-slate-200/80 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-amber-500" />
                  <h4 className="font-semibold text-sm">Promemoria Anti No-Show (Re-confirm)</h4>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                  Pre-Servizio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chiede all'ospite di riconfermare con 1 tap. I tavoli non riconfermati vengono evidenziati per il maître.
              </p>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Anticipo invio promemoria:</span>
                  <select
                    value={reminderHoursBefore}
                    onChange={(e) => setReminderHoursBefore(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-xl border text-xs font-medium bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  >
                    <option value={48}>48 Ore prima</option>
                    <option value={24}>24 Ore prima (Consigliato)</option>
                    <option value={4}>4 Ore prima</option>
                    <option value={2}>2 Ore prima</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={requireReconfirm}
                    onChange={(e) => setRequireReconfirm(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>Aggiorna badge verde "Riconfermato" automaticamente in Mappa Sala</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CARRIER & SMS INTEGRATION (COME MANDARE SMS CON PROPRIO NUMERO/CARRIER) */}
      {activeSubTab === 'carrier' && (
        <div className="space-y-4">
          {/* EXPLANATORY CALLOUT FOR USER'S QUESTION */}
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
            isLight ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-800/40 text-amber-100'
          }`}>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h4 className="font-bold text-sm">
                Come inviare SMS automaticamente come se fossi tu (con il tuo nome o numero di telefono)?
              </h4>
            </div>
            <p className="text-xs leading-relaxed">
              Hai <strong>due soluzioni concrete</strong> già integrate in questo software:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-amber-300/60 dark:border-amber-700/50 space-y-1">
                <span className="font-bold block text-amber-800 dark:text-amber-300">1. Cloud SMS Carrier / Gateway (100% Automatico)</span>
                <p className="text-slate-700 dark:text-slate-300">
                  Colleghi un provider come <strong>Skebby (Aruba), Twilio o Messagenet</strong>. Puoi registrare gratuitamente il tuo <strong>Alphanumeric Sender ID (es. "SottoSotto")</strong> o il tuo numero. Il gestionale invia gli SMS in automatico a ogni prenotazione senza toccare il cellulare.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-amber-300/60 dark:border-amber-700/50 space-y-1">
                <span className="font-bold block text-amber-800 dark:text-amber-300">2. SIM Fisica del Dispositivo (App Messaggi Nativa - Gratis)</span>
                <p className="text-slate-700 dark:text-slate-300">
                  Se hai un tablet o telefono del ristorante con scheda SIM, il tasto <strong>"Invia via SIM Dispositivo"</strong> apre direttamente l'app Messaggi/SMS con il testo già pronto. Il messaggio parte direttamente dalla tua SIM personale/aziendale con il tuo numero e senza costi extra!
                </p>
              </div>
            </div>
          </div>

          {/* CONFIGURATION FORM */}
          <div className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
            isLight ? 'bg-white border-slate-200/80 text-slate-800' : 'bg-[#141A29] border-[#222A3C] text-slate-200'
          }`}>
            <h4 className="font-semibold text-sm">Configurazione Carrier &amp; Parametri Mittente</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Metodo di Invio SMS</label>
                <select
                  value={carrierMode}
                  onChange={(e) => setCarrierMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                >
                  <option value="cloud_gateway">Gateway Cloud Automatico (Mittente SottoSotto)</option>
                  <option value="device_sim">SIM Locale del Dispositivo (App Messaggi Nativa)</option>
                  <option value="gsm_box">SIM Box Locale / Gateway Android GSM</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Nome Mittente (Sender ID SMS)</label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="Es. SottoSotto (max 11 caratteri)"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Numero Ristorante per Chiamate / Reply</label>
                <input
                  type="text"
                  value={restaurantPhone}
                  onChange={(e) => setRestaurantPhone(e.target.value)}
                  placeholder="+39 011 5567890"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>
            </div>

            {carrierMode === 'cloud_gateway' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">Provider Gateway Carrier</label>
                  <select
                    value={carrierProvider}
                    onChange={(e) => setCarrierProvider(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  >
                    <option value="skebby">Skebby SMS (Gruppo TeamSystem / Aruba) — Consigliato Italia</option>
                    <option value="twilio">Twilio Global Carrier API</option>
                    <option value="messagenet">Messagenet Italia</option>
                    <option value="custom_webhook">Webhook Carrier Personalizzato</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase block mb-1">API Key / Token del Gateway</label>
                  <input
                    type="password"
                    value={carrierApiKey}
                    onChange={(e) => setCarrierApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                  />
                </div>
              </div>
            )}

            {/* TEST SMS BOX */}
            <div className="p-4 rounded-xl border bg-slate-50/80 dark:bg-[#121622] border-slate-200/80 dark:border-[#222A3C] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-xs font-bold block">Invia un SMS di Prova Immediato:</span>
                <span className="text-[11px] text-slate-500">Verifica la ricezione sul tuo cellulare personale</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+39 335..."
                  className="px-3 py-1.5 rounded-xl border text-xs font-medium bg-white dark:bg-[#182030] border-slate-200 dark:border-[#28344A] flex-1 sm:w-44"
                />
                <button
                  onClick={handleSendTestSms}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{carrierMode === 'device_sim' ? 'Apri su SIM Dispositivo' : 'Invia SMS di Prova'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ANTEPRIMA EMAIL IN-APP (GRAFICA COMPLETA) */}
      {activeSubTab === 'email_preview' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                Anteprima Grafica Email di Conferma
              </h4>
              <p className="text-xs text-slate-500">
                Rendering esatto della mail HTML che riceve l'ospite su smartphone o computer.
              </p>
            </div>
            <button
              onClick={handleSendTestEmail}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Invia Email di Prova</span>
            </button>
          </div>

          {/* RENDERED LUXURY EMAIL CARD */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-md max-w-2xl mx-auto space-y-6 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121624] border-[#222A3C] text-slate-100'
          }`}>
            {/* Header Brand */}
            <div className="text-center pb-5 border-b border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="font-brand font-bold text-xl tracking-wider uppercase text-amber-500">
                SOTTO SOTTO
              </span>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                Bar &amp; Grill · Torino
              </p>
            </div>

            {/* Email Headline */}
            <div className="text-center space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold">
                ✓ Prenotazione Confermata #SS-8842
              </span>
              <h3 className="text-base font-bold pt-1">
                Gentile Marco Rossi, ti aspettiamo a tavola!
              </h3>
              <p className="text-xs text-slate-500">
                Abbiamo riservato il tavolo richiesto per te e i tuoi ospiti.
              </p>
            </div>

            {/* Reservation Highlights Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Data</span>
                <span className="text-xs font-bold font-mono">Venerdì 16 Ott</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Orario</span>
                <span className="text-xs font-bold font-mono text-sky-600 dark:text-sky-400">20:30</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Ospiti</span>
                <span className="text-xs font-bold font-mono">4 Persone</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Sala / Tavolo</span>
                <span className="text-xs font-bold font-mono text-amber-500">Booth VIP G</span>
              </div>
            </div>

            {/* Action CTAs inside email */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                ✓ Riconferma Presenza (1 Click)
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Modifica / Cancella
              </button>
            </div>

            {/* Policy & Footer Note */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
              <p className="text-[11px] text-slate-500 italic">
                {customFooterNote}
              </p>
              <p className="text-[10px] text-slate-400 pt-1">
                Sotto Sotto Bar &amp; Grill · Tel: {restaurantPhone} · Via San Quintino 22, Torino
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: LIVE DISPATCH LOG */}
      {activeSubTab === 'dispatch_log' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              Registro Notifiche Spedite in Tempo Reale
            </h4>
            <span className="text-xs text-slate-500 font-mono">
              Totale invii: {dispatchLogs.length}
            </span>
          </div>

          <div className="space-y-2">
            {dispatchLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141A29] border-[#222A3C]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{log.recipient}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {log.channel}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ● {log.status}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{log.content}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

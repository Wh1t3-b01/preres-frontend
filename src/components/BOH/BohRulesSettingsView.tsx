import React from 'react';
import { BohRules } from '../../types/boh';
import { VIPTier } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Users,
  Clock,
  Bell,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
  PhoneCall,
  DollarSign,
  Crown,
  Sparkles,
} from 'lucide-react';

interface BohRulesSettingsViewProps {
  rules: BohRules;
  onUpdateRules: (updated: BohRules, changeReason?: string) => void;
}

const VIP_TIER_OPTIONS: { id: VIPTier; label: string; description: string }[] = [
  { id: 'top_spender', label: 'Top Spenders', description: 'Ospiti con spesa media elevata o spesa storica > €2,000' },
  { id: 'vip', label: 'Clienti VIP', description: 'Ospiti abituali e titolari di prenotazioni ricorrenti' },
  { id: 'friends_family', label: 'Friends & Family', description: 'Contatti della proprietà e management' },
  { id: 'regular', label: 'Clientela Standard', description: 'Tutti gli altri utenti iscritti alla lista d’attesa' },
];

export const BohRulesSettingsView: React.FC<BohRulesSettingsViewProps> = ({
  rules,
  onUpdateRules,
}) => {
  const { theme } = useRestaurant();
  const isLight = theme === 'light';

  const handleUpdate = (updater: (prev: BohRules) => BohRules, reason?: string) => {
    const next = updater(rules);
    onUpdateRules(next, reason);
  };

  const toggleTier = (tier: VIPTier) => {
    const current = rules.reservationBehavior.earlyNotificationTiers || [];
    const nextTiers = current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier];
    handleUpdate(
      (prev) => ({
        ...prev,
        reservationBehavior: {
          ...prev.reservationBehavior,
          earlyNotificationTiers: nextTiers,
        },
      }),
      `Aggiornati tier VIP notifiche anticipate (${nextTiers.join(', ')})`
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP OVERVIEW HEADER */}
      <div className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div>
          <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Regole Operative, Politiche & Disponibilità BOH
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Configura le soglie di accettazione per grandi gruppi, gestione ritardi, turn times vincolanti e canali waitlist.
          </p>
        </div>

        <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full border ${
          isLight ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-[#8B31E0]/20 text-[#C084FC] border-[#8B31E0]/40'
        }`}>
          Criteri Standard Attivi (FOH & Regole di Prenotazione)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* CARD 1: LARGE PARTY RULES */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-950/40 border-amber-800 text-amber-300'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Regole Grandi Gruppi (Large Parties)</h4>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Soglie party size e blocco prenotazione online automatica
              </span>
            </div>
          </div>

          {/* Threshold config */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold">Soglia Considerata "Grande Gruppo":</span>
                <span className="font-mono font-bold text-sky-600 text-sm">
                  {rules.largeParty.threshold} o più persone
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                value={rules.largeParty.threshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  handleUpdate(
                    (p) => ({ ...p, largeParty: { ...p.largeParty, threshold: val } }),
                    `Soglia grandi gruppi impostata a ${val} pax`
                  );
                }}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>4 pax</span>
                <span>6 pax (Consigliato)</span>
                <span>8 pax</span>
                <span>12 pax</span>
              </div>
            </div>

            {/* Disable online booking toggle */}
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div className="space-y-0.5">
                <span className="text-xs font-bold block flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
                  <span>Richiedi Chiamata Telefonica</span>
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Disabilita il booking automatico online per gruppi pari o superiori alla soglia.
                </span>
              </div>
              <input
                type="checkbox"
                checked={rules.largeParty.disableOnlineBooking}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleUpdate(
                    (p) => ({ ...p, largeParty: { ...p.largeParty, disableOnlineBooking: val } }),
                    val ? 'Attivata richiesta telefonica obbligatoria grandi gruppi' : 'Disattivata richiesta telefonica'
                  );
                }}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {/* Deposit requirement */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Caparra Confirmatoria Richiesta</span>
                </span>
                <input
                  type="checkbox"
                  checked={rules.largeParty.requireDeposit}
                  onChange={(e) => {
                    const val = e.target.checked;
                    handleUpdate(
                      (p) => ({ ...p, largeParty: { ...p.largeParty, requireDeposit: val } }),
                      val ? 'Attivata caparra grandi gruppi' : 'Disattivata caparra'
                    );
                  }}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {rules.largeParty.requireDeposit && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500">Importo per coperto:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">€</span>
                    <input
                      type="number"
                      min="10"
                      max="150"
                      value={rules.largeParty.depositAmountPerCover}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 25;
                        handleUpdate(
                          (p) => ({ ...p, largeParty: { ...p.largeParty, depositAmountPerCover: val } }),
                          `Caparra per coperto impostata a €${val}`
                        );
                      }}
                      className="w-16 px-2 py-0.5 border rounded text-xs font-bold text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom notice */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Avviso Mostrato al Cliente nel Widget
              </label>
              <textarea
                rows={2}
                value={rules.largeParty.customNotice}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdate((p) => ({ ...p, largeParty: { ...p.largeParty, customNotice: val } }));
                }}
                className="w-full p-2 rounded-xl border text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: LATE ARRIVAL MANAGEMENT & TURN TIMES */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Gestione Arrivi in Ritardo (Late Arrivals)</h4>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Preservazione orario di uscita originale & prevenzione overbooking
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Maintain original out-time toggle */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">
                    Mantieni Orario di Fine Tavolo Originale
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Se l'ospite prenota alle 20:00 (durata 90m) e arriva alle 20:20, il tavolo scade comunque alle 21:30 per non ritardare il 2° turno.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.lateArrival.maintainOriginalOutTime}
                  onChange={(e) => {
                    const val = e.target.checked;
                    handleUpdate(
                      (p) => ({ ...p, lateArrival: { ...p.lateArrival, maintainOriginalOutTime: val } }),
                      val ? 'Attivato mantenimento orario di uscita originale' : 'Disattivato'
                    );
                  }}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer shrink-0"
                />
              </div>

              {/* OVERBOOKING RISK WARNING BANNER */}
              {rules.lateArrival.maintainOriginalOutTime && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Avviso Rischio Overbooking:</strong>
                    <span className="text-[11px] leading-relaxed">
                      Se un ospite in ritardo prolunga il pasto oltre l'orario prefissato senza accordo, il sistema segnalerà tempestivamente il tavolo in giallo/rosso prima dell'arrivo della prenotazione successiva.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Grace period setting */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div>
                <span className="text-xs font-bold block">Periodo di Tolleranza (Grace Period)</span>
                <span className="text-[11px] text-slate-400">Tempo massimo d'attesa prima di contrassegnare come No-Show</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={rules.lateArrival.gracePeriodMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 15;
                    handleUpdate(
                      (p) => ({ ...p, lateArrival: { ...p.lateArrival, gracePeriodMinutes: val } }),
                      `Tolleranza ritardo impostata a ${val} min`
                    );
                  }}
                  className="w-14 px-2 py-1 rounded border text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-400">minuti</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: ONLINE WAITLIST POLICIES */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-sky-950/40 border-sky-800 text-sky-300'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Lista d'Attesa Online (Waitlist Live)</h4>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Abilitazione canale online e limiti di accodamento
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Toggle Online Waitlist on/off */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div>
                <span className="text-xs font-bold block">Accetta Iscrizioni Waitlist Online</span>
                <span className="text-[11px] text-slate-400">Permette ai commensali di iscriversi in lista da smartphone</span>
              </div>
              <input
                type="checkbox"
                checked={rules.onlineWaitlist.enabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleUpdate(
                    (p) => ({ ...p, onlineWaitlist: { ...p.onlineWaitlist, enabled: val } }),
                    val ? 'Abilitata lista attesa online' : 'Disabilitata lista attesa online'
                  );
                }}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {/* Min and Max party size for waitlist */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Min Party Size Waitlist
                </label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    min="1"
                    max={rules.onlineWaitlist.maxPartySize}
                    value={rules.onlineWaitlist.minPartySize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      handleUpdate((p) => ({ ...p, onlineWaitlist: { ...p.onlineWaitlist, minPartySize: val } }));
                    }}
                    className="w-full px-2 py-1 rounded border text-xs font-bold text-center"
                  />
                  <span className="text-xs text-slate-400">pax</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
              }`}>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Max Party Size Waitlist
                </label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    min={rules.onlineWaitlist.minPartySize}
                    max="14"
                    value={rules.onlineWaitlist.maxPartySize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 6;
                      handleUpdate((p) => ({ ...p, onlineWaitlist: { ...p.onlineWaitlist, maxPartySize: val } }));
                    }}
                    className="w-full px-2 py-1 rounded border text-xs font-bold text-center"
                  />
                  <span className="text-xs text-slate-400">pax</span>
                </div>
              </div>
            </div>

            {/* Auto notify window */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500">Finestra Chiamata Tavolo (SMS):</span>
              <span className="font-mono font-bold text-sky-600">
                {rules.onlineWaitlist.autoNotifyWindowMins} minuti di validità
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: RESERVATION BEHAVIOR & VIP EARLY NOTIFICATIONS */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-[#222A3C]'
        }`}>
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Comportamento Spostamento & Notifiche VIP</h4>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ricalcolo turni e canali di prelazione cancellazioni
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Auto recalculate turn times on move */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171D2B] border-[#273248]'
            }`}>
              <div>
                <span className="text-xs font-bold block">Ricalcola Turn Time allo Spostamento</span>
                <span className="text-[11px] text-slate-400">Adatta automaticamente la durata in base alla nuova fascia oraria</span>
              </div>
              <input
                type="checkbox"
                checked={rules.reservationBehavior.recalculateTurnOnMove}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleUpdate(
                    (p) => ({ ...p, reservationBehavior: { ...p.reservationBehavior, recalculateTurnOnMove: val } }),
                    val ? 'Ricalcolo automatico durata attivato' : 'Disattivato'
                  );
                }}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {/* VIP Tiers Early Notifications */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Tier Ospiti con Prelazione Notifica per Tavoli Riaperti:
              </span>

              <div className="space-y-1.5">
                {VIP_TIER_OPTIONS.map((tier) => {
                  const isChecked = (rules.reservationBehavior.earlyNotificationTiers || []).includes(tier.id);
                  return (
                    <div
                      key={tier.id}
                      onClick={() => toggleTier(tier.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isChecked
                          ? isLight
                            ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs font-medium'
                            : 'bg-[#1A2338] border-sky-600 text-sky-200'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-[#171D2B] border-[#273248] text-slate-400'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block flex items-center gap-1.5">
                          {tier.id === 'top_spender' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                          {tier.id === 'vip' && <Crown className="w-3.5 h-3.5 text-sky-500" />}
                          <span>{tier.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block">{tier.description}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 accent-sky-500 rounded pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Sparkles,
  Plus,
  Calendar,
  Clock,
  Euro,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  Tag,
  Wine,
  Utensils,
  Award,
  ChevronRight,
  Sliders,
  Eye,
  Mail,
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Send,
} from 'lucide-react';

export interface ExperienceCourse {
  id: string;
  type: string; // 'Benvenuto dello Chef' | 'Antipasto' | 'Primo Piatto' | 'Secondo Piatto' | 'Pre-Dessert' | 'Dessert'
  dishTitle: string;
  dishDescription?: string;
}

export interface DiningExperience {
  id: string;
  title: string;
  description: string;
  pricePerPerson: number;
  minGuests: number;
  maxGuests: number;
  availableDays: string[]; // ['lun', 'mar', ...]
  shifts: ('lunch' | 'dinner')[];
  depositRequired: boolean;
  depositAmount: number;
  isActive: boolean;
  coursesCount: number;
  winePairingAvailable: boolean;
  winePairingPrice?: number;
  winePairingLabel?: string;
  bookedCoversThisMonth: number;
  revenueThisMonth: number;
  courses: ExperienceCourse[];
}

const INITIAL_EXPERIENCES: DiningExperience[] = [
  {
    id: 'exp_tasting_5',
    title: 'Percorso Degustazione "Classici Sotto Sotto"',
    description: 'Menu 5 portate con specialità storiche dello Chef, pasta fresca fatta in casa e secondi di carne e pesce.',
    pricePerPerson: 85,
    minGuests: 2,
    maxGuests: 8,
    availableDays: ['mar', 'mer', 'gio', 'ven', 'sab', 'dom'],
    shifts: ['lunch', 'dinner'],
    depositRequired: true,
    depositAmount: 30,
    isActive: true,
    coursesCount: 5,
    winePairingAvailable: true,
    winePairingPrice: 45,
    winePairingLabel: 'Accostamento Enologico (4 calici selezionati dalla nostra Cantina Riserve)',
    bookedCoversThisMonth: 142,
    revenueThisMonth: 12070,
    courses: [
      {
        id: 'c_1',
        type: 'Benvenuto dello Chef',
        dishTitle: 'Bignè salato con crema di Raschera DOP & gocce di tartufo',
        dishDescription: 'Piccolo assaggio di apertura servito con calice di Metodo Classico.',
      },
      {
        id: 'c_2',
        type: 'Antipasto',
        dishTitle: 'Battuta di Fassona Piemontese al coltello & Tartufo Nero',
        dishDescription: 'Carne cruda selezionata, tuorlo d’uovo marinato, nocciole Piemonte IGP tostate.',
      },
      {
        id: 'c_3',
        type: 'Primo Piatto',
        dishTitle: 'Plin della Tradizione al Sugo d’Arrosto',
        dishDescription: 'Pasta all’uovo sottilissima pizzicata a mano, burro d’alpeggio e ristretto di carne.',
      },
      {
        id: 'c_4',
        type: 'Secondo Piatto',
        dishTitle: 'Brasato al Barolo DOCG con Polenta Taragna',
        dishDescription: 'Cappello del prete stufato per 8 ore a bassa temperatura nel vino Barolo delle Langhe.',
      },
      {
        id: 'c_5',
        type: 'Dessert',
        dishTitle: 'Bonet Tradizionale Torinese con Caramello Salato',
        dishDescription: 'Budino di cacao, amaretti e rum servito con gelato alla crema vaniglia Bourbon.',
      },
    ],
  },
  {
    id: 'exp_chef_table',
    title: "Chef's Table VIP & Selezione Riserve",
    description: "Esperienza esclusiva per 2-4 ospiti nella zona riservata MAIN A, con accoglienza dallo Chef e abbinamento grandi annate.",
    pricePerPerson: 140,
    minGuests: 2,
    maxGuests: 4,
    availableDays: ['gio', 'ven', 'sab'],
    shifts: ['dinner'],
    depositRequired: true,
    depositAmount: 50,
    isActive: true,
    coursesCount: 7,
    winePairingAvailable: true,
    winePairingPrice: 65,
    winePairingLabel: 'Accostamento Grandi Annate (6 etichette prestigiose: Barolo, Barbaresco e Champagne)',
    bookedCoversThisMonth: 38,
    revenueThisMonth: 5320,
    courses: [
      {
        id: 'c_ct_1',
        type: 'Aperitivo & Benvenuto',
        dishTitle: 'Ostrica Gillardeau alla brace con perle di caviale e mela verde',
        dishDescription: 'In apertura accompagnata da Champagne Blanc de Blancs Brut.',
      },
      {
        id: 'c_ct_2',
        type: 'Antipasto',
        dishTitle: 'Capasanta scottata su crema di topinambur e chips di carciofo',
        dishDescription: 'Nocciola croccante e riduzione all’aceto balsamico tradizionale di Modena 25 anni.',
      },
      {
        id: 'c_ct_3',
        type: 'Primo Piatto',
        dishTitle: 'Risotto Carnaroli Riserva con Quaglie Laccate & Melograno',
        dishDescription: 'Mantecatura al Parmigiano Reggiano 36 mesi e riduzione di melograno.',
      },
      {
        id: 'c_ct_4',
        type: 'Secondo Primo',
        dishTitle: 'Tortelli di Faraona con Consommè al Tartufo Bianco',
        dishDescription: 'Brodo chiarificato e lamelle di tartufo bianco d’Alba.',
      },
      {
        id: 'c_ct_5',
        type: 'Secondo Piatto',
        dishTitle: 'Filetto di Cervo in crosta di erbe con fondo al ginepro',
        dishDescription: 'Purea di castagne affumicate e mirtilli selvatici spadellati al burro chiarificato.',
      },
      {
        id: 'c_ct_6',
        type: 'Pre-Dessert',
        dishTitle: 'Sorbetto al mandarino tardivo, salvia e zenzero',
        dishDescription: 'Freschezza aromatica per preparare il palato al gran finale.',
      },
      {
        id: 'c_ct_7',
        type: 'Dessert',
        dishTitle: 'Sfera al Cioccolato Valrhona 72% con cuore morbido ai lamponi',
        dishDescription: 'Crumble speziato alla cannella e terra di fave di cacao tostate.',
      },
    ],
  },
  {
    id: 'exp_sunday_family',
    title: 'Pranzo della Domenica all’Italiana',
    description: 'Formula conviviale domenicale con antipasto all’italiana, bis di primi della tradizione e dolce artigianale.',
    pricePerPerson: 55,
    minGuests: 3,
    maxGuests: 12,
    availableDays: ['dom'],
    shifts: ['lunch'],
    depositRequired: false,
    depositAmount: 0,
    isActive: true,
    coursesCount: 4,
    winePairingAvailable: true,
    winePairingPrice: 25,
    winePairingLabel: 'Accostamento Vini Conviviali (Nebbiolo e Barbera d’Alba a volontà per il tavolo)',
    bookedCoversThisMonth: 86,
    revenueThisMonth: 4730,
    courses: [
      {
        id: 'c_sun_1',
        type: 'Antipasti della Festa',
        dishTitle: 'Tagliere Nobile di Salumi Piemontesi, Vitello Tonnato & Insalata Russa',
        dishDescription: 'I grandi classici degli antipasti piemontesi della domenica in famiglia.',
      },
      {
        id: 'c_sun_2',
        type: 'Bis di Primi',
        dishTitle: 'Agnolotti al Burro & Salvia e Tagliolini ai Funghi',
        dishDescription: 'Due primi piatti fumanti serviti al centro tavola da condividere.',
      },
      {
        id: 'c_sun_3',
        type: 'Secondo Piatto',
        dishTitle: 'Arrosto di Vitella da Latte con Patate al Forno al Rosmarino',
        dishDescription: 'Cottura lenta tradizionale con sughetto ristretto al vino bianco.',
      },
      {
        id: 'c_sun_4',
        type: 'Dolce della Domenica',
        dishTitle: 'Torta di Nocciole Piemonte IGP con Crema allo Zabaione caldo',
        dishDescription: 'Preparata fresca al mattino dalla nostra pasticceria interna.',
      },
    ],
  },
];

export const BohExperiencesView: React.FC = () => {
  const { theme, isHighContrast, addToast } = useRestaurant();
  const isLight = theme === 'light';

  const [experiences, setExperiences] = useState<DiningExperience[]>(() => {
    const saved = localStorage.getItem('sotto_boh_experiences');
    return saved ? JSON.parse(saved) : INITIAL_EXPERIENCES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<DiningExperience | null>(null);

  const [selectedExpForMenuLayout, setSelectedExpForMenuLayout] = useState<DiningExperience | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('dott.moretti@studiolegalemoretti.com');
  const [recipientName, setRecipientName] = useState('Avv. Andrea Moretti');
  const [isEditingCoursesInLayout, setIsEditingCoursesInLayout] = useState(false);
  const [newCourseType, setNewCourseType] = useState('Antipasto');
  const [newCourseDishTitle, setNewCourseDishTitle] = useState('');
  const [newCourseDishDesc, setNewCourseDishDesc] = useState('');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState(75);
  const [formMinGuests, setFormMinGuests] = useState(2);
  const [formMaxGuests, setFormMaxGuests] = useState(6);
  const [formCourses, setFormCourses] = useState(5);
  const [formDeposit, setFormDeposit] = useState(25);
  const [formWinePairing, setFormWinePairing] = useState(true);
  const [formWinePrice, setFormWinePrice] = useState(40);
  const [formWineLabel, setFormWineLabel] = useState('Accostamento Enologico (calici selezionati dal sommelier)');
  const [formCoursesList, setFormCoursesList] = useState<ExperienceCourse[]>([]);

  const handleOpenCreate = () => {
    setEditingExp(null);
    setFormTitle('');
    setFormDesc('');
    setFormPrice(75);
    setFormMinGuests(2);
    setFormMaxGuests(6);
    setFormCourses(5);
    setFormDeposit(25);
    setFormWinePairing(true);
    setFormWinePrice(40);
    setFormWineLabel('Accostamento Enologico (calici selezionati dal sommelier)');
    setFormCoursesList([
      { id: 'nc_1', type: 'Benvenuto', dishTitle: 'Assaggio di apertura dello Chef' },
      { id: 'nc_2', type: 'Antipasto', dishTitle: 'Antipasto della tradizione piemontese' },
      { id: 'nc_3', type: 'Primo', dishTitle: 'Primo piatto di pasta fresca all’uovo' },
      { id: 'nc_4', type: 'Secondo', dishTitle: 'Secondo piatto di carne o pescato del giorno' },
      { id: 'nc_5', type: 'Dessert', dishTitle: 'Dolce artigianale della casa' },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: DiningExperience) => {
    setEditingExp(exp);
    setFormTitle(exp.title);
    setFormDesc(exp.description);
    setFormPrice(exp.pricePerPerson);
    setFormMinGuests(exp.minGuests);
    setFormMaxGuests(exp.maxGuests);
    setFormCourses(exp.coursesCount);
    setFormDeposit(exp.depositAmount);
    setFormWinePairing(exp.winePairingAvailable);
    setFormWinePrice(exp.winePairingPrice || 40);
    setFormWineLabel(exp.winePairingLabel || 'Accostamento Enologico (calici selezionati dal sommelier)');
    setFormCoursesList(exp.courses || []);
    setIsModalOpen(true);
  };

  const handleSaveExperience = () => {
    if (!formTitle.trim()) {
      alert('Inserisci un titolo per l’esperienza');
      return;
    }

    let updated: DiningExperience[];
    if (editingExp) {
      updated = experiences.map((e) =>
        e.id === editingExp.id
          ? {
              ...e,
              title: formTitle,
              description: formDesc,
              pricePerPerson: formPrice,
              minGuests: formMinGuests,
              maxGuests: formMaxGuests,
              coursesCount: formCoursesList.length || formCourses,
              depositAmount: formDeposit,
              depositRequired: formDeposit > 0,
              winePairingAvailable: formWinePairing,
              winePairingPrice: formWinePairing ? formWinePrice : undefined,
              winePairingLabel: formWinePairing ? formWineLabel : undefined,
              courses: formCoursesList,
            }
          : e
      );
      addToast({ type: 'success', title: 'Esperienza Aggiornata', message: `Modifiche salvate per "${formTitle}"` });
    } else {
      const newExp: DiningExperience = {
        id: `exp_${Date.now().toString(36)}`,
        title: formTitle,
        description: formDesc,
        pricePerPerson: formPrice,
        minGuests: formMinGuests,
        maxGuests: formMaxGuests,
        availableDays: ['mar', 'mer', 'gio', 'ven', 'sab', 'dom'],
        shifts: ['lunch', 'dinner'],
        depositRequired: formDeposit > 0,
        depositAmount: formDeposit,
        isActive: true,
        coursesCount: formCoursesList.length || formCourses,
        winePairingAvailable: formWinePairing,
        winePairingPrice: formWinePairing ? formWinePrice : undefined,
        winePairingLabel: formWinePairing ? formWineLabel : undefined,
        bookedCoversThisMonth: 0,
        revenueThisMonth: 0,
        courses: formCoursesList,
      };
      updated = [...experiences, newExp];
      addToast({ type: 'success', title: 'Nuova Esperienza Creata', message: `Pacchetto "${formTitle}" online` });
    }

    setExperiences(updated);
    localStorage.setItem('sotto_boh_experiences', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handleAddCourseToActive = (expId: string) => {
    if (!newCourseDishTitle.trim()) return;

    const newCourse: ExperienceCourse = {
      id: `c_${Date.now().toString(36)}`,
      type: newCourseType,
      dishTitle: newCourseDishTitle,
      dishDescription: newCourseDishDesc,
    };

    const updated = experiences.map((e) => {
      if (e.id === expId) {
        const nextCourses = [...(e.courses || []), newCourse];
        return {
          ...e,
          courses: nextCourses,
          coursesCount: nextCourses.length,
        };
      }
      return e;
    });

    setExperiences(updated);
    localStorage.setItem('sotto_boh_experiences', JSON.stringify(updated));
    if (selectedExpForMenuLayout && selectedExpForMenuLayout.id === expId) {
      setSelectedExpForMenuLayout({
        ...selectedExpForMenuLayout,
        courses: [...(selectedExpForMenuLayout.courses || []), newCourse],
        coursesCount: (selectedExpForMenuLayout.courses?.length || 0) + 1,
      });
    }

    setNewCourseDishTitle('');
    setNewCourseDishDesc('');
    addToast({
      type: 'success',
      title: 'Portata Aggiunta al Menù',
      message: `Aggiunto "${newCourse.dishTitle}" al percorso degustazione.`,
    });
  };

  const handleDeleteCourseFromActive = (expId: string, courseId: string) => {
    const updated = experiences.map((e) => {
      if (e.id === expId) {
        const nextCourses = (e.courses || []).filter((c) => c.id !== courseId);
        return {
          ...e,
          courses: nextCourses,
          coursesCount: nextCourses.length,
        };
      }
      return e;
    });

    setExperiences(updated);
    localStorage.setItem('sotto_boh_experiences', JSON.stringify(updated));
    if (selectedExpForMenuLayout && selectedExpForMenuLayout.id === expId) {
      const nextCourses = (selectedExpForMenuLayout.courses || []).filter((c) => c.id !== courseId);
      setSelectedExpForMenuLayout({
        ...selectedExpForMenuLayout,
        courses: nextCourses,
        coursesCount: nextCourses.length,
      });
    }
  };

  const handleUpdatePriceInActive = (expId: string, newPrice: number, newWinePrice?: number) => {
    const updated = experiences.map((e) => {
      if (e.id === expId) {
        return {
          ...e,
          pricePerPerson: newPrice,
          winePairingPrice: newWinePrice !== undefined ? newWinePrice : e.winePairingPrice,
        };
      }
      return e;
    });

    setExperiences(updated);
    localStorage.setItem('sotto_boh_experiences', JSON.stringify(updated));
    if (selectedExpForMenuLayout && selectedExpForMenuLayout.id === expId) {
      setSelectedExpForMenuLayout({
        ...selectedExpForMenuLayout,
        pricePerPerson: newPrice,
        winePairingPrice: newWinePrice !== undefined ? newWinePrice : selectedExpForMenuLayout.winePairingPrice,
      });
    }
  };

  const handleCopyMenuText = (exp: DiningExperience) => {
    const lines = [
      `✦ RISTORANTE SOTTO SOTTO BAR & GRILL — TORINO ✦`,
      `PROPOSTA GASTRONOMICA SPECIALE: ${exp.title.toUpperCase()}`,
      `"${exp.description}"`,
      ``,
      `LE NOSTRE PORTATE:`,
      ...(exp.courses || []).map(
        (c, i) => `${i + 1}. [${c.type.toUpperCase()}] ${c.dishTitle}${c.dishDescription ? `\n   ${c.dishDescription}` : ''}`
      ),
      ``,
      `───────────────────────────────`,
      `PREZZO DEL MENÙ: €${exp.pricePerPerson} a persona (pane, servizio e coperto inclusi)`,
      exp.winePairingAvailable
        ? `ACCOSTAMENTO ENOLOGICO: +€${exp.winePairingPrice} a persona (${exp.winePairingLabel || 'selezione del sommelier'})`
        : '',
      exp.winePairingAvailable
        ? `TOTALE ESPERIENZA COMPLETA CON VINI: €${exp.pricePerPerson + (exp.winePairingPrice || 0)} a persona`
        : '',
      `───────────────────────────────`,
      `Per confermare la prenotazione esclusiva: Tel. +39 011 5567890 · booking@sottosotto.it`,
      `Sotto Sotto Bar & Grill · Via San Quintino 22, Torino`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    addToast({
      type: 'success',
      title: 'Menù Copiato negli Appunti!',
      message: 'Il testo formattato del menù è pronto per essere incollato nella tua email per il cliente.',
    });
  };

  const handleSendMenuEmailDirect = () => {
    if (!recipientEmail.trim()) {
      alert('Inserisci l’indirizzo email del cliente');
      return;
    }

    addToast({
      type: 'success',
      title: 'Email Inviata con Successo!',
      message: `Il menù elegante "${selectedExpForMenuLayout?.title}" è stato recapitato a ${recipientEmail}.`,
    });
    setIsEmailModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    const updated = experiences.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e));
    setExperiences(updated);
    localStorage.setItem('sotto_boh_experiences', JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    if (confirm('Eliminare definitivamente questa esperienza gastronomica?')) {
      const updated = experiences.filter((e) => e.id !== id);
      setExperiences(updated);
      localStorage.setItem('sotto_boh_experiences', JSON.stringify(updated));
      addToast({ type: 'info', title: 'Esperienza Rimossa', message: 'Il pacchetto non è più prenotabile' });
    }
  };

  const totalRevenue = experiences.reduce((acc, e) => acc + e.revenueThisMonth, 0);
  const totalCovers = experiences.reduce((acc, e) => acc + e.bookedCoversThisMonth, 0);

  return (
    <div className="space-y-6">
      {/* 1. HEADER & KPI CARDS */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white/80 border-slate-200/70' : 'bg-[#121622] border-[#222A3C]'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-medium">
              <Sparkles className="w-4.5 h-4.5 stroke-[1.5]" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                Esperienze & Degustazioni Prenotabili
              </h3>
              <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Crea pacchetti speciali a prezzo fisso, orari dedicati e caparre per massimizzare lo scontrino medio.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white shadow-2xs flex items-center gap-2 cursor-pointer transition active:scale-98 border border-sky-400/40"
        >
          <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>+ Nuova Esperienza</span>
        </button>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xs ${
          isLight ? 'bg-white/70 border-slate-200/70 text-slate-800' : 'bg-[#141A28] border-[#222A3C] text-slate-200'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-medium text-slate-400 block tracking-wider">Ricavi Esperienze Mese</span>
            <span className="text-xl font-semibold font-mono mt-0.5 block">€{totalRevenue.toLocaleString('it-IT')}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Euro className="w-4.5 h-4.5 stroke-[1.5]" />
          </div>
        </div>
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xs ${
          isLight ? 'bg-white/70 border-slate-200/70 text-slate-800' : 'bg-[#141A28] border-[#222A3C] text-slate-200'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-medium text-slate-400 block tracking-wider">Coperti Esperienza Venduti</span>
            <span className="text-xl font-semibold font-mono mt-0.5 block">{totalCovers} ospiti</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="w-4.5 h-4.5 stroke-[1.5]" />
          </div>
        </div>
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xs ${
          isLight ? 'bg-white/70 border-slate-200/70 text-slate-800' : 'bg-[#141A28] border-[#222A3C] text-slate-200'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-medium text-slate-400 block tracking-wider">Scontrino Medio / Ospite</span>
            <span className="text-xl font-semibold font-mono mt-0.5 block">
              €{totalCovers > 0 ? Math.round(totalRevenue / totalCovers) : 85}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Award className="w-4.5 h-4.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* 2. LIST OF EXPERIENCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              exp.isActive
                ? isLight
                  ? 'bg-white/90 border-slate-200/80 hover:border-sky-300 shadow-2xs'
                  : 'bg-[#141A29] border-[#222A3C] hover:border-sky-500/40 shadow-2xs'
                : isLight
                ? 'bg-slate-50/60 border-slate-200/50 opacity-60'
                : 'bg-[#0F131D] border-slate-800/60 opacity-50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div>
                  <span className={`text-[9px] font-mono font-medium uppercase px-2 py-0.5 rounded-full border ${
                    exp.isActive
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                      : isLight
                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {exp.isActive ? '● Prenotabile Online' : '○ Disattivata'}
                  </span>
                  <h4 className={`font-medium text-sm mt-1.5 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                    {exp.title}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-base font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    €{exp.pricePerPerson}
                  </span>
                  <span className="text-[10px] block font-normal text-slate-400">a persona</span>
                </div>
              </div>

              <p className={`text-xs mt-3 leading-relaxed font-normal ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {exp.description}
              </p>

              <div className="mt-4 space-y-1.5 text-[11px] font-normal">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-sky-500 stroke-[1.5]" />
                    <span>Portate incluse:</span>
                  </span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{exp.coursesCount} portate</span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-500 stroke-[1.5]" />
                    <span>Tavoli ammessi:</span>
                  </span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                    {exp.minGuests} - {exp.maxGuests} persone
                  </span>
                </div>

                {exp.winePairingAvailable && (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Wine className="w-3.5 h-3.5 text-purple-500 stroke-[1.5]" />
                      <span>Wine Pairing opzionale:</span>
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                      +€{exp.winePairingPrice}/p
                    </span>
                  </div>
                )}

                {exp.depositRequired && (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 stroke-[1.5]" />
                      <span>Caparra confirmatoria:</span>
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                      €{exp.depositAmount}/p
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CARD LUXURY MENU BUTTON */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setSelectedExpForMenuLayout(exp)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs border ${
                  isLight
                    ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 text-amber-800 border-amber-300/80 shadow-amber-500/5'
                    : 'bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 text-amber-300 border-amber-700/60 shadow-black/40'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Genera Layout Menù Elegante (Email &amp; PDF)</span>
              </button>
            </div>

            {/* CARD FOOTER ACTIONS */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="text-[10px] font-normal text-slate-400 font-mono">
                {exp.bookedCoversThisMonth} coperti · €{exp.revenueThisMonth.toLocaleString('it-IT')}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleActive(exp.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                    exp.isActive
                      ? isLight
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-800/40'
                      : isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border-emerald-800/40'
                  }`}
                >
                  {exp.isActive ? 'Sospendi' : 'Attiva'}
                </button>
                <button
                  onClick={() => handleOpenEdit(exp)}
                  className="p-1 rounded-lg border border-slate-200/80 dark:border-[#283248] hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer text-slate-600 dark:text-slate-300"
                  title="Modifica esperienza"
                >
                  <Edit2 className="w-3 h-3 stroke-[1.5]" />
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="p-1 rounded-lg border border-rose-200/80 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  title="Elimina"
                >
                  <Trash2 className="w-3 h-3 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LUXURY RESTAURANT MENU MODAL - BELLO, ELEGANTE & PRONTO PER EMAIL */}
      {selectedExpForMenuLayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm select-none overflow-y-auto">
          <div className={`w-full max-w-3xl my-6 rounded-3xl border shadow-2xl space-y-5 overflow-hidden transition-all ${
            isLight
              ? 'bg-[#FCFBF8] border-[#E8DEC9] text-stone-900 shadow-amber-950/20'
              : 'bg-[#11141C] border-[#2C3345] text-stone-100 shadow-black'
          }`}>
            {/* Top Toolbar */}
            <div className={`px-6 py-3.5 border-b flex items-center justify-between flex-wrap gap-2 ${
              isLight ? 'bg-amber-50/70 border-[#E8DEC9]' : 'bg-[#181D28] border-[#2C3345]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Layout Menù Gastronomico Elegante
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCoursesInLayout(!isEditingCoursesInLayout)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
                    isEditingCoursesInLayout
                      ? 'bg-amber-500 text-white border-amber-600'
                      : isLight
                      ? 'bg-white hover:bg-amber-100/50 text-stone-700 border-[#DDD2BC]'
                      : 'bg-[#202737] hover:bg-[#283246] text-stone-200 border-[#323C52]'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingCoursesInLayout ? 'Chiudi Modifica' : 'Modifica Portate & Prezzi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyMenuText(selectedExpForMenuLayout)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#202737] hover:bg-stone-100 dark:hover:bg-[#2A3449] border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Copia testo formattato da incollare in email"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copia Testo Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Invia via Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                  title="Stampa / Esporta PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedExpForMenuLayout(null);
                    setIsEditingCoursesInLayout(false);
                  }}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* THE LUXURY MENU CARD (Print & Presentation Ready) */}
            <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-8 font-serif select-text">
              {/* Restaurant Header */}
              <div className="text-center space-y-2 border-b pb-6 border-amber-300/40 dark:border-amber-700/40">
                <div className="inline-block px-3 py-1 rounded-full border border-amber-400/50 text-[10px] font-sans tracking-[0.25em] uppercase text-amber-700 dark:text-amber-400 font-semibold mb-1">
                  Torino · Gastronomia &amp; Cantina
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-wider text-amber-800 dark:text-amber-300 uppercase">
                  Sotto Sotto Bar &amp; Grill
                </h2>
                <div className="flex items-center justify-center gap-3 text-amber-500/80">
                  <span className="h-px w-12 bg-amber-400/60" />
                  <Sparkles className="w-4 h-4" />
                  <span className="h-px w-12 bg-amber-400/60" />
                </div>
                <h3 className="text-lg sm:text-xl italic font-medium text-stone-800 dark:text-stone-100 pt-1">
                  {selectedExpForMenuLayout.title}
                </h3>
                <p className="text-xs font-sans text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
                  {selectedExpForMenuLayout.description}
                </p>
              </div>

              {/* Course Items List */}
              <div className="space-y-6">
                {(selectedExpForMenuLayout.courses || []).map((course, idx) => (
                  <div key={course.id} className="relative group text-center space-y-1">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 block">
                      {course.type}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {course.dishTitle}
                    </h4>
                    {course.dishDescription && (
                      <p className="text-xs italic text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                        {course.dishDescription}
                      </p>
                    )}

                    {/* Inline Delete Course Button when editing mode is on */}
                    {isEditingCoursesInLayout && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCourseFromActive(selectedExpForMenuLayout.id, course.id)}
                        className="mt-1 text-[11px] font-sans font-semibold text-rose-500 hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Rimuovi portata</span>
                      </button>
                    )}
                  </div>
                ))}

                {/* Inline Add Course Form when editing mode is on */}
                {isEditingCoursesInLayout && (
                  <div className={`p-4 rounded-2xl border font-sans space-y-3 ${
                    isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-[#182030] border-[#2C374D]'
                  }`}>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      + Aggiungi Nuova Portata al Percorso
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={newCourseType}
                        onChange={(e) => setNewCourseType(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white dark:bg-[#121622] border-stone-300 dark:border-stone-700"
                      >
                        <option value="Benvenuto dello Chef">Benvenuto dello Chef</option>
                        <option value="Antipasto">Antipasto</option>
                        <option value="Primo Piatto">Primo Piatto</option>
                        <option value="Secondo Primo">Secondo Primo</option>
                        <option value="Secondo Piatto">Secondo Piatto</option>
                        <option value="Pre-Dessert">Pre-Dessert</option>
                        <option value="Dessert">Dessert</option>
                        <option value="Piccola Pasticceria">Piccola Pasticceria</option>
                      </select>
                      <input
                        type="text"
                        value={newCourseDishTitle}
                        onChange={(e) => setNewCourseDishTitle(e.target.value)}
                        placeholder="Nome del piatto..."
                        className="sm:col-span-2 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white dark:bg-[#121622] border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <input
                      type="text"
                      value={newCourseDishDesc}
                      onChange={(e) => setNewCourseDishDesc(e.target.value)}
                      placeholder="Breve descrizione ingredienti o cottura..."
                      className="w-full px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-[#121622] border-stone-300 dark:border-stone-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCourseToActive(selectedExpForMenuLayout.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-xs"
                    >
                      Inserisci Portata
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Price & Wine Pairing Box */}
              <div className="border-t pt-6 border-amber-300/40 dark:border-amber-700/40 space-y-4">
                {/* Wine Pairing Section */}
                {selectedExpForMenuLayout.winePairingAvailable && (
                  <div className={`p-4 rounded-2xl border font-sans text-center space-y-1.5 ${
                    isLight
                      ? 'bg-purple-50/60 border-purple-200/80 text-purple-950'
                      : 'bg-purple-950/20 border-purple-900/40 text-purple-200'
                  }`}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      <Wine className="w-4 h-4" />
                      <span>Accostamento Enologico / Wine Pairing</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      {selectedExpForMenuLayout.winePairingLabel || 'Selezione speciale di calici abbinati dal nostro Sommelier'}
                    </p>
                    <div className="pt-1 flex items-center justify-center gap-3">
                      <span className="text-sm font-bold font-mono text-purple-700 dark:text-purple-300">
                        + €{selectedExpForMenuLayout.winePairingPrice} per persona
                      </span>
                      {isEditingCoursesInLayout && (
                        <div className="flex items-center gap-1 text-xs">
                          <span>Modifica (+€):</span>
                          <input
                            type="number"
                            value={selectedExpForMenuLayout.winePairingPrice}
                            onChange={(e) =>
                              handleUpdatePriceInActive(
                                selectedExpForMenuLayout.id,
                                selectedExpForMenuLayout.pricePerPerson,
                                Number(e.target.value)
                              )
                            }
                            className="w-16 px-2 py-0.5 rounded border text-xs font-mono font-bold text-center bg-white dark:bg-black"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Price Breakdown */}
                <div className="text-center font-sans space-y-2 pt-2">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                        Prezzo Menù Degustazione
                      </span>
                      <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                        €{selectedExpForMenuLayout.pricePerPerson}
                      </span>
                      <span className="text-[11px] text-stone-500 block">a persona</span>
                    </div>

                    {selectedExpForMenuLayout.winePairingAvailable && (
                      <>
                        <span className="text-stone-300 dark:text-stone-600 font-sans text-xl hidden sm:inline">+</span>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-purple-500 block font-semibold">
                            Esperienza Completa con Vini
                          </span>
                          <span className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300">
                            €{selectedExpForMenuLayout.pricePerPerson + (selectedExpForMenuLayout.winePairingPrice || 0)}
                          </span>
                          <span className="text-[11px] text-stone-500 block">a persona tutto incluso</span>
                        </div>
                      </>
                    )}
                  </div>

                  {isEditingCoursesInLayout && (
                    <div className="pt-2 flex items-center justify-center gap-2 text-xs">
                      <span>Modifica Prezzo Menù (€):</span>
                      <input
                        type="number"
                        value={selectedExpForMenuLayout.pricePerPerson}
                        onChange={(e) =>
                          handleUpdatePriceInActive(
                            selectedExpForMenuLayout.id,
                            Number(e.target.value),
                            selectedExpForMenuLayout.winePairingPrice
                          )
                        }
                        className="w-20 px-2 py-1 rounded-lg border text-xs font-mono font-bold text-center bg-white dark:bg-black"
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400 italic pt-2">
                    Coperto, servizio, pane artigianale e acqua minerale inclusi · Segnalare intolleranze o allergie al momento della prenotazione.
                  </p>
                </div>
              </div>

              {/* Bottom Footer Details */}
              <div className="border-t pt-4 text-center font-sans text-[10px] text-stone-400 dark:text-stone-500 space-y-0.5 border-amber-200/40 dark:border-stone-800">
                <p className="font-semibold text-stone-600 dark:text-stone-300">SOTTO SOTTO BAR &amp; GRILL · TORINO</p>
                <p>Via San Quintino 22, 10121 Torino (TO) · Tel. +39 011 5567890 · info@sottosotto.it</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PER INVIARE IL MENÙ ELEGANTE VIA EMAIL AL CLIENTE */}
      {isEmailModalOpen && selectedExpForMenuLayout && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#222A3C] text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-500" />
                <h4 className="font-bold text-sm uppercase">Invia Menù Elegante via Email</h4>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Invia la proposta gastronomica elegante e personalizzata per <strong>"{selectedExpForMenuLayout.title}"</strong> con tutte le portate e abbinamento vini.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">Nome Ospite / Cliente VIP</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Es. Avv. Andrea Moretti"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">Indirizzo Email Destinatario</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="cliente@dominio.com"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-[#161C2A] border-slate-200 dark:border-[#242C3E]"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/40 text-xs space-y-1 text-sky-900 dark:text-sky-300">
                <span className="font-bold block">Contenuto Email:</span>
                <p className="text-[11px] leading-relaxed">
                  L'email verrà recapitata con grafica curata, intestazione "Sotto Sotto Bar &amp; Grill", elenco delle {selectedExpForMenuLayout.coursesCount} portate, proposta Wine Pairing (+€{selectedExpForMenuLayout.winePairingPrice}) e pulsante rapido per confermare il tavolo.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSendMenuEmailDirect}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Spedisci Menù via Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-5 rounded-2xl border shadow-xl space-y-4 ${
            isLight ? 'bg-white border-slate-200/80 text-slate-800' : 'bg-[#121622] border-[#283248] text-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h4 className="font-medium text-sm">
                {editingExp ? 'Modifica Esperienza Gastronomica' : 'Crea Nuova Esperienza'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-[#283248] text-xs font-normal hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Titolo Pacchetto</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Es. Menu Degustazione Primavera 6 Portate"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-normal transition ${
                    isLight
                      ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white focus:border-sky-400'
                      : 'bg-[#182030] border-[#2A354C] text-slate-200 focus:border-sky-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Descrizione Esperienza</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Dettagli del menu, abbinamenti e note per l’ospite al momento della prenotazione..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-normal transition ${
                    isLight
                      ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white focus:border-sky-400'
                      : 'bg-[#182030] border-[#2A354C] text-slate-200 focus:border-sky-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Prezzo / Persona (€)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-center transition ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white'
                        : 'bg-[#182030] border-[#2A354C] text-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">N° Portate</label>
                  <input
                    type="number"
                    value={formCourses}
                    onChange={(e) => setFormCourses(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-center transition ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white'
                        : 'bg-[#182030] border-[#2A354C] text-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Min Ospiti</label>
                  <input
                    type="number"
                    value={formMinGuests}
                    onChange={(e) => setFormMinGuests(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-center transition ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white'
                        : 'bg-[#182030] border-[#2A354C] text-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Max Ospiti</label>
                  <input
                    type="number"
                    value={formMaxGuests}
                    onChange={(e) => setFormMaxGuests(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-center transition ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white'
                        : 'bg-[#182030] border-[#2A354C] text-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Caparra Anticipata (€/p)</label>
                  <input
                    type="number"
                    value={formDeposit}
                    onChange={(e) => setFormDeposit(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-center transition ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white'
                        : 'bg-[#182030] border-[#2A354C] text-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Prezzo Wine Pairing (€)</label>
                  <input
                    type="number"
                    value={formWinePrice}
                    onChange={(e) => setFormWinePrice(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-center transition ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200 text-slate-800 focus:bg-white'
                        : 'bg-[#182030] border-[#2A354C] text-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isLight
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    : 'border-[#2A354C] text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                Annulla
              </button>
              <button
                onClick={handleSaveExperience}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-2xs transition"
              >
                Salva & Pubblica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

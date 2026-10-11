export type WaiterFacingDirection = 'north' | 'south' | 'east' | 'west';

export interface SeatPositionDetail {
  seatNumber: number;
  label: string;
  shortLabel: string;
  locationDescription: string;
  isOnBench?: boolean;
  side: 'left' | 'right' | 'top' | 'bottom' | 'bench' | 'opposite';
}

export interface TableSeatConfiguration {
  tableId: string;
  tableName: string;
  zone: 'main_a' | 'main_b' | 'bar' | 'private';
  capacity: number;
  waiterApproach: string; // e.g. "Cameriere in testata a Nord", "Cameriere nel corridoio a Sud", etc.
  waiterFacing: WaiterFacingDirection;
  clockwiseDescription: string;
  seats: SeatPositionDetail[];
}

/**
 * Registry of seat numbering rules for each table based on restaurant layout specs:
 * Rule: The waiter faces the table from the designated service position (marked by arrow).
 * Seat 1 is ALWAYS at the waiter's LEFT.
 * Seat numbering proceeds strictly CLOCKWISE from the waiter's perspective.
 */
export const TABLE_SEAT_CONFIGURATIONS: Record<string, TableSeatConfiguration> = {
  // ==========================================
  // MAIN A (Ala Ovest & VIP)
  // ==========================================
  G: {
    tableId: 'G',
    tableName: 'Tavolo G (Booth VIP)',
    zone: 'main_a',
    capacity: 2,
    waiterApproach: 'Cameriere di fronte al booth (lato corridoio)',
    waiterFacing: 'west',
    clockwiseDescription: 'Cameriere guarda entrambi: Posizione 1 a sinistra (in basso) e Posizione 2 a destra (in alto).',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Basso)',
        shortLabel: 'P1 (Sx Basso)',
        locationDescription: 'Fianco sinistro del cameriere (in basso nel booth)',
        side: 'left',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Destra Cameriere - Alto)',
        shortLabel: 'P2 (Dx Alto)',
        locationDescription: 'Fianco destro del cameriere (in alto nel booth)',
        side: 'right',
      },
    ],
  },

  '10': {
    tableId: '10',
    tableName: 'Tavolo 10',
    zone: 'main_a',
    capacity: 2,
    waiterApproach: 'Cameriere nel corridoio a Sud rivolto a Nord verso la panca',
    waiterFacing: 'north',
    clockwiseDescription: 'Posizione 1 sulla panca a muro Nord; Posizione 2 sul lato opposto (Sud), in senso orario.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Panca a Muro Nord)',
        shortLabel: 'P1 (Panca)',
        locationDescription: 'Seduto sulla panca lungo la parete Nord',
        isOnBench: true,
        side: 'bench',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Fronte Panca - Corridoio)',
        shortLabel: 'P2 (Opposto)',
        locationDescription: 'Seduto opposto alla panca, fronte cameriere',
        side: 'opposite',
      },
    ],
  },

  '11': {
    tableId: '11',
    tableName: 'Tavolo 11',
    zone: 'main_a',
    capacity: 2,
    waiterApproach: 'Cameriere nel corridoio a Sud rivolto a Nord verso la panca',
    waiterFacing: 'north',
    clockwiseDescription: 'Posizione 1 sulla panca a muro Nord; Posizione 2 sul lato opposto (Sud), in senso orario.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Panca a Muro Nord)',
        shortLabel: 'P1 (Panca)',
        locationDescription: 'Seduto sulla panca lungo la parete Nord',
        isOnBench: true,
        side: 'bench',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Fronte Panca - Corridoio)',
        shortLabel: 'P2 (Opposto)',
        locationDescription: 'Seduto opposto alla panca, fronte cameriere',
        side: 'opposite',
      },
    ],
  },

  '12': {
    tableId: '12',
    tableName: 'Tavolo 12',
    zone: 'main_a',
    capacity: 4,
    waiterApproach: 'Cameriere nel corridoio a Sud rivolto a Nord verso la panca',
    waiterFacing: 'north',
    clockwiseDescription: 'Posizioni 1 e 2 sulla panca a muro Nord; Posizioni 3 e 4 sul lato opposto, mantenendo il giro orario.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Panca Nord - Sinistra)',
        shortLabel: 'P1 (Panca Sx)',
        locationDescription: 'Sulla panca a muro, lato sinistro rispetto al cameriere',
        isOnBench: true,
        side: 'bench',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Panca Nord - Destra)',
        shortLabel: 'P2 (Panca Dx)',
        locationDescription: 'Sulla panca a muro, lato destro rispetto al cameriere',
        isOnBench: true,
        side: 'bench',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Fronte Panca - Destra)',
        shortLabel: 'P3 (Fronte Dx)',
        locationDescription: 'Opposto alla panca, lato destro del cameriere',
        side: 'opposite',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Fronte Panca - Sinistra)',
        shortLabel: 'P4 (Fronte Sx)',
        locationDescription: 'Opposto alla panca, lato sinistro del cameriere',
        side: 'opposite',
      },
    ],
  },

  '20': {
    tableId: '20',
    tableName: 'Tavolo 20',
    zone: 'main_a',
    capacity: 4,
    waiterApproach: 'Cameriere in testata frontale (Nord) rivolto verso i commensali (Sud)',
    waiterFacing: 'south',
    clockwiseDescription: 'Cameriere fronteggia tutti: a sinistra Posizione 1 (vicino) e 2 (lontano); a destra Posizione 4 (vicino) e 3 (lontano). Senso orario da sinistra: 1 → 2 → 3 → 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Vicino)',
        shortLabel: 'P1 (Sx Alto)',
        locationDescription: 'Fianco sinistro del cameriere, posto più vicino',
        side: 'left',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sinistra Cameriere - Lontano)',
        shortLabel: 'P2 (Sx Basso)',
        locationDescription: 'Fianco sinistro del cameriere, posto in fondo',
        side: 'left',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Destra Cameriere - Lontano)',
        shortLabel: 'P3 (Dx Basso)',
        locationDescription: 'Fianco destro del cameriere, posto in fondo',
        side: 'right',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Destra Cameriere - Vicino)',
        shortLabel: 'P4 (Dx Alto)',
        locationDescription: 'Fianco destro del cameriere, posto più vicino',
        side: 'right',
      },
    ],
  },

  '21': {
    tableId: '21',
    tableName: 'Tavolo 21',
    zone: 'main_a',
    capacity: 4,
    waiterApproach: 'Cameriere in testata frontale (Nord) rivolto verso i commensali (Sud)',
    waiterFacing: 'south',
    clockwiseDescription: 'Cameriere fronteggia tutti: a sinistra Posizione 1 e 2; a destra Posizione 4 (vicino) e 3 (lontano). Senso orario da sinistra: 1 → 2 → 3 → 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Vicino)',
        shortLabel: 'P1 (Sx Alto)',
        locationDescription: 'Fianco sinistro del cameriere, posto più vicino',
        side: 'left',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sinistra Cameriere - Lontano)',
        shortLabel: 'P2 (Sx Basso)',
        locationDescription: 'Fianco sinistro del cameriere, posto in fondo',
        side: 'left',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Destra Cameriere - Lontano)',
        shortLabel: 'P3 (Dx Basso)',
        locationDescription: 'Fianco destro del cameriere, posto in fondo',
        side: 'right',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Destra Cameriere - Vicino)',
        shortLabel: 'P4 (Dx Alto)',
        locationDescription: 'Fianco destro del cameriere, posto più vicino',
        side: 'right',
      },
    ],
  },

  // ==========================================
  // MAIN B (Ala Est)
  // Fila Nord: 13 (2p), 14 (4p), 15 (2p), 16 (4p)
  // Fila Sud:  22 (2p), 23 (2p)
  // Tutte le sedute disposte in ALTO e in BASSO
  // ==========================================
  '13': {
    tableId: '13',
    tableName: 'Tavolo 13',
    zone: 'main_b',
    capacity: 2,
    waiterApproach: 'Presa comanda tavolo',
    waiterFacing: 'north',
    clockwiseDescription: 'Sedie disposte in alto e in basso: Posizione 1 in alto, Posizione 2 in basso.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sedia Alto)',
        shortLabel: 'P1 (Alto)',
        locationDescription: 'Sedia in alto',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sedia Basso)',
        shortLabel: 'P2 (Basso)',
        locationDescription: 'Sedia in basso',
        side: 'bottom',
      },
    ],
  },

  '14': {
    tableId: '14',
    tableName: 'Tavolo 14',
    zone: 'main_b',
    capacity: 4,
    waiterApproach: 'Presa comanda tavolo (cameriere alla sinistra)',
    waiterFacing: 'north',
    clockwiseDescription: 'Posizione 1 vicina al cameriere, alla sua sinistra la 2; difronte alla 2 c\'è la 3 e difronte alla 1 c\'è la 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Vicina al Cameriere)',
        shortLabel: 'P1',
        locationDescription: 'In alto a sinistra, più vicina al cameriere',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Alla sinistra della 1)',
        shortLabel: 'P2',
        locationDescription: 'In alto a destra, alla sinistra della posizione 1',
        side: 'top',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Difronte alla 2)',
        shortLabel: 'P3',
        locationDescription: 'In basso a destra, difronte alla posizione 2',
        side: 'bottom',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Difronte alla 1)',
        shortLabel: 'P4',
        locationDescription: 'In basso a sinistra, difronte alla posizione 1',
        side: 'bottom',
      },
    ],
  },

  '15': {
    tableId: '15',
    tableName: 'Tavolo 15',
    zone: 'main_b',
    capacity: 2,
    waiterApproach: 'Presa comanda tavolo',
    waiterFacing: 'north',
    clockwiseDescription: 'Sedie disposte in alto e in basso: Posizione 1 in alto, Posizione 2 in basso.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sedia Alto)',
        shortLabel: 'P1 (Alto)',
        locationDescription: 'Sedia in alto',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sedia Basso)',
        shortLabel: 'P2 (Basso)',
        locationDescription: 'Sedia in basso',
        side: 'bottom',
      },
    ],
  },

  '16': {
    tableId: '16',
    tableName: 'Tavolo 16',
    zone: 'main_b',
    capacity: 4,
    waiterApproach: 'Presa comanda tavolo (cameriere alla sinistra)',
    waiterFacing: 'north',
    clockwiseDescription: 'Posizione 1 vicina al cameriere, alla sua sinistra la 2; difronte alla 2 c\'è la 3 e difronte alla 1 c\'è la 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Vicina al Cameriere)',
        shortLabel: 'P1',
        locationDescription: 'In alto a sinistra, più vicina al cameriere',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Alla sinistra della 1)',
        shortLabel: 'P2',
        locationDescription: 'In alto a destra, alla sinistra della posizione 1',
        side: 'top',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Difronte alla 2)',
        shortLabel: 'P3',
        locationDescription: 'In basso a destra, difronte alla posizione 2',
        side: 'bottom',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Difronte alla 1)',
        shortLabel: 'P4',
        locationDescription: 'In basso a sinistra, difronte alla posizione 1',
        side: 'bottom',
      },
    ],
  },

  '22': {
    tableId: '22',
    tableName: 'Tavolo 22',
    zone: 'main_b',
    capacity: 2,
    waiterApproach: 'Presa comanda tavolo',
    waiterFacing: 'south',
    clockwiseDescription: 'Sedie disposte in alto e in basso: Posizione 1 in alto, Posizione 2 in basso.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sedia Alto)',
        shortLabel: 'P1 (Alto)',
        locationDescription: 'Sedia in alto',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sedia Basso)',
        shortLabel: 'P2 (Basso)',
        locationDescription: 'Sedia in basso',
        side: 'bottom',
      },
    ],
  },

  '23': {
    tableId: '23',
    tableName: 'Tavolo 23',
    zone: 'main_b',
    capacity: 2,
    waiterApproach: 'Presa comanda tavolo',
    waiterFacing: 'south',
    clockwiseDescription: 'Sedie disposte in alto e in basso: Posizione 1 in alto, Posizione 2 in basso.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sedia Alto)',
        shortLabel: 'P1 (Alto)',
        locationDescription: 'Sedia in alto',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sedia Basso)',
        shortLabel: 'P2 (Basso)',
        locationDescription: 'Sedia in basso',
        side: 'bottom',
      },
    ],
  },

  // ==========================================
  // PRIVATE DINING ROOM (Sketch IMG_7223)
  // Fila Superiore: [30] (2p vertical), [31] (4p horizontal), [32] (4p horizontal) - Cameriere a sinistra rivolto a Est (->)
  // Fila Inferiore: [33] (4p vertical), [34] (4p vertical) - Cameriere in testata in alto rivolto a Sud (v)
  // ==========================================
  '30': {
    tableId: '30',
    tableName: 'Tavolo 30 (Privé)',
    zone: 'private',
    capacity: 2,
    waiterApproach: 'Cameriere a sinistra (Ovest) rivolto verso il tavolo ad Est (cerchio C con freccia a destra)',
    waiterFacing: 'east',
    clockwiseDescription: 'Cameriere guarda verso destra (Est): alla sua sinistra in ALTO c\'è la Posizione 1, alla sua destra in BASSO c\'è la Posizione 2.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Sedia Alto)',
        shortLabel: 'P1 (Alto)',
        locationDescription: 'Sedia in alto (alla sinistra del cameriere)',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Destra Cameriere - Sedia Basso)',
        shortLabel: 'P2 (Basso)',
        locationDescription: 'Sedia in basso (alla destra del cameriere)',
        side: 'bottom',
      },
    ],
  },

  '31': {
    tableId: '31',
    tableName: 'Tavolo 31 (Privé)',
    zone: 'private',
    capacity: 4,
    waiterApproach: 'Cameriere in testata a sinistra (Ovest) rivolto verso il tavolo ad Est (cerchio C con freccia a destra)',
    waiterFacing: 'east',
    clockwiseDescription: 'Cameriere guarda ad Est: a sinistra fila in alto (1 vicino, 2 lontano); a destra fila in basso (3 lontano, 4 vicino). Senso orario: 1 → 2 → 3 → 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Alto Vicino)',
        shortLabel: 'P1 (Alto Vicino)',
        locationDescription: 'Fila superiore, sedia vicino al cameriere',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sinistra Cameriere - Alto Lontano)',
        shortLabel: 'P2 (Alto Lontano)',
        locationDescription: 'Fila superiore, sedia in fondo a destra',
        side: 'top',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Destra Cameriere - Basso Lontano)',
        shortLabel: 'P3 (Basso Lontano)',
        locationDescription: 'Fila inferiore, sedia in fondo a destra',
        side: 'bottom',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Destra Cameriere - Basso Vicino)',
        shortLabel: 'P4 (Basso Vicino)',
        locationDescription: 'Fila inferiore, sedia vicino al cameriere',
        side: 'bottom',
      },
    ],
  },

  '32': {
    tableId: '32',
    tableName: 'Tavolo 32 (Privé)',
    zone: 'private',
    capacity: 4,
    waiterApproach: 'Cameriere in testata a sinistra (Ovest) rivolto verso il tavolo ad Est (cerchio C con freccia a destra)',
    waiterFacing: 'east',
    clockwiseDescription: 'Cameriere guarda ad Est: a sinistra fila in alto (1 vicino, 2 lontano); a destra fila in basso (3 lontano, 4 vicino). Senso orario: 1 → 2 → 3 → 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Alto Vicino)',
        shortLabel: 'P1 (Alto Vicino)',
        locationDescription: 'Fila superiore, sedia vicino al cameriere',
        side: 'top',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sinistra Cameriere - Alto Lontano)',
        shortLabel: 'P2 (Alto Lontano)',
        locationDescription: 'Fila superiore, sedia in fondo a destra',
        side: 'top',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Destra Cameriere - Basso Lontano)',
        shortLabel: 'P3 (Basso Lontano)',
        locationDescription: 'Fila inferiore, sedia in fondo a destra',
        side: 'bottom',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Destra Cameriere - Basso Vicino)',
        shortLabel: 'P4 (Basso Vicino)',
        locationDescription: 'Fila inferiore, sedia vicino al cameriere',
        side: 'bottom',
      },
    ],
  },

  '33': {
    tableId: '33',
    tableName: 'Tavolo 33 (Privé)',
    zone: 'private',
    capacity: 4,
    waiterApproach: 'Cameriere in testata in alto (Nord) rivolto verso Sud (cerchio C con freccia verso il basso)',
    waiterFacing: 'south',
    clockwiseDescription: 'Cameriere fronteggia il tavolo da Nord: a sinistra fianco sx (1 vicino, 2 lontano); a destra fianco dx (3 lontano, 4 vicino). Senso orario: 1 → 2 → 3 → 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Fianco Sx Vicino)',
        shortLabel: 'P1 (Sx Vicino)',
        locationDescription: 'Fianco sinistro del cameriere, sedia più vicina',
        side: 'left',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sinistra Cameriere - Fianco Sx Lontano)',
        shortLabel: 'P2 (Sx Lontano)',
        locationDescription: 'Fianco sinistro del cameriere, sedia in fondo',
        side: 'left',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Destra Cameriere - Fianco Dx Lontano)',
        shortLabel: 'P3 (Dx Lontano)',
        locationDescription: 'Fianco destro del cameriere, sedia in fondo',
        side: 'right',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Destra Cameriere - Fianco Dx Vicino)',
        shortLabel: 'P4 (Dx Vicino)',
        locationDescription: 'Fianco destro del cameriere, sedia più vicina',
        side: 'right',
      },
    ],
  },

  '34': {
    tableId: '34',
    tableName: 'Tavolo 34 (Privé)',
    zone: 'private',
    capacity: 4,
    waiterApproach: 'Cameriere in testata in alto (Nord) rivolto verso Sud (cerchio C con freccia verso il basso)',
    waiterFacing: 'south',
    clockwiseDescription: 'Cameriere fronteggia il tavolo da Nord: a sinistra fianco sx (1 vicino, 2 lontano); a destra fianco dx (3 lontano, 4 vicino). Senso orario: 1 → 2 → 3 → 4.',
    seats: [
      {
        seatNumber: 1,
        label: 'Posizione 1 (Sinistra Cameriere - Fianco Sx Vicino)',
        shortLabel: 'P1 (Sx Vicino)',
        locationDescription: 'Fianco sinistro del cameriere, sedia più vicina',
        side: 'left',
      },
      {
        seatNumber: 2,
        label: 'Posizione 2 (Sinistra Cameriere - Fianco Sx Lontano)',
        shortLabel: 'P2 (Sx Lontano)',
        locationDescription: 'Fianco sinistro del cameriere, sedia in fondo',
        side: 'left',
      },
      {
        seatNumber: 3,
        label: 'Posizione 3 (Destra Cameriere - Fianco Dx Lontano)',
        shortLabel: 'P3 (Dx Lontano)',
        locationDescription: 'Fianco destro del cameriere, sedia in fondo',
        side: 'right',
      },
      {
        seatNumber: 4,
        label: 'Posizione 4 (Destra Cameriere - Fianco Dx Vicino)',
        shortLabel: 'P4 (Dx Vicino)',
        locationDescription: 'Fianco destro del cameriere, sedia più vicina',
        side: 'right',
      },
    ],
  },

  // ==========================================
  // SALA BAR (Tampone & Attesa)
  // B1, B2, B3 (2p), B4 (4p)
  // ==========================================
  B1: {
    tableId: 'B1',
    tableName: 'Tavolo B1',
    zone: 'bar',
    capacity: 2,
    waiterApproach: 'Cameriere dal passaggio fronte tavolo',
    waiterFacing: 'north',
    clockwiseDescription: 'Senso orario dal punto di vista del cameriere: Posizione 1 a sinistra, Posizione 2 a destra.',
    seats: [
      { seatNumber: 1, label: 'Posizione 1 (Sinistra Cameriere)', shortLabel: 'P1 (Sx)', locationDescription: 'Sinistra cameriere', side: 'top' },
      { seatNumber: 2, label: 'Posizione 2 (Destra Cameriere)', shortLabel: 'P2 (Dx)', locationDescription: 'Destra cameriere', side: 'bottom' },
    ],
  },
  B2: {
    tableId: 'B2',
    tableName: 'Tavolo B2',
    zone: 'bar',
    capacity: 2,
    waiterApproach: 'Cameriere dal passaggio fronte tavolo',
    waiterFacing: 'north',
    clockwiseDescription: 'Senso orario: Posizione 1 a sinistra, Posizione 2 a destra.',
    seats: [
      { seatNumber: 1, label: 'Posizione 1 (Sinistra Cameriere)', shortLabel: 'P1 (Sx)', locationDescription: 'Sinistra cameriere', side: 'top' },
      { seatNumber: 2, label: 'Posizione 2 (Destra Cameriere)', shortLabel: 'P2 (Dx)', locationDescription: 'Destra cameriere', side: 'bottom' },
    ],
  },
  B3: {
    tableId: 'B3',
    tableName: 'Tavolo B3',
    zone: 'bar',
    capacity: 2,
    waiterApproach: 'Cameriere dal passaggio fronte tavolo',
    waiterFacing: 'north',
    clockwiseDescription: 'Senso orario: Posizione 1 a sinistra, Posizione 2 a destra.',
    seats: [
      { seatNumber: 1, label: 'Posizione 1 (Sinistra Cameriere)', shortLabel: 'P1 (Sx)', locationDescription: 'Sinistra cameriere', side: 'top' },
      { seatNumber: 2, label: 'Posizione 2 (Destra Cameriere)', shortLabel: 'P2 (Dx)', locationDescription: 'Destra cameriere', side: 'bottom' },
    ],
  },
  B4: {
    tableId: 'B4',
    tableName: 'Tavolo B4',
    zone: 'bar',
    capacity: 4,
    waiterApproach: 'Cameriere in testata frontale rivolto al tavolo',
    waiterFacing: 'north',
    clockwiseDescription: 'Senso orario: fila superiore 1 e 2, fila inferiore 3 e 4.',
    seats: [
      { seatNumber: 1, label: 'Posizione 1 (Alto Vicino)', shortLabel: 'P1', locationDescription: 'Alto vicino', side: 'top' },
      { seatNumber: 2, label: 'Posizione 2 (Alto Lontano)', shortLabel: 'P2', locationDescription: 'Alto lontano', side: 'top' },
      { seatNumber: 3, label: 'Posizione 3 (Basso Lontano)', shortLabel: 'P3', locationDescription: 'Basso lontano', side: 'bottom' },
      { seatNumber: 4, label: 'Posizione 4 (Basso Vicino)', shortLabel: 'P4', locationDescription: 'Basso vicino', side: 'bottom' },
    ],
  },
};

/**
 * Helper to get the canonical seat configuration for any table.
 * If not explicitly registered, generates a standard clockwise configuration.
 */
export function getTableSeatConfiguration(tableId: string, capacity: number = 2): TableSeatConfiguration {
  const existing = TABLE_SEAT_CONFIGURATIONS[tableId];
  if (existing) return existing;

  const half = Math.ceil(capacity / 2);
  const seats: SeatPositionDetail[] = Array.from({ length: capacity }, (_, i) => {
    const seatNum = i + 1;
    if (capacity === 2) {
      return {
        seatNumber: seatNum,
        label: seatNum === 1 ? 'Posizione 1 (Sedia Alto / Sinistra)' : 'Posizione 2 (Sedia Basso / Destra)',
        shortLabel: `P${seatNum}`,
        locationDescription: seatNum === 1 ? 'In alto, sinistra cameriere' : 'In basso, opposta',
        side: 'top',
      };
    }

    if (seatNum <= half) {
      return {
        seatNumber: seatNum,
        label: seatNum === 1 ? 'Posizione 1 (Più vicina al cameriere)' : `Posizione ${seatNum}`,
        shortLabel: `P${seatNum}`,
        locationDescription:
          seatNum === 1
            ? 'Lato sinistro, più vicina al cameriere'
            : `Alla sinistra della posizione ${seatNum - 1}`,
        side: 'top',
      };
    } else {
      const oppositeOf = capacity - seatNum + 1;
      return {
        seatNumber: seatNum,
        label: `Posizione ${seatNum} (Difronte alla ${oppositeOf})`,
        shortLabel: `P${seatNum}`,
        locationDescription: `Lato opposto, direttamente difronte alla posizione ${oppositeOf}`,
        side: 'bottom',
      };
    }
  });

  return {
    tableId,
    tableName: `Tavolo ${tableId}`,
    zone: 'main_a',
    capacity,
    waiterApproach: 'Cameriere alla sinistra del tavolo',
    waiterFacing: 'north',
    clockwiseDescription:
      'Cameriere alla sinistra: posizione 1 più vicina, alla sua sinistra la 2; difronte alla 2 c\'è la 3 e difronte alla 1 c\'è la 4.',
    seats,
  };
}

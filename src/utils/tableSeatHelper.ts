export interface TableSeatDefinition {
  seatNumber: number;
  code: string;
  label: string;
  subLabel: string;
  side: 'bench' | 'chair' | 'left' | 'right' | 'top' | 'bottom';
  isBench?: boolean;
}

export function getTableSeatDefinitions(tableId: string, partySize: number = 4): TableSeatDefinition[] {
  // MAIN A
  if (tableId === '10' || tableId === '11') {
    return [
      {
        seatNumber: 1,
        code: 'P1',
        label: 'Posto 1',
        subLabel: 'Panca a Muro (Bench)',
        side: 'bench',
        isBench: true,
      },
      {
        seatNumber: 2,
        code: 'P2',
        label: 'Posto 2',
        subLabel: 'Sedia Fronte Panca',
        side: 'chair',
      },
    ];
  }

  if (tableId === '12') {
    return [
      {
        seatNumber: 1,
        code: 'P1',
        label: 'Posto 1',
        subLabel: 'Panca Sx (Orario 1/4)',
        side: 'bench',
        isBench: true,
      },
      {
        seatNumber: 2,
        code: 'P2',
        label: 'Posto 2',
        subLabel: 'Panca Dx (Orario 2/4)',
        side: 'bench',
        isBench: true,
      },
      {
        seatNumber: 3,
        code: 'P3',
        label: 'Posto 3',
        subLabel: 'Sedia Dx (Orario 3/4)',
        side: 'chair',
      },
      {
        seatNumber: 4,
        code: 'P4',
        label: 'Posto 4',
        subLabel: 'Sedia Sx (Orario 4/4)',
        side: 'chair',
      },
    ];
  }

  if (tableId === 'G') {
    return [
      {
        seatNumber: 1,
        code: 'P1',
        label: 'Posto 1',
        subLabel: 'In Basso (Sx Cameriere)',
        side: 'bottom',
      },
      {
        seatNumber: 2,
        code: 'P2',
        label: 'Posto 2',
        subLabel: 'In Alto (Dx Cameriere)',
        side: 'top',
      },
    ];
  }

  if (tableId === '20' || tableId === '21') {
    return [
      {
        seatNumber: 1,
        code: 'P1',
        label: 'Posto 1',
        subLabel: 'Fianco Sx Vicino (Orario 1/4)',
        side: 'left',
      },
      {
        seatNumber: 2,
        code: 'P2',
        label: 'Posto 2',
        subLabel: 'Fianco Sx Lontano (Orario 2/4)',
        side: 'left',
      },
      {
        seatNumber: 3,
        code: 'P3',
        label: 'Posto 3',
        subLabel: 'Fianco Dx Lontano (Orario 3/4)',
        side: 'right',
      },
      {
        seatNumber: 4,
        code: 'P4',
        label: 'Posto 4',
        subLabel: 'Fianco Dx Vicino (Orario 4/4)',
        side: 'right',
      },
    ];
  }

  // MAIN B
  if (tableId === '13' || tableId === '15' || tableId === '22' || tableId === '23') {
    return [
      {
        seatNumber: 1,
        code: 'P1',
        label: 'Posto 1',
        subLabel: 'Sx dal Cameriere (Orario 1/2)',
        side: 'left',
      },
      {
        seatNumber: 2,
        code: 'P2',
        label: 'Posto 2',
        subLabel: 'Dx dal Cameriere (Orario 2/2)',
        side: 'right',
      },
    ];
  }

  if (tableId === '14' || tableId === '16') {
    return [
      {
        seatNumber: 1,
        code: 'P1',
        label: 'Posto 1',
        subLabel: 'Fianco Sx Vicino (Orario 1/4)',
        side: 'left',
      },
      {
        seatNumber: 2,
        code: 'P2',
        label: 'Posto 2',
        subLabel: 'Fianco Sx Lontano (Orario 2/4)',
        side: 'left',
      },
      {
        seatNumber: 3,
        code: 'P3',
        label: 'Posto 3',
        subLabel: 'Fianco Dx Lontano (Orario 3/4)',
        side: 'right',
      },
      {
        seatNumber: 4,
        code: 'P4',
        label: 'Posto 4',
        subLabel: 'Fianco Dx Vicino (Orario 4/4)',
        side: 'right',
      },
    ];
  }

  // Fallback for private or other tables
  const count = Math.max(2, Math.min(partySize || 4, 8));
  return Array.from({ length: count }, (_, idx) => ({
    seatNumber: idx + 1,
    code: `P${idx + 1}`,
    label: `Posto ${idx + 1}`,
    subLabel: `Commensale ${idx + 1}`,
    side: idx % 2 === 0 ? 'left' : 'right',
  }));
}

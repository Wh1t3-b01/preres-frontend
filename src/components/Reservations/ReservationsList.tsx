import React from 'react';
import { Reservations5ColListView } from './Reservations5ColListView';

interface ReservationsListProps {
  onOpenBookingModal: (preselectedIds?: string[], guest?: any, startTime?: string) => void;
  onSelectTableForDetails?: (tableId: string) => void;
}

export const ReservationsList: React.FC<ReservationsListProps> = ({
  onOpenBookingModal,
  onSelectTableForDetails,
}) => {
  return (
    <Reservations5ColListView
      onOpenBookingModal={onOpenBookingModal}
      onSelectTableForDetails={onSelectTableForDetails}
    />
  );
};

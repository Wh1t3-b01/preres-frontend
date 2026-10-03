import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { Login } from './components/Auth/Login';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Header } from './components/Header/Header';
import { KPIBar } from './components/Header/KPIBar';
import { FloorPlanView } from './components/FloorPlan/FloorPlanView';
import { ReservationsList } from './components/Reservations/ReservationsList';
import { TimelineView } from './components/Timeline/TimelineView';
import { WaitlistView } from './components/Waitlist/WaitlistView';
import { WaiterTouchView } from './components/WaiterTouch/WaiterTouchView';
import { StatsOverview } from './components/Stats/StatsOverview';
import { BookingModal } from './components/Modals/BookingModal';
import { WalkInModal } from './components/Modals/WalkInModal';
import { TableDetailModal } from './components/Modals/TableDetailModal';
import { DatabaseSchemaModal } from './components/Modals/DatabaseSchemaModal';
import { ServerMonitorModal } from './components/Modals/ServerMonitorModal';
import { ToastContainer } from './components/Common/ToastContainer';

export function DashboardContent() {
  const [currentView, setCurrentView] = useState<
    'floor' | 'reservations' | 'timeline' | 'waitlist' | 'waiter_touch' | 'stats'
  >('floor');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isServerMonitorOpen, setIsServerMonitorOpen] = useState(false);
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<string | null>(null);
  const [preselectedTableIdsForBooking, setPreselectedTableIdsForBooking] = useState<string[]>([]);

  const handleOpenBookingModal = (preselectedIds?: string[]) => {
    setPreselectedTableIdsForBooking(preselectedIds || []);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E3A2F] flex flex-col font-sans selection:bg-[#6B3FA0]/20 selection:text-[#1E3A2F]">
      {/* Universal Top Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenBookingModal={() => handleOpenBookingModal()}
        onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenServerMonitor={() => setIsServerMonitorOpen(true)}
      />

      {/* Executive Real-Time Operations KPI Bar */}
      <KPIBar />

      {/* Main Viewport */}
      <main className="flex-1 px-4 lg:px-8 py-6">
        {currentView === 'floor' && (
          <FloorPlanView
            onSelectTableForDetails={(tableId) => setSelectedTableForDetail(tableId)}
            onOpenBookingModalWithTables={(tableIds) => handleOpenBookingModal(tableIds)}
          />
        )}

        {currentView === 'reservations' && (
          <ReservationsList onOpenBookingModal={() => handleOpenBookingModal()} />
        )}

        {currentView === 'waitlist' && <WaitlistView />}

        {currentView === 'waiter_touch' && <WaiterTouchView />}

        {currentView === 'timeline' && (
          <TimelineView onSelectTableForDetails={(tableId) => setSelectedTableForDetail(tableId)} />
        )}

        {currentView === 'stats' && <StatsOverview />}
      </main>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setPreselectedTableIdsForBooking([]);
        }}
        preselectedTableIds={preselectedTableIdsForBooking}
      />

      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
      />

      <TableDetailModal
        tableId={selectedTableForDetail}
        onClose={() => setSelectedTableForDetail(null)}
        onOpenBookingForTable={(tableId) => {
          setSelectedTableForDetail(null);
          handleOpenBookingModal([tableId]);
        }}
      />

      <DatabaseSchemaModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
      />

      <ServerMonitorModal
        isOpen={isServerMonitorOpen}
        onClose={() => setIsServerMonitorOpen(false)}
      />

      {/* Floating Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RestaurantProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </RestaurantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { Login } from './components/Auth/Login';
import { ResetPassword } from './components/Auth/ResetPassword';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Header } from './components/Header/Header';
import { KPIBar } from './components/Header/KPIBar';
import { FloorPlanView } from './components/FloorPlan/FloorPlanView';
import { ReservationsList } from './components/Reservations/ReservationsList';
import { TimelineView } from './components/Timeline/TimelineView';
import { WaitlistView } from './components/Waitlist/WaitlistView';
import { WaiterTouchView } from './components/WaiterTouch/WaiterTouchView';
import { StatsOverview } from './components/Stats/StatsOverview';
import { GuestCRMView } from './components/CRM/GuestCRMView';
import { MonthCalendarView } from './components/Calendar/MonthCalendarView';
import { ShiftOverviewView } from './components/Shift/ShiftOverviewView';
import { PrintRunSheetModal } from './components/Shift/PrintRunSheetModal';
import { StaffManagementModal } from './components/Staff/StaffManagementModal';
import { ServerView } from './components/ServerView/ServerView';
import { ManagerVoidAlertBanner } from './components/Common/ManagerVoidAlertBanner';
import { BookingModal } from './components/Modals/BookingModal';
import { WalkInModal } from './components/Modals/WalkInModal';
import { TableDetailModal } from './components/Modals/TableDetailModal';
import { DatabaseSchemaModal } from './components/Modals/DatabaseSchemaModal';
import { ServerMonitorModal } from './components/Modals/ServerMonitorModal';
import { ShiftBriefingModal } from './components/Shift/ShiftBriefingModal';
import { IconSidebar } from './components/Sidebar/IconSidebar';
import { ToastContainer } from './components/Common/ToastContainer';
import { StaffControlView } from './components/Staff/StaffControlView';
import { WaiterHubView } from './components/WaiterHub/WaiterHubView';
import { GuestProfile } from './types';

export function DashboardContent() {
  const [currentView, setCurrentView] = useState<
    | 'floor'
    | 'reservations'
    | 'timeline'
    | 'calendar'
    | 'shift_overview'
    | 'waitlist'
    | 'waiter_touch'
    | 'stats'
    | 'crm'
    | 'server_view'
    | 'waiter_hub'
    | 'staff_control'
  >('floor');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isServerMonitorOpen, setIsServerMonitorOpen] = useState(false);
  const [isShiftBriefingOpen, setIsShiftBriefingOpen] = useState(false);
  const [isPrintRunSheetOpen, setIsPrintRunSheetOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<string | null>(null);
  const [preselectedTableIdsForBooking, setPreselectedTableIdsForBooking] = useState<string[]>([]);
  const [selectedGuestForBooking, setSelectedGuestForBooking] = useState<GuestProfile | null>(null);
  const [preselectedStartTimeForBooking, setPreselectedStartTimeForBooking] = useState<string | undefined>(undefined);

  const handleOpenBookingModal = (
    preselectedIds?: string[],
    guest?: GuestProfile,
    startTime?: string
  ) => {
    setPreselectedTableIdsForBooking(preselectedIds || []);
    setSelectedGuestForBooking(guest || null);
    setPreselectedStartTimeForBooking(startTime || undefined);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0E121B] text-slate-100 flex font-sans selection:bg-[#8B31E0]/30 selection:text-white">
      {/* Sleek Floating Left Icon Rail */}
      <IconSidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenShiftBriefing={() => setIsShiftBriefingOpen(true)}
        onOpenServerMonitor={() => setIsServerMonitorOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenStaffManagement={() => setIsStaffModalOpen(true)}
      />

      {/* Main Content Area (offset with pl-16 to let sidebar float freely) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pl-16 sm:pl-18">
        {/* Universal Top Header */}
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenBookingModal={() => handleOpenBookingModal()}
          onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          onOpenServerMonitor={() => setIsServerMonitorOpen(true)}
          onOpenShiftBriefing={() => setIsShiftBriefingOpen(true)}
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
          <TimelineView
            onSelectTableForDetails={(tableId) => setSelectedTableForDetail(tableId)}
            onOpenBookingForSlot={(tableId, timeSlot) => handleOpenBookingModal([tableId], undefined, timeSlot)}
            onOpenBookingModal={() => handleOpenBookingModal()}
            defaultMode="list"
          />
        )}

        {currentView === 'waitlist' && <WaitlistView />}

        {currentView === 'staff_control' && <StaffControlView />}

        {(currentView === 'waiter_hub' || currentView === 'waiter_touch' || currentView === 'server_view') && (
          <WaiterHubView />
        )}

        {currentView === 'timeline' && (
          <TimelineView
            onSelectTableForDetails={(tableId) => setSelectedTableForDetail(tableId)}
            onOpenBookingForSlot={(tableId, timeSlot) => handleOpenBookingModal([tableId], undefined, timeSlot)}
            onOpenBookingModal={() => handleOpenBookingModal()}
            defaultMode="timeline"
          />
        )}

        {currentView === 'crm' && (
          <GuestCRMView
            onBookForGuest={(guest) => handleOpenBookingModal([], guest)}
          />
        )}

        {currentView === 'calendar' && (
          <MonthCalendarView
            onSelectDateAndGoToTimeline={() => setCurrentView('timeline')}
            onOpenBookingModal={() => handleOpenBookingModal()}
          />
        )}

        {(currentView === 'shift_overview' || currentView === 'stats') && (
          <ShiftOverviewView
            onOpenPrintRunSheet={() => setIsPrintRunSheetOpen(true)}
            onOpenBookingModal={() => handleOpenBookingModal()}
          />
        )}
      </main>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setPreselectedTableIdsForBooking([]);
          setSelectedGuestForBooking(null);
          setPreselectedStartTimeForBooking(undefined);
        }}
        preselectedTableIds={preselectedTableIdsForBooking}
        initialGuest={selectedGuestForBooking}
        initialStartTime={preselectedStartTimeForBooking}
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

      <ShiftBriefingModal
        isOpen={isShiftBriefingOpen}
        onClose={() => setIsShiftBriefingOpen(false)}
      />

      <PrintRunSheetModal
        isOpen={isPrintRunSheetOpen}
        onClose={() => setIsPrintRunSheetOpen(false)}
      />

      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />

      {/* Real-time Manager Void Alert Banner */}
      <ManagerVoidAlertBanner
        onOpenAuditLogs={() => setIsStaffModalOpen(true)}
      />

      {/* Floating Toast Notification Layer */}
      <ToastContainer />
      </div>
    </div>
  );
}

function AppRouter() {
  const { isRecoveryMode } = useAuth();

  if (isRecoveryMode) {
    return <ResetPassword />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RestaurantProvider>
          <AppRouter />
        </RestaurantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

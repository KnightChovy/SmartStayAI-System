import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { AdminCalendarModal } from './models/calendar/AdminCalendarModal';
import { AdminCreateUserModal } from './models/user/AdminCreateUserModal';
import { AdminFileManagerModal } from './models/file-manager/AdminFileManagerModal';
import { AdminMaintenanceModal } from './models/maintenance/AdminMaintenanceModal';
import { AdminMessagesModal } from './models/message/AdminMessagesModal';
import { AdminModalProvider } from './models/AdminModalContext';
import { AdminNavbar } from './AdminNavbar';
import { AdminNotesModal } from './models/note/AdminNotesModal';
import { AdminReportModal } from './models/report/AdminReportModal';
import { AdminSidebar } from './AdminSidebar';
import { AdminSupportModal } from './models/support/AdminSupportModal';
import { AdminTasksModal } from './models/task/AdminTasksModal';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const closeAllModals = () => {
    setIsCalendarOpen(false);
    setIsCreateUserOpen(false);
    setIsFileManagerOpen(false);
    setIsMaintenanceOpen(false);
    setIsMessagesOpen(false);
    setIsNotesOpen(false);
    setIsReportOpen(false);
    setIsSupportOpen(false);
    setIsTasksOpen(false);
    setIsSidebarOpen(false);
  };

  const handleOpenCalendar = () => {
    closeAllModals();
    setIsCalendarOpen(true);
  };

  const handleOpenCreateUser = () => {
    closeAllModals();
    setIsCreateUserOpen(true);
  };

  const handleOpenMessages = () => {
    closeAllModals();
    setIsMessagesOpen(true);
  };

  const handleOpenTasks = () => {
    closeAllModals();
    setIsTasksOpen(true);
  };

  const handleOpenFileManager = () => {
    closeAllModals();
    setIsFileManagerOpen(true);
  };

  const handleOpenMaintenance = () => {
    closeAllModals();
    setIsMaintenanceOpen(true);
  };

  const handleOpenNotes = () => {
    closeAllModals();
    setIsNotesOpen(true);
  };

  const handleOpenReport = () => {
    closeAllModals();
    setIsReportOpen(true);
  };

  const handleOpenSupport = () => {
    closeAllModals();
    setIsSupportOpen(true);
  };

  return (
    <AdminModalProvider
      value={{
        openCalendar: handleOpenCalendar,
        openCreateUser: handleOpenCreateUser,
        openFileManager: handleOpenFileManager,
        openMaintenance: handleOpenMaintenance,
        openMessages: handleOpenMessages,
        openNotes: handleOpenNotes,
        openReport: handleOpenReport,
        openSupport: handleOpenSupport,
        openTasks: handleOpenTasks,
      }}
    >
      <div className="min-h-screen bg-[#f7f4f3] text-on-surface">
        {isCalendarOpen ? (
          <AdminCalendarModal
            currentTime={currentTime}
            onClose={() => setIsCalendarOpen(false)}
          />
        ) : null}

        {isCreateUserOpen ? (
          <AdminCreateUserModal
            currentTime={currentTime}
            onClose={() => setIsCreateUserOpen(false)}
          />
        ) : null}

        {isFileManagerOpen ? (
          <AdminFileManagerModal
            currentTime={currentTime}
            onClose={() => setIsFileManagerOpen(false)}
          />
        ) : null}

        {isMaintenanceOpen ? (
          <AdminMaintenanceModal
            currentTime={currentTime}
            onClose={() => setIsMaintenanceOpen(false)}
          />
        ) : null}

        {isMessagesOpen ? (
          <AdminMessagesModal
            currentTime={currentTime}
            onClose={() => setIsMessagesOpen(false)}
          />
        ) : null}

        {isNotesOpen ? (
          <AdminNotesModal
            currentTime={currentTime}
            onClose={() => setIsNotesOpen(false)}
          />
        ) : null}

        {isReportOpen ? (
          <AdminReportModal
            currentTime={currentTime}
            onClose={() => setIsReportOpen(false)}
          />
        ) : null}

        {isSupportOpen ? (
          <AdminSupportModal
            currentTime={currentTime}
            onClose={() => setIsSupportOpen(false)}
          />
        ) : null}

        {isTasksOpen ? (
          <AdminTasksModal
            currentTime={currentTime}
            onClose={() => setIsTasksOpen(false)}
          />
        ) : null}

        {isSidebarOpen ? (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
          >
            <button
              aria-label="Close admin sidebar"
              className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            />
            <div className="relative z-10 h-full w-[min(82vw,288px)] shadow-2xl">
              <AdminSidebar
                onClose={() => setIsSidebarOpen(false)}
                onOpenCalendar={handleOpenCalendar}
                onNavigate={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-[256px]">
          <AdminSidebar onOpenCalendar={handleOpenCalendar} />
        </div>

        <div className="lg:pl-64">
          <div className="z-30 lg:fixed lg:top-0 lg:right-0 lg:left-64">
            <AdminNavbar
              currentTime={currentTime}
              onOpenCalendar={handleOpenCalendar}
              onOpenMessages={handleOpenMessages}
              onOpenSupport={handleOpenSupport}
              onMenuClick={() => setIsSidebarOpen(true)}
              searchPlaceholder="Search data, reports, users..."
            />
          </div>

          <main className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:pt-22 lg:pb-6">
            <div className="mx-auto w-full max-w-280">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminModalProvider>
  );
}

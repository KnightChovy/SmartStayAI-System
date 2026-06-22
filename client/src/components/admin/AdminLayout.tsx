import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import CommonNavbar from '@/common/navbar/Navbar';
import CommonSidebar from '@/common/sidebar/Sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminCalendarModal } from './models/calendar/AdminCalendarModal';
import { AdminCreateUserModal } from './models/user/AdminCreateUserModal';
import { AdminFileManagerModal } from './models/file-manager/AdminFileManagerModal';
import { AdminMaintenanceModal } from './models/maintenance/AdminMaintenanceModal';
import { AdminMessagesModal } from './models/message/AdminMessagesModal';
import { AdminModalProvider } from './models/AdminModalContext';
import { AdminNotesModal } from './models/note/AdminNotesModal';
import { AdminReportModal } from './models/report/AdminReportModal';
import { AdminSupportModal } from './models/support/AdminSupportModal';
import { AdminTasksModal } from './models/task/AdminTasksModal';
import { useLogout } from '@/hooks/auth';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'AI Settings', href: '/admin/ai-settings', icon: Bot },
  { name: 'Properties', href: '/admin/properties', icon: Building2 },
  { name: 'System', href: '/admin/system', icon: ShieldAlert },
];

const adminFooterItems = [
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
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

  const logoutMutation = useLogout();

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
    logoutMutation.mutate();
  };

  const { mutate: logout } = useLogout();
  const handleLogout = () => {
    closeAllModals();
    logout();
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
      <SidebarProvider>
        <CommonSidebar
          logoChar="A"
          title="SmartStay AI"
          subtitle="Admin Portal"
          navItems={adminNavItems}
          footerItems={adminFooterItems}
          onLogout={handleLogout}
        />
        <SidebarInset className="bg-[#f7f4f3] text-on-surface">
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

          <CommonNavbar
            currentTime={currentTime}
            onDateClick={handleOpenCalendar}
            searchPlaceholder="Search data, reports, users..."
            userName="Admin"
            rightContent={
              <>
                <button
                  aria-label="Open calendar"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                  onClick={handleOpenCalendar}
                  type="button"
                >
                  <CalendarDays className="size-3.5" />
                </button>
                <button
                  aria-label="Open messages"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                  onClick={handleOpenMessages}
                  type="button"
                >
                  <Bell className="size-3.5" />
                </button>
                <button
                  aria-label="Open support"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                  onClick={handleOpenSupport}
                  type="button"
                >
                  <HelpCircle className="size-3.5" />
                </button>
                <div className="hidden h-6 w-px bg-outline-variant/40 sm:block" />
                <div className="hidden items-center gap-2 sm:flex">
                  <Avatar className="size-8 rounded-full bg-surface-container">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold">Admin</p>
                </div>
              </>
            }
          />

          <main className="flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <div className="mx-auto w-full max-w-280">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AdminModalProvider>
  );
}

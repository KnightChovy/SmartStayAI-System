import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CreditCard,
  DollarSign,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import CommonNavbar from '@/common/navbar/Navbar';
import CommonSidebar from '@/common/sidebar/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminActivityModal } from './models/activity/AdminActivityModal';
import { AdminCalendarModal } from './models/calendar/AdminCalendarModal';
import { AdminCreateUserModal } from './models/user/AdminCreateUserModal';
import { AdminFileManagerModal } from './models/file-manager/AdminFileManagerModal';
import { AdminMaintenanceModal } from './models/maintenance/AdminMaintenanceModal';
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
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'AI Settings', href: '/admin/ai-settings', icon: Bot },
  { name: 'Properties', href: '/admin/properties', icon: Building2 },
  { name: 'System', href: '/admin/system', icon: ShieldAlert },
];

const adminFooterItems = [
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

/** Nút tròn trên navbar — cùng kích thước/viền với bellSlot & helpSlot mặc định của CommonNavbar. */
function NavbarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40 transition-colors hover:bg-surface-container-low"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

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
  };

  const { mutate: logout, isPending: isLoggingOut } = useLogout();
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
          role="admin"
          title="StayHub"
          subtitle="Admin Portal"
          navItems={adminNavItems}
          footerItems={adminFooterItems}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
        <SidebarInset>
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
            <AdminActivityModal
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

          {/*
            Dùng leadingActions/bellSlot/helpSlot thay cho rightContent: rightContent THAY THẾ cả
            khối mặc định, khiến admin mất dropdown avatar (Profile / Back to Home) mà các cổng
            khác đều có, và phải hardcode tên "Admin" thay vì đọc từ authStore. Các slot này chỉ
            chèn thêm nên phần chung được giữ nguyên.
          */}
          <CommonNavbar
            role="admin"
            currentTime={currentTime}
            onDateClick={handleOpenCalendar}
            searchPlaceholder="Search data, reports, users..."
            leadingActions={
              <NavbarIconButton
                label="Open calendar"
                onClick={handleOpenCalendar}
              >
                <CalendarDays className="size-3.5" />
              </NavbarIconButton>
            }
            bellSlot={
              <NavbarIconButton
                label="Open recent activity"
                onClick={handleOpenMessages}
              >
                <Bell className="size-3.5" />
              </NavbarIconButton>
            }
            helpSlot={
              <NavbarIconButton
                label="Open support"
                onClick={handleOpenSupport}
              >
                <HelpCircle className="size-3.5" />
              </NavbarIconButton>
            }
          />

          <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto bg-gray-50">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AdminModalProvider>
  );
}

import { createContext, useContext } from 'react';

interface AdminModalContextValue {
  openCalendar: () => void;
  openCreateUser: () => void;
  openFileManager: () => void;
  openMaintenance: () => void;
  openMessages: () => void;
  openNotes: () => void;
  openReport: () => void;
  openSupport: () => void;
  openTasks: () => void;
}

const AdminModalContext = createContext<AdminModalContextValue>({
  openCalendar: () => undefined,
  openCreateUser: () => undefined,
  openFileManager: () => undefined,
  openMaintenance: () => undefined,
  openMessages: () => undefined,
  openNotes: () => undefined,
  openReport: () => undefined,
  openSupport: () => undefined,
  openTasks: () => undefined,
});

export const AdminModalProvider = AdminModalContext.Provider;

export function useAdminModal() {
  return useContext(AdminModalContext);
}

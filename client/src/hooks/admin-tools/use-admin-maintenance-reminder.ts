import { useLocalStorageValue } from '@/hooks/admin-tools/use-local-storage-value';
import type { AdminMaintenanceReminder } from '@/types/admin-tools.types';

const STORAGE_KEY = 'admin.maintenanceReminder';

export function useAdminMaintenanceReminder() {
  const { value, setValue, clear } =
    useLocalStorageValue<AdminMaintenanceReminder>(STORAGE_KEY);

  const saveReminder = (title: string, date: string, time: string, notes: string) => {
    setValue({
      title: title.trim() || 'Maintenance window',
      date,
      time,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });
  };

  return { reminder: value, saveReminder, clearReminder: clear };
}

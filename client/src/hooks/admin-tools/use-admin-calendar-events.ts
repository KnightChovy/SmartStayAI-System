import { useLocalStorageList } from '@/hooks/admin-tools/use-local-storage-list';
import type { AdminCalendarEvent } from '@/types/admin-tools.types';

const STORAGE_KEY = 'admin.calendarEvents';

export function useAdminCalendarEvents() {
  const { items, add, remove } = useLocalStorageList<AdminCalendarEvent>(STORAGE_KEY);

  const addEvent = (title: string, date: string, time: string, label: string) => {
    add({
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      time,
      label: label.trim() || 'Event',
      createdAt: new Date().toISOString(),
    });
  };

  const events = [...items].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  );

  const eventsOn = (dateKey: string) => events.filter(event => event.date === dateKey);

  return { events, addEvent, removeEvent: remove, eventsOn };
}

import { useLocalStorageList } from '@/hooks/admin-tools/use-local-storage-list';
import type { AdminNote } from '@/types/admin-tools.types';

const STORAGE_KEY = 'admin.notes';

export function useAdminNotes() {
  const { items, add, update, remove } = useLocalStorageList<AdminNote>(STORAGE_KEY);

  const addNote = (title: string, body: string) => {
    add({
      id: crypto.randomUUID(),
      title: title.trim() || 'Untitled',
      body: body.trim(),
      pinned: false,
      createdAt: new Date().toISOString(),
    });
  };

  const togglePin = (id: string) => {
    const note = items.find(item => item.id === id);
    if (note) update(id, { pinned: !note.pinned });
  };

  const notes = [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return { notes, addNote, togglePin, removeNote: remove };
}

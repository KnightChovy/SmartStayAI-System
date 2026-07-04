import { useLocalStorageList } from '@/hooks/admin-tools/use-local-storage-list';
import { useLocalStorageValue } from '@/hooks/admin-tools/use-local-storage-value';
import type { AdminFileEntry } from '@/types/admin-tools.types';

const FILES_KEY = 'admin.files';
const FOLDERS_KEY = 'admin.fileFolders';

export function useAdminFiles() {
  const { items, add, remove } = useLocalStorageList<AdminFileEntry>(FILES_KEY);
  const { value: customFolders, setValue: setCustomFolders } =
    useLocalStorageValue<string[]>(FOLDERS_KEY);

  const folders = customFolders ?? [];

  const addFile = (name: string, url: string, size: number, category: string) => {
    add({
      id: crypto.randomUUID(),
      name,
      url,
      size,
      category,
      uploadedAt: new Date().toISOString(),
    });
  };

  const addFolder = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || folders.includes(trimmed)) return;
    setCustomFolders([...folders, trimmed]);
  };

  const files = [...items].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return { files, folders, addFile, addFolder, removeFile: remove };
}

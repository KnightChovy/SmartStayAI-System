import { useCallback, useEffect, useState } from 'react';

function readList<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/** Danh sách bền vững qua localStorage — dùng cho các admin tool không có domain model ở BE. */
export function useLocalStorageList<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>(() => readList<T>(key));

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [key, items]);

  const add = useCallback((item: T) => {
    setItems(current => [item, ...current]);
  }, []);

  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems(current =>
      current.map(item => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems(current => current.filter(item => item.id !== id));
  }, []);

  return { items, add, update, remove };
}

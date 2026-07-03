import { useCallback, useEffect, useState } from 'react';

function readValue<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Một giá trị bền vững qua localStorage (không phải danh sách) — vd mốc "đã xem", nhắc lịch bảo trì. */
export function useLocalStorageValue<T>(key: string) {
  const [value, setValue] = useState<T | null>(() => readValue<T>(key));

  useEffect(() => {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  const clear = useCallback(() => setValue(null), []);

  return { value, setValue, clear };
}

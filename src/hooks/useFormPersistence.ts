import { useState, useEffect } from 'react';


export function usePersistentState<T>(key: string, initialValue: T, storage: Storage = localStorage) {
  const [value, setValue] = useState<T>(() => {
    const stored = storage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    storage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

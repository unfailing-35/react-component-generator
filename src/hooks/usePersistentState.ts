import { useState, useEffect } from 'react';
import { readStorage, writeStorage } from '../utils/persistence';

export function usePersistentState<T>(
  key: string,
  initial: T,
  parse: (raw: unknown) => T | undefined,
) {
  const [value, setValue] = useState<T>(() => readStorage(key, parse, initial));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

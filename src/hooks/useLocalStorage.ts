import { useState } from "react";

/** useState that is persisted in localStorage (falls back silently if unavailable). */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (newValue: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null") ?? initialValue;
    } catch {
      return initialValue;
    }
  });
  const setAndStore = (newValue: T) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      /* storage unavailable */
    }
  };
  return [value, setAndStore];
}

import {useEffect, useState} from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize state with value from localStorage if available
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setStoredValue(item ? JSON.parse(item) : initialValue);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setStoredValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Remove initialValue from dependencies to prevent infinite loops

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = typeof value === 'function'
        ? (value as (val: T) => T)(storedValue)
        : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

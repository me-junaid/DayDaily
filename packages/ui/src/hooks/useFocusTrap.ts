import { useEffect, useRef } from 'react';

export function useFocusTrap() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Basic focus trap setup
  }, []);
  return ref;
}

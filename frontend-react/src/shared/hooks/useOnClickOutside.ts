import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useOnClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void): void {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}

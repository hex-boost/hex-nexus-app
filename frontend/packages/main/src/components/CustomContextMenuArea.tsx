// src/components/CustomContextMenuArea.tsx
import type { ReactNode } from 'react';
import { useContextMenu } from '@/contexts/ContextMenuContext';
import { useEffect } from 'react';

export function CustomContextMenuArea({ children }: { children: ReactNode }) {
  const { registerCustomMenu } = useContextMenu();

  useEffect(() => {
    const unregister = registerCustomMenu();
    return unregister;
  }, [registerCustomMenu]);

  return <>{children}</>;
}

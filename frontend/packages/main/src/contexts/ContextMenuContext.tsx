// src/contexts/ContextMenuContext.tsx
import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

type ContextMenuContextType = {
  registerCustomMenu: () => () => void;
  hasCustomMenu: boolean;
};

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [customMenuCount, setCustomMenuCount] = useState(0);

  const registerCustomMenu = () => {
    setCustomMenuCount(prev => prev + 1);
    // Return unregister function
    return () => setCustomMenuCount(prev => prev - 1);
  };

  const value = {
    registerCustomMenu,
    hasCustomMenu: customMenuCount > 0,
  };

  return (
    <ContextMenuContext value={value}>
      {children}
    </ContextMenuContext>
  );
}

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};

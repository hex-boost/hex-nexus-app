import type { Size } from '@wailsio/runtime/types/screens';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Window } from '@wailsio/runtime';
import { Minus, XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Position = {
  x: number;
  y: number;
};

export function WindowControls({ className }: { className?: string }) {
  const window = Window;
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousSize, setPreviousSize] = useState<Size | null>(null);
  const [previousPosition, setPreviousPosition] = useState<Position | null>();
  useEffect(() => {
    const updateMaximizeState = async () => {
      const maximized = await window.IsMaximised();
      setIsMaximized(maximized);
      if (!maximized) {
        const size = await window.Size();
        const position = await window.Position();
        setPreviousSize(size);
        setPreviousPosition(position);
      }
    };
    updateMaximizeState();
  }, []);

  const toggleMaximize = async () => {
    if (!isMaximized) {
      const size = await window.Size();
      const position = await window.Position();
      setPreviousSize(size);
      setPreviousPosition(position);
    }
    await window.ToggleMaximise();
    setTimeout(async () => {
      const newMaximized = await window.IsMaximised();
      setIsMaximized(newMaximized);
      if (!newMaximized && previousSize && previousPosition) {
        await window.SetSize(previousSize.width, previousSize.height);
        await window.SetPosition(previousPosition.x, previousPosition.y);
      } else if (newMaximized) {
        const maxWidth = 1600;
        const maxHeight = 900;
        await window.SetSize(maxWidth, maxHeight);
      }
    }, 250);
  };
  console.warn(toggleMaximize);
  const minimizeToTray = () => {
    window.Hide();
  };
  const controlButtonClass = 'h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/[0.1] transition-colors';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <div
          className="flex-grow h-8"
        />
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.Minimise()}
              className={controlButtonClass}
              style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
            >
              <Minus strokeWidth={2} className="h-5 w-5 " />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Minimize</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={minimizeToTray}
              className={cn(controlButtonClass, 'hover:bg-red-500/40')}
              style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
            >
              <XIcon strokeWidth={2} className="h-5 w-5 " />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Minimize to tray</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

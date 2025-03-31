// @ts-expect-error aaa
import type { Size } from '@wailsio/runtime/types/screens';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Window } from '@wailsio/runtime';
import { Maximize, Minus, Square, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Position = {
  /** The horizontal position of the window. */
  x: number;
  /** The vertical position of the window. */
  y: number;
};
export function WindowControls({ className }: { className?: string }) {
  const window = Window;
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousSize, setPreviousSize] = useState<Size | null>(null);
  const [previousPosition, setPreviousPosition] = useState<Position | null>();

  useEffect(() => {
    const updateMaximizeState = async () => {
      console.error(await window.Name());
      const maximized = await window.IsMaximised();
      setIsMaximized(maximized);

      // Se não for maximizada, armazenar a posição e tamanho iniciais
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
        // Defina o tamanho máximo permitido aqui
        const maxWidth = 1600; // Substitua pelo valor desejado
        const maxHeight = 900; // Substitua pelo valor desejado
        await window.SetSize(maxWidth, maxHeight);
      }
    }, 250);
  };

  const minimizeToTray = () => {
    window.Hide();
  };

  const controlButtonClass = 'h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/[0.1] transition-colors';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        {/* Área arrastável com funcionalidade de duplo clique */}
        <div
          className="flex-grow h-8"
          onDoubleClick={toggleMaximize}
        />

        {/* Botão de minimizar */}
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

        {/* Botão de maximizar/restaurar */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleMaximize}
              className={controlButtonClass}
              style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
            >
              {isMaximized ? <Square strokeWidth={2} className="h-5 w-5 " /> : <Maximize strokeWidth={2} className="h-5 w-5 " />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMaximized ? 'Restore' : 'Maximize'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Botão de fechar (minimiza para bandeja) */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={minimizeToTray}
              className={cn(controlButtonClass, 'hover:bg-red-500/40')}
              style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
            >
              <X strokeWidth={2} className="h-5 w-5 " />
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

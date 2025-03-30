import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Hide,
  WindowGetPosition,
  WindowGetSize,
  WindowIsMaximised,
  WindowMinimise,
  WindowSetPosition,
  WindowSetSize,
  WindowToggleMaximise,
} from '@runtime';
import { Maximize, Minus, Square, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export function WindowControls({ className }: { className?: string }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousSize, setPreviousSize] = useState<{ w: number; h: number } | null>(null);
  const [previousPosition, setPreviousPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateMaximizeState = async () => {
      const maximized = await WindowIsMaximised();
      setIsMaximized(maximized);

      // Se não for maximizada, armazenar a posição e tamanho iniciais
      if (!maximized) {
        const size = await WindowGetSize();
        const position = await WindowGetPosition();
        setPreviousSize(size);
        setPreviousPosition(position);
      }
    };

    updateMaximizeState();
  }, []);

  const toggleMaximize = async () => {
    if (!isMaximized) {
      // Salvar posição e tamanho atuais antes de maximizar
      const size = await WindowGetSize();
      const position = await WindowGetPosition();
      setPreviousSize(size);
      setPreviousPosition(position);
    }

    // Alternar o estado de maximização
    WindowToggleMaximise();

    // Esperar um pouco e verificar o novo estado
    setTimeout(async () => {
      const newMaximized = await WindowIsMaximised();
      setIsMaximized(newMaximized);

      // Se acabou de ser restaurada de maximizada, precisamos restaurar posição e tamanho
      if (!newMaximized && previousSize && previousPosition) {
        WindowSetSize(previousSize.w, previousSize.h);
        WindowSetPosition(previousPosition.x, previousPosition.y);
      }
    }, 50);
  };

  const minimizeToTray = () => {
    Hide();
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
              onClick={() => WindowMinimise()}
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
              className={cn(controlButtonClass, 'hover:bg-red-300/10')}
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

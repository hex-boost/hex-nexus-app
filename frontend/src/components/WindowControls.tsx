import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Quit, WindowMaximise, WindowMinimise, WindowUnmaximise } from '@runtime';
import { Maximize, Minus, Square, X } from 'lucide-react';
import React, { useState } from 'react';

type WindowControlsProps = {
  className?: string;
};

export function WindowControls({ className }: WindowControlsProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  // Função para alternar entre maximizado e normal
  const toggleMaximize = () => {
    if (isMaximized) {
      WindowUnmaximise();
      setIsMaximized(false);
    } else {
      WindowMaximise();
      setIsMaximized(true);
    }
  };

  // Classes comuns para os botões de controle
  const controlButtonClass = 'h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/[0.1] transition-colors';

  return (
    <div
      className={cn('flex b items-center gap-2', className)}
      style={{ '--wails-draggable': 'drag' } as React.CSSProperties}

    >
      <TooltipProvider>
        {/* Área arrastável */}
        <div className="flex-grow h-8" />

        {/* Botão de minimizar */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => WindowMinimise()}
              className={controlButtonClass}
              style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}

            >
              <Minus className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Minimizar</p>
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
              {isMaximized ? <Square className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMaximized ? 'Restaurar' : 'Maximizar'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Botão de fechar */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => Quit()}
              className={cn(
                controlButtonClass,
              )}
              style={{ '--wails-draggable': 'no-drag' } as any}

            >
              <X className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fechar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

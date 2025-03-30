import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';
import { Quit, WindowIsMaximised, WindowMinimise, WindowToggleMaximise } from '@runtime';
import { Maximize, Minus, Square, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export function WindowControls({ className }: { className?: string }) {
  const [isMaximized, setIsMaximized] = useState(false);

  // Buscar o estado inicial e configurar um efeito para atualizá-lo
  useEffect(() => {
    const updateMaximizeState = async () => {
      const maximized = await WindowIsMaximised();
      setIsMaximized(maximized);
    };

    updateMaximizeState();
  }, []);

  // Função para alternar entre maximizado e normal
  const toggleMaximize = async () => {
    WindowToggleMaximise();
    // Atualizar o estado após alternar
    const maximized = await WindowIsMaximised();
    setIsMaximized(maximized);
  };

  const controlButtonClass = 'h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/[0.1] transition-colors';

  return (
    <div className={cn('flex items-center gap-2', className)}>
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

        {/* Botão de fechar */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button

              onClick={() => Quit()}
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

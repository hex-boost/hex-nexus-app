'use client';

import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGoState } from '@/hooks/useGoBindings.ts';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { cls } from 'react-image-crop';

export function CopyToClipboard({ className, text }: { className: string; text: string }) {
  const [copied, setCopied] = useState<boolean>(false);

  const { Utils } = useGoState();
  const handleCopy = async () => {
    try {
      setCopied(true);
      await Utils.SetClipboard(text);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cls('disabled:opacity-100  ', className)}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            disabled={copied}
          >
            <div
              className={cn(
                'transition-all',
                copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
              )}
            >
              <Check className="stroke-emerald-500" size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            <div
              className={cn(
                'absolute transition-all',
                copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
              )}
            >
              <Copy size={16} strokeWidth={2} aria-hidden="true" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">Click to copy</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

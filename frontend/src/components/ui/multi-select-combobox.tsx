// Local UI component imports
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Skeleton } from '@/components/ui/skeleton.tsx';

// Utility imports
import { cn } from '@/lib/utils';

import { useVirtualizer } from '@tanstack/react-virtual';
// Third-party component imports
import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

/**
 * Base interface for option items in the multi-select combobox
 * @property label - Display text for the option
 * @property value - Unique identifier for the option
 */
export type BaseOption = {
  label: string;
  value: string;
};

/**
 * Generic type for extending BaseOption with additional properties
 */
export type Option<T extends BaseOption = BaseOption> = T;

/**
 * Props interface for the MultiSelectCombobox component
 * @template T - Type extending BaseOption
 */
type Props<T extends BaseOption> = {
  /** Label for the combobox */
  label: string;
  /** Custom render function for individual options */
  renderItem: (option: T) => React.ReactNode;
  /** Custom render function for selected items display */
  renderSelectedItem: (value: string[]) => React.ReactNode;
  /** Array of available options */
  options: T[];
  onOpenChange?: (open: boolean) => void;

  /** Array of selected values */
  value: string[];
  /** Callback function when selection changes */
  onChange: (value: string[]) => void;
  /** Optional placeholder text for search input */
  placeholder?: string;
  isLoading?: boolean;
};

/**
 * A customizable multi-select combobox component with type safety
 * @template T - Type extending BaseOption
 */
export const MultiSelectCombobox = <T extends BaseOption>({
  label,
  renderItem,
  renderSelectedItem,
  isLoading,
  options,
  value,
  onOpenChange,
  onChange,

  placeholder,
}: Props<T>) => {
  // State for controlling popover visibility
  const [open, setOpen] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);

  // Handle virtualization for large datasets
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Estimated height of each row
    overscan: 5,
  });
  /**
   * Handles the selection/deselection of an option
   * @param currentValue - The value to toggle
   */
  const handleChange = (currentValue: string) => {
    onChange(value.includes(currentValue) ? value.filter(val => val !== currentValue) : [...value, currentValue]);
  };
  useEffect(() => {
    if (open) {
      setRenderLoading(true);
      // Small timeout to allow UI update before heavy rendering
      const timer = setTimeout(() => {
        setRenderLoading(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);
  /**
   * Clears all selected values
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="multi-select-options"
          aria-label={`Select ${label}`}
          tabIndex={0}
          className="border-input  data-[placeholder]:text-muted-foreground [&_svg:not([class*=\'text-\'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 !bg-white/[0.01] w-full"
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setOpen(!open);
            }
          }}
        >
          {/* Icon and label section */}

          <div className="flex-1 text-muted-foreground overflow-hidden">
            {value.length > 0 ? renderSelectedItem(value) : `Select ${label}...`}
          </div>
          <span className="z-10 ml-auto flex items-center gap-2">
            {value.length > 0 && (
              <button
                type="button"
                aria-label="Clear selection"
                className="z-10 rounded-sm opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={handleClear}
              >
                <X className="size-4 shrink-0" />
              </button>
            )}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        id="multi-select-options"
      >
        <Command>
          <CommandInput
            placeholder={placeholder || `Search ${label}...`}
            aria-label={`Search ${label}`}
          />

          { isLoading || renderLoading
            ? (
                <div className="flex flex-col items-center justify-center p-2 space-y-2 w-[348px] bg-card-bg ">
                  {
                    Array.from({ length: 9 }).map((_, index) => (
                      <div className="flex w-full items-center gap-4">
                        <Skeleton key={index} className="rounded-full w-7 h-7" />
                        <Skeleton key={index} className="rounded-md w-32 h-6" />

                      </div>
                    ))

                  }

                </div>
              )
            : (
                <CommandList className="w-[348px]">
                  <CommandEmpty>
                    No
                    {label}
                    {' '}
                    found.
                  </CommandEmpty>
                  <div ref={parentRef} style={{ height: '300px', overflow: 'auto' }}>
                    <CommandGroup style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const option = options[virtualItem.index];
                        return (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => handleChange(option.value)}
                            aria-selected={value.includes(option.value)}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            {renderItem(option)}
                            <Check
                              className={cn('ml-auto h-4 w-4', value.includes(option.value) ? 'opacity-100' : 'opacity-0')}
                              aria-hidden="true"
                            />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </div>
                </CommandList>

              )}
        </Command>
        {' '}

      </PopoverContent>
    </Popover>
  );
};

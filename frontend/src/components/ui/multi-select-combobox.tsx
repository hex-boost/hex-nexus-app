import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Skeleton } from '@/components/ui/skeleton.tsx';

import { cn } from '@/lib/utils';

import { useVirtualizer } from '@tanstack/react-virtual';

import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, { cloneElement, useCallback, useEffect, useMemo, useState } from 'react';

export type BaseOption = {
  label: string;
  value: string;
};

export type Option<T extends BaseOption = BaseOption> = T;

type Props<T extends BaseOption> = {
  label: string;
  renderItem: (option: T) => React.ReactNode;
  renderSelectedItem: (value: string[]) => React.ReactNode;
  options: T[];
  onOpenChange?: (open: boolean) => void;

  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  isLoading?: boolean;
};

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
  const [open, setOpen] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchValue) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length, // Use filtered options
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 100,
  });

  // Reset scroll position when filtered results change
  useEffect(() => {
    if (rowVirtualizer.scrollToIndex) {
      rowVirtualizer.scrollToIndex(0);
    }
  }, [filteredOptions.length]);

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };
  const handleChange = (currentValue: string) => {
    onChange(value.includes(currentValue) ? value.filter(val => val !== currentValue) : [...value, currentValue]);
  };

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => ({ ...prev, [id]: true }));
  }, []);

  const preloadImages = useCallback((visibleOptions: T[]) => {
    visibleOptions.forEach((option: any) => {
      if (!loadedImages[option.value]) {
        const img = new Image();

        const avatarUrl = option.avatar || ''; // Assuming avatar property exists
        if (avatarUrl) {
          img.onload = () => handleImageLoad(option.value);
          img.src = avatarUrl;
        }
      }
    });
  }, [loadedImages, handleImageLoad]);

  useEffect(() => {
    if (open && options.length > 0) {
      const visibleIndices = rowVirtualizer.getVirtualItems();
      const visibleOptions = visibleIndices.map(vi => options[vi.index]);
      preloadImages(visibleOptions);
    }
  }, [open, options, rowVirtualizer.getVirtualItems(), preloadImages]);
  const renderItemWithImageHandling = useCallback((option: T) => {
    // Create a wrapper that passes proper props to the image component
    return (
      <div className="flex items-center w-full">
        {React.isValidElement(renderItem(option))
          ? cloneElement(renderItem(option) as React.ReactElement, {

              // "on-load": () => handleImageLoad(option.value),
            })
          : renderItem(option)}
      </div>
    );
  }, [renderItem, handleImageLoad]);
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
          {}

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
            onValueChange={handleSearchChange}

          />

          { isLoading || renderLoading
            ? (
                <div className="flex flex-col items-center justify-center p-2 space-y-2 w-[348px] bg-card-bg ">
                  {
                    Array.from({ length: 9 }).map((_, index) => (
                      <div key={index} className="flex w-full items-center gap-2">
                        <Skeleton className="rounded-full w-7 h-7" />
                        <Skeleton className="rounded-md w-32 h-6" />

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
                        const option = filteredOptions[virtualItem.index];
                        return (
                          <CommandItem
                            key={`${option.value}-${virtualItem.index}`}

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
                            {renderItemWithImageHandling(option)}
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

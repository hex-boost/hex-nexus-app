import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
// components/accounts/multi-select.tsx
import { useState } from 'react';

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-expanded={open}
          className="w-full font-normal justify-between border bg-input/30 border-input h-9 px-3 text-sm"
        >
          <span className={selected.length > 0 ? '' : 'text-muted-foreground'}>
            {selected.length > 0 ? `${selected.length} selected` : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="max-h-[300px] w-full">
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option}
                  onSelect={() => {
                    onChange(
                      selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option],
                    );
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selected.includes(option) ? 'opacity-100' : 'opacity-0')} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

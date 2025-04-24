// DivisionRankSelectors.tsx - new file
import { Checkbox } from '@/components/ui/checkbox';
import { useMapping } from '@/lib/useMapping';
import { cn } from '@/lib/utils';
import { useEffect, useId, useState } from 'react';

type Rank = 'unranked' | 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
type Division = 'I' | 'II' | 'III' | 'IV' | 'NONE';

type RanksMultiSelectProps = {
  className?: string;
  defaultSelected?: Rank[];
  onChange?: (selectedRanks: Rank[]) => void;
  disabled?: boolean;
};

export function RanksMultiSelect({

  className,
  defaultSelected = [],
  onChange,
  disabled = false,
}: RanksMultiSelectProps) {
  const id = useId();
  const { getEloIcon } = useMapping();
  const [selectedRanks, setSelectedRanks] = useState<Rank[]>(defaultSelected);

  // Available ranks
  const ranks: Rank[] = [
    'unranked',
    'iron',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond',
    'master',
  ];

  useEffect(() => {
    if (defaultSelected) {
      setSelectedRanks(defaultSelected);
    }
  }, [JSON.stringify(defaultSelected)]); // Use stringified version to compare arrays by value

  const toggleRank = (rank: Rank) => {
    const newSelectedRanks = selectedRanks.includes(rank)
      ? selectedRanks.filter(r => r !== rank)
      : [...selectedRanks, rank];

    setSelectedRanks(newSelectedRanks);
    onChange?.(newSelectedRanks);
  };

  return (
    <div className={cn('space-y-2', className)}>

      <div className="grid grid-cols-4 gap-2 max-w-[600px]">
        {ranks.map((rank) => {
          const isSelected = selectedRanks.includes(rank);

          return (
            <label
              key={rank}
              className={cn(
                'relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-input px-2 py-2 text-center shadow-sm',
                'outline-offset-2 transition-colors',
                'hover:bg-accent/50',
                isSelected ? 'border-ring bg-accent' : '',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
              )}
            >
              <Checkbox
                id={`${id}-${rank}`}
                checked={isSelected}
                onCheckedChange={() => !disabled && toggleRank(rank)}
                className="sr-only"
                disabled={disabled}
              />
              <img
                src={getEloIcon(rank)}
                alt={rank}
                className="w-6 h-6"
              />
              <span className="text-xs capitalize">{rank}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

type DivisionsMultiSelectProps = {
  className?: string;
  defaultSelected?: Division[];
  onChange?: (selectedDivisions: Division[]) => void;
  disabled?: boolean;
};

export function DivisionsMultiSelect({
  className,
  defaultSelected = [],
  onChange,
  disabled = false,
}: DivisionsMultiSelectProps) {
  const id = useId();
  const [selectedDivisions, setSelectedDivisions] = useState<Division[]>(defaultSelected);

  // Available divisions
  const divisions: Division[] = ['I', 'II', 'III', 'IV'];

  useEffect(() => {
    if (defaultSelected) {
      setSelectedDivisions(defaultSelected);
    }
  }, [JSON.stringify(defaultSelected)]);

  const toggleDivision = (division: Division) => {
    const newSelectedDivisions = selectedDivisions.includes(division)
      ? selectedDivisions.filter(d => d !== division)
      : [...selectedDivisions, division];

    setSelectedDivisions(newSelectedDivisions);
    onChange?.(newSelectedDivisions);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-4 gap-2 max-w-[600px]">
        {divisions.map((division) => {
          const isSelected = selectedDivisions.includes(division);

          return (
            <label
              key={division}
              className={cn(
                'relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-input px-2 py-2 text-center shadow-sm',
                'outline-offset-2 transition-colors',
                'hover:bg-accent/50',
                isSelected ? 'border-ring bg-accent' : '',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
              )}
            >
              <Checkbox
                id={`${id}-${division}`}
                checked={isSelected}
                onCheckedChange={() => !disabled && toggleDivision(division)}
                className="sr-only"
                disabled={disabled}
              />
              <span className="text-sm font-medium">
                { division}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

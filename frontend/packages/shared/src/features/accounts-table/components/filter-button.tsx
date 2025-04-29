import {Button} from '@/components/ui/button.tsx';
import {cn} from '@/lib/utils.ts';
import {ChevronDown, Filter} from 'lucide-react';

type FilterButtonProps = {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
};

export function FilterButton({ showFilters, setShowFilters }: FilterButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowFilters(!showFilters)}
      className={cn('flex items-center gap-1', showFilters && 'bg-zinc-100 dark:bg-card-darker')}
    >
      <Filter className="h-4 w-4" />
      Filters
      <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'transform rotate-180')} />
    </Button>
  );
}

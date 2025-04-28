import { Input } from '@/components/ui/input.tsx';
import { Search } from 'lucide-react';

type SearchBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400"
      />
      <Input
        placeholder="Search by ID"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="pl-9 h-10"
      />
    </div>
  );
}

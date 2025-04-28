import { Button } from '@/components/ui/button.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { X } from 'lucide-react';

type SkinTag = {
  id: string;
  name: string;
};

type FilterPanelProps = {
  filters: {
    skinLine: string;
    rarity: string;
    releaseYear: string;
    tags: string[];
  };
  setFilters: (filters: any) => void;
  onClose: () => void;
  skinTags?: SkinTag[];
};

export default function FilterPanel({ filters, setFilters, onClose, skinTags }: FilterPanelProps) {
  // Sample filter options
  const skinLines = [
    'Classic',
    'Star Guardian',
    'PROJECT',
    'Battle Academia',
    'Pulsefire',
    'Cosmic',
    'Blackfrost',
    'Hextech',
    'Winter Wonder',
    'Divine',
    'Porcelain',
    'Cafe Cuties',
  ];
  const rarities = ['Common', 'Epic', 'Legendary', 'Ultimate', 'Mythic'];
  const years = [
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018',
    '2017',
    '2016',
    '2015',
    '2014',
    '2013',
    '2012',
    '2011',
    '2010',
    '2009',
  ];

  const handleReset = () => {
    setFilters({
      skinLine: '',
      rarity: '',
      releaseYear: '',
      tags: [],
    });
  };

  return (
    <div className="p-4 border-t border-border bg-shade8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Filters</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Skin Line</label>
          <Select value={filters.skinLine} onValueChange={value => setFilters({ ...filters, skinLine: value })}>
            <SelectTrigger className="bg-shade9">
              <SelectValue placeholder="All skin lines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skin lines</SelectItem>
              {skinLines.map(line => (
                <SelectItem key={line} value={line}>
                  {line}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Rarity</label>
          <Select value={filters.rarity} onValueChange={value => setFilters({ ...filters, rarity: value })}>
            <SelectTrigger className="bg-shade9">
              <SelectValue placeholder="All rarities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rarities</SelectItem>
              {rarities.map(rarity => (
                <SelectItem key={rarity} value={rarity}>
                  {rarity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Release Year</label>
          <Select value={filters.releaseYear} onValueChange={value => setFilters({ ...filters, releaseYear: value })}>
            <SelectTrigger className="bg-shade9">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}

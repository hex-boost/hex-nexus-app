import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';

type ItemsPerPageSelectorProps = {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  options?: number[];
};

export function ItemsPerPageSelector({
  pageSize,
  onPageSizeChange,
  options = [10, 20, 50, 100],
}: ItemsPerPageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={pageSize.toString()}
        onValueChange={value => onPageSizeChange(Number.parseInt(value))}
      >
        <SelectTrigger className="min-w-20 h-8 !bg-popover" style={{ backgroundColor: 'var(--popover)' }}>
          <SelectValue placeholder={pageSize} />
        </SelectTrigger>
        <SelectContent className="min-w-none">
          {options.map(option => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

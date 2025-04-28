import {cn} from '@/lib/utils.ts';
import {ChevronRight} from 'lucide-react';

type BreadcrumbItem = {
  label: string;
  onClick: () => void;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center text-sm p-4', className)}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
            <button
              onClick={item.onClick}
              className={cn(
                'hover:text-foreground transition-colors',
                index === items.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

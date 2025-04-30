import { Skeleton } from '@/components/ui/skeleton.tsx';

export const SummonerCardSkeleton = () => (
  <div className="border bg-card rounded-md p-4 w-full">
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>
    </div>
    <Skeleton className="h-[140px] w-full mb-4" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

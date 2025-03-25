// components/skeletons/account-content-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function AccountInfoSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array.from({ length: 3 })].map((_, i) => (
        <div key={i} className="border p-3 rounded-lg">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ChampionsSkinsSkeleton() {
  return (
    <>
      <div className="flex border-b mb-4">
        {[...Array.from({ length: 2 })].map((_, i) => (
          <Skeleton key={i} className="h-8 w-32 mr-4 mb-2" />
        ))}
      </div>
      <Skeleton className="h-10 w-full mb-4" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {[...Array.from({ length: 16 })].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-12 w-12 rounded mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </>
  );
}

export function RentalOptionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[...Array.from({ length: 4 })].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

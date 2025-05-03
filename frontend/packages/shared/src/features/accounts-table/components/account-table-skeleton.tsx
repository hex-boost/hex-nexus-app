import { Skeleton } from '@/components/ui/skeleton.tsx';
import { AccountActionsMenu } from '@/features/accounts-table/components/account-actions-menu.tsx';

export function AccountTableSkeleton() {
  return (
    <>
      {[...Array.from({ length: 10 })].map((_, index) => (
        <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800">
          <td className="p-3"><Skeleton className="h-5 w-16" /></td>
          <td className="p-3"><Skeleton className="h-6 w-6 rounded-full" /></td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
          </td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </td>
          <td className="p-3"><Skeleton className="h-5 w-8" /></td>
          <td className="p-3"><Skeleton className="h-5 w-8" /></td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
          </td>
          <td className="p-3">
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="p-3">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-5 w-12" />
            </div>
          </td>
          <td className="p-3 text-center">
            <Skeleton className="h-8 w-8 rounded-md mx-auto" />
          </td>

          <td className="p-3 text-center">
            <Skeleton className="h-8 w-8 rounded-md mx-auto" />
          </td>
          <td className="p-3 text-center">
            <Skeleton className="h-6 w-12 rounded-full mx-auto" />
          </td>
          <td className="p-3 text-center">
            <Skeleton className="h-6 w-12 rounded-full mx-auto" />
          </td>

          <td className="p-3 text-center">
            <AccountActionsMenu accountId="0" onViewDetails={() => void 0} />
          </td>
        </tr>
      ))}
    </>
  );
}

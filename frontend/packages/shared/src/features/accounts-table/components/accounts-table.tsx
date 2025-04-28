import { AccountRow } from '@/features/accounts-table/components/account-row.tsx';
import { AccountTableSkeleton } from '@/features/accounts-table/components/account-table-skeleton.tsx';
import React from 'react';

type AccountsTableProps = {
  isLoading: boolean;
  filteredAccounts: any[];
  isPriceLoading: boolean;
  price: any;
  requestSort: (column: string) => void;
  SortIndicator: React.FC<{ column: string }>;
  handleViewAccountDetails: (id: string) => void;
  getEloIcon: (elo: string) => string;
  getRegionIcon: (region: string) => React.ReactNode;
  getCompanyIcon: (company: string) => string;
  getRankColor: (elo: string) => string;
};

export function AccountsTable({
  isLoading,
  filteredAccounts,
  isPriceLoading,
  price,
  requestSort,
  SortIndicator,
  handleViewAccountDetails,
  getEloIcon,
  getRegionIcon,
  getCompanyIcon,
  getRankColor,
}: AccountsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-black/20">
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">ID</th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Game</th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Region
            </th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Restrictions</th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Current Rank</th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Previous Rank
            </th>
            <th
              className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 flex"
              onClick={() => requestSort('winrate')}
            >
              Winrate
              <SortIndicator column="winrate" />
            </th>
            <th
              className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
              onClick={() => requestSort('LCUchampions')}
            >
              <div className="flex items-center">
                Champions
                <SortIndicator column="LCUchampions" />
              </div>
            </th>
            <th
              className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
              onClick={() => requestSort('LCUskins')}
            >
              <div className="flex items-center">
                Skins
                <SortIndicator column="LCUskins" />
              </div>
            </th>
            <th
              className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
              onClick={() => requestSort('blueEssence')}
            >
              <div className="flex items-center">
                Blue Essence
                <SortIndicator column="blueEssence" />
              </div>
            </th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</th>
            <th
              className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
              onClick={() => requestSort('price')}
            >
              <div className="flex relative items-center">
                Price
                <SortIndicator column="price" />
              </div>
            </th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? (
                <AccountTableSkeleton />
              )
            : (
                filteredAccounts.map(account => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    isPriceLoading={isPriceLoading}
                    price={price}
                    onViewDetails={handleViewAccountDetails}
                    getEloIcon={getEloIcon}
                    getRegionIcon={getRegionIcon}
                    getCompanyIcon={getCompanyIcon}
                    getRankColor={getRankColor}
                  />
                ))
              )}
        </tbody>
      </table>
    </div>
  );
}

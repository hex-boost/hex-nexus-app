import React from 'react';

type ResultsCountProps = {
  filteredCount: number;
  totalCount?: number;
  children: React.ReactNode;
};

export function ResultsCount({ totalCount, children }: ResultsCountProps) {
  return (
    <div className="flex gap-2 items-center text-sm text-zinc-600 dark:text-zinc-400">
      Showing
      {' '}
      {children}
      {' '}
      of
      {' '}
      {totalCount || 0}
      {' '}
      accounts
    </div>
  );
}

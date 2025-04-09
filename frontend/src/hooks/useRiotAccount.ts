import type { AccountType } from '@/types/types.ts';

export function useRiotAccount({ account }: { account: AccountType }) {
  const currentRanking = account.rankings.find(ranking => ranking.type === 'current')!;
  return { currentRanking };
}

import type { Server } from '@/types/types.ts';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { BlitzRiotAccount } from './types/BlitzRiotAccount.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export enum QueueType {
  RankedSolo = 420,
  RankedFlex = 450,
}
export async function fetchRiotAccount({ gameName, tagLine, platformId }: { gameName: string; tagLine: string; platformId: Server }): Promise<BlitzRiotAccount> {
  try {
    const response = await axios.get<BlitzRiotAccount>(
      `https://lol.iesdev.com/riot_account/lol/${platformId}/${gameName}/${tagLine}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching riot account:', error);
    throw error;
  }
}
type UseBlitzRiotAccountResult = {
  blitzRiotAccount: BlitzRiotAccount | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  refresh: () => Promise<void>;
  clearSummoner: () => void;
};

export function useBlitzRiotAccount({
  gameName,
  tagLine,
  region,
  queryOptions,
}: {
  gameName: string;
  tagLine: string;
  region: Server;
  queryOptions?: Omit<UseQueryOptions<BlitzRiotAccount, Error, BlitzRiotAccount, (string | number | Server)[]>, 'queryKey' | 'queryFn' | 'enabled'>;
}): UseBlitzRiotAccountResult {
  const queryClient = useQueryClient();

  // Include all parameters in the query key for proper caching
  const queryKey = ['blitz', 'riot_account', region, gameName, tagLine];

  const { data: blitzRiotAccount, isLoading, error, refetch } = useQuery<BlitzRiotAccount, Error>({
    queryKey,
    queryFn: () => {
      return fetchRiotAccount({ gameName, tagLine, platformId: region });
    },
    enabled: !!gameName && !!tagLine && !!region,
    ...queryOptions,
  });

  // Rest of the code remains the same
  return {
    blitzRiotAccount,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
    clearSummoner: () => {
      queryClient.setQueryData(queryKey, null);
    },
  };
}

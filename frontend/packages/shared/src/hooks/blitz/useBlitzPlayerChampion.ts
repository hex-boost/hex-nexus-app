import type {Server} from '@/types/types.ts';
import type {UseQueryOptions} from '@tanstack/react-query';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import type {PlayerChampionList} from './types/PlayerChampion.ts';
import axios from 'axios';

export enum QueueType {
  RankedSolo = 420,
  RankedFlex = 450,
}

type UseBlitzPlayerChampionResult = {
  playerChampion: PlayerChampionList | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  refresh: () => Promise<void>;
  clearSummoner: () => void;
};

export function useBlitzPlayerChampion({
  gameName,
  tagLine,
  queueType = QueueType.RankedSolo,
  region,
  queryOptions,
}: {
  gameName: string;
  tagLine: string;
  region: Server;
  queueType?: QueueType;
  queryOptions?: Omit<UseQueryOptions<PlayerChampionList, Error, PlayerChampionList, (string | number | Server)[]>, 'queryKey' | 'queryFn' | 'enabled'>;
}): UseBlitzPlayerChampionResult {
  const queryClient = useQueryClient();

  // Include all parameters in the query key for proper caching
  const queryKey = ['blitz', 'playerChampion', region, gameName, tagLine, queueType];

  const { data: playerChampion, isLoading, error, refetch } = useQuery<PlayerChampionList, Error>({
    queryKey,
    queryFn: async () => {
      const response = await axios.get<PlayerChampionList>(
        `https://lol.iesdev.com/lol/player_champion_aggregate/${region}/${gameName}/${tagLine}/${queueType}`,
      );
      return response.data;
    },
    enabled: !!gameName && !!tagLine && !!region,
    ...queryOptions,
  });

  // Rest of the code remains the same
  return {
    playerChampion,
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

import type { Server } from '@/types/types.ts';
import { useMapping } from '@/lib/useMapping.tsx';

export function useLobbyRevealer() {
  const { getFormattedServer } = useMapping();

  function processSummonerCards(champSelect: any) {
    return champSelect.myTeam.map(myTeam => `${myTeam.gameName.trim()}#${myTeam.tagLine.trim()}`) as string[];
  }

  function getMultiSearchUrl(summonerCards: string[], platformid: string): string {
    const region = getFormattedServer(platformid as Server);

    const summonerList = summonerCards
      .map((card) => {
        return encodeURIComponent(card);
      })
      .join('%2C');

    return `https://op.gg/lol/multisearch/${region.toLowerCase()}?summoners=${summonerList}`;
  }

  return { getMultiSearchUrl, processSummonerCards };
}

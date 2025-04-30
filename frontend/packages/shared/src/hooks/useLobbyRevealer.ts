import type {LobbySummonerCardProps} from '@/components/LobbySummonerCard.tsx';
import type {Server, TeamBuilderChampionSelect} from '@/types/types.ts';
import {useBlitzPlayerChampion} from '@/hooks/blitz/useBlitzPlayerChampion.ts';
import {useAllDataDragon} from '@/hooks/useDataDragon/useDataDragon.ts';
import {Browser, Events} from '@wailsio/runtime';
import {useEffect} from 'react';
import {useBlitzRiotAccount} from "@/hooks/blitz/useBlitzRiotAccount.ts";

export function useLobbyRevealer({ platformId }: { platformId: string }) {
  const { allChampions } = useAllDataDragon();
  function getChampionLoadingUrl(championId: number, skinId: number | null): string | null {
    if (!championId) {
      return null;
    }
    const championName = allChampions.find(champion => Number(champion.id) === Number(championId))?.name_id;

    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${skinId || 0}.jpg`;
  }
  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-lobby-team-builder_champ-select_v1', (event) => {
      console.log('lol-lobby-team-builder_champ-select_v1', event.data[0]);
      const champSelect = event.data[0] as TeamBuilderChampionSelect;
      const gameNames = champSelect.myTeam.map(async (summoner) => {
        const { playerChampion } = useBlitzPlayerChampion({ gameName: summoner.gameName, tagLine: summoner.tagLine, region: platformId as Server || '' });

          const {blitzRiotAccount}= useBlitzRiotAccount({gameName: summoner.gameName, tagLine: summoner.tagLine, region: platformId as Server || ''});
        const player = playerChampion?.find(champion => champion.champion_id === summoner.championId);

        const summonerCard: LobbySummonerCardProps = {
          summonerName: summoner.gameName,
          summonerTag: summoner.tagLine,
          kills: player?.kills || 0,
          deaths: player?.deaths || 0,
          assists: player?.assists || 0,
          onOpenOpgg: () => Browser.OpenURL(`https://op.gg/summoners/${summoner.tagLine}/${summoner.gameName}`),
          onOpenBlitz: () => Browser.OpenURL(`https://blitz.gg/lol/profile/${platformId.toLowerCase()}/${summoner.gameName}-${summoner.tagLine}`),
          championLoadingImage: getChampionLoadingUrl(summoner.championId, summoner.selectedSkinId),

        };
      });
    });
    return () => {
      cancel();
    };
  }, []);
}

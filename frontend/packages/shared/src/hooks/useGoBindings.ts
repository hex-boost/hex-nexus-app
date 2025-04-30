import {useAccountEvents} from '@/hooks/useAccountEvents.ts';

import {useChampionSkin} from '@/hooks/useChampionSkin.ts';
import {useGameflowEvents} from '@/hooks/useGameflowEvents.ts';
import {UseCurrentSummonerEvents} from '@/hooks/useCurrentSummonerEvents.ts';

export function useGoState() {
  useChampionSkin();
  useGameflowEvents();
  UseCurrentSummonerEvents();
  useAccountEvents();
}

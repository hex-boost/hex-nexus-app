import {useAccountEvents} from '@/hooks/useAccountEvents.ts';

import {useChampionSkin} from '@/hooks/useChampionSkin.ts';
import {useGameflowEvents} from '@/hooks/useGameflowEvents.ts';
import {useSummonerEvents} from '@/hooks/useSummonerEvents.ts';

export function useGoState() {
  useChampionSkin();
  useGameflowEvents();
  useSummonerEvents();
  useAccountEvents();
}

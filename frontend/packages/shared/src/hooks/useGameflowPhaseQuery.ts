import { useLeagueState } from '@/hooks/useLeagueState.tsx';
import { LeagueClientStateType } from '@league';
import * as Summoner from '@summonerClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Events } from '@wailsio/runtime';
import { useCallback, useEffect } from 'react';

export const GAMEFLOW_PHASE_QUERY = ['gameflow-phase'];
export enum LolChallengesGameflowPhase {
  TerminatedInError = 'TerminatedInError',
  EndOfGame = 'EndOfGame',
  PreEndOfGame = 'PreEndOfGame',
  WaitingForStats = 'WaitingForStats',
  Reconnect = 'Reconnect',
  InProgress = 'InProgress',
  FailedToLaunch = 'FailedToLaunch',
  GameStart = 'GameStart',
  ChampSelect = 'ChampSelect',
  ReadyCheck = 'ReadyCheck',
  CheckedIntoTournament = 'CheckedIntoTournament',
  Matchmaking = 'Matchmaking',
  Lobby = 'Lobby',
  None = 'None',
}
export type Session = {
  gameClient: GameClient;
  gameData: GameData;
  gameDodge: GameDodge;
  map: Map;
  phase: string;
};

export type GameClient = {
  observerServerIp: string;
  observerServerPort: number;
  running: boolean;
  serverIp: string;
  serverPort: number;
  visible: boolean;
};

export type GameData = {
  gameId: number;
  gameName: string;
  isCustomGame: boolean;
  password: string;
  playerChampionSelections: any[];
  queue: Queue;
  spectatorsAllowed: boolean;
  teamOne: any[];
  teamTwo: any[];
};

export type Queue = {
  allowablePremadeSizes: any[];
  areFreeChampionsAllowed: boolean;
  assetMutator: string;
  category: string;
  championsRequiredToPlay: number;
  description: string;
  detailedDescription: string;
  gameMode: string;
  gameTypeConfig: GameTypeConfig;
  id: number;
  isCustom: boolean;
  isRanked: boolean;
  isTeamBuilderManaged: boolean;
  lastToggledOffTime: number;
  lastToggledOnTime: number;
  mapId: number;
  maximumParticipantListSize: number;
  minLevel: number;
  minimumParticipantListSize: number;
  name: string;
  numPlayersPerTeam: number;
  queueAvailability: string;
  queueRewards: QueueRewards;
  removalFromGameAllowed: boolean;
  removalFromGameDelayMinutes: number;
  shortName: string;
  showPositionSelector: boolean;
  spectatorEnabled: boolean;
  type: string;
};

export type GameTypeConfig = {
  advancedLearningQuests: boolean;
  allowTrades: boolean;
  banMode: string;
  banTimerDuration: number;
  battleBoost: boolean;
  crossTeamChampionPool: boolean;
  deathMatch: boolean;
  doNotRemove: boolean;
  duplicatePick: boolean;
  exclusivePick: boolean;
  id: number;
  learningQuests: boolean;
  mainPickTimerDuration: number;
  maxAllowableBans: number;
  name: string;
  onboardCoopBeginner: boolean;
  pickMode: string;
  postPickTimerDuration: number;
  reroll: boolean;
  teamChampionPool: boolean;
};

export type QueueRewards = {
  isChampionPointsEnabled: boolean;
  isIpEnabled: boolean;
  isXpEnabled: boolean;
  partySizeIpRewards: any[];
};

export type GameDodge = {
  dodgeIds: any[];
  phase: string;
  state: string;
};

export type Map = {
  assets: Assets;
  categorizedContentBundles: CategorizedContentBundles;
  description: string;
  gameMode: string;
  gameModeName: string;
  gameModeShortName: string;
  gameMutator: string;
  id: number;
  isRGM: boolean;
  mapStringId: string;
  name: string;
  perPositionDisallowedSummonerSpells: PerPositionDisallowedSummonerSpells;
  perPositionRequiredSummonerSpells: PerPositionRequiredSummonerSpells;
  platformId: string;
  platformName: string;
  properties: Properties;
};

export type Assets = {
  'champ-select-background-sound': string;
  'champ-select-flyout-background': string;
  'champ-select-planning-intro': string;
  'game-select-icon-active': string;
  'game-select-icon-active-video': string;
  'game-select-icon-default': string;
  'game-select-icon-disabled': string;
  'game-select-icon-hover': string;
  'game-select-icon-intro-video': string;
  'gameflow-background': string;
  'gameselect-button-hover-sound': string;
  'icon-defeat': string;
  'icon-defeat-video': string;
  'icon-empty': string;
  'icon-hover': string;
  'icon-leaver': string;
  'icon-victory': string;
  'icon-victory-video': string;
  'map-north': string;
  'map-south': string;
  'music-inqueue-loop-sound': string;
  'parties-background': string;
  'postgame-ambience-loop-sound': string;
  'ready-check-background': string;
  'ready-check-background-sound': string;
  'sfx-ambience-pregame-loop-sound': string;
  'social-icon-leaver': string;
  'social-icon-victory': string;
};

export type CategorizedContentBundles = object;

export type PerPositionDisallowedSummonerSpells = object;

export type PerPositionRequiredSummonerSpells = object;

export type Properties = {
  suppressRunesMasteriesPerks: boolean;
};

export function useGameflowPhase() {
  const queryClient = useQueryClient();
  const { state } = useLeagueState();
  // For initial fetch and refetching
  const { data: gameflowPhase, isLoading, error, refetch } = useQuery({
    queryKey: GAMEFLOW_PHASE_QUERY,
    queryFn: Summoner.Client.GetGameflowSession,
    enabled: state?.clientState === LeagueClientStateType.ClientStateLoggedIn,

  });

  const update = useCallback((data: LolChallengesGameflowPhase) => {
    queryClient.setQueryData(GAMEFLOW_PHASE_QUERY, data);
  }, [queryClient]);

  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-gameflow_v1_session', (event) => {
      console.log('gameflow_v1_session', event.data[0]);
      if (!event.data[0]) {
        return;
      }
      const session: Session = event.data[0];
      update(session.phase as LolChallengesGameflowPhase);
    });

    return () => {
      cancel();
    };
  }, [update]);

  return {
    gameflowPhase,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: GAMEFLOW_PHASE_QUERY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(GAMEFLOW_PHASE_QUERY, null);
    },
    update, // Export to use with websocket
  };
}

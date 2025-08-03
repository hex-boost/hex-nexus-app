import type {
  AdminApiToken,
  AdminApiTokenPermission,
  AdminPermission,
  AdminRole,
  AdminTransferToken,
  AdminTransferTokenPermission,
  AdminUser,
  ApiAccountAccount,
  ApiFavoriteAccountFavoriteAccount,
  ApiNotificationNotification,
  ApiPremiumPremium,
  ApiRankingRanking,
  ApiRentalRental,
  ApiTimeOptionTimeOption,
  ApiTransactionTransaction,
  ApiVersionVersion,
  PluginContentReleasesRelease,
  PluginContentReleasesReleaseAction,
  PluginI18NLocale,
  PluginReviewWorkflowsWorkflow,
  PluginReviewWorkflowsWorkflowStage,
  PluginUploadFile,
  PluginUploadFolder,
  PluginUsersPermissionsPermission,
  PluginUsersPermissionsRole,
  PluginUsersPermissionsUser,
} from '@/types/generated/contentTypes';

import type { AxiosResponse } from 'axios';
import type { Entity } from './conversion';

export type UserType = Entity<PluginUsersPermissionsUser>;
export type AccountType = Entity<ApiAccountAccount>;
export type FavoriteAccounts = Entity<ApiFavoriteAccountFavoriteAccount>;
export type Server = AccountType['server'];
export type ServerNotification = Entity<ApiNotificationNotification>;
export type ServerNotificationEvents = ServerNotification['event'];
export type Version = Entity<ApiVersionVersion>;

export type AccountPermissions = Entity<PluginUsersPermissionsUser>['accountPermissions'];
export type ApiTokenType = Entity<AdminApiToken>;
export type ApiTokenPermissionType = Entity<AdminApiTokenPermission>;
export type AdminPermissionType = Entity<AdminPermission>;
export type AdminRoleType = Entity<AdminRole>;
export type TransferTokenType = Entity<AdminTransferToken>;
export type Rental = Entity<ApiRentalRental>;
export type TransferTokenPermissionType = Entity<AdminTransferTokenPermission>;
export type AdminUserType = Entity<AdminUser>;
export type TimeOption = Entity<ApiTimeOptionTimeOption>;
export type PremiumType = Entity<ApiPremiumPremium>;
export type RankingType = Entity<ApiRankingRanking>;
export type TransactionType = Entity<ApiTransactionTransaction>;

export type ContentReleaseType = Entity<PluginContentReleasesRelease>;
export type ContentReleaseActionType = Entity<PluginContentReleasesReleaseAction>;

export type LocaleType = Entity<PluginI18NLocale>;

export type WorkflowType = Entity<PluginReviewWorkflowsWorkflow>;
export type WorkflowStageType = Entity<PluginReviewWorkflowsWorkflowStage>;

export type MediaFileType = Entity<PluginUploadFile>;
export type MediaFolderType = Entity<PluginUploadFolder>;

export type PermissionType = Entity<PluginUsersPermissionsPermission>;
export type RoleType = Entity<PluginUsersPermissionsRole>;

export type UserRole = RoleType;
export type UserMedia = MediaFileType;
export type RankingGame = RankingType['game'];
export type PremiumTiers = PremiumType['tier'];

export type TeamBuilderChampionSelect = {
  actions: Action[][];
  allowBattleBoost: boolean;
  allowDuplicatePicks: boolean;
  allowLockedEvents: boolean;
  allowRerolling: boolean;
  allowSkinSelection: boolean;
  allowSubsetChampionPicks: boolean;
  benchChampions: any[];
  benchEnabled: boolean;
  boostableSkinCount: number;
  chatDetails: ChatDetails;
  counter: number;
  gameId: number;
  hasSimultaneousBans: boolean;
  hasSimultaneousPicks: boolean;
  isLegacyChampSelect: boolean;
  isSpectating: boolean;
  localPlayerCellId: number;
  lockedEventIndex: number;
  myTeam: MyTeam[];
  pickOrderSwaps: PickOrderSwap[];
  positionSwaps: PositionSwap[];
  rerollsRemaining: number;
  showQuitButton: boolean;
  skipChampionSelect: boolean;
  theirTeam: TheirTeam[];
  timer: Timer;
  trades: any[];
};

export type Action = {
  actorCellId: number;
  championId: number;
  completed: boolean;
  id: number;
  isAllyAction: boolean;
  isInProgress: boolean;
  type: string;
};

export type ChatDetails = {
  mucJwtDto: MucJwtDto;
  multiUserChatId: string;
  multiUserChatPassword: string;
};

export type MucJwtDto = {
  channelClaim: string;
  domain: string;
  jwt: string;
  targetRegion: string;
};

export type MyTeam = {
  assignedPosition: string;
  cellId: number;
  championId: number;
  championPickIntent: number;
  gameName: string;
  isHumanoid: boolean;
  nameVisibilityType: string;
  obfuscatedPuuid: string;
  obfuscatedSummonerId: number;
  playerType: string;
  puuid: string;
  selectedSkinId: number;
  spell1Id: number;
  spell2Id: number;
  summonerId: number;
  tagLine: string;
  team: number;
};

export type PickOrderSwap = {
  cellId: number;
  id: number;
  state: string;
};

export type PositionSwap = {
  cellId: number;
  id: number;
  state: string;
};

export type TheirTeam = {
  assignedPosition: string;
  cellId: number;
  championId: number;
  championPickIntent: number;
  gameName: string;
  isHumanoid: boolean;
  nameVisibilityType: string;
  obfuscatedPuuid: string;
  obfuscatedSummonerId: number;
  playerType: string;
  puuid: string;
  selectedSkinId: number;
  spell1Id: number;
  spell2Id: number;
  summonerId: number;
  tagLine: string;
  team: number;
};

export type Timer = {
  adjustedTimeLeftInPhase: number;
  internalNowInEpochMs: number;
  isInfinite: boolean;
  phase: string;
  totalTimeInPhase: number;
};

export type RawStrapiError = {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: Record<string, unknown>;
  };
};
export type StrapiError = AxiosResponse<{
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: Record<string, unknown>;
  };
}>;

import type {
  AdminApiToken,
  AdminApiTokenPermission,
  AdminPermission,
  AdminRole,
  AdminTransferToken,
  AdminTransferTokenPermission,
  AdminUser,
  ApiAccountAccount,
  ApiActionAction,
  ApiPremiumPremium,
  ApiPricePrice,
  ApiRankingRanking,
  ApiTransactionTransaction,
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
import type { Entity } from './conversion';

export type UserType = Entity<PluginUsersPermissionsUser>;
export type AccountType = Entity<ApiAccountAccount>;
export type AccountPermissions = Entity<PluginUsersPermissionsUser>['accountPermissions'];
export type ApiTokenType = Entity<AdminApiToken>;
export type ApiTokenPermissionType = Entity<AdminApiTokenPermission>;
export type AdminPermissionType = Entity<AdminPermission>;
export type AdminRoleType = Entity<AdminRole>;
export type TransferTokenType = Entity<AdminTransferToken>;

export type TransferTokenPermissionType = Entity<AdminTransferTokenPermission>;
export type AdminUserType = Entity<AdminUser>;

// API types
export type ActionType = Entity<ApiActionAction>;
export type PremiumType = Entity<ApiPremiumPremium>;
export type PriceType = Entity<ApiPricePrice>;
export type RankingType = Entity<ApiRankingRanking>;
export type TransactionType = Entity<ApiTransactionTransaction>;

// Plugin: Content Releases
export type ContentReleaseType = Entity<PluginContentReleasesRelease>;
export type ContentReleaseActionType = Entity<PluginContentReleasesReleaseAction>;

// Plugin: i18n
export type LocaleType = Entity<PluginI18NLocale>;

// Plugin: Review Workflows
export type WorkflowType = Entity<PluginReviewWorkflowsWorkflow>;
export type WorkflowStageType = Entity<PluginReviewWorkflowsWorkflowStage>;

// Plugin: Upload
export type MediaFileType = Entity<PluginUploadFile>;
export type MediaFolderType = Entity<PluginUploadFolder>;

// Plugin: Users-Permissions
export type PermissionType = Entity<PluginUsersPermissionsPermission>;
export type RoleType = Entity<PluginUsersPermissionsRole>;

// Additional common types from specific entities
export type UserRole = RoleType;
export type UserMedia = MediaFileType;
export type RankingGame = RankingType['game'];
export type PremiumTier = PremiumType['tier'];

import type { Schema, Struct } from '@strapi/types';
import type { ApiResponse } from 'strapi-ts-sdk';
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
} from './generated/contentTypes';

// Add export keyword here
export type ContentTypeSchemas = {
  'admin::api-token': AdminApiToken;
  'admin::api-token-permission': AdminApiTokenPermission;
  'admin::permission': AdminPermission;
  'admin::role': AdminRole;
  'admin::transfer-token': AdminTransferToken;
  'admin::transfer-token-permission': AdminTransferTokenPermission;
  'admin::user': AdminUser;
  'api::account.account': ApiAccountAccount;
  'api::action.action': ApiActionAction;
  'api::premium.premium': ApiPremiumPremium;
  'api::price.price': ApiPricePrice;
  'api::ranking.ranking': ApiRankingRanking;
  'api::transaction.transaction': ApiTransactionTransaction;
  'plugin::content-releases.release': PluginContentReleasesRelease;
  'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
  'plugin::i18n.locale': PluginI18NLocale;
  'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
  'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
  'plugin::upload.file': PluginUploadFile;
  'plugin::upload.folder': PluginUploadFolder;
  'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
  'plugin::users-permissions.role': PluginUsersPermissionsRole;
  'plugin::users-permissions.user': PluginUsersPermissionsUser;
};

// Simplified helper that just uses the ContentTypeSchemas directly
export type GetContentTypeSchema<T extends string> =
  T extends keyof ContentTypeSchemas ? ContentTypeSchemas[T] : never;
type ExtractValueFromLabelValue<T extends string> =
  T extends `${string}:${infer Value}` ? Value : T;

// Recursive entity without depth control - will expand infinitely
type RecursiveEntity<
  EntityType extends Struct.CollectionTypeSchema | Struct.SingleTypeSchema,
> = {
  id: number;
} & {
  [K in keyof EntityType['attributes']]: ExtractRecursiveType<
    EntityType['attributes'][K]
  >;
};

// Debug helper to see what's happening with relation types
type DebugRelationType<R> = R extends Schema.Attribute.Relation<infer RT, infer Target> ?
    { relationType: RT; target: Target; resolved: GetContentTypeSchema<Target> } : never;

// Expand relations without depth control
type ExpandRelations<R> =
  R extends Schema.Attribute.Relation<'oneToMany', infer Target>
    ? Array<Entity<GetContentTypeSchema<Target>>>
    : R extends Schema.Attribute.Relation<'manyToMany', infer Target>
      ? Array<Entity<GetContentTypeSchema<Target>>>
      : R extends Schema.Attribute.Relation<'manyToOne', infer Target>
        ? Entity<GetContentTypeSchema<Target>>
        : R extends Schema.Attribute.Relation<'oneToOne', infer Target>
          ? Entity<GetContentTypeSchema<Target>>
          : any;
// Extract types without depth control
type ExtractRecursiveType<T> =
  T extends Schema.Attribute.Integer ? number :
    T extends Schema.Attribute.String ? string :
      T extends Schema.Attribute.Email ? string :
        T extends Schema.Attribute.Password ? string :
          T extends Schema.Attribute.Decimal ? number :
            T extends Schema.Attribute.Boolean ? boolean :
              T extends Schema.Attribute.Media<'images', infer R>
                ? R extends true ? ApiResponse.Avatar[] : ApiResponse.Avatar :
                T extends Schema.Attribute.Media<infer _, infer R>
                  ? R extends true ? ApiResponse.Avatar[] : ApiResponse.Avatar :
                  T extends Schema.Attribute.Enumeration<infer U> ? U :
                    T extends Schema.Attribute.Enumeration<infer U extends string[]> ? U[number] | string :
                      T extends Schema.Attribute.DateTime ? Date :
                        T extends Schema.Attribute.JSON & Schema.Attribute.CustomField<'plugin::multi-select.multi-select', infer U extends readonly string[]>
                          ? ExtractValueFromLabelValue<U[number]>[] :
                          T extends Schema.Attribute.JSON ? any :
                            T extends Schema.Attribute.Time ? string :
                              T extends Schema.Attribute.Text ? string :
                                T extends Schema.Attribute.RichText ? string :
                                  T extends Schema.Attribute.Relation<any, any> ? ExpandRelations<T> :
                                    unknown;

// Main Entity type for external use
export type Entity<EntityType extends Struct.CollectionTypeSchema | Struct.SingleTypeSchema> =
  RecursiveEntity<EntityType>;
const user = {} as Entity<PluginUsersPermissionsUser>;
user.transactions.forEach(trans => trans.amount);

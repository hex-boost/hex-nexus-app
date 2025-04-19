import type { RankingType } from '@/types/types.ts';
import type { Public, Schema, Struct } from '@strapi/types';
import type { ApiResponse } from 'strapi-ts-sdk';

export type GetContentTypeSchema<T extends string> =
  T extends keyof Public.ContentTypeSchemas ? Public.ContentTypeSchemas[T] : never;
type ExtractValueFromLabelValue<T extends string> =
  T extends `${string}:${infer Value}` ? Value : T;

type RecursiveEntity<
  EntityType extends Struct.CollectionTypeSchema | Struct.SingleTypeSchema,
> = {
  id: number;
  documentId: string;
} & {
  [K in keyof EntityType['attributes']]: ExtractRecursiveType<
    EntityType['attributes'][K],
    K
  >;
};

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

type ExtractRecursiveType<T, K extends string | number | symbol = never> =
  K extends 'ranking'
    ? RankingType :
    K extends 'LCUchampions' ? number[] :
      K extends 'LCUskins' ? number[] :
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
                        T extends Schema.Attribute.Enumeration<infer U extends string[]> ? U[number] :
                          T extends Schema.Attribute.DateTime ? Date :
                            T extends Schema.Attribute.JSON & Schema.Attribute.CustomField<'plugin::multi-select.multi-select', infer U extends readonly string[]>
                              ? ExtractValueFromLabelValue<U[number]>[] :
                              T extends Schema.Attribute.JSON ? any :
                                T extends Schema.Attribute.Time ? string :
                                  T extends Schema.Attribute.Text ? string :
                                    T extends Schema.Attribute.RichText ? string :
                                      T extends Schema.Attribute.Relation<any, any> ? ExpandRelations<T> :
                                        unknown;

export type Entity<EntityType extends Struct.CollectionTypeSchema | Struct.SingleTypeSchema> =
  RecursiveEntity<EntityType>;

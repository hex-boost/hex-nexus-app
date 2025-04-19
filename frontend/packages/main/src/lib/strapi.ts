import type { UserType } from '@/types/types';
import type { StrapiDefaultOptions } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';

import { ProviderAuth, Strapi, UserAuth, UserBase } from 'strapi-ts-sdk';

const defaults: StrapiDefaultOptions = {
  url: import.meta.env.VITE_API_URL || 'http://localhost:1337',
  prefix: '/api',

  store: {
    key: 'authToken',
    useLocalStorage: true,
    cookieOptions: { path: '/' },
  },
  axiosOptions: {},
};
export const strapiClient = new Strapi({ ...defaults });

export const userAuth = new UserAuth<UserType>(strapiClient);
export const providerAuth = new ProviderAuth<UserType>(strapiClient, userAuth);
export const userBase = new UserBase<UserType>(strapiClient);

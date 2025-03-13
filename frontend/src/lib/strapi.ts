
import { ProviderAuth, Strapi, UserAuth, UserBase } from "strapi-ts-sdk"
import { StrapiDefaultOptions } from "strapi-ts-sdk/dist/infra/strapi-sdk/src";

const defaults: StrapiDefaultOptions = {
  url: import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337',
  prefix: '/api',

  store: {
    key: 'authToken',
    useLocalStorage: true,
    cookieOptions: { path: '/' },
  },
  axiosOptions: {},
};
export const strapiClient = new Strapi({ ...defaults })

export const userAuth = new UserAuth(strapiClient)
export const providerAuth = new ProviderAuth(strapiClient, userAuth)
export const userBase = new UserBase(strapiClient)

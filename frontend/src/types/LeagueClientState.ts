// frontend/src/types/leagueClientTypes.ts
export enum LeagueClientState {
  CHECKING = 'league:client:checking',
  CLOSED = 'league:client:closed',
  OPEN = 'league:client:open',
  LOGIN_READY = 'league:client:loginready',
  LOGGED_IN = 'league:client:loggedin',
  CAPTCHA_SOLVING = 'league:client:captchasolving',
  AUTHENTICATION_PENDING = 'league:client:authpending',
  AUTHENTICATION_SUCCESS = 'league:client:authsuccess',
  AUTHENTICATION_FAILED = 'league:client:authfailed',
}

export type LeagueAuthenticationState = '' | 'WAITING_CAPTCHA' | 'WAITING_LOGIN' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED';

export type LeagueClientInfo = {
  clientState: LeagueClientState;
  authState: LeagueAuthenticationState;
  errorMessage?: string;
};

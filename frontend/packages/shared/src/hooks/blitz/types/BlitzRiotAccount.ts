export type BlitzRiotAccount = {
  account: Account;
  league_lol: LeagueLol[];
  league_tft: any;
  summoner: Summoner;
};

export type Account = {
  game_name: string;
  puuid: string;
  tag_line: string;
};

export type LeagueLol = {
  league_points: number;
  losses: number;
  queue_type: string;
  rank: string;
  rated_rating: any;
  rated_tier: any;
  tier: string;
  wins: number;
};

export type Summoner = {
  profile_icon_id: number;
  revision_date: number;
  summoner_level: number;
};

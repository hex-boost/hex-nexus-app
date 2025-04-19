export type PriceData = {
  data: Price;
};

export type Price = {
  id: number;
  documentId: string;
  league: League;
  valorant: Valorant;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  timeMultipliers: number[];
};

export type League = {
  Gold: number;
  Iron: number;
  Bronze: number;
  Silver: number;
  Diamond: number;
  Radiant: number;
  Immortal: number;
  Platinum: number;
  Unranked: number;
};

export type Valorant = {
  Gold: number;
  Iron: number;
  Bronze: number;
  Master: number;
  Silver: number;
  Diamond: number;
  Platinum: number;
  Unranked: number;
  Challenger: number;
  Grandmaster: number;
};

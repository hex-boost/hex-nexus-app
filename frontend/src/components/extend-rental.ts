// Extension options and their costs
export const EXTENSION_OPTIONS = {
  '1h': {
    seconds: 3600,
    cost: 50,
  },
  '3h': {
    seconds: 10800,
    cost: 120,
  },
  '6h': {
    seconds: 21600,
    cost: 200,
  },
};

export type ExtensionOption = keyof typeof EXTENSION_OPTIONS;

export type ExtendRentalProps = {
  currentCoins: number;
  onExtend: (option: ExtensionOption, cost: number, seconds: number) => void;
};

export function canExtendRental(option: ExtensionOption, currentCoins: number): boolean {
  return currentCoins >= EXTENSION_OPTIONS[option].cost;
}

export function getExtensionCost(option: ExtensionOption): number {
  return EXTENSION_OPTIONS[option].cost;
}

export function getExtensionSeconds(option: ExtensionOption): number {
  return EXTENSION_OPTIONS[option].seconds;
}

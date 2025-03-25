import type { AccountType } from '@/types/types.ts';

export function useDateTime() {
  function getFormattedTimeRemaining(expirationDateString: string): string {
    const expiryDate = new Date(expirationDateString);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Expired';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m remaining`;
    } else {
      return `${diffSeconds}s remaining`;
    }
  }
  function calculateTimeRemaining(account: AccountType): string {
    const mostRecentAction = account.actionHistory?.reduce((latest, current) =>
      new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current,
    );
    return getFormattedTimeRemaining(mostRecentAction?.expirationDate.toString());
  }
  return {
    calculateTimeRemaining,

  };
}

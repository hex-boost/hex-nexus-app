import type { AccountType, Rental } from '@/types/types.ts';

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
      return `${diffMinutes}m left`;
    } else {
      return `${diffSeconds}s left`;
    }
  }

  function calculateTimeRemaining(rental: Rental): string {
    const mostRecentAction = rental.currentExpirationDate;
    return getFormattedTimeRemaining(mostRecentAction);
  }

  function getSecondsRemaining(account: AccountType): number {
    const mostRecentAction = account.actionHistory?.reduce((latest, current) =>
      new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current,
    );

    if (!mostRecentAction?.expirationDate) {
      return 0;
    }

    const expiryDate = new Date(mostRecentAction.expirationDate);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    return Math.max(0, Math.floor(diffMs / 1000));
  }

  function addTimeToExpiry(expiryTime: string, secondsToAdd: number): string {
    const expiryDate = new Date(expiryTime);
    const newExpiryDate = new Date(expiryDate.getTime() + secondsToAdd * 1000);
    return newExpiryDate.toISOString();
  }

  return {
    calculateTimeRemaining,
    getFormattedTimeRemaining,
    getSecondsRemaining,
    addTimeToExpiry,
  };
}

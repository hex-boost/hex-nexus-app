import type { AccountType } from '@/types/types.ts';

export function useRiotAccount({ account }: { account?: AccountType }) {
  const currentRanking = account?.rankings?.find(ranking => ranking.type === 'current');

  function getLeaverBusterInfo() {
    if (!account?.leaverBuster?.leaverBusterEntryDto) {
      return null;
    }

    const leaverData = account?.leaverBuster.leaverBusterEntryDto;
    const penaltyData = leaverData.leaverPenalty;

    const hasActivePenalties
            = penaltyData?.hasActivePenalty === true
              || leaverData.punishedGamesRemaining > 0
              || (penaltyData?.rankRestricted === true && penaltyData?.rankRestrictedGamesRemaining > 0);

    if (hasActivePenalties) {
      const waitTimeMinutes = penaltyData?.delayTime ? Math.floor(penaltyData.delayTime / 60000) : 0;

      let message = '';

      // Low Priority Queue (most important info for boosters)
      if (leaverData.punishedGamesRemaining > 0) {
        message += `${waitTimeMinutes}min queue × ${leaverData.punishedGamesRemaining} games`;
      }

      // Ranked restrictions (also important)
      if (penaltyData?.rankRestricted && penaltyData?.rankRestrictedGamesRemaining > 0) {
        if (message) {
          message += ' • ';
        }
        message += `Ranked restricted: ${penaltyData.rankRestrictedGamesRemaining} games`;
      }

      return {
        hasRestriction: true,
        severity: leaverData.leaverLevel,
        message,
      };
    }

    return null; // No active penalties
  }
  return { currentRanking, getLeaverBusterInfo };
}

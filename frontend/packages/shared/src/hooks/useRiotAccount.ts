import type { AccountType } from '@/types/types.ts';
import { AlertCircle, AlertOctagon, AlertTriangle, Shield } from 'lucide-react';

export function useRiotAccount({ account }: { account?: AccountType }) {
  const currentRanking = account?.rankings?.find(ranking => ranking.type === 'current');

  const getStatusConfig = (leaverInfo?: { hasRestriction: boolean; message: string; severity: number }) => {
    if (!leaverInfo || !leaverInfo.hasRestriction) {
      return {
        Icon: Shield,
        color: 'bg-emerald-100 border border-emerald-900 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        label: 'No restrictions',
        description: 'This account has no active restrictions',
      };
    }

    if (leaverInfo.severity >= 3) {
      return {
        Icon: AlertOctagon,
        color: 'bg-red-100 dark:bg-red-900/30 border border-red-900 text-red-600 dark:text-red-400',
        label: 'High',
        description: leaverInfo.message,
      };
    }

    if (leaverInfo.severity >= 2) {
      return {
        Icon: AlertTriangle,
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-900 dark:text-amber-400',
        label: 'Medium',
        description: leaverInfo.message,
      };
    }

    if (leaverInfo.severity === 1) {
      return {
        Icon: AlertCircle,
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-900 dark:text-blue-400',
        label: 'Low',
        description: leaverInfo.message,
      };
    }

    return {
      Icon: Shield,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-900 dark:text-emerald-400',
      label: 'None',
      description: leaverInfo.message,
    };
  };
  function getSeverityObject(leaverInfo: { severity: number }) {
    return {
      icon: leaverInfo.severity >= 3
        ? AlertOctagon
        : leaverInfo.severity >= 2
          ? AlertTriangle
          : leaverInfo.severity === 1
            ? AlertCircle
            : Shield,
      badge: leaverInfo.severity >= 3
        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        : leaverInfo.severity >= 2
          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          : leaverInfo.severity === 1
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      label: leaverInfo.severity >= 3
        ? 'High'
        : leaverInfo.severity >= 2
          ? 'Medium'
          : leaverInfo.severity === 1
            ? 'Low'
            : 'None',
    };
  }
  function getLeaverBusterInfo() {
    if (account?.partyRestriction) {
      if (account?.partyRestriction > 0) {
        return {
          hasRestriction: true,
          severity: 3,
          message: `Account has to play ${account?.partyRestriction} normal games until being able to play ranked`,
        };
      }
    }
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
  return { currentRanking, getLeaverBusterInfo, getSeverityObject, getStatusConfig };
}

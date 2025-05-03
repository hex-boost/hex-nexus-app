import type { AccountType, RankingType } from '@/types/types.ts';
import logoBoostRoyal from '@/assets/logo-boost-royal.svg';
import { AccountGameIcon } from '@/components/GameComponents.tsx';
import { GameRankDisplay } from '@/components/GameRankDisplay.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { AccountActionsMenu } from '@/features/accounts-table/components/account-actions-menu.tsx';
import { PriceDisplay } from '@/features/accounts-table/components/price-display.tsx';
import { useRiotAccount } from '@/hooks/useRiotAccount.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils.ts';
import { Shield } from 'lucide-react';
import React from 'react';

<img src={logoBoostRoyal} alt="BoostRoyal" className="w-5 h-5" />;

type AccountRowProps = {
  account: AccountType;
  isPriceLoading: boolean;
  price: any;
  onViewDetails: (id: string) => void;
  getEloIcon: (elo: string) => string;
  getRegionIcon: (region: string) => React.ReactNode;
  getCompanyIcon: (company: string) => string;
  getRankColor: (elo: string) => string;
};

export function AccountRow({
  account,
  isPriceLoading,
  price,
  onViewDetails,
  getRegionIcon,
}: AccountRowProps) {
  const currentSoloqueueRank = account.rankings.find(
    ranking => ranking.queueType === 'soloqueue' && ranking.type === 'current' && ranking.elo !== '',
  ) || account.rankings.find(
    ranking => ranking.queueType === 'soloqueue' && ranking.type === 'provisory',
  ) || {
    elo: 'unranked',
    division: '',
    points: 0,
    wins: 0,
    losses: 0,
  } as RankingType;
  const previousSoloqueueRank = account.rankings.find(ranking => ranking.queueType === 'soloqueue' && ranking.type === 'previous')!;
  const { getFormattedServer, getWinrateColorClass, getCompanyIcon } = useMapping();
  const { getLeaverBusterInfo, getSeverityObject } = useRiotAccount({ account });
  return (
    <tr
      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer"
      onClick={() => onViewDetails(account.documentId)}
    >
      <td className="p-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {account.documentId.slice(0, 6).toUpperCase()}
      </td>
      <td className="p-3">
        <AccountGameIcon game="lol" />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6">{getRegionIcon(account.server)}</div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {getFormattedServer(account.server)}
          </span>
        </div>
      </td>

      <td className="p-3">

        <img src={getCompanyIcon(account.type)} alt="BoostRoyal" className="w-6 h-6" />

      </td>
      <td className="p-3">
        {(() => {
          const leaverInfo = getLeaverBusterInfo();

          if (!leaverInfo) {
            return (
              <div className="flex items-start">
                <Badge
                  variant="outline"
                  className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 min-w-[85px]  px-4 py-1.5"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  <span>None</span>
                </Badge>
              </div>
            );
          }
          const severityConfig = getSeverityObject(leaverInfo);
          const Icon = severityConfig.icon;

          return (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`cursor-help ${severityConfig.badge} min-w-[85px] py-1.5 px-4`}
                  >
                    <Icon className="h-4 w-4  mr-1" />
                    <span>{severityConfig.label}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="w-72 p-3 text-xs bg-white dark:bg-zinc-800 shadow-lg rounded-md border border-zinc-200 dark:border-zinc-700"
                >
                  {(() => {
                    if (!leaverInfo) {
                      return null;
                    }

                    const leaverData = account.leaverBuster?.leaverBusterEntryDto;
                    if (!leaverData) {
                      return null;
                    }

                    const lastPunishmentDate = new Date(leaverData.lastPunishmentIncurredTimeMillis).toLocaleDateString();

                    return (
                      <div className="space-y-2">
                        <div
                          className="flex justify-between items-center pb-1 mb-1 border-b border-zinc-200 dark:border-zinc-700 backdrop-blur-2xl"
                        >
                          <span className="font-medium">LeaverBuster Status</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${severityConfig.badge}`}
                          >
                            {severityConfig.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                          <span className="text-zinc-500 dark:text-zinc-400">Level:</span>
                          <span className="font-medium">{leaverData.leaverLevel}</span>

                          <span
                            className="text-zinc-500 dark:text-zinc-400"
                          >
                            Queue Time:
                          </span>
                          <span className="font-medium">
                            {leaverData.leaverPenalty?.delayTime ? `${Math.floor(leaverData.leaverPenalty.delayTime / 60000)}min` : 'None'}
                          </span>

                          <span
                            className="text-zinc-500 dark:text-zinc-400"
                          >
                            Games Remaining:
                          </span>
                          <span
                            className="font-medium"
                          >
                            {leaverData.punishedGamesRemaining || 'None'}
                          </span>

                          <span className="text-zinc-500 dark:text-zinc-400">Ranked Restricted:</span>
                          <span className="font-medium">
                            {leaverData.leaverPenalty?.rankRestricted
                              ? `Yes`
                              : 'No'}
                          </span>

                          <span
                            className="text-zinc-500 dark:text-zinc-400"
                          >
                            Last Penalty:
                          </span>
                          <span className="font-medium">
                            {lastPunishmentDate}

                          </span>

                        </div>
                      </div>
                    );
                  })()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })()}
      </td>
      <td className="p-3">
        <GameRankDisplay

          ranking={currentSoloqueueRank}
        />
      </td>
      <td className="p-3">
        <GameRankDisplay
          showLP={false}
          ranking={previousSoloqueueRank}
        />
      </td>

      <td className="p-3">
        {(() => {
          const totalGames = (currentSoloqueueRank?.wins || 0) + (currentSoloqueueRank?.losses || 0);
          const winRate = totalGames > 0 ? Math.round(((currentSoloqueueRank?.wins || 0) / totalGames) * 100) : 0;
          const winRateColorClass = getWinrateColorClass(winRate);
          return (
            <span className="text-sm text-muted-foreground">
              {currentSoloqueueRank?.wins || 0}
              W/
              {currentSoloqueueRank?.losses || 0}
              L
              {' '}
              <span className={`font-medium text-xs ${winRateColorClass}`}>
                (
                {winRate}
                %)
              </span>
            </span>
          );
        })()}
      </td>
      <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
        {account.LCUchampions.length}
      </td>
      <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
        {account.LCUskins.length}
      </td>
      <td className="p-3 flex gap-2 items-center text-sm text-zinc-600 dark:text-zinc-400">
        <div className="w-6 h-6">
          <img
            alt="blue essence"
            src="https://raw.communitydragon.org/15.2/plugins/rcp-fe-lol-collections/global/default/images/skins-viewer/currencies/icon-blue-essence.png"
          />
        </div>

        {account.blueEssence?.toLocaleString() || '0'}
      </td>
      <td className="p-3">
        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            !account.user
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : account.user
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
          )}
        >
          {account.user ? 'Rented' : 'Available'}
        </span>
      </td>
      <td className="p-3">
        <PriceDisplay isPriceLoading={isPriceLoading} price={price} ranking={currentSoloqueueRank} />
      </td>
      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
        <AccountActionsMenu accountId={account.documentId} onViewDetails={onViewDetails} />
      </td>
    </tr>
  );
}

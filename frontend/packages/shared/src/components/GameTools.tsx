'use client';

import SkinsSelector from '@/components/SkinSelector.tsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  Info,
  Maximize2,
  Minimize2,
  Palette,
  RefreshCw,
  Search,
  Shield,
  Swords,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

// Types
type Player = {
  id: string;
  name: string;
  champion: {
    id: string;
    name: string;
    image: string;
  };
  rank: {
    tier: string;
    division: string;
    lp: number;
  };
  winRate: number;
  games: number;
  kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  roles: string[];
  mainRole: string;
  summonerSpells: {
    spell1: {
      id: string;
      name: string;
      image: string;
    };
    spell2: {
      id: string;
      name: string;
      image: string;
    };
  };
  recentPerformance: 'good' | 'average' | 'poor';
  premadeWith?: string[];
};

type GameSession = {
  gameId: string;
  gameMode: string;
  mapName: string;
  queueType: string;
  team1: Player[];
  team2: Player[];
  estimatedSkill: string;
};

// Sample data for demonstration
const CURRENT_GAME: GameSession = {
  gameId: 'EUW1_6354218',
  gameMode: 'Ranked Solo/Duo',
  mapName: 'Summoner\'s Rift',
  queueType: 'RANKED_SOLO_5x5',
  estimatedSkill: 'Platinum II',
  team1: [
    {
      id: 'player1',
      name: 'ShadowBlade99',
      champion: {
        id: 'yasuo',
        name: 'Yasuo',
        image: '/placeholder.svg?height=60&width=60&text=Yasuo',
      },
      rank: {
        tier: 'Platinum',
        division: 'II',
        lp: 45,
      },
      winRate: 53,
      games: 342,
      kda: {
        kills: 7.2,
        deaths: 5.8,
        assists: 4.3,
      },
      roles: ['Top', 'Mid'],
      mainRole: 'Mid',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'ignite',
          name: 'Ignite',
          image: '/placeholder.svg?height=30&width=30&text=I',
        },
      },
      recentPerformance: 'good',
    },
    {
      id: 'player2',
      name: 'JungleKing420',
      champion: {
        id: 'leesin',
        name: 'Lee Sin',
        image: '/placeholder.svg?height=60&width=60&text=Lee',
      },
      rank: {
        tier: 'Platinum',
        division: 'III',
        lp: 78,
      },
      winRate: 49,
      games: 215,
      kda: {
        kills: 5.1,
        deaths: 4.2,
        assists: 8.7,
      },
      roles: ['Jungle'],
      mainRole: 'Jungle',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'smite',
          name: 'Smite',
          image: '/placeholder.svg?height=30&width=30&text=S',
        },
      },
      recentPerformance: 'average',
      premadeWith: ['player3'],
    },
    {
      id: 'player3',
      name: 'MidOrAFK',
      champion: {
        id: 'ahri',
        name: 'Ahri',
        image: '/placeholder.svg?height=60&width=60&text=Ahri',
      },
      rank: {
        tier: 'Platinum',
        division: 'I',
        lp: 23,
      },
      winRate: 55,
      games: 189,
      kda: {
        kills: 8.3,
        deaths: 3.9,
        assists: 6.2,
      },
      roles: ['Mid'],
      mainRole: 'Mid',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'ignite',
          name: 'Ignite',
          image: '/placeholder.svg?height=30&width=30&text=I',
        },
      },
      recentPerformance: 'good',
      premadeWith: ['player2'],
    },
    {
      id: 'player4',
      name: 'ADCmain2023',
      champion: {
        id: 'jinx',
        name: 'Jinx',
        image: '/placeholder.svg?height=60&width=60&text=Jinx',
      },
      rank: {
        tier: 'Platinum',
        division: 'II',
        lp: 67,
      },
      winRate: 51,
      games: 278,
      kda: {
        kills: 9.1,
        deaths: 4.7,
        assists: 5.8,
      },
      roles: ['ADC'],
      mainRole: 'ADC',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'heal',
          name: 'Heal',
          image: '/placeholder.svg?height=30&width=30&text=H',
        },
      },
      recentPerformance: 'average',
    },
    {
      id: 'player5',
      name: 'SupportGap',
      champion: {
        id: 'thresh',
        name: 'Thresh',
        image: '/placeholder.svg?height=60&width=60&text=Thresh',
      },
      rank: {
        tier: 'Platinum',
        division: 'IV',
        lp: 12,
      },
      winRate: 48,
      games: 156,
      kda: {
        kills: 2.1,
        deaths: 5.3,
        assists: 14.7,
      },
      roles: ['Support'],
      mainRole: 'Support',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'exhaust',
          name: 'Exhaust',
          image: '/placeholder.svg?height=30&width=30&text=E',
        },
      },
      recentPerformance: 'poor',
    },
  ],
  team2: [
    {
      id: 'player6',
      name: 'TopDiff123',
      champion: {
        id: 'darius',
        name: 'Darius',
        image: '/placeholder.svg?height=60&width=60&text=Darius',
      },
      rank: {
        tier: 'Platinum',
        division: 'II',
        lp: 32,
      },
      winRate: 54,
      games: 198,
      kda: {
        kills: 6.8,
        deaths: 4.9,
        assists: 5.1,
      },
      roles: ['Top'],
      mainRole: 'Top',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'teleport',
          name: 'Teleport',
          image: '/placeholder.svg?height=30&width=30&text=TP',
        },
      },
      recentPerformance: 'good',
    },
    {
      id: 'player7',
      name: 'GankMaster',
      champion: {
        id: 'khazix',
        name: 'Kha\'Zix',
        image: '/placeholder.svg?height=60&width=60&text=Kha',
      },
      rank: {
        tier: 'Platinum',
        division: 'I',
        lp: 56,
      },
      winRate: 57,
      games: 231,
      kda: {
        kills: 7.9,
        deaths: 4.1,
        assists: 6.3,
      },
      roles: ['Jungle'],
      mainRole: 'Jungle',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'smite',
          name: 'Smite',
          image: '/placeholder.svg?height=30&width=30&text=S',
        },
      },
      recentPerformance: 'good',
      premadeWith: ['player8', 'player9'],
    },
    {
      id: 'player8',
      name: 'MidGapEZ',
      champion: {
        id: 'zed',
        name: 'Zed',
        image: '/placeholder.svg?height=60&width=60&text=Zed',
      },
      rank: {
        tier: 'Platinum',
        division: 'II',
        lp: 89,
      },
      winRate: 52,
      games: 312,
      kda: {
        kills: 8.7,
        deaths: 5.2,
        assists: 4.1,
      },
      roles: ['Mid'],
      mainRole: 'Mid',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'ignite',
          name: 'Ignite',
          image: '/placeholder.svg?height=30&width=30&text=I',
        },
      },
      recentPerformance: 'average',
      premadeWith: ['player7', 'player9'],
    },
    {
      id: 'player9',
      name: 'CarryOrInt',
      champion: {
        id: 'vayne',
        name: 'Vayne',
        image: '/placeholder.svg?height=60&width=60&text=Vayne',
      },
      rank: {
        tier: 'Platinum',
        division: 'III',
        lp: 45,
      },
      winRate: 50,
      games: 267,
      kda: {
        kills: 8.3,
        deaths: 6.1,
        assists: 5.4,
      },
      roles: ['ADC'],
      mainRole: 'ADC',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'heal',
          name: 'Heal',
          image: '/placeholder.svg?height=30&width=30&text=H',
        },
      },
      recentPerformance: 'average',
      premadeWith: ['player7', 'player8'],
    },
    {
      id: 'player10',
      name: 'WardBot',
      champion: {
        id: 'lulu',
        name: 'Lulu',
        image: '/placeholder.svg?height=60&width=60&text=Lulu',
      },
      rank: {
        tier: 'Platinum',
        division: 'II',
        lp: 23,
      },
      winRate: 53,
      games: 189,
      kda: {
        kills: 1.8,
        deaths: 4.2,
        assists: 16.9,
      },
      roles: ['Support'],
      mainRole: 'Support',
      summonerSpells: {
        spell1: {
          id: 'flash',
          name: 'Flash',
          image: '/placeholder.svg?height=30&width=30&text=F',
        },
        spell2: {
          id: 'exhaust',
          name: 'Exhaust',
          image: '/placeholder.svg?height=30&width=30&text=E',
        },
      },
      recentPerformance: 'good',
    },
  ],
};

// Helper function to get rank color
const getRankColor = (tier: string) => {
  switch (tier.toLowerCase()) {
    case 'iron':
      return 'text-zinc-500 dark:text-zinc-400';
    case 'bronze':
      return 'text-amber-700 dark:text-amber-600';
    case 'silver':
      return 'text-zinc-400 dark:text-zinc-300';
    case 'gold':
      return 'text-amber-500 dark:text-amber-400';
    case 'platinum':
      return 'text-cyan-500 dark:text-cyan-400';
    case 'diamond':
      return 'text-blue-500 dark:text-blue-400';
    case 'master':
      return 'text-purple-500 dark:text-purple-400';
    case 'grandmaster':
      return 'text-red-500 dark:text-red-400';
    case 'challenger':
      return 'text-yellow-500 dark:text-yellow-400';
    default:
      return 'text-zinc-600 dark:text-zinc-400';
  }
};

// Helper function to get performance color
const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case 'good':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'average':
      return 'text-amber-500 dark:text-amber-400';
    case 'poor':
      return 'text-red-500 dark:text-red-400';
    default:
      return 'text-zinc-600 dark:text-zinc-400';
  }
};

// Helper function to get role icon
const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case 'top':
      return <ArrowUpRight className="h-4 w-4" />;
    case 'jungle':
      return <Swords className="h-4 w-4" />;
    case 'mid':
      return <Target className="h-4 w-4" />;
    case 'adc':
      return <Zap className="h-4 w-4" />;
    case 'support':
      return <Shield className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

// Helper function to get role color
const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'top':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'jungle':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    case 'mid':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'adc':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    case 'support':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    default:
      return 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400';
  }
};

export default function GameTools() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'lobby' | 'skins'>('lobby');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentGame, _] = useState<GameSession>(CURRENT_GAME);

  // Filter players based on search
  const filteredTeam1 = currentGame.team1.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredTeam2 = currentGame.team2.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Refresh game data
  const handleRefresh = () => {
    // In a real app, this would fetch new data
    // For demo, we'll just simulate a refresh
    console.log('Refreshing game data...');
    // You could add a loading state here
  };

  return (
    <TooltipProvider>
      <Card className={cn('w-full transition-all duration-300', isMinimized && 'h-16 overflow-hidden')}>
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 space-y-0">
          <CardTitle className="text-xl flex items-center gap-2">
            {activeTab === 'lobby'
              ? (
                  <Users className="h-5 w-5 text-blue-500" />
                )
              : (
                  <Palette className="h-5 w-5 text-purple-500" />
                )}
            {activeTab === 'lobby' ? 'Lobby Revealer' : 'Skin Selector'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs
              value={activeTab}
              onValueChange={value => setActiveTab(value as 'lobby' | 'skins')}
              className="mr-2"
            >
              <TabsList>
                <TabsTrigger value="lobby" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Lobby</span>
                </TabsTrigger>
                <TabsTrigger value="skins" className="flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Skins</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8">
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="px-6 pb-6">
            <TabsContent value="lobby" className="mt-0">
              <div className="space-y-6">
                {/* Game Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                      {currentGame.gameMode}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <span>{currentGame.mapName}</span>
                      <span>•</span>
                      <span>
                        Game ID:
                        {currentGame.gameId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                        Estimated Skill:
                        {' '}
                        {currentGame.estimatedSkill}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-1">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => window.open('https://op.gg', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in OP.GG
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  <Input
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Teams */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Team 1 */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        Your Team
                      </Badge>
                    </h3>
                    <div className="space-y-3">
                      {filteredTeam1.length > 0
                        ? (
                            filteredTeam1.map(player => <PlayerCard key={player.id} player={player} />)
                          )
                        : (
                            <div className="text-center py-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
                              <p className="text-zinc-600 dark:text-zinc-400">No players found</p>
                            </div>
                          )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                      <Badge className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Enemy Team</Badge>
                    </h3>
                    <div className="space-y-3">
                      {filteredTeam2.length > 0
                        ? (
                            filteredTeam2.map(player => <PlayerCard key={player.id} player={player} />)
                          )
                        : (
                            <div className="text-center py-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
                              <p className="text-zinc-600 dark:text-zinc-400">No players found</p>
                            </div>
                          )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skins" className="mt-0">
              <SkinsSelector />
            </TabsContent>
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
}

// Player Card Component
function PlayerCard({ player }: { player: Player }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate KDA ratio
  const kdaRatio = ((player.kda.kills + player.kda.assists) / Math.max(1, player.kda.deaths)).toFixed(2);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Basic Info Row */}
        <div
          className={cn(
            'flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
            isExpanded && 'border-b border-zinc-200 dark:border-zinc-800',
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative">
            <img
              src={player.champion.image || '/placeholder.svg'}
              alt={player.champion.name}
              className="w-12 h-12 rounded-md object-cover"
            />
            <div className="absolute -bottom-1 -right-1 flex">
              <img
                src={player.summonerSpells.spell1.image || '/placeholder.svg'}
                alt={player.summonerSpells.spell1.name}
                className="w-5 h-5 rounded-sm"
              />
              <img
                src={player.summonerSpells.spell2.image || '/placeholder.svg'}
                alt={player.summonerSpells.spell2.name}
                className="w-5 h-5 rounded-sm"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{player.name}</h4>
              {player.premadeWith && player.premadeWith.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Premade with
                      {player.premadeWith.length}
                      {' '}
                      player(s)
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className={cn('font-medium', getRankColor(player.rank.tier))}>
                {player.rank.tier}
                {' '}
                {player.rank.division}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {player.rank.lp}
                {' '}
                LP
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1.5 py-0 flex items-center gap-1', getRoleColor(player.mainRole))}
              >
                {getRoleIcon(player.mainRole)}
                {player.mainRole}
              </Badge>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {player.winRate}
                % WR (
                {player.games}
                {' '}
                games)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div
              className={cn(
                'text-sm font-medium',
                Number.parseFloat(kdaRatio) >= 3.0
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : Number.parseFloat(kdaRatio) >= 2.0
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400',
              )}
            >
              {kdaRatio}
              {' '}
              KDA
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {player.kda.kills}
              /
              {player.kda.deaths}
              /
              {player.kda.assists}
            </div>
            <div className="mt-1">
              {isExpanded
                ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" />
                  )
                : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-medium text-zinc-900 dark:text-zinc-50 mb-1">Champion Proficiency</h5>
                <div className="flex items-center gap-1">
                  <Flame
                    className={cn(
                      'h-4 w-4',
                      player.recentPerformance === 'good'
                        ? 'text-emerald-500'
                        : player.recentPerformance === 'average'
                          ? 'text-amber-500'
                          : 'text-red-500',
                    )}
                  />
                  <span className={cn('text-xs font-medium', getPerformanceColor(player.recentPerformance))}>
                    {player.recentPerformance === 'good'
                      ? 'Strong performer'
                      : player.recentPerformance === 'average'
                        ? 'Average performer'
                        : 'Struggling recently'}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-medium text-zinc-900 dark:text-zinc-50 mb-1">Roles</h5>
                <div className="flex flex-wrap gap-1">
                  {player.roles.map(role => (
                    <Badge
                      key={role}
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 flex items-center gap-1', getRoleColor(role))}
                    >
                      {getRoleIcon(role)}
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://op.gg/summoners/na/${player.name}`, '_blank');
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                View Profile
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  // In a real app, this would copy text to clipboard
                  navigator.clipboard.writeText(player.name);
                }}
              >
                Copy Summoner Name
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

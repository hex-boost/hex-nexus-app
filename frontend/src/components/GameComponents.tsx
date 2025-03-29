import { LolIcon, ValorantIcon } from '@/lib/icons.tsx';

type GameIconProps = {
  game: string;
  className?: string;
  size?: number;
};

export function AccountGameIcon({ game, className, size = 24 }: GameIconProps) {
  // Using components approach
  switch (game.toLowerCase()) {
    case 'lol':
      return <LolIcon size={size} className={className} />;
    case 'valorant':
      return <ValorantIcon size={size} className={className} />;
    default:
  }
}

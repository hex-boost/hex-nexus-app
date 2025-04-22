import { DiscordSvg } from '@/assets/icons.tsx';
import logoHexBoost from '@/assets/logo-hex-boost.svg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-card-darker">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoHexBoost}
              alt="logo hex boost"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-medium text-white">Nexus</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm text-gray-300 hover:text-white transition-colors !text-white">
            Home
          </Link>

          <div className="relative">
            <Link to="/" className="text-sm text-gray-300 opacity-50 pointer-events-none">
              Pricing
            </Link>
            <Badge className="absolute text-[10px] font-normal  -top-4 -right-6">
              Soon
            </Badge>
          </div>
          <div className="relative">
            <Link to="/" className="text-sm text-gray-300 opacity-50 pointer-events-none">
              Community
            </Link>
            <Badge className="absolute text-[10px] font-normal  -top-4 -right-6">
              Soon
            </Badge>
          </div>
        </nav>
        <Link to="https://discord.gg/Vew8tvRWVZ" target="_blank">
          <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10">
            <DiscordSvg size="16" />
            <span>Join Community</span>
            <ExternalLink className="size-4 ml-1" />
          </Button>
        </Link>
      </div>
    </header>
  );
}

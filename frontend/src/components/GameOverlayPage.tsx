import { GameOverlay } from '@/components/GameOverlay.tsx';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

export function GameOverlayPage() {
  const [showOverlay, setShowOverlay] = useState(true);

  // Sample data
  const accountData = {
    accountId: 'D7X92C',
    elo: 'Diamond',
    rank: 'II',
    userCoins: 350, // Add this new property

    lp: 75,
    rentalTimeRemaining: 14400, // 4 hours in seconds
    userName: 'HiddenSniper92',
  };

  useEffect(() => {
    Events.On('overlay:toggle', () => {
      setShowOverlay(!showOverlay);
    });
  }, []);
  return (
    <>
      <div className="min-h-screen bg-[url('/placeholder.svg?height=1080&width=1920&text=League+of+Legends+Game')] bg-cover bg-center">
        {showOverlay && <GameOverlay {...accountData} />}
      </div>
    </>
  );
}

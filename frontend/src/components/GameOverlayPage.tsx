import { GameOverlay } from '@/components/GameOverlay.tsx';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

export function GameOverlayPage() {
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    Events.On('overlay:toggle', () => {
      setShowOverlay(!showOverlay);
    });
  }, []);
  return (
    <>
      {showOverlay && <GameOverlay setShowOverlay={setShowOverlay} />}
    </>
  );
}

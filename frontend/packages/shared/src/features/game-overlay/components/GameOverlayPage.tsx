import { GameOverlay } from '@/features/game-overlay/components/GameOverlay.tsx';
import { Overlay } from '@overlay';

export function GameOverlayPage() {
  function setShowOverlay() {
    Overlay.Hide();
  }
  return (

    <GameOverlay setShowOverlay={setShowOverlay} />
  );
}

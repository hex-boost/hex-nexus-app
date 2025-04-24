import { GameOverlay } from '@/components/GameOverlay.tsx';
import { GameOverlayManager } from '@overlay';

export function GameOverlayPage() {
  function setShowOverlay() {
    GameOverlayManager.Hide();
  }
  return (
    <GameOverlay setShowOverlay={setShowOverlay} />
  );
}

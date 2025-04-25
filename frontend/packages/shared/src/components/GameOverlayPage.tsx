import { GameOverlay } from '@/components/GameOverlay.tsx';
import { Overlay } from '@overlay';

export function GameOverlayPage() {
  function setShowOverlay() {
    Overlay.Hide();
  }
  return (
    <GameOverlay setShowOverlay={setShowOverlay} />
  );
}

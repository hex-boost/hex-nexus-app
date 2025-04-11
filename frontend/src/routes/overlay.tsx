// frontend/src/routes/overlay.tsx
import { GameOverlay } from '@/components/GameOverlay.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/overlay')({
  component: OverlayPage,

});

function OverlayPage() {
  return (
    <div style={{
      width: '200px',
      height: '200px',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'transparent',
      pointerEvents: 'all',
      overflow: 'hidden',
    }}
    >
      <GameOverlay />
    </div>
  );
}

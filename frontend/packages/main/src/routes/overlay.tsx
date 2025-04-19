// frontend/src/routes/overlay.tsx
import { GameOverlayPage } from '@/components/GameOverlayPage.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/overlay')({
  component: GameOverlayPage,

});

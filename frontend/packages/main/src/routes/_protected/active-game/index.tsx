import {LobbyRevealerPage} from '@/features/lobby-revealer/LobbyRevealerPage.tsx';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/active-game/')({
  component: LobbyRevealerPage,
});

import { LoginFormPage } from '@/features/auth/LoginFormPage.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginFormPage,
});

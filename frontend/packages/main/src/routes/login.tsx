import { LoginFormPage } from '@/components/LoginFormPage.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginFormPage,
});

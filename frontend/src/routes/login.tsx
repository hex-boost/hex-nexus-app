import { LoginForm } from '@/components/login-form';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LoginForm,
});

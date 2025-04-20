import { LoginForm } from '@/components/login-form.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginForm,
});

import { Header } from '@/components/site/header.tsx';
import { HeroSection } from '@/components/site/hero-section.tsx';
// frontend/packages/updater/src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
    </main>
  );
}

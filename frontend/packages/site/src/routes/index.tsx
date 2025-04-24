import { Header } from '@/components/site/header.tsx';
import { HeroSection } from '@/components/site/hero-section.tsx';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  useEffect(() => {

  }, []);
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
    </main>
  );
}

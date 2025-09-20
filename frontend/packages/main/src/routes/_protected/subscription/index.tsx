import PricingCards from '@/components/checkout/pricing-cards.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/subscription/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full">
      <div className="flex text-center justify-center items-center gap-4 flex-col">

        <PricingCards />

      </div>
    </div>
  );
}

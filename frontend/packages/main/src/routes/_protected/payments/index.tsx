import PaymentsPage from '@/features/payment/PaymentsPage.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/payments/')({
  component: PaymentsLayout,
});

export function PaymentsLayout() {
  return (
    <div className="">
      <h1 className="text-3xl font-semibold pb-6 ">Payments History</h1>
      <PaymentsPage />
    </div>
  );
}

import PaymentDetails from '@/features/payment/PaymentById.tsx';
import { createFileRoute, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/payments/$id')({
  beforeLoad: ({ params }) => {
    if (!('id' in params)) {
      throw new Error('Invalid account ID');
    }
  },

  component: PaymentByID,
});
function PaymentByID() {
  const { id } = useParams({ from: '/_protected/payments/$id' });
  if (!id) {
    return <div>Invalid payment ID</div>;
  }

  return <PaymentDetails paymentId={id} />;
}

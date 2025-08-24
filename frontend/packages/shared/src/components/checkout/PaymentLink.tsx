import { Button } from '@/components/ui/button.tsx';
import { ExternalLink } from 'lucide-react';

type PaymentLinkProps = {
  /**
   * The unique identifier for the payment, used to construct the URL.
   */
  paymentId: string;
};

/**
 * A component that provides a direct link to a payment page.
 * It's used for payment gateways that don't require manual instructions.
 */
export function PaymentLink({ paymentId }: PaymentLinkProps) {
  const handleProceedToPayment = () => {
    // Redirects the user to the specific payment page for their transaction.
    window.location.href = `/payments/${paymentId}`;
  };

  return (
    <div className="bg-black/20 p-6 rounded-lg text-center border border-[#1F1F23]">
      <p className="text-gray-300 mb-4">
        Your order is ready. Click the button below to proceed securely with your payment.
      </p>
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg font-semibold"
        onClick={handleProceedToPayment}
      >
        Proceed to Payment
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
      <p className="text-xs text-muted-foreground mt-4">
        You will be redirected to our secure payment processor.
      </p>
    </div>
  );
}

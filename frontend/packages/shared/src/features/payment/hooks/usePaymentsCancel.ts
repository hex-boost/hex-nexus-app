import { strapiClient } from '@/lib/strapi.ts';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCancelPaymentMutation() {
  return useMutation({
    mutationFn: async (paymentId: string) => {
      return await strapiClient.request('delete', `payments/${paymentId}`);
    },
    onSuccess: () => {
      toast.success('Payment cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel payment');
    },
  });
}

import type { Payment } from '@/types/types';

export type PaymentsData = {
  openPayments: Payment[];
  canceledPayments: Payment[];
  paidPayments: Payment[];
};

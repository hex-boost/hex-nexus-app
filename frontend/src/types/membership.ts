import type { ReactNode } from 'react';

export type Benefit = {
  title: string;
  description: string;
};

export type PricingPlan = {
  tier: string;
  description?: string;
  price: number;
  period?: string;
  benefits: Benefit[];
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  buttonIcon?: ReactNode;
  highlighted?: boolean;
};

export type PricingProps = {
  isPending: boolean;
  plans: PricingPlan[];
  onPlanSelect: (planTier: string) => void;
};
export type CheckoutSession = {
  id: string;
  object: 'checkout.session';
  after_expiration: null | {
    recovery: {
      allow_promotion_codes: boolean;
      expires_at: number | null;
      url: string | null;
    };
  };
  allow_promotion_codes: boolean | null;
  amount_subtotal: number | null;
  amount_total: number | null;
  automatic_tax: {
    enabled: boolean;
    status: string | null;
  };
  billing_address_collection: 'auto' | 'required' | null;
  cancel_url: string | null;
  client_reference_id: string | null;
  client_secret: string | null;
  created: number;
  currency: string | null;
  customer: string | null;
  customer_creation: 'always' | 'if_required' | null;
  customer_details: {
    email: string | null;
    phone: string | null;
    tax_exempt: 'exempt' | 'none' | 'reverse' | null;
    tax_ids: Array<any> | null;
  } | null;
  customer_email: string | null;
  expires_at: number;
  livemode: boolean;
  locale: string | null;
  metadata: Record<string, string> | null;
  mode: 'payment' | 'setup' | 'subscription';
  payment_intent: string | null;
  payment_method_collection: 'always' | 'if_required' | null;
  payment_method_types: Array<string>;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired' | null;
  submit_type: 'auto' | 'book' | 'donate' | 'pay' | null;
  subscription: string | null;
  success_url: string | null;
  total_details: {
    amount_discount: number;
    amount_shipping: number;
    amount_tax: number;
  } | null;
  ui_mode: 'hosted' | 'embedded' | null;
  url: string | null;
};

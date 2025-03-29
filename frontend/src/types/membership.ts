import type { ReactNode } from 'react';

export type Benefit = {
  title: string;
  description: string;
};

export type PricingPlan = {
  tier: string;
  description: string;
  price: number;
  period?: string;
  benefits: Benefit[];
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  buttonIcon?: ReactNode;
  highlighted?: boolean;
};

export type PricingProps = {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
};

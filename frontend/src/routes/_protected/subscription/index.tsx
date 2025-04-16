import type { PricingPlan } from '@/types/membership.ts';
import PricingCards from '@/components/ui/pricing-cards.tsx';
import { useUserStore } from '@/stores/useUserStore.ts';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/subscription/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useUserStore();
  const userPremiumTier = user?.premium?.tier?.toLowerCase();
  const pricingPlans: PricingPlan[] = [
    {
      tier: 'Free',
      tier_enum: 'free',
      isCurrentPlan: userPremiumTier === 'free',
      description: 'Thanks for verifying your account and being part of Nexus.',
      price: 0,

      color: 'emerald',
      benefits: [

        {
          title: 'Earns 300 coins/m',
        },
        {
          title: 'Accounts up to Platinum',
        },

        {
          title: 'Community Support',
        },
        {
          title: 'No credit card required',
        },

      ],

      buttonText: userPremiumTier === 'free' ? 'Current Plan' : 'Get started for free',
    },
    {
      tier: 'Basic',
      description: 'Perfect for part-time boosters',
      price: 10,
      period: '/mo',

      color: 'blue',
      benefits: [
        {
          title: 'Instantly earns 3000 coins',
          icon: 'check',
        },

        {
          title: 'Accounts up to Emerald',
          icon: 'check',

        },
        {
          title: 'Secure Payment',
          icon: 'check',

        },
        {
          title: 'Ready to use in seconds',
          icon: 'check',

        },

      ],
      tier_enum: 'basic',
      buttonText: 'Choose Basic',
      isCurrentPlan: userPremiumTier === 'basic',
    },
    {
      tier: 'Premium',
      description: 'The ideal solution for serious boosters.',
      price: 20,
      color: 'primary',
      tier_enum: 'premium',
      benefits: [
        {
          title: 'Instantly earns 10000 coins',
          icon: 'check',

        },

        {
          title: 'Accounts up to Diamond',
          icon: 'check',
        },
        {
          title: 'Exclusive support',
          icon: 'check',

        },
        {
          title: 'Discord Role',
          icon: 'check',

        },

      ],
      isCurrentPlan: userPremiumTier === 'premium',
      period: '/mo',
      buttonText: 'Choose Premium',
    },
    {
      tier: 'Pro',
      tier_enum: 'pro',
      description: 'For full-time professional boosters',
      price: 30,
      color: 'purple',
      benefits: [
        {
          title: 'Unlimited coins & accounts',
          icon: 'check',

        },

        {
          title: 'All ranks available',
          icon: 'check',
        },

        {
          title: 'Access to Skin-Changer',
          icon: 'check',
          isNew: true,

        },
        {
          title: 'Access to Lobby Revealer',
          icon: 'check',
          isNew: true,

        },

      ],
      period: '/mo',
      isCurrentPlan: userPremiumTier === 'pro',
      buttonText: 'Choose Pro',
    },
  ];
  return (
    <div className="w-full">
      <div className="flex text-center justify-center items-center gap-4 flex-col">
        {/* <div className="flex gap-2 items-center flex-col"> */}
        {/*  <h2 className="text-3xl tracking-tighter max-w-xl text-center font-semibold"> */}
        {/*    Choose Your Boosting Experience */}
        {/*  </h2> */}
        {/*  <p className="leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center"> */}
        {/*    Access premium LoL accounts for your boosting services with flexible plans */}
        {/*  </p> */}

        {/* </div> */}
        <PricingCards
          pricingPlans={pricingPlans}
        />

      </div>
    </div>
  );
}

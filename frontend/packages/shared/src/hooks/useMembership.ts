import type { PaymentMethod, PricingPlan } from '@/types/membership.ts';
import type { PremiumTiers } from '@/types/types.ts';
import { useMapping } from '@/lib/useMapping.tsx';

export function useMembership() {
  const { getCompanyIcon } = useMapping();
  const getTierColorClass = (tier: PremiumTiers) => {
    const colorMap: Record<string, Record<string, string>> = {
      'basic': {
        bg: 'bg-blue-500',
        text: 'text-blue-300',
        border: 'border-[#1a2e45]',
        hover: 'hover:bg-blue-600',
        bgLight: 'bg-blue-500/10',
        glow: 'bg-blue-500/20',
      },

      'basic+': {
        bg: 'bg-cyan-500',
        text: 'text-cyan-300',
        border: 'border-[#164e63]', // deep cyan/teal tone
        hover: 'hover:bg-cyan-600',
        bgLight: 'bg-cyan-500/10',
        glow: 'bg-cyan-500/20',
      },
      'premium': {
        bg: 'bg-primary',
        text: 'text-indigo-300',
        border: 'border-[#384394]',
        hover: 'hover:bg-indigo-700',
        bgLight: 'bg-indigo-500/10',
        glow: 'bg-indigo-500/20',
      },

      'pro': {
        bg: 'bg-purple-600',
        text: 'text-purple-300',
        border: 'border-[#2d1a45]',
        hover: 'hover:bg-purple-700',
        bgLight: 'bg-purple-500/10',

        glow: 'bg-purple-500/20',
      },
      'free': {
        bg: 'bg-emerald-600',
        text: 'text-emerald-300',
        border: 'border-emerald-900/30',
        hover: 'hover:bg-emerald-700',

        bgLight: 'bg-emerald-500/10',
        glow: 'bg-emerald-500/20',
      },
    };

    return colorMap[tier];
  };

  const pricingPlans: PricingPlan[] = [
    {
      tier: 'Free',
      tier_enum: 'free',
      description: 'Thanks for being part of Nexus.',

      benefits: [

        {
          title: 'Monthly 500 coins budget',
        },
        {
          title: 'Accounts up to Silver',
        },

        {
          title: 'Community Support',
        },
        {
          title: 'No credit card required',
        },

      ],

      buttonText: 'Get Started for Free',
    },

    {
      tier: 'Basic',
      description: 'Perfect for part-time boosters',
      period: '/mo',

      benefits: [
        {
          title: 'Monthly 3000 coins budget',
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
    },

    {
      tier: 'Basic+',
      description: 'Made for intermediary boosters',
      period: '/mo',

      benefits: [
        {
          title: 'Monthly 4000 coins budget',
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
      tier_enum: 'basic+',
      buttonText: 'Choose Basic+',
    },
    {
      tier: 'Premium',
      description: 'The ideal solution for serious boosters.',
      tier_enum: 'premium',
      benefits: [
        {
          title: 'Monthly 5000 coins budget',
          icon: 'check',

        },

        {
          title: 'Accounts up to Diamond',
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
      period: '/mo',
      buttonText: 'Choose Premium',
    },
    {
      tier: 'Pro',
      tier_enum: 'pro',
      description: 'For full-time professional boosters',
      benefits: [
        {
          title: 'Unlimited coins',
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
      buttonText: 'Choose Pro',
    },
  ];
  const getBackgroundColor = (tier: PremiumTiers) => {
    const bgMap: Record<string, string> = {
      'basic': 'bg-[#0a1525]',
      'basic+': 'bg-[#0e2f3a]', // new color for basic+
      'pro': 'bg-[#1a0a29]',
      'free': 'bg-gradient-to-b from-[#1a2e29] to-[#0f1e1b]',
      'premium': 'bg-[#151937]',
    };

    return bgMap[tier] || '';
  };
  const paymentMethods: PaymentMethod[] = [

    {
      title: 'Stripe',
      description: 'Pay with Visa, Mastercard, or American Express',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32px" height="32px" fill="#6772e5"><path d="M111.328 15.602c0-4.97-2.415-8.9-7.013-8.9s-7.423 3.924-7.423 8.863c0 5.85 3.32 8.8 8.036 8.8 2.318 0 4.06-.528 5.377-1.26V19.22a10.246 10.246 0 0 1-4.764 1.075c-1.9 0-3.556-.67-3.774-2.943h9.497a39.64 39.64 0 0 0 .063-1.748zm-9.606-1.835c0-2.186 1.35-3.1 2.56-3.1s2.454.906 2.454 3.1zM89.4 6.712a5.434 5.434 0 0 0-3.801 1.509l-.254-1.208h-4.27v22.64l4.85-1.032v-5.488a5.434 5.434 0 0 0 3.444 1.265c3.472 0 6.64-2.792 6.64-8.957.003-5.66-3.206-8.73-6.614-8.73zM88.23 20.1a2.898 2.898 0 0 1-2.288-.906l-.03-7.2a2.928 2.928 0 0 1 2.315-.96c1.775 0 2.998 2 2.998 4.528.003 2.593-1.198 4.546-2.995 4.546zM79.25.57l-4.87 1.035v3.95l4.87-1.032z" fill-rule="evenodd"/><path d="M74.38 7.035h4.87V24.04h-4.87z"/><path d="M69.164 8.47l-.302-1.434h-4.196V24.04h4.848V12.5c1.147-1.5 3.082-1.208 3.698-1.017V7.038c-.646-.232-2.913-.658-4.048 1.43zm-9.73-5.646L54.698 3.83l-.02 15.562c0 2.87 2.158 4.993 5.038 4.993 1.585 0 2.756-.302 3.405-.643v-3.95c-.622.248-3.683 1.138-3.683-1.72v-6.9h3.683V7.035h-3.683zM46.3 11.97c0-.758.63-1.05 1.648-1.05a10.868 10.868 0 0 1 4.83 1.25V7.6a12.815 12.815 0 0 0-4.83-.888c-3.924 0-6.557 2.056-6.557 5.488 0 5.37 7.375 4.498 7.375 6.813 0 .906-.78 1.186-1.863 1.186-1.606 0-3.68-.664-5.307-1.55v4.63a13.461 13.461 0 0 0 5.307 1.117c4.033 0 6.813-1.992 6.813-5.485 0-5.796-7.417-4.76-7.417-6.943zM13.88 9.515c0-1.37 1.14-1.9 2.982-1.9A19.661 19.661 0 0 1 25.6 9.876v-8.27A23.184 23.184 0 0 0 16.862.001C9.762.001 5 3.72 5 9.93c0 9.716 13.342 8.138 13.342 12.326 0 1.638-1.4 2.146-3.37 2.146-2.905 0-6.657-1.202-9.6-2.802v8.378A24.353 24.353 0 0 0 14.973 32C22.27 32 27.3 28.395 27.3 22.077c0-10.486-13.42-8.613-13.42-12.56z" fill-rule="evenodd"/></svg>',
      isExternal: true,
    },
    {
      title: 'Pix',
      description: 'Pay with pix directly from your bank account',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32px" height="32px" baseProfile="basic"><path fill="#4db6ac" d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76 l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"/><path fill="#4db6ac" d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76 l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"/><path fill="#4db6ac" d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0 l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17 l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26 C46.65,21.88,46.65,26.12,44.04,28.74z"/></svg>',
      isExternal: true,
    },

    {
      title: 'BR Balance',
      description: 'Pay using your Boost Royal balance',
      icon: '<svg height="32" width="32" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 39 39"><g clip-path="url(#logo-icon_svg__a)"><circle cx="19.797" cy="19.02" r="13.586" fill="#0F061E"></circle><path fill="url(#logo-icon_svg__b)" d="M19.408 0a19.408 19.408 0 1 0 0 38.817 19.408 19.408 0 0 0 0-38.817M8.757 26.652l-.45-11.816 5.667 4.89 7.965 6.926zm15.527 0-9.534-8.268 4.658-7.71 9.673 15.978zm5.845-1.227-4.285-7.127 4.658-3.462z"></path></g><defs><linearGradient id="logo-icon_svg__b" x1="0" x2="38.817" y1="19.408" y2="19.408" gradientUnits="userSpaceOnUse"><stop stop-color="#FF7E45"></stop><stop offset="1" stop-color="#FF6550"></stop></linearGradient><clipPath id="logo-icon_svg__a"><path fill="#fff" d="M0 0h38.817v38.817H0z"></path></clipPath></defs></svg>',
    },
    {
      title: 'Turbo Boost Balance',
      description: 'Pay using your Turbo balance',
      icon: getCompanyIcon('turboboost'),

    },
  ];
  return {
    paymentMethods,
    getTierColorClass,
    getBackgroundColor,
    pricingPlans,
  };
}

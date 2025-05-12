import { Button } from '@/components/ui/button';
import { useMembership } from '@/hooks/useMembership.ts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Lock, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

type PremiumPaywallProps = {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  features?: string[];
  className?: string;
  blurContent?: boolean;
  onPurchase?: () => void;
};

export default function PremiumPaywall({

  title = 'Premium Content Locked',
  description = 'Unlock exclusive access to premium features and content',
  ctaText = 'Upgrade to Premium',
  ctaLink = '/pricing',
  features = [
    'Access to all premium skins and champions',
    'Exclusive filter presets and collections',
    'Advanced comparison tools',
    'Early access to new releases',
  ],
  className,
  // blurContent = true,
  onPurchase,
}: PremiumPaywallProps) {
  const [mounted, setMounted] = useState(false);
  const { getTierColorClass } = useMembership();
  useEffect(() => {
    setMounted(true);
    // Prevent scrolling when paywall is active
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handlePurchaseClick = () => {
    if (onPurchase) {
      onPurchase();
    } else if (ctaLink) {
      window.location.href = ctaLink;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm', className)}>
      <div className="absolute inset-0 bg-shade10/70" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-2xl rounded-xl border border-primary/20 bg-shade9 p-6 shadow-2xl"
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 transform">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg">
            <Lock className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <Crown className="h-5 w-5 text-yellow-400" />
          </div>

          <p className="mb-6 text-muted-foreground">{description}</p>

          <div className="mb-8 space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="flex items-center gap-2 rounded-lg bg-shade8 p-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>

          <div className="relative">
            <div className="absolute -left-12 -top-6 text-primary opacity-20">
              <Sparkles className="h-24 w-24" />
            </div>
            <div className="absolute -right-12 -bottom-6 text-primary opacity-20">
              <Star className="h-24 w-24" />
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="w-full bg-primary px-8 py-6 text-lg font-semibold text-white hover:bg-primary/90"
                onClick={handlePurchaseClick}
              >
                {ctaText}
              </Button>
            </motion.div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Unlock now for unlimited access to all
            {' '}
            <span className={getTierColorClass('pro')?.text}>pro</span>
            {' '}
            features
          </p>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}

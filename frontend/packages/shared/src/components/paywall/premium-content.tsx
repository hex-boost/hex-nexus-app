// Create a new component: frontend/packages/shared/src/components/paywall/premium-content.tsx
import { Button } from '@/components/ui/button';
import { useMembership } from '@/hooks/useMembership.tsx';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Lock, Sparkles, Star } from 'lucide-react';

type PremiumContentProps = {
  title?: string;
  description?: string;
  ctaText?: string;
  features?: string[];
  className?: string;
  onAction?: () => void;
  contentClassName?: string;
  showLockIcon?: boolean;
};

export function PremiumContent({
  title = 'Premium Content Locked',
  description = 'Unlock exclusive access to premium features and content',
  ctaText = 'Upgrade to Premium',
  features = [],
  className,
  onAction,
  contentClassName,
  showLockIcon = true,
}: PremiumContentProps) {
  const { getTierColorClass } = useMembership();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('relative z-10 w-full max-w-2xl rounded-xl border border-primary/20 bg-shade9 p-6 shadow-2xl', contentClassName)}
    >
      {showLockIcon && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 transform">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg">
            <Lock className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      <div className={cn('mt-6 text-center', className)}>
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
              onClick={onAction}
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
  );
}

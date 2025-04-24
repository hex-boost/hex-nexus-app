import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import type { PremiumTiers } from '@/types/types.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { useMembership } from '@/hooks/useMembership.ts';
import { motion } from 'framer-motion';
import { Check, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';

type PremiumPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tier: PremiumTiers;
  currency?: 'USD' | 'BRL';
  paymentMethod: PaymentMethodsAccepted;
  amount: number;
};

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        delay: i * 0.2,
        type: 'spring',
        duration: 1.5,
        bounce: 0.2,
        ease: 'easeInOut',
      },
      opacity: { delay: i * 0.2, duration: 0.2 },
    },
  }),
};

export function PremiumPaymentModal({
  isOpen,
  onClose,
  tier,
  currency = 'USD',
  paymentMethod,
  amount,
}: PremiumPaymentModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { getTierColorClass, paymentMethods } = useMembership();
  // Reset animation state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Color mapping based on the premium tier

  const colors = getTierColorClass(tier);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-zinc-900 border-zinc-800 backdrop-blur-sm p-0 overflow-hidden">

        <div className="p-6">
          <Card className="w-full bg-transparent border-none shadow-none">
            <CardContent className="space-y-6 flex flex-col items-center justify-center p-0">
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                  scale: {
                    type: 'spring',
                    damping: 15,
                    stiffness: 200,
                  },
                }}
              >
                <div className="relative">
                  <motion.div
                    className={`absolute inset-0 blur-xl ${colors.glow} rounded-full`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.8,
                      ease: 'easeOut',
                    }}
                  />
                  <motion.svg
                    width={100}
                    height={100}
                    viewBox="0 0 100 100"
                    initial="hidden"
                    animate={isAnimating ? 'visible' : 'hidden'}
                    className="relative z-10"
                  >
                    <title>Animated Checkmark</title>
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={
                        tier === 'premium'
                          ? 'rgb(99 102 241)'
                          : tier === 'basic'
                            ? 'rgb(59 130 246)'
                            : tier === 'pro'
                              ? 'rgb(147 51 234)'
                              : 'rgb(16 185 129)'
                      }
                      variants={draw}
                      custom={0}
                      style={{
                        strokeWidth: 4,
                        strokeLinecap: 'round',
                        fill: 'transparent',
                      }}
                    />
                    <motion.path
                      d="M30 50L45 65L70 35"
                      stroke={
                        tier === 'premium'
                          ? 'rgb(99 102 241)'
                          : tier === 'basic'
                            ? 'rgb(59 130 246)'
                            : tier === 'pro'
                              ? 'rgb(147 51 234)'
                              : 'rgb(16 185 129)'
                      }
                      variants={draw}
                      custom={1}
                      style={{
                        strokeWidth: 4,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        fill: 'transparent',
                      }}
                    />
                  </motion.svg>
                </div>
              </motion.div>

              <motion.div
                className="space-y-4 text-center w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <motion.h2
                  className={`text-xl ${colors.text} tracking-tighter font-semibold uppercase`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  Payment Confirmed
                </motion.h2>

                <motion.p
                  className="text-zinc-300 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                >
                  Your payment for
                  {' '}
                  <span className={`font-semibold ${colors.text}`}>{tier}</span>
                  {' '}
                  is successfully
                  received, congratulations!
                </motion.p>

                <motion.div
                  className={`flex-1 bg-zinc-800/50 rounded-xl p-4 border ${colors.border} backdrop-blur-md`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 1.2,
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <div className="flex flex-col items-start gap-3">
                    <div className="space-y-1.5 w-full">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" />
                        Payment Method
                      </span>
                      <div className="flex items-center gap-2.5 group transition-all">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg  shadow-lg ${colors.border} text-sm font-medium ${colors.text} group-hover:scale-105 transition-transform`}
                        >
                          {paymentMethods.find(paymentMethod => paymentMethod.title.toLowerCase() === paymentMethod.title)?.icon }
                        </span>
                        <span className="font-medium text-zinc-100 tracking-tight">{paymentMethod}</span>
                      </div>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

                    <div className="space-y-1.5 w-full">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        Premium Tier
                      </span>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-zinc-100 tracking-tight capitalize">{tier}</span>
                        <span className={`font-bold ${colors.text}`}>
                          {currency === 'USD' ? '$' : 'R$'}
                          {amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className=" p-4 border-t border-zinc-800">
          <Button onClick={onClose} className={`w-full ${colors.bg} ${colors.hover}`}>
            Okay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

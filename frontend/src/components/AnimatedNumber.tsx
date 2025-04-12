'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
};

export function AnimatedNumber({
  value,
  duration = 1000,
  className = '',
  formatter = val => val.toString(),
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Only animate if the value is increasing
    if (value > displayValue) {
      const startTime = Date.now();
      const startValue = displayValue;
      const endValue = value;
      const changeInValue = endValue - startValue;

      const animateValue = () => {
        const now = Date.now();
        const elapsed = now - startTime;

        if (elapsed < duration) {
          // Easing function: easeOutQuad
          const progress = 1 - (1 - elapsed / duration) ** 2;
          const currentValue = startValue + changeInValue * progress;
          setDisplayValue(currentValue);
          requestAnimationFrame(animateValue);
        } else {
          setDisplayValue(endValue);
        }
      };

      requestAnimationFrame(animateValue);
    } else {
      // If value is decreasing, update immediately without animation
      setDisplayValue(value);
    }
  }, [value, duration]);

  return <span className={className}>{formatter(Math.floor(displayValue))}</span>;
}

export function AnimatedTimeDisplay({
  seconds,
  className = '',
}: {
  seconds: number;
  className?: string;
}) {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  return <AnimatedNumber value={seconds} className={className} formatter={formatTime} />;
}

export function AnimatedCoins({
  coins,
  className = '',
}: {
  coins: number;
  className?: string;
}) {
  return <AnimatedNumber value={coins} className={className} formatter={val => `${val} ⦿`} />;
}

export function AnimatedTimeChange({
  seconds,
  onComplete,
}: {
  seconds: number;
  onComplete: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={onComplete}
        className="absolute top-0 right-0 text-xs font-bold text-green-400 px-2 py-1 bg-green-900/30 rounded-md"
      >
        +
        {Math.floor(seconds / 3600)}
        h
        {Math.floor((seconds % 3600) / 60)}
        m
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimatedCoinChange({
  coins,
  onComplete,
}: {
  coins: number;
  onComplete: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={onComplete}
        className="absolute top-0 right-0 text-xs font-bold text-amber-400 px-2 py-1 bg-amber-900/30 rounded-md"
      >
        -
        {coins}
        {' '}
        ⦿
      </motion.div>
    </AnimatePresence>
  );
}

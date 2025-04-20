import type { UpdateStatus } from './update-overlay';
import logoHexBoost from '@/assets/logo-hex-boost.svg';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type UpdateLogoProps = {
  status: UpdateStatus;
};

export default function UpdateLogo({ status }: UpdateLogoProps) {
  const [rotation, setRotation] = useState(0);

  // Different animation states based on update status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'checking' || status === 'downloading' || status === 'installing') {
      interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 16); // ~60fps
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status]);

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Base logo */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: status === 'complete' ? [1, 1.1, 1] : 1,
          opacity: status === 'error' ? 0.5 : 1,
        }}
        transition={{
          scale: { duration: 0.5, ease: 'easeInOut' },
          opacity: { duration: 0.3 },
        }}
      >
        <img
          src={logoHexBoost}
          alt="Hex Boost Logo"
          className="w-16 h-16"
        />
      </motion.div>

      {/* Rotating outer ring - only visible during active update states */}

      {/* Success checkmark animation - only visible on complete */}
      {status === 'complete' && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <svg
            width="40%"
            height="40%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
      )}

      {/* Error X animation - only visible on error */}
      {status === 'error' && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <svg
            width="40%"
            height="40%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}

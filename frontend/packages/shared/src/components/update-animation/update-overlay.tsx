import { TextShimmer } from '@/components/ui/text-shimmer.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import UpdateLogo from './update-logo';
import UpdateProgress from './update-progress';

export type UpdateStatus = 'checking' | 'downloading' | 'installing' | 'complete' | 'error';

type UpdateOverlayProps = {
  isVisible: boolean;
  onComplete: () => void;
  onError?: (error: string) => void;
  simulateUpdate?: boolean; // For demo purposes
};
const StatusMessage = memo(({ message }: { message: string }) => (
  <TextShimmer
    duration={1.5}
    className="font-medium text-center"
  >
    {message}
  </TextShimmer>
));
const ProgressSection = memo(({ status, progress }: { status: UpdateStatus; progress: number }) => {
  return (status === 'downloading' || status === 'installing') ? <UpdateProgress progress={progress} /> : null;
});
export default function UpdateOverlay({ isVisible, onComplete, onError, simulateUpdate = false }: UpdateOverlayProps) {
  const [status, setStatus] = useState<UpdateStatus>('checking');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Status messages
  const statusMessages = {
    checking: 'Checking for updates...',
    starting: 'Starting...',
    downloading: 'Downloading update...',
    installing: 'Installing update...',
    complete: 'Update complete!',
    error: `Update failed: ${errorMessage}`,
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    // Reset state when overlay becomes visible
    setStatus('checking');
    setProgress(0);
    setErrorMessage('');

    if (simulateUpdate) {
      // Simulate the update process for demo purposes
      const simulateUpdateProcess = async () => {
        // Checking phase
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Downloading phase
        setStatus('downloading');
        for (let i = 0; i <= 100; i += 5) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Installing phase
        setStatus('installing');
        setProgress(0);
        for (let i = 0; i <= 100; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Complete phase
        setStatus('complete');
        await new Promise(resolve => setTimeout(resolve, 1500));
        onComplete();
      };

      simulateUpdateProcess().catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Unknown error');
        if (onError) {
          onError(err.message || 'Unknown error');
        }
      });
    } else {
      // In a real application, you would implement actual update logic here
      // This would involve checking for updates, downloading, and installing
      // For now, we'll just use the simulation
    }
  }, [isVisible, simulateUpdate, onComplete, onError]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center  bg-opacity-95 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center justify-center max-w-md w-full px-6">
            <UpdateLogo status={status} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-8 w-full mx-auto space-y-4"
            >
              <ProgressSection status={status} progress={progress} />
              <div className="flex justify-center w-full">
                <StatusMessage message={statusMessages[status]} />
              </div>
              {status === 'error' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md mx-auto block"
                  onClick={() => onComplete()}
                >
                  Close
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { TextShimmer } from '@/components/ui/text-shimmer.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import UpdateLogo from './update-logo';
import UpdateProgress from './update-progress';

export type UpdateStatus = 'checking' | 'downloading' | 'installing' | 'complete' | 'error';

export type UpdateOverlayProps = {
  isVisible: boolean;
  status: UpdateStatus;
  progress: number;
  error?: string;
  onComplete: () => void;
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

export default function UpdateOverlay({
  isVisible,
  status,
  progress,
  error,
  onComplete,
}: UpdateOverlayProps) {
  // Status messages
  const statusMessages = {
    checking: 'Checking for updates...',
    downloading: 'Downloading update...',
    installing: 'Installing update...',
    complete: 'Update complete! Restarting...',
    error: `Update failed: ${error || 'Unknown error'}`,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-opacity-95 backdrop-blur-sm"
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
                  onClick={onComplete}
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

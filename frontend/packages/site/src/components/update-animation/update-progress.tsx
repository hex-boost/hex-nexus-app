import { motion } from 'framer-motion';

type UpdateProgressProps = {
  progress: number;
};

export default function UpdateProgress({ progress }: UpdateProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-center text-xs text-gray-400 mb-2">
        <span>
          {progress}
          %
        </span>
      </div>
      <div className="h-2 bg-[#1F1F23] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}

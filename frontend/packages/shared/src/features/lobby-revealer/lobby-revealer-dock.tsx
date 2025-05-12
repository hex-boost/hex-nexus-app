import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock.tsx';
import { motion } from 'framer-motion';

export function LobbyRevealerDock({ onClickAction }: { onClickAction?: () => void }) {
  return (
    <>
      <div className="fixed bottom-2 left-10/12 max-w-full -translate-x-1/2 z-[50]">
        <Dock className="items-end pb-3 !bg-card/60 backdrop-blur-sm">
          <button onClick={onClickAction} type="button">
            {' '}
            {/* Changed to handleDockClick */}
            <DockItem className="aspect-square flex rounded-full bg-gray-200 dark:bg-neutral-800 relative">
              <motion.div
                className="absolute inset-0 w-full h-full rounded-full bg-gray-300 dark:bg-primary/30"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <DockLabel>Open Opgg</DockLabel>
              <DockIcon>
                <img
                  alt="opgg icon"
                  src="https://s-opgg-kit.op.gg/gnb/config/images/icon/bfa5abe2f78d6e9a55e81c9988c31442.svg?image=q_auto:good,f_webp,w_48,h_48"
                />
              </DockIcon>
            </DockItem>
          </button>
        </Dock>
      </div>

    </>
  );
}

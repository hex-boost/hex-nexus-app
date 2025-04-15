import type React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type CustomScrollbarProps = {
  className?: string;
  thumbClassName?: string;
  trackClassName?: string;
  hideTrackWhenNotHovering?: boolean;
  autoHide?: boolean;
  theme?: 'default' | 'lol-blue' | 'lol-gold';
} & React.HTMLProps<HTMLDivElement>;

export const CustomScrollbar = (
  { ref, children, className, thumbClassName, trackClassName, hideTrackWhenNotHovering = false, autoHide = false, theme = 'lol-blue', ...props }: CustomScrollbarProps & { ref?: React.RefObject<HTMLDivElement | null> },
) => {
  const [isHovering, setIsHovering] = useState(false);
  const [scrollThumbHeight, setScrollThumbHeight] = useState(0);
  const [scrollThumbTop, setScrollThumbTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);

  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'lol-gold':
        return {
          track: 'bg-gradient-to-b from-amber-900/10 to-amber-800/5 dark:from-amber-900/20 dark:to-amber-800/10',
          thumb:
                            'bg-gradient-to-b from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 border border-amber-300 dark:border-amber-600 shadow-[0_0_5px_rgba(245,158,11,0.5)] dark:shadow-[0_0_8px_rgba(245,158,11,0.5)]',
        };
      case 'lol-blue':
        return {
          track: 'bg-gradient-to-b from-blue-900/10 to-blue-800/5 dark:from-blue-900/20 dark:to-blue-800/10',
          thumb:
                            'bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 border border-blue-300 dark:border-blue-600 shadow-[0_0_5px_rgba(59,130,246,0.5)] dark:shadow-[0_0_8px_rgba(59,130,246,0.5)]',
        };
      default:
        return {
          track: 'bg-gray-100 dark:bg-gray-800/50',
          thumb: 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500',
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Handle scroll events to update thumb position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Calculate thumb height
    const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 30);
    setScrollThumbHeight(thumbHeight);

    // Calculate thumb position
    const thumbTop = (scrollTop / scrollHeight) * clientHeight;
    setScrollThumbTop(thumbTop);
  };

  // Handle mouse down on thumb to start dragging
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartY(e.clientY);
    if (ref && 'current' in ref && ref.current) {
      setStartScrollTop(ref.current.scrollTop);
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !ref || !('current' in ref) || !ref.current) {
        return;
      }

      const { scrollHeight, clientHeight } = ref.current;
      const deltaY = e.clientY - startY;
      const percentage = deltaY / clientHeight;
      const scrollAmount = percentage * scrollHeight;

      ref.current.scrollTop = startScrollTop + scrollAmount;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, ref, startY, startScrollTop]);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div ref={ref} className={cn('overflow-y-auto scrollbar-none', className)} onScroll={handleScroll} {...props}>
        {children}
      </div>

      {/* Custom Scrollbar Track */}
      <div
        className={cn(
          'absolute top-0 right-0 w-2 h-full rounded-full transition-opacity duration-300',
          themeStyles.track,
          hideTrackWhenNotHovering && !isHovering && !isDragging && 'opacity-0',
          autoHide && !isHovering && !isDragging && 'opacity-0',
          trackClassName,
        )}
      >
        {/* League of Legends themed icon at the top of the track */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={cn('w-full h-full', theme === 'lol-gold' ? 'text-amber-400' : 'text-blue-400', 'opacity-70')}
          >
            <path
              fill="currentColor"
              d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83v-4.7l6-2.25 6 2.25v4.7z"
            />
          </svg>
        </div>
      </div>

      {/* Custom Scrollbar Thumb */}
      <motion.div
        className={cn(
          'absolute right-0 w-2 rounded-full cursor-pointer transition-opacity duration-300',
          themeStyles.thumb,
          autoHide && !isHovering && !isDragging && 'opacity-0',
          thumbClassName,
        )}
        style={{
          height: `${scrollThumbHeight}px`,
          top: `${scrollThumbTop}px`,
        }}
        onMouseDown={handleThumbMouseDown}
        animate={{
          top: scrollThumbTop,
          height: scrollThumbHeight,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* League of Legends themed icon on the thumb */}
        {theme !== 'default' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1">
            <div
              className={cn(
                'w-full h-full rounded-full',
                theme === 'lol-gold' ? 'bg-amber-300' : 'bg-blue-300',
                'opacity-70',
              )}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

CustomScrollbar.displayName = 'CustomScrollbar';

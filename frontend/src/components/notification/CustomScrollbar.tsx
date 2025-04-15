import type React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type CustomScrollbarProps = {
  className?: string;
  thumbClassName?: string;
  trackClassName?: string;
  theme?: 'default' | 'lol-blue' | 'lol-gold';
} & React.HTMLProps<HTMLDivElement>;

export const CustomScrollbar = (
  { ref, children, className, thumbClassName, trackClassName, theme = 'default', ...props }: CustomScrollbarProps & { ref?: React.RefObject<HTMLDivElement | null> },
) => {
  const [scrollThumbHeight, setScrollThumbHeight] = useState(0);
  const [scrollThumbTop, setScrollThumbTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Add this useEffect hook after existing hooks
  useEffect(() => {
    const container = ref?.current;
    if (!container) {
      return;
    }

    const calculateThumb = () => {
      const { scrollHeight, clientHeight } = container;
      const hasOverflow = scrollHeight > clientHeight;
      setIsOverflowing(hasOverflow);

      if (hasOverflow) {
        const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 30);
        setScrollThumbHeight(thumbHeight);
        setScrollThumbTop(container.scrollTop);
      } else {
        setScrollThumbHeight(0);
        setScrollThumbTop(0);
      }
    };

    const observer = new MutationObserver(calculateThumb);
    observer.observe(container, { childList: true, subtree: true });
    calculateThumb();

    return () => observer.disconnect();
  }, [ref?.current]);
  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (theme) {
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
    >
      <div ref={ref} className={cn('overflow-y-auto scrollbar-none', className)} onScroll={handleScroll} {...props}>
        {children}
      </div>
      {isOverflowing && (
        <>

          <div
            className={cn(
              'absolute top-0 right-0 w-2 h-full rounded-full transition-opacity duration-300',
              themeStyles.track,
              trackClassName,
            )}
          >

          </div>

          <motion.div
            className={cn(
              'absolute right-0 w-2 rounded-full cursor-pointer transition-opacity duration-300',
              themeStyles.thumb,
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
          >

          </motion.div>

        </>
      )}
    </div>
  );
};

CustomScrollbar.displayName = 'CustomScrollbar';

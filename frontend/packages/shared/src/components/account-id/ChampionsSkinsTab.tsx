import { Card, CardContent } from '@/components/ui/card.tsx';
import { useEffect, useRef, useState } from 'react';

type OrderActionTabsProps = {
  activeTab: number;
  tabLabel: string[];
  onTabChangeAction: (selectedTab: number) => void;
  tabs: string[];
};

export function ChampionsSkinsTab({ tabs, tabLabel, activeTab, onTabChangeAction }: OrderActionTabsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(activeTab);
  const [hoverStyle, setHoverStyle] = useState({});
  const [activeStyle, setActiveStyle] = useState({ left: '0px', width: '0px' });
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement;
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);
  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex];
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
    onTabChangeAction(activeIndex);
  }, [activeIndex, onTabChangeAction]);
  useEffect(() => {
    requestAnimationFrame(() => {
      const overviewElement = tabRefs.current[0];
      if (overviewElement) {
        const { offsetLeft, offsetWidth } = overviewElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    });
  }, []);
  return (
    <Card
      className="w-full max-w-[1200px] border-none shadow-none relative flex items-center justify-center bg-transparent"
    >
      <CardContent className=" w-full ">
        <div className="relative w-full">
          <div
            className="absolute h-[30px] transition-all duration-300 ease-out bg-blue-100/20 dark:bg-blue-500/10 rounded-[6px] flex items-center"
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />
          <div
            className="absolute bottom-[-6px] h-[2px] bg-[#0e0f11] dark:bg-blue-500 transition-all duration-300 ease-out"
            style={activeStyle}
          />
          <div className="relative flex items-center w-full">
            {tabs.map((_, index) => (
              <div
                key={index}
                ref={el => (tabRefs.current[index] = el) as any}
                className={`px-3 w-full py-2 cursor-pointer transition-colors duration-300 h-[30px] ${index === activeIndex ? 'text-muted-foreground dark:text-white' : 'text-[#0e0f1199] dark:text-muted-foreground'}`}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveIndex(index);
                  }
                }}
              >
                <div
                  className="text-sm font-[var(--www-mattmannucci-me-geist-regular-font-family)] leading-5 whitespace-nowrap flex items-center justify-center h-full"
                >
                  {tabLabel[index]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

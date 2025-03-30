import { CollapseMenuButton } from '@/components/admin-panel/collapse-menu-button';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { getMenuList } from '@/lib/menu-list';
import { cn } from '@/lib/utils';
import { Link, useLocation } from '@tanstack/react-router';
import clsx from 'clsx';

type MenuProps = {
  isOpen: boolean | undefined;
};

export function Menu({ isOpen }: MenuProps) {
  const { pathname } = useLocation();
  const menuList = getMenuList();

  return (
    <nav className="mt-8 h-full w-full">
      <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
        {menuList.map(({ menus }, index) => (
          <li className={cn('w-full')} key={index}>

            {menus.map(
              ({ href, label, icon: Icon, submenus }, index) =>
                !submenus || submenus.length === 0 ? (
                  <div className="w-full" key={index}>
                    <TooltipProvider disableHoverableContent>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <Button
                            className={clsx('hover:bg-primary/10 w-full   rounded-md justify-start h-10 mb-4', pathname.endsWith(href) ? 'bg-primary/10 text-blue-400' : 'bg-transparent text-muted-foreground  hover:text-blue-400/80')}
                            asChild
                          >
                            <Link to={href}>
                              <span
                                className={cn(isOpen === false ? '' : 'mr-4')}
                              >
                                {/* @ts-ignore */}
                                <Icon size={20} className="stroke-2" />
                              </span>
                              <p
                                className={cn(
                                  'max-w-[200px] truncate',
                                  isOpen === false
                                    ? '-translate-x-96 opacity-0'
                                    : 'translate-x-0 opacity-100',
                                )}
                              >
                                {label}
                              </p>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        {isOpen === false && (
                          <TooltipContent side="right">
                            {label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="w-full" key={index}>
                    <CollapseMenuButton
                      icon={Icon}
                      label={label}
                      active={
                        pathname.endsWith(href)
                      }
                      submenus={submenus}
                      isOpen={isOpen}
                    />
                  </div>
                ),
            )}
          </li>
        ))}
        <li className="w-full grow flex items-end justify-center pb-4">
          <span className="font-medium text-muted-foreground text-sm">v1.0.2</span>
          {/* {GetCurrentVersion()} */}
        </li>
      </ul>
    </nav>
  );
}

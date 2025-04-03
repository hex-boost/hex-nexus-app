import { Home, User } from '@geist-ui/icons';
import { Crown } from 'lucide-react';

type Submenu = {
  href: string;
  label: string;
};

type Menu = {
  href: string;
  label: string;
  icon: any;
  submenus?: Submenu[];
};

type Group = {
  menus: Menu[];
};

export function getMenuList(): Group[] {
  return [
    {
      menus: [
        {
          href: '/dashboard',
          label: 'Dashboard',
          icon: Home,
          submenus: [],
        },
        {
          href: '/accounts',
          label: 'Accounts',
          icon: User,
        },
        {
          href: '/subscription',
          label: 'Subscription',
          icon: Crown,
        },
      ],
    },
  ];
}

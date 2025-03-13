import { User, Home, Star } from '@geist-ui/icons';

type Submenu = {
  href: string;
  label: string;
};

type Menu = {
  href: string;
  label: string;
  icon: React.ComponentType;
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
          href: "/",
          label: "Dashboard",
          icon: Home,
          submenus: []
        },
        {
          href: "/accounts",
          label: "Accounts",
          icon: User
        },
        {
          href: "/subscription",
          label: "Subscription",
          icon: Star
        }
      ]
    }
  ];
}

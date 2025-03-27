'use client';

import type React from 'react';

import { CoinIcon } from '@/components/coin-icon.tsx';

import { Link } from '@tanstack/react-router';
import {
  BarChart2,
  Clock,
  Gamepad2,
  HelpCircle,
  Home,
  Menu,
  MessagesSquare,
  Settings,
  Shield,
  Star,
  Trophy,
  User,
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleNavigation() {
    setIsMobileMenuOpen(false);
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string;
    icon: any;
    children: React.ReactNode;
  }) {
    return (
      <Link
        to={href}
        onClick={handleNavigation}
        className="flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <nav
        className={`
              fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-[#0F0F12] transform transition-transform duration-200 ease-in-out
              lg:translate-x-0 lg:static lg:w-64 border-r border-gray-200 dark:border-[#1F1F23]
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
      >
        <div className="h-full flex flex-col">
          <Link to="/" className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
                LoL
              </div>
              <span className="text-lg font-semibold hover:cursor-pointer text-gray-900 dark:text-white">
                LoLAccounts
              </span>
            </div>
          </Link>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Overview
                </div>
                <div className="space-y-1">
                  <NavItem href="#" icon={Home}>
                    Dashboard
                  </NavItem>
                  <NavItem href="#" icon={BarChart2}>
                    Analytics
                  </NavItem>
                  <NavItem href="#" icon={Gamepad2}>
                    Browse Accounts
                  </NavItem>
                  <NavItem href="#" icon={Trophy}>
                    Leaderboard
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Account Management
                </div>
                <div className="space-y-1">
                  <NavItem href="#" icon={User}>
                    My Rentals
                  </NavItem>
                  <NavItem href="#" icon={Clock}>
                    Rental History
                  </NavItem>
                  <NavItem href="#" icon={CoinIcon}>
                    Coin Balance
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Support
                </div>
                <div className="space-y-1">
                  <NavItem href="#" icon={MessagesSquare}>
                    Live Chat
                  </NavItem>
                  <NavItem href="#" icon={Shield}>
                    Account Security
                  </NavItem>
                  <NavItem href="#" icon={Star}>
                    Reviews
                  </NavItem>
                  <NavItem href="#" icon={HelpCircle}>
                    FAQ
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="space-y-1">
              <NavItem href="#" icon={Settings}>
                Settings
              </NavItem>
              <NavItem href="#" icon={HelpCircle}>
                Help
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

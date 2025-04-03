import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Filter, Gamepad2, History, RefreshCw, Search, ShieldAlert, ShoppingCart, User2 } from 'lucide-react';
import { useEffect, useState } from 'react';

function SearchAnimation() {
  return (
    <motion.div
      className="relative w-28 h-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute w-20 h-20 rounded-full border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
        }}
      />

      <motion.div
        className="absolute w-5 h-8 bg-blue-500 dark:bg-blue-400 rounded-full -rotate-45 right-5 bottom-4"
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
        }}
      />
    </motion.div>
  );
}

function FilterAnimation() {
  const [showX, setShowX] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowX(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="relative w-28 h-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="absolute w-24 h-20 rounded-md border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      <motion.div className="absolute w-24 h-5 bg-blue-500 dark:bg-blue-400 left-1/2 top-10 -translate-x-1/2" />

      <motion.div
        className="absolute w-4 h-4 rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 right-6 top-1/2"
        animate={{
          scale: showX ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {showX && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <div className="w-3 h-0.5 bg-red-500 absolute rotate-45"></div>
            <div className="w-3 h-0.5 bg-red-500 absolute -rotate-45"></div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

function NoAccountsAnimation() {
  return (
    <motion.div
      className="relative w-28 h-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="absolute w-24 h-20 rounded-md border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      <motion.div
        className="absolute w-16 h-0.5 bg-zinc-300 dark:bg-zinc-600 left-1/2 top-10 -translate-x-1/2"
        animate={{
          width: [16, 20, 16],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
        }}
      />

      <motion.div
        className="absolute w-12 h-0.5 bg-zinc-300 dark:bg-zinc-600 left-1/2 top-14 -translate-x-1/2"
        animate={{
          width: [12, 16, 12],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
          delay: 0.3,
        }}
      />

      <motion.div
        className="absolute w-14 h-0.5 bg-zinc-300 dark:bg-zinc-600 left-1/2 top-18 -translate-x-1/2"
        animate={{
          width: [14, 18, 14],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
          delay: 0.6,
        }}
      />

      <motion.div
        className="absolute w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-400 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
        }}
      >
        <motion.div className="absolute w-3 h-0.5 bg-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <motion.div className="absolute w-0.5 h-3 bg-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </motion.div>
    </motion.div>
  );
}

function ActiveAccountsAnimation() {
  return (
    <motion.div
      className="relative w-28 h-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="absolute w-24 h-20 rounded-md border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      {}
      <motion.div
        className="absolute w-16 h-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          y: [0, -2, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
        }}
      >
        {}
        <div className="absolute w-16 h-8 bg-blue-500 dark:bg-blue-400 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {}
        <div className="absolute w-4 h-6 bg-blue-600 dark:bg-blue-500 rounded-full left-0 top-1/2 -translate-y-1/2" />

        {}
        <div className="absolute w-4 h-6 bg-blue-600 dark:bg-blue-500 rounded-full right-0 top-1/2 -translate-y-1/2" />

        {}
        <div className="absolute w-2 h-2 bg-white rounded-full right-4 top-1/2 -translate-y-1/2" />
        <div className="absolute w-2 h-2 bg-white rounded-full right-7 top-1/2 -translate-y-1/2" />
      </motion.div>
    </motion.div>
  );
}

function RentalHistoryAnimation() {
  return (
    <motion.div
      className="relative w-28 h-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="absolute w-24 h-20 rounded-md border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      {}
      <motion.div
        className="absolute w-16 h-16 rounded-full border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />

      {}
      <motion.div
        className="absolute w-1 h-5 bg-blue-500 dark:bg-blue-400 rounded-full left-1/2 top-1/2 origin-bottom"
        style={{ transformOrigin: 'bottom center' }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {}
      <motion.div
        className="absolute w-1 h-7 bg-zinc-700 dark:bg-zinc-300 rounded-full left-1/2 top-1/2 origin-bottom"
        style={{ transformOrigin: 'bottom center' }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {}
      <motion.div
        className="absolute w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </motion.div>
  );
}

function ChampionsAnimation() {
  return (
    <motion.div
      className="relative w-28 h-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="absolute w-24 h-20 rounded-md border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      {}
      <motion.div
        className="absolute w-12 h-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
        }}
      >
        {}
        <div className="absolute w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-full left-1/2 top-0 -translate-x-1/2" />

        {}
        <div className="absolute w-8 h-8 bg-blue-500 dark:bg-blue-400 rounded-md left-1/2 top-5 -translate-x-1/2" />

        {}
        <motion.div
          className="absolute text-white text-xl font-bold left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'loop',
          }}
        >
          ?
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function SkinsAnimation() {
  return (
    <motion.div
      className="relative w-28 h-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="absolute w-24 h-20 rounded-md border-2 border-zinc-300 dark:border-zinc-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      {}
      <motion.div
        className="absolute w-14 h-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: 'loop',
        }}
      >
        {}
        <div
          className="absolute w-14 h-14 bg-blue-500 dark:bg-blue-400 rounded-t-full left-0 top-0"
          style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}
        />

        {}
        <div
          className="absolute w-10 h-10 border-2 border-white left-1/2 top-2 -translate-x-1/2 rounded-t-full"
          style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}
        />

        {}
        <div className="absolute text-white text-xl font-bold left-1/2 top-5 -translate-x-1/2">?</div>
      </motion.div>
    </motion.div>
  );
}

type EmptyStateProps = {
  type:
    | 'no-accounts'
    | 'no-search-results'
    | 'no-filter-results'
    | 'no-active-accounts'
    | 'no-rental-history'
    | 'no-champions'
    | 'no-skins';
  searchQuery?: string;
  onAction?: () => void;
  onReset?: () => void;
};

export default function EmptyState({ type, searchQuery = '', onAction, onReset }: EmptyStateProps) {
  // Define content based on type
  const content = {

    'no-accounts': {
      animation: <NoAccountsAnimation />,
      iconFallback: <ShoppingCart className="h-12 w-12 text-zinc-400" />,
      title: 'No accounts available',
      description: 'There are currently no accounts available for rent. Please check back later.',
      actionLabel: 'Browse Accounts',
      resetLabel: '',
      showReset: false,
    },
    'no-search-results': {
      animation: <SearchAnimation />,
      iconFallback: <Search className="h-12 w-12 text-zinc-400" />,
      title: `No results for "${searchQuery}"`,
      description: 'We couldn\'t find any accounts matching your search. Try different keywords or browse all accounts.',
      actionLabel: 'Browse All Accounts',
      resetLabel: 'Clear Search',
      showReset: true,
    },
    'no-filter-results': {
      animation: <FilterAnimation />,
      iconFallback: <Filter className="h-12 w-12 text-zinc-400" />,
      title: 'No matching accounts',
      description: 'We couldn\'t find any accounts matching your filters. Try adjusting your filter criteria.',
      actionLabel: 'Browse All Accounts',
      resetLabel: 'Reset Filters',
      showReset: true,
    },
    'no-active-accounts': {
      animation: <ActiveAccountsAnimation />,
      iconFallback: <Gamepad2 className="h-12 w-12 text-zinc-400" />,
      title: 'No active accounts',
      description: 'You don\'t have any active account rentals. Rent an account to start playing.',
      actionLabel: 'Rent an Account',
      resetLabel: '',
      showReset: false,
    },
    'no-rental-history': {
      animation: <RentalHistoryAnimation />,
      iconFallback: <History className="h-12 w-12 text-zinc-400" />,
      title: 'No rental history',
      description: 'You haven\'t rented any accounts yet. Start by browsing our available accounts.',
      actionLabel: 'Browse Accounts',
      resetLabel: '',
      showReset: false,
    },
    'no-champions': {
      animation: <ChampionsAnimation />,
      iconFallback: <User2 className="h-12 w-12 text-zinc-400" />,
      title: searchQuery ? `No champions matching "${searchQuery}"` : 'No champions available',
      description: searchQuery
        ? 'We couldn\'t find any champions matching your search. Try different keywords.'
        : 'This account doesn\'t have any champions unlocked.',
      actionLabel: 'View Account Details',
      resetLabel: 'Clear Search',
      showReset: !!searchQuery,
    },
    'no-skins': {
      animation: <SkinsAnimation />,
      iconFallback: <ShieldAlert className="h-12 w-12 text-zinc-400" />,
      title: searchQuery ? `No skins matching "${searchQuery}"` : 'No skins available',
      description: searchQuery
        ? 'We couldn\'t find any skins matching your search. Try different keywords.'
        : 'This account doesn\'t have any skins unlocked.',
      actionLabel: 'View Account Details',
      resetLabel: 'Clear Search',
      showReset: !!searchQuery,
    },
  };

  const { animation, iconFallback, title, description, actionLabel, resetLabel, showReset } = content[type];

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-6 bg-white dark:bg-transparent border-zinc-100 dark:border-zinc-800 rounded-lg">

      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4 flex items-center justify-center min-h-[120px] min-w-[120px]">
        {animation || iconFallback}
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && (
          <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700 text-white">
            {actionLabel}
          </Button>
        )}

        {showReset && resetLabel && (
          <Button variant="outline" onClick={onReset} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            {resetLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export function NoSearchResults({
  searchQuery,
  onReset,
}: {
  searchQuery: string;
  onReset: () => void;
}) {
  return <EmptyState type="no-search-results" searchQuery={searchQuery} onReset={onReset} onAction={onReset} />;
}

export function NoFilterResults({
  onReset,
}: {
  onReset: () => void;
}) {
  return <EmptyState type="no-filter-results" onReset={onReset} onAction={onReset} />;
}

export function NoActiveAccounts({
  onBrowse,
}: {
  onBrowse: () => void;
}) {
  return <EmptyState type="no-active-accounts" onAction={onBrowse} />;
}

export function NoRentalHistory({
  onBrowse,
}: {
  onBrowse: () => void;
}) {
  return <EmptyState type="no-rental-history" onAction={onBrowse} />;
}

export function NoChampionsFound({
  searchQuery,
  onReset,
}: {
  searchQuery: string;
  onReset: () => void;
}) {
  return <EmptyState type="no-champions" searchQuery={searchQuery} onReset={onReset} />;
}

export function NoSkinsFound({
  searchQuery,
  onReset,
}: {
  searchQuery: string;
  onReset: () => void;
}) {
  return <EmptyState type="no-skins" searchQuery={searchQuery} onReset={onReset} />;
}

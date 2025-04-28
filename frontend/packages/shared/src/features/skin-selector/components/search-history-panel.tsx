'use client';

import { Button } from '@/components/ui/button.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Clock, Search, Trash2, X } from 'lucide-react';

export type SearchHistoryItem = {
  query: string;
  timestamp: number;
};

type SearchHistoryPanelProps = {
  history: SearchHistoryItem[];
  onClearHistory: () => void;
  onSelectQuery: (query: string) => void;
  onBack: () => void;
};

export default function SearchHistoryPanel({
  history,
  onClearHistory,
  onSelectQuery,
  onBack,
}: SearchHistoryPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold ml-2">Search History</h1>
        <Button variant="outline" className="ml-auto" onClick={onClearHistory}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      {/* History list */}
      <ScrollArea className="flex-1 p-6">
        {history.length === 0
          ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Clock className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No search history</p>
                <p className="text-sm">Your search history will appear here</p>
              </div>
            )
          : (
              <div className="space-y-2">
                <AnimatePresence>
                  {history.map((item, index) => (
                    <motion.div
                      key={`${item.query}-${item.timestamp}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-accent/10 cursor-pointer"
                      onClick={() => onSelectQuery(item.query)}
                    >
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.query}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectQuery(item.query);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
      </ScrollArea>
    </div>
  );
}

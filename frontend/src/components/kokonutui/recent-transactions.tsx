import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  type LucideIcon,
  ArrowRight,
  User,
  Plus,
  Clock,
  CoinsIcon as CoinIcon,
} from "lucide-react"

interface Transaction {
  id: string
  title: string
  accountId?: string
  amount: string
  type: "rental" | "extension" | "deposit" | "refund"
  icon: LucideIcon
  timestamp: string
  status: "completed" | "pending" | "failed"
}

interface RecentTransactionsProps {
  transactions?: Transaction[]
  className?: string
}

const categoryStyles = {
  rental: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  extension: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  deposit: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  refund: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    title: "Account Rental",
    accountId: "L4X92C",
    amount: "2,800",
    type: "rental",
    icon: User,
    timestamp: "Today, 2:45 PM",
    status: "completed",
  },
  {
    id: "2",
    title: "Coin Deposit",
    amount: "10,000",
    type: "deposit",
    icon: Plus,
    timestamp: "Today, 9:00 AM",
    status: "completed",
  },
  {
    id: "3",
    title: "Rental Extension",
    accountId: "R5M3K8",
    amount: "1,200",
    type: "extension",
    icon: Clock,
    timestamp: "Yesterday",
    status: "completed",
  },
  {
    id: "4",
    title: "Account Rental",
    accountId: "L2G7T4",
    amount: "3,500",
    type: "rental",
    icon: User,
    timestamp: "Mar 13, 2024",
    status: "completed",
  },
  {
    id: "5",
    title: "Rental Refund",
    accountId: "K9P3F7",
    amount: "1,500",
    type: "refund",
    icon: Wallet,
    timestamp: "Mar 10, 2024",
    status: "completed",
  },
]

export default function RecentTransactions({ transactions = TRANSACTIONS, className }: RecentTransactionsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-600 dark:text-zinc-400">18 transactions this month</span>
      </div>

      <div className="space-y-1 mb-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className={cn(
              "group flex items-center gap-3",
              "p-2 rounded-lg",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
              "transition-all duration-200",
            )}
          >
            <div className={cn("p-2 rounded-lg", categoryStyles[transaction.type])}>
              <transaction.icon className="w-4 h-4" />
            </div>

            <div className="flex-1 flex items-center justify-between min-w-0">
              <div className="space-y-0.5">
                <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{transaction.title}</h3>
                {transaction.accountId && (
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">ID: {transaction.accountId}</p>
                )}
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{transaction.timestamp}</p>
              </div>

              <div className="flex items-center gap-1.5 pl-3">
                <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span
                  className={cn(
                    "text-xs font-medium",
                    transaction.type === "deposit" || transaction.type === "refund"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {transaction.type === "deposit" || transaction.type === "refund" ? "+" : "-"}
                  {transaction.amount}
                </span>
                {transaction.type === "deposit" || transaction.type === "refund" ? (
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "py-2 px-3 rounded-lg",
          "text-xs font-medium",
          "bg-gradient-to-r from-blue-600 to-blue-500",
          "dark:from-blue-500 dark:to-blue-400",
          "text-white",
          "hover:from-blue-700 hover:to-blue-600",
          "dark:hover:from-blue-600 dark:hover:to-blue-500",
          "shadow-sm hover:shadow",
          "transform transition-all duration-200",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
          "focus:outline-none focus:ring-2",
          "focus:ring-blue-500 dark:focus:ring-blue-400",
          "focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
        )}
      >
        <span>View All Transactions</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}


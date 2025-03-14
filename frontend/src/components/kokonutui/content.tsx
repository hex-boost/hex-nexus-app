import { CreditCard, Shield, Clock, BarChart2 } from "lucide-react"
import SubscriptionStatus from "./subscription-status"
import CurrentlyRentedAccounts from "./currently-rented-accounts"
import LastRentedAccount from "./last-rented-account"
import RecentTransactions from "./recent-transactions"

export default function () {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
            <Shield className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            Subscription Status
          </h2>
          <SubscriptionStatus />
        </div>
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            Currently Rented Accounts
          </h2>
          <CurrentlyRentedAccounts />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
          Last Rented Account
        </h2>
        <LastRentedAccount />
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
          <CreditCard className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
          Transactions
        </h2>
        <RecentTransactions />
      </div>
    </div>
  )
}


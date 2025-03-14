import { cn } from "@/lib/utils"
import { Shield, Clock, CoinsIcon as CoinIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LastRentedAccount() {
  // Example data for last rented account
  const lastAccount = {
    id: "L4X92C",
    tier: "Diamond",
    rank: "III",
    rentedAt: "2024-03-15T14:20:00Z",
    rentalDuration: 6, // hours
    champions: 152,
    skins: 93,
    cost: 2800,
  }

  // Format rental time
  const formatRentalTime = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`
    }
  }

  // Helper function to get rank color
  const getRankColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "iron":
      case "bronze":
        return "text-zinc-600 dark:text-zinc-400"
      case "silver":
        return "text-zinc-400 dark:text-zinc-300"
      case "gold":
        return "text-amber-500 dark:text-amber-400"
      case "platinum":
        return "text-cyan-500 dark:text-cyan-400"
      case "diamond":
        return "text-blue-500 dark:text-blue-400"
      case "master":
        return "text-purple-500 dark:text-purple-400"
      case "grandmaster":
        return "text-red-500 dark:text-red-400"
      case "challenger":
        return "text-yellow-500 dark:text-yellow-400"
      default:
        return "text-zinc-600 dark:text-zinc-400"
    }
  }

  return (
    <div className="w-full">
      <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{lastAccount.id}</span>
            </div>
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Account ID</p>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className={`text-sm font-medium ${getRankColor(lastAccount.tier)}`}>
                  {lastAccount.tier} {lastAccount.rank}
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            )}
          >
            Previously Rented
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Champions</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{lastAccount.champions}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Skins</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{lastAccount.skins}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Rental Duration</p>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {formatRentalTime(lastAccount.rentalDuration)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Rental Cost</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{lastAccount.cost}</span>
            </p>
          </div>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Rent Again</Button>
      </div>
    </div>
  )
}


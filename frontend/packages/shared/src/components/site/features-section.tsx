import { GradientCard } from "@/components/ui/gradient-card"
import Image from "next/image"

export function FeaturesSection() {
  const features = [
    {
      title: "Multi-Account Management",
      description: "Easily switch between accounts and track progress",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Earnings Dashboard",
      description: "Track your boosting income and performance",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Auto Queue & Accept",
      description: "Optimize your boosting workflow",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Advanced Boosting Tools
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Our suite of tools is designed specifically for League of Legends boosters to maximize efficiency and
          earnings. Manage multiple accounts, automate repetitive tasks, and track your performance all in one
          application.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <GradientCard key={feature.title}>
              <Image
                src={feature.image || "/placeholder.svg"}
                alt={feature.title}
                width={300}
                height={200}
                className="rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </GradientCard>
          ))}
        </div>
      </div>
    </section>
  )
}

import { HomeDashboard } from '@/components/HomeDashboard'
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated()) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: () => <HomeDashboard />,
})

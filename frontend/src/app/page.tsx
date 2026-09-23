import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { LoajipsaDashboard } from '@/components/loajipsa-dashboard'

export default function Page() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <LoajipsaDashboard />
      </main>
    </div>
  )
}

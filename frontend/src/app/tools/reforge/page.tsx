import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { ReforgeCalculator } from '@/components/reforge-calculator'

export default function ReforgeToolPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-[12px]">
          <span className="text-muted-foreground">도구</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">재련 계산기</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <ReforgeCalculator />
        </div>
      </main>
    </div>
  )
}

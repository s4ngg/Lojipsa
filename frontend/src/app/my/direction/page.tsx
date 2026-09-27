import { Suspense } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DirectionView } from '@/components/direction-view'

export default function DirectionPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5 text-[15px]">
          <span className="text-muted-foreground">내 정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold">원정대 방향성</span>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <Suspense
            fallback={<p className="text-[14px] text-muted-foreground">불러오는 중...</p>}
          >
            <DirectionView />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

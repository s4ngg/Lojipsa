import { Suspense } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { HomeworkView } from '@/components/homework-view'

export default function HomeworkPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-[12px]">
          <span className="text-muted-foreground">내 정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">숙제 관리</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <Suspense
            fallback={<p className="text-[12px] text-muted-foreground">불러오는 중...</p>}
          >
            <HomeworkView />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

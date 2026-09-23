import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { LoajipsaPanel } from '@/components/loajipsa-panel'

export default function Page() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-muted-foreground">도구</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium">로아집사</span>
            <span className="ml-1 flex items-center gap-1 text-[11px] text-up">
              <span className="size-1.5 rounded-full bg-up" />
              운영중
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            마지막 확인 2분 전
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <LoajipsaPanel />
        </div>
      </main>
    </div>
  )
}

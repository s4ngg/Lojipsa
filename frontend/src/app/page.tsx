import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { cn } from '@/lib/utils'

async function getPublicStatus() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  try {
    const res = await fetch(`${base}/api/public/status`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as { agent: string; status: string }
  } catch {
    return null
  }
}

export default async function Page() {
  const status = await getPublicStatus()

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-muted-foreground">도구</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium">로아집사</span>
            <span
              className={cn(
                'ml-1 flex items-center gap-1 text-[11px]',
                status ? 'text-up' : 'text-down',
              )}
            >
              <span className={cn('size-1.5 rounded-full', status ? 'bg-up' : 'bg-down')} />
              {status ? '운영중' : '연결 안 됨'}
            </span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-[12px] text-muted-foreground">
            상세 모니터링 정보는 관리자만 볼 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  )
}

import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { cn } from '@/lib/utils'
import { Package, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MaterialPriceComparison } from '@/lib/api'

async function getMaterialPrices(): Promise<MaterialPriceComparison[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  try {
    const res = await fetch(`${base}/api/materials`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function changeColor(change: number | null) {
  if (change === null) return 'text-muted-foreground'
  if (change > 0) return 'text-up'
  if (change < 0) return 'text-down'
  return 'text-muted-foreground'
}

function ChangeIcon({ change }: { change: number | null }) {
  if (change === null || change === 0) return <Minus className="size-4" />
  if (change > 0) return <TrendingUp className="size-4" />
  return <TrendingDown className="size-4" />
}

function changeLabel(change: number | null) {
  if (change === null) return '변동 없음'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export default async function MaterialsInfoPage() {
  const materials = await getMaterialPrices()

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5 text-[15px]">
          <span className="text-muted-foreground">정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold">재료 시세</span>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-bold">재료 시세 (1주일 비교)</h1>
            <span className="text-[13px] text-muted-foreground">{materials.length}개 항목</span>
          </div>

          <div className="mb-4 rounded-lg border border-border bg-card px-4 py-2.5 text-[13px] text-muted-foreground">
            오늘 평균가와 1주일 전 평균가를 비교합니다. 거래소 API가 최근 2주치 일별
            시세를 제공해서, 정확히 7일 전 데이터가 없으면 가장 가까운 날짜로 비교합니다.
          </div>

          {materials.length === 0 && (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[13px] text-muted-foreground">
              등록된 재료 시세 정보가 없습니다.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary p-1.5">
                  {m.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.iconUrl} alt="" className="size-full object-contain" />
                  ) : (
                    <Package className="size-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{m.itemName}</p>
                  <p className="text-[16px] font-bold tabular-nums">
                    {m.currentPrice.toLocaleString('ko-KR')}
                    <span className="ml-1 text-[12px] font-normal text-muted-foreground">골드</span>
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    1주 전 {m.weekAgoPrice === null ? '—' : `${m.weekAgoPrice.toLocaleString('ko-KR')}골드`}
                  </p>
                </div>
                <div className={cn('flex flex-col items-center gap-0.5', changeColor(m.changePercent))}>
                  <ChangeIcon change={m.changePercent} />
                  <span className="text-[12.5px] font-semibold tabular-nums">
                    {changeLabel(m.changePercent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { cn } from '@/lib/utils'
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

function changeLabel(change: number | null) {
  if (change === null) return '—'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export default async function MaterialsInfoPage() {
  const materials = await getMaterialPrices()

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-[12px]">
          <span className="text-muted-foreground">정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">재료 시세</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
            오늘 평균가와 1주일 전 평균가를 비교합니다. 거래소 API가 최근 2주치 일별
            시세를 제공해서, 정확히 7일 전 데이터가 없으면 가장 가까운 날짜로 비교합니다.
          </div>

          <section className="overflow-hidden rounded-md border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="text-[12px] font-semibold">재료 시세 (1주일 비교)</h2>
              <span className="font-mono text-[11px] text-muted-foreground">
                {materials.length}개 항목
              </span>
            </header>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">아이템</th>
                  <th className="px-3 py-1.5 text-right font-medium">현재가</th>
                  <th className="px-3 py-1.5 text-right font-medium">1주일 전</th>
                  <th className="px-3 py-1.5 text-right font-medium">변동률</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-[11.5px] text-muted-foreground">
                      등록된 재료 시세 정보가 없습니다.
                    </td>
                  </tr>
                )}
                {materials.map((m) => (
                  <tr key={m.id} className="border-t border-border/60 hover:bg-secondary/50">
                    <td className="px-3 py-1.5">{m.itemName}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                      {m.currentPrice.toLocaleString('ko-KR')}
                      <span className="ml-1 text-[10px] text-muted-foreground">G</span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                      {m.weekAgoPrice === null ? '—' : m.weekAgoPrice.toLocaleString('ko-KR')}
                    </td>
                    <td className={cn('px-3 py-1.5 text-right font-mono tabular-nums', changeColor(m.changePercent))}>
                      {changeLabel(m.changePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  )
}

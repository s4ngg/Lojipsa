import { DashboardSidebar } from '@/components/dashboard-sidebar'
import type { GemPriceSnapshot } from '@/lib/api'

async function getGemPrices(): Promise<GemPriceSnapshot[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  try {
    const res = await fetch(`${base}/api/gems`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export default async function GemsInfoPage() {
  const gems = await getGemPrices()

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-[12px]">
          <span className="text-muted-foreground">정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">보석 시세</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
            보석은 거래소가 아니라 경매장에서 개별 매물로 거래돼서, 재료 시세처럼 일별 평균가
            이력이 없습니다. 등록된 매물 중 현재 최저 즉시구매가만 보여줍니다 (1주일 전 대비
            비교는 제공하지 않음).
          </div>

          <section className="overflow-hidden rounded-md border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="text-[12px] font-semibold">보석 시세 (최저 즉시구매가)</h2>
              <span className="font-mono text-[11px] text-muted-foreground">{gems.length}개 항목</span>
            </header>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">보석</th>
                  <th className="px-3 py-1.5 text-right font-medium">최저 즉시구매가</th>
                  <th className="px-3 py-1.5 text-right font-medium">등록 매물 수</th>
                </tr>
              </thead>
              <tbody>
                {gems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-[11.5px] text-muted-foreground">
                      등록된 보석 시세 정보가 없습니다.
                    </td>
                  </tr>
                )}
                {gems.map((g) => (
                  <tr key={g.id} className="border-t border-border/60 hover:bg-secondary/50">
                    <td className="px-3 py-1.5">{g.itemName}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                      {g.lowestBuyPrice === null ? (
                        <span className="text-muted-foreground">즉시구매 매물 없음</span>
                      ) : (
                        <>
                          {Math.round(g.lowestBuyPrice).toLocaleString('ko-KR')}
                          <span className="ml-1 text-[10px] text-muted-foreground">G</span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                      {g.listingCount.toLocaleString('ko-KR')}
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

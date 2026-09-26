import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Gem, Tag } from 'lucide-react'
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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5 text-[15px]">
          <span className="text-muted-foreground">정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold">보석 시세</span>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-bold">보석 시세 (최저 즉시구매가)</h1>
            <span className="text-[13px] text-muted-foreground">{gems.length}개 항목</span>
          </div>

          <div className="mb-4 rounded-lg border border-border bg-card px-4 py-2.5 text-[13px] text-muted-foreground">
            보석은 거래소가 아니라 경매장에서 개별 매물로 거래돼서, 재료 시세처럼 일별 평균가
            이력이 없습니다. 등록된 매물 중 현재 최저 즉시구매가만 보여줍니다 (1주일 전 대비
            비교는 제공하지 않음).
          </div>

          {gems.length === 0 && (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[13px] text-muted-foreground">
              등록된 보석 시세 정보가 없습니다.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gems.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <Gem className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{g.itemName}</p>
                  {g.lowestBuyPrice === null ? (
                    <p className="text-[13px] text-muted-foreground">즉시구매 매물 없음</p>
                  ) : (
                    <p className="text-[16px] font-bold tabular-nums">
                      {Math.round(g.lowestBuyPrice).toLocaleString('ko-KR')}
                      <span className="ml-1 text-[12px] font-normal text-muted-foreground">골드</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
                    <Tag className="size-3" />
                    매물 {g.listingCount.toLocaleString('ko-KR')}개
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

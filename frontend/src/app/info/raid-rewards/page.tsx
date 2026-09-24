import { DashboardSidebar } from '@/components/dashboard-sidebar'
import type { RaidReward } from '@/lib/api'

async function getRaidRewards(): Promise<RaidReward[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  try {
    const res = await fetch(`${base}/api/raid-rewards`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

export default async function RaidRewardsInfoPage() {
  const rewards = await getRaidRewards()

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-[12px]">
          <span className="text-muted-foreground">정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">레이드 보상</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <section className="overflow-hidden rounded-md border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="text-[12px] font-semibold">레이드별 주간 골드 보상</h2>
              <span className="font-mono text-[11px] text-muted-foreground">
                {rewards.length}개 항목
              </span>
            </header>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">레이드</th>
                  <th className="px-3 py-1.5 text-left font-medium">난이도</th>
                  <th className="px-3 py-1.5 text-right font-medium">최소 아이템레벨</th>
                  <th className="px-3 py-1.5 text-right font-medium">귀속 골드</th>
                  <th className="px-3 py-1.5 text-right font-medium">거래 가능 골드</th>
                  <th className="px-3 py-1.5 text-right font-medium">주간 제한</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-[11.5px] text-muted-foreground">
                      등록된 보상 정보가 없습니다.
                    </td>
                  </tr>
                )}
                {rewards.map((r) => (
                  <tr key={r.id} className="border-t border-border/60 hover:bg-secondary/50">
                    <td className="px-3 py-1.5">{r.raidName}</td>
                    <td className="px-3 py-1.5">{r.difficulty}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{r.minItemLevel}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt(r.boundGold)}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                      {fmt(r.tradableGold)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                      주 {r.weeklyLimitCount}회
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

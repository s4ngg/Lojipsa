import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { cn } from '@/lib/utils'
import { Gauge, Lock, Swords, ArrowLeftRight } from 'lucide-react'
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

function difficultyBadgeClass(difficulty: string) {
  if (difficulty.includes('나이트메어')) return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  if (difficulty.includes('익스트림')) return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  if (difficulty.includes('하드')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (difficulty.includes('단계')) return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
  return 'bg-secondary text-secondary-foreground border-border'
}

function groupByRaid(rewards: RaidReward[]) {
  const order: string[] = []
  const map = new Map<string, RaidReward[]>()
  for (const r of rewards) {
    if (!map.has(r.raidName)) {
      map.set(r.raidName, [])
      order.push(r.raidName)
    }
    map.get(r.raidName)!.push(r)
  }
  return order.map((name) => ({ raidName: name, rows: map.get(name)! }))
}

export default async function RaidRewardsInfoPage() {
  const rewards = await getRaidRewards()
  const groups = groupByRaid(rewards)

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5 text-[15px]">
          <span className="text-muted-foreground">정보</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold">레이드 보상</span>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-bold">레이드별 주간 골드 보상</h1>
            <span className="text-[13px] text-muted-foreground">{rewards.length}개 항목</span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-2.5 text-[13px]">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-gold-bound" />
              <span className="text-muted-foreground">귀속 골드 — 캐릭터/원정대 성장에만 사용</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="size-3.5 text-gold-tradable" />
              <span className="text-muted-foreground">거래 가능 골드 — 자유롭게 사용/거래</span>
            </span>
          </div>

          {groups.length === 0 && (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[13px] text-muted-foreground">
              등록된 보상 정보가 없습니다.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <section
                key={group.raidName}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <header className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
                  <Swords className="size-4 shrink-0 text-primary" />
                  <h2 className="text-[15px] font-semibold leading-tight">{group.raidName}</h2>
                </header>

                <ul className="divide-y divide-border/60">
                  {group.rows.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12.5px] font-medium',
                            difficultyBadgeClass(r.difficulty),
                          )}
                        >
                          {r.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                          <Gauge className="size-3.5" />
                          {r.minItemLevel} 이상
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold tabular-nums text-gold-bound">
                          <Lock className="size-4" />
                          {fmt(r.boundGold)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold tabular-nums text-gold-tradable">
                          <ArrowLeftRight className="size-4" />
                          {fmt(r.tradableGold)}
                        </span>
                        <span className="ml-auto text-[12px] text-muted-foreground">
                          주 {r.weeklyLimitCount}회
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

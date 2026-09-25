'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  UserAuthError,
  fetchMyRoster,
  fetchRaidRewards,
  type RaidReward,
  type RosterCharacter,
} from '@/lib/api'
import { useUserToken } from '@/lib/use-user-token'
import { DiscordLoginPrompt } from '@/components/discord-login-prompt'
import { cn } from '@/lib/utils'

type GoldMode = 'bound_and_tradable' | 'tradable_only'

type EligibleRaid = RaidReward & { goldForMode: number }

type CharacterGold = {
  character: RosterCharacter
  eligibleRaids: EligibleRaid[]
}

function goldValue(reward: RaidReward, mode: GoldMode): number {
  return mode === 'tradable_only' ? reward.tradableGold : reward.boundGold + reward.tradableGold
}

// raidName별로, 캐릭터의 아이템 레벨로 클리어 가능한 것들 중 minItemLevel이 가장 높은
// (=가장 상위 난이도) 한 줄만 남긴다. 같은 레이드의 여러 난이도를 동시에 계산하지 않기 위함.
function pickHighestDifficultyPerRaid(rewards: RaidReward[], itemAvgLevel: number): RaidReward[] {
  const byRaidName = new Map<string, RaidReward>()
  for (const r of rewards) {
    if (itemAvgLevel < r.minItemLevel) continue
    const existing = byRaidName.get(r.raidName)
    if (!existing || r.minItemLevel > existing.minItemLevel) {
      byRaidName.set(r.raidName, r)
    }
  }
  return [...byRaidName.values()]
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('ko-KR')
}

export function WeeklyGoldView() {
  const { token, ready: tokenReady, loginError, clearToken } = useUserToken()

  const [roster, setRoster] = useState<RosterCharacter[] | null>(null)
  const [rewards, setRewards] = useState<RaidReward[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<GoldMode>('bound_and_tradable')
  const [capInput, setCapInput] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([fetchMyRoster(token), fetchRaidRewards()])
      .then(([rosterData, rewardData]) => {
        setRoster(rosterData)
        setRewards(rewardData)
        setError(null)
      })
      .catch((e) => {
        if (e instanceof UserAuthError) {
          clearToken('로그인이 만료됐습니다. 다시 로그인해주세요.')
          return
        }
        setError('데이터를 불러오지 못했습니다')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const cap = capInput.trim() === '' ? null : Math.max(0, Number(capInput))

  const characterGolds: CharacterGold[] = useMemo(() => {
    if (!roster || !rewards) return []
    return roster
      .map((c) => {
        const eligibleRaids = pickHighestDifficultyPerRaid(rewards, c.itemAvgLevel)
          .map((r) => ({ ...r, goldForMode: goldValue(r, mode) }))
          .sort((a, b) => b.goldForMode - a.goldForMode)
        return { character: c, eligibleRaids }
      })
      .sort((a, b) => b.character.itemAvgLevel - a.character.itemAvgLevel)
  }, [roster, rewards, mode])

  function totalForCharacter(cg: CharacterGold): number {
    const included = cap === null ? cg.eligibleRaids : cg.eligibleRaids.slice(0, cap)
    return included.reduce((sum, r) => sum + r.goldForMode, 0)
  }

  const grandTotal = characterGolds.reduce((sum, cg) => sum + totalForCharacter(cg), 0)

  if (!tokenReady) {
    return <p className="text-[12px] text-muted-foreground">불러오는 중...</p>
  }

  if (!token) {
    return (
      <DiscordLoginPrompt
        error={loginError}
        description="디스코드로 로그인해서 공격대를 등록하면, 각 캐릭터가 클리어 가능한 레이드 기준으로 주간 골드를 계산해드려요."
      />
    )
  }

  if (loading) {
    return <p className="text-[12px] text-muted-foreground">불러오는 중...</p>
  }

  if (error) {
    return (
      <div className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">
        {error}
      </div>
    )
  }

  if (!roster || roster.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card px-4 py-6">
        <p className="text-[12px] text-muted-foreground">
          먼저{' '}
          <a href="/my" className="text-primary hover:underline">
            내 공격대
          </a>
          에서 대표 캐릭터를 등록해주세요.
        </p>
      </div>
    )
  }

  if (!rewards || rewards.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card px-4 py-6">
        <p className="text-[12px] text-muted-foreground">
          아직 등록된 레이드 보상 정보가 없습니다.{' '}
          <a href="/info/raid-rewards" className="text-primary hover:underline">
            레이드 보상
          </a>{' '}
          페이지에서 등록 현황을 확인해주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        캐릭터별로 아이템 레벨이 충족하는 레이드 중 난이도가 가장 높은 것 하나씩만 계산합니다.
        실제 게임의 주간 골드 지급 상한(레이드 개수 제한)은 직접 확인해서 아래 "상위 N개만
        합산"에 입력해주세요 — 비워두면 등록된 레이드 전체를 합산합니다.
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5">
        <div className="flex overflow-hidden rounded-sm border border-border">
          <button
            type="button"
            onClick={() => setMode('bound_and_tradable')}
            className={cn(
              'px-2.5 py-1 text-[11px]',
              mode === 'bound_and_tradable'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-secondary/60',
            )}
          >
            귀속+거래가능
          </button>
          <button
            type="button"
            onClick={() => setMode('tradable_only')}
            className={cn(
              'border-l border-border px-2.5 py-1 text-[11px]',
              mode === 'tradable_only' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/60',
            )}
          >
            거래가능위주
          </button>
        </div>

        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          상위
          <input
            type="number"
            min={0}
            value={capInput}
            onChange={(e) => setCapInput(e.target.value)}
            placeholder="전체"
            className="h-6 w-14 rounded-sm border border-border bg-background px-1.5 text-center font-mono text-[11px] outline-none focus:border-primary"
          />
          개 레이드만 합산 (비워두면 전체)
        </label>
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[11px] text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">캐릭터</th>
              <th className="px-3 py-1.5 text-left font-medium">레이드</th>
              <th className="px-3 py-1.5 text-right font-medium">골드</th>
            </tr>
          </thead>
          <tbody>
            {characterGolds.map((cg) => {
              const included =
                cap === null ? cg.eligibleRaids.length : Math.min(cap, cg.eligibleRaids.length)
              return (
                <Fragment key={cg.character.id}>
                  <tr className="border-t border-border bg-secondary/30">
                    <td colSpan={2} className="px-3 py-1.5 font-medium">
                      {cg.character.characterName}
                      <span className="ml-1.5 font-mono text-[10.5px] text-muted-foreground">
                        Lv.{cg.character.itemAvgLevel.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums font-semibold">
                      {fmt(totalForCharacter(cg))}G
                    </td>
                  </tr>
                  {cg.eligibleRaids.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-1.5 pl-6 text-[11px] text-muted-foreground">
                        클리어 가능한 등록된 레이드가 없습니다
                      </td>
                    </tr>
                  )}
                  {cg.eligibleRaids.map((r, i) => (
                    <tr
                      key={r.id}
                      className={cn('border-t border-border/40', i >= included && 'opacity-40')}
                    >
                      <td className="px-3 py-1 pl-6" />
                      <td className="px-3 py-1 text-muted-foreground">
                        {r.raidName} · {r.difficulty}
                        {i >= included && (
                          <span className="ml-1.5 text-[10px]">(상위 {cap}개 제외)</span>
                        )}
                      </td>
                      <td className="px-3 py-1 text-right font-mono tabular-nums text-muted-foreground">
                        {fmt(r.goldForMode)}G
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-secondary/50">
              <td colSpan={2} className="px-3 py-2 font-semibold">
                전체 합계
              </td>
              <td className="px-3 py-2 text-right font-mono text-base font-bold tabular-nums">
                {fmt(grandTotal)}G
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  )
}

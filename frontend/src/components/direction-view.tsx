'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  UserAuthError,
  fetchMyRoster,
  requestDirectionRecommendation,
  type DirectionResult,
  type RosterCharacter,
} from '@/lib/api'
import { useUserToken } from '@/lib/use-user-token'
import { DiscordLoginPrompt } from '@/components/discord-login-prompt'
import { cn } from '@/lib/utils'

function fmt(n: number) {
  return Math.round(n).toLocaleString('ko-KR')
}

export function DirectionView() {
  const { token, ready: tokenReady, loginError, clearToken } = useUserToken()

  const [roster, setRoster] = useState<RosterCharacter[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [characterId, setCharacterId] = useState<number | null>(null)
  const [honingCost, setHoningCost] = useState('')
  const [targetLevel, setTargetLevel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<DirectionResult | null>(null)

  function handleAuthError() {
    clearToken('로그인이 만료됐습니다. 다시 로그인해주세요.')
  }

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchMyRoster(token)
      .then((data) => {
        setRoster(data)
        if (data.length > 0) {
          const highest = [...data].sort((a, b) => b.itemAvgLevel - a.itemAvgLevel)[0]
          setCharacterId((prev) => prev ?? highest.id)
        }
        setError(null)
      })
      .catch((e) => {
        if (e instanceof UserAuthError) {
          handleAuthError()
          return
        }
        setError('공격대 정보를 불러오지 못했습니다')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token || characterId === null) return
    const cost = Number(honingCost)
    if (!cost || cost <= 0) {
      setSubmitError('예상 강화 비용을 입력해주세요')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    setResult(null)
    try {
      const data = await requestDirectionRecommendation(token, {
        characterId,
        honingCostGold: cost,
        targetItemLevel: targetLevel.trim() ? Number(targetLevel) : undefined,
      })
      setResult(data)
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setSubmitError(e instanceof Error ? e.message : '추천 요청에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  if (!tokenReady) {
    return <p className="text-[12px] text-muted-foreground">불러오는 중...</p>
  }

  if (!token) {
    return (
      <DiscordLoginPrompt
        error={loginError}
        description="디스코드로 로그인해서 공격대를 등록하면, 캐릭터별로 지금 강화를 밀어붙일지 주차하며 기다릴지 AI 추천을 받을 수 있어요."
      />
    )
  }

  if (loading) {
    return <p className="text-[12px] text-muted-foreground">불러오는 중...</p>
  }

  if (error) {
    return (
      <div className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">{error}</div>
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

  const sortedRoster = [...roster].sort((a, b) => b.itemAvgLevel - a.itemAvgLevel)

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        선택한 캐릭터의 현재/목표 레벨 기준 주간 거래 가능 골드 차이와 입력한 강화 비용을 바탕으로,
        지금 강화를 진행하는 게 나을지 당분간 주차하는 게 나을지 AI가 추천해줍니다. 강화 성공률·재료
        비용은 패치마다 바뀌어서 직접 확인한 예상 비용을 입력해주세요.
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-md border border-border bg-card px-3 py-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">캐릭터</label>
          <select
            value={characterId ?? ''}
            onChange={(e) => setCharacterId(Number(e.target.value))}
            className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] outline-none focus:border-primary"
          >
            {sortedRoster.map((c) => (
              <option key={c.id} value={c.id}>
                {c.characterName} (Lv.{c.itemAvgLevel.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[11px] text-muted-foreground">목표 레벨까지 예상 강화 비용(골드)</label>
            <input
              type="number"
              min={0}
              value={honingCost}
              onChange={(e) => setHoningCost(e.target.value)}
              placeholder="예: 5000000"
              className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[11px] text-muted-foreground">목표 아이템 레벨 (비워두면 자동)</label>
            <input
              type="number"
              min={0}
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              placeholder="예: 1730"
              className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] outline-none focus:border-primary"
            />
          </div>
        </div>

        {submitError && <p className="text-[11px] text-down">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting || characterId === null}
          className="h-8 self-start rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? 'AI 추천 받는 중...' : 'AI 추천 받기'}
        </button>
      </form>

      {result && (
        <section className="flex flex-col gap-3 rounded-md border border-border bg-card px-3 py-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-4">
            <div>
              <p className="text-[10.5px] text-muted-foreground">현재</p>
              <p className="font-mono tabular-nums">Lv.{result.currentItemLevel.toFixed(2)}</p>
              <p className="font-mono tabular-nums text-muted-foreground">
                {fmt(result.currentWeeklyTradableGold)}G/주
              </p>
            </div>
            <div>
              <p className="text-[10.5px] text-muted-foreground">목표</p>
              <p className="font-mono tabular-nums">Lv.{result.targetItemLevel}</p>
              <p className="font-mono tabular-nums text-muted-foreground">
                {fmt(result.targetWeeklyTradableGold)}G/주
              </p>
            </div>
            <div>
              <p className="text-[10.5px] text-muted-foreground">주당 증가분</p>
              <p
                className={cn(
                  'font-mono tabular-nums',
                  result.weeklyGoldGain > 0 ? 'text-up' : 'text-muted-foreground',
                )}
              >
                {result.weeklyGoldGain >= 0 ? '+' : ''}
                {fmt(result.weeklyGoldGain)}G
              </p>
            </div>
            <div>
              <p className="text-[10.5px] text-muted-foreground">예상 강화 비용</p>
              <p className="font-mono tabular-nums">{fmt(result.honingCostGold)}G</p>
            </div>
          </div>

          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5">
            <p className="mb-1 text-[10.5px] font-medium text-primary">AI 추천</p>
            <p className="whitespace-pre-line text-[12.5px] leading-relaxed">{result.recommendation}</p>
          </div>
        </section>
      )}
    </div>
  )
}

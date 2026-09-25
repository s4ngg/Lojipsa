'use client'

import { useEffect, useState } from 'react'
import {
  UserAuthError,
  deleteHomeworkItem,
  fetchHomework,
  fetchMyRoster,
  fetchRaidRewards,
  setupHomework,
  toggleHomeworkItem,
  type HomeworkItem,
  type HomeworkSetupMode,
  type RaidReward,
  type RosterCharacter,
} from '@/lib/api'
import { useUserToken } from '@/lib/use-user-token'
import { DiscordLoginPrompt } from '@/components/discord-login-prompt'
import { cn } from '@/lib/utils'

function fmt(n: number) {
  return Math.round(n).toLocaleString('ko-KR')
}

function selectionKey(raidName: string, difficulty: string) {
  return `${raidName}|${difficulty}`
}

export function HomeworkView() {
  const { token, ready: tokenReady, loginError, clearToken } = useUserToken()

  const [roster, setRoster] = useState<RosterCharacter[] | null>(null)
  const [items, setItems] = useState<HomeworkItem[] | null>(null)
  const [raidRewards, setRaidRewards] = useState<RaidReward[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [setupPanelFor, setSetupPanelFor] = useState<number | null>(null)
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set())
  const [setupError, setSetupError] = useState<string | null>(null)

  function handleAuthError() {
    setItems(null)
    clearToken('로그인이 만료됐습니다. 다시 로그인해주세요.')
  }

  async function load(currentToken: string) {
    setLoading(true)
    try {
      const [rosterData, homeworkData, rewardData] = await Promise.all([
        fetchMyRoster(currentToken),
        fetchHomework(currentToken),
        fetchRaidRewards(),
      ])
      setRoster(rosterData)
      setItems(homeworkData)
      setRaidRewards(rewardData)
      setError(null)
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setError('불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function runAutoSetup(characterId: number, mode: HomeworkSetupMode) {
    if (!token) return
    setBusy(true)
    setSetupError(null)
    try {
      await setupHomework(token, { characterId, mode })
      await load(token)
      setSetupPanelFor(null)
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setSetupError(e instanceof Error ? e.message : '설정 실패')
    } finally {
      setBusy(false)
    }
  }

  function openManualSetup(characterId: number) {
    setSetupPanelFor(characterId)
    setSetupError(null)
    const current = (items ?? []).filter((i) => i.characterId === characterId)
    setManualSelected(new Set(current.map((i) => selectionKey(i.raidName, i.difficulty))))
  }

  function toggleManualSelection(key: string) {
    setManualSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function submitManualSetup(characterId: number) {
    if (!token) return
    if (manualSelected.size === 0) {
      setSetupError('최소 1개 이상 선택해주세요')
      return
    }
    setBusy(true)
    setSetupError(null)
    try {
      const manualSelections = [...manualSelected].map((key) => {
        const [raidName, difficulty] = key.split('|')
        return { raidName, difficulty }
      })
      await setupHomework(token, { characterId, mode: 'MANUAL', manualSelections })
      await load(token)
      setSetupPanelFor(null)
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setSetupError(e instanceof Error ? e.message : '설정 실패')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleItem(id: number) {
    if (!token) return
    try {
      const updated = await toggleHomeworkItem(token, id)
      setItems((prev) => (prev ?? []).map((i) => (i.id === id ? updated : i)))
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setError('처리 실패')
    }
  }

  async function handleDeleteItem(id: number) {
    if (!token) return
    try {
      await deleteHomeworkItem(token, id)
      setItems((prev) => (prev ?? []).filter((i) => i.id !== id))
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setError('삭제 실패')
    }
  }

  if (!tokenReady) {
    return <p className="text-[12px] text-muted-foreground">불러오는 중...</p>
  }

  if (!token) {
    return (
      <DiscordLoginPrompt
        error={loginError}
        description="디스코드로 로그인해서 공격대를 등록하면, 캐릭터별로 매주 클리어할 레이드 체크리스트를 관리할 수 있어요."
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

  const itemsByCharacter = new Map<number, HomeworkItem[]>()
  for (const item of items ?? []) {
    const list = itemsByCharacter.get(item.characterId) ?? []
    list.push(item)
    itemsByCharacter.set(item.characterId, list)
  }

  const sortedRoster = [...roster].sort((a, b) => b.itemAvgLevel - a.itemAvgLevel)

  return (
    <div className="flex flex-col gap-3">
      {raidRewards.length === 0 && (
        <div className="rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
          아직 등록된 레이드 보상 정보가 없어서 자동 설정을 쓸 수 없습니다.{' '}
          <a href="/info/raid-rewards" className="text-primary hover:underline">
            레이드 보상
          </a>{' '}
          페이지에서 등록 현황을 확인해주세요.
        </div>
      )}

      {sortedRoster.map((c) => {
        const characterItems = itemsByCharacter.get(c.id) ?? []
        const isSetupOpen = setupPanelFor === c.id
        const totalGold = characterItems
          .filter((i) => i.completedThisWeek)
          .reduce((sum, i) => sum + i.boundGold + i.tradableGold, 0)

        return (
          <section key={c.id} className="overflow-hidden rounded-md border border-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium">{c.characterName}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  Lv.{c.itemAvgLevel.toFixed(2)}
                </span>
                {characterItems.length > 0 && (
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    ({fmt(totalGold)}G 완료)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => runAutoSetup(c.id, 'AUTO_BOUND_AND_TRADABLE')}
                  disabled={busy || raidRewards.length === 0}
                  className="h-6 rounded-sm border border-border px-2 text-[10.5px] hover:bg-secondary/60 disabled:opacity-50"
                >
                  자동(귀속+거래가능)
                </button>
                <button
                  type="button"
                  onClick={() => runAutoSetup(c.id, 'AUTO_TRADABLE_ONLY')}
                  disabled={busy || raidRewards.length === 0}
                  className="h-6 rounded-sm border border-border px-2 text-[10.5px] hover:bg-secondary/60 disabled:opacity-50"
                >
                  자동(거래가능위주)
                </button>
                <button
                  type="button"
                  onClick={() => (isSetupOpen ? setSetupPanelFor(null) : openManualSetup(c.id))}
                  disabled={busy}
                  className="h-6 rounded-sm border border-border px-2 text-[10.5px] hover:bg-secondary/60 disabled:opacity-50"
                >
                  {isSetupOpen ? '취소' : '수동 설정'}
                </button>
              </div>
            </header>

            {isSetupOpen && (
              <div className="border-b border-border bg-secondary/20 px-3 py-2.5">
                {raidRewards.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">선택할 수 있는 레이드가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {raidRewards.map((r) => {
                      const key = selectionKey(r.raidName, r.difficulty)
                      return (
                        <label key={key} className="flex items-center gap-1.5 text-[11px]">
                          <input
                            type="checkbox"
                            checked={manualSelected.has(key)}
                            onChange={() => toggleManualSelection(key)}
                          />
                          {r.raidName} · {r.difficulty}
                        </label>
                      )
                    })}
                  </div>
                )}
                {setupError && <p className="mt-1.5 text-[11px] text-down">{setupError}</p>}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => submitManualSetup(c.id)}
                    disabled={busy || raidRewards.length === 0}
                    className="h-6 rounded-sm bg-primary px-2.5 text-[10.5px] font-medium text-primary-foreground disabled:opacity-50"
                  >
                    적용
                  </button>
                </div>
              </div>
            )}

            {characterItems.length === 0 && !isSetupOpen && (
              <p className="px-3 py-3 text-[11.5px] text-muted-foreground">
                설정된 숙제가 없습니다. 위 버튼으로 설정해주세요.
              </p>
            )}

            {characterItems.length > 0 && (
              <ul className="divide-y divide-border/60">
                {characterItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-3 py-1.5 text-[12px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completedThisWeek}
                        onChange={() => handleToggleItem(item.id)}
                      />
                      <span className={cn(item.completedThisWeek && 'text-muted-foreground line-through')}>
                        {item.raidName} · {item.difficulty}
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {fmt(item.boundGold + item.tradableGold)}G
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[11px] text-down hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

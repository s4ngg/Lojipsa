'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  UserAuthError,
  fetchMyRoster,
  refreshMyRoster,
  registerRepresentativeCharacter,
  type RosterCharacter,
} from '@/lib/api'
import { useUserToken } from '@/lib/use-user-token'
import { DiscordLoginPrompt } from '@/components/discord-login-prompt'

function fmtItemLevel(n: number) {
  return n.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR')
}

export function MyRosterView() {
  const { token, ready: tokenReady, loginError, clearToken } = useUserToken()

  const [roster, setRoster] = useState<RosterCharacter[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  function handleAuthError() {
    setRoster(null)
    clearToken('로그인이 만료됐습니다. 다시 로그인해주세요.')
  }

  async function load(currentToken: string) {
    setLoading(true)
    try {
      const data = await fetchMyRoster(currentToken)
      setRoster(data)
      setError(null)
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setError('공격대 정보를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    if (!token || !nameInput.trim()) return
    setRegistering(true)
    setRegisterError(null)
    try {
      const data = await registerRepresentativeCharacter(token, nameInput.trim())
      setRoster(data)
      setShowRegisterForm(false)
      setNameInput('')
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setRegisterError(e instanceof Error ? e.message : '등록에 실패했습니다')
    } finally {
      setRegistering(false)
    }
  }

  async function handleRefresh() {
    if (!token) return
    setRefreshing(true)
    setError(null)
    try {
      const data = await refreshMyRoster(token)
      setRoster(data)
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setError(e instanceof Error ? e.message : '갱신에 실패했습니다')
    } finally {
      setRefreshing(false)
    }
  }

  if (!tokenReady) {
    return <p className="text-[12px] text-muted-foreground">불러오는 중...</p>
  }

  if (!token) {
    return (
      <DiscordLoginPrompt
        error={loginError}
        description="디스코드로 로그인하면 대표 캐릭터 1명을 등록해서, 계정에 있는 모든 캐릭터를 한 번에 불러올 수 있어요."
      />
    )
  }

  const sortedRoster = roster ? [...roster].sort((a, b) => b.itemAvgLevel - a.itemAvgLevel) : []
  const lastRefreshedAt = sortedRoster[0]?.lastRefreshedAt

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">
          {error}
        </div>
      )}

      {loading && <p className="text-[12px] text-muted-foreground">불러오는 중...</p>}

      {!loading && sortedRoster.length === 0 && !showRegisterForm && (
        <div className="rounded-md border border-border bg-card px-4 py-6">
          <p className="mb-3 text-[12px] text-muted-foreground">
            아직 등록된 대표 캐릭터가 없습니다. 대표 캐릭터를 등록하면 같은 계정의
            캐릭터를 전부 불러옵니다.
          </p>
          <button
            type="button"
            onClick={() => setShowRegisterForm(true)}
            className="h-8 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90"
          >
            대표 캐릭터 등록
          </button>
        </div>
      )}

      {!loading && sortedRoster.length > 0 && !showRegisterForm && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] text-muted-foreground">
            {lastRefreshedAt && `마지막 갱신 ${fmtTime(lastRefreshedAt)}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRegisterForm(true)}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              대표 캐릭터 변경
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-7 rounded-sm border border-border px-2.5 text-[11px] font-medium hover:bg-secondary/60 disabled:opacity-50"
            >
              {refreshing ? '갱신 중...' : '갱신'}
            </button>
          </div>
        </div>
      )}

      {showRegisterForm && (
        <form
          onSubmit={handleRegister}
          className="flex flex-col gap-2 rounded-md border border-border bg-card px-3 py-3"
        >
          <label className="text-[11px] text-muted-foreground">대표 캐릭터명</label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="예: 쌍양갱"
              className="h-8 flex-1 rounded-sm border border-border bg-background px-2 text-[12px] outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={registering || nameInput.trim().length === 0}
              className="h-8 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
            >
              {registering ? '등록 중...' : '등록'}
            </button>
            {sortedRoster.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowRegisterForm(false)
                  setRegisterError(null)
                }}
                className="h-8 rounded-sm border border-border px-3 text-[12px] hover:bg-secondary/60"
              >
                취소
              </button>
            )}
          </div>
          {registerError && <p className="text-[11px] text-down">{registerError}</p>}
        </form>
      )}

      {!loading && sortedRoster.length > 0 && (
        <section className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="px-3 py-1.5 text-left font-medium">서버</th>
                <th className="px-3 py-1.5 text-left font-medium">캐릭터명</th>
                <th className="px-3 py-1.5 text-left font-medium">직업</th>
                <th className="px-3 py-1.5 text-right font-medium">아이템 레벨</th>
              </tr>
            </thead>
            <tbody>
              {sortedRoster.map((c) => (
                <tr key={c.id} className="border-t border-border/60 hover:bg-secondary/50">
                  <td className="px-3 py-1.5 text-muted-foreground">{c.serverName}</td>
                  <td className="px-3 py-1.5 font-medium">{c.characterName}</td>
                  <td className="px-3 py-1.5">{c.characterClassName}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                    {fmtItemLevel(c.itemAvgLevel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

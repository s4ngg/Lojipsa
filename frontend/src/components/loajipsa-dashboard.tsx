'use client'

import { useEffect, useState } from 'react'
import { AdminAuthError, fetchAdminStatus, type AgentStatus } from '@/lib/api'
import { LoajipsaPanel } from '@/components/loajipsa-panel'

const POLL_INTERVAL_MS = 30_000

function formatRelative(iso: string | null): string {
  if (!iso) return '기록 없음'
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return '방금 전'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.round(minutes / 60)
  return `${hours}시간 전`
}

function formatCountdown(lastCheckedAt: string | null, intervalSeconds: number): string {
  if (!lastCheckedAt || intervalSeconds <= 0) return '--:--'
  const elapsed = (Date.now() - new Date(lastCheckedAt).getTime()) / 1000
  const remaining = Math.max(0, Math.round(intervalSeconds - (elapsed % intervalSeconds)))
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function LoajipsaDashboard({
  token,
  onAuthError,
}: {
  token: string
  onAuthError: () => void
}) {
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchAdminStatus(token)
        if (!cancelled) {
          setStatus(data)
          setError(null)
        }
      } catch (e) {
        if (cancelled) return
        if (e instanceof AdminAuthError) {
          onAuthError()
          return
        }
        setError('백엔드에 연결할 수 없습니다')
      }
    }

    load()
    const pollId = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(pollId)
    }
  }, [token, onAuthError])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-muted-foreground">관리자</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">로아집사</span>
          {status && !error && (
            <span className="ml-1 flex items-center gap-1 text-[11px] text-up">
              <span className="size-1.5 rounded-full bg-up" />
              운영중
            </span>
          )}
          {error && (
            <span className="ml-1 flex items-center gap-1 text-[11px] text-down">
              <span className="size-1.5 rounded-full bg-down" />
              연결 안 됨
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          마지막 확인 {formatRelative(status?.lastCheckedAt ?? null)}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">
            {error} — 백엔드(localhost:8080)가 실행 중인지 확인해주세요.
          </div>
        )}
        {!error && !status && (
          <div className="text-[12px] text-muted-foreground">불러오는 중...</div>
        )}
        {status && (
          <LoajipsaPanel
            watchedItems={status.watchedItems}
            recentActivity={status.recentActivity}
            countdownLabel={formatCountdown(status.lastCheckedAt, status.checkIntervalSeconds)}
            countdownActive={!error}
          />
        )}
      </div>
    </>
  )
}

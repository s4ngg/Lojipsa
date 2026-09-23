'use client'

import { useEffect, useState } from 'react'
import { AdminAuthError, fetchNoticeStatus, type NoticeStatus } from '@/lib/api'
import { NoticesPanel } from '@/components/notices-panel'

const POLL_INTERVAL_MS = 30_000

export function NoticesDashboard({
  token,
  onAuthError,
}: {
  token: string
  onAuthError: () => void
}) {
  const [status, setStatus] = useState<NoticeStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchNoticeStatus(token)
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

  return (
    <>
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-muted-foreground">관리자</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">공지 요약</span>
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
          <NoticesPanel watchedTypes={status.watchedTypes} recentActivity={status.recentActivity} />
        )}
      </div>
    </>
  )
}

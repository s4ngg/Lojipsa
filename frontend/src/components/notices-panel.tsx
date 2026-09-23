import type { ActivityLogEntry } from '@/lib/api'

function formatLogTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function NoticesPanel({
  watchedTypes,
  recentActivity,
}: {
  watchedTypes: string[]
  recentActivity: ActivityLogEntry[]
}) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-[12px] font-semibold">감시 유형</h2>
        </header>
        <ul className="divide-y divide-border/60">
          {watchedTypes.map((type) => (
            <li key={type} className="px-3 py-2 text-[12px]">
              {type}
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          Claude Haiku로 요약 · 요약 실패 시 제목+링크로 자동 폴백
        </p>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card lg:col-span-2">
        <header className="border-b border-border px-3 py-2">
          <h2 className="text-[12px] font-semibold">최근 발송 로그</h2>
        </header>
        <ul className="divide-y divide-border/60">
          {recentActivity.length === 0 && (
            <li className="px-3 py-3 text-[11.5px] text-muted-foreground">
              아직 기록이 없습니다.
            </li>
          )}
          {recentActivity.map((log, i) => (
            <li key={i} className="flex gap-2.5 px-3 py-2">
              <span className="font-mono text-[11px] text-primary">{formatLogTime(log.at)}</span>
              <span className="whitespace-pre-line text-[11.5px] leading-snug text-foreground/90">
                {log.message}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

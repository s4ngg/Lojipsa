import { cn } from '@/lib/utils'
import type { ActivityLogEntry, WatchedItem } from '@/lib/api'

function changeColor(change: number | null) {
  if (change === null) return 'text-muted-foreground'
  if (change > 0) return 'text-up'
  if (change < 0) return 'text-down'
  return 'text-muted-foreground'
}

function changeLabel(change: number | null) {
  if (change === null) return '—'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

function formatLogTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function LoajipsaPanel({
  watchedItems,
  recentActivity,
  countdownLabel,
  countdownActive,
}: {
  watchedItems: WatchedItem[]
  recentActivity: ActivityLogEntry[]
  countdownLabel: string
  countdownActive: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* 감시 아이템 테이블 */}
      <section className="overflow-hidden rounded-md border border-border bg-card lg:col-span-2">
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-[12px] font-semibold">감시 아이템</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {watchedItems.length}개 · 거래소 KR
          </span>
        </header>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[11px] text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">아이템</th>
              <th className="px-3 py-1.5 text-right font-medium">현재가</th>
              <th className="px-3 py-1.5 text-right font-medium">변동률</th>
            </tr>
          </thead>
          <tbody>
            {watchedItems.map((item) => (
              <tr
                key={item.name}
                className="border-t border-border/60 hover:bg-secondary/50"
              >
                <td className="px-3 py-1.5">{item.name}</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                  {item.price}
                  <span className="ml-1 text-[10px] text-muted-foreground">G</span>
                </td>
                <td
                  className={cn(
                    'px-3 py-1.5 text-right font-mono tabular-nums',
                    changeColor(item.changePercent),
                  )}
                >
                  {changeLabel(item.changePercent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 우측: 상태 + 로그 */}
      <div className="flex flex-col gap-3">
        {/* 다음 체크 카운트다운 */}
        <section className="rounded-md border border-border bg-card px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              다음 시세 체크까지
            </span>
            <span
              className={cn(
                'flex items-center gap-1.5 text-[11px]',
                countdownActive ? 'text-up' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  countdownActive ? 'animate-pulse bg-up' : 'bg-muted-foreground',
                )}
              />
              {countdownActive ? '감시 중' : '대기 중'}
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {countdownLabel}
          </p>
        </section>

        {/* 최근 발송 로그 */}
        <section className="flex-1 overflow-hidden rounded-md border border-border bg-card">
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
                <span className="font-mono text-[11px] text-primary">
                  {formatLogTime(log.at)}
                </span>
                <span className="text-[11.5px] leading-snug text-foreground/90">
                  {log.message}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

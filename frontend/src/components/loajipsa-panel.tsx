'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Item = {
  name: string
  price: string
  change: number
}

const watched: Item[] = [
  { name: '1레벨 멸화의 보석', price: '41.5', change: 5.7 },
  { name: '1레벨 홍염의 보석', price: '12.8', change: 2.1 },
  { name: '운명의 파괴석', price: '2.94', change: -1.8 },
  { name: '운명의 수호석', price: '1.02', change: -0.6 },
  { name: '아비도스 융화 재료', price: '32.6', change: 0.9 },
  { name: '정제된 파괴강석', price: '8.75', change: -3.2 },
  { name: '오레하 융화 재료', price: '4.10', change: 0.0 },
]

const logs: { time: string; text: string }[] = [
  { time: '06:00', text: '오늘 숙제 알림 발송 완료 (카오스·가디언·큐브)' },
  { time: '05:12', text: '멸화의 보석 목표가 42G 도달 — 알림 발송' },
  { time: '04:00', text: '거래소 시세 스냅샷 갱신 (7개 항목)' },
  { time: '00:00', text: '일일 리셋 감지 — 숙제 목록 초기화' },
]

const CHECK_INTERVAL = 10 * 60 // 10분 주기

function fmt(n: number) {
  const m = Math.floor(n / 60)
  const s = n % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function changeColor(change: number) {
  if (change > 0) return 'text-up'
  if (change < 0) return 'text-down'
  return 'text-muted-foreground'
}

function changeLabel(change: number) {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export function LoajipsaPanel() {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    setRemaining(CHECK_INTERVAL - (Math.floor(Date.now() / 1000) % CHECK_INTERVAL))
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return prev
        return prev <= 1 ? CHECK_INTERVAL : prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* 감시 아이템 테이블 */}
      <section className="overflow-hidden rounded-md border border-border bg-card lg:col-span-2">
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-[12px] font-semibold">감시 아이템</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {watched.length}개 · 거래소 KR
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
            {watched.map((item) => (
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
                    changeColor(item.change),
                  )}
                >
                  {changeLabel(item.change)}
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
            <span className="flex items-center gap-1.5 text-[11px] text-up">
              <span className="size-1.5 animate-pulse rounded-full bg-up" />
              감시 중
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {remaining === null ? '--:--' : fmt(remaining)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            10분 주기 · 마지막 확인 2분 전
          </p>
        </section>

        {/* 최근 발송 로그 */}
        <section className="flex-1 overflow-hidden rounded-md border border-border bg-card">
          <header className="border-b border-border px-3 py-2">
            <h2 className="text-[12px] font-semibold">최근 발송 로그</h2>
          </header>
          <ul className="divide-y divide-border/60">
            {logs.map((log, i) => (
              <li key={i} className="flex gap-2.5 px-3 py-2">
                <span className="font-mono text-[11px] text-primary">
                  {log.time}
                </span>
                <span className="text-[11.5px] leading-snug text-foreground/90">
                  {log.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

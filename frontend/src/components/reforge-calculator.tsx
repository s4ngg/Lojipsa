'use client'

import { useState } from 'react'

type Stage = {
  id: number
  label: string
  successRate: number
  costPerAttempt: number
}

let nextId = 4

const initialStages: Stage[] = [
  { id: 1, label: '예시 1단계', successRate: 70, costPerAttempt: 500 },
  { id: 2, label: '예시 2단계', successRate: 40, costPerAttempt: 1200 },
  { id: 3, label: '예시 3단계', successRate: 15, costPerAttempt: 3000 },
]

function expectedAttempts(successRatePercent: number): number {
  if (successRatePercent <= 0) return Infinity
  return 100 / successRatePercent
}

function fmt(n: number) {
  if (!isFinite(n)) return '—'
  return n.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
}

export function ReforgeCalculator() {
  const [stages, setStages] = useState<Stage[]>(initialStages)

  function updateStage(id: number, patch: Partial<Stage>) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addStage() {
    setStages((prev) => [
      ...prev,
      { id: nextId++, label: `${prev.length + 1}단계`, successRate: 50, costPerAttempt: 1000 },
    ])
  }

  function removeStage(id: number) {
    setStages((prev) => prev.filter((s) => s.id !== id))
  }

  const rows = stages.map((s) => {
    const attempts = expectedAttempts(s.successRate)
    const cost = isFinite(attempts) ? attempts * s.costPerAttempt : Infinity
    return { ...s, attempts, cost }
  })

  const totalAttempts = rows.reduce((sum, r) => sum + (isFinite(r.attempts) ? r.attempts : 0), 0)
  const totalCost = rows.reduce((sum, r) => sum + (isFinite(r.cost) ? r.cost : 0), 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        단계별 성공 확률과 1회 시도 비용을 입력하면 기댓값 기준 예상 시도 횟수·비용을 계산합니다.
        (단순 기하분포 계산이며 확률 상승 같은 픽업 구조는 반영하지 않습니다. 실제 확률/재료 비용은
        직접 확인해서 입력해주세요 — 아래 값은 예시입니다.)
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[11px] text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">단계</th>
              <th className="px-3 py-1.5 text-right font-medium">성공 확률(%)</th>
              <th className="px-3 py-1.5 text-right font-medium">회당 비용(골드)</th>
              <th className="px-3 py-1.5 text-right font-medium">예상 시도</th>
              <th className="px-3 py-1.5 text-right font-medium">예상 비용</th>
              <th className="px-3 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/60">
                <td className="px-3 py-1.5">
                  <input
                    value={row.label}
                    onChange={(e) => updateStage(row.id, { label: e.target.value })}
                    className="w-full bg-transparent text-[12px] outline-none"
                  />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.successRate}
                    onChange={(e) => updateStage(row.id, { successRate: Number(e.target.value) })}
                    className="w-16 bg-transparent text-right font-mono text-[12px] outline-none"
                  />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min={0}
                    value={row.costPerAttempt}
                    onChange={(e) => updateStage(row.id, { costPerAttempt: Number(e.target.value) })}
                    className="w-24 bg-transparent text-right font-mono text-[12px] outline-none"
                  />
                </td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                  {fmt(row.attempts)}회
                </td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt(row.cost)}G</td>
                <td className="px-3 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeStage(row.id)}
                    className="text-[11px] text-down hover:underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-border px-3 py-2">
          <button type="button" onClick={addStage} className="text-[11px] text-primary hover:underline">
            + 단계 추가
          </button>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card px-3 py-2.5">
        <span className="text-[11px] text-muted-foreground">전체 예상 비용</span>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {fmt(totalCost)}
          <span className="ml-1 text-[13px] text-muted-foreground">골드</span>
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          총 {fmt(totalAttempts)}회 시도 예상
        </p>
      </section>
    </div>
  )
}

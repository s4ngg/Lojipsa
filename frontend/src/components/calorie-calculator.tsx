'use client'

import { useState } from 'react'

type Sex = 'male' | 'female'

type ActivityLevel = {
  id: string
  label: string
  multiplier: number
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  { id: 'sedentary', label: '거의 운동 안함 (주로 앉아서 생활)', multiplier: 1.2 },
  { id: 'light', label: '가벼운 활동 (주 1~3일 운동)', multiplier: 1.375 },
  { id: 'moderate', label: '보통 활동 (주 3~5일 운동)', multiplier: 1.55 },
  { id: 'active', label: '활발한 활동 (주 6~7일 운동)', multiplier: 1.725 },
  { id: 'very_active', label: '매우 활발 (매일 고강도 운동/육체노동)', multiplier: 1.9 },
]

function fmt(n: number) {
  if (!isFinite(n)) return '—'
  return Math.round(n).toLocaleString('ko-KR')
}

export function CalorieCalculator() {
  const [sex, setSex] = useState<Sex>('male')
  const [weightKg, setWeightKg] = useState(70)
  const [heightCm, setHeightCm] = useState(175)
  const [age, setAge] = useState(25)
  const [activityId, setActivityId] = useState(ACTIVITY_LEVELS[1].id)

  const activity = ACTIVITY_LEVELS.find((a) => a.id === activityId) ?? ACTIVITY_LEVELS[1]

  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  const tdee = bmr * activity.multiplier

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        Mifflin-St Jeor 공식으로 기초대사량(BMR)을, 활동 수준 계수를 곱해 일일 유지 칼로리(TDEE)를
        계산합니다. 표준 공식 기반 추정치이며 체성분·유전적 차이에 따라 실제 값과 다를 수 있습니다.
      </div>

      <section className="rounded-md border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-muted-foreground">성별</span>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="rounded border border-border bg-transparent px-2 py-1.5 text-[12px]"
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-muted-foreground">나이</span>
            <input
              type="number"
              min={1}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="rounded border border-border bg-transparent px-2 py-1.5 font-mono text-[12px]"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-muted-foreground">체중 (kg)</span>
            <input
              type="number"
              min={1}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="rounded border border-border bg-transparent px-2 py-1.5 font-mono text-[12px]"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-muted-foreground">키 (cm)</span>
            <input
              type="number"
              min={1}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="rounded border border-border bg-transparent px-2 py-1.5 font-mono text-[12px]"
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1 text-[12px]">
            <span className="text-muted-foreground">활동 수준</span>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="rounded border border-border bg-transparent px-2 py-1.5 text-[12px]"
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <section className="rounded-md border border-border bg-card px-3 py-2.5">
          <span className="text-[11px] text-muted-foreground">기초대사량 (BMR)</span>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {fmt(bmr)}
            <span className="ml-1 text-[13px] text-muted-foreground">kcal</span>
          </p>
        </section>

        <section className="rounded-md border border-border bg-card px-3 py-2.5">
          <span className="text-[11px] text-muted-foreground">일일 유지 칼로리 (TDEE)</span>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {fmt(tdee)}
            <span className="ml-1 text-[13px] text-muted-foreground">kcal</span>
          </p>
        </section>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  UserAuthError,
  fetchWorkoutRoutines,
  createWorkoutRoutine,
  deleteWorkoutRoutine,
  requestWorkoutFeedback,
  type WorkoutExerciseInput,
  type WorkoutRoutine,
} from '@/lib/api'
import { useUserToken } from '@/lib/use-user-token'
import { DiscordLoginPrompt } from '@/components/discord-login-prompt'

const DAY_OPTIONS = [
  { id: 'MON', label: '월' },
  { id: 'TUE', label: '화' },
  { id: 'WED', label: '수' },
  { id: 'THU', label: '목' },
  { id: 'FRI', label: '금' },
  { id: 'SAT', label: '토' },
  { id: 'SUN', label: '일' },
]

const MUSCLE_GROUP_OPTIONS = [
  { id: 'CHEST', label: '가슴' },
  { id: 'BACK', label: '등' },
  { id: 'LEGS', label: '하체' },
  { id: 'SHOULDERS', label: '어깨' },
  { id: 'ARMS', label: '팔' },
  { id: 'CORE', label: '코어' },
]

// Tailwind v4는 클래스명을 정적으로 스캔하므로, 템플릿 리터럴로 조합하지 않고 완전한
// 문자열을 그대로 매핑해둔다.
const MUSCLE_GROUP_BADGE_CLASS: Record<string, string> = {
  CHEST: 'bg-muscle-chest/10 text-muscle-chest',
  BACK: 'bg-muscle-back/10 text-muscle-back',
  LEGS: 'bg-muscle-legs/10 text-muscle-legs',
  SHOULDERS: 'bg-muscle-shoulders/10 text-muscle-shoulders',
  ARMS: 'bg-muscle-arms/10 text-muscle-arms',
  CORE: 'bg-muscle-core/10 text-muscle-core',
}

const MUSCLE_GROUP_DOT_CLASS: Record<string, string> = {
  CHEST: 'bg-muscle-chest',
  BACK: 'bg-muscle-back',
  LEGS: 'bg-muscle-legs',
  SHOULDERS: 'bg-muscle-shoulders',
  ARMS: 'bg-muscle-arms',
  CORE: 'bg-muscle-core',
}

function MuscleGroupBadge({ groupId }: { groupId: string }) {
  const label = MUSCLE_GROUP_OPTIONS.find((g) => g.id === groupId)?.label ?? groupId
  const badgeClass = MUSCLE_GROUP_BADGE_CLASS[groupId] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${badgeClass}`}>
      {label}
    </span>
  )
}

function WeekMuscleGrid({ exercises }: { exercises: WorkoutRoutine['exercises'] }) {
  const groupsPresent = MUSCLE_GROUP_OPTIONS.filter((g) => exercises.some((ex) => ex.muscleGroup === g.id))
  if (groupsPresent.length === 0) return null

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="px-2 py-1.5 text-left font-medium">근육군</th>
            {DAY_OPTIONS.map((d) => (
              <th key={d.id} className="px-1.5 py-1.5 text-center font-medium">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupsPresent.map((group) => (
            <tr key={group.id} className="border-t border-border/60">
              <td className="px-2 py-1.5">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className={`size-1.5 shrink-0 rounded-full ${MUSCLE_GROUP_DOT_CLASS[group.id]}`} />
                  {group.label}
                </span>
              </td>
              {DAY_OPTIONS.map((d) => {
                const trained = exercises.some((ex) => ex.muscleGroup === group.id && ex.dayOfWeek === d.id)
                return (
                  <td key={d.id} className="px-1.5 py-1.5">
                    <span
                      className={`mx-auto block size-2.5 rounded-full ${
                        trained ? MUSCLE_GROUP_DOT_CLASS[group.id] : 'bg-border'
                      }`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

let nextRowId = 1

type ExerciseRow = WorkoutExerciseInput & { rowId: number }

function emptyRow(): ExerciseRow {
  return {
    rowId: nextRowId++,
    dayOfWeek: 'MON',
    muscleGroup: 'CHEST',
    exerciseName: '',
    sets: 3,
    reps: 10,
    weightKg: null,
  }
}

export function WorkoutView() {
  const { token, ready: tokenReady, loginError, clearToken } = useUserToken()

  const [routines, setRoutines] = useState<WorkoutRoutine[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<ExerciseRow[]>([emptyRow()])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [feedbackLoadingId, setFeedbackLoadingId] = useState<number | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  function handleAuthError() {
    clearToken('로그인이 만료됐습니다. 다시 로그인해주세요.')
  }

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchWorkoutRoutines(token)
      .then((data) => {
        setRoutines(data)
        setError(null)
      })
      .catch((e) => {
        if (e instanceof UserAuthError) {
          handleAuthError()
          return
        }
        setError('루틴 정보를 불러오지 못했습니다')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function updateRow(rowId: number, patch: Partial<ExerciseRow>) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(rowId: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev))
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!title.trim()) {
      setSubmitError('루틴 이름을 입력해주세요')
      return
    }
    const exercises = rows.filter((r) => r.exerciseName.trim())
    if (exercises.length === 0) {
      setSubmitError('운동을 하나 이상 입력해주세요')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = await createWorkoutRoutine(token, {
        title: title.trim(),
        exercises: exercises.map(({ rowId: _rowId, ...rest }) => rest),
      })
      setRoutines((prev) => [created, ...(prev ?? [])])
      setTitle('')
      setRows([emptyRow()])
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setSubmitError(e instanceof Error ? e.message : '루틴 저장에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!token) return
    try {
      await deleteWorkoutRoutine(token, id)
      setRoutines((prev) => (prev ?? []).filter((r) => r.id !== id))
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
      }
    }
  }

  async function handleFeedback(id: number) {
    if (!token) return
    setFeedbackLoadingId(id)
    setFeedbackError(null)
    try {
      const updated = await requestWorkoutFeedback(token, id)
      setRoutines((prev) => (prev ?? []).map((r) => (r.id === id ? updated : r)))
    } catch (e) {
      if (e instanceof UserAuthError) {
        handleAuthError()
        return
      }
      setFeedbackError(e instanceof Error ? e.message : 'AI 피드백 요청에 실패했습니다')
    } finally {
      setFeedbackLoadingId(null)
    }
  }

  if (!tokenReady) {
    return <p className="text-[14px] text-muted-foreground">불러오는 중...</p>
  }

  if (!token) {
    return (
      <DiscordLoginPrompt
        error={loginError}
        description="디스코드로 로그인해서 운동 루틴을 저장하면, 근육군 분배와 휴식일이 적절한지 AI 피드백을 받을 수 있어요."
      />
    )
  }

  if (loading) {
    return <p className="text-[14px] text-muted-foreground">불러오는 중...</p>
  }

  if (error) {
    return (
      <div className="rounded-md border border-down/30 bg-down/10 px-3.5 py-2.5 text-[14px] text-down">{error}</div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-card px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
        요일별 운동을 입력해서 루틴을 저장하면, 근육군 분배·휴식일 간격·반복 구성이 적절한지 AI가
        피드백해줍니다. 의학적 조언이 아니라 일반적인 운동 가이드라인 기준의 의견입니다.
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3.5"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[12.5px] text-muted-foreground">루틴 이름</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 주 3회 전신 루틴"
            className="h-10 rounded-sm border border-border bg-background px-2 text-[14px] outline-none focus:border-primary"
          />
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="px-2 py-1.5 text-left font-medium">요일</th>
                <th className="px-2 py-1.5 text-left font-medium">근육군</th>
                <th className="px-2 py-1.5 text-left font-medium">운동명</th>
                <th className="px-2 py-1.5 text-right font-medium">세트</th>
                <th className="px-2 py-1.5 text-right font-medium">횟수</th>
                <th className="px-2 py-1.5 text-right font-medium">무게(kg)</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowId} className="border-t border-border/60">
                  <td className="px-2 py-1.5">
                    <select
                      value={row.dayOfWeek}
                      onChange={(e) => updateRow(row.rowId, { dayOfWeek: e.target.value })}
                      className="bg-transparent text-[12px] outline-none"
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={row.muscleGroup}
                      onChange={(e) => updateRow(row.rowId, { muscleGroup: e.target.value })}
                      className="bg-transparent text-[12px] outline-none"
                    >
                      {MUSCLE_GROUP_OPTIONS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={row.exerciseName}
                      onChange={(e) => updateRow(row.rowId, { exerciseName: e.target.value })}
                      placeholder="예: 벤치프레스"
                      className="w-full bg-transparent text-[12px] outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min={1}
                      value={row.sets}
                      onChange={(e) => updateRow(row.rowId, { sets: Number(e.target.value) })}
                      className="w-12 bg-transparent text-right font-mono text-[12px] outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min={1}
                      value={row.reps}
                      onChange={(e) => updateRow(row.rowId, { reps: Number(e.target.value) })}
                      className="w-12 bg-transparent text-right font-mono text-[12px] outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      value={row.weightKg ?? ''}
                      onChange={(e) =>
                        updateRow(row.rowId, { weightKg: e.target.value ? Number(e.target.value) : null })
                      }
                      placeholder="맨몸"
                      className="w-16 bg-transparent text-right font-mono text-[12px] outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row.rowId)}
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
            <button type="button" onClick={addRow} className="text-[11px] text-primary hover:underline">
              + 운동 추가
            </button>
          </div>
        </div>

        {submitError && <p className="text-[12.5px] text-down">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="h-10 self-start rounded-sm bg-primary px-3 text-[14px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? '저장 중...' : '루틴 저장'}
        </button>
      </form>

      {feedbackError && <p className="text-[12.5px] text-down">{feedbackError}</p>}

      <div className="flex flex-col gap-3">
        {(routines ?? []).map((routine) => (
          <section key={routine.id} className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">{routine.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFeedback(routine.id)}
                  disabled={feedbackLoadingId === routine.id}
                  className="h-8 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
                >
                  {feedbackLoadingId === routine.id ? 'AI 피드백 받는 중...' : 'AI 피드백 받기'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(routine.id)}
                  className="text-[11px] text-down hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>

            <WeekMuscleGrid exercises={routine.exercises} />

            <ul className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
              {routine.exercises.map((ex) => {
                const dayLabel = DAY_OPTIONS.find((d) => d.id === ex.dayOfWeek)?.label ?? ex.dayOfWeek
                return (
                  <li key={ex.id} className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">{dayLabel}요일</span>
                    <MuscleGroupBadge groupId={ex.muscleGroup} />
                    <span className="font-mono tabular-nums">
                      {ex.exerciseName} {ex.sets}세트 x {ex.reps}회
                      {ex.weightKg ? ` (${ex.weightKg}kg)` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>

            {routine.lastFeedback && (
              <div className="rounded-md border border-primary/30 bg-primary/5 px-3.5 py-3">
                <p className="mb-1 text-[12px] font-medium text-primary">AI 피드백</p>
                <p className="whitespace-pre-line text-[14.5px] leading-relaxed">{routine.lastFeedback}</p>
              </div>
            )}
          </section>
        ))}

        {routines && routines.length === 0 && (
          <div className="rounded-md border border-border bg-card px-4 py-6">
            <p className="text-[14px] text-muted-foreground">아직 저장된 루틴이 없습니다. 위에서 루틴을 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { AdminAuthError, fetchWorkoutKnowledge, updateWorkoutKnowledge } from '@/lib/api'

export function WorkoutKnowledgeAdmin({
  token,
  onAuthError,
}: {
  token: string
  onAuthError: () => void
}) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchWorkoutKnowledge(token)
      .then((data) => {
        setContent(data)
        setError(null)
      })
      .catch((e) => {
        if (e instanceof AdminAuthError) {
          onAuthError()
          return
        }
        setError('불러오지 못했습니다')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await updateWorkoutKnowledge(token, content)
      setContent(updated)
      setSaved(true)
    } catch (e) {
      if (e instanceof AdminAuthError) {
        onAuthError()
        return
      }
      setError('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-[12px] text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        운동 루틴 AI 피드백 시 함께 참고할 배경지식입니다. 점진적 과부하, 주간 근육군 분배, 최소
        휴식일 같은 일반적인 운동 가이드라인을 적어주세요. 모델이 알아서 아는 척하지 않도록, 여기
        적힌 내용만 근거로 피드백합니다.
      </div>

      {error && (
        <div className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">
          {error}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setSaved(false)
        }}
        rows={10}
        placeholder="예: 같은 근육군은 48시간 이상 휴식을 두고, 근비대 목적이면 세트당 8~12회..."
        className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-primary"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-8 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {saved && <span className="text-[11px] text-up">저장됨</span>}
      </div>
    </div>
  )
}

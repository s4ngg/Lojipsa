'use client'

import { useEffect, useState } from 'react'
import { AdminAuthError, fetchDirectionKnowledge, updateDirectionKnowledge } from '@/lib/api'

export function DirectionKnowledgeAdmin({
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
    fetchDirectionKnowledge(token)
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
      const updated = await updateDirectionKnowledge(token, content)
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
        "원정대 방향성" AI 추천 시 골드 수치와 함께 참고할 배경지식입니다. 낙원 단계업, 할모시
        보석처럼 레이드 거래 가능 골드 수치만으로는 안 잡히는 게임 시스템 정보를 적어주세요.
        패치로 내용이 바뀌면 여기서 직접 수정하면 됩니다.
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
        placeholder="예: 아이템 레벨 1730부터 낙원 단계가 업그레이드되어..."
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

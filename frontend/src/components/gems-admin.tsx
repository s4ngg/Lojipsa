'use client'

import { useEffect, useState } from 'react'
import {
  AdminAuthError,
  createGem,
  deleteGem,
  fetchAdminGems,
  updateGem,
  type TrackedGem,
  type TrackedGemInput,
} from '@/lib/api'

const emptyForm: TrackedGemInput = {
  itemName: '',
}

function toInput(gem: TrackedGem): TrackedGemInput {
  const { id: _id, ...rest } = gem
  return rest
}

export function GemsAdmin({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [gems, setGems] = useState<TrackedGem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newForm, setNewForm] = useState<TrackedGemInput>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await fetchAdminGems(token)
      setGems(data)
      setError(null)
    } catch (e) {
      if (e instanceof AdminAuthError) {
        onAuthError()
        return
      }
      setError('목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleUpdate(id: number, input: TrackedGemInput) {
    try {
      await updateGem(token, id, input)
      await load()
    } catch (e) {
      if (e instanceof AdminAuthError) onAuthError()
      else setError('수정 실패')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteGem(token, id)
      setGems((prev) => prev.filter((g) => g.id !== id))
    } catch (e) {
      if (e instanceof AdminAuthError) onAuthError()
      else setError('삭제 실패')
    }
  }

  async function handleCreate() {
    if (!newForm.itemName.trim()) {
      setError('아이템명은 비워둘 수 없습니다')
      return
    }
    setSaving(true)
    try {
      await createGem(token, newForm)
      setNewForm(emptyForm)
      await load()
    } catch (e) {
      if (e instanceof AdminAuthError) onAuthError()
      else setError('추가 실패')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-[12px] text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">
          {error}
        </div>
      )}

      <div className="rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        경매장 검색에 쓰이는 아이템명을 정확히 입력해주세요 (예: "10레벨 겁화의 보석"). 여기서
        추가한 항목이 공개 "보석 시세" 탭에 현재 최저 즉시구매가로 표시됩니다.
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[11px] text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">아이템명</th>
              <th className="px-3 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {gems.map((g) => (
              <GemRow key={g.id} gem={g} onSave={handleUpdate} onDelete={handleDelete} />
            ))}
            <tr className="border-t border-border/60 bg-secondary/30">
              <td className="px-3 py-1.5">
                <input
                  value={newForm.itemName}
                  onChange={(e) => setNewForm({ itemName: e.target.value })}
                  placeholder="예: 10레벨 겁화의 보석"
                  className="w-full min-w-[180px] bg-transparent text-[12px] outline-none"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving}
                  className="text-[11px] text-primary hover:underline disabled:opacity-50"
                >
                  추가
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}

function GemRow({
  gem,
  onSave,
  onDelete,
}: {
  gem: TrackedGem
  onSave: (id: number, input: TrackedGemInput) => void
  onDelete: (id: number) => void
}) {
  const [form, setForm] = useState<TrackedGemInput>(() => toInput(gem))
  const dirty = JSON.stringify(form) !== JSON.stringify(toInput(gem))

  return (
    <tr className="border-t border-border/60">
      <td className="px-3 py-1.5">
        <input
          value={form.itemName}
          onChange={(e) => setForm({ itemName: e.target.value })}
          className="w-full min-w-[180px] bg-transparent text-[12px] outline-none"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-1.5 text-right">
        {dirty && (
          <button
            type="button"
            onClick={() => onSave(gem.id, form)}
            className="mr-2 text-[11px] text-primary hover:underline"
          >
            저장
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(gem.id)}
          className="text-[11px] text-down hover:underline"
        >
          삭제
        </button>
      </td>
    </tr>
  )
}

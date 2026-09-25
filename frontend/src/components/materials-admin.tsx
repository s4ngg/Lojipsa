'use client'

import { useEffect, useState } from 'react'
import {
  AdminAuthError,
  createMaterial,
  deleteMaterial,
  fetchAdminMaterials,
  updateMaterial,
  type TrackedMaterial,
  type TrackedMaterialInput,
} from '@/lib/api'

const emptyForm: TrackedMaterialInput = {
  itemName: '',
  itemCode: 0,
}

function toInput(material: TrackedMaterial): TrackedMaterialInput {
  const { id: _id, ...rest } = material
  return rest
}

export function MaterialsAdmin({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [materials, setMaterials] = useState<TrackedMaterial[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newForm, setNewForm] = useState<TrackedMaterialInput>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await fetchAdminMaterials(token)
      setMaterials(data)
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

  async function handleUpdate(id: number, input: TrackedMaterialInput) {
    try {
      await updateMaterial(token, id, input)
      await load()
    } catch (e) {
      if (e instanceof AdminAuthError) onAuthError()
      else setError('수정 실패')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMaterial(token, id)
      setMaterials((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      if (e instanceof AdminAuthError) onAuthError()
      else setError('삭제 실패')
    }
  }

  async function handleCreate() {
    if (!newForm.itemName || !newForm.itemCode) {
      setError('아이템명과 아이템 코드는 비워둘 수 없습니다')
      return
    }
    setSaving(true)
    try {
      await createMaterial(token, newForm)
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
        여기서 추가한 아이템이 공개 "재료 시세" 탭에 실제 시세(오늘 vs 1주일 전)로 표시됩니다.
        아이템 코드는 로스트아크 거래소에서 직접 확인해서 정확히 입력해주세요.
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[11px] text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">아이템명</th>
              <th className="w-32 px-3 py-1.5 text-right font-medium">아이템 코드</th>
              <th className="px-3 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <MaterialRow key={m.id} material={m} onSave={handleUpdate} onDelete={handleDelete} />
            ))}
            <tr className="border-t border-border/60 bg-secondary/30">
              <td className="px-3 py-1.5">
                <input
                  value={newForm.itemName}
                  onChange={(e) => setNewForm((f) => ({ ...f, itemName: e.target.value }))}
                  placeholder="새 아이템명"
                  className="w-full min-w-[130px] bg-transparent text-[12px] outline-none"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <input
                  type="number"
                  value={newForm.itemCode || ''}
                  onChange={(e) => setNewForm((f) => ({ ...f, itemCode: Number(e.target.value) }))}
                  placeholder="아이템 코드"
                  className="w-28 bg-transparent text-right font-mono text-[12px] outline-none"
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

function MaterialRow({
  material,
  onSave,
  onDelete,
}: {
  material: TrackedMaterial
  onSave: (id: number, input: TrackedMaterialInput) => void
  onDelete: (id: number) => void
}) {
  const [form, setForm] = useState<TrackedMaterialInput>(() => toInput(material))
  const dirty = JSON.stringify(form) !== JSON.stringify(toInput(material))

  return (
    <tr className="border-t border-border/60">
      <td className="px-3 py-1.5">
        <input
          value={form.itemName}
          onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
          className="w-full min-w-[130px] bg-transparent text-[12px] outline-none"
        />
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          type="number"
          value={form.itemCode}
          onChange={(e) => setForm((f) => ({ ...f, itemCode: Number(e.target.value) }))}
          className="w-28 bg-transparent text-right font-mono text-[12px] outline-none"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-1.5 text-right">
        {dirty && (
          <button
            type="button"
            onClick={() => onSave(material.id, form)}
            className="mr-2 text-[11px] text-primary hover:underline"
          >
            저장
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(material.id)}
          className="text-[11px] text-down hover:underline"
        >
          삭제
        </button>
      </td>
    </tr>
  )
}

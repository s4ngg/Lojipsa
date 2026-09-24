'use client'

import { useEffect, useState } from 'react'
import {
  AdminAuthError,
  createRaidReward,
  deleteRaidReward,
  fetchAdminRaidRewards,
  updateRaidReward,
  type RaidReward,
  type RaidRewardInput,
} from '@/lib/api'

const emptyForm: RaidRewardInput = {
  raidName: '',
  difficulty: '',
  minItemLevel: 0,
  boundGold: 0,
  tradableGold: 0,
  weeklyLimitCount: 1,
}

// RaidReward -> RaidRewardInput로 id를 명시적으로 떼어낸다.
// (구조적 타이핑 때문에 그냥 state에 reward를 넣으면 id가 몰래 딸려 들어와서
//  변경 여부 비교가 항상 어긋나는 문제가 있었다 — TROUBLESHOOTING 참고)
function toInput(reward: RaidReward): RaidRewardInput {
  const { id: _id, ...rest } = reward
  return rest
}

export function RaidRewardsAdmin({
  token,
  onAuthError,
}: {
  token: string
  onAuthError: () => void
}) {
  const [rewards, setRewards] = useState<RaidReward[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newForm, setNewForm] = useState<RaidRewardInput>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await fetchAdminRaidRewards(token)
      setRewards(data)
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

  async function handleUpdate(id: number, input: RaidRewardInput) {
    try {
      await updateRaidReward(token, id, input)
      await load()
    } catch (e) {
      if (e instanceof AdminAuthError) onAuthError()
      else setError('수정 실패')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteRaidReward(token, id)
      setRewards((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      if (e instanceof AdminAuthError) onAuthError()
      else setError('삭제 실패')
    }
  }

  async function handleCreate() {
    if (!newForm.raidName || !newForm.difficulty) {
      setError('레이드명과 난이도는 비워둘 수 없습니다')
      return
    }
    setSaving(true)
    try {
      await createRaidReward(token, newForm)
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

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[11px] text-muted-foreground">
              <th className="w-40 px-3 py-1.5 text-left font-medium">레이드</th>
              <th className="w-16 px-3 py-1.5 text-left font-medium">난이도</th>
              <th className="px-3 py-1.5 text-right font-medium">최소레벨</th>
              <th className="px-3 py-1.5 text-right font-medium">귀속골드</th>
              <th className="px-3 py-1.5 text-right font-medium">거래가능골드</th>
              <th className="px-3 py-1.5 text-right font-medium">주간제한</th>
              <th className="px-3 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rewards.map((r) => (
              <RaidRewardRow key={r.id} reward={r} onSave={handleUpdate} onDelete={handleDelete} />
            ))}
            <tr className="border-t border-border/60 bg-secondary/30">
              <td className="px-3 py-1.5">
                <input
                  value={newForm.raidName}
                  onChange={(e) => setNewForm((f) => ({ ...f, raidName: e.target.value }))}
                  placeholder="새 레이드명"
                  className="w-full min-w-[130px] bg-transparent text-[12px] outline-none"
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  value={newForm.difficulty}
                  onChange={(e) => setNewForm((f) => ({ ...f, difficulty: e.target.value }))}
                  placeholder="난이도"
                  className="w-full min-w-[50px] bg-transparent text-[12px] outline-none"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <input
                  type="number"
                  value={newForm.minItemLevel}
                  onChange={(e) => setNewForm((f) => ({ ...f, minItemLevel: Number(e.target.value) }))}
                  className="w-16 bg-transparent text-right font-mono text-[12px] outline-none"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <input
                  type="number"
                  value={newForm.boundGold}
                  onChange={(e) => setNewForm((f) => ({ ...f, boundGold: Number(e.target.value) }))}
                  className="w-20 bg-transparent text-right font-mono text-[12px] outline-none"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <input
                  type="number"
                  value={newForm.tradableGold}
                  onChange={(e) => setNewForm((f) => ({ ...f, tradableGold: Number(e.target.value) }))}
                  className="w-20 bg-transparent text-right font-mono text-[12px] outline-none"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <input
                  type="number"
                  value={newForm.weeklyLimitCount}
                  onChange={(e) => setNewForm((f) => ({ ...f, weeklyLimitCount: Number(e.target.value) }))}
                  className="w-12 bg-transparent text-right font-mono text-[12px] outline-none"
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

function RaidRewardRow({
  reward,
  onSave,
  onDelete,
}: {
  reward: RaidReward
  onSave: (id: number, input: RaidRewardInput) => void
  onDelete: (id: number) => void
}) {
  const [form, setForm] = useState<RaidRewardInput>(() => toInput(reward))
  const dirty = JSON.stringify(form) !== JSON.stringify(toInput(reward))

  return (
    <tr className="border-t border-border/60">
      <td className="px-3 py-1.5">
        <input
          value={form.raidName}
          onChange={(e) => setForm((f) => ({ ...f, raidName: e.target.value }))}
          className="w-full min-w-[130px] bg-transparent text-[12px] outline-none"
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          value={form.difficulty}
          onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
          className="w-full min-w-[50px] bg-transparent text-[12px] outline-none"
        />
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          type="number"
          value={form.minItemLevel}
          onChange={(e) => setForm((f) => ({ ...f, minItemLevel: Number(e.target.value) }))}
          className="w-16 bg-transparent text-right font-mono text-[12px] outline-none"
        />
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          type="number"
          value={form.boundGold}
          onChange={(e) => setForm((f) => ({ ...f, boundGold: Number(e.target.value) }))}
          className="w-20 bg-transparent text-right font-mono text-[12px] outline-none"
        />
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          type="number"
          value={form.tradableGold}
          onChange={(e) => setForm((f) => ({ ...f, tradableGold: Number(e.target.value) }))}
          className="w-20 bg-transparent text-right font-mono text-[12px] outline-none"
        />
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          type="number"
          value={form.weeklyLimitCount}
          onChange={(e) => setForm((f) => ({ ...f, weeklyLimitCount: Number(e.target.value) }))}
          className="w-12 bg-transparent text-right font-mono text-[12px] outline-none"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-1.5 text-right">
        {dirty && (
          <button
            type="button"
            onClick={() => onSave(reward.id, form)}
            className="mr-2 text-[11px] text-primary hover:underline"
          >
            저장
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(reward.id)}
          className="text-[11px] text-down hover:underline"
        >
          삭제
        </button>
      </td>
    </tr>
  )
}

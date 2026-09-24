export type WatchedItem = {
  name: string
  price: number
  changePercent: number | null
}

export type ActivityLogEntry = {
  at: string
  message: string
}

export type AgentStatus = {
  agent: string
  status: string
  lastCheckedAt: string | null
  checkIntervalSeconds: number
  watchedItems: WatchedItem[]
  recentActivity: ActivityLogEntry[]
}

export type PublicStatus = {
  agent: string
  status: string
}

export type EventStatus = {
  watchedCategories: string[]
  reminderMinutesBefore: number
  recentActivity: ActivityLogEntry[]
}

export type NoticeStatus = {
  watchedTypes: string[]
  recentActivity: ActivityLogEntry[]
}

export type RaidReward = {
  id: number
  raidName: string
  difficulty: string
  minItemLevel: number
  boundGold: number
  tradableGold: number
  weeklyLimitCount: number
}

export type RaidRewardInput = Omit<RaidReward, 'id'>

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

export async function fetchPublicStatus(): Promise<PublicStatus> {
  const res = await fetch(`${API_BASE_URL}/api/public/status`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`상태 조회 실패: ${res.status}`)
  }
  return res.json()
}

export class AdminAuthError extends Error {}

export async function fetchAdminStatus(token: string): Promise<AgentStatus> {
  const res = await fetch(`${API_BASE_URL}/api/admin/status`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`상태 조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function fetchEventStatus(token: string): Promise<EventStatus> {
  const res = await fetch(`${API_BASE_URL}/api/admin/events/status`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`상태 조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function fetchNoticeStatus(token: string): Promise<NoticeStatus> {
  const res = await fetch(`${API_BASE_URL}/api/admin/notices/status`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`상태 조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function fetchRaidRewards(): Promise<RaidReward[]> {
  const res = await fetch(`${API_BASE_URL}/api/raid-rewards`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function fetchAdminRaidRewards(token: string): Promise<RaidReward[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/raid-rewards`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function createRaidReward(token: string, input: RaidRewardInput): Promise<RaidReward> {
  const res = await fetch(`${API_BASE_URL}/api/admin/raid-rewards`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`생성 실패: ${res.status}`)
  }
  return res.json()
}

export async function updateRaidReward(
  token: string,
  id: number,
  input: RaidRewardInput,
): Promise<RaidReward> {
  const res = await fetch(`${API_BASE_URL}/api/admin/raid-rewards/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`수정 실패: ${res.status}`)
  }
  return res.json()
}

export async function deleteRaidReward(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/raid-rewards/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok && res.status !== 404) {
    throw new Error(`삭제 실패: ${res.status}`)
  }
}

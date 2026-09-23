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

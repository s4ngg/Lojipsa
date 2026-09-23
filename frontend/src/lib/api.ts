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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

export async function fetchAgentStatus(): Promise<AgentStatus> {
  const res = await fetch(`${API_BASE_URL}/api/status`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`상태 조회 실패: ${res.status}`)
  }
  return res.json()
}

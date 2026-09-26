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

export type TrackedMaterial = {
  id: number
  itemName: string
  itemCode: number
}

export type TrackedMaterialInput = Omit<TrackedMaterial, 'id'>

export type MaterialPriceComparison = {
  id: number
  itemName: string
  itemCode: number
  currentPrice: number
  currentDate: string
  weekAgoPrice: number | null
  weekAgoDate: string | null
  changePercent: number | null
}

export type TrackedGem = {
  id: number
  itemName: string
}

export type TrackedGemInput = Omit<TrackedGem, 'id'>

export type GemPriceSnapshot = {
  id: number
  itemName: string
  lowestBuyPrice: number | null
  listingCount: number
  iconUrl: string | null
}

export type HomeworkSetupMode = 'AUTO_BOUND_AND_TRADABLE' | 'AUTO_TRADABLE_ONLY' | 'MANUAL'

export type HomeworkItem = {
  id: number
  characterId: number
  characterName: string
  serverName: string
  raidName: string
  difficulty: string
  boundGold: number
  tradableGold: number
  completedThisWeek: boolean
}

export type HomeworkSetupInput = {
  characterId: number
  mode: HomeworkSetupMode
  manualSelections?: { raidName: string; difficulty: string }[]
}

export type DirectionInput = {
  characterId: number
  honingCostGold: number
  targetItemLevel?: number
}

export type DirectionResult = {
  characterName: string
  currentItemLevel: number
  currentWeeklyTradableGold: number
  targetItemLevel: number
  targetWeeklyTradableGold: number
  weeklyGoldGain: number
  honingCostGold: number
  recommendation: string
}

export type RosterCharacter = {
  id: number
  serverName: string
  characterName: string
  characterClassName: string
  itemAvgLevel: number
  lastRefreshedAt: string
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

export async function fetchMaterialPrices(): Promise<MaterialPriceComparison[]> {
  const res = await fetch(`${API_BASE_URL}/api/materials`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function fetchAdminMaterials(token: string): Promise<TrackedMaterial[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/materials`, {
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

export async function createMaterial(token: string, input: TrackedMaterialInput): Promise<TrackedMaterial> {
  const res = await fetch(`${API_BASE_URL}/api/admin/materials`, {
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

export async function updateMaterial(
  token: string,
  id: number,
  input: TrackedMaterialInput,
): Promise<TrackedMaterial> {
  const res = await fetch(`${API_BASE_URL}/api/admin/materials/${id}`, {
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

export async function deleteMaterial(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/materials/${id}`, {
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

export async function fetchGemPrices(): Promise<GemPriceSnapshot[]> {
  const res = await fetch(`${API_BASE_URL}/api/gems`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function fetchAdminGems(token: string): Promise<TrackedGem[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/gems`, {
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

export async function createGem(token: string, input: TrackedGemInput): Promise<TrackedGem> {
  const res = await fetch(`${API_BASE_URL}/api/admin/gems`, {
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

export async function updateGem(token: string, id: number, input: TrackedGemInput): Promise<TrackedGem> {
  const res = await fetch(`${API_BASE_URL}/api/admin/gems/${id}`, {
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

export async function deleteGem(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/gems/${id}`, {
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

export async function fetchHomework(token: string): Promise<HomeworkItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/me/homework`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function setupHomework(token: string, input: HomeworkSetupInput): Promise<HomeworkItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/me/homework/setup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `설정 실패: ${res.status}`))
  }
  return res.json()
}

export async function toggleHomeworkItem(token: string, id: number): Promise<HomeworkItem> {
  const res = await fetch(`${API_BASE_URL}/api/me/homework/${id}/toggle`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`처리 실패: ${res.status}`)
  }
  return res.json()
}

export async function deleteHomeworkItem(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/me/homework/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok && res.status !== 404) {
    throw new Error(`삭제 실패: ${res.status}`)
  }
}

export async function requestDirectionRecommendation(
  token: string,
  input: DirectionInput,
): Promise<DirectionResult> {
  const res = await fetch(`${API_BASE_URL}/api/me/direction/recommend`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `추천 요청 실패: ${res.status}`))
  }
  return res.json()
}

export async function fetchDirectionKnowledge(token: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/admin/direction-knowledge`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`조회 실패: ${res.status}`)
  }
  const data = await res.json()
  return data.content ?? ''
}

export async function updateDirectionKnowledge(token: string, content: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/admin/direction-knowledge`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (res.status === 401) {
    throw new AdminAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`저장 실패: ${res.status}`)
  }
  const data = await res.json()
  return data.content ?? ''
}

export class UserAuthError extends Error {}

export function discordLoginUrl(): string {
  return `${API_BASE_URL}/api/auth/discord/login`
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') return body.error
  } catch {
    // 본문이 없거나 JSON이 아니면 기본 메시지를 쓴다.
  }
  return fallback
}

export async function fetchMyRoster(token: string): Promise<RosterCharacter[]> {
  const res = await fetch(`${API_BASE_URL}/api/me/roster`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(`조회 실패: ${res.status}`)
  }
  return res.json()
}

export async function registerRepresentativeCharacter(
  token: string,
  representativeCharacterName: string,
): Promise<RosterCharacter[]> {
  const res = await fetch(`${API_BASE_URL}/api/me/roster/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ representativeCharacterName }),
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `등록 실패: ${res.status}`))
  }
  return res.json()
}

export async function refreshMyRoster(token: string): Promise<RosterCharacter[]> {
  const res = await fetch(`${API_BASE_URL}/api/me/roster/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    throw new UserAuthError('인증 실패')
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `갱신 실패: ${res.status}`))
  }
  return res.json()
}
